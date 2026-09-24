import fs from "fs";
import path from "path";
import { MongoClient, Db as MongoDatabase } from "mongodb";
import { Pool as PgPool } from "pg";

export interface DBState {
  users: any[];
  products: any[];
  orders: any[];
  storage_bookings: any[];
  contracts: any[];
  disputes: any[];
  requirements: any[];
  lots: any[];
  verified_buyers: any[];
  invoices: any[];
  notifications: any[];
  payments: any[];
  fpo_collectives: any[];
}

export type DbProviderType = "mongodb" | "postgres" | "local";

export interface CloudDbStatus {
  provider: DbProviderType;
  connected: boolean;
  statusMessage: string;
  databaseName?: string;
  lastSyncedAt?: string;
  lastError?: string | null;
  counts: {
    users: number;
    products: number;
    orders: number;
    storage_bookings: number;
    contracts: number;
    disputes: number;
    requirements: number;
    lots: number;
    verified_buyers: number;
    fpo_collectives: number;
  };
}

class CloudDbManager {
  private provider: DbProviderType = "local";
  private isConnected: boolean = false;
  private statusMessage: string = "Running on local file storage";
  private databaseName?: string;
  private lastSyncedAt?: string;
  private lastError: string | null = null;

  // MongoDB client & db reference
  private mongoClient: MongoClient | null = null;
  private mongoDb: MongoDatabase | null = null;

  // PostgreSQL pool reference
  private pgPool: PgPool | null = null;

  // Debounced save timer
  private saveTimeout: NodeJS.Timeout | null = null;
  private pendingState: DBState | null = null;
  private isSaving: boolean = false;

  private projectRoot = process.cwd();
  private dataFile = path.join(process.cwd(), "data", "app_state.json");
  private usersFile = path.join(process.cwd(), "users.json");
  private dataUsersFile = path.join(process.cwd(), "data", "users.json");

  /**
   * Initializes the cloud database connection.
   * Priority:
   * 1. MONGODB_URI (MongoDB Atlas - recommended for JSON document model)
   * 2. DATABASE_URL (PostgreSQL - Supabase / Neon / Render Postgres)
   * 3. Local filesystem fallback (data/app_state.json)
   */
  async init(initialLocalState: DBState): Promise<DBState> {
    const mongoUri = process.env.MONGODB_URI;
    const postgresUri = process.env.DATABASE_URL;

    if (mongoUri && mongoUri.trim().startsWith("mongodb")) {
      try {
        console.log("\n======================================================");
        console.log("🌐 [FarmiQ CloudDB] Detected MONGODB_URI. Connecting to MongoDB Atlas...");
        const client = new MongoClient(mongoUri, {
          serverSelectionTimeoutMS: 8000,
          connectTimeoutMS: 10000
        });

        await client.connect();
        this.mongoClient = client;

        // Use database from URI or default to "farmiq"
        const dbName = client.db().databaseName || "farmiq";
        this.mongoDb = client.db(dbName);
        this.databaseName = dbName;
        this.provider = "mongodb";
        this.isConnected = true;
        this.statusMessage = `Connected to MongoDB Atlas database: "${dbName}"`;
        this.lastError = null;

        console.log(`✅ [FarmiQ CloudDB] Connected to MongoDB Atlas (${dbName})!`);

        // Check if state exists in MongoDB
        const stateCol = this.mongoDb.collection("farmiq_state");
        const existingDoc = await stateCol.findOne({ _id: "current_state" as any });

        if (existingDoc && existingDoc.data) {
          console.log(`📦 [FarmiQ CloudDB] Loaded existing persistent data from MongoDB Atlas.`);
          const loaded = existingDoc.data as DBState;
          let needsBackfill = false;
          if (initialLocalState.users && initialLocalState.users.length > 0) {
            if (!loaded.users) loaded.users = [];
            const existingEmails = new Set(loaded.users.map((u: any) => (u.email || '').toLowerCase()));
            const existingIds = new Set(loaded.users.map((u: any) => Number(u.id)));
            for (const u of initialLocalState.users) {
              if (u.email && !existingEmails.has(u.email.toLowerCase()) && !existingIds.has(Number(u.id))) {
                loaded.users.push(u);
                needsBackfill = true;
              }
            }
          }
          if ((!loaded.products || loaded.products.length === 0) && initialLocalState.products?.length) {
            loaded.products = initialLocalState.products;
            needsBackfill = true;
          }
          if ((!loaded.lots || loaded.lots.length === 0) && initialLocalState.lots?.length) {
            loaded.lots = initialLocalState.lots;
            needsBackfill = true;
          }
          if (needsBackfill) {
            stateCol.updateOne(
              { _id: "current_state" as any },
              { $set: { data: loaded, updated_at: new Date().toISOString() } }
            ).catch(() => {});
          }
          this.lastSyncedAt = new Date().toISOString();
          this.syncLocalFiles(loaded);
          return loaded;
        } else {
          console.log(`✨ [FarmiQ CloudDB] Empty cloud database detected. Migrating local state to MongoDB Atlas...`);
          await stateCol.updateOne(
            { _id: "current_state" as any },
            {
              $set: {
                _id: "current_state",
                data: initialLocalState,
                migrated_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            },
            { upsert: true }
          );

          // Also seed individual collections in background for Atlas GUI exploration
          this.syncMongoCollections(initialLocalState).catch(e =>
            console.warn("Non-fatal Mongo collection sync warning:", e.message)
          );

          this.lastSyncedAt = new Date().toISOString();
          console.log(`✅ [FarmiQ CloudDB] Initial migration complete! All local data is now preserved in MongoDB.`);
          return initialLocalState;
        }
      } catch (err: any) {
        console.error("❌ [FarmiQ CloudDB] MongoDB connection failed:", err.message);
        this.lastError = err.message;
        this.statusMessage = `MongoDB connection failed (${err.message}). Falling back to local storage.`;
        this.provider = "local";
        this.isConnected = false;
      }
    } else if (postgresUri && (postgresUri.startsWith("postgres://") || postgresUri.startsWith("postgresql://"))) {
      try {
        console.log("\n======================================================");
        console.log("🌐 [FarmiQ CloudDB] Detected DATABASE_URL. Connecting to PostgreSQL...");

        const pool = new PgPool({
          connectionString: postgresUri,
          ssl: postgresUri.includes("localhost") ? false : { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000
        });

        // Test connection
        const client = await pool.connect();
        client.release();

        this.pgPool = pool;
        this.provider = "postgres";
        this.isConnected = true;
        this.databaseName = "PostgreSQL";
        this.statusMessage = "Connected to PostgreSQL database";
        this.lastError = null;

        console.log(`✅ [FarmiQ CloudDB] Connected to PostgreSQL!`);

        // Ensure state table exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS farmiq_state_store (
            id VARCHAR(64) PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Check existing state
        const res = await pool.query(`SELECT data FROM farmiq_state_store WHERE id = 'current_state';`);

        if (res.rows.length > 0 && res.rows[0].data) {
          console.log(`📦 [FarmiQ CloudDB] Loaded existing persistent data from PostgreSQL.`);
          const loaded = res.rows[0].data as DBState;
          let needsBackfill = false;
          if (initialLocalState.users && initialLocalState.users.length > 0) {
            if (!loaded.users) loaded.users = [];
            const existingEmails = new Set(loaded.users.map((u: any) => (u.email || '').toLowerCase()));
            const existingIds = new Set(loaded.users.map((u: any) => Number(u.id)));
            for (const u of initialLocalState.users) {
              if (u.email && !existingEmails.has(u.email.toLowerCase()) && !existingIds.has(Number(u.id))) {
                loaded.users.push(u);
                needsBackfill = true;
              }
            }
          }
          if ((!loaded.products || loaded.products.length === 0) && initialLocalState.products?.length) {
            loaded.products = initialLocalState.products;
            needsBackfill = true;
          }
          if ((!loaded.lots || loaded.lots.length === 0) && initialLocalState.lots?.length) {
            loaded.lots = initialLocalState.lots;
            needsBackfill = true;
          }
          if (needsBackfill) {
            pool.query(
              `UPDATE farmiq_state_store SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = 'current_state';`,
              [JSON.stringify(loaded)]
            ).catch(() => {});
          }
          this.lastSyncedAt = new Date().toISOString();
          this.syncLocalFiles(loaded);
          return loaded;
        } else {
          console.log(`✨ [FarmiQ CloudDB] Empty PostgreSQL state detected. Migrating local state...`);
          await pool.query(
            `INSERT INTO farmiq_state_store (id, data, updated_at)
             VALUES ('current_state', $1, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at;`,
            [JSON.stringify(initialLocalState)]
          );
          this.lastSyncedAt = new Date().toISOString();
          console.log(`✅ [FarmiQ CloudDB] Initial migration complete! All local data is preserved in PostgreSQL.`);
          return initialLocalState;
        }
      } catch (err: any) {
        console.error("❌ [FarmiQ CloudDB] PostgreSQL connection failed:", err.message);
        this.lastError = err.message;
        this.statusMessage = `PostgreSQL connection failed (${err.message}). Falling back to local storage.`;
        this.provider = "local";
        this.isConnected = false;
      }
    }

    // Local file fallback
    console.log("\n======================================================");
    console.log("📁 [FarmiQ CloudDB] No MONGODB_URI or DATABASE_URL provided.");
    console.log("   Running in LOCAL mode with ./data/app_state.json.");
    console.log("   Tip: Set MONGODB_URI on Render to permanently persist data across redeploys.");
    console.log("======================================================\n");
    this.provider = "local";
    this.isConnected = true;
    this.statusMessage = "Running on local file storage (data/app_state.json)";
    return initialLocalState;
  }

  /**
   * Saves the state both to local filesystem cache and asynchronously to cloud DB.
   */
  save(state: DBState): void {
    // 1. Immediately sync to local disk cache
    this.syncLocalFiles(state);

    // 2. Queue debounced cloud save
    this.pendingState = state;
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.flushCloudSave();
    }, 400);
  }

  /**
   * Executes the cloud database persistence asynchronously.
   */
  async flushCloudSave(): Promise<void> {
    if (!this.pendingState || this.isSaving) return;
    const stateToSave = this.pendingState;
    this.pendingState = null;
    this.isSaving = true;

    try {
      if (this.provider === "mongodb" && this.mongoDb) {
        const stateCol = this.mongoDb.collection("farmiq_state");
        await stateCol.updateOne(
          { _id: "current_state" as any },
          {
            $set: {
              _id: "current_state",
              data: stateToSave,
              updated_at: new Date().toISOString()
            }
          },
          { upsert: true }
        );

        this.lastSyncedAt = new Date().toISOString();
        this.lastError = null;

        // Async sync collections for Atlas Explorer
        this.syncMongoCollections(stateToSave).catch(() => {});
      } else if (this.provider === "postgres" && this.pgPool) {
        await this.pgPool.query(
          `INSERT INTO farmiq_state_store (id, data, updated_at)
           VALUES ('current_state', $1, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at;`,
          [JSON.stringify(stateToSave)]
        );

        this.lastSyncedAt = new Date().toISOString();
        this.lastError = null;
      }
    } catch (err: any) {
      console.error("⚠️ [FarmiQ CloudDB] Error syncing state to cloud DB:", err.message);
      this.lastError = err.message;
    } finally {
      this.isSaving = false;
      // If another save was queued during writing, flush it
      if (this.pendingState) {
        this.flushCloudSave();
      }
    }
  }

  /**
   * Syncs MongoDB collections so MongoDB Atlas Data Explorer displays readable collections.
   */
  private async syncMongoCollections(state: DBState): Promise<void> {
    if (!this.mongoDb) return;
    const collectionsToSync: Array<keyof DBState> = [
      "users",
      "products",
      "orders",
      "storage_bookings",
      "contracts",
      "disputes",
      "requirements",
      "lots",
      "verified_buyers",
      "fpo_collectives"
    ];

    for (const key of collectionsToSync) {
      try {
        const items = state[key];
        if (Array.isArray(items)) {
          const col = this.mongoDb.collection(`farmiq_${key}`);
          // Replace or upsert documents
          if (items.length === 0) {
            await col.deleteMany({});
          } else {
            // Write each item with a clean identifier
            const bulkOps = items.map((item: any, idx: number) => {
              const filterId = item.id || item._id || `item_${idx}`;
              const doc = { ...item, _id: filterId };
              return {
                replaceOne: {
                  filter: { _id: filterId },
                  replacement: doc,
                  upsert: true
                }
              };
            });
            await col.bulkWrite(bulkOps, { ordered: false });
          }
        }
      } catch {
        // Individual collection sync is non-blocking
      }
    }
  }

  /**
   * Synchronizes state to the local container files for fast reading and local fallback.
   */
  private syncLocalFiles(state: DBState): void {
    try {
      fs.mkdirSync(path.join(this.projectRoot, "data"), { recursive: true });
      fs.writeFileSync(this.dataFile, JSON.stringify(state, null, 2), "utf-8");

      // Sync users.json directory file
      const list = state.users || [];
      const nonAdminUsers = list.filter(u => u.role !== "admin");

      const farmerUsers = nonAdminUsers
        .filter(u => u.role === "farmer")
        .map(u => ({
          id: u.id,
          role: "farmer",
          full_name: u.full_name,
          email: u.email,
          phone: u.phone,
          password: u.password || "farmer123",
          farm_name: u.farm_name || null,
          location: u.location,
          delivery_address: u.delivery_address || null,
          pincode: u.pincode || null,
          upi_id: u.upi_id || null,
          registered_at: u.created_at || new Date().toISOString()
        }));

      const customerUsers = nonAdminUsers
        .filter(u => u.role === "customer")
        .map(u => ({
          id: u.id,
          role: "customer",
          full_name: u.full_name,
          email: u.email,
          phone: u.phone,
          password: u.password || "customer123",
          location: u.location,
          delivery_address: u.delivery_address || u.location,
          pincode: u.pincode || null,
          registered_at: u.created_at || new Date().toISOString()
        }));

      const buyerUsers = nonAdminUsers
        .filter(u => u.role === "buyer")
        .map(u => ({
          id: u.id,
          role: "buyer",
          full_name: u.full_name,
          company_name: u.company_name || u.full_name,
          buyer_type: u.buyer_type || "Wholesale Institutional",
          email: u.email,
          phone: u.phone,
          password: u.password || "buyer123",
          location: u.location,
          registered_at: u.created_at || new Date().toISOString()
        }));

      const usersData = {
        description: "FarmiQ Registered Users Credentials & Profiles Directory",
        last_updated: new Date().toISOString(),
        total_farmers: farmerUsers.length,
        total_customers: customerUsers.length,
        total_buyers: buyerUsers.length,
        farmer_users: farmerUsers,
        customer_users: customerUsers,
        buyer_users: buyerUsers
      };

      const formatted = JSON.stringify(usersData, null, 2);
      fs.writeFileSync(this.usersFile, formatted, "utf-8");
      fs.writeFileSync(this.dataUsersFile, formatted, "utf-8");
    } catch (err: any) {
      console.error("Local file sync warning:", err.message);
    }
  }

  /**
   * Returns live diagnostic status of the database connection.
   */
  getStatus(state: DBState): CloudDbStatus {
    return {
      provider: this.provider,
      connected: this.isConnected,
      statusMessage: this.statusMessage,
      databaseName: this.databaseName,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
      counts: {
        users: (state.users || []).length,
        products: (state.products || []).length,
        orders: (state.orders || []).length,
        storage_bookings: (state.storage_bookings || []).length,
        contracts: (state.contracts || []).length,
        disputes: (state.disputes || []).length,
        requirements: (state.requirements || []).length,
        lots: (state.lots || []).length,
        verified_buyers: (state.verified_buyers || []).length,
        fpo_collectives: (state.fpo_collectives || []).length
      }
    };
  }
}

export const cloudDb = new CloudDbManager();
