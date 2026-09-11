import { User, Product, Order, MandiRate, StorageBooking, DigitalContract, Dispute, CustomerRequirement, FPOLot, VerifiedBuyer } from './types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('farmiq_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('farmiq_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('farmiq_token');
  localStorage.removeItem('farmiq_user');
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('farmiq_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
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
  updateOrderStatus: (orderId: number, status: string) => request<Order>(`/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),
  getOrderTracking: (orderId: number) => request<any>(`/orders/${orderId}/tracking`),

  // Mandi Prices
  getMandiPrices: (params?: { crop?: string; state?: string }) => {
    const query = new URLSearchParams();
    if (params?.crop) query.append('crop', params.crop);
    if (params?.state) query.append('state', params.state);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ mandi_prices: MandiRate[]; timestamp: string }>(`/mandi-prices${qs}`);
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

  // FPO Lots & Verified Buyer Matchmaking
  getLots: () => request<FPOLot[]>('/lots'),
  createLot: (payload: any) => request<{ message: string; lot: FPOLot }>('/lots', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getVerifiedBuyers: (crop?: string) => {
    const qs = crop ? `?crop=${encodeURIComponent(crop)}` : '';
    return request<VerifiedBuyer[]>(`/verified-buyers${qs}`);
  },
  matchLotWithBuyer: (lotId: string, buyerId: string) => request<{ message: string; contract: DigitalContract; lot: FPOLot; order?: Order }>(`/lots/${lotId}/match`, {
    method: 'POST',
    body: JSON.stringify({ buyer_id: buyerId })
  }),
  procureLot: (lotId: string) => request<{ message: string; contract: DigitalContract; lot: FPOLot; order?: Order }>(`/lots/${lotId}/procure`, {
    method: 'POST'
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
