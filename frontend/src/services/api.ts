const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9090';

// --- Interfaces ---
export interface AuthLoginRequest { email: string; password: string; }
export interface AuthForgotPasswordRequest { email: string; fullName?: string; }
export interface AuthForgotPasswordResponse { message: string; }
export interface AuthUser { id?: string; email: string; fullName: string; role?: string; }
export interface AuthLoginResponse { token: string; expiresIn: number; user: AuthUser; }
export interface CatalogProduct { id: string; name: string; category: string; price: number; image: string; colors: string[]; measures: string[]; }
export interface InventoryProduct { productId: string; sku: string; name: string; category: string; price: number; image: string; colors: string[]; measures: string[]; available: number; reserved: number; supplierName: string; createdAt: string; updatedAt: string; }
export interface CreateInventoryProductRequest { sku: string; name: string; category: string; price: number; image: string; colors: string[]; measures: string[]; available: number; reserved: number; supplierName: string; }
export interface UpdateInventoryProductRequest { sku?: string; name?: string; category?: string; price?: number; image?: string; colors?: string[]; measures?: string[]; available?: number; reserved?: number; supplierName?: string; }
export interface CartItem { productId: string; productName: string; quantity: number; unitPrice: number; subtotal: number; }
export interface CartResponse { id: string; customerId: string; items: CartItem[]; totalAmount: number; }
export interface AddCartItemRequest { customerId: string; productId: string; quantity: number; unitPrice: number; productName: string; }
export interface CreateOrderItem { productId: string; quantity: number; unitPrice: number; }
export interface CreateOrderRequest { customerId: string; items: CreateOrderItem[]; }
export interface OrderItemResponse { orderItemId?: string; productId: string; quantity: number; unitPrice: number; subtotal: number; }
export interface OrderResponse { orderId: string; customerId: string; status: string; subtotal: number; tax: number; total: number; createdAt: string; updatedAt: string; items: OrderItemResponse[]; }
export interface UpdateOrderRequest { status: string; }
export interface PaymentAuthorizeItem { productId: string; productName: string; quantity: number; unitPrice: number; }
export interface PaymentAuthorizeRequest { orderId: string; customerId: string; customerName: string; customerEmail: string; paymentMethod: string; items: PaymentAuthorizeItem[]; }
export interface InvoiceItemResponse { productName: string; quantity: number; unitPrice: number; subtotal: number; }
export interface InvoiceResponse { invoiceId?: string; paymentId?: string; orderId?: string; invoiceNumber: string; issuedAt: string; customerId?: string; customerName?: string; customerEmail?: string; paymentMethod?: string; items: InvoiceItemResponse[]; subtotal: number; tax: number; total: number; downloadUrl?: string; }
export interface PaymentResponse { paymentId: string; orderId: string; customerId: string; customerName: string; customerEmail: string; paymentMethod: string; status: string; subtotal: number; tax: number; total: number; createdAt: string; invoice?: InvoiceResponse; }
export interface PaymentAuthorizeResponse { paymentId: string; status: string; invoice: InvoiceResponse; invoicePdfBase64?: string; invoiceFileName?: string; }
export interface UpdatePaymentRequest { status: string; paymentMethod: string; }
export interface UserResponse { id: string; email: string; fullName: string; role: string; createdAt: string; isActive: boolean; }
export interface CreateUserRequest { email: string; fullName: string; password: string; role?: string; }
export interface UpdateUserRequest { email: string; fullName: string; password?: string; role?: string; isActive?: boolean; }
export interface SessionUser { id: string; email: string; fullName: string; role: string; token: string; }

const SESSION_STORAGE_KEY = 'app.session';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const session = sessionStorageService.load();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init?.headers ?? {})
  };

  if (session && session.id) {
    headers['X-User-Id'] = session.id;
    headers['X-User-Role'] = session.role || 'Customer';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (response.status === 403) {
    console.warn(`Acceso restringido: ${path}`);
    return null as any;
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Error HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const sessionStorageService = {
  save(user: SessionUser) { sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user)); },
  load(): SessionUser | null {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as SessionUser; }
    catch { sessionStorage.removeItem(SESSION_STORAGE_KEY); return null; }
  },
  clear() { sessionStorage.removeItem(SESSION_STORAGE_KEY); }
};

export const api = {
  login(payload: AuthLoginRequest) { return request<AuthLoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }); },
  forgotPassword(payload: AuthForgotPasswordRequest) { return request<AuthForgotPasswordResponse>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) }); },
  getCatalog() { return request<CatalogProduct[]>('/api/catalog'); },
  getInventoryProducts() { return request<InventoryProduct[]>('/api/inventory/products'); },
  createInventoryProduct(payload: CreateInventoryProductRequest) { return request<InventoryProduct>('/api/inventory/products', { method: 'POST', body: JSON.stringify(payload) }); },
  updateInventoryProduct(productId: string, payload: UpdateInventoryProductRequest) { return request<InventoryProduct>(`/api/inventory/products/${productId}`, { method: 'PUT', body: JSON.stringify(payload) }); },
  deleteInventoryProduct(productId: string) { return request<{ message: string }>(`/api/inventory/products/${productId}`, { method: 'DELETE' }); },
  getCart(customerId: string) { return request<CartResponse>(`/api/cart/${customerId}`); },
  addCartItem(payload: AddCartItemRequest) { return request<CartResponse>('/api/cart/items', { method: 'POST', body: JSON.stringify(payload) }); },
  clearCart(customerId: string) { return request<CartResponse>(`/api/cart/${customerId}/items`, { method: 'DELETE' }); },
  removeCartItem(customerId: string, productId: string) { return request<{ message: string }>(`/api/cart/${customerId}/items/${productId}`, { method: 'DELETE' }); },
  getOrders() { return request<OrderResponse[]>('/api/orders'); },
  getOrder(orderId: string) { return request<OrderResponse>(`/api/orders/${orderId}`); },
  createOrder(payload: CreateOrderRequest) { return request<OrderResponse>('/api/orders', { method: 'POST', body: JSON.stringify(payload) }); },
  updateOrder(orderId: string, payload: UpdateOrderRequest) { return request<OrderResponse>(`/api/orders/${orderId}`, { method: 'PUT', body: JSON.stringify(payload) }); },
  deleteOrder(orderId: string) { return request<{ message: string }>(`/api/orders/${orderId}`, { method: 'DELETE' }); },
  getPayments() { return request<PaymentResponse[]>('/api/payments'); },
  getPayment(paymentId: string) { return request<PaymentResponse>(`/api/payments/${paymentId}`); },
  authorizePayment(payload: PaymentAuthorizeRequest) { return request<PaymentAuthorizeResponse>('/api/payments/authorize', { method: 'POST', body: JSON.stringify(payload) }); },
  updatePayment(paymentId: string, payload: UpdatePaymentRequest) { return request<PaymentResponse>(`/api/payments/${paymentId}`, { method: 'PUT', body: JSON.stringify(payload) }); },
  deletePayment(paymentId: string) { return request<{ message: string }>(`/api/payments/${paymentId}`, { method: 'DELETE' }); },
  getUsers() { return request<UserResponse[]>('/api/auth/users'); },
  createUser(payload: CreateUserRequest) { return request<UserResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }); },
  updateUser(userId: string, payload: UpdateUserRequest) { return request<UserResponse>(`/api/auth/users/${userId}`, { method: 'PUT', body: JSON.stringify(payload) }); },
  deleteUser(userId: string) { return request<{ message: string }>(`/api/auth/users/${userId}`, { method: 'DELETE' }); },
  getInvoicePdfUrl(paymentId: string) { return `${API_BASE_URL}/api/payments/${paymentId}/invoice/pdf`; }
};
