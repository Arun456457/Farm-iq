export type UserRole = 'farmer' | 'customer' | 'admin' | 'buyer';

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  farm_name?: string;
  location: string;
  delivery_address?: string;
  company_name?: string;
  buyer_type?: string;
  demand_crop?: string;
  target_volume_quintal?: number;
  gstin?: string;
  verified?: boolean;
  status?: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  created_at?: string;
}

export interface Product {
  id: number;
  farmer_id: number;
  farmer_name: string;
  farm_name?: string;
  farmer_location?: string;
  farmer_phone?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  harvest_date: string;
  location: string;
  description?: string;
  organic: number; // 0 or 1
  image_url: string;
  shelf_life_days?: number;
  days_since_harvest?: number;
  remaining_shelf_life?: number;
  storage_tips?: string;
  market_price?: number;
  price_diff?: number;
  recommendation?: string;
  action_advice?: string;
  sell_recommendation?: 'SELL_NOW' | 'WAIT_1_2_DAYS';
  sell_recommendation_reason?: string;
  created_at?: string;
}

export type QualityGrade = 'Grade-A' | 'Grade-B' | 'Grade-C';

export interface FPOMemberFarmer {
  farmer_name: string;
  contributed_quantity: number;
  unit?: string;
  farm_location?: string;
  phone?: string;
}

export interface FPOLot {
  id: string;
  farmer_id: number;
  farmer_name: string;
  fpo_name?: string;
  member_farmers?: FPOMemberFarmer[];
  crop_name: string;
  variety: string;
  quantity: number;
  unit: string;
  packaging_type: string;
  base_price_per_unit: number;
  harvest_date: string;
  location: string;
  quality_grade: QualityGrade;
  moisture_pct: number;
  defect_pct: number;
  color_uniformity_pct: number;
  certified_by?: string;
  status: 'AVAILABLE' | 'MATCHED' | 'CONTRACTED';
  matched_buyer_id?: string;
  matched_buyer_name?: string;
  linked_order_id?: number;
  fulfillment_status?: 'ACCEPTED' | 'PREPARING' | 'TRANSIT' | 'DELIVERED';
  created_at: string;
}

export interface VerifiedBuyer {
  id: string;
  user_id?: number;
  company_name: string;
  buyer_type: 'Retail Chain' | 'Agro-Exporter' | 'Food Processing Unit' | 'Wholesale Institutional';
  verified: boolean;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  escrow_verified: boolean;
  contact_person: string;
  phone?: string;
  email?: string;
  location: string;
  demand_crop: string;
  demand_grade: QualityGrade;
  target_volume_quintal: number;
  procurement_price: number;
  unit: string;
  gstin?: string;
  match_reasons?: string[];
  created_at?: string;
}

export type OrderStatus = 'ORDERED' | 'ACCEPTED' | 'PREPARING' | 'TRANSIT' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: number;
  lot_id?: string;
  contract_id?: string;
  order_type?: string;
  customer_id: number;
  customer_name: string;
  buyer_id?: string;
  fpo_name?: string;
  member_farmers?: FPOMemberFarmer[];
  farmer_id: number;
  farmer_name: string;
  product_id: number;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  product_total: number;
  distance_km: number;
  delivery_charge: number;
  grand_total: number;
  delivery_address: string;
  payment_method: string;
  payment_status: string;
  transaction_id?: string;
  status: OrderStatus;
  driver_name?: string;
  driver_phone?: string;
  vehicle_number?: string;
  image_url?: string;
  created_at: string;
}

export interface MandiRate {
  crop: string;
  variety: string;
  mandi: string;
  state: string;
  modal_price: number;
  min_price: number;
  max_price: number;
  arrival_tonnes: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  pct_change: number;
  unit: string;
  image: string;
  updated_at: string;
}

export interface StorageBooking {
  id: string;
  user_id: number;
  user_name: string;
  facility_name: string;
  location: string;
  produce_type: string;
  quantity_quintal: number;
  storage_type: string;
  duration_days: number;
  start_date: string;
  daily_rate: number;
  total_cost: number;
  status: string;
  created_at: string;
}

export interface DigitalContract {
  id: string;
  title: string;
  buyer_id: number;
  buyer_name: string;
  buyer_company?: string;
  crop_name: string;
  required_quantity: number;
  unit: string;
  offer_price: number;
  quality_grade: string;
  delivery_location: string;
  delivery_deadline: string;
  terms?: string;
  status: 'OPEN' | 'BID_PLACED' | 'ACCEPTED_IN_ESCROW' | 'FULFILLED';
  assigned_farmer_id?: number;
  assigned_farmer_name?: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  order_id?: number;
  filed_by_id: number;
  filed_by_name: string;
  filed_by_role: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';
  resolution?: string;
  created_at: string;
}

export interface CustomerRequirement {
  id: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  customer_location: string;
  crop_name: string;
  required_quantity: number;
  unit: string;
  expected_price: number;
  delivery_address: string;
  needed_by_date: string;
  notes?: string;
  status: 'OPEN' | 'ACCEPTED' | 'FULFILLED' | 'CANCELLED';
  accepted_by_farmer_id?: number | null;
  accepted_by_farmer_name?: string | null;
  accepted_by_farmer_phone?: string | null;
  created_at: string;
}

export type LanguageCode = 'en' | 'hi' | 'te' | 'mr';
