import { useEffect, useMemo, useState } from 'react';
import { ProductCard } from './components/ProductCard';
import { CategoryFilter } from './components/CategoryFilter';
import { CartPanel } from './components/CartPanel';
import { LoginForm } from './components/LoginForm';
import {
  api,
  sessionStorageService,
  type CartResponse,
  type CreateInventoryProductRequest,
  type CreateOrderRequest,
  type InventoryProduct,
  type OrderResponse,
  type PaymentAuthorizeRequest,
  type PaymentResponse,
  type SessionUser,
  type UpdateInventoryProductRequest,
  type UpdateOrderRequest,
  type UpdatePaymentRequest,
  type UserResponse
} from './services/api';
import type { Product } from './types/product';

const FALLBACK_CUSTOMER_ID = '11111111-1111-1111-1111-111111111111';
const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80';

type AdminSection =
  | 'dashboard'
  | 'inventory'
  | 'orders'
  | 'payments'
  | 'invoices'
  | 'users'
  | 'carts';

type UserFormState = {
  id: string | null;
  email: string;
  fullName: string;
  password: string;
  role: string;
  isActive: boolean;
};

type InventoryFormState = {
  productId: string | null;
  sku: string;
  name: string;
  category: string;
  price: string;
  image: string;
  colors: string;
  measures: string;
  available: string;
  reserved: string;
  supplierName: string;
};

type OrderFormState = {
  customerId: string;
  productId: string;
  quantity: string;
  unitPrice: string;
};

type PaymentFormState = {
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
};

const EMPTY_USER_FORM: UserFormState = {
  id: null,
  email: '',
  fullName: '',
  password: '',
  role: 'Customer',
  isActive: true
};

const EMPTY_INVENTORY_FORM: InventoryFormState = {
  productId: null,
  sku: '',
  name: '',
  category: '',
  price: '',
  image: '',
  colors: '',
  measures: '',
  available: '0',
  reserved: '0',
  supplierName: ''
};

const EMPTY_ORDER_FORM: OrderFormState = {
  customerId: FALLBACK_CUSTOMER_ID,
  productId: '',
  quantity: '1',
  unitPrice: ''
};

const EMPTY_PAYMENT_FORM: PaymentFormState = {
  orderId: '',
  customerId: FALLBACK_CUSTOMER_ID,
  customerName: 'Cliente Demo',
  customerEmail: 'cliente@muebles.com',
  paymentMethod: 'Tarjeta',
  productId: '',
  productName: '',
  quantity: '1',
  unitPrice: ''
};

function parseCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

function buildSessionUser(sessionUser: SessionUser | null) {
  if (!sessionUser) {
    return {
      customerId: FALLBACK_CUSTOMER_ID,
      fullName: 'Cliente invitado',
      email: 'cliente@muebles.com',
      role: 'Guest',
      isAuthenticated: false,
      token: ''
    };
  }

  return {
    customerId: sessionUser.id || FALLBACK_CUSTOMER_ID,
    fullName: sessionUser.fullName,
    email: sessionUser.email,
    role: sessionUser.role,
    isAuthenticated: true,
    token: sessionUser.token
  };
}

export function App() {
  const initialSession = buildSessionUser(sessionStorageService.load());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [customerId, setCustomerId] = useState<string>(initialSession.customerId);
  const [userName, setUserName] = useState<string>(initialSession.fullName);
  const [userEmail, setUserEmail] = useState<string>(initialSession.email);
  const [userRole, setUserRole] = useState<string>(initialSession.role);
  const [authToken, setAuthToken] = useState<string>(initialSession.token);
  const [isAuthenticated, setIsAuthenticated] = useState(initialSession.isAuthenticated);
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<UserFormState>(EMPTY_USER_FORM);
  const [inventoryForm, setInventoryForm] = useState<InventoryFormState>(EMPTY_INVENTORY_FORM);
  const [orderForm, setOrderForm] = useState<OrderFormState>({ ...EMPTY_ORDER_FORM, customerId: initialSession.customerId });
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    ...EMPTY_PAYMENT_FORM,
    customerId: initialSession.customerId,
    customerName: initialSession.fullName === 'Cliente invitado' ? 'Cliente Demo' : initialSession.fullName,
    customerEmail: initialSession.email
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState('Created');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('Authorized');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Tarjeta');

  const isAdmin = isAuthenticated && userRole === 'Admin';

  const resetFeedback = () => {
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const loadCatalog = async () => {
    try {
      setCatalogLoading(true);
      const catalog = await api.getCatalog();
      setProducts(catalog);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible cargar el catálogo');
    } finally {
      setCatalogLoading(false);
    }
  };

  const loadInventory = async () => {
    try {
      setInventoryLoading(true);
      const inventory = await api.getInventoryProducts();
      setInventoryProducts(inventory);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible cargar el inventario');
    } finally {
      setInventoryLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await api.getOrders();
      setOrders(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible cargar las órdenes');
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      setPaymentsLoading(true);
      const response = await api.getPayments();
      setPayments(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible cargar los pagos');
    } finally {
      setPaymentsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await api.getUsers();
      setUsers(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible cargar los usuarios');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadCart = async (activeCustomerId: string) => {
    try {
      setCartLoading(true);
      const response = await api.getCart(activeCustomerId);
      setCart(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible cargar el carrito');
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
    void loadInventory();
    void loadOrders();
    void loadPayments();
    void loadUsers();
  }, []);

  useEffect(() => {
    void loadCart(customerId);
  }, [customerId]);

  const filteredProducts = useMemo(() => {
    return selectedCategory === 'all'
      ? products
      : products.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

  const filteredInventory = useMemo(() => {
    return selectedCategory === 'all'
      ? inventoryProducts
      : inventoryProducts.filter((product) => product.category === selectedCategory);
  }, [inventoryProducts, selectedCategory]);

  const totalItems = cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0;

  const addToCart = async (product: Product) => {
  try {
    resetFeedback();
    // Reemplaza el texto anterior por un GUID de prueba válido
    const updatedCart = await api.addCartItem({
      customerId: "550e8400-e29b-41d4-a716-446655440000", 
      productId: (product as any).productId || product.id, 
      quantity: 1,
      unitPrice: Number(product.price), // Asegúrate de que el precio sea un número
      productName: product.name
    });
    setCart(updatedCart);
    setStatusMessage(`${product.name} agregado al carrito`);
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    setErrorMessage("No se pudo agregar el producto al carrito.");
  }
};

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      return;
    }

    try {
      setCheckoutLoading(true);
      resetFeedback();
      const order = await api.createOrder({
        customerId,
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      });
      setStatusMessage(`Orden ${order.orderId} creada con estado ${order.status}`);
      await loadOrders();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible crear la orden');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const submitInventory = async () => {
    try {
      resetFeedback();
      const payload: CreateInventoryProductRequest | UpdateInventoryProductRequest = {
        sku: inventoryForm.sku,
        name: inventoryForm.name,
        category: inventoryForm.category,
        price: Number(inventoryForm.price),
        image: inventoryForm.image || DEFAULT_PRODUCT_IMAGE,
        colors: parseCsv(inventoryForm.colors),
        measures: parseCsv(inventoryForm.measures),
        available: Number(inventoryForm.available),
        reserved: Number(inventoryForm.reserved),
        supplierName: inventoryForm.supplierName
      };

      if (inventoryForm.productId) {
        await api.updateInventoryProduct(inventoryForm.productId, payload as UpdateInventoryProductRequest);
        setStatusMessage('Producto actualizado correctamente');
      } else {
        await api.createInventoryProduct(payload as CreateInventoryProductRequest);
        setStatusMessage('Producto creado correctamente');
      }

      setInventoryForm(EMPTY_INVENTORY_FORM);
      await loadInventory();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible guardar el producto');
    }
  };

  const editInventoryProduct = (product: InventoryProduct) => {
    setInventoryForm({
      productId: product.productId,
      sku: product.sku,
      name: product.name,
      category: product.category,
      price: String(product.price),
      image: product.image,
      colors: product.colors.join(', '),
      measures: product.measures.join(', '),
      available: String(product.available),
      reserved: String(product.reserved),
      supplierName: product.supplierName
    });
  };

  const removeInventoryProduct = async (productId: string) => {
    try {
      resetFeedback();
      await api.deleteInventoryProduct(productId);
      setStatusMessage('Producto eliminado correctamente');
      await loadInventory();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible eliminar el producto');
    }
  };

  const submitOrder = async () => {
    try {
      resetFeedback();
      const payload: CreateOrderRequest = {
        customerId: orderForm.customerId,
        items: [
          {
            productId: orderForm.productId,
            quantity: Number(orderForm.quantity),
            unitPrice: Number(orderForm.unitPrice)
          }
        ]
      };
      await api.createOrder(payload);
      setOrderForm({ ...EMPTY_ORDER_FORM, customerId });
      setStatusMessage('Orden creada correctamente');
      await loadOrders();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible crear la orden');
    }
  };

  const saveOrderStatus = async () => {
    if (!selectedOrderId) {
      return;
    }

    try {
      resetFeedback();
      const payload: UpdateOrderRequest = { status: selectedOrderStatus };
      await api.updateOrder(selectedOrderId, payload);
      setStatusMessage('Orden actualizada correctamente');
      await loadOrders();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible actualizar la orden');
    }
  };

  const removeOrder = async (orderId: string) => {
    try {
      resetFeedback();
      await api.deleteOrder(orderId);
      setStatusMessage('Orden eliminada correctamente');
      await loadOrders();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible eliminar la orden');
    }
  };

  const submitPayment = async () => {
    try {
      resetFeedback();
      const payload: PaymentAuthorizeRequest = {
        orderId: paymentForm.orderId,
        customerId: paymentForm.customerId,
        customerName: paymentForm.customerName,
        customerEmail: paymentForm.customerEmail,
        paymentMethod: paymentForm.paymentMethod,
        items: [
          {
            productId: paymentForm.productId,
            productName: paymentForm.productName,
            quantity: Number(paymentForm.quantity),
            unitPrice: Number(paymentForm.unitPrice)
          }
        ]
      };
      await api.authorizePayment(payload);
      setPaymentForm({
        ...EMPTY_PAYMENT_FORM,
        customerId,
        customerName: userName === 'Cliente invitado' ? 'Cliente Demo' : userName,
        customerEmail: userEmail
      });
      setStatusMessage('Pago autorizado correctamente');
      await loadPayments();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible autorizar el pago');
    }
  };

  const savePayment = async () => {
    if (!selectedPaymentId) {
      return;
    }

    try {
      resetFeedback();
      const payload: UpdatePaymentRequest = {
        status: selectedPaymentStatus,
        paymentMethod: selectedPaymentMethod
      };
      await api.updatePayment(selectedPaymentId, payload);
      setStatusMessage('Pago actualizado correctamente');
      await loadPayments();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible actualizar el pago');
    }
  };

  const removePayment = async (paymentId: string) => {
    try {
      resetFeedback();
      await api.deletePayment(paymentId);
      setStatusMessage('Pago eliminado correctamente');
      await loadPayments();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible eliminar el pago');
    }
  };

  const submitUser = async () => {
    try {
      resetFeedback();
      if (userForm.id) {
        await api.updateUser(userForm.id, {
          email: userForm.email,
          fullName: userForm.fullName,
          password: userForm.password || undefined,
          role: userForm.role,
          isActive: userForm.isActive
        });
        setStatusMessage('Usuario actualizado correctamente');
      } else {
        await api.createUser({
          email: userForm.email,
          fullName: userForm.fullName,
          password: userForm.password
        });
        setStatusMessage('Usuario creado correctamente');
      }
      setUserForm(EMPTY_USER_FORM);
      await loadUsers();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible guardar el usuario');
    }
  };

  const editUser = (user: UserResponse) => {
    setUserForm({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      password: '',
      role: user.role,
      isActive: user.isActive
    });
  };

  const removeUser = async (userId: string) => {
    try {
      resetFeedback();
      await api.deleteUser(userId);
      setStatusMessage('Usuario eliminado correctamente');
      await loadUsers();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible eliminar el usuario');
    }
  };

  const handleLogout = () => {
    sessionStorageService.clear();
    setCustomerId(FALLBACK_CUSTOMER_ID);
    setUserName('Cliente invitado');
    setUserEmail('cliente@muebles.com');
    setUserRole('Guest');
    setAuthToken('');
    setIsAuthenticated(false);
    setActiveSection('dashboard');
    setOrderForm({ ...EMPTY_ORDER_FORM, customerId: FALLBACK_CUSTOMER_ID });
    setPaymentForm({
      ...EMPTY_PAYMENT_FORM,
      customerId: FALLBACK_CUSTOMER_ID,
      customerName: 'Cliente Demo',
      customerEmail: 'cliente@muebles.com'
    });
    setStatusMessage('Sesión cerrada correctamente');
  };

  const renderAdminContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <p className="text-sm text-stone-600">Resumen general del sistema.</p>;
      case 'inventory':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 rounded-2xl bg-stone-50 p-4 md:grid-cols-2 xl:grid-cols-4">
              <input aria-label="SKU producto" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="SKU" value={inventoryForm.sku} onChange={(event) => setInventoryForm((current) => ({ ...current, sku: event.target.value }))} />
              <input aria-label="Nombre producto" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Nombre" value={inventoryForm.name} onChange={(event) => setInventoryForm((current) => ({ ...current, name: event.target.value }))} />
              <input aria-label="Categoría producto" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Categoría" value={inventoryForm.category} onChange={(event) => setInventoryForm((current) => ({ ...current, category: event.target.value }))} />
              <input aria-label="Precio producto" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Precio" type="number" value={inventoryForm.price} onChange={(event) => setInventoryForm((current) => ({ ...current, price: event.target.value }))} />
              <input aria-label="Proveedor producto" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Proveedor" value={inventoryForm.supplierName} onChange={(event) => setInventoryForm((current) => ({ ...current, supplierName: event.target.value }))} />
              <input aria-label="Stock disponible" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Disponible" type="number" value={inventoryForm.available} onChange={(event) => setInventoryForm((current) => ({ ...current, available: event.target.value }))} />
              <input aria-label="Stock reservado" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Reservado" type="number" value={inventoryForm.reserved} onChange={(event) => setInventoryForm((current) => ({ ...current, reserved: event.target.value }))} />
              <input aria-label="Imagen producto" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Imagen URL" value={inventoryForm.image} onChange={(event) => setInventoryForm((current) => ({ ...current, image: event.target.value }))} />
              <input aria-label="Colores producto" className="rounded-lg border border-stone-300 px-3 py-2 text-sm md:col-span-2" placeholder="Colores separados por coma" value={inventoryForm.colors} onChange={(event) => setInventoryForm((current) => ({ ...current, colors: event.target.value }))} />
              <input aria-label="Medidas producto" className="rounded-lg border border-stone-300 px-3 py-2 text-sm md:col-span-2" placeholder="Medidas separadas por coma" value={inventoryForm.measures} onChange={(event) => setInventoryForm((current) => ({ ...current, measures: event.target.value }))} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700" onClick={() => void submitInventory()}>
                {inventoryForm.productId ? 'Guardar producto' : 'Crear producto'}
              </button>
              <button type="button" className="rounded-lg bg-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-300" onClick={() => setInventoryForm(EMPTY_INVENTORY_FORM)}>
                Limpiar formulario
              </button>
            </div>
            {inventoryLoading ? (
              <p className="text-sm text-stone-500">Cargando inventario...</p>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-stone-200 text-sm">
                    <thead className="bg-stone-100 text-left text-stone-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Producto</th>
                        <th className="px-4 py-3 font-semibold">SKU</th>
                        <th className="px-4 py-3 font-semibold">Categoría</th>
                        <th className="px-4 py-3 font-semibold">Precio</th>
                        <th className="px-4 py-3 font-semibold">Disponible</th>
                        <th className="px-4 py-3 font-semibold">Reservado</th>
                        <th className="px-4 py-3 font-semibold">Proveedor</th>
                        <th className="px-4 py-3 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {filteredInventory.map((product) => (
                        <tr key={product.productId}>
                          <td className="px-4 py-3">{product.name}</td>
                          <td className="px-4 py-3">{product.sku}</td>
                          <td className="px-4 py-3">{product.category}</td>
                          <td className="px-4 py-3">{formatCurrency(product.price)}</td>
                          <td className="px-4 py-3">{product.available}</td>
                          <td className="px-4 py-3">{product.reserved}</td>
                          <td className="px-4 py-3">{product.supplierName}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button type="button" className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-medium text-white hover:bg-amber-600" onClick={() => editInventoryProduct(product)}>Editar</button>
                              <button type="button" className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700" onClick={() => void removeInventoryProduct(product.productId)}>Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 rounded-2xl bg-stone-50 p-4 md:grid-cols-2 xl:grid-cols-4">
              <input aria-label="Cliente orden" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Customer ID" value={orderForm.customerId} onChange={(event) => setOrderForm((current) => ({ ...current, customerId: event.target.value }))} />
              <input aria-label="Producto orden" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Product ID" value={orderForm.productId} onChange={(event) => setOrderForm((current) => ({ ...current, productId: event.target.value }))} />
              <input aria-label="Cantidad orden" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Cantidad" type="number" value={orderForm.quantity} onChange={(event) => setOrderForm((current) => ({ ...current, quantity: event.target.value }))} />
              <input aria-label="Precio unitario orden" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Precio unitario" type="number" value={orderForm.unitPrice} onChange={(event) => setOrderForm((current) => ({ ...current, unitPrice: event.target.value }))} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700" onClick={() => void submitOrder()}>Crear orden</button>
              <button type="button" className="rounded-lg bg-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-300" onClick={() => setOrderForm({ ...EMPTY_ORDER_FORM, customerId })}>Limpiar formulario</button>
            </div>
            <div className="grid gap-4 rounded-2xl bg-stone-50 p-4 md:grid-cols-[2fr_1fr_auto]">
              <select aria-label="Seleccionar orden" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" value={selectedOrderId ?? ''} onChange={(event) => setSelectedOrderId(event.target.value || null)}>
                <option value="">Selecciona una orden</option>
                {orders.map((order) => (
                  <option key={order.orderId} value={order.orderId}>{order.orderId}</option>
                ))}
              </select>
              <select aria-label="Estado orden" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" value={selectedOrderStatus} onChange={(event) => setSelectedOrderStatus(event.target.value)}>
                {['Created', 'Paid', 'Cancelled', 'Shipped'].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <button type="button" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600" onClick={() => void saveOrderStatus()}>Guardar estado</button>
            </div>
            {ordersLoading ? (
              <p className="text-sm text-stone-500">Cargando órdenes...</p>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-stone-200 text-sm">
                    <thead className="bg-stone-100 text-left text-stone-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Orden</th>
                        <th className="px-4 py-3 font-semibold">Cliente</th>
                        <th className="px-4 py-3 font-semibold">Estado</th>
                        <th className="px-4 py-3 font-semibold">Total</th>
                        <th className="px-4 py-3 font-semibold">Creada</th>
                        <th className="px-4 py-3 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {orders.map((order) => (
                        <tr key={order.orderId}>
                          <td className="px-4 py-3">{order.orderId}</td>
                          <td className="px-4 py-3">{order.customerId}</td>
                          <td className="px-4 py-3">{order.status}</td>
                          <td className="px-4 py-3">{formatCurrency(order.total)}</td>
                          <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
                          <td className="px-4 py-3">
                            <button type="button" className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700" onClick={() => void removeOrder(order.orderId)}>Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      case 'payments':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 rounded-2xl bg-stone-50 p-4 md:grid-cols-2 xl:grid-cols-4">
              <input aria-label="Orden pago" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Order ID" value={paymentForm.orderId} onChange={(event) => setPaymentForm((current) => ({ ...current, orderId: event.target.value }))} />
              <input aria-label="Cliente pago" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Customer ID" value={paymentForm.customerId} onChange={(event) => setPaymentForm((current) => ({ ...current, customerId: event.target.value }))} />
              <input aria-label="Nombre cliente pago" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Nombre cliente" value={paymentForm.customerName} onChange={(event) => setPaymentForm((current) => ({ ...current, customerName: event.target.value }))} />
              <input aria-label="Correo cliente pago" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Correo cliente" value={paymentForm.customerEmail} onChange={(event) => setPaymentForm((current) => ({ ...current, customerEmail: event.target.value }))} />
              <input aria-label="Producto pago" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Product ID" value={paymentForm.productId} onChange={(event) => setPaymentForm((current) => ({ ...current, productId: event.target.value }))} />
              <input aria-label="Nombre producto pago" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Nombre producto" value={paymentForm.productName} onChange={(event) => setPaymentForm((current) => ({ ...current, productName: event.target.value }))} />
              <input aria-label="Cantidad pago" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Cantidad" type="number" value={paymentForm.quantity} onChange={(event) => setPaymentForm((current) => ({ ...current, quantity: event.target.value }))} />
              <input aria-label="Precio pago" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Precio unitario" type="number" value={paymentForm.unitPrice} onChange={(event) => setPaymentForm((current) => ({ ...current, unitPrice: event.target.value }))} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700" onClick={() => void submitPayment()}>Autorizar pago</button>
              <button type="button" className="rounded-lg bg-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-300" onClick={() => setPaymentForm({ ...EMPTY_PAYMENT_FORM, customerId, customerName: userName === 'Cliente invitado' ? 'Cliente Demo' : userName, customerEmail: userEmail })}>Limpiar formulario</button>
            </div>
            <div className="grid gap-4 rounded-2xl bg-stone-50 p-4 md:grid-cols-[2fr_1fr_1fr_auto]">
              <select aria-label="Seleccionar pago" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" value={selectedPaymentId ?? ''} onChange={(event) => setSelectedPaymentId(event.target.value || null)}>
                <option value="">Selecciona un pago</option>
                {payments.map((payment) => (
                  <option key={payment.paymentId} value={payment.paymentId}>{payment.paymentId}</option>
                ))}
              </select>
              <select aria-label="Estado pago" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" value={selectedPaymentStatus} onChange={(event) => setSelectedPaymentStatus(event.target.value)}>
                {['Authorized', 'Captured', 'Rejected', 'Refunded'].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select aria-label="Método pago" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" value={selectedPaymentMethod} onChange={(event) => setSelectedPaymentMethod(event.target.value)}>
                {['Tarjeta', 'Transferencia', 'Efectivo'].map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
              <button type="button" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600" onClick={() => void savePayment()}>Guardar pago</button>
            </div>
            {paymentsLoading ? (
              <p className="text-sm text-stone-500">Cargando pagos...</p>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-stone-200 text-sm">
                    <thead className="bg-stone-100 text-left text-stone-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Pago</th>
                        <th className="px-4 py-3 font-semibold">Orden</th>
                        <th className="px-4 py-3 font-semibold">Estado</th>
                        <th className="px-4 py-3 font-semibold">Método</th>
                        <th className="px-4 py-3 font-semibold">Total</th>
                        <th className="px-4 py-3 font-semibold">Factura</th>
                        <th className="px-4 py-3 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {payments.map((payment) => (
                        <tr key={payment.paymentId}>
                          <td className="px-4 py-3">{payment.paymentId}</td>
                          <td className="px-4 py-3">{payment.orderId}</td>
                          <td className="px-4 py-3">{payment.status}</td>
                          <td className="px-4 py-3">{payment.paymentMethod}</td>
                          <td className="px-4 py-3">{formatCurrency(payment.total)}</td>
                          <td className="px-4 py-3">{payment.invoice?.invoiceNumber ?? 'Sin factura'}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {payment.invoice && (
                                <a className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-700" href={api.getInvoicePdfUrl(payment.paymentId)} target="_blank" rel="noreferrer">PDF</a>
                              )}
                              <button type="button" className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700" onClick={() => void removePayment(payment.paymentId)}>Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      case 'invoices':
        return (
          <div className="space-y-4">
            <p className="text-sm text-stone-600">Facturas disponibles desde los pagos autorizados.</p>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-200 text-sm">
                  <thead className="bg-stone-100 text-left text-stone-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Pago</th>
                      <th className="px-4 py-3 font-semibold">Factura</th>
                      <th className="px-4 py-3 font-semibold">Emitida</th>
                      <th className="px-4 py-3 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {payments.filter((payment) => payment.invoice).map((payment) => (
                      <tr key={payment.paymentId}>
                        <td className="px-4 py-3">{payment.paymentId}</td>
                        <td className="px-4 py-3">{payment.invoice?.invoiceNumber}</td>
                        <td className="px-4 py-3">{payment.invoice ? formatDate(payment.invoice.issuedAt) : '-'}</td>
                        <td className="px-4 py-3">{payment.invoice ? formatCurrency(payment.invoice.total) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 rounded-2xl bg-stone-50 p-4 md:grid-cols-2 xl:grid-cols-4">
              <input aria-label="Correo usuario" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Correo" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} />
              <input aria-label="Nombre usuario" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Nombre completo" value={userForm.fullName} onChange={(event) => setUserForm((current) => ({ ...current, fullName: event.target.value }))} />
              <input aria-label="Password usuario" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Password" type="password" value={userForm.password} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} />
              <select aria-label="Rol usuario" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value }))}>
                {['Admin', 'Customer'].map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <input checked={userForm.isActive} type="checkbox" onChange={(event) => setUserForm((current) => ({ ...current, isActive: event.target.checked }))} />
              Usuario activo
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700" onClick={() => void submitUser()}>
                {userForm.id ? 'Guardar usuario' : 'Crear usuario'}
              </button>
              <button type="button" className="rounded-lg bg-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-300" onClick={() => setUserForm(EMPTY_USER_FORM)}>Limpiar formulario</button>
            </div>
            {usersLoading ? (
              <p className="text-sm text-stone-500">Cargando usuarios...</p>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-stone-200 text-sm">
                    <thead className="bg-stone-100 text-left text-stone-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Nombre</th>
                        <th className="px-4 py-3 font-semibold">Correo</th>
                        <th className="px-4 py-3 font-semibold">Rol</th>
                        <th className="px-4 py-3 font-semibold">Estado</th>
                        <th className="px-4 py-3 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-3">{user.fullName}</td>
                          <td className="px-4 py-3">{user.email}</td>
                          <td className="px-4 py-3">{user.role}</td>
                          <td className="px-4 py-3">{user.isActive ? 'Activo' : 'Inactivo'}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button type="button" className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-medium text-white hover:bg-amber-600" onClick={() => editUser(user)}>Editar</button>
                              <button type="button" className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700" onClick={() => void removeUser(user.id)}>Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      case 'carts':
        return <p className="text-sm text-stone-600">Consulta de carritos.</p>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-500">Modern Living</p>
            <h1 className="text-2xl font-bold">Tienda de muebles modernos</h1>
            <p className="text-sm text-stone-500">Sesión actual: {userName}</p>
            <p className="text-xs text-stone-400">Rol: {userRole}</p>
            {isAuthenticated && <p className="text-xs text-stone-400">Correo: {userEmail}</p>}
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button type="button" className="rounded-full bg-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-300" onClick={handleLogout}>
                Cerrar sesión
              </button>
            )}
            <div className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
              Carrito: {totalItems}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        {isAdmin && (
          <aside className="w-64 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <h2 className="mb-4 text-lg font-semibold">Menú</h2>
            <nav className="flex flex-col gap-2">
              <button className="rounded-lg px-3 py-2 text-left hover:bg-stone-100" onClick={() => setActiveSection('dashboard')}>Dashboard</button>
              <button className="rounded-lg px-3 py-2 text-left hover:bg-stone-100" onClick={() => setActiveSection('inventory')}>Inventario</button>
              <button className="rounded-lg px-3 py-2 text-left hover:bg-stone-100" onClick={() => setActiveSection('orders')}>Órdenes</button>
              <button className="rounded-lg px-3 py-2 text-left hover:bg-stone-100" onClick={() => setActiveSection('payments')}>Pagos</button>
              <button className="rounded-lg px-3 py-2 text-left hover:bg-stone-100" onClick={() => setActiveSection('invoices')}>Facturas</button>
              <button className="rounded-lg px-3 py-2 text-left hover:bg-stone-100" onClick={() => setActiveSection('users')}>Usuarios</button>
              <button className="rounded-lg px-3 py-2 text-left hover:bg-stone-100" onClick={() => setActiveSection('carts')}>Carritos</button>
            </nav>
          </aside>
        )}

        <div className="flex-1 space-y-8">
          <section className="grid gap-8 lg:grid-cols-[240px_1fr_320px]">
            <aside className="space-y-6">
              <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />
              <LoginForm
                onLoginSuccess={({ customerId: loggedCustomerId, fullName, email, token, role }) => {
                  const nextCustomerId = loggedCustomerId || FALLBACK_CUSTOMER_ID;
                  const nextUser: SessionUser = {
                    id: nextCustomerId,
                    fullName,
                    email,
                    token,
                    role
                  };

                  sessionStorageService.save(nextUser);
                  setCustomerId(nextCustomerId);
                  setOrderForm((current) => ({ ...current, customerId: nextCustomerId }));
                  setPaymentForm((current) => ({
                    ...current,
                    customerId: nextCustomerId,
                    customerName: fullName,
                    customerEmail: email
                  }));
                  setUserName(fullName);
                  setUserEmail(email);
                  setUserRole(role);
                  setAuthToken(token);
                  setIsAuthenticated(true);
                  setActiveSection(role === 'Admin' ? 'dashboard' : 'invoices');
                  setStatusMessage(`Sesión iniciada para ${fullName} (${role})`);
                }}
              />

              {isAuthenticated && !isAdmin && (
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
                  <h3 className="mb-2 text-lg font-semibold">Opciones de cliente</h3>
                  <p className="text-sm text-stone-600">Puedes explorar el catálogo, agregar productos al carrito, comprar y descargar tu factura PDF cuando exista un pago autorizado.</p>
                  <p className="mt-2 text-xs text-stone-500">Token de sesión disponible: {authToken ? 'Sí' : 'No'}</p>
                </div>
              )}
            </aside>

            <section>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Catálogo</h2>
                  <p className="text-sm text-stone-500">Filtra por categoría y agrega productos al carrito.</p>
                </div>
              </div>

              {statusMessage && <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{statusMessage}</p>}
              {errorMessage && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>}

              {catalogLoading ? (
                <p className="text-sm text-stone-500">Cargando catálogo...</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                   {filteredProducts.map((product) => (
                    <ProductCard 
                    
                    key={product.productId || product.id} 
                     product={product} 
                    onAddToCart={() => void addToCart(product)} 
                       />
                        ))}
                </div>
                )}
            </section>

            <aside>
              <CartPanel
                cart={cart}
                loading={cartLoading}
                onCheckout={() => void handleCheckout()}
                checkoutDisabled={checkoutLoading || !cart || cart.items.length === 0}
              />
            </aside>
          </section>

          {isAdmin && (
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
              <h2 className="mb-4 text-xl font-semibold">Panel de administración</h2>
              {renderAdminContent()}
            </section>
          )}

          {!isAdmin && isAuthenticated && (
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
              <h2 className="mb-4 text-xl font-semibold">Mis facturas</h2>
              <p className="mb-4 text-sm text-stone-600">Aquí puedes revisar los pagos con factura disponibles para descarga en PDF.</p>
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-stone-200 text-sm">
                    <thead className="bg-stone-100 text-left text-stone-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Pago</th>
                        <th className="px-4 py-3 font-semibold">Factura</th>
                        <th className="px-4 py-3 font-semibold">Emitida</th>
                        <th className="px-4 py-3 font-semibold">Total</th>
                        <th className="px-4 py-3 font-semibold">Descarga</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {payments
                        .filter((payment) => payment.customerId === customerId && payment.invoice)
                        .map((payment) => (
                          <tr key={payment.paymentId}>
                            <td className="px-4 py-3">{payment.paymentId}</td>
                            <td className="px-4 py-3">{payment.invoice?.invoiceNumber}</td>
                            <td className="px-4 py-3">{payment.invoice ? formatDate(payment.invoice.issuedAt) : '-'}</td>
                            <td className="px-4 py-3">{payment.invoice ? formatCurrency(payment.invoice.total) : '-'}</td>
                            <td className="px-4 py-3">
                              <a className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-700" href={api.getInvoicePdfUrl(payment.paymentId)} target="_blank" rel="noreferrer">PDF</a>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
