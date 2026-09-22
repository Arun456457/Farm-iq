import { User, Product, Order, MandiRate, MandiMarket, StorageBooking, DigitalContract, Dispute, CustomerRequirement, FPOLot, VerifiedBuyer, NetworkFarmer, Invoice, NotificationItem, PaymentRecord, FPOCollective } from './types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return sessionStorage.getItem('farmiq_token') || localStorage.getItem('farmiq_token');
}

export function setAuthToken(token: string) {
  sessionStorage.setItem('farmiq_token', token);
  localStorage.setItem('farmiq_token', token);
}

export function removeAuthToken() {
  sessionStorage.removeItem('farmiq_token');
  sessionStorage.removeItem('farmiq_user');
  localStorage.removeItem('farmiq_token');
  localStorage.removeItem('farmiq_user');
}

export function getStoredUser(): User | null {
  try {
    const raw = sessionStorage.getItem('farmiq_user') || localStorage.getItem('farmiq_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  sessionStorage.setItem('farmiq_user', JSON.stringify(user));
  localStorage.setItem('farmiq_user', JSON.stringify(user));
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || data.error || `Request failed (${response.status})`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: any) => request<{ user: User; access_token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  login: (payload: any) => request<{ user: User; access_token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  forgotPassword: (payload: { identifier: string }) => request<{
    success: boolean;
    message: string;
    email: string;
    phone: string;
    full_name: string;
    role: string;
    password: string;
    whatsapp_url: string;
  }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  resetPassword: (payload: { identifier: string; new_password: string }) => request<{
    success: boolean;
    message: string;
    user: User;
  }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  getMe: () => request<{ user: User }>('/auth/me'),

  // Products
  getProducts: () => request<Product[]>('/products'),
  getFarmerProducts: () => request<Product[]>('/farmer/products'),
  createProduct: (payload: any) => request<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  deleteProduct: (id: number) => request<{ message: string }>(`/products/${id}`, {
    method: 'DELETE'
  }),
  updateProduct: (id: number, payload: any) => request<any>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  // Orders
  createOrder: async (payload: any) => {
    const res = await request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return (res.order ? res.order : res) as Order;
  },
  getCustomerOrders: () => request<Order[]>('/customer/orders'),
  getFarmerOrders: () => request<Order[]>('/farmer/orders'),
  updateOrderStatus: async (orderId: number, status: string, extraData?: any) => {
    const res = await request<any>(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, ...(extraData || {}) })
    });
    return (res.order ? res.order : res) as Order;
  },
  acceptOrder: (orderId: number) => request<{ message: string; order: Order; invoice: Invoice; customer_whatsapp_url?: string }>(`/orders/${orderId}/accept`, {
    method: 'POST'
  }),
  rejectOrder: (orderId: number, reason?: string) => request<{ message: string; order: Order }>(`/orders/${orderId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  }),
  getOrderInvoice: (orderId: number) => request<Invoice>(`/orders/${orderId}/invoice`),
  payOrderUPI: (orderId: number, payload: { amount: number; transaction_id?: string; gateway_mode?: string }) => request<{ message: string; order: Order; invoice: Invoice; payment: PaymentRecord }>(`/orders/${orderId}/pay-upi`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  payOrderCOD: (orderId: number) => request<{ message: string; order: Order; invoice?: Invoice }>(`/orders/${orderId}/pay-cod`, {
    method: 'POST'
  }),
  getOrderTracking: (orderId: number) => request<any>(`/orders/${orderId}/tracking`),

  // User Profile
  updateProfile: (payload: Partial<User>) => request<{ message: string; user: User }>('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  // Notifications
  getNotifications: () => request<NotificationItem[]>('/notifications'),
  markNotificationRead: (id: string) => request<{ message: string }>(`/notifications/${id}/read`, {
    method: 'PUT'
  }),

  // Mandi Prices & Local Market Areas
  getMandiAreas: () => request<{ states: string[]; districtsByState: Record<string, string[]>; markets: MandiMarket[] }>('/mandi-areas'),
  getMandiPrices: (params?: { crop?: string; state?: string; district?: string; mandi?: string; lat?: number; lng?: number; category?: string; location?: string }) => {
    const query = new URLSearchParams();
    if (params?.crop) query.append('crop', params.crop);
    if (params?.state) query.append('state', params.state);
    if (params?.district) query.append('district', params.district);
    if (params?.mandi) query.append('mandi', params.mandi);
    if (params?.lat !== undefined) query.append('lat', String(params.lat));
    if (params?.lng !== undefined) query.append('lng', String(params.lng));
    if (params?.category) query.append('category', params.category);
    if (params?.location) query.append('location', params.location);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ mandi_prices: MandiRate[]; timestamp: string; nearest_market?: MandiMarket; selected_market?: MandiMarket }>(`/mandi-prices${qs}`);
  },

  // Storage
  bookStorage: (payload: any) => request<{ message: string; booking: StorageBooking }>('/storage/book', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getStorageBookings: () => request<StorageBooking[]>('/storage/bookings'),

  // Digital Contracts
  getContracts: () => request<DigitalContract[]>('/contracts'),
  createContract: (payload: any) => request<DigitalContract>('/contracts', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  acceptContract: (id: string) => request<DigitalContract>(`/contracts/${id}/accept`, {
    method: 'POST'
  }),
  depositContractEscrow: (id: string, payload?: any) => request<DigitalContract>(`/contracts/${id}/escrow-deposit`, {
    method: 'POST',
    body: JSON.stringify(payload || {})
  }),
  deliverContract: (id: string) => request<DigitalContract>(`/contracts/${id}/deliver`, {
    method: 'POST'
  }),
  confirmContractDelivery: (id: string) => request<{ message: string; contract: DigitalContract; payment_record: any }>(`/contracts/${id}/confirm-delivery`, {
    method: 'POST'
  }),
  codOrderAction: (orderId: number, accept: boolean, reason?: string) => request<{ message: string; order: Order }>(`/orders/${orderId}/cod-action`, {
    method: 'POST',
    body: JSON.stringify({ accept, reason })
  }),
  assignDeliveryAgent: (orderId: number, data: { driver_name: string; driver_phone: string; vehicle_number?: string }) => request<{ message: string; order: Order; notification: any }>(`/orders/${orderId}/assign-delivery-agent`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getAdminMonetization: () => request<any>('/admin/monetization'),

  // Disputes
  getDisputes: () => request<Dispute[]>('/disputes'),
  fileDispute: (payload: any) => request<Dispute>('/disputes', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  resolveDispute: (id: string, resolution: string) => request<Dispute>(`/disputes/${id}/resolve`, {
    method: 'PUT',
    body: JSON.stringify({ resolution })
  }),

  // Customer Requirements & Farmer Demands
  getRequirements: () => request<CustomerRequirement[]>('/requirements'),
  postRequirement: (payload: any) => request<{ message: string; requirement: CustomerRequirement }>('/requirements', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  acceptRequirement: (id: string) => request<{ message: string; requirement: CustomerRequirement; order?: Order }>(`/requirements/${id}/accept`, {
    method: 'POST'
  }),

  // FPO Collectives & Multi-Farmer Pooling
  getFPOCollectives: (options?: { my?: boolean; crop?: string }) => {
    const params = new URLSearchParams();
    if (options?.my) params.append('my', 'true');
    if (options?.crop) params.append('crop', options.crop);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<FPOCollective[]>(`/fpo/collectives${qs}`);
  },
  createFPOCollective: (payload: {
    name: string;
    focus_crop: string;
    target_volume_quintal?: number;
    location?: string;
    description?: string;
    invited_farmer_ids?: number[];
  }) => request<{ message: string; collective: FPOCollective }>('/fpo/collectives', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  inviteFarmerToFPO: (collectiveId: string, farmerId: number) => request<{ message: string; collective: FPOCollective }>(`/fpo/collectives/${collectiveId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ farmer_id: farmerId })
  }),
  respondToFPOInvite: (collectiveId: string, action: 'accept' | 'decline', contributed_quantity?: number) => request<{ message: string; collective: FPOCollective }>(`/fpo/collectives/${collectiveId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ action, contributed_quantity })
  }),

  // FPO Lots & Verified Buyer Matchmaking
  getLots: () => request<FPOLot[]>('/lots'),
  createLot: (payload: any) => request<{ message: string; lot: FPOLot }>('/lots', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getNetworkFarmers: (crop?: string) => {
    const qs = crop ? `?crop=${encodeURIComponent(crop)}` : '';
    return request<NetworkFarmer[]>(`/farmers/network${qs}`);
  },
  getVerifiedBuyers: (crop?: string) => {
    const qs = crop ? `?crop=${encodeURIComponent(crop)}` : '';
    return request<VerifiedBuyer[]>(`/verified-buyers${qs}`);
  },
  matchLotWithBuyer: (lotId: string, buyerId: string) => request<{ message: string; contract: DigitalContract; lot: FPOLot; order?: Order }>(`/lots/${lotId}/match`, {
    method: 'POST',
    body: JSON.stringify({ buyer_id: buyerId })
  }),
  procureLot: (lotId: string, payload?: { delivery_address?: string; distance_km?: number }) => request<{ message: string; contract: DigitalContract; lot: FPOLot; order?: Order }>(`/lots/${lotId}/procure`, {
    method: 'POST',
    body: JSON.stringify(payload || {})
  }),
  getBuyerOrders: () => request<Order[]>('/buyer/orders'),

  // Admin
  getAdminOverview: () => request<any>('/admin/overview'),
  getAdminUsers: () => request<{ users: User[] }>('/admin/users'),
  getAdminBuyers: () => request<VerifiedBuyer[]>('/admin/buyers'),
  verifyBuyer: (buyerId: string) => request<{ message: string; buyer: VerifiedBuyer }>(`/admin/buyers/${buyerId}/verify`, {
    method: 'POST'
  }),
  rejectBuyer: (buyerId: string) => request<{ message: string; buyer: VerifiedBuyer }>(`/admin/buyers/${buyerId}/reject`, {
    method: 'POST'
  }),

  // Gemini AI Chat
  sendChat: (message: string, context?: any, userRole?: string) => request<{ reply: string }>('/chat', {
    method: 'POST',
    body: JSON.stringify({ message, context, userRole })
  })
};
