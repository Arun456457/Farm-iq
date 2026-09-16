#!/usr/bin/env python3
"""
FarmiQ Python Backend Server
Pure Python 3 implementation with SQLite, JSON REST API, and image upload support.
Runs independently or alongside the Node/Vite frontend.
"""

import http.server
import json
import os
import sqlite3
import hashlib
import time
import datetime
import urllib.parse
import base64
import uuid
import random

PORT = int(os.environ.get("BACKEND_PORT", 8000))
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
DB_PATH = os.path.join(DATA_DIR, "farmiq.db")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Helper for secure password hashing
def hash_password(password: str) -> str:
    salt = "farmiq_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

# Database initialization
def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        farm_name TEXT,
        location TEXT NOT NULL,
        delivery_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Products table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmer_id INTEGER NOT NULL,
        farmer_name TEXT NOT NULL,
        farm_name TEXT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        price REAL NOT NULL,
        harvest_date TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        organic INTEGER DEFAULT 0,
        image_url TEXT,
        shelf_life_days INTEGER DEFAULT 14,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farmer_id) REFERENCES users(id)
    )
    ''')
    
    # Orders table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        farmer_id INTEGER NOT NULL,
        farmer_name TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        unit_price REAL NOT NULL,
        product_total REAL NOT NULL,
        distance_km REAL NOT NULL,
        delivery_charge REAL NOT NULL,
        grand_total REAL NOT NULL,
        delivery_address TEXT NOT NULL,
        payment_method TEXT DEFAULT 'UPI',
        payment_status TEXT DEFAULT 'PAID',
        transaction_id TEXT,
        status TEXT DEFAULT 'ORDERED',
        driver_name TEXT,
        driver_phone TEXT,
        vehicle_number TEXT,
        tracking_lat REAL,
        tracking_lng REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id),
        FOREIGN KEY (farmer_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )
    ''')

    # Storage bookings table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS storage_bookings (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        facility_name TEXT NOT NULL,
        location TEXT NOT NULL,
        produce_type TEXT NOT NULL,
        quantity_quintal REAL NOT NULL,
        storage_type TEXT NOT NULL,
        duration_days INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        daily_rate REAL NOT NULL,
        total_cost REAL NOT NULL,
        status TEXT DEFAULT 'CONFIRMED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Digital contracts table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        buyer_id INTEGER,
        buyer_name TEXT NOT NULL,
        buyer_company TEXT,
        crop_name TEXT NOT NULL,
        required_quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        offer_price REAL NOT NULL,
        quality_grade TEXT NOT NULL,
        delivery_location TEXT NOT NULL,
        delivery_deadline TEXT NOT NULL,
        terms TEXT,
        status TEXT DEFAULT 'OPEN',
        assigned_farmer_id INTEGER,
        assigned_farmer_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Disputes table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS disputes (
        id TEXT PRIMARY KEY,
        order_id INTEGER,
        filed_by_id INTEGER NOT NULL,
        filed_by_name TEXT NOT NULL,
        filed_by_role TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'OPEN',
        resolution TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    conn.commit()
    conn.close()

init_db()

# Crop preservation metadata guide
CROP_PRESERVATION = {
    "Tomato": {"shelf_life": 14, "cold_storage_days": 30, "temp": "12°C - 15°C", "humidity": "85-90%", "tips": "Keep dry, store stem-side down at ambient room temperature, or cold storage for extended market window."},
    "Onion": {"shelf_life": 90, "cold_storage_days": 180, "temp": "0°C - 2°C", "humidity": "65-70%", "tips": "Ensure well-ventilated dry storage. Excellent candidate for holding to gain off-season price surge."},
    "Potato": {"shelf_life": 120, "cold_storage_days": 240, "temp": "4°C - 7°C", "humidity": "90-95%", "tips": "Store in dark, cool, dry space to prevent greening and sprouting."},
    "Wheat": {"shelf_life": 365, "cold_storage_days": 730, "temp": "Dry ambient", "humidity": "<12% moisture", "tips": "Maintain hermetic seal or neem leaf lined gunny bags to deter weevils."},
    "Rice / Paddy": {"shelf_life": 365, "cold_storage_days": 730, "temp": "Dry ambient", "humidity": "<13% moisture", "tips": "Stack on wooden pallets away from damp floors."},
    "Green Chilli": {"shelf_life": 10, "cold_storage_days": 21, "temp": "7°C - 10°C", "humidity": "90-95%", "tips": "Remove damaged chillies before packaging; highly sensitive to ethylene."},
    "Apple": {"shelf_life": 45, "cold_storage_days": 180, "temp": "-1°C - 4°C", "humidity": "90-95%", "tips": "Controlled atmosphere storage delays ripening significantly."},
    "Mango": {"shelf_life": 8, "cold_storage_days": 21, "temp": "13°C", "humidity": "85-90%", "tips": "Harvest at mature green stage; avoid direct chilling below 10°C to prevent chilling injury."},
    "Ginger": {"shelf_life": 60, "cold_storage_days": 150, "temp": "12°C - 14°C", "humidity": "75-85%", "tips": "Cured rhizomes retain freshness and essential oils much longer."},
    "Garlic": {"shelf_life": 120, "cold_storage_days": 240, "temp": "0°C - 2°C", "humidity": "60-70%", "tips": "Keep in airy mesh bags; low humidity prevents mould."},
    "Banana": {"shelf_life": 6, "cold_storage_days": 14, "temp": "13°C - 14°C", "humidity": "90-95%", "tips": "Keep away from direct heat; sell immediately or stage with ethylene chambers."},
    "Turmeric": {"shelf_life": 180, "cold_storage_days": 365, "temp": "Dry ambient", "humidity": "<10% moisture", "tips": "Polished, dry fingers store securely for up to a full calendar year."}
}

# Live dynamic Mandi Benchmark Prices with realistic base prices and locations
MANDI_DATA = [
    {"crop": "Tomato", "variety": "Hybrid Red", "mandi": "Kolar Mandi", "state": "Karnataka", "base_price": 42.0, "arrival_tonnes": 320, "image": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80"},
    {"crop": "Tomato", "variety": "Desi Local", "mandi": "Azadpur APMC", "state": "Delhi", "base_price": 46.0, "arrival_tonnes": 540, "image": "https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=600&auto=format&fit=crop&q=80"},
    {"crop": "Onion", "variety": "Nashik Red", "mandi": "Lasalgaon Mandi", "state": "Maharashtra", "base_price": 32.0, "arrival_tonnes": 980, "image": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80"},
    {"crop": "Onion", "variety": "Garwa White", "mandi": "Vashi APMC", "state": "Mumbai", "base_price": 35.0, "arrival_tonnes": 720, "image": "https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop&q=80"},
    {"crop": "Potato", "variety": "Jyoti / Kufri", "mandi": "Agra APMC", "state": "Uttar Pradesh", "base_price": 22.0, "arrival_tonnes": 1250, "image": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80"},
    {"crop": "Potato", "variety": "Pukhraj", "mandi": "Kolkata Posta", "state": "West Bengal", "base_price": 24.5, "arrival_tonnes": 890, "image": "https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=600&auto=format&fit=crop&q=80"},
    {"crop": "Wheat", "variety": "Sharbati Gold", "mandi": "Sehore Mandi", "state": "Madhya Pradesh", "base_price": 34.0, "arrival_tonnes": 1600, "image": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80"},
    {"crop": "Wheat", "variety": "PBW 550", "mandi": "Khanna Grain Market", "state": "Punjab", "base_price": 28.5, "arrival_tonnes": 2400, "image": "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=80"},
    {"crop": "Rice / Paddy", "variety": "Basmati 1121", "mandi": "Karnal APMC", "state": "Haryana", "base_price": 68.0, "arrival_tonnes": 780, "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"},
    {"crop": "Green Chilli", "variety": "G4 Hot", "mandi": "Guntur APMC", "state": "Andhra Pradesh", "base_price": 58.0, "arrival_tonnes": 140, "image": "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80"},
    {"crop": "Apple", "variety": "Shimla Royal", "mandi": "Parwanoo Mandi", "state": "Himachal Pradesh", "base_price": 110.0, "arrival_tonnes": 420, "image": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80"},
    {"crop": "Mango", "variety": "Alphonso / Hapus", "mandi": "Ratnagiri Mandi", "state": "Maharashtra", "base_price": 180.0, "arrival_tonnes": 190, "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"},
    {"crop": "Ginger", "variety": "Fresh Cochin", "mandi": "Wayanad APMC", "state": "Kerala", "base_price": 75.0, "arrival_tonnes": 95, "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80"},
    {"crop": "Garlic", "variety": "Mandsaur Bold", "mandi": "Mandsaur APMC", "state": "Madhya Pradesh", "base_price": 145.0, "arrival_tonnes": 310, "image": "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600&auto=format&fit=crop&q=80"},
    {"crop": "Turmeric", "variety": "Nizamabad Finger", "mandi": "Erode Market", "state": "Tamil Nadu", "base_price": 130.0, "arrival_tonnes": 260, "image": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&auto=format&fit=crop&q=80"}
]

def get_current_mandi_prices():
    """Generates dynamically fluctuating mandi prices with live time stamps."""
    t = int(time.time() / 15)  # price shifts slightly every 15 seconds
    results = []
    for item in MANDI_DATA:
        # Pseudo-random oscillation based on crop + time
        h = int(hashlib.md5(f"{item['crop']}_{item['mandi']}_{t}".encode()).hexdigest(), 16)
        pct_change = ((h % 100) - 48) / 10.0  # -4.8% to +5.1%
        modal_price = round(item["base_price"] * (1 + (pct_change / 100.0)), 1)
        min_price = round(modal_price * 0.92, 1)
        max_price = round(modal_price * 1.08, 1)
        trend = "UP" if pct_change > 0.5 else ("DOWN" if pct_change < -0.5 else "STABLE")
        
        results.append({
            "crop": item["crop"],
            "variety": item["variety"],
            "mandi": item["mandi"],
            "state": item["state"],
            "modal_price": modal_price,
            "min_price": min_price,
            "max_price": max_price,
            "arrival_tonnes": item["arrival_tonnes"] + (h % 30) - 15,
            "trend": trend,
            "pct_change": round(pct_change, 2),
            "unit": "kg",
            "image": item["image"],
            "updated_at": datetime.datetime.now().strftime("%I:%M:%S %p")
        })
    return results

def get_market_price_for_crop(crop_name: str) -> float:
    """Finds current live mandi benchmark modal price for a given crop name."""
    crop_lower = crop_name.lower().strip()
    current_rates = get_current_mandi_prices()
    for rate in current_rates:
        if rate["crop"].lower() in crop_lower or crop_lower in rate["crop"].lower():
            return rate["modal_price"]
    # Fallback heuristic based on common commodities
    return 35.0

class FarmiQRequestHandler(http.server.BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def _send_json(self, data, status_code=200):
        self.send_response(status_code)
        self._send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def _send_error(self, message, status_code=400):
        self._send_json({"error": message, "detail": message}, status_code)

    def _read_body_json(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                return {}
            raw = self.rfile.read(content_length).decode('utf-8')
            return json.loads(raw)
        except Exception as e:
            return {}

    def _get_auth_user(self):
        """Extracts user from Authorization: Bearer <token_or_email> header."""
        auth_header = self.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None
        token = auth_header.replace('Bearer ', '').strip()
        conn = get_db()
        cursor = conn.cursor()
        # Token format: email or direct id
        cursor.execute("SELECT * FROM users WHERE email = ? OR id = ?", (token, token))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Health check
        if path == '/api/health':
            return self._send_json({"status": "ok", "service": "FarmiQ Python Core Engine"})

        # Static upload file serving
        if path.startswith('/uploads/'):
            filename = os.path.basename(path)
            file_path = os.path.join(UPLOADS_DIR, filename)
            if os.path.exists(file_path):
                self.send_response(200)
                self._send_cors_headers()
                if filename.endswith('.png'):
                    self.send_header('Content-Type', 'image/png')
                elif filename.endswith('.webp'):
                    self.send_header('Content-Type', 'image/webp')
                else:
                    self.send_header('Content-Type', 'image/jpeg')
                self.end_headers()
                with open(file_path, 'rb') as f:
                    self.wfile.write(f.read())
                return
            else:
                return self._send_error("File not found", 404)

        # Current User
        if path == '/api/auth/me':
            user = self._get_auth_user()
            if not user:
                return self._send_error("Unauthorized", 401)
            safe_user = {k: v for k, v in user.items() if k != 'password_hash'}
            return self._send_json({"user": safe_user})

        # All Users (Admin overview)
        if path == '/api/admin/users':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT id, full_name, email, phone, role, farm_name, location, delivery_address, created_at FROM users ORDER BY id DESC")
            users = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return self._send_json({"users": users})

        # Products (Public / Customer marketplace)
        if path == '/api/products':
            conn = get_db()
            cursor = conn.cursor()
            # Return active listings with available quantity > 0
            cursor.execute('''
                SELECT p.*, u.full_name as farmer_name, u.farm_name, u.location as farmer_location, u.phone as farmer_phone
                FROM products p
                JOIN users u ON p.farmer_id = u.id
                WHERE p.quantity > 0
                ORDER BY p.id DESC
            ''')
            products = [dict(r) for r in cursor.fetchall()]
            conn.close()

            # Augment with live market benchmark comparison & shelf-life calculation
            today = datetime.date.today()
            for p in products:
                # Find matching mandi rate
                mandi_price = get_market_price_for_crop(p["name"])
                p["market_price"] = mandi_price
                p["price_diff"] = round(p["price"] - mandi_price, 1)
                
                # Calculate preservation days from harvest date
                try:
                    harvest_d = datetime.date.fromisoformat(p["harvest_date"])
                    days_since_harvest = max(0, (today - harvest_d).days)
                except Exception:
                    days_since_harvest = 1
                
                meta = CROP_PRESERVATION.get(p["name"], {"shelf_life": p.get("shelf_life_days", 14), "cold_storage_days": 30, "tips": "Store in cool dry space."})
                remaining_ambient = max(0, meta["shelf_life"] - days_since_harvest)
                
                p["days_since_harvest"] = days_since_harvest
                p["shelf_life_total"] = meta["shelf_life"]
                p["remaining_shelf_life"] = remaining_ambient
                p["storage_tips"] = meta["tips"]
                p["cold_storage_days"] = meta.get("cold_storage_days", 30)

                # Recommendation for Farmer & Customer
                if p["price"] < mandi_price:
                    p["recommendation"] = "HIGH VALUE FOR BUYER: Listed ₹{:.1f} below Mandi benchmark.".format(mandi_price - p["price"])
                else:
                    p["recommendation"] = "PREMIUM QUALITY / ORGANIC: Listed at ₹{:.1f} (Mandi: ₹{:.1f}).".format(p["price"], mandi_price)

            return self._send_json(products)

        # Farmer's own listings
        if path == '/api/farmer/products':
            user = self._get_auth_user()
            if not user:
                return self._send_error("Unauthorized", 401)
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM products WHERE farmer_id = ? ORDER BY id DESC", (user["id"],))
            products = [dict(r) for r in cursor.fetchall()]
            conn.close()

            today = datetime.date.today()
            for p in products:
                mandi_price = get_market_price_for_crop(p["name"])
                p["market_price"] = mandi_price
                try:
                    harvest_d = datetime.date.fromisoformat(p["harvest_date"])
                    days_since_harvest = max(0, (today - harvest_d).days)
                except Exception:
                    days_since_harvest = 1
                
                meta = CROP_PRESERVATION.get(p["name"], {"shelf_life": 14, "cold_storage_days": 30, "tips": "Store in dry place."})
                remaining = max(0, meta["shelf_life"] - days_since_harvest)
                p["days_since_harvest"] = days_since_harvest
                p["remaining_shelf_life"] = remaining
                p["storage_tips"] = meta["tips"]
                
                # Decision Intelligence: Sell now vs Store in Cold Facility
                if p["price"] <= mandi_price:
                    p["action_advice"] = f"SELL NOW: Mandi rate is strong (₹{mandi_price}/kg). Immediate sale recommended."
                else:
                    p["action_advice"] = f"WAIT OR STORE: Current Mandi is ₹{mandi_price}/kg. You have {remaining} days remaining. Book cold storage to wait for better realization."

            return self._send_json(products)

        # Customer Orders
        if path == '/api/customer/orders':
            user = self._get_auth_user()
            if not user:
                return self._send_error("Unauthorized", 401)
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT o.*, p.image_url
                FROM orders o
                LEFT JOIN products p ON o.product_id = p.id
                WHERE o.customer_id = ?
                ORDER BY o.id DESC
            ''', (user["id"],))
            orders = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return self._send_json(orders)

        # Farmer Orders
        if path == '/api/farmer/orders':
            user = self._get_auth_user()
            if not user:
                return self._send_error("Unauthorized", 401)
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT o.*, p.image_url
                FROM orders o
                LEFT JOIN products p ON o.product_id = p.id
                WHERE o.farmer_id = ?
                ORDER BY o.id DESC
            ''', (user["id"],))
            orders = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return self._send_json(orders)

        # Live Order Tracking
        if path.startswith('/api/orders/') and path.endswith('/tracking'):
            order_id = path.split('/')[3]
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
            order = cursor.fetchone()
            conn.close()
            if not order:
                return self._send_error("Order not found", 404)
            order_dict = dict(order)
            
            # Real-time simulated logistics coordinates & live progress
            tracking_info = {
                "order_id": order_dict["id"],
                "status": order_dict["status"],
                "driver_name": order_dict.get("driver_name") or "Ramesh Kumar (FarmiQ Express)",
                "driver_phone": order_dict.get("driver_phone") or "+91 98450 12890",
                "vehicle_number": order_dict.get("vehicle_number") or "KA-04-AG-7821",
                "distance_km": order_dict["distance_km"],
                "eta_minutes": max(5, int(order_dict["distance_km"] * 2.5)),
                "current_location": "En route via NH-44 Agricultural Corridor",
                "temperature_controlled": True,
                "checkpoints": [
                    {"title": "Produce Inspected & Loaded at Farm", "time": "10:15 AM", "completed": True},
                    {"title": "Quality Weighment & Departure", "time": "10:45 AM", "completed": order_dict["status"] in ["PREPARING", "TRANSIT", "DELIVERED"]},
                    {"title": "Transit with Direct Cold-Chain", "time": "11:20 AM", "completed": order_dict["status"] in ["TRANSIT", "DELIVERED"]},
                    {"title": "Delivered to Customer Doorstep", "time": "Pending", "completed": order_dict["status"] == "DELIVERED"}
                ]
            }
            return self._send_json(tracking_info)

        # Live Mandi Prices across India (all locations)
        if path == '/api/mandi-prices':
            crop_filter = query.get('crop', [None])[0]
            state_filter = query.get('state', [None])[0]
            rates = get_current_mandi_prices()
            if crop_filter:
                rates = [r for r in rates if crop_filter.lower() in r["crop"].lower()]
            if state_filter:
                rates = [r for r in rates if state_filter.lower() in r["state"].lower()]
            return self._send_json({"mandi_prices": rates, "timestamp": datetime.datetime.now().isoformat()})

        # Preservation Guide
        if path == '/api/preservation-guide':
            return self._send_json(CROP_PRESERVATION)

        # Storage Bookings
        if path == '/api/storage/bookings':
            user = self._get_auth_user()
            conn = get_db()
            cursor = conn.cursor()
            if user and user["role"] == "admin":
                cursor.execute("SELECT * FROM storage_bookings ORDER BY created_at DESC")
            elif user:
                cursor.execute("SELECT * FROM storage_bookings WHERE user_id = ? ORDER BY created_at DESC", (user["id"],))
            else:
                cursor.execute("SELECT * FROM storage_bookings ORDER BY created_at DESC LIMIT 50")
            bookings = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return self._send_json(bookings)

        # Digital Contracts & Offers
        if path == '/api/contracts':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM contracts ORDER BY created_at DESC")
            contracts = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return self._send_json(contracts)

        # Disputes / Grievances
        if path == '/api/disputes':
            user = self._get_auth_user()
            conn = get_db()
            cursor = conn.cursor()
            if user and user["role"] == "admin":
                cursor.execute("SELECT * FROM disputes ORDER BY created_at DESC")
            elif user:
                cursor.execute("SELECT * FROM disputes WHERE filed_by_id = ? ORDER BY created_at DESC", (user["id"],))
            else:
                cursor.execute("SELECT * FROM disputes ORDER BY created_at DESC")
            disputes = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return self._send_json(disputes)

        # Admin System Overview
        if path == '/api/admin/overview':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'farmer'")
            total_farmers = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'customer'")
            total_customers = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*), COALESCE(SUM(quantity), 0) FROM products WHERE quantity > 0")
            p_row = cursor.fetchone()
            active_products = p_row[0]
            total_produce_kg = p_row[1]
            cursor.execute("SELECT COUNT(*), COALESCE(SUM(grand_total), 0), COALESCE(SUM(delivery_charge), 0) FROM orders")
            o_row = cursor.fetchone()
            total_orders = o_row[0]
            gross_merchandise_val = o_row[1]
            total_delivery_fees = o_row[2]
            cursor.execute("SELECT COUNT(*) FROM storage_bookings")
            total_storage_bookings = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM contracts WHERE status = 'OPEN'")
            open_contracts = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM disputes WHERE status = 'OPEN'")
            open_disputes = cursor.fetchone()[0]
            conn.close()

            return self._send_json({
                "total_farmers": total_farmers,
                "total_customers": total_customers,
                "active_products": active_products,
                "total_produce_kg": round(total_produce_kg, 1),
                "total_orders": total_orders,
                "gross_merchandise_val": round(gross_merchandise_val, 2),
                "total_delivery_fees": round(total_delivery_fees, 2),
                "total_storage_bookings": total_storage_bookings,
                "open_contracts": open_contracts,
                "open_disputes": open_disputes
            })

        self._send_error("Endpoint not found", 404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # 1. Registration
        if path == '/api/auth/register':
            data = self._read_body_json()
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            full_name = data.get('full_name', '').strip()
            role = data.get('role', 'customer').strip().lower()
            phone = data.get('phone', '').strip()
            farm_name = data.get('farm_name', '').strip()
            location = data.get('location', '').strip()
            delivery_address = data.get('delivery_address', '').strip()

            if not email or not password or not full_name:
                return self._send_error("Full name, email, and password are required")

            if role not in ['farmer', 'customer', 'admin']:
                return self._send_error("Role must be 'farmer', 'customer', or 'admin'")

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            if cursor.fetchone():
                conn.close()
                return self._send_error("Email already registered. Please log in.")

            pw_hash = hash_password(password)
            cursor.execute('''
                INSERT INTO users (full_name, email, phone, password_hash, role, farm_name, location, delivery_address)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (full_name, email, phone, pw_hash, role, farm_name, location, delivery_address))
            new_id = cursor.lastrowid
            conn.commit()

            cursor.execute("SELECT id, full_name, email, phone, role, farm_name, location, delivery_address FROM users WHERE id = ?", (new_id,))
            user_row = dict(cursor.fetchone())
            conn.close()

            return self._send_json({
                "message": "User registered successfully",
                "access_token": user_row["email"],
                "token_type": "bearer",
                "user": user_row
            }, 201)

        # 2. Login
        if path == '/api/auth/login':
            data = self._read_body_json()
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')

            if not email or not password:
                return self._send_error("Email and password are required")

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            user_row = cursor.fetchone()
            conn.close()

            if not user_row or not verify_password(password, user_row["password_hash"]):
                return self._send_error("Invalid email or password", 401)

            safe_user = {k: user_row[k] for k in user_row.keys() if k != 'password_hash'}
            return self._send_json({
                "access_token": safe_user["email"],
                "token_type": "bearer",
                "user": safe_user
            })

        # 3. Add Produce / Product (Supports Base64 uploaded images)
        if path == '/api/products':
            user = self._get_auth_user()
            if not user or user["role"] != 'farmer':
                return self._send_error("Only authenticated farmers can add produce listings", 403)

            data = self._read_body_json()
            name = data.get('name', '').strip()
            category = data.get('category', 'Vegetables').strip()
            try:
                quantity = float(data.get('quantity', 0))
                price = float(data.get('price', 0))
            except ValueError:
                return self._send_error("Quantity and price must be valid numbers")

            unit = data.get('unit', 'kg').strip()
            harvest_date = data.get('harvest_date', datetime.date.today().isoformat())
            location = data.get('location', user.get('location') or 'Local Mandi').strip()
            description = data.get('description', '').strip()
            organic = 1 if data.get('organic') else 0
            
            # Handle Image Upload: Save Base64 data if provided, or fallback to crop reference
            image_data = data.get('image_base64')
            image_url = data.get('image_url')

            if image_data and ',' in image_data:
                try:
                    header, b64content = image_data.split(',', 1)
                    ext = ".jpg"
                    if "image/png" in header:
                        ext = ".png"
                    elif "image/webp" in header:
                        ext = ".webp"
                    
                    filename = f"prod_{int(time.time())}_{uuid.uuid4().hex[:6]}{ext}"
                    filepath = os.path.join(UPLOADS_DIR, filename)
                    with open(filepath, 'wb') as f:
                        f.write(base64.b64decode(b64content))
                    image_url = f"/uploads/{filename}"
                except Exception as e:
                    print(f"Error saving image: {e}")

            if not image_url:
                # Fallback to authentic reference crop image
                crop_match = next((item["image"] for item in MANDI_DATA if item["crop"].lower() in name.lower()), None)
                image_url = crop_match or "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80"

            # Compute shelf life & preservation metadata
            crop_meta = CROP_PRESERVATION.get(name, {"shelf_life": 14, "cold_storage_days": 30, "tips": "Store in dry aerated space."})
            shelf_life_days = crop_meta["shelf_life"]

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO products (farmer_id, farmer_name, farm_name, name, category, quantity, unit, price, harvest_date, location, description, organic, image_url, shelf_life_days)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user["id"], user["full_name"], user.get("farm_name") or "Farm Direct", name, category, quantity, unit, price, harvest_date, location, description, organic, image_url, shelf_life_days))
            new_id = cursor.lastrowid
            conn.commit()

            cursor.execute("SELECT * FROM products WHERE id = ?", (new_id,))
            created_prod = dict(cursor.fetchone())
            conn.close()

            return self._send_json(created_prod, 201)

        # 4. Create Order (Atomically verifies stock & deducts inventory!)
        if path == '/api/orders':
            user = self._get_auth_user()
            if not user or user["role"] != 'customer':
                return self._send_error("Only authenticated customers can place orders", 403)

            data = self._read_body_json()
            product_id = data.get('product_id')
            try:
                order_qty = float(data.get('quantity', 1))
            except ValueError:
                return self._send_error("Invalid order quantity")

            if order_qty <= 0:
                return self._send_error("Order quantity must be greater than zero")

            delivery_address = data.get('delivery_address') or user.get('delivery_address') or 'Customer Address'
            payment_method = data.get('payment_method', 'UPI')
            transaction_id = data.get('transaction_id') or f"TXN-FIQ-{int(time.time())}-{random.randint(1000, 9999)}"

            conn = get_db()
            cursor = conn.cursor()
            
            # ATOMIC INVENTORY CHECK with BEGIN IMMEDIATE TRANSACTION
            cursor.execute("BEGIN IMMEDIATE")
            cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
            product = cursor.fetchone()

            if not product:
                conn.rollback()
                conn.close()
                return self._send_error("Product not found", 404)

            available_stock = product["quantity"]
            if available_stock < order_qty:
                conn.rollback()
                conn.close()
                return self._send_error(f"Only {available_stock} {product['unit']} available. Cannot order {order_qty} {product['unit']}.", 400)

            # Business calculation:
            # 1. Product total = Quantity * Unit Price
            # 2. Transportation price = 2 rupees per kilometer (explicitly requested!)
            # Dynamic simulated distance between farmer location & customer
            distance_km = round(data.get('distance_km', 14.5), 1)
            delivery_charge = round(distance_km * 2.0, 2)  # ₹2 per km!
            product_total = round(order_qty * product["price"], 2)
            grand_total = round(product_total + delivery_charge, 2)

            # Deduct stock safely
            new_stock = available_stock - order_qty
            cursor.execute("UPDATE products SET quantity = ? WHERE id = ?", (new_stock, product_id))

            # Driver assignment for live tracking
            driver_name = "Vikram Patil (FarmiQ Express Logistics)"
            driver_phone = "+91 94231 88910"
            vehicle_number = "MH-14-AG-4492"

            cursor.execute('''
                INSERT INTO orders (
                    customer_id, customer_name, farmer_id, farmer_name, product_id, product_name,
                    quantity, unit, unit_price, product_total, distance_km, delivery_charge,
                    grand_total, delivery_address, payment_method, payment_status, transaction_id,
                    status, driver_name, driver_phone, vehicle_number
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', ?, 'ORDERED', ?, ?, ?)
            ''', (
                user["id"], user["full_name"], product["farmer_id"], product["farmer_name"], product["id"], product["name"],
                order_qty, product["unit"], product["price"], product_total, distance_km, delivery_charge,
                grand_total, delivery_address, payment_method, transaction_id, driver_name, driver_phone, vehicle_number
            ))
            order_id = cursor.lastrowid
            conn.commit()

            cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
            created_order = dict(cursor.fetchone())
            conn.close()

            return self._send_json(created_order, 201)

        # 5. Book Cold Storage & Warehouse Space
        if path == '/api/storage/book':
            user = self._get_auth_user()
            if not user:
                return self._send_error("Authentication required to book storage", 401)

            data = self._read_body_json()
            facility_name = data.get('facility_name', 'AgriCold State Logistics Hub').strip()
            location = data.get('location', 'APMC Mandi Zone A').strip()
            produce_type = data.get('produce_type', 'Fresh Produce').strip()
            try:
                quantity_quintal = float(data.get('quantity_quintal', 10))
                duration_days = int(data.get('duration_days', 15))
            except ValueError:
                return self._send_error("Invalid quantity or duration")

            storage_type = data.get('storage_type', 'Cold Chamber (2°C - 4°C)').strip()
            daily_rate_per_quintal = 4.5  # ₹4.5 per quintal / day
            total_cost = round(quantity_quintal * duration_days * daily_rate_per_quintal, 2)
            booking_id = f"STRG-{int(time.time())}-{random.randint(100, 999)}"
            start_date = datetime.date.today().isoformat()

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO storage_bookings (id, user_id, user_name, facility_name, location, produce_type, quantity_quintal, storage_type, duration_days, start_date, daily_rate, total_cost, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')
            ''', (booking_id, user["id"], user["full_name"], facility_name, location, produce_type, quantity_quintal, storage_type, duration_days, start_date, daily_rate_per_quintal, total_cost))
            conn.commit()

            cursor.execute("SELECT * FROM storage_bookings WHERE id = ?", (booking_id,))
            booking_row = dict(cursor.fetchone())
            conn.close()

            return self._send_json({
                "message": f"Storage space booked successfully for {duration_days} days!",
                "booking": booking_row
            }, 201)

        # 6. Create Digital Offer / Contract Requirement
        if path == '/api/contracts':
            user = self._get_auth_user()
            if not user:
                return self._send_error("Authentication required", 401)

            data = self._read_body_json()
            title = data.get('title', '').strip()
            crop_name = data.get('crop_name', '').strip()
            try:
                required_quantity = float(data.get('required_quantity', 100))
                offer_price = float(data.get('offer_price', 40))
            except ValueError:
                return self._send_error("Invalid quantity or price")

            unit = data.get('unit', 'kg').strip()
            quality_grade = data.get('quality_grade', 'Grade A / Export Quality').strip()
            delivery_location = data.get('delivery_location', user.get('location') or 'Hub Depot').strip()
            delivery_deadline = data.get('delivery_deadline', (datetime.date.today() + datetime.timedelta(days=14)).isoformat())
            terms = data.get('terms', 'Payment escrow released upon Mandi digital quality weighment approval.')

            contract_id = f"CTR-{int(time.time())}-{random.randint(100, 999)}"
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO contracts (id, title, buyer_id, buyer_name, buyer_company, crop_name, required_quantity, unit, offer_price, quality_grade, delivery_location, delivery_deadline, terms, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
            ''', (contract_id, title or f"{required_quantity} {unit} {crop_name} Requirement", user["id"], user["full_name"], user.get("farm_name") or "Direct Buyer Group", crop_name, required_quantity, unit, offer_price, quality_grade, delivery_location, delivery_deadline, terms))
            conn.commit()

            cursor.execute("SELECT * FROM contracts WHERE id = ?", (contract_id,))
            created_ctr = dict(cursor.fetchone())
            conn.close()

            return self._send_json(created_ctr, 201)

        # 7. Bid or Accept Contract
        if path.startswith('/api/contracts/') and path.endswith('/accept'):
            contract_id = path.split('/')[3]
            user = self._get_auth_user()
            if not user or user["role"] != 'farmer':
                return self._send_error("Only registered farmers can fulfill digital contracts", 403)

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM contracts WHERE id = ?", (contract_id,))
            ctr = cursor.fetchone()
            if not ctr:
                conn.close()
                return self._send_error("Contract not found", 404)

            cursor.execute('''
                UPDATE contracts 
                SET status = 'ACCEPTED_IN_ESCROW', assigned_farmer_id = ?, assigned_farmer_name = ?
                WHERE id = ?
            ''', (user["id"], user["full_name"], contract_id))
            conn.commit()

            cursor.execute("SELECT * FROM contracts WHERE id = ?", (contract_id,))
            updated_ctr = dict(cursor.fetchone())
            conn.close()
            return self._send_json(updated_ctr)

        # 8. File Dispute / Grievance
        if path == '/api/disputes':
            user = self._get_auth_user()
            if not user:
                return self._send_error("Authentication required", 401)

            data = self._read_body_json()
            subject = data.get('subject', '').strip()
            description = data.get('description', '').strip()
            order_id = data.get('order_id')

            if not subject or not description:
                return self._send_error("Subject and description are required")

            dispute_id = f"DSP-{int(time.time())}-{random.randint(100, 999)}"
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO disputes (id, order_id, filed_by_id, filed_by_name, filed_by_role, subject, description, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN')
            ''', (dispute_id, order_id, user["id"], user["full_name"], user["role"], subject, description))
            conn.commit()

            cursor.execute("SELECT * FROM disputes WHERE id = ?", (dispute_id,))
            created_dsp = dict(cursor.fetchone())
            conn.close()
            return self._send_json(created_dsp, 201)

        self._send_error("Endpoint not found", 404)

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Update Order Status (Farmer or Admin)
        # Sequence: ORDERED -> ACCEPTED -> PREPARING -> TRANSIT -> DELIVERED
        if path.startswith('/api/orders/') and path.endswith('/status'):
            order_id = path.split('/')[3]
            user = self._get_auth_user()
            if not user:
                return self._send_error("Unauthorized", 401)

            data = self._read_body_json()
            new_status = data.get('status', '').strip().upper()

            valid_statuses = ['ORDERED', 'ACCEPTED', 'PREPARING', 'TRANSIT', 'DELIVERED', 'CANCELLED']
            if new_status not in valid_statuses:
                return self._send_error(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
            order = cursor.fetchone()

            if not order:
                conn.close()
                return self._send_error("Order not found", 404)

            # Verify authorization (farmer owning the product or admin)
            if user["role"] != 'admin' and order["farmer_id"] != user["id"]:
                conn.close()
                return self._send_error("Unauthorized to update this order", 403)

            cursor.execute("UPDATE orders SET status = ? WHERE id = ?", (new_status, order_id))
            conn.commit()

            cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
            updated_order = dict(cursor.fetchone())
            conn.close()

            return self._send_json(updated_order)

        # Update Dispute Resolution (Admin)
        if path.startswith('/api/disputes/') and path.endswith('/resolve'):
            dispute_id = path.split('/')[3]
            user = self._get_auth_user()
            if not user or user["role"] != 'admin':
                return self._send_error("Only admins can resolve disputes", 403)

            data = self._read_body_json()
            resolution = data.get('resolution', 'Grievance verified and settlement processed.').strip()

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("UPDATE disputes SET status = 'RESOLVED', resolution = ? WHERE id = ?", (resolution, dispute_id))
            conn.commit()

            cursor.execute("SELECT * FROM disputes WHERE id = ?", (dispute_id,))
            updated_dsp = dict(cursor.fetchone())
            conn.close()
            return self._send_json(updated_dsp)

        self._send_error("Endpoint not found", 404)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Delete product listing (Farmer or Admin)
        if path.startswith('/api/products/'):
            product_id = path.split('/')[3]
            user = self._get_auth_user()
            if not user:
                return self._send_error("Unauthorized", 401)

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
            product = cursor.fetchone()

            if not product:
                conn.close()
                return self._send_error("Product not found", 404)

            if user["role"] != 'admin' and product["farmer_id"] != user["id"]:
                conn.close()
                return self._send_error("Unauthorized to delete this product", 403)

            cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
            conn.commit()
            conn.close()

            return self._send_json({"message": "Product deleted successfully", "id": product_id})

        self._send_error("Endpoint not found", 404)

def run_server():
    server_address = ('127.0.0.1', PORT)
    httpd = http.server.HTTPServer(server_address, FarmiQRequestHandler)
    print(f"FarmiQ Python Core Engine listening on http://127.0.0.1:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()

if __name__ == '__main__':
    run_server()
