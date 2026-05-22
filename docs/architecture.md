# Arquitectura de referencia

## Estilo arquitectónico

- **Frontend**: React + Tailwind CSS
- **BFF / API Gateway**: Node.js + Express
- **Backend**: microservicios en .NET 8 con arquitectura limpia
- **Comunicación**:
  - síncrona: REST
  - asíncrona: eventos de dominio/integración
- **Persistencia**: base de datos por servicio

## Organización del backend en 5 módulos

### 1. `1-customer-experience`
Servicios orientados a la experiencia directa del cliente:
- `catalog-service`
- `configurator-service`
- `cart-checkout-service`
- `cms-service`

### 2. `2-order-management`
Servicios transaccionales del ciclo de compra:
- `order-service`
- `payment-service`
- `shipping-service`
- `notification-service`

### 3. `3-inventory-product`
Servicios de producto, stock y reglas comerciales:
- `inventory-service`
- `product-service`
- `pricing-service`
- `supplier-service`

### 4. `4-customer-loyalty`
Servicios de identidad, relación y postventa:
- `auth-service`
- `user-service`
- `review-service`
- `wishlist-service`
- `support-service`

### 5. `5-admin-analytics`
Servicios internos para operación y gestión:
- `admin-service`
- `analytics-service`
- `marketing-service`
- `integration-service`

## Convención interna por microservicio

Cada microservicio .NET debe crecer con una estructura de arquitectura limpia:

```text
<service>/
└── src/
    ├── <Service>.Api/
    ├── <Service>.Application/
    ├── <Service>.Domain/
    ├── <Service>.Infrastructure/
    └── <Service>.Tests/
```

## Escenarios críticos

### Checkout sin fricción
- validación de carrito
- cálculo de costos
- creación de orden
- coordinación con pago e inventario

### Integridad de pagos
- idempotencia
- conciliación
- callbacks/webhooks

### Inventario en tiempo real
- reserva
- confirmación
- liberación
- ajuste

### Postventa compleja
- devoluciones
- garantías
- cambios

### Configurador de producto
- variantes válidas
- restricciones de combinaciones
- medidas y colores
