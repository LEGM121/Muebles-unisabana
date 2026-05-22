# Proyecto Muebles Modernos

Monorepo base para una tienda de venta de muebles modernos, organizado por **5 módulos de backend** y un **frontend React**.

## Stack principal

- **Frontend**: React + Vite + Tailwind CSS + Vitest
- **Gateway / BFF**: Node.js
- **Backend**: .NET 8 con arquitectura limpia por microservicios
- **Arquitectura**: separación por módulos funcionales y dominios críticos

## Estructura del repositorio

```text
proyecto-muebles/
├── backend/
│   ├── 1-customer-experience/
│   ├── 2-order-management/
│   ├── 3-inventory-product/
│   ├── 4-customer-loyalty/
│   ├── 5-admin-analytics/
│   ├── gateway/
│   ├── shared/
│   └── docker-compose.yml
├── frontend/
├── shared/
└── docs/
```

## Módulos backend

### 1. Customer Experience
- catálogo
- configurador
- carrito / checkout
- CMS

### 2. Order Management
- pedidos
- pagos
- envíos
- notificaciones

### 3. Inventory Product
- inventario
- productos
- precios
- proveedores

### 4. Customer Loyalty
- autenticación
- usuarios
- reseñas
- wishlist
- soporte / postventa

### 5. Admin Analytics
- administración
- analytics
- marketing
- integraciones

## Estado actual

Este repositorio contiene una **base inicial**. La estructura ya refleja la organización objetivo por módulos y deja preparada la evolución hacia microservicios completos con carpetas de `Api`, `Application`, `Domain`, `Infrastructure` y `Tests`.

## Integración actual frontend + backend

La integración funcional disponible conecta el frontend con los servicios implementados actualmente:

- `AuthService` para login.
- `CatalogService` para obtener el catálogo.
- `CartService` para consultar y agregar productos al carrito.
- `OrderService` para generar órdenes.
- `PaymentService` e `InventoryService` quedan expuestos a través del gateway para futuras pantallas del frontend.

El frontend ya no depende del mock de catálogo para el flujo principal y consume el gateway Node en `http://localhost:8080`.

## Levantar en entorno local con Docker

### Requisitos

- Docker
- Docker Compose

### Paso 1. Levantar backend, gateway y frontend

Desde la carpeta `backend/` ejecuta:

```bash
docker compose up --build
```

Esto levantará:

- PostgreSQL en `localhost:5432`
- AuthService en `localhost:8081`
- CatalogService en `localhost:8082`
- CartService en `localhost:8083`
- OrderService en `localhost:8084`
- PaymentService en `localhost:8085`
- InventoryService en `localhost:8086`
- API Gateway en `localhost:8080`
- Frontend en `localhost:5173`

### Paso 2. Abrir la aplicación

Abre en tu navegador:

```text
http://localhost:5173
```

### Paso 3. Flujo recomendado de prueba

1. Inicia sesión con un usuario existente del `AuthService`.
2. Consulta el catálogo.
3. Agrega productos al carrito.
4. Ejecuta checkout para crear una orden.

### Nota importante sobre autenticación

El `AuthService` usa SQLite local dentro del contenedor. Si no existe un usuario previamente creado, primero debes registrar uno consumiendo el endpoint de registro:

```bash
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@muebles.com",
    "fullName": "Cliente Demo",
    "password": "Password123!"
  }'
```

Después podrás iniciar sesión desde el frontend con:

- usuario: `cliente@muebles.com`
- password: `Password123!`

### Apagar servicios

```bash
docker compose down
```

Si además quieres borrar los volúmenes:

```bash
docker compose down -v
```

## Documentación

- `docs/architecture.md`
- `docs/modules.md`
