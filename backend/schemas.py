from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    role: str
    farm_name: Optional[str] = None
    location: str
    delivery_address: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ProductBase(BaseModel):
    name: str
    category: str
    quantity: float
    unit: str = "kg"
    price: float
    harvest_date: str
    location: str
    description: Optional[str] = None
    organic: bool = False

class ProductCreate(ProductBase):
    image_base64: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    farmer_id: int
    farmer_name: str
    farm_name: Optional[str] = None
    image_url: Optional[str] = None
    market_price: Optional[float] = None
    price_diff: Optional[float] = None
    shelf_life_days: Optional[int] = 14
    remaining_shelf_life: Optional[int] = None
    storage_tips: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    product_id: int
    quantity: float
    delivery_address: Optional[str] = None
    distance_km: Optional[float] = 15.0
    payment_method: Optional[str] = "UPI"

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    farmer_id: int
    farmer_name: str
    product_id: int
    product_name: str
    quantity: float
    unit: str
    unit_price: float
    product_total: float
    distance_km: float
    delivery_charge: float
    grand_total: float
    delivery_address: str
    payment_method: str
    payment_status: str
    transaction_id: Optional[str] = None
    status: str
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    vehicle_number: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
