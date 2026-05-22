import { useEffect, useMemo, useState } from 'react';
import { ProductCard } from './components/ProductCard';
import { CategoryFilter } from './components/CategoryFilter';
import { CartPanel } from './components/CartPanel';
import { LoginForm } from './components/LoginForm';
import {
  api,
  type CartResponse,
  type InventoryProduct,
  type OrderResponse,
  type PaymentResponse,
  type UserResponse
} from './services/api';
import type { Product } from './types/product';

const FALLBACK_CUSTOMER_ID = '11111111-1111-1111-1111-111111111111';

type AdminSection =
  | 'dashboard'
  | 'inventory'
  | 'orders'
  | 'payments'
  | 'invoices'
  | 'users'
  | 'carts';

export function App() {
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
  const [customerId, setCustomerId] = useState<string>(FALLBACK_CUSTOMER_ID);
  const [userName, setUserName] = useState<string>('Cliente invitado');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const loadAdminData = async () => {
    await Promise.all([loadOrders(), loadPayments(), loadUsers()]);
  };

  useEffect(() => {
    void loadCatalog();
    void loadInventory();
  }, []);

  useEffect(() => {
    void loadCart(customerId);
  }, [customerId]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadAdminData();
    }
  }, [isAuthenticated]);

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
      setErrorMessage(null);
      setStatusMessage(null);
      const updatedCart = await api.addCartItem({
        customerId,
        productId: product.id,
        quantity: 1,
        unitPrice: product.price,
        productName: product.name
      });
      setCart(updatedCart);
      setStatusMessage(`${product.name} agregado al carrito`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible agregar el producto al carrito');
    }
  };

  const handleRemoveCartItem = async (productId: string) => {
    try {
      setErrorMessage(null);
      await api.removeCartItem(customerId, productId);
      await loadCart(customerId);
      setStatusMessage('Producto eliminado del carrito');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible eliminar el producto del carrito');
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      return;
    }

    try {
      setCheckoutLoading(true);
      setErrorMessage(null);
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

  const dashboardCards = [
    { label: 'Productos', value: products.length },
    { label: 'Inventario', value: inventoryProducts.length },
    { label: 'Órdenes', value: orders.length },
    { label: 'Pagos', value: payments.length },
    { label: 'Usuarios', value: users.length }
  ];

  const renderAdminContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {dashboardCards.map((card) => (
              <article key={card.label} className="rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200">
                <p className="text-sm text-stone-500">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold text-stone-900">{card.value}</p>
              </article>
            ))}
          </div>
        );
      case 'inventory':
        return (
          <div className="space-y-4">
            <p className="text-sm text-stone-600">Consulta de inventario y muebles.</p>
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {filteredInventory.map((product) => (
                        <tr key={product.productId}>
                          <td className="px-4 py-3">{product.name}</td>
                          <td className="px-4 py-3">{product.sku}</td>
                          <td className="px-4 py-3">{product.category}</td>
                          <td className="px-4 py-3">${product.price}</td>
                          <td className="px-4 py-3">{product.available}</td>
                          <td className="px-4 py-3">{product.reserved}</td>
                          <td className="px-4 py-3">{product.supplierName}</td>
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
        return ordersLoading ? (
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
                    <th className="px-4 py-3 font-semibold">Items</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {orders.map((order) => (
                    <tr key={order.orderId}>
                      <td className="px-4 py-3">{order.orderId}</td>
                      <td className="px-4 py-3">{order.customerId}</td>
                      <td className="px-4 py-3">{order.status}</td>
                      <td className="px-4 py-3">{order.items.length}</td>
                      <td className="px-4 py-3">${order.total.toFixed(2)}</td>
                      <td className="px-4 py-3">{new Date(order.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'payments':
        return paymentsLoading ? (
          <p className="text-sm text-stone-500">Cargando pagos...</p>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-sm">
                <thead className="bg-stone-100 text-left text-stone-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Pago</th>
                    <th className="px-4 py-3 font-semibold">Orden</th>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Método</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {payments.map((payment) => (
                    <tr key={payment.paymentId}>
                      <td className="px-4 py-3">{payment.paymentId}</td>
                      <td className="px-4 py-3">{payment.orderId}</td>
                      <td className="px-4 py-3">{payment.customerName}</td>
                      <td className="px-4 py-3">{payment.paymentMethod}</td>
                      <td className="px-4 py-3">{payment.status}</td>
                      <td className="px-4 py-3">${payment.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'invoices':
        return paymentsLoading ? (
          <p className="text-sm text-stone-500">Cargando facturas...</p>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-sm">
                <thead className="bg-stone-100 text-left text-stone-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Factura</th>
                    <th className="px-4 py-3 font-semibold">Pago</th>
                    <th className="px-4 py-3 font-semibold">Emitida</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {payments.filter((payment) => payment.invoice).map((payment) => (
                    <tr key={payment.paymentId}>
                      <td className="px-4 py-3">{payment.invoice?.invoiceNumber}</td>
                      <td className="px-4 py-3">{payment.paymentId}</td>
                      <td className="px-4 py-3">{payment.invoice?.issuedAt ? new Date(payment.invoice.issuedAt).toLocaleString() : '-'}</td>
                      <td className="px-4 py-3">${payment.invoice?.total?.toFixed(2) ?? '0.00'}</td>
                      <td className="px-4 py-3">
                        <a className="rounded-lg bg-brand-700 px-3 py-2 text-xs font-medium text-white" href={api.getInvoicePdfUrl(payment.paymentId)} target="_blank" rel="noreferrer">
                          Descargar PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'users':
        return usersLoading ? (
          <p className="text-sm text-stone-500">Cargando usuarios...</p>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-sm">
                <thead className="bg-stone-100 text-left text-stone-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Rol</th>
                    <th className="px-4 py-3 font-semibold">Activo</th>
                    <th className="px-4 py-3 font-semibold">Creado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">{user.fullName}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">{user.role}</td>
                      <td className="px-4 py-3">{user.isActive ? 'Sí' : 'No'}</td>
                      <td className="px-4 py-3">{new Date(user.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'carts':
        return (
          <div className="space-y-4">
            <p className="text-sm text-stone-600">Consulta del carrito activo y sus productos.</p>
            {cartLoading ? (
              <p className="text-sm text-stone-500">Cargando carrito...</p>
            ) : !cart ? (
              <p className="text-sm text-stone-500">No hay carrito disponible.</p>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-stone-200 text-sm">
                    <thead className="bg-stone-100 text-left text-stone-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Producto</th>
                        <th className="px-4 py-3 font-semibold">Cantidad</th>
                        <th className="px-4 py-3 font-semibold">Precio</th>
                        <th className="px-4 py-3 font-semibold">Subtotal</th>
                        <th className="px-4 py-3 font-semibold">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {cart.items.map((item) => (
                        <tr key={item.productId}>
                          <td className="px-4 py-3">{item.productName}</td>
                          <td className="px-4 py-3">{item.quantity}</td>
                          <td className="px-4 py-3">${item.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-3">${item.subtotal.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <button className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white" onClick={() => void handleRemoveCartItem(item.productId)}>
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-stone-200 px-4 py-3 text-right text-sm font-semibold text-stone-700">
                  Total del carrito: ${cart.totalAmount.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        );
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
          </div>
          <div className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
            Carrito: {totalItems}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        {isAuthenticated && (
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
                onLoginSuccess={({ customerId: loggedCustomerId, fullName }) => {
                  if (loggedCustomerId) {
                    setCustomerId(loggedCustomerId);
                  }
                  setUserName(fullName);
                  setIsAuthenticated(true);
                  setStatusMessage(`Sesión iniciada para ${fullName}`);
                }}
              />
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
                    <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
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

          {isAuthenticated && (
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
              <h2 className="mb-4 text-xl font-semibold">Panel de consultas</h2>
              {renderAdminContent()}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
