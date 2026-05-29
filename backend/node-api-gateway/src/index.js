const express = require('express');
const cors = require('cors');

const app = express();
const port = Number(process.env.PORT || 9090);

const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://authservice:8081',
  catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:8082', // AJUSTE: Apuntando a tu backend C#
  cart: process.env.CART_SERVICE_URL || 'http://cartservice:8083',
  orders: process.env.ORDER_SERVICE_URL || 'http://orderservice:8084',
  payments: process.env.PAYMENT_SERVICE_URL || 'http://paymentservice:8085',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://inventoryservice:8086'
};

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-User-Role'],
  credentials: true
}));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'node-api-gateway', port, services });
});

async function proxyJson(req, res, baseUrl, path, init = {}) {
  try {
    const targetUrl = `${baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-User-Id': req.headers['x-user-id'] || 'guest-user',
      'X-User-Role': req.headers['x-user-role'] || 'Customer',
      ...(init.headers || {})
    };

    const upstreamResponse = await fetch(targetUrl, {
      method: init.method || req.method,
      headers: headers,
      body: init.body
    });

    const text = await upstreamResponse.text();
    res.status(upstreamResponse.status);
    if (!text) return res.end();
    try { return res.json(JSON.parse(text)); } catch (_error) { return res.send(text); }
  } catch (error) {
    console.error(`Error de Gateway hacia ${baseUrl}${path}:`, error.message);
    return res.status(502).json({ message: 'Error de comunicación', detail: error.message });
  }
}

// --- RUTAS AUTENTICACIÓN ---
app.post('/api/auth/login', (req, res) => proxyJson(req, res, services.auth, '/api/auth/login', { method: 'POST', body: JSON.stringify(req.body) }));
app.post('/api/auth/register', (req, res) => proxyJson(req, res, services.auth, '/api/auth/register', { method: 'POST', body: JSON.stringify(req.body) }));
app.get('/api/auth/users', (req, res) => proxyJson(req, res, services.auth, '/api/auth/users'));
app.put('/api/auth/users/:id', (req, res) => proxyJson(req, res, services.auth, `/api/auth/users/${req.params.id}`, { method: 'PUT', body: JSON.stringify(req.body) }));
app.delete('/api/auth/users/:id', (req, res) => proxyJson(req, res, services.auth, `/api/auth/users/${req.params.id}`, { method: 'DELETE' }));

// --- RUTAS CATÁLOGO ---
app.get('/api/catalog', (req, res) => proxyJson(req, res, services.catalog, '/api/catalog'));

// --- RUTAS CARRITO ---
app.get('/api/cart/:customerId', (req, res) => proxyJson(req, res, services.cart, `/api/cart/${req.params.customerId}`));
app.post('/api/cart/items', (req, res) => proxyJson(req, res, services.cart, '/api/cart/items', { method: 'POST', body: JSON.stringify(req.body) }));
app.delete('/api/cart/:customerId/items/:productId', (req, res) => proxyJson(req, res, services.cart, `/api/cart/${req.params.customerId}/items/${req.params.productId}`, { method: 'DELETE' }));

// --- RUTAS ÓRDENES ---
app.get('/api/orders', (req, res) => proxyJson(req, res, services.orders, '/api/orders'));
app.get('/api/orders/:orderId', (req, res) => proxyJson(req, res, services.orders, `/api/orders/${req.params.orderId}`));
app.post('/api/orders', (req, res) => proxyJson(req, res, services.orders, '/api/orders', { method: 'POST', body: JSON.stringify(req.body) }));
app.put('/api/orders/:orderId', (req, res) => proxyJson(req, res, services.orders, `/api/orders/${req.params.orderId}`, { method: 'PUT', body: JSON.stringify(req.body) }));
app.delete('/api/orders/:orderId', (req, res) => proxyJson(req, res, services.orders, `/api/orders/${req.params.orderId}`, { method: 'DELETE' }));

// --- RUTAS PAGOS ---
app.get('/api/payments', (req, res) => proxyJson(req, res, services.payments, '/api/payments'));
app.get('/api/payments/:paymentId', (req, res) => proxyJson(req, res, services.payments, `/api/payments/${req.params.paymentId}`));
app.get('/api/payments/:paymentId/invoice/pdf', (req, res) => proxyJson(req, res, services.payments, `/api/payments/${req.params.paymentId}/invoice/pdf`));
app.post('/api/payments/authorize', (req, res) => proxyJson(req, res, services.payments, '/api/payments/authorize', { method: 'POST', body: JSON.stringify(req.body) }));
app.put('/api/payments/:paymentId', (req, res) => proxyJson(req, res, services.payments, `/api/payments/${req.params.paymentId}`, { method: 'PUT', body: JSON.stringify(req.body) }));
app.delete('/api/payments/:paymentId', (req, res) => proxyJson(req, res, services.payments, `/api/payments/${req.params.paymentId}`, { method: 'DELETE' }));

// --- RUTAS INVENTARIO ---
app.get('/api/inventory/products', (req, res) => proxyJson(req, res, services.inventory, '/api/inventory/products'));
app.get('/api/inventory/products/:productId', (req, res) => proxyJson(req, res, services.inventory, `/api/inventory/products/${req.params.productId}`));
app.post('/api/inventory/products', (req, res) => proxyJson(req, res, services.inventory, '/api/inventory/products', { method: 'POST', body: JSON.stringify(req.body) }));
app.put('/api/inventory/products/:productId', (req, res) => proxyJson(req, res, services.inventory, `/api/inventory/products/${req.params.productId}`, { method: 'PUT', body: JSON.stringify(req.body) }));
app.delete('/api/inventory/products/:productId', (req, res) => proxyJson(req, res, services.inventory, `/api/inventory/products/${req.params.productId}`, { method: 'DELETE' }));

app.listen(port, () => {
  console.log(`Node API Gateway running on port ${port}`);
});