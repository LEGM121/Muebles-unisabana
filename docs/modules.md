# Módulos del backend

## Estructura propuesta

```text
backend/
├── 1-customer-experience/
│   ├── catalog-service/
│   ├── configurator-service/
│   ├── cart-checkout-service/
│   └── cms-service/
├── 2-order-management/
│   ├── order-service/
│   ├── payment-service/
│   ├── shipping-service/
│   └── notification-service/
├── 3-inventory-product/
│   ├── inventory-service/
│   ├── product-service/
│   ├── pricing-service/
│   └── supplier-service/
├── 4-customer-loyalty/
│   ├── auth-service/
│   ├── user-service/
│   ├── review-service/
│   ├── wishlist-service/
│   └── support-service/
├── 5-admin-analytics/
│   ├── admin-service/
│   ├── analytics-service/
│   ├── marketing-service/
│   └── integration-service/
├── gateway/
└── shared/
```

## Objetivo

Esta organización agrupa los servicios por responsabilidad funcional y facilita:

- escalado por dominio
- ownership por equipo
- priorización de escenarios críticos
- trazabilidad de dependencias
- crecimiento ordenado del monorepo
