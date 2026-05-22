const express = require('express');
const cors = require('cors');

const app = express();
const port = Number(process.env.PORT || 8080);

const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:8081',
  catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:8082',
  cart: process.env.CART_SERVICE_URL || 'http://localhost:8083',
  orders: process.env.ORDER_SERVICE_URL || 'http://localhost:8084',
  payments: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8085',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:8086'
};

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'node-api-gateway', port, services });
});

async function proxyJson(req, res, baseUrl, path, init = {}) {
  try {
    const upstreamResponse = await fetch(`${baseUrl}${path}`, {
      method: init.method || req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {})
      },
      body: init.body
    });

    const text = await upstreamResponse.text();
    res.status(upstreamResponse.status);

    if (!text) {
      return res.end();
    }

    try {
      return res.json(JSON.parse(text));
    } catch (_error) {
      return res.send(text);
    }
  } catch (error) {
    return res.status(502).json({
      message: 'Error comunicando con servicio upstream',
      detail: error.message,
      upstream: `${baseUrl}${path}`
    });
  }
}

app.post('/api/auth/login', (req, res) => {
  return proxyJson(req, res, services.auth, '/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(req.body)
  });
});

app.get('/api/auth/users', (req, res) => {
  return proxyJson(req, res, services.auth, '/api/auth/users');
});

app.get('/api/catalog', (req, res) => {
  return proxyJson(req, res, services.catalog, '/api/catalog');
});

app.get('/api/cart/:customerId', (req, res) => {
  return proxyJson(req, res, services.cart, `/api/cart/${req.params.customerId}`);
});

app.post('/api/cart/items', (req, res) => {
  return proxyJson(req, res, services.cart, '/api/cart/items', {
    method: 'POST',
    body: JSON.stringify(req.body)
  });
});

app.delete('/api/cart/:customerId/items/:productId', (req, res) => {
  return proxyJson(req, res, services.cart, `/api/cart/${req.params.customerId}/items/${req.params.productId}`, {
    method: 'DELETE'
  });
});

app.get('/api/orders', (req, res) => {
  return proxyJson(req, res, services.orders, '/api/orders');
});

app.get('/api/orders/:orderId', (req, res) => {
  return proxyJson(req, res, services.orders, `/api/orders/${req.params.orderId}`);
});

app.post('/api/orders', (req, res) => {
  return proxyJson(req, res, services.orders, '/api/orders', {
    method: 'POST',
    body: JSON.stringify(req.body)
  });
});

app.put('/api/orders/:orderId', (req, res) => {
  return proxyJson(req, res, services.orders, `/api/orders/${req.params.orderId}`, {
    method: 'PUT',
    body: JSON.stringify(req.body)
  });
});

app.delete('/api/orders/:orderId', (req, res) => {
  return proxyJson(req, res, services.orders, `/api/orders/${req.params.orderId}`, {
    method: 'DELETE'
  });
});

app.get('/api/payments', (req, res) => {
  return proxyJson(req, res, services.payments, '/api/payments');
});

app.get('/api/payments/:paymentId', (req, res) => {
  return proxyJson(req, res, services.payments, `/api/payments/${req.params.paymentId}`);
});

app.get('/api/payments/:paymentId/invoice/pdf', (req, res) => {
  return proxyJson(req, res, services.payments, `/api/payments/${req.params.paymentId}/invoice/pdf`);
});

app.post('/api/payments/authorize', (req, res) => {
  return proxyJson(req, res, services.payments, '/api/payments/authorize', {
    method: 'POST',
    body: JSON.stringify(req.body)
  });
});

app.put('/api/payments/:paymentId', (req, res) => {
  return proxyJson(req, res, services.payments, `/api/payments/${req.params.paymentId}`, {
    method: 'PUT',
    body: JSON.stringify(req.body)
  });
});

app.delete('/api/payments/:paymentId', (req, res) => {
  return proxyJson(req, res, services.payments, `/api/payments/${req.params.paymentId}`, {
    method: 'DELETE'
  });
});

app.get('/api/inventory/products', (req, res) => {
  return proxyJson(req, res, services.inventory, '/api/inventory/products');
});

app.get('/api/inventory/products/:productId', (req, res) => {
  return proxyJson(req, res, services.inventory, `/api/inventory/products/${req.params.productId}`);
});

app.post('/api/inventory/products', (req, res) => {
  return proxyJson(req, res, services.inventory, '/api/inventory/products', {
    method: 'POST',
    body: JSON.stringify(req.body)
  });
});

app.put('/api/inventory/products/:productId', (req, res) => {
  return proxyJson(req, res, services.inventory, `/api/inventory/products/${req.params.productId}`, {
    method: 'PUT',
    body: JSON.stringify(req.body)
  });
});

app.delete('/api/inventory/products/:productId', (req, res) => {
  return proxyJson(req, res, services.inventory, `/api/inventory/products/${req.params.productId}`, {
    method: 'DELETE'
  });
});

app.get('/api/inventory/:productId', (req, res) => {
  return proxyJson(req, res, services.inventory, `/api/inventory/${req.params.productId}`);
});

app.listen(port, () => {
  console.log(`Node API Gateway running on port ${port}`);
});
