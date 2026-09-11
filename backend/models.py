from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False) # 'farmer' or 'customer' or 'admin'
    farm_name = Column(String, nullable=True)
    location = Column(String, nullable=False)
    delivery_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farmer_name = Column(String, nullable=False)
    farm_name = Column(String, nullable=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, default="kg")
    price = Column(Float, nullable=False)
    harvest_date = Column(String, nullable=False)
    location = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    organic = Column(Integer, default=0)
    image_url = Column(String, nullable=True)
    shelf_life_days = Column(Integer, default=14)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    customer_name = Column(String, nullable=False)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farmer_name = Column(String, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product_name = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, default="kg")
    unit_price = Column(Float, nullable=False)
    product_total = Column(Float, nullable=False)
    distance_km = Column(Float, nullable=False)
    delivery_charge = Column(Float, nullable=False) # Exactly distance_km * 2.0
    grand_total = Column(Float, nullable=False)
    delivery_address = Column(Text, nullable=False)
    payment_method = Column(String, default="UPI")
    payment_status = Column(String, default="PAID")
    transaction_id = Column(String, nullable=True)
    status = Column(String, default="ORDERED") # ORDERED, ACCEPTED, PREPARING, TRANSIT, DELIVERED, CANCELLED
    driver_name = Column(String, nullable=True)
    driver_phone = Column(String, nullable=True)
    vehicle_number = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
