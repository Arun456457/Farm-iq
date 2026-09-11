"""
FarmiQ FastAPI Application
Direct Farmer-to-Customer Marketplace with Live Mandi Pricing, Storage Booking & Order Lifecycle.
"""

from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os
from typing import List, Optional

from .database import engine, get_db, Base
from . import models, schemas, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FarmiQ Agri-Marketplace API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> models.User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required")
    token = authorization.replace("Bearer ", "").strip()
    user = db.query(models.User).filter((models.User.email == token) | (models.User.id == token)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session or user not found")
    return user

@app.get("/api/health")
def health():
    return {"status": "ok", "framework": "FastAPI with SQLAlchemy and SQLite"}

@app.post("/api/auth/register", response_model=dict)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = models.User(
        full_name=user_in.full_name,
        email=user_in.email.lower(),
        phone=user_in.phone,
        password_hash=auth.get_password_hash(user_in.password),
        role=user_in.role.lower(),
        farm_name=user_in.farm_name,
        location=user_in.location,
        delivery_address=user_in.delivery_address
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "message": "User registered successfully",
        "access_token": new_user.email,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "full_name": new_user.full_name,
            "email": new_user.email,
            "role": new_user.role,
            "farm_name": new_user.farm_name,
            "location": new_user.location
        }
    }

@app.post("/api/auth/login")
def login(creds: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == creds.email.lower()).first()
    if not user or not auth.verify_password(creds.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {
        "access_token": user.email,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "farm_name": user.farm_name,
            "location": user.location,
            "delivery_address": user.delivery_address
        }
    }

@app.get("/api/products")
def list_products(db: Session = Depends(get_db)):
    products = db.query(models.Product).filter(models.Product.quantity > 0).order_by(models.Product.id.desc()).all()
    return products

@app.post("/api/products")
def create_product(prod: schemas.ProductCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can add produce")
    
    new_product = models.Product(
        farmer_id=current_user.id,
        farmer_name=current_user.full_name,
        farm_name=current_user.farm_name or "Green Acre Farm",
        name=prod.name,
        category=prod.category,
        quantity=prod.quantity,
        unit=prod.unit,
        price=prod.price,
        harvest_date=prod.harvest_date,
        location=prod.location or current_user.location,
        description=prod.description,
        organic=1 if prod.organic else 0,
        image_url="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80"
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.post("/api/orders")
def place_order(order_in: schemas.OrderCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Only customers can place orders")
    
    product = db.query(models.Product).filter(models.Product.id == order_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.quantity < order_in.quantity:
        raise HTTPException(status_code=400, detail=f"Insufficient stock. Only {product.quantity} {product.unit} available.")
    
    # Calculate pricing
    dist = order_in.distance_km or 14.5
    delivery_fee = dist * 2.0 # Exactly 2 rupees per kilometer
    prod_total = product.price * order_in.quantity
    grand_total = prod_total + delivery_fee

    # Atomic decrement
    product.quantity -= order_in.quantity

    new_order = models.Order(
        customer_id=current_user.id,
        customer_name=current_user.full_name,
        farmer_id=product.farmer_id,
        farmer_name=product.farmer_name,
        product_id=product.id,
        product_name=product.name,
        quantity=order_in.quantity,
        unit=product.unit,
        unit_price=product.price,
        product_total=prod_total,
        distance_km=dist,
        delivery_charge=delivery_fee,
        grand_total=grand_total,
        delivery_address=order_in.delivery_address or current_user.delivery_address or "Customer Address",
        status="ORDERED"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order
