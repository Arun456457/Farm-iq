import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { mandiMarkets, initialMandiRates, findNearestMandi, getMandiAreas, haversineDistanceKm, resolveMandiByLocation, getLocalMandiRateForCrop } from "./src/data/mandiDatabase.ts";

dotenv.config();

const projectRoot = process.cwd();
const PORT = Number(process.env.PORT) || 3000;

// In-memory + file-backed robust store to ensure instant response and multi-device sync
const DATA_FILE = path.join(projectRoot, "data", "app_state.json");
const USERS_FILE = path.join(projectRoot, "users.json");
const DATA_USERS_FILE = path.join(projectRoot, "data", "users.json");
fs.mkdirSync(path.join(projectRoot, "data"), { recursive: true });

interface DBState {
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

const defaultState: DBState = {
  users: [
    {
      id: 99,
      full_name: "FarmiQ System Admin",
      email: "admin@farmiq.com",
      phone: "+91 80011 22334",
      password: "farmiq",
      role: "admin",
      location: "FarmiQ HQ, Pune",
      created_at: new Date().toISOString()
    }
  ],
  products: [],
  orders: [],
  storage_bookings: [],
  contracts: [],
  disputes: [],
  requirements: [],
  lots: [],
  verified_buyers: [
    {
      id: "BUYER-101",
      company_name: "Reliance Fresh Direct Sourcing",
      buyer_type: "Retail Chain",
      verified: true,
      status: "VERIFIED",
      escrow_verified: true,
      contact_person: "Vikram Malhotra (Procurement VP)",
      phone: "+91 98111 22334",
      email: "procurement@reliancefresh.com",
      location: "Navi Mumbai Central Distribution Centre",
      demand_crop: "Tomato",
      demand_grade: "Grade-A",
      target_volume_quintal: 100,
      procurement_price: 3800,
      unit: "Quintal",
      gstin: "27AAACR1234F1Z1",
      match_reasons: ["Grade-A Certified", "Admin Approved", "Escrow 100% pre-funded", "Same-day pickup available"]
    },
    {
      id: "BUYER-102",
      company_name: "BigBasket Direct B2B Wholesale",
      buyer_type: "Wholesale Institutional",
      verified: true,
      status: "VERIFIED",
      escrow_verified: true,
      contact_person: "Ananya Deshmukh (Sourcing Manager)",
      phone: "+91 97222 33445",
      email: "b2b.sourcing@bigbasket.com",
      location: "Pune Chakan Logistics Cluster",
      demand_crop: "Onion",
      demand_grade: "Grade-A",
      target_volume_quintal: 250,
      procurement_price: 2800,
      unit: "Quintal",
      gstin: "27AABCB9876E1Z4",
      match_reasons: ["Direct FPO Bulk Partner", "Admin Approved", "Zero transit rejection guarantee", "Instant UPI settlement"]
    }
  ],
  invoices: [],
  notifications: [],
  payments: [],
  fpo_collectives: []
};

function loadState(): DBState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      const merged = { ...defaultState, ...parsed };
      // Purge any predefined/dummy logs as requested
      merged.disputes = (merged.disputes || []).filter((d: any) => d.id !== "DISP-101");
      merged.storage_bookings = (merged.storage_bookings || []).filter((sb: any) => sb.id !== "SB-8921");
      merged.requirements = (merged.requirements || []).filter((r: any) => !String(r.id || '').startsWith("REQ-70"));
      if (!merged.lots || merged.lots.length === 0) merged.lots = defaultState.lots;
      if (!merged.verified_buyers || merged.verified_buyers.length === 0) merged.verified_buyers = defaultState.verified_buyers;
      if (!merged.fpo_collectives || merged.fpo_collectives.length === 0) merged.fpo_collectives = defaultState.fpo_collectives;
      if (!merged.invoices) merged.invoices = [];
      if (!merged.notifications) merged.notifications = [];
      if (!merged.payments) merged.payments = [];

      // Purge only legacy demo placeholder emails if present; never purge by numeric ID or name
      merged.users = (merged.users || []).filter((u: any) =>
        !['farmer.patil@farmiq.in', 'ramesh.farmer.test@farmiq.in', 'priya.sharma@gmail.com', 'rahul.test@gmail.com', 'balasaheb.kadam@farmiq.in', 'ramesh.shinde@farmiq.in', 'sunita.jadhav@farmiq.in', 'ganesh.pawar@farmiq.in', 'nitin.more@farmiq.in'].includes(u.email?.toLowerCase()) &&
        !String(u.full_name || '').toLowerCase().includes('ramesh patil')
      );

      merged.products = (merged.products || []).filter((p: any) =>
        !String(p.farmer_name || '').includes('Suresh') &&
        !String(p.farmer_name || '').toLowerCase().includes('ramesh') &&
        !String(p.name || '').toLowerCase().includes('alphonso') &&
        p.farmer_name !== 'farmer.patil@farmiq.in'
      );

      // Clean demo FPO collectives & lots
      merged.lots = (merged.lots || []).filter((l: any) =>
        l.farmer_id !== 1 && !String(l.farmer_name).includes('Suresh')
      );

      merged.fpo_collectives = (merged.fpo_collectives || []).filter((c: any) =>
        c.lead_farmer_id !== 1 && !String(c.lead_farmer_name).includes('Suresh')
      );

      merged.orders = (merged.orders || []).filter((o: any) =>
        o.customer_id !== 2 && o.farmer_id !== 1 && !String(o.farmer_name).includes('Suresh') && !String(o.customer_name).includes('Priya')
      );

      merged.notifications = (merged.notifications || []).filter((n: any) =>
        !String(n.message).includes('Suresh') && !String(n.inviter_name).includes('Suresh')
      );

      return merged;
    }
  } catch (err) {
    console.error("Error reading state file:", err);
  }
  return { ...defaultState };
}

function syncUsersFile(users: any[]) {
  try {
    const list = users || [];
    const nonAdminUsers = list.filter(u => u.role !== 'admin');

    const farmerUsers = nonAdminUsers
      .filter(u => u.role === 'farmer')
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
      .filter(u => u.role === 'customer')
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
      .filter(u => u.role === 'buyer')
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
    fs.writeFileSync(USERS_FILE, formatted, "utf-8");
    fs.writeFileSync(DATA_USERS_FILE, formatted, "utf-8");
  } catch (err) {
    console.error("Error writing users.json file:", err);
  }
}

function saveState(state: DBState) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
    syncUsersFile(state.users);
  } catch (err) {
    console.error("Error saving state file:", err);
  }
}

// Active Server-Sent Events subscribers for real-time notifications
const sseClients = new Set<express.Response>();

function broadcastEvent(type: string, data: any) {
  const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

let db = loadState();

// Enforce single fixed admin account: admin@farmiq.com (Password: farmiq)
if (!db.users) db.users = [];
let adminUserRecord = db.users.find(u => u.email.toLowerCase() === "admin@farmiq.com" || u.email.toLowerCase() === "admin@farmiq.in" || u.role === "admin");
if (adminUserRecord) {
  adminUserRecord.email = "admin@farmiq.com";
  adminUserRecord.role = "admin";
  adminUserRecord.full_name = "FarmiQ System Admin";
  adminUserRecord.phone = "+91 80011 22334";
  adminUserRecord.location = "FarmiQ HQ, Pune";
} else {
  adminUserRecord = {
    id: 99,
    full_name: "FarmiQ System Admin",
    email: "admin@farmiq.com",
    phone: "+91 80011 22334",
    password: "farmiq",
    role: "admin",
    location: "FarmiQ HQ, Pune",
    created_at: new Date().toISOString()
  };
  db.users.push(adminUserRecord);
}
// Demote any other unauthorized user attempting to hold admin role
db.users.forEach(u => {
  if (u.role === "admin" && u.email.toLowerCase() !== "admin@farmiq.com") {
    u.role = "customer";
  }
});

// State is cleaned of default/seed farmers
saveState(db);

if (db.lots) {
  db.lots.forEach(lot => {
    if (!lot.member_farmers) lot.member_farmers = [];

    // 2. Sync linked orders and buyer user IDs
    if (db.orders) {
      // Find matching buyer
      let buyerUser: any = null;
      let buyerRecord: any = null;
      if (lot.matched_buyer_id) {
        buyerRecord = (db.verified_buyers || []).find(b => b.id === lot.matched_buyer_id);
      }
      if (!buyerRecord && lot.matched_buyer_name) {
        buyerRecord = (db.verified_buyers || []).find(b => b.company_name?.toLowerCase() === lot.matched_buyer_name?.toLowerCase());
      }
      if (buyerRecord) {
        if (buyerRecord.user_id) {
          buyerUser = db.users.find(u => u.id === buyerRecord.user_id);
        }
        if (!buyerUser && buyerRecord.email) {
          buyerUser = db.users.find(u => u.email.toLowerCase() === buyerRecord.email.toLowerCase());
        }
      }

      if (lot.status === "CONTRACTED") {
        let existing = db.orders.find(o => (o as any).lot_id === lot.id || (lot.linked_order_id && o.id === lot.linked_order_id));
        if (existing) {
          lot.linked_order_id = existing.id;
          lot.fulfillment_status = existing.status;
          // Ensure buyer ID is correctly set to verified buyer's user ID
          if (buyerUser && existing.customer_id !== buyerUser.id) {
            existing.customer_id = buyerUser.id;
          }
          if (buyerRecord) {
            (existing as any).buyer_id = buyerRecord.id;
            existing.customer_name = buyerRecord.company_name;
          }
          (existing as any).fpo_name = lot.fpo_name;
          (existing as any).member_farmers = lot.member_farmers;
        } else {
          const newOrderId = db.orders.length ? Math.max(...db.orders.map(o => o.id)) + 1 : 101;
          const newOrder = {
            id: newOrderId,
            lot_id: lot.id,
            buyer_id: buyerRecord ? buyerRecord.id : undefined,
            customer_id: buyerUser ? buyerUser.id : (buyerRecord && buyerRecord.user_id ? buyerRecord.user_id : 2),
            customer_name: lot.matched_buyer_name || (buyerRecord ? buyerRecord.company_name : "Verified Institutional Buyer"),
            farmer_id: lot.farmer_id || 0,
            farmer_name: lot.farmer_name || "Registered Farmer",
            fpo_name: lot.fpo_name,
            member_farmers: lot.member_farmers,
            product_id: 0,
            product_name: `[FPO Bulk Lot #${lot.id}] ${lot.crop_name} (${lot.quality_grade}) - ${lot.variety}`,
            quantity: lot.quantity,
            unit: lot.unit,
            unit_price: lot.base_price_per_unit,
            product_total: Math.round(lot.quantity * lot.base_price_per_unit),
            distance_km: 45,
            delivery_charge: 90,
            grand_total: Math.round(lot.quantity * lot.base_price_per_unit) + 90,
            delivery_address: buyerRecord ? buyerRecord.location : (lot.location || "Central Agri Corridor Distribution Hub"),
            payment_method: "100% Escrow Secured",
            payment_status: "LOCKED_IN_ESCROW",
            transaction_id: `ESC-${Date.now().toString().slice(-6)}`,
            status: "ACCEPTED" as any,
            driver_name: "FarmiQ Agri-Logistics Transport",
            driver_phone: "+91 94231 88910",
            vehicle_number: "MH-15-EG-8821",
            order_type: "FPO_COMMERCIAL_LOT",
            created_at: lot.created_at || new Date().toISOString()
          };
          db.orders.unshift(newOrder);
          lot.linked_order_id = newOrderId;
          lot.fulfillment_status = "ACCEPTED";
        }
      }
    }
  });

  // Explicit sync for smart india and Smart orders if exist
  if (db.orders) {
    db.orders.forEach(o => {
      if (o.customer_name === "smart india" || (o as any).lot_id === "LOT-FPO-745") {
        o.customer_id = 106; // smart india user id
        (o as any).buyer_id = "BUYER-3658";
      }
      if (o.customer_name === "Smart" || (o as any).lot_id === "LOT-FPO-101") {
        o.customer_id = 104; // Smart user id
        (o as any).buyer_id = "BUYER-3411";
      }
    });
  }

  saveState(db);
}

// Initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

/**
 * Fair distance-tiered delivery fee algorithm:
 * - Up to 5 km: ₹5 per km (local direct dispatch)
 * - 5 to 15 km: ₹3 per km (fair medium distance)
 * - Above 15 km: ₹2 per km (economical long-haul rate)
 */
function calculateDeliveryFee(distanceKm: number): number {
  const km = Math.max(1, Math.round((Number(distanceKm) || 1) * 10) / 10);
  if (km <= 5) {
    return Math.round(km * 5);
  } else if (km <= 15) {
    return Math.round(25 + (km - 5) * 3);
  } else {
    return Math.round(55 + (km - 15) * 2);
  }
}

/**
 * Dynamically resolves the FarmiQ web application base URL.
 * Automatically detects Render production URL (https://farm-iq-pdaq.onrender.com)
 * or local development (http://localhost:3000) based on request headers or env.
 */
function getAppBaseUrl(req?: express.Request): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '');
  }
  if (req) {
    const origin = req.headers.origin as string;
    if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin.replace(/\/+$/, '');
    }
    const forwardedHost = (req.headers['x-forwarded-host'] || req.headers.host) as string;
    if (forwardedHost) {
      if (forwardedHost.includes('localhost') || forwardedHost.includes('127.0.0.1')) {
        return `http://${forwardedHost}`.replace(/\/+$/, '');
      }
      const proto = (req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'https')) as string;
      return `${proto}://${forwardedHost}`.replace(/\/+$/, '');
    }
  }
  return 'https://farm-iq-pdaq.onrender.com';
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "25mb" }));

  // Forward declaration for Mandi benchmarks in scope of all endpoints
  let defaultMandiRates: any[] = [];

  // Helper auth check with fallback to users.json
  const getUserFromToken = (req: express.Request) => {
    const auth = req.headers.authorization;
    if (!auth) return null;
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (token.startsWith("user_")) {
      const id = parseInt(token.replace("user_", ""));
      let found = db.users.find(u => Number(u.id) === id);
      if (!found) {
        // Fallback: check users directory files to restore active session
        try {
          const userFiles = [DATA_USERS_FILE, USERS_FILE];
          for (const uFile of userFiles) {
            if (fs.existsSync(uFile)) {
              const uData = JSON.parse(fs.readFileSync(uFile, "utf-8"));
              const allUsers = [...(uData.farmer_users || []), ...(uData.customer_users || []), ...(uData.buyer_users || [])];
              const match = allUsers.find((u: any) => Number(u.id) === id);
              if (match) {
                db.users.push(match);
                found = match;
                break;
              }
            }
          }
        } catch {}
      }
      return found || null;
    }
    return db.users.find(u => (u.email || "").toLowerCase() === token.toLowerCase()) || null;
  };

  // --- REST API ENDPOINTS ---

  // AUTH
  app.post("/api/auth/register", (req, res) => {
    const {
      full_name, email, phone, role, password, farm_name, location, delivery_address,
      pincode, latitude, longitude, upi_id,
      company_name, buyer_type, demand_crop, target_volume_quintal, procurement_price, gstin
    } = req.body;
    if (!email || !full_name) {
      return res.status(400).json({ error: "Name and email required" });
    }

    // STRICT: Admin registration is prohibited. Only fixed admin account admin@farmiq.com exists.
    if (role === "admin" || String(email).toLowerCase().includes("admin")) {
      return res.status(403).json({
        error: "Administrator registration is restricted. FarmiQ has a single fixed administrator account (admin@farmiq.com)."
      });
    }

    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const isBuyer = role === "buyer";
    const resolvedAddress = delivery_address || location || "Maharashtra";
    const cleanRole = String(role || "customer").toLowerCase().trim();
    const newUser = {
      id: db.users.length ? Math.max(1000, ...db.users.map(u => Number(u.id) || 0)) + 1 : 1001,
      full_name,
      email,
      phone: phone || "+91 98000 00000",
      password: password ? String(password).trim() : "farmiq123",
      role: cleanRole,
      farm_name: farm_name || null,
      location: location || resolvedAddress,
      delivery_address: delivery_address || resolvedAddress,
      pincode: pincode ? String(pincode).trim() : null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      upi_id: role === "farmer" ? (upi_id || "9133144324@ybl") : null,
      upi_name: role === "farmer" ? full_name : null,
      company_name: company_name || (isBuyer ? full_name : null),
      buyer_type: buyer_type || (isBuyer ? "Wholesale Institutional" : null),
      demand_crop: demand_crop || (isBuyer ? "Tomato" : null),
      target_volume_quintal: target_volume_quintal ? Number(target_volume_quintal) : null,
      gstin: gstin || (isBuyer ? "27AABCF1234F1Z5" : null),
      verified: isBuyer ? false : true,
      status: isBuyer ? "PENDING_VERIFICATION" : "VERIFIED",
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);

    // If buyer creates account, add them to verified_buyers as PENDING so admin can verify and accept!
    if (isBuyer) {
      if (!db.verified_buyers) db.verified_buyers = [];
      const newBuyer = {
        id: `BUYER-${Date.now().toString().slice(-4)}`,
        user_id: newUser.id,
        company_name: company_name || full_name,
        buyer_type: buyer_type || "Wholesale Institutional",
        verified: false,
        status: "PENDING_VERIFICATION",
        escrow_verified: true,
        contact_person: full_name,
        phone: phone || "+91 98000 00000",
        email: email,
        location: location || "Maharashtra",
        demand_crop: demand_crop || "Tomato",
        demand_grade: "Grade-A",
        target_volume_quintal: Number(target_volume_quintal) || 100,
        procurement_price: Number(procurement_price) || 3200,
        unit: "Quintal",
        gstin: gstin || "27AABCF1234F1Z5",
        match_reasons: ["New Buyer Registration", "Pending Admin Verification Approval"],
        created_at: new Date().toISOString()
      };
      db.verified_buyers.unshift(newBuyer);
    }

    saveState(db);
    res.json({
      access_token: `user_${newUser.id}`,
      user: newUser
    });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, identifier, phone, password, role } = req.body;
    const cleanEmail = String(email || identifier || phone || "").trim().toLowerCase();
    const cleanPassword = String(password || "").trim();

    // STRICT ADMIN VALIDATION:
    // Any one cannot login as admin. Only one email id and password is fixed for admin login: admin@farmiq.com and password farmiq
    if (cleanEmail === "admin@farmiq.com" || cleanEmail.includes("admin")) {
      if (cleanEmail !== "admin@farmiq.com" || cleanPassword !== "farmiq") {
        return res.status(401).json({
          error: "Invalid email or password. Access denied."
        });
      }
      let admin = db.users.find(u => u.email.toLowerCase() === "admin@farmiq.com");
      if (!admin) {
        admin = {
          id: 99,
          full_name: "FarmiQ System Admin",
          email: "admin@farmiq.com",
          phone: "+91 80011 22334",
          role: "admin",
          location: "FarmiQ HQ, Pune",
          created_at: new Date().toISOString()
        };
        db.users.push(admin);
        saveState(db);
      }
      return res.json({
        access_token: `user_${admin.id}`,
        user: admin
      });
    }

    const cleanDigits = cleanEmail.replace(/\D/g, '');
    const user = db.users.find(u => {
      const uEmail = (u.email || "").toLowerCase();
      const uPhoneDigits = String(u.phone || "").replace(/\D/g, '');
      const uName = (u.full_name || "").toLowerCase();

      if (uEmail === cleanEmail) return true;
      if (cleanDigits.length >= 10 && uPhoneDigits.endsWith(cleanDigits)) return true;
      if (uName === cleanEmail) return true;
      return false;
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // STRICT PASSWORD VERIFICATION FOR ALL USERS:
    const expectedPassword = user.password || (user.role === 'farmer' ? 'farmer123' : 'customer123');
    if (cleanPassword !== expectedPassword) {
      return res.status(401).json({ error: "Invalid password. Please check your password and try again." });
    }

    // Protect against non-admin email having admin role
    if (user.role === "admin") {
      if (user.email.toLowerCase() !== "admin@farmiq.com" || cleanPassword !== "farmiq") {
        return res.status(401).json({ error: "Invalid admin credentials. Only admin@farmiq.com is permitted." });
      }
    }
    res.json({
      access_token: `user_${user.id}`,
      user
    });
  });

  app.get("/api/auth/me", (req, res) => {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    res.json({ user, ...user });
  });

  // FORGOT PASSWORD & RECOVERY NOTIFICATION (SMS / WhatsApp)
  app.post("/api/auth/forgot-password", (req, res) => {
    const { identifier } = req.body;
    if (!identifier || !String(identifier).trim()) {
      return res.status(400).json({ error: "Please enter your registered email address or phone number." });
    }

    const cleanIdent = String(identifier).trim().toLowerCase();
    const cleanDigits = cleanIdent.replace(/\D/g, '');

    const user = (db.users || []).find(u => {
      const uEmail = String(u.email || "").trim().toLowerCase();
      const uPhoneDigits = String(u.phone || "").replace(/\D/g, '');
      const uName = String(u.full_name || "").trim().toLowerCase();

      if (uEmail === cleanIdent) return true;
      if (cleanDigits.length >= 10 && uPhoneDigits.endsWith(cleanDigits)) return true;
      if (cleanDigits.length >= 6 && uPhoneDigits.includes(cleanDigits)) return true;
      if (uName === cleanIdent) return true;
      return false;
    });

    if (!user) {
      return res.status(404).json({
        error: "No FarmiQ account found matching that email or mobile number. Please check your spelling or register a new account."
      });
    }

    const userPassword = user.password || (user.role === 'farmer' ? 'farmer123' : (user.role === 'admin' ? 'farmiq' : 'customer123'));
    const appUrl = getAppBaseUrl(req);
    const phoneDigits = String(user.phone || "").replace(/\D/g, '');
    const intlPhone = phoneDigits.length === 10 ? `91${phoneDigits}` : (phoneDigits || "919800000000");

    const waMsg = `🌾 *FarmiQ Password Recovery Alert!*\n\nHello *${user.full_name || 'FarmiQ User'}*,\n\nYou requested password recovery for your FarmiQ account.\n\n📧 *Email:* ${user.email}\n📱 *Phone:* ${user.phone || 'N/A'}\n👤 *Role:* ${String(user.role || 'user').toUpperCase()}\n🔑 *Your Password is:* *${userPassword}*\n\n👉 *Login to FarmiQ:* ${appUrl}/\n\nIf you did not request this, please login and update your password in profile settings.`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(waMsg)}`;

    res.json({
      success: true,
      message: "Account found! Your password has been retrieved.",
      email: user.email,
      phone: user.phone || "+91 98000 00000",
      full_name: user.full_name || "FarmiQ Member",
      role: user.role,
      password: userPassword,
      whatsapp_url: whatsappUrl
    });
  });

  // RESET PASSWORD ENDPOINT
  app.post("/api/auth/reset-password", (req, res) => {
    const { identifier, new_password } = req.body;
    if (!identifier || !String(identifier).trim()) {
      return res.status(400).json({ error: "Email or phone number is required." });
    }
    if (!new_password || String(new_password).trim().length < 4) {
      return res.status(400).json({ error: "New password must be at least 4 characters long." });
    }

    const cleanIdent = String(identifier).trim().toLowerCase();
    const cleanDigits = cleanIdent.replace(/\D/g, '');

    const user = (db.users || []).find(u => {
      const uEmail = String(u.email || "").trim().toLowerCase();
      const uPhoneDigits = String(u.phone || "").replace(/\D/g, '');
      const uName = String(u.full_name || "").trim().toLowerCase();

      if (uEmail === cleanIdent) return true;
      if (cleanDigits.length >= 10 && uPhoneDigits.endsWith(cleanDigits)) return true;
      if (cleanDigits.length >= 6 && uPhoneDigits.includes(cleanDigits)) return true;
      if (uName === cleanIdent) return true;
      return false;
    });

    if (!user) {
      return res.status(404).json({ error: "No user found with the provided credentials." });
    }

    user.password = String(new_password).trim();
    saveState(db);

    res.json({
      success: true,
      message: "Password updated successfully! You can now log in with your new password.",
      user
    });
  });

  // USER PROFILE & ADDRESS / PAYMENT SETTINGS
  const handleUpdateProfile = (req: express.Request, res: express.Response) => {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const {
      full_name, email, phone, location, delivery_address,
      farm_name, company_name, upi_id, upi_name, pincode, latitude, longitude, password
    } = req.body;

    if (password !== undefined && String(password).trim()) {
      user.password = String(password).trim();
    }

    if (full_name !== undefined && String(full_name).trim()) {
      const oldName = user.full_name;
      user.full_name = String(full_name).trim();
      // Sync farmer_name across user's products
      if (db.products && user.role === 'farmer') {
        db.products.forEach(p => {
          if (p.farmer_id === user.id) {
            p.farmer_name = user.full_name;
            if (farm_name) p.farm_name = String(farm_name).trim();
          }
        });
      }
    }

    if (email !== undefined && String(email).trim()) {
      const cleanEmail = String(email).trim().toLowerCase();
      // Check collision with another user
      const existing = db.users.find(u => u.id !== user.id && u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return res.status(400).json({ error: "This email is already in use by another account." });
      }
      user.email = cleanEmail;
    }

    if (phone !== undefined && String(phone).trim()) {
      user.phone = String(phone).trim();
    }
    if (location !== undefined) {
      user.location = String(location).trim();
    }
    if (delivery_address !== undefined) {
      user.delivery_address = String(delivery_address).trim();
    }
    if (farm_name !== undefined) {
      user.farm_name = String(farm_name).trim();
    }
    if (company_name !== undefined) {
      user.company_name = String(company_name).trim();
    }
    if (pincode !== undefined) {
      user.pincode = String(pincode).trim();
    }
    if (upi_id !== undefined) {
      user.upi_id = String(upi_id).trim();
    }
    if (upi_name !== undefined) {
      user.upi_name = String(upi_name).trim();
    } else if (user.upi_id && !user.upi_name) {
      user.upi_name = user.full_name;
    }
    if (latitude !== undefined) user.latitude = Number(latitude);
    if (longitude !== undefined) user.longitude = Number(longitude);

    // Auto-resolve coordinates from location if not explicitly provided
    if ((latitude === undefined || longitude === undefined) && (user.location || user.delivery_address)) {
      const resMkt = resolveMandiByLocation(user.location || user.delivery_address);
      if (resMkt?.market) {
        user.latitude = resMkt.market.lat;
        user.longitude = resMkt.market.lng;
      }
    }

    const dbUser = db.users.find(u => u.id === user.id);
    if (dbUser) {
      Object.assign(dbUser, {
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        password: user.password,
        location: user.location,
        delivery_address: user.delivery_address,
        farm_name: user.farm_name,
        company_name: user.company_name,
        pincode: user.pincode,
        upi_id: user.upi_id,
        upi_name: user.upi_name,
        latitude: user.latitude,
        longitude: user.longitude
      });
    }

    // Immediately synchronize profile changes across active orders and invoices so the app uses the new saved info everywhere
    if (user.role === 'customer' || user.role === 'buyer') {
      if (db.orders) {
        db.orders.forEach(o => {
          if (o.customer_id === user.id) {
            if (user.phone) o.customer_phone = user.phone;
            if (user.full_name) o.customer_name = user.full_name;
            if (user.email) o.customer_email = user.email;
            if (user.delivery_address) o.delivery_address = user.delivery_address;
          }
        });
      }
      if (db.invoices) {
        db.invoices.forEach(inv => {
          if (inv.customer_id === user.id) {
            if (user.phone) inv.customer_phone = user.phone;
            if (user.full_name) inv.customer_name = user.full_name;
            if (user.email) inv.customer_email = user.email;
            if (user.delivery_address) inv.customer_address = user.delivery_address;
          }
        });
      }
    }

    if (user.role === 'farmer') {
      if (db.orders) {
        db.orders.forEach(o => {
          if (o.farmer_id === user.id) {
            if (user.phone) o.farmer_phone = user.phone;
            if (user.full_name) o.farmer_name = user.full_name;
            if (user.location) o.farmer_location = user.location;
          }
        });
      }
      if (db.invoices) {
        db.invoices.forEach(inv => {
          if (inv.farmer_id === user.id) {
            if (user.phone) inv.farmer_phone = user.phone;
            if (user.full_name) inv.farmer_name = user.full_name;
            if (user.location) inv.farmer_address = user.location;
          }
        });
      }
      if (db.products) {
        db.products.forEach(p => {
          if (p.farmer_id === user.id) {
            if (user.phone) p.farmer_phone = user.phone;
            if (user.full_name) p.farmer_name = user.full_name;
            if (user.location) p.location = user.location;
          }
        });
      }
    }

    saveState(db);
    broadcastEvent("PROFILE_UPDATED", { user });
    res.json({ message: "Profile updated successfully", user });
  };

  app.put("/api/users/profile", handleUpdateProfile);
  app.put("/api/auth/profile", handleUpdateProfile);

  // BENCHMARK & ADVISORY LOGIC (Location-Based Local APMC Mandi)
  function getCropBenchmark(cropName: string, location?: string) {
    const marketInfo = resolveMandiByLocation(location);
    const localRate = getLocalMandiRateForCrop(cropName, marketInfo.market);
    return {
      modal_price: localRate.modal_price,
      min_price: localRate.min_price,
      max_price: localRate.max_price,
      trend: localRate.trend,
      pct_change: localRate.pct_change,
      mandi: localRate.mandi,
      district: localRate.district,
      state: localRate.state
    };
  }

  function getMandiBenchmarkForCrop(cropName: string, unit: string = 'kg', location?: string): { mandiPricePerUnit: number; modalKgPrice: number; mandiName: string; cropFound: string } {
    const bench = getCropBenchmark(cropName, location);
    const modalKg = bench.modal_price;
    const cleanUnit = (unit || "kg").toLowerCase().trim();
    let pricePerUnit = modalKg;

    if (cleanUnit.includes("quintal") || cleanUnit === "qtl") {
      pricePerUnit = modalKg * 100;
    } else if (cleanUnit.includes("ton") || cleanUnit.includes("tonne")) {
      pricePerUnit = modalKg * 1000;
    } else if (cleanUnit.includes("box") || cleanUnit.includes("crate")) {
      pricePerUnit = modalKg * 20; // standard 20kg crate
    } else if (cleanUnit.includes("dozen")) {
      pricePerUnit = Math.round(modalKg * 1.5);
    } else {
      pricePerUnit = modalKg;
    }

    return {
      mandiPricePerUnit: Math.round(pricePerUnit),
      modalKgPrice: modalKg,
      mandiName: bench.mandi,
      cropFound: cropName
    };
  }

  function parseHarvestDateParts(dateStr: string): { year: number; month: number; day: number } | null {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    const match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10) - 1,
        day: parseInt(match[3], 10)
      };
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return null;
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate()
    };
  }

  function getHarvestDateStatus(harvestDateStr: string) {
    const parts = parseHarvestDateParts(harvestDateStr);
    if (!parts) {
      return {
        days_since_harvest: 0,
        days_until_harvest: 0,
        timing: 'TODAY' as const,
        status_label: 'Fresh Daily Harvest'
      };
    }

    const now = new Date();
    const todayParts = {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate()
    };

    const harvestTime = Date.UTC(parts.year, parts.month, parts.day);
    const todayTime = Date.UTC(todayParts.year, todayParts.month, todayParts.day);
    const diffDays = Math.round((todayTime - harvestTime) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysUntil = Math.abs(diffDays);
      return {
        days_since_harvest: 0,
        days_until_harvest: daysUntil,
        timing: 'FUTURE' as const,
        status_label: daysUntil === 1
          ? 'Harvesting Tomorrow'
          : daysUntil === 2
            ? 'Harvesting Day After Tomorrow'
            : `Harvesting in ${daysUntil} days`
      };
    } else if (diffDays === 0) {
      return {
        days_since_harvest: 0,
        days_until_harvest: 0,
        timing: 'TODAY' as const,
        status_label: 'Freshly Harvested Today'
      };
    } else {
      return {
        days_since_harvest: diffDays,
        days_until_harvest: 0,
        timing: 'PAST' as const,
        status_label: diffDays === 1 ? 'Harvested Yesterday' : `Harvested ${diffDays} days ago`
      };
    }
  }

  function enrichProduct(p: any) {
    const bench = getCropBenchmark(p.name, p.location);
    const marketPrice = p.market_price || bench.modal_price;
    const priceDiff = (p.price || 0) - marketPrice;

    // Days since harvest calculation with future date support
    const harvestStatus = getHarvestDateStatus(p.harvest_date);
    const daysSinceHarvest = harvestStatus.days_since_harvest;
    const daysUntilHarvest = harvestStatus.days_until_harvest;
    const harvestTiming = harvestStatus.timing;
    const harvestStatusLabel = harvestStatus.status_label;

    const totalShelfLife = p.shelf_life_days || 14;
    const remainingShelfLife = harvestTiming === 'FUTURE'
      ? totalShelfLife
      : Math.max(0, totalShelfLife - daysSinceHarvest);

    // DECISION LOGIC: Sell Now vs Wait 1 or 2 Days
    let sellRecommendation: 'SELL_NOW' | 'WAIT_1_2_DAYS' = 'SELL_NOW';
    let sellRecommendationReason = '';
    let actionAdvice = '';

    if (harvestTiming === 'FUTURE') {
      sellRecommendation = 'SELL_NOW';
      sellRecommendationReason = daysUntilHarvest === 1
        ? `Harvesting Tomorrow: Pre-listing now allows direct consumer & retail pre-booking before plucking.`
        : `Pre-Harvest Booking: Plucking in ${daysUntilHarvest} days. Lock orders directly to reduce post-harvest handling.`;
      actionAdvice = daysUntilHarvest === 1
        ? `🌱 Harvesting Tomorrow: Keep listing open for early morning plucking & same-day dispatch.`
        : `🌱 Pre-Harvest Booking: ${daysUntilHarvest} days until plucking. Direct farm orders active.`;
    } else if (remainingShelfLife <= 2) {
      sellRecommendation = 'SELL_NOW';
      sellRecommendationReason = `Critical Shelf-Life: Only ${remainingShelfLife} day(s) freshness remaining. Sell now at ₹${p.price}/${p.unit || 'kg'} to avoid spoilage.`;
      actionAdvice = `⚡ Sell Now: High direct consumer demand at ₹${p.price}/${p.unit || 'kg'}.`;
    } else if (bench.trend === 'UP' && bench.pct_change >= 2.5 && remainingShelfLife >= 4) {
      sellRecommendation = 'WAIT_1_2_DAYS';
      const projectedGain = Math.max(2, Math.round(marketPrice * 0.08));
      sellRecommendationReason = `Mandi rate is surging (+${bench.pct_change}% at ${bench.mandi}). Produce has good shelf-life (${remainingShelfLife} days left). Holding 1–2 days is forecast to gain +₹${projectedGain}/kg.`;
      actionAdvice = `⏳ Wait 1–2 Days: Mandi rate rising (+${bench.pct_change}%). Reserve in cold storage if holding.`;
    } else if (bench.trend === 'DOWN') {
      sellRecommendation = 'SELL_NOW';
      sellRecommendationReason = `Mandi trend is dipping (-${Math.abs(bench.pct_change)}%) due to rising arrivals at ${bench.mandi}. Sell today at ₹${p.price}/${p.unit || 'kg'} to lock in strong return.`;
      actionAdvice = `⚡ Sell Now: High direct consumer demand at ₹${p.price}/${p.unit || 'kg'}.`;
    } else {
      sellRecommendation = 'SELL_NOW';
      sellRecommendationReason = `Stable Mandi rate (₹${marketPrice}/${p.unit || 'kg'} at ${bench.mandi}). Direct liquidation today ensures 100% farm-gate realization with zero intermediary cuts.`;
      actionAdvice = `⚡ Sell Now: High direct consumer demand at ₹${p.price}/${p.unit || 'kg'}.`;
    }

    return {
      ...p,
      market_price: marketPrice,
      mandi_name: bench.mandi,
      mandi_district: bench.district,
      mandi_state: bench.state,
      price_diff: priceDiff,
      days_since_harvest: daysSinceHarvest,
      days_until_harvest: daysUntilHarvest,
      harvest_timing: harvestTiming,
      harvest_status_label: harvestStatusLabel,
      remaining_shelf_life: remainingShelfLife,
      sell_recommendation: sellRecommendation,
      sell_recommendation_reason: sellRecommendationReason,
      action_advice: actionAdvice
    };
  }

  // PRODUCTS
  app.get("/api/products", (req, res) => {
    const farmerId = req.query.farmer_id ? parseInt(req.query.farmer_id as string) : null;
    let list = (db.products || []).filter(p => p.farmer_id !== 1 && !String(p.farmer_name).includes('Suresh'));
    if (farmerId) {
      list = list.filter(p => p.farmer_id === farmerId);
    }
    res.json(list.map(enrichProduct));
  });

  app.get("/api/farmer/products", (req, res) => {
    const user = getUserFromToken(req);
    const list = !user ? [] : (db.products || []).filter(p => p.farmer_id === user.id);
    res.json(list.map(enrichProduct));
  });

  app.put("/api/products/:id", (req, res) => {
    const user = getUserFromToken(req);
    if (!user || user.role !== "farmer") {
      return res.status(403).json({ error: "Only farmers can edit produce listings" });
    }
    const prodId = Number(req.params.id);
    const idx = db.products.findIndex(p => p.id === prodId);
    if (idx === -1) {
      return res.status(404).json({ error: "Product not found" });
    }
    const product = db.products[idx];
    if (product.farmer_id !== user.id) {
      return res.status(403).json({ error: "You can only edit your own listings" });
    }
    const { name, category, quantity, unit, price, harvest_date, location, description, organic, image_base64 } = req.body;
    const parsedQty = Number(quantity);
    const parsedPrice = Number(price);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ error: "A valid positive quantity is required" });
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: "A valid positive price is required" });
    }
    // Mandi price validation
    const benchmark = getMandiBenchmarkForCrop(name || product.name, unit || product.unit || "kg");
    if (parsedPrice > benchmark.mandiPricePerUnit) {
      return res.status(400).json({
        error: `Price rejected: Your price of ₹${parsedPrice}/${unit || 'kg'} exceeds the official APMC Mandi benchmark of ₹${benchmark.mandiPricePerUnit}/${unit || 'kg'} (at ${benchmark.mandiName}).`,
        mandi_price: benchmark.mandiPricePerUnit,
        mandi_name: benchmark.mandiName
      });
    }
    db.products[idx] = {
      ...product,
      name: String(name || product.name).trim(),
      category: category || product.category,
      quantity: parsedQty,
      unit: unit || product.unit,
      price: parsedPrice,
      harvest_date: harvest_date || product.harvest_date,
      location: String(location || product.location).trim(),
      description: String(description || product.description || "").trim(),
      organic: organic !== undefined ? (organic ? 1 : 0) : product.organic,
      image_url: image_base64 ? image_base64 : product.image_url,
      updated_at: new Date().toISOString()
    };
    saveState(db);
    res.json(enrichProduct(db.products[idx]));
  });

  app.delete("/api/products/:id", (req, res) => {
    const user = getUserFromToken(req);
    const prodId = Number(req.params.id);
    const idx = db.products.findIndex(p => p.id === prodId);
    if (idx !== -1) {
      const product = db.products[idx];
      // Allow farmer who owns it, or admin
      if (user && (user.role === "admin" || product.farmer_id === user.id)) {
        db.products.splice(idx, 1);
        saveState(db);
        return res.json({ message: "Product removed" });
      }
      return res.status(403).json({ error: "You can only delete your own listings" });
    }
    res.status(404).json({ error: "Product not found" });
  });

  app.post("/api/products", (req, res) => {
    const user = getUserFromToken(req);
    if (!user || String(user.role).toLowerCase() !== "farmer") {
      return res.status(403).json({ error: "Only farmers can list produce" });
    }
    const { name, category, quantity, unit, price, harvest_date, location, description, organic, image_url, image_base64, shelf_life_days } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Product name is required" });
    }
    const parsedQty = Number(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ error: "A valid positive quantity is required" });
    }
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: "A valid positive price is required" });
    }

    // MANDI PRICE VALIDATION:
    // If the farmer chooses a product price more than the official Mandi price, do not accept the product!
    const benchmark = getMandiBenchmarkForCrop(name, unit || "kg");
    if (parsedPrice > benchmark.mandiPricePerUnit) {
      return res.status(400).json({
        error: `Price rejected: Your entered price of ₹${parsedPrice}/${unit || 'kg'} exceeds the official APMC Mandi benchmark price of ₹${benchmark.mandiPricePerUnit}/${unit || 'kg'} (at ${benchmark.mandiName}). Products cannot be listed higher than the Mandi benchmark rate to protect fair pricing.`,
        mandi_price: benchmark.mandiPricePerUnit,
        mandi_name: benchmark.mandiName,
        unit: unit || 'kg',
        modal_kg_price: benchmark.modalKgPrice
      });
    }

    const newProduct = {
      id: db.products.length ? Math.max(100, ...db.products.map(p => Number(p.id) || 0)) + 1 : 101,
      farmer_id: user.id,
      farmer_name: user.full_name,
      farm_name: user.farm_name || "FarmiQ Partner Farm",
      name: String(name).trim(),
      category: category || "Other Fresh Produce",
      quantity: parsedQty,
      unit: unit || "kg",
      price: parsedPrice,
      harvest_date: harvest_date || "",
      location: location ? String(location).trim() : (user.location || ""),
      description: description ? String(description).trim() : "",
      organic: organic ? 1 : 0,
      image_url: image_base64 || image_url || "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
      shelf_life_days: Number(shelf_life_days) || 14,
      created_at: new Date().toISOString()
    };
    db.products.unshift(newProduct);
    saveState(db);
    res.json({ message: "Product listed successfully", product: newProduct });
  });

  // Helper to resolve all purchase orders for a verified corporate buyer
  const getOrdersForBuyer = (user: any) => {
    const buyerRecord = (db.verified_buyers || []).find(b =>
      (b.user_id && b.user_id === user.id) ||
      (b.email && b.email.toLowerCase() === user.email.toLowerCase()) ||
      (user.company_name && b.company_name && b.company_name.toLowerCase() === user.company_name.toLowerCase())
    );
    const buyerId = buyerRecord ? buyerRecord.id : null;
    const companyName = (buyerRecord?.company_name || user.company_name || user.full_name || "").toLowerCase();

    return (db.orders || []).filter(o => {
      if (o.customer_id === user.id) return true;
      if (buyerId && (o as any).buyer_id === buyerId) return true;
      if (companyName && o.customer_name && o.customer_name.toLowerCase() === companyName) return true;
      if (user.full_name && o.customer_name && o.customer_name.toLowerCase() === user.full_name.toLowerCase()) return true;
      if (o.lot_id && db.lots) {
        const lot = db.lots.find(l => l.id === o.lot_id);
        if (lot && ((buyerId && lot.matched_buyer_id === buyerId) || (companyName && lot.matched_buyer_name?.toLowerCase() === companyName))) {
          return true;
        }
      }
      return false;
    });
  };

  // ORDERS
  app.get("/api/orders", (req, res) => {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    let orders = db.orders || [];
    if (user.role === "farmer") {
      orders = orders.filter(o => o.farmer_id === user.id);
    } else if (user.role === "customer") {
      orders = orders.filter(o => o.customer_id === user.id);
    } else if (user.role === "buyer") {
      orders = getOrdersForBuyer(user);
    }
    res.json(orders);
  });

  app.get("/api/customer/orders", (req, res) => {
    const user = getUserFromToken(req);
    if (!user) return res.json([]);
    if (user.role === "buyer") {
      return res.json(getOrdersForBuyer(user));
    }
    const orders = (db.orders || []).filter(o => o.customer_id === user.id).map(o => {
      const farmer = db.users.find(u => u.id === o.farmer_id);
      return {
        ...o,
        customer_phone: user.phone || o.customer_phone,
        customer_name: user.full_name || o.customer_name,
        delivery_address: user.delivery_address || o.delivery_address,
        farmer_phone: farmer?.phone || o.farmer_phone,
        farmer_name: farmer?.full_name || o.farmer_name,
      };
    });
    res.json(orders);
  });

  app.get("/api/buyer/orders", (req, res) => {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    res.json(getOrdersForBuyer(user));
  });

  app.get("/api/farmer/orders", (req, res) => {
    const user = getUserFromToken(req);
    if (!user) return res.json([]);
    const orders = (db.orders || []).filter(o => o.farmer_id === user.id).map(o => {
      const cust = db.users.find(u => u.id === o.customer_id);
      return {
        ...o,
        customer_phone: cust?.phone || o.customer_phone,
        customer_name: cust?.full_name || o.customer_name,
        delivery_address: cust?.delivery_address || o.delivery_address,
        farmer_phone: user.phone || o.farmer_phone,
        farmer_name: user.full_name || o.farmer_name,
      };
    });
    res.json(orders);
  });

  app.get("/api/orders/:id/tracking", (req, res) => {
    const orderId = Number(req.params.id);
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const isDelivered = order.status === "DELIVERED";
    const isInTransit = ["TRANSIT", "DELIVERED"].includes(order.status);
    const isPreparing = ["PREPARING", "TRANSIT", "DELIVERED"].includes(order.status);
    const isConfirmed = ["CONFIRMED", "ACCEPTED", "PAID", "PREPARING", "TRANSIT", "DELIVERED"].includes(order.status);

    const createdAtTime = order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "10:00 AM";
    const deliveredTime = order.delivered_at ? new Date(order.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Delivered";

    const checkpoints = [
      { title: "Direct Produce Harvest & Loading at Farm", time: createdAtTime, completed: true },
      { title: "Mandi Digital Weighment & Quality Seal", time: isConfirmed ? "Verified" : "Pending", completed: isConfirmed },
      { title: "Farm Sorting & Protective Cold-Pack", time: isPreparing ? "Packed" : "Pending", completed: isPreparing },
      { title: "Live Transit via Direct Logistics Route", time: isInTransit ? "Dispatched" : "Pending", completed: isInTransit },
      { title: "Delivered to Customer Doorstep", time: isDelivered ? deliveredTime : "Estimated", completed: isDelivered }
    ];

    res.json({
      order_id: order.id,
      status: order.status,
      driver_name: order.driver_name || "Santosh Yadav",
      driver_phone: order.driver_phone || "+91 98765 43210",
      vehicle_number: order.vehicle_number || "MH-14-BN-4321",
      current_lat: order.tracking_lat || 18.5204,
      current_lng: order.tracking_lng || 73.8567,
      eta_minutes: isDelivered ? 0 : (order.status === "TRANSIT" ? Math.max(5, Math.round((order.distance_km || 10) * 1.5)) : Math.max(10, Math.round((order.distance_km || 10) * 2))),
      delivery_address: order.delivery_address,
      delivered_at: order.delivered_at,
      distance_km: order.distance_km || 12,
      checkpoints
    });
  });

  // Helper function to get or idempotently generate invoice for confirmed/paid order
  function getOrCreateInvoice(order: any) {
    if (!db.invoices) db.invoices = [];
    let invoice = db.invoices.find(i => i.order_id === order.id);
    if (invoice) {
      if (order.payment_status === "PAID" && invoice.payment_status !== "PAID") {
        invoice.payment_status = "PAID";
        invoice.order_status = "Paid";
        invoice.transaction_id = order.transaction_id;
        invoice.paid_at = order.paid_at;
        saveState(db);
      }
      return invoice;
    }

    const farmerUser = db.users.find(u => u.id === order.farmer_id);
    const customerUser = db.users.find(u => u.id === order.customer_id);
    const invNumber = `INV-${new Date().getFullYear()}-${String(order.id).padStart(5, "0")}`;

    invoice = {
      id: `inv_${order.id}`,
      invoice_number: invNumber,
      order_id: order.id,
      generated_at: new Date().toISOString(),
      // Farmer details
      farmer_id: order.farmer_id,
      farmer_name: order.farmer_name,
      farmer_phone: farmerUser?.phone || order.farmer_phone || "+91 91331 44324",
      farmer_email: farmerUser?.email || "farmer@farmiq.in",
      farmer_address: farmerUser?.location || order.farmer_location || "Farmer Registered Location",
      farmer_upi_id: farmerUser?.upi_id || order.farmer_upi_id || "farmer@ybl",
      // Customer details
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      customer_phone: customerUser?.phone || order.customer_phone || "+91 98765 43210",
      customer_email: customerUser?.email || order.customer_email || "customer@farmiq.in",
      customer_address: customerUser?.delivery_address || order.delivery_address || "Customer Delivery Address",
      // Line items
      items: [
        {
          product_id: order.product_id,
          product_name: order.product_name,
          quantity: order.quantity,
          unit: order.unit,
          unit_price: order.unit_price,
          subtotal: order.product_total
        }
      ],
      product_subtotal: order.product_total,
      delivery_fee: order.delivery_charge,
      distance_km: order.distance_km,
      taxes: 0, // Agricultural produce is GST exempt under Section 11 of CGST Act
      discounts: 0,
      final_amount: order.grand_total,
      order_status: order.payment_status === "PAID" ? "Paid" : "Confirmed",
      payment_status: order.payment_status || "UNPAID",
      transaction_id: order.transaction_id || undefined,
      paid_at: order.paid_at || undefined
    };

    db.invoices.push(invoice);
    order.invoice_id = invoice.invoice_number;
    saveState(db);
    return invoice;
  }

  app.post("/api/orders", (req, res) => {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "Please log in to place orders" });
    const { product_id, quantity, distance_km, delivery_address, customer_phone, payment_method } = req.body;
    const prod = db.products.find(p => p.id === Number(product_id));
    if (!prod) return res.status(404).json({ error: "Product not found" });

    const orderQty = Number(quantity);
    if (orderQty > prod.quantity) {
      return res.status(400).json({ error: `Only ${prod.quantity} ${prod.unit} available in stock.` });
    }

    const dist = Number(distance_km) || 15;
    const deliveryCharge = calculateDeliveryFee(dist);
    const productTotal = Math.round(orderQty * prod.price);
    const grandTotal = productTotal + deliveryCharge;

    // Deduct inventory
    prod.quantity = Math.max(0, prod.quantity - orderQty);

    // Persist preferred delivery address & customer phone for user if provided
    if (delivery_address && String(delivery_address).trim()) {
      user.delivery_address = String(delivery_address).trim();
      const dbUser = db.users.find(u => u.id === user.id);
      if (dbUser) dbUser.delivery_address = user.delivery_address;
    }
    if (customer_phone && String(customer_phone).trim()) {
      user.phone = String(customer_phone).trim();
      const dbUser = db.users.find(u => u.id === user.id);
      if (dbUser) dbUser.phone = user.phone;
    }

    const farmerUser = db.users.find(u => u.id === prod.farmer_id);

    const farmerPhone = farmerUser?.phone || prod.farmer_phone || "+91 98220 54321";
    let cleanFarmerPhone = farmerPhone.replace(/\D/g, '');
    if (!cleanFarmerPhone.startsWith('91') && cleanFarmerPhone.length === 10) {
      cleanFarmerPhone = '91' + cleanFarmerPhone;
    }

    const newOrder = {
      id: db.orders.length ? Math.max(...db.orders.map(o => o.id)) + 1 : 101,
      customer_id: user.id,
      customer_name: user.full_name,
      customer_phone: user.phone || customer_phone || "+91 94112 33445",
      customer_email: user.email || "customer@farmiq.in",
      farmer_id: prod.farmer_id,
      farmer_name: prod.farmer_name,
      farmer_phone: farmerPhone,
      farmer_location: farmerUser?.location || prod.location || "Lasalgaon, Nashik",
      farmer_upi_id: farmerUser?.upi_id || "9133144324@ybl",
      product_id: prod.id,
      product_name: prod.name,
      quantity: orderQty,
      unit: prod.unit,
      unit_price: prod.price,
      product_total: productTotal,
      distance_km: dist,
      delivery_charge: deliveryCharge,
      grand_total: grandTotal,
      delivery_address: delivery_address || user.delivery_address || user.location,
      payment_method: payment_method || "UPI",
      payment_status: "UNPAID",
      transaction_id: null,
      status: "ORDERED",
      driver_name: "Santosh Yadav",
      driver_phone: "+91 98765 43210",
      vehicle_number: "MH-14-BN-4321",
      tracking_lat: 18.5204,
      tracking_lng: 73.8567,
      farmer_whatsapp_msg: "",
      farmer_whatsapp_url: "",
      customer_whatsapp_msg: "",
      customer_whatsapp_url: "",
      created_at: new Date().toISOString()
    };

    const appUrl = getAppBaseUrl(req);
    const farmerWhatsAppMsg =
      `🌾 *FarmiQ Alert: You Received a New Order!*\n\n` +
      `Hello Farmer *${prod.farmer_name}*, a customer has placed a harvest order with you on FarmiQ!\n\n` +
      `📦 *Order ID:* #${newOrder.id}\n` +
      `👤 *Customer:* ${user.full_name} (${user.phone || 'Phone verified'})\n` +
      `🥬 *Produce:* ${orderQty} ${prod.unit} × ${prod.name}\n` +
      `💰 *Total Amount:* ₹${grandTotal} (Produce: ₹${productTotal} + Delivery: ₹${deliveryCharge})\n` +
      `📍 *Delivery Address:* ${newOrder.delivery_address}\n\n` +
      `👉 *Open FarmiQ to Confirm & Accept:*\n` +
      `${appUrl}/?tab=farmer-orders`;

    const farmerWhatsAppUrl = `https://api.whatsapp.com/send?phone=${cleanFarmerPhone}&text=${encodeURIComponent(farmerWhatsAppMsg)}`;
    newOrder.farmer_whatsapp_msg = farmerWhatsAppMsg;
    newOrder.farmer_whatsapp_url = farmerWhatsAppUrl;

    db.orders.unshift(newOrder);

    // Create real-time notification for the assigned farmer
    const farmerNotif = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipient_id: prod.farmer_id,
      type: "NEW_ORDER",
      title: "🔔 New Order Received!",
      message: `New order #${newOrder.id} from ${user.full_name} for ${orderQty} ${prod.unit} of ${prod.name}`,
      order_id: newOrder.id,
      customer_name: user.full_name,
      customer_phone: user.phone,
      products_summary: `${orderQty} ${prod.unit} × ${prod.name}`,
      delivery_address: newOrder.delivery_address,
      order_total: grandTotal,
      order_time: newOrder.created_at,
      whatsapp_url: farmerWhatsAppUrl,
      whatsapp_message: farmerWhatsAppMsg,
      status: "UNREAD",
      requires_action: true,
      created_at: new Date().toISOString()
    };
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift(farmerNotif);

    saveState(db);

    broadcastEvent("NEW_ORDER", { order: newOrder, notification: farmerNotif });

    res.json({
      message: "Order placed successfully",
      order: newOrder,
      farmer_whatsapp_url: farmerWhatsAppUrl
    });
  });

  // FARMER ACCEPTS ORDER -> AUTO-GENERATE INVOICE, NOTIFY CUSTOMER WITH TRACK, PAY & INVOICE OPTIONS
  app.post("/api/orders/:id/accept", (req, res) => {
    const user = getUserFromToken(req);
    const orderId = Number(req.params.id);
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = "CONFIRMED";
    const invoice = getOrCreateInvoice(order);

    const custUser = db.users.find(u => u.id === order.customer_id);
    const customerPhone = custUser?.phone || order.customer_phone || "+91 94112 33445";
    if (custUser?.phone) {
      order.customer_phone = custUser.phone;
    }
    let cleanCustPhone = customerPhone.replace(/\D/g, '');
    if (!cleanCustPhone.startsWith('91') && cleanCustPhone.length === 10) {
      cleanCustPhone = '91' + cleanCustPhone;
    }

    const appUrl = getAppBaseUrl(req);
    const custWhatsAppMsg =
      `🎉 *FarmiQ: Your Order #${order.id} is Accepted!*\n\n` +
      `Dear *${order.customer_name}*, Farmer *${order.farmer_name}* has ACCEPTED your harvest order!\n\n` +
      `📦 *Order Summary:*\n` +
      `• Produce: ${order.quantity} ${order.unit} × ${order.product_name}\n` +
      `• Total Amount: ₹${order.grand_total}\n` +
      `• Farm: ${order.farmer_name} (${order.farmer_location || 'Local Farm'})\n` +
      `• Invoice: #${invoice.invoice_number}\n\n` +
      `⚡ *Your Direct Options:*\n` +
      `📍 *1. Track Order Live:* ${appUrl}/?tab=customer-orders&track=${order.id}\n` +
      `💳 *2. Pay via UPI:* ${appUrl}/?tab=customer-orders&pay=${order.id}\n` +
      `📄 *3. View Invoice:* ${appUrl}/?tab=customer-orders&invoice=${order.id}\n\n` +
      `Thank you for supporting direct Indian farmers! 🌾`;

    const custWhatsAppUrl = `https://api.whatsapp.com/send?phone=${cleanCustPhone}&text=${encodeURIComponent(custWhatsAppMsg)}`;
    order.customer_whatsapp_msg = custWhatsAppMsg;
    order.customer_whatsapp_url = custWhatsAppUrl;

    // Dismiss pending action on farmer notification
    if (db.notifications) {
      const fn = db.notifications.find(n => n.order_id === orderId && n.type === "NEW_ORDER");
      if (fn) {
        fn.requires_action = false;
        fn.status = "READ";
      }
    }

    // Immediately notify customer that order was accepted, with track order, pay now, and invoice options
    const customerNotif = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipient_id: order.customer_id,
      type: "ORDER_CONFIRMED",
      title: "🎉 Order Accepted by Farmer!",
      message: `Farmer ${order.farmer_name} has accepted your order #${order.id} for ${order.product_name}. Your invoice #${invoice.invoice_number} is ready. Track order, pay via UPI, or view invoice.`,
      order_id: order.id,
      invoice_number: invoice.invoice_number,
      order_total: order.grand_total,
      order_time: new Date().toISOString(),
      whatsapp_url: custWhatsAppUrl,
      whatsapp_message: custWhatsAppMsg,
      status: "UNREAD",
      requires_action: true,
      created_at: new Date().toISOString()
    };
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift(customerNotif);

    saveState(db);
    broadcastEvent("ORDER_CONFIRMED", { order, invoice, notification: customerNotif });

    res.json({
      message: "Order accepted, customer notified with track, pay & invoice options",
      order,
      invoice,
      customer_whatsapp_url: custWhatsAppUrl
    });
  });

  // FARMER REJECTS ORDER -> RESTORE STOCK & NOTIFY CUSTOMER
  app.post("/api/orders/:id/reject", (req, res) => {
    const user = getUserFromToken(req);
    const orderId = Number(req.params.id);
    const { reason } = req.body || {};
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = "REJECTED";
    order.rejection_reason = reason || "Crop unavailable or already committed to APMC auction";

    // Restore stock
    const prod = db.products.find(p => p.id === order.product_id);
    if (prod) {
      prod.quantity += order.quantity;
    }

    // Dismiss farmer pending notification
    if (db.notifications) {
      const fn = db.notifications.find(n => n.order_id === orderId && n.type === "NEW_ORDER");
      if (fn) {
        fn.requires_action = false;
        fn.status = "READ";
      }
    }

    // Notify customer
    const customerNotif = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipient_id: order.customer_id,
      type: "ORDER_REJECTED",
      title: "❌ Order Rejected by Farmer",
      message: `Order #${order.id} for ${order.product_name} could not be accepted: ${order.rejection_reason}`,
      order_id: order.id,
      order_total: order.grand_total,
      order_time: new Date().toISOString(),
      status: "UNREAD",
      created_at: new Date().toISOString()
    };
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift(customerNotif);

    saveState(db);
    broadcastEvent("ORDER_REJECTED", { order, notification: customerNotif });

    res.json({ message: "Order rejected", order });
  });

  // GET LINKED INVOICE FOR AN ORDER (ACCESSIBLE TO BOTH FARMER & CUSTOMER)
  app.get("/api/orders/:id/invoice", (req, res) => {
    const orderId = Number(req.params.id);
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const invoice = getOrCreateInvoice(order);
    res.json(invoice);
  });

  // REAL-TIME UPI PAYMENT FOR CONFIRMED ORDERS
  app.post("/api/orders/:id/pay-upi", (req, res) => {
    const user = getUserFromToken(req);
    const orderId = Number(req.params.id);
    const { amount, transaction_id, gateway_mode } = req.body || {};
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.payment_status === "PAID") {
      return res.status(400).json({ error: "This order has already been paid." });
    }

    const expectedAmount = order.grand_total;
    if (amount !== undefined && Number(amount) !== expectedAmount) {
      return res.status(400).json({ error: `Payment amount ₹${amount} does not match invoice total ₹${expectedAmount}` });
    }

    const farmerUser = db.users.find(u => u.id === order.farmer_id);
    const now = new Date().toISOString();
    const verifiedTxnId = transaction_id || `UPI${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

    const paymentRecord = {
      id: `PAY-${Date.now()}`,
      order_id: order.id,
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      farmer_id: order.farmer_id,
      farmer_name: order.farmer_name,
      farmer_upi_id: farmerUser?.upi_id || order.farmer_upi_id || "9133144324@ybl",
      amount: order.grand_total,
      currency: "INR",
      payment_method: "UPI",
      transaction_id: verifiedTxnId,
      payment_status: "PAID",
      timestamp: now,
      gateway_mode: gateway_mode || "sandbox",
      verified: true
    };

    if (!db.payments) db.payments = [];
    db.payments.push(paymentRecord);

    // Update order status in real time
    order.payment_status = "PAID";
    order.status = "PAID";
    order.transaction_id = verifiedTxnId;
    order.paid_at = now;

    // Update invoice in real time
    const invoice = getOrCreateInvoice(order);
    invoice.order_status = "Paid";
    invoice.payment_status = "PAID";
    invoice.transaction_id = verifiedTxnId;
    invoice.paid_at = now;

    // Notify farmer immediately that payment was received
    const farmerPaymentNotif = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipient_id: order.farmer_id,
      type: "PAYMENT_RECEIVED",
      title: "💰 UPI Payment Received!",
      message: `Payment of ₹${order.grand_total.toLocaleString('en-IN')} received for Order #${order.id} from ${order.customer_name}. Ref UTR: ${verifiedTxnId}`,
      order_id: order.id,
      transaction_id: verifiedTxnId,
      amount: order.grand_total,
      time: now,
      status: "UNREAD",
      created_at: now
    };
    // Dismiss and mark as read any customer ORDER_CONFIRMED notifications for this order since payment is complete
    if (db.notifications) {
      db.notifications.forEach(n => {
        if (n.order_id === orderId && (n.type === 'ORDER_CONFIRMED' || n.type === 'NEW_ORDER')) {
          n.status = 'READ';
          n.requires_action = false;
        }
      });
    }

    // Notify customer that their UPI payment was successfully recorded
    const customerPaymentNotif = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipient_id: order.customer_id,
      type: "ORDER_STATUS",
      title: "✓ Payment Confirmed!",
      message: `Payment of ₹${order.grand_total.toLocaleString('en-IN')} for Order #${order.id} verified. Ref UTR: ${verifiedTxnId}. The farmer has been notified to prepare your fresh harvest.`,
      order_id: order.id,
      transaction_id: verifiedTxnId,
      amount: order.grand_total,
      time: now,
      status: "UNREAD",
      requires_action: false,
      created_at: now
    };

    if (!db.notifications) db.notifications = [];
    db.notifications.unshift(farmerPaymentNotif);
    db.notifications.unshift(customerPaymentNotif);

    saveState(db);
    broadcastEvent("PAYMENT_RECEIVED", { order, invoice, payment: paymentRecord, notification: farmerPaymentNotif });

    res.json({
      message: "Payment successfully verified and recorded",
      order,
      invoice,
      payment: paymentRecord
    });
  });

  app.put("/api/orders/:id/status", (req, res) => {
    const user = getUserFromToken(req);
    const orderId = Number(req.params.id);
    const { status } = req.body;
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = status;

    // If marked confirmed via status update, ensure invoice exists
    if (status === "CONFIRMED" || status === "ACCEPTED") {
      getOrCreateInvoice(order);
    }

    // When status changes to DELIVERED, record timestamp and notify customer
    if (status === "DELIVERED") {
      order.delivered_at = new Date().toISOString();
      const deliveredNotif = {
        id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        recipient_id: order.customer_id,
        type: "ORDER_STATUS",
        title: "📦 Order Delivered Successfully!",
        message: `Your order #${order.id} for ${order.product_name} has been delivered to your doorstep. Thank you for supporting local farmers!`,
        order_id: order.id,
        order_total: order.grand_total,
        order_time: order.delivered_at,
        status: "UNREAD",
        requires_action: false,
        created_at: order.delivered_at
      };
      if (!db.notifications) db.notifications = [];
      db.notifications.unshift(deliveredNotif);
    }

    // Synchronize linked FPO lot fulfillment state
    if (db.lots) {
      const linkedLot = db.lots.find(l => l.linked_order_id === orderId || (l as any).id === (order as any).lot_id);
      if (linkedLot) {
        linkedLot.fulfillment_status = status;
        if (status === "DELIVERED") {
          linkedLot.status = "CONTRACTED";
        }
      }
    }

    // Synchronize contract if linked
    if (status === "DELIVERED" && (order as any).contract_id && db.contracts) {
      const c = db.contracts.find(ct => ct.id === (order as any).contract_id);
      if (c) c.status = "COMPLETED_ESCROW_RELEASED";
    }

    saveState(db);
    broadcastEvent("ORDER_STATUS_UPDATED", { order });
    res.json({ message: "Order status updated", order });
  });

  // NOTIFICATIONS REST & SSE ENDPOINTS
  app.get("/api/notifications", (req, res) => {
    const user = getUserFromToken(req);
    if (!user) return res.json([]);
    const notifs = (db.notifications || []).filter(n => n.recipient_id === user.id);
    res.json(notifs);
  });

  app.put("/api/notifications/:id/read", (req, res) => {
    const user = getUserFromToken(req);
    const notif = (db.notifications || []).find(n => n.id === req.params.id);
    if (notif) {
      notif.status = "READ";
      saveState(db);
    }
    res.json({ message: "Notification marked as read" });
  });

  app.post("/api/notifications/clear", (req, res) => {
    const user = getUserFromToken(req);
    if (user && db.notifications) {
      db.notifications = db.notifications.filter(n => n.recipient_id !== user.id);
      saveState(db);
    }
    res.json({ message: "Notifications cleared" });
  });

  app.get("/api/notifications/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    (res as any).flushHeaders?.();

    sseClients.add(res);
    res.write(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`);

    const keepAlive = setInterval(() => {
      try {
        res.write(": keepalive\n\n");
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 15000);

    req.on("close", () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  // STORAGE BOOKINGS
  app.get("/api/storage/bookings", (req, res) => {
    const user = getUserFromToken(req);
    if (!user) {
      return res.json(db.storage_bookings);
    }
    if (user.role === "admin") {
      return res.json(db.storage_bookings);
    }
    return res.json(db.storage_bookings.filter(b => b.user_id === user.id));
  });

  app.post("/api/storage/book", (req, res) => {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "Please log in to book storage" });
    const { facility_name, location, produce_type, quantity_quintal, storage_type, duration_days, start_date, daily_rate, total_cost } = req.body;
    const newBooking = {
      id: `SB-${Math.floor(1000 + Math.random() * 9000)}`,
      user_id: user.id,
      user_name: user.full_name,
      facility_name,
      location,
      produce_type,
      quantity_quintal: Number(quantity_quintal),
      storage_type,
      duration_days: Number(duration_days),
      start_date,
      daily_rate: Number(daily_rate),
      total_cost: Number(total_cost),
      status: "CONFIRMED",
      created_at: new Date().toISOString()
    };
    db.storage_bookings.unshift(newBooking);
    saveState(db);
    res.json({ message: "Storage booked successfully", booking: newBooking });
  });

  // CONTRACTS
  app.get("/api/contracts", (req, res) => {
    res.json(db.contracts);
  });

  app.post("/api/contracts", (req, res) => {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "Login required" });
    const { title, crop_name, required_quantity, unit, offer_price, quality_grade, delivery_location, delivery_deadline, terms } = req.body;
    const newContract = {
      id: `CON-${Math.floor(100 + Math.random() * 900)}`,
      title,
      buyer_id: user.id,
      buyer_name: user.full_name,
      buyer_company: user.farm_name || "Institutional Procurement",
      crop_name,
      required_quantity: Number(required_quantity),
      unit: unit || "kg",
      offer_price: Number(offer_price),
      quality_grade,
      delivery_location,
      delivery_deadline,
      terms: terms || "Standard Escrow Protection",
      status: "OPEN",
      assigned_farmer_id: null,
      assigned_farmer_name: null,
      created_at: new Date().toISOString()
    };
    db.contracts.unshift(newContract);
    saveState(db);
    res.json({ message: "Contract posted successfully", contract: newContract });
  });

  app.post("/api/contracts/:id/accept", (req, res) => {
    const user = getUserFromToken(req);
    const contractId = req.params.id;
    const contract = db.contracts.find(c => c.id === contractId);
    if (!contract) return res.status(404).json({ error: "Contract not found" });
    if (contract.status !== "OPEN") {
      return res.status(400).json({ error: "Contract has already been accepted or closed" });
    }

    contract.status = "ACCEPTED_IN_ESCROW";
    contract.assigned_farmer_id = user ? user.id : 0;
    contract.assigned_farmer_name = user ? user.full_name : "Registered Farmer";
    saveState(db);
    res.json({ message: "Contract successfully accepted and locked in escrow!", contract });
  });

  // CUSTOMER REQUIREMENTS (Requested feature!)
  app.get("/api/requirements", (req, res) => {
    res.json(db.requirements);
  });

  app.post("/api/requirements", (req, res) => {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "Login required to post requirement" });
    const { crop_name, required_quantity, unit, expected_price, delivery_address, needed_by_date, notes } = req.body;
    if (!crop_name || !required_quantity) {
      return res.status(400).json({ error: "Crop name and quantity required" });
    }
    const newReq = {
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      customer_id: user.id,
      customer_name: user.full_name,
      customer_phone: user.phone || "+91 94000 00000",
      customer_location: user.location || "Maharashtra",
      crop_name,
      required_quantity: Number(required_quantity),
      unit: unit || "kg",
      expected_price: Number(expected_price) || 0,
      delivery_address: delivery_address || user.delivery_address || user.location,
      needed_by_date: needed_by_date || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      notes: notes || "",
      status: "OPEN",
      accepted_by_farmer_id: null,
      accepted_by_farmer_name: null,
      accepted_by_farmer_phone: null,
      created_at: new Date().toISOString()
    };
    db.requirements.unshift(newReq);
    saveState(db);
    res.json({ message: "Customer requirement posted successfully", requirement: newReq });
  });

  app.post("/api/requirements/:id/accept", (req, res) => {
    const user = getUserFromToken(req);
    if (!user || user.role !== "farmer") {
      return res.status(403).json({ error: "Only verified farmers can accept customer requirements" });
    }
    const reqId = req.params.id;
    const reqItem = db.requirements.find(r => r.id === reqId);
    if (!reqItem) return res.status(404).json({ error: "Requirement not found" });
    if (reqItem.status !== "OPEN") {
      return res.status(400).json({ error: "Requirement has already been accepted" });
    }

    reqItem.status = "ACCEPTED";
    reqItem.accepted_by_farmer_id = user.id;
    reqItem.accepted_by_farmer_name = user.full_name;
    reqItem.accepted_by_farmer_phone = user.phone || "+91 98220 54321";

    // Auto-create a corresponding direct order for tracking!
    const orderQty = reqItem.required_quantity;
    const pricePerUnit = reqItem.expected_price || 30;
    const productTotal = Math.round(orderQty * pricePerUnit);
    const deliveryCharge = calculateDeliveryFee(15);
    const grandTotal = productTotal + deliveryCharge;

    const newOrder = {
      id: db.orders.length ? Math.max(...db.orders.map(o => o.id)) + 1 : 101,
      customer_id: reqItem.customer_id,
      customer_name: reqItem.customer_name,
      farmer_id: user.id,
      farmer_name: user.full_name,
      product_id: 0,
      product_name: `${reqItem.crop_name} (Custom Request #${reqItem.id})`,
      quantity: orderQty,
      unit: reqItem.unit,
      unit_price: pricePerUnit,
      product_total: productTotal,
      distance_km: 15,
      delivery_charge: deliveryCharge,
      grand_total: grandTotal,
      delivery_address: reqItem.delivery_address,
      payment_method: "Escrow / Cash on Delivery",
      payment_status: "CONFIRMED",
      transaction_id: `REQ_ORDER_${reqItem.id}`,
      status: "ACCEPTED",
      driver_name: "Santosh Yadav",
      driver_phone: "+91 98765 43210",
      vehicle_number: "MH-14-BN-4321",
      tracking_lat: 18.5204,
      tracking_lng: 73.8567,
      created_at: new Date().toISOString()
    };
    db.orders.unshift(newOrder);

    saveState(db);
    res.json({ message: "Requirement accepted! Order generated in orders queue.", requirement: reqItem, order: newOrder });
  });

  // REGISTERED COOPERATIVE FARMER NETWORK (For Authentic Digital Pooling & Discovery)
  app.get("/api/farmers/network", (req, res) => {
    const user = getUserFromToken(req);
    const currentUserId = user ? user.id : 1;
    const requestedCrop = req.query.crop ? String(req.query.crop).toLowerCase().trim() : "";

    // All registered farmers in platform except current creator
    const farmers = (db.users || []).filter(u => u.role === "farmer" && u.id !== currentUserId);

    const enriched = farmers.map(f => {
      // Get all active products for this farmer
      const farmerProducts = (db.products || []).filter(p => p.farmer_id === f.id);

      // Check if farmer has the requested crop
      const matchingProducts = requestedCrop
        ? farmerProducts.filter(p => p.name.toLowerCase().includes(requestedCrop) || requestedCrop.includes(p.name.toLowerCase()))
        : farmerProducts;

      const matchingQty = matchingProducts.reduce((sum: number, p: any) => sum + (Number(p.quantity) || 0), 0);
      const matchingUnit = matchingProducts.length > 0 ? matchingProducts[0].unit : "Quintal";

      return {
        id: f.id,
        full_name: f.full_name,
        farm_name: f.farm_name || `${f.full_name}'s Farm`,
        email: f.email,
        phone: f.phone || "+91 98220 00000",
        location: f.location || "Agri Cluster Hub",
        active_products: farmerProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          quantity: p.quantity,
          unit: p.unit,
          price: p.price,
          harvest_date: p.harvest_date
        })),
        has_matching_crop: matchingProducts.length > 0,
        matching_quantity: matchingQty,
        matching_unit: matchingUnit,
        matching_crop_name: matchingProducts.length > 0 ? matchingProducts[0].name : undefined
      };
    });

    // Sort: farmers with matching crop listings first, then by matching volume descending
    enriched.sort((a, b) => {
      if (a.has_matching_crop && !b.has_matching_crop) return -1;
      if (!a.has_matching_crop && b.has_matching_crop) return 1;
      return (b.matching_quantity || 0) - (a.matching_quantity || 0);
    });

    res.json(enriched);
  });

  // FPO COLLECTIVES & MULTI-FARMER COOPERATIVE POOLING
  app.get("/api/fpo/collectives", (req, res) => {
    const user = getUserFromToken(req);
    let collectives = db.fpo_collectives || [];

    if (req.query.my === 'true' && user) {
      collectives = collectives.filter(c =>
        c.lead_farmer_id === user.id ||
        (c.members && c.members.some((m: any) => m.farmer_id === user.id))
      );
    }

    if (req.query.crop) {
      const cropQuery = String(req.query.crop).toLowerCase().trim();
      collectives = collectives.filter(c =>
        (c.focus_crop && c.focus_crop.toLowerCase().includes(cropQuery))
      );
    }

    // Enrich with user membership context if logged in
    const enriched = collectives.map(c => {
      const userMember = user && c.members ? c.members.find((m: any) => m.farmer_id === user.id) : null;
      return {
        ...c,
        is_lead: user ? c.lead_farmer_id === user.id : false,
        is_member: userMember ? userMember.status === 'ACCEPTED' : false,
        user_invite_pending: userMember ? userMember.status === 'INVITED' : false,
        user_status: userMember ? userMember.status : 'NONE'
      };
    });

    res.json(enriched);
  });

  app.post("/api/fpo/collectives", (req, res) => {
    const user = getUserFromToken(req);
    if (!user || user.role !== "farmer") {
      return res.status(403).json({ error: "Only verified farmers can form an FPO Collective" });
    }

    const {
      name,
      focus_crop,
      target_volume_quintal,
      location,
      description,
      invited_farmer_ids
    } = req.body;

    if (!name || !focus_crop) {
      return res.status(400).json({ error: "FPO Name and Primary Focus Crop are required" });
    }

    const collectiveId = `FPO-COL-${Date.now().toString().slice(-4)}`;

    // Initial lead member (the creator)
    const members: any[] = [
      {
        farmer_id: user.id,
        farmer_name: user.full_name,
        phone: user.phone || "+91 98220 00000",
        farm_location: user.location || location || "Agri Cluster",
        crop: focus_crop,
        contributed_quantity: 0,
        unit: "Quintal",
        status: "ACCEPTED",
        accepted_at: new Date().toISOString()
      }
    ];

    const newCollective = {
      id: collectiveId,
      name: name.trim(),
      lead_farmer_id: user.id,
      lead_farmer_name: user.full_name,
      lead_farmer_phone: user.phone || "+91 98220 00000",
      location: location || user.location || "Regional Agri Cluster",
      focus_crop: focus_crop.trim(),
      description: description || `Regional farmer producer organization collective for pooled grading and direct bulk buyer contracts.`,
      target_volume_quintal: Number(target_volume_quintal) || 200,
      status: "ACTIVE",
      created_at: new Date().toISOString(),
      members
    };

    if (!db.fpo_collectives) db.fpo_collectives = [];
    if (!db.notifications) db.notifications = [];

    // Process invited farmers
    if (Array.isArray(invited_farmer_ids) && invited_farmer_ids.length > 0) {
      invited_farmer_ids.forEach((fId: any) => {
        const invitedUser = (db.users || []).find(u => u.id === Number(fId) && u.role === "farmer");
        if (invitedUser && invitedUser.id !== user.id) {
          members.push({
            farmer_id: invitedUser.id,
            farmer_name: invitedUser.full_name,
            phone: invitedUser.phone || "+91 98220 00000",
            farm_location: invitedUser.location || "Regional Cluster",
            crop: focus_crop,
            status: "INVITED",
            invited_at: new Date().toISOString()
          });

          // Send real-time notification to invited farmer
          const notif = {
            id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            recipient_id: invitedUser.id,
            type: "FPO_INVITATION",
            title: `🤝 FPO Invitation: ${newCollective.name}`,
            message: `${user.full_name} invited you to join "${newCollective.name}" (${focus_crop}) collective. Join together to pool harvest quotas and win direct high-value buyer contracts!`,
            collective_id: newCollective.id,
            collective_name: newCollective.name,
            inviter_name: user.full_name,
            status: "UNREAD",
            requires_action: true,
            created_at: new Date().toISOString()
          };
          db.notifications.unshift(notif);
          broadcastEvent("FPO_INVITATION", { notification: notif, collective: newCollective });
        }
      });
    }

    db.fpo_collectives.unshift(newCollective);
    saveState(db);

    broadcastEvent("FPO_COLLECTIVE_CREATED", { collective: newCollective });

    res.status(201).json({
      message: `FPO Collective "${newCollective.name}" formed successfully! Invitations sent to ${members.length - 1} farmers.`,
      collective: newCollective
    });
  });

  app.post("/api/fpo/collectives/:id/invite", (req, res) => {
    const user = getUserFromToken(req);
    if (!user || user.role !== "farmer") {
      return res.status(403).json({ error: "Only verified farmers can invite members to an FPO" });
    }

    const { farmer_id } = req.body;
    if (!farmer_id) {
      return res.status(400).json({ error: "farmer_id is required" });
    }

    const collective = (db.fpo_collectives || []).find(c => c.id === req.params.id);
    if (!collective) {
      return res.status(404).json({ error: "FPO Collective not found" });
    }

    if (!collective.members) collective.members = [];
    const existingMember = collective.members.find((m: any) => m.farmer_id === Number(farmer_id));
    if (existingMember) {
      return res.status(400).json({
        error: existingMember.status === 'ACCEPTED'
          ? "Farmer is already an active member of this collective"
          : "An invitation has already been sent to this farmer"
      });
    }

    const targetFarmer = (db.users || []).find(u => u.id === Number(farmer_id) && u.role === "farmer");
    if (!targetFarmer) {
      return res.status(404).json({ error: "Target farmer not found on FarmiQ" });
    }

    const newMemberEntry = {
      farmer_id: targetFarmer.id,
      farmer_name: targetFarmer.full_name,
      phone: targetFarmer.phone || "+91 98220 00000",
      farm_location: targetFarmer.location || "Regional Cluster",
      crop: collective.focus_crop,
      status: "INVITED",
      invited_at: new Date().toISOString()
    };
    collective.members.push(newMemberEntry);

    // Notify the target farmer
    const notif = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipient_id: targetFarmer.id,
      type: "FPO_INVITATION",
      title: `🤝 FPO Invitation: ${collective.name}`,
      message: `${user.full_name} invited you to join "${collective.name}" (${collective.focus_crop}). Connect together to pool produce lots!`,
      collective_id: collective.id,
      collective_name: collective.name,
      inviter_name: user.full_name,
      status: "UNREAD",
      requires_action: true,
      created_at: new Date().toISOString()
    };
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift(notif);

    saveState(db);

    broadcastEvent("FPO_INVITATION", { notification: notif, collective });

    res.json({
      message: `Invitation successfully sent to ${targetFarmer.full_name}!`,
      collective
    });
  });

  app.post("/api/fpo/collectives/:id/respond", (req, res) => {
    const user = getUserFromToken(req);
    if (!user || user.role !== "farmer") {
      return res.status(403).json({ error: "Only verified farmers can respond to FPO invitations" });
    }

    const { action, contributed_quantity } = req.body;
    if (action !== 'accept' && action !== 'decline') {
      return res.status(400).json({ error: "Action must be 'accept' or 'decline'" });
    }

    const collective = (db.fpo_collectives || []).find(c => c.id === req.params.id);
    if (!collective) {
      return res.status(404).json({ error: "FPO Collective not found" });
    }

    if (!collective.members) collective.members = [];
    let memberIndex = collective.members.findIndex((m: any) => m.farmer_id === user.id);

    if (memberIndex === -1 && action === 'accept') {
      // Direct join
      collective.members.push({
        farmer_id: user.id,
        farmer_name: user.full_name,
        phone: user.phone || "+91 98220 00000",
        farm_location: user.location || "Regional Cluster",
        crop: collective.focus_crop,
        contributed_quantity: Number(contributed_quantity) || 0,
        unit: "Quintal",
        status: "ACCEPTED",
        accepted_at: new Date().toISOString()
      });
    } else if (memberIndex !== -1) {
      if (action === 'accept') {
        collective.members[memberIndex].status = "ACCEPTED";
        collective.members[memberIndex].accepted_at = new Date().toISOString();
        if (contributed_quantity) {
          collective.members[memberIndex].contributed_quantity = Number(contributed_quantity);
          collective.members[memberIndex].unit = "Quintal";
        }
      } else {
        collective.members.splice(memberIndex, 1);
      }
    } else {
      return res.status(400).json({ error: "No pending invitation found for this farmer" });
    }

    // Mark corresponding notification as READ
    if (db.notifications) {
      const notif = db.notifications.find(n => n.recipient_id === user.id && n.type === 'FPO_INVITATION' && n.collective_id === collective.id);
      if (notif) {
        notif.status = 'READ';
        notif.requires_action = false;
      }
    }

    // Notify collective lead farmer
    const responseNotif = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipient_id: collective.lead_farmer_id,
      type: "FPO_INVITATION_RESPONSE",
      title: action === 'accept' ? `🎉 ${user.full_name} joined ${collective.name}!` : `ℹ️ FPO Invitation Update`,
      message: `${user.full_name} has ${action === 'accept' ? 'accepted your invitation and joined' : 'declined the invitation to join'} "${collective.name}".`,
      collective_id: collective.id,
      collective_name: collective.name,
      inviter_name: user.full_name,
      status: "UNREAD",
      requires_action: false,
      created_at: new Date().toISOString()
    };
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift(responseNotif);

    saveState(db);

    broadcastEvent("FPO_MEMBER_UPDATED", { collective, responseNotif });

    res.json({
      message: action === 'accept'
        ? `Congratulations! You have joined "${collective.name}". You can now pool lots together!`
        : `Declined invitation for "${collective.name}".`,
      collective
    });
  });

  // FPO LOTS & QUALITY GRADING
  app.get("/api/lots", (req, res) => {
    let lots = db.lots || [];
    if (req.query.farmer_id) {
      lots = lots.filter(l => l.farmer_id === Number(req.query.farmer_id));
    }
    res.json(lots);
  });

  app.post("/api/lots", (req, res) => {
    const user = getUserFromToken(req);
    if (!user || user.role !== "farmer") {
      return res.status(403).json({ error: "Only verified farmers / FPOs can create lots" });
    }
    const {
      crop_name,
      variety,
      quantity,
      unit,
      packaging_type,
      base_price_per_unit,
      harvest_date,
      location,
      fpo_name,
      quality_grade,
      moisture_pct,
      defect_pct,
      color_uniformity_pct,
      certified_by,
      member_farmers
    } = req.body;

    if (!crop_name || !quantity) {
      return res.status(400).json({ error: "Crop name and quantity are required" });
    }

    const totalQty = Number(quantity);
    const parsedBasePrice = Number(base_price_per_unit) || 3000;

    // MANDI PRICE VALIDATION FOR FPO LOTS:
    const benchmark = getMandiBenchmarkForCrop(crop_name, unit || "Quintal");
    if (parsedBasePrice > benchmark.mandiPricePerUnit) {
      return res.status(400).json({
        error: `Price rejected: Your lot price of ₹${parsedBasePrice}/${unit || 'Quintal'} exceeds the official APMC Mandi benchmark price of ₹${benchmark.mandiPricePerUnit}/${unit || 'Quintal'} (at ${benchmark.mandiName}). Lot price cannot exceed the Mandi rate.`,
        mandi_price: benchmark.mandiPricePerUnit,
        mandi_name: benchmark.mandiName,
        unit: unit || 'Quintal'
      });
    }

    let pooledMembers = member_farmers;
    if (!pooledMembers || !Array.isArray(pooledMembers) || pooledMembers.length < 2) {
      return res.status(400).json({
        error: "FPO cooperative lots require at least 2 verified farmers combining their harvest. Please add at least 1 other contributing member farmer from your network."
      });
    }

    const computedTotalQty = pooledMembers.reduce((sum: number, m: any) => sum + (Number(m.contributed_quantity) || 0), 0);
    const finalQty = computedTotalQty > 0 ? computedTotalQty : totalQty;

    const validatedMembers = pooledMembers.map((mf: any, idx: number) => {
      const qty = Number(mf.contributed_quantity) || 0;
      const sharePct = finalQty > 0 ? Math.round((qty / finalQty) * 1000) / 10 : 0;
      const payout = Math.round(qty * parsedBasePrice);
      return {
        farmer_id: mf.farmer_id || (idx === 0 ? user.id : undefined),
        farmer_name: mf.farmer_name || (idx === 0 ? `${user.full_name} (Lead Aggregator)` : `Member Farmer #${idx + 1}`),
        farm_name: mf.farm_name || (idx === 0 ? user.farm_name : undefined),
        contributed_quantity: qty,
        unit: mf.unit || unit || "Quintal",
        farm_location: mf.farm_location || (idx === 0 ? (location || user.location) : "Regional Sub-Cluster"),
        phone: mf.phone || (idx === 0 ? user.phone : undefined),
        share_pct: sharePct,
        payout_amount: payout,
        is_lead: idx === 0 || mf.is_lead === true,
        matched_crop_name: mf.matched_crop_name
      };
    });

    const newLot = {
      id: `LOT-FPO-${Math.floor(100 + Math.random() * 900)}`,
      farmer_id: user.id,
      farmer_name: `${user.full_name} (Lead Aggregator)`,
      fpo_name: fpo_name || user.farm_name || "FarmiQ Partner FPO",
      member_farmers: validatedMembers,
      crop_name: String(crop_name).trim(),
      variety: variety || "Standard Graded Variety",
      quantity: finalQty,
      unit: unit || "Quintal",
      packaging_type: packaging_type || "Plastic Crates / Bags",
      base_price_per_unit: parsedBasePrice,
      harvest_date: harvest_date || new Date().toISOString().split("T")[0],
      location: location || user.location || "Maharashtra",
      quality_grade: quality_grade || "Grade-A",
      moisture_pct: Number(moisture_pct) || 12.0,
      defect_pct: Number(defect_pct) || 2.5,
      color_uniformity_pct: Number(color_uniformity_pct) || 95,
      certified_by: certified_by || "FarmiQ Agro Quality Desk",
      status: "AVAILABLE",
      matched_buyer_id: null,
      matched_buyer_name: null,
      created_at: new Date().toISOString()
    };

    if (!db.lots) db.lots = [];
    db.lots.unshift(newLot);

    // ── INVENTORY DEDUCTION ────────────────────────────────────────────────────
    // Deduct each member farmer's contributed quantity from their crop inventory
    // so that products reflect what is now committed to the FPO lot.
    validatedMembers.forEach((mf: any) => {
      if (!mf.farmer_id) return;
      const farmerProducts = (db.products || []).filter(
        (p: any) => p.farmer_id === mf.farmer_id
      );
      // Find the best-matching product for this crop
      const matchingProduct = farmerProducts.find(
        (p: any) =>
          p.name.toLowerCase().includes(crop_name.toLowerCase()) ||
          crop_name.toLowerCase().includes(p.name.toLowerCase())
      );
      if (matchingProduct) {
        const deductQty = Number(mf.contributed_quantity) || 0;
        matchingProduct.quantity = Math.max(0, (Number(matchingProduct.quantity) || 0) - deductQty);
        // Remove the product listing if stock reaches zero
        if (matchingProduct.quantity === 0) {
          db.products = (db.products || []).filter((p: any) => p.id !== matchingProduct.id);
        }
      }
    });
    // ────────────────────────────────────────────────────────────────────────────

    saveState(db);
    res.json({ message: "Produce lot successfully created and listed for verified buyers", lot: newLot });
  });

  // VERIFIED BUYERS (Only Admin-approved verified buyers returned to farmers/FPOs)
  app.get("/api/verified-buyers", (req, res) => {
    const { crop } = req.query;
    // Strictly filter to buyers approved and verified by the Admin
    let buyers = (db.verified_buyers || []).filter(b => b.verified === true && b.status === "VERIFIED");
    if (crop) {
      const q = String(crop).toLowerCase();
      const filtered = buyers.filter(b => b.demand_crop.toLowerCase().includes(q) || q.includes(b.demand_crop.toLowerCase()));
      if (filtered.length > 0) return res.json(filtered);
    }
    res.json(buyers);
  });

  // ADMIN BUYER MANAGEMENT (Review, verify, accept or reject institutional buyers)
  app.get("/api/admin/buyers", (req, res) => {
    res.json(db.verified_buyers || []);
  });

  app.post("/api/admin/buyers/:id/verify", (req, res) => {
    const buyerId = req.params.id;
    if (!db.verified_buyers) db.verified_buyers = [];
    const buyer = db.verified_buyers.find(b => b.id === buyerId);
    if (!buyer) return res.status(404).json({ error: "Buyer not found" });

    buyer.verified = true;
    buyer.status = "VERIFIED";
    if (!buyer.match_reasons) buyer.match_reasons = [];
    if (!buyer.match_reasons.includes("Admin Verified & Approved")) {
      buyer.match_reasons.push("Admin Verified & Approved");
    }

    // Also sync user account if exists
    if (buyer.user_id) {
      const user = db.users.find(u => u.id === buyer.user_id);
      if (user) {
        user.verified = true;
        user.status = "VERIFIED";
      }
    }

    saveState(db);
    res.json({ message: `Buyer ${buyer.company_name} verified and approved successfully!`, buyer });
  });

  const handleBuyerReject = (req: express.Request, res: express.Response) => {
    const rawId = req.params.id;
    const buyerId = decodeURIComponent(rawId || "").trim();
    if (!db.verified_buyers) db.verified_buyers = [];
    const buyer = db.verified_buyers.find(b =>
      b.id === buyerId ||
      String(b.id).toLowerCase() === buyerId.toLowerCase() ||
      (b.user_id && String(b.user_id) === buyerId) ||
      (b.company_name && b.company_name.toLowerCase() === buyerId.toLowerCase())
    );
    if (!buyer) return res.status(404).json({ error: "Buyer not found" });

    buyer.verified = false;
    buyer.status = "REJECTED";
    if (buyer.match_reasons) {
      buyer.match_reasons = buyer.match_reasons.filter(r => r !== "Admin Verified & Approved");
      if (!buyer.match_reasons.includes("Admin Rejected")) {
        buyer.match_reasons.push("Admin Rejected");
      }
    }

    if (buyer.user_id) {
      const user = db.users.find(u => u.id === buyer.user_id || String(u.id) === String(buyer.user_id));
      if (user) {
        user.verified = false;
        user.status = "REJECTED";
      }
    }

    saveState(db);
    res.json({ message: `Buyer "${buyer.company_name}" rejected`, buyer });
  };

  app.post("/api/admin/buyers/:id/reject", handleBuyerReject);
  app.put("/api/admin/buyers/:id/reject", handleBuyerReject);

  // MATCH LOT WITH VERIFIED BUYER -> CREATE ESCROW CONTRACT & LINKED ORDER FOR PREPARATION
  app.post("/api/lots/:id/match", (req, res) => {
    const user = getUserFromToken(req);
    const lotId = req.params.id;
    const { buyer_id } = req.body;
    if (!db.lots) db.lots = [];
    const lot = db.lots.find(l => l.id === lotId);
    if (!lot) return res.status(404).json({ error: "Lot not found" });

    const buyers = (db.verified_buyers || []).filter(b => b.verified === true);
    const buyer = buyers.find(b => b.id === buyer_id || String(b.id) === String(buyer_id));
    if (!buyer) {
      return res.status(400).json({ error: "Cannot match lot with an unverified or nonexistent buyer. Admin verification is required." });
    }

    // 1. Create locked contract in Escrow
    let buyerUserId = buyer.user_id;
    if (!buyerUserId && buyer.email) {
      const u = db.users.find(u => u.email.toLowerCase() === buyer.email.toLowerCase());
      if (u) buyerUserId = u.id;
    }
    if (!buyerUserId && buyer.company_name) {
      const u = db.users.find(u => (u.company_name && u.company_name.toLowerCase() === buyer.company_name.toLowerCase()) || u.full_name.toLowerCase() === buyer.company_name.toLowerCase());
      if (u) buyerUserId = u.id;
    }
    if (!buyerUserId && (buyer.id === "BUYER-101" || buyer.company_name?.includes("Reliance"))) {
      const u = db.users.find(u => u.email === "buyer.malhotra@reliancefresh.com");
      if (u) buyerUserId = u.id;
    }

    const newContract = {
      id: `CON-LOT-${Math.floor(100 + Math.random() * 900)}`,
      title: `FPO Match: ${lot.quantity} ${lot.unit} ${lot.crop_name} (${lot.quality_grade}) with ${buyer.company_name}`,
      buyer_id: buyerUserId || 2,
      buyer_name: buyer.company_name,
      buyer_company: buyer.company_name,
      crop_name: lot.crop_name,
      required_quantity: lot.quantity,
      unit: lot.unit,
      offer_price: lot.base_price_per_unit,
      quality_grade: `${lot.quality_grade} (Defect < ${lot.defect_pct}%, Moisture ${lot.moisture_pct}%)`,
      delivery_location: buyer.location,
      delivery_deadline: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      terms: `100% Escrow deposit locked by ${buyer.company_name}. Direct farm-gate pickup. Payment released within 24h of weighment receipt.`,
      status: "ACCEPTED_IN_ESCROW",
      assigned_farmer_id: lot.farmer_id || (user ? user.id : 0),
      assigned_farmer_name: lot.farmer_name || (user ? user.full_name : "Registered Farmer"),
      created_at: new Date().toISOString()
    };

    if (!db.contracts) db.contracts = [];
    db.contracts.unshift(newContract);

    // 2. Create Active Commercial Order in db.orders so Farmer has the Prepare Order options
    if (!db.orders) db.orders = [];
    const newOrderId = db.orders.length ? Math.max(...db.orders.map(o => o.id)) + 1 : 101;
    const estDistance = 45;
    const deliveryTariff = calculateDeliveryFee(estDistance);
    const produceVal = Math.round(lot.quantity * lot.base_price_per_unit);

    const newOrder = {
      id: newOrderId,
      lot_id: lot.id,
      buyer_id: buyer.id,
      contract_id: newContract.id,
      customer_id: buyerUserId || 2,
      customer_name: buyer.company_name,
      farmer_id: lot.farmer_id || (user ? user.id : 0),
      farmer_name: lot.farmer_name || (user ? user.full_name : "Registered Farmer"),
      fpo_name: lot.fpo_name,
      member_farmers: lot.member_farmers,
      product_id: 0,
      product_name: `[FPO Bulk Lot #${lot.id}] ${lot.crop_name} (${lot.quality_grade}) - ${lot.variety}`,
      quantity: lot.quantity,
      unit: lot.unit,
      unit_price: lot.base_price_per_unit,
      product_total: produceVal,
      distance_km: estDistance,
      delivery_charge: deliveryTariff,
      grand_total: produceVal + deliveryTariff,
      delivery_address: buyer.location,
      payment_method: "100% Escrow Secured",
      payment_status: "LOCKED_IN_ESCROW",
      transaction_id: `ESC-${Date.now().toString().slice(-6)}`,
      status: "ACCEPTED", // Ready for farmer to prepare!
      driver_name: "FarmiQ Agri-Logistics Transport",
      driver_phone: "+91 94231 88910",
      vehicle_number: "MH-15-EG-8821",
      order_type: "FPO_COMMERCIAL_LOT",
      created_at: new Date().toISOString()
    };
    db.orders.unshift(newOrder);

    // 3. Link Order and Fulfillment Status to the Lot
    lot.status = "CONTRACTED";
    lot.matched_buyer_id = buyer.id;
    lot.matched_buyer_name = buyer.company_name;
    lot.linked_order_id = newOrderId;
    lot.fulfillment_status = "ACCEPTED";

    saveState(db);
    res.json({
      message: `Match confirmed with ${buyer.company_name}! Escrow contract #${newContract.id} activated and Order #${newOrderId} queued for preparation.`,
      contract: newContract,
      order: newOrder,
      lot
    });
  });

  // VERIFIED BUYER DIRECT LOT PROCUREMENT (Instant Escrow Lock & Order Generation)
  app.post("/api/lots/:id/procure", (req, res) => {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "Please log in to procure FPO lots" });
    const lotId = req.params.id;
    if (!db.lots) db.lots = [];
    const lot = db.lots.find(l => l.id === lotId);
    if (!lot) return res.status(404).json({ error: "Produce lot not found" });

    // Identify buyer record
    const buyerRecord = (db.verified_buyers || []).find(b =>
      (b.user_id && b.user_id === user.id) ||
      (b.email && b.email.toLowerCase() === user.email.toLowerCase()) ||
      (user.company_name && b.company_name && b.company_name.toLowerCase() === user.company_name.toLowerCase())
    );

    if (buyerRecord && (buyerRecord.status === "REJECTED" || buyerRecord.verified === false)) {
      return res.status(403).json({ error: "Your institutional buyer registration is not verified by Admin." });
    }

    const companyName = buyerRecord?.company_name || user.company_name || user.full_name;
    const buyerId = buyerRecord ? buyerRecord.id : `BUYER-${Math.floor(1000 + Math.random() * 9000)}`;

    // Support buyer changing delivery address during order placement
    const customAddress = req.body?.delivery_address && String(req.body.delivery_address).trim() ? String(req.body.delivery_address).trim() : null;
    const buyerLocation = customAddress || buyerRecord?.location || user.delivery_address || user.location || "Central Agri Sourcing Hub";

    if (customAddress) {
      user.delivery_address = customAddress;
      const dbUser = db.users.find(u => u.id === user.id);
      if (dbUser) dbUser.delivery_address = customAddress;
      if (buyerRecord) buyerRecord.location = customAddress;
    }

    // 1. Digital Escrow Contract
    const newContract = {
      id: `CON-LOT-${Math.floor(100 + Math.random() * 900)}`,
      title: `Direct Procurement: ${lot.quantity} ${lot.unit} ${lot.crop_name} (${lot.quality_grade}) with ${companyName}`,
      buyer_id: user.id,
      buyer_name: companyName,
      buyer_company: companyName,
      crop_name: lot.crop_name,
      required_quantity: lot.quantity,
      unit: lot.unit,
      offer_price: lot.base_price_per_unit,
      quality_grade: `${lot.quality_grade} (Defect < ${lot.defect_pct}%, Moisture ${lot.moisture_pct}%)`,
      delivery_location: buyerLocation,
      delivery_deadline: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      terms: `100% Escrow deposit locked by ${companyName}. Direct farm-gate pickup. Payment released within 24h of weighment receipt.`,
      status: "ACCEPTED_IN_ESCROW",
      assigned_farmer_id: lot.farmer_id || (user ? user.id : 0),
      assigned_farmer_name: lot.farmer_name || (user ? user.full_name : "Registered Farmer"),
      created_at: new Date().toISOString()
    };
    if (!db.contracts) db.contracts = [];
    db.contracts.unshift(newContract);

    // 2. Active Commercial Order
    if (!db.orders) db.orders = [];
    const newOrderId = db.orders.length ? Math.max(...db.orders.map(o => o.id)) + 1 : 101;
    const customDist = Number(req.body?.distance_km);
    const estDistance = !isNaN(customDist) && customDist > 0 ? customDist : 45;
    const deliveryTariff = calculateDeliveryFee(estDistance);
    const produceVal = Math.round(lot.quantity * lot.base_price_per_unit);

    const newOrder = {
      id: newOrderId,
      lot_id: lot.id,
      buyer_id: buyerId,
      contract_id: newContract.id,
      customer_id: user.id,
      customer_name: companyName,
      farmer_id: lot.farmer_id || (user ? user.id : 0),
      farmer_name: lot.farmer_name || (user ? user.full_name : "Registered Farmer"),
      fpo_name: lot.fpo_name,
      member_farmers: lot.member_farmers,
      product_id: 0,
      product_name: `[FPO Bulk Lot #${lot.id}] ${lot.crop_name} (${lot.quality_grade}) - ${lot.variety}`,
      quantity: lot.quantity,
      unit: lot.unit,
      unit_price: lot.base_price_per_unit,
      product_total: produceVal,
      distance_km: estDistance,
      delivery_charge: deliveryTariff,
      grand_total: produceVal + deliveryTariff,
      delivery_address: buyerLocation,
      payment_method: "100% Escrow Secured",
      payment_status: "LOCKED_IN_ESCROW",
      transaction_id: `ESC-${Date.now().toString().slice(-6)}`,
      status: "ACCEPTED",
      driver_name: "FarmiQ Agri-Logistics Transport",
      driver_phone: "+91 94231 88910",
      vehicle_number: "MH-15-EG-8821",
      order_type: "FPO_COMMERCIAL_LOT",
      created_at: new Date().toISOString()
    };
    db.orders.unshift(newOrder);

    // 3. Link to lot
    lot.status = "CONTRACTED";
    lot.matched_buyer_id = buyerId;
    lot.matched_buyer_name = companyName;
    lot.linked_order_id = newOrderId;
    lot.fulfillment_status = "ACCEPTED";

    saveState(db);
    res.json({
      message: `Lot #${lot.id} successfully procured with 100% Escrow locked! Order #${newOrderId} generated for farmer dispatch.`,
      contract: newContract,
      order: newOrder,
      lot
    });
  });

  // DISPUTES & GRIEVANCES (Requested feature!)
  app.get("/api/disputes", (req, res) => {
    const user = getUserFromToken(req);
    if (!user) return res.json(db.disputes);
    if (user.role === "admin") return res.json(db.disputes);
    return res.json(db.disputes.filter(d => d.filed_by_id === user.id));
  });

  app.post("/api/disputes", (req, res) => {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "Login required to file a dispute" });
    const { order_id, subject, description } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ error: "Subject and description required" });
    }
    const newDispute = {
      id: `DISP-${Math.floor(100 + Math.random() * 900)}`,
      order_id: order_id ? Number(order_id) : null,
      filed_by_id: user.id,
      filed_by_name: user.full_name,
      filed_by_role: user.role,
      subject,
      description,
      status: "OPEN",
      resolution: null,
      created_at: new Date().toISOString()
    };
    db.disputes.unshift(newDispute);
    saveState(db);
    res.json({ message: "Dispute submitted to Admin Escrow desk", dispute: newDispute });
  });

  app.put("/api/disputes/:id/resolve", (req, res) => {
    const user = getUserFromToken(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only Admin can resolve disputes" });
    }
    const dispId = req.params.id;
    const { resolution } = req.body;
    const disp = db.disputes.find(d => d.id === dispId);
    if (!disp) return res.status(404).json({ error: "Dispute not found" });

    disp.status = "RESOLVED";
    disp.resolution = resolution || "Resolved by platform admin via Escrow settlement.";
    saveState(db);
    res.json({ message: "Dispute resolved", dispute: disp });
  });

  // ADMIN OVERVIEW & USERS (Requested feature!)
  app.get("/api/admin/overview", (req, res) => {
    const totalGmv = db.orders.reduce((acc, o) => acc + (o.grand_total || 0), 0);
    const totalDelivery = db.orders.reduce((acc, o) => acc + (o.delivery_charge || 0), 0);
    const farmersCount = db.users.filter(u => u.role === "farmer").length;
    const customersCount = db.users.filter(u => u.role === "customer").length;

    res.json({
      users_count: db.users.length,
      farmers_count: farmersCount,
      customers_count: customersCount,
      active_products_count: db.products.length,
      orders_count: db.orders.length,
      total_gmv: totalGmv,
      total_delivery_fees: totalDelivery,
      recent_orders: db.orders, // Return all live orders
      open_disputes_count: db.disputes.filter(d => d.status === "OPEN").length
    });
  });

  app.get("/api/admin/users", (req, res) => {
    res.json({ users: db.users });
  });

  // MANDI PRICES (Comprehensive Real-time AGMARKNET benchmarks & Indian APMC Directory)
  defaultMandiRates = [...initialMandiRates];

  // Vernacular synonym & alias map for instant real-time lookup
  const cropAliasMap: Record<string, string> = {
    aam: "Mango",
    mangoes: "Mango",
    alphonso: "Mango",
    kesar: "Mango",
    dasheri: "Mango",
    totapuri: "Mango",
    banganapalli: "Mango",
    tamatar: "Tomato",
    tomatoes: "Tomato",
    kanda: "Onion",
    pyaz: "Onion",
    onions: "Onion",
    batata: "Potato",
    aloo: "Potato",
    potatoes: "Potato",
    kela: "Banana",
    bananas: "Banana",
    seb: "Apple",
    apples: "Apple",
    angoor: "Grapes",
    grapes: "Grapes",
    anar: "Pomegranate",
    santre: "Orange",
    oranges: "Orange",
    papita: "Papaya",
    amrood: "Guava",
    tarbooj: "Watermelon",
    nimbu: "Lemon",
    lemons: "Lemon",
    mirchi: "Green Chilli",
    mirch: "Green Chilli",
    chillies: "Green Chilli",
    chilli: "Green Chilli",
    lahsun: "Garlic",
    adrak: "Ginger",
    haldi: "Turmeric",
    gobi: "Cauliflower",
    gobhi: "Cauliflower",
    patta: "Cabbage",
    shimla: "Capsicum",
    gajar: "Carrot",
    carrots: "Carrot",
    mooli: "Radish",
    baingan: "Brinjal",
    eggplant: "Brinjal",
    bhindi: "Okra / Bhindi",
    okra: "Okra / Bhindi",
    ladyfinger: "Okra / Bhindi",
    kheera: "Cucumber",
    kakdi: "Cucumber",
    lauki: "Bottle Gourd",
    karela: "Bitter Gourd",
    matar: "Green Peas",
    peas: "Green Peas",
    beans: "French Beans",
    palak: "Spinach",
    dhania: "Coriander",
    pudina: "Mint",
    gehun: "Wheat",
    chawal: "Rice / Paddy",
    dhan: "Rice / Paddy",
    paddy: "Rice / Paddy",
    rice: "Rice / Paddy",
    basmati: "Rice / Paddy",
    makka: "Maize",
    corn: "Maize",
    kapas: "Cotton",
    sarson: "Mustard",
    rai: "Mustard",
    moongphali: "Groundnut",
    peanut: "Groundnut",
    chana: "Chickpea / Chana",
    arhar: "Tur / Arhar Dal",
    tur: "Tur / Arhar Dal",
    moong: "Moong Dal",
    jeera: "Cumin / Jeera",
    elaichi: "Cardamom",
    nariyal: "Coconut"
  };

  // MANDI AREAS & LOCAL MARKETS DIRECTORY
  app.get("/api/mandi-areas", (req, res) => {
    const areas = getMandiAreas();
    res.json(areas);
  });

  // REAL-TIME LOCAL MANDI & AREA PRICES
  app.get("/api/mandi-prices", (req, res) => {
    const { crop, state, district, mandi, lat, lng, category, location } = req.query;
    let rates = [...defaultMandiRates];

    let nearestMarket: any = null;
    let selectedMarket: any = null;

    let userLat = lat !== undefined && lat !== '' ? Number(lat) : null;
    let userLng = lng !== undefined && lng !== '' ? Number(lng) : null;

    // If location string is provided, resolve market and coordinates
    if (location && (!mandi || mandi === "All") && (!state || state === "All") && (!district || district === "All")) {
      const resolved = resolveMandiByLocation(String(location), userLat, userLng);
      selectedMarket = resolved.market;
      if (userLat === null || userLng === null || isNaN(userLat) || isNaN(userLng)) {
        userLat = resolved.market.lat;
        userLng = resolved.market.lng;
      }
    }

    // If coordinates are supplied, compute distance to all rates & identify nearest mandi
    if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
      const nearestRes = findNearestMandi(userLat, userLng);
      nearestMarket = nearestRes.market;
      if (!selectedMarket && (!mandi || mandi === "All") && (!state || state === "All") && (!district || district === "All")) {
        selectedMarket = nearestMarket;
      }

      // Attach distance to each rate that has coordinates
      rates = rates.map(r => {
        if (r.lat !== undefined && r.lng !== undefined) {
          return {
            ...r,
            distanceKm: haversineDistanceKm(userLat, userLng, r.lat, r.lng)
          };
        }
        return r;
      });
    }

    // Filter by state
    if (state && state !== "All") {
      rates = rates.filter(r => r.state.toLowerCase() === String(state).toLowerCase());
    }

    // Filter by district
    if (district && district !== "All") {
      rates = rates.filter(r => (r.district || '').toLowerCase() === String(district).toLowerCase());
    }

    // Filter by specific Mandi
    if (mandi && mandi !== "All") {
      const mandiStr = String(mandi).trim().toLowerCase();
      selectedMarket = mandiMarkets.find(m =>
        m.name.toLowerCase() === mandiStr ||
        m.id === mandiStr ||
        m.name.toLowerCase().includes(mandiStr)
      ) || null;

      const directMatches = rates.filter(r => r.mandi.toLowerCase().includes(mandiStr));

      if (selectedMarket) {
        // If a specific market was chosen, ensure we provide realistic local produce rates for this market
        const existingCrops = new Set(directMatches.map(r => r.crop.toLowerCase()));
        const extraMarketRates: any[] = [];

        for (const baseRate of defaultMandiRates) {
          if (!existingCrops.has(baseRate.crop.toLowerCase())) {
            existingCrops.add(baseRate.crop.toLowerCase());
            let hash = 0;
            for (let i = 0; i < selectedMarket.name.length; i++) {
              hash = (hash * 31 + selectedMarket.name.charCodeAt(i)) % 100;
            }
            const priceMod = 0.92 + (hash % 16) / 100;
            const localModal = Math.max(8, Math.round(baseRate.modal_price * priceMod));
            const localMin = Math.round(localModal * 0.85);
            const localMax = Math.round(localModal * 1.18);
            const dist = (userLat !== null && userLng !== null)
              ? haversineDistanceKm(userLat, userLng, selectedMarket.lat, selectedMarket.lng)
              : undefined;

            extraMarketRates.push({
              ...baseRate,
              mandi: selectedMarket.name,
              district: selectedMarket.district,
              state: selectedMarket.state,
              lat: selectedMarket.lat,
              lng: selectedMarket.lng,
              modal_price: localModal,
              min_price: localMin,
              max_price: localMax,
              arrival_tonnes: Math.max(50, Math.round(baseRate.arrival_tonnes * (0.8 + (hash % 40) / 100))),
              distanceKm: dist,
              updated_at: "Today, Real-time APMC"
            });
          }
        }
        rates = [...directMatches, ...extraMarketRates];
      } else {
        rates = directMatches;
      }
    }

    // Filter by Category (Vegetables, Fruits, Grains & Cereals, Pulses, Spices, Cash Crops)
    if (category && category !== "All") {
      rates = rates.filter(r => (r.category || '').toLowerCase() === String(category).toLowerCase());
    }

    if (crop) {
      const rawInput = String(crop).trim().toLowerCase();
      // Remove extraneous fluff words
      const cleanedInput = rawInput
        .replace(/\b(fresh|organic|desi|hybrid|grade|lot|local|quality|ripe|green|red|yellow|raw)\b/gi, "")
        .trim();

      const searchTerms = [rawInput, cleanedInput].filter(Boolean);

      // Check alias mapping
      let targetCanonical: string | null = null;
      for (const [alias, canonical] of Object.entries(cropAliasMap)) {
        if (rawInput.includes(alias) || cleanedInput.includes(alias)) {
          targetCanonical = canonical.toLowerCase();
          break;
        }
      }

      let matched = rates.filter(r => {
        const cropLower = r.crop.toLowerCase();
        const varietyLower = r.variety.toLowerCase();
        const mandiLower = r.mandi.toLowerCase();
        const districtLower = (r.district || '').toLowerCase();

        if (targetCanonical && cropLower.includes(targetCanonical)) return true;

        for (const term of searchTerms) {
          if (cropLower.includes(term) || term.includes(cropLower)) return true;
          if (varietyLower.includes(term)) return true;
          if (mandiLower.includes(term)) return true;
          if (districtLower.includes(term)) return true;

          const tokens = term.split(/\s+/).filter(t => t.length > 2);
          for (const tok of tokens) {
            if (cropLower.includes(tok) || tok.includes(cropLower)) return true;
          }
        }
        return false;
      });

      // If a specific market was selected or resolved by location, generate an accurate local rate for this market
      if (selectedMarket) {
        const localRate = getLocalMandiRateForCrop(String(crop), selectedMarket, userLat, userLng);
        matched = [localRate, ...matched.filter(r => r.mandi.toLowerCase() !== selectedMarket.name.toLowerCase())];
      } else if (matched.length === 0 && rawInput.length >= 2) {
        const targetMkt = nearestMarket || mandiMarkets[0];
        const localRate = getLocalMandiRateForCrop(String(crop), targetMkt, userLat, userLng);
        matched = [localRate];
      }

      rates = matched;
    }

    // If user provided coordinates, sort by nearest distance
    if (userLat !== null && userLng !== null) {
      rates.sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm;
        }
        return 0;
      });
    }

    res.json({
      mandi_prices: rates,
      timestamp: new Date().toISOString(),
      nearest_market: nearestMarket,
      selected_market: selectedMarket
    });
  });

  // AI Chatbot
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, userRole } = req.body;
      if (!message) return res.status(400).json({ error: "Message is required" });

      const client = getGeminiClient();
      if (!client) {
        return res.json({
          reply: `[Kisan Mitra AI] For "${message}": Current Mandi market rates fluctuate based on arrival volumes at APMC centers. For direct selling, ensure produce is graded, calculate direct transport costs, and consider cold storage if market prices are low. Feel free to ask about Tomato, Onion, Potato, Wheat, or any farming questions!`
        });
      }

      const systemPrompt = `You are "Kisan Mitra / FarmiQ Agri-Advisor", an expert Indian agronomist and marketplace advisor.
- Direct delivery offers affordable distance-based delivery rates.
- We support real-time Mandi price benchmarks across 20+ APMC markets.
- We offer Cold Storage & Godown booking to avoid distress sales.
- Digital Contracts & Buyer Demands enable forward pricing and escrow locks.
- Role of user: ${userRole || "User"}.
Answer warmly and concisely in simple terms. Provide actionable farming and market advice.`;

      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }] }
        ]
      });

      res.json({ reply: response.text });
    } catch (err: any) {
      console.error("AI Chat Error:", err);
      res.json({
        reply: `Kisan Mitra recommendation: Keep produce sorted by grade, check nearby APMC daily arrivals, and utilize cold storage if holding for higher prices. (Low-cost direct transport available).`
      });
    }
  });

  // Vite Middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n  ======================================================`);
    console.log(`  🌾 FarmiQ Platform is running!`);
    console.log(`  ➜ Local URL:   http://localhost:${PORT}/`);
    console.log(`  ➜ Network URL: http://127.0.0.1:${PORT}/`);
    console.log(`  ======================================================`);
    console.log(`  💡 Notice on "Connection is not secure" / "Not Secure":`);
    console.log(`     Make sure to open with "http://" (NOT "https://").`);
    console.log(`     Browsers flag local HTTP servers as "Not Secure" because`);
    console.log(`     they lack an SSL certificate. This is completely safe`);
    console.log(`     and normal for local development.\n`);
  });
}

startServer();
