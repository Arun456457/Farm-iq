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
  pincode?: string;
  latitude?: number;
  longitude?: number;
  upi_id?: string;
  upi_name?: string;
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
  days_until_harvest?: number;
  harvest_timing?: 'FUTURE' | 'TODAY' | 'PAST';
  harvest_status_label?: string;
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
  farmer_id?: number;
  farmer_name: string;
  contributed_quantity: number;
  unit?: string;
  farm_location?: string;
  farm_name?: string;
  phone?: string;
  share_pct?: number;
  payout_amount?: number;
  is_lead?: boolean;
  matched_crop_name?: string;
}

export interface NetworkFarmerProduct {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  harvest_date?: string;
}

export interface NetworkFarmer {
  id: number;
  full_name: string;
  farm_name?: string;
  email?: string;
  phone: string;
  location: string;
  active_products: NetworkFarmerProduct[];
  has_matching_crop?: boolean;
  matching_quantity?: number;
  matching_unit?: string;
  matching_crop_name?: string;
}

export interface FPOCollectiveMember {
  farmer_id: number;
  farmer_name: string;
  phone: string;
  farm_location: string;
  crop: string;
  contributed_quantity?: number;
  unit?: string;
  status: 'ACCEPTED' | 'INVITED';
  invited_at?: string;
  accepted_at?: string;
}

export interface FPOCollective {
  id: string;
  name: string;
  lead_farmer_id: number;
  lead_farmer_name: string;
  lead_farmer_phone?: string;
  focus_crop: string;
  target_volume_quintal: number;
  location: string;
  status: 'ACTIVE' | 'FORMING';
  members: FPOCollectiveMember[];
  created_at: string;
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

export type OrderStatus = 'ORDERED' | 'CONFIRMED' | 'ACCEPTED' | 'PAID' | 'PREPARING' | 'TRANSIT' | 'DELIVERED' | 'REJECTED' | 'CANCELLED';

export interface Order {
  id: number;
  lot_id?: string;
  contract_id?: string;
  order_type?: string;
  customer_id: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  buyer_id?: string;
  fpo_name?: string;
  member_farmers?: FPOMemberFarmer[];
  farmer_id: number;
  farmer_name: string;
  farmer_phone?: string;
  farmer_location?: string;
  farmer_upi_id?: string;
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
  invoice_id?: string;
  status: OrderStatus;
  driver_name?: string;
  driver_phone?: string;
  vehicle_number?: string;
  delivery_agent_assigned?: boolean;
  agent_assigned_at?: string;
  farmer_payout_amount?: number;
  image_url?: string;
  farmer_whatsapp_url?: string;
  customer_whatsapp_url?: string;
  farmer_whatsapp_msg?: string;
  customer_whatsapp_msg?: string;
  paid_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface MandiRate {
  crop: string;
  variety: string;
  mandi: string;
  district?: string;
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
  lat?: number;
  lng?: number;
  distanceKm?: number;
  category?: string;
}

export interface MandiMarket {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  operatingHours?: string;
  totalArrivalsToday?: number;
  majorCommodities?: string[];
  contact?: string;
  distanceKm?: number;
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
  status: 'OPEN' | 'BID_PLACED' | 'ACCEPTED_IN_ESCROW' | 'IN_TRANSIT' | 'DELIVERED' | 'FULFILLED' | 'COMPLETED';
  assigned_farmer_id?: number;
  assigned_farmer_name?: string;
  assigned_farmer_phone?: string;
  assigned_farmer_location?: string;
  escrow_funded?: boolean;
  escrow_amount?: number;
  escrow_status?: 'HELD_IN_ESCROW' | 'RELEASED_TO_FARMER' | 'REFUNDED_TO_BUYER';
  admin_monetization_fee?: number;
  net_farmer_payout?: number;
  escrow_transaction_id?: string;
  delivery_confirmed?: boolean;
  delivery_confirmed_at?: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  order_id?: number;
  filed_by_id: number;
  filed_by_name: string;
  filed_by_role: string;
  filed_by_phone?: string;
  filed_by_email?: string;
  filed_by_location?: string;
  reason_category?: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';
  resolution?: string;
  created_at: string;
  farmer_id?: number;
  farmer_name?: string;
  farmer_phone?: string;
  farmer_location?: string;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  product_name?: string;
  order_total?: number;
  order_status?: string;
  payment_method?: string;
  payment_status?: string;
  delivery_address?: string;
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

export interface InvoiceItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: number;
  generated_at: string;
  // Farmer details
  farmer_id: number;
  farmer_name: string;
  farmer_phone: string;
  farmer_email: string;
  farmer_address: string;
  farmer_upi_id?: string;
  // Customer details
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  // Line items
  items: InvoiceItem[];
  product_subtotal: number;
  delivery_fee: number;
  distance_km: number;
  taxes: number;
  discounts: number;
  final_amount: number;
  order_status: string; // 'Confirmed' | 'Paid'
  payment_status: string; // 'UNPAID' | 'PAID'
  transaction_id?: string;
  paid_at?: string;
}

export interface NotificationItem {
  id: string;
  recipient_id: number;
  type: 'NEW_ORDER' | 'ORDER_CONFIRMED' | 'ORDER_REJECTED' | 'PAYMENT_RECEIVED' | 'ORDER_STATUS' | 'GENERAL' | 'FPO_INVITATION' | 'FPO_INVITATION_RESPONSE';
  title: string;
  message: string;
  order_id?: number;
  collective_id?: string;
  collective_name?: string;
  inviter_name?: string;
  invoice_number?: string;
  customer_name?: string;
  customer_phone?: string;
  products_summary?: string;
  delivery_address?: string;
  order_total?: number;
  order_time?: string;
  transaction_id?: string;
  amount?: number;
  whatsapp_url?: string;
  whatsapp_message?: string;
  status: 'UNREAD' | 'READ';
  requires_action?: boolean;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  order_id: number;
  customer_id: number;
  customer_name: string;
  farmer_id: number;
  farmer_name: string;
  farmer_upi_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id: string;
  payment_status: 'PAID' | 'FAILED' | 'PENDING';
  timestamp: string;
  gateway_mode: 'sandbox' | 'manual_utr' | 'upi_intent';
  verified: boolean;
}
