# 🪑 Muebles UniSabana

Plataforma de e-commerce para venta de muebles, construida con arquitectura de microservicios. Incluye catálogo de productos, carrito, pagos, gestión de inventario y autenticación de usuarios.

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| API Gateway | Node.js + Express |
| Microservicios | .NET 8 (Clean Architecture) |
| Base de datos | PostgreSQL 16 |
| Orquestación | Docker Compose |

---

## 📋 Requisitos previos

- [Docker](https://www.docker.com/) y Docker Compose
- [Node.js](https://nodejs.org/) v20+ (para desarrollo local del frontend/gateway)
- [.NET SDK 8.0](https://dotnet.microsoft.com/) (para desarrollo local de servicios backend)

---

## 🚀 Instalación y ejecución

### Con Docker (recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/LEGM121/Muebles-unisabana.git
cd Muebles-unisabana

# 2. Levantar todos los servicios
docker compose up --build

# 3. Acceder a la aplicación
#    Frontend:    http://localhost:3000
#    API Gateway: http://localhost:9090
```

### Entorno de laboratorio (puertos alternativos)

```bash
# Copiar y ajustar variables de entorno
cp .env.lab.example .env.lab

# Levantar con el compose de laboratorio
docker compose -f docker-compose.lab.yml --env-file .env.lab up --build
```

### Desarrollo local del frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm test           # ejecutar pruebas unitarias
```

### Desarrollo local del API Gateway

```bash
cd backend/node-api-gateway
npm install
npm run dev        # http://localhost:9090
```

---

## 🔌 Puertos de los servicios

| Servicio | Puerto |
|----------|--------|
| Frontend | 3000 |
| API Gateway | 9090 |
| AuthService | 8081 |
| CatalogService | 8082 |
| CartService | 8083 |
| OrderService | 8084 |
| PaymentService | 8085 |
| InventoryService | 8086 |
| PostgreSQL | 5432 |

---

## 📁 Estructura de carpetas

```
Muebles-unisabana/
├── backend/
│   ├── services/                  # Microservicios .NET 8
│   │   ├── AuthService/           # Autenticación y autorización
│   │   ├── CatalogService/        # Catálogo de productos
│   │   ├── CartService/           # Carrito de compras
│   │   ├── OrderService/          # Gestión de órdenes
│   │   ├── PaymentService/        # Procesamiento de pagos
│   │   └── InventoryService/      # Control de inventario
│   └── node-api-gateway/          # API Gateway (Node.js + Express)
│       └── src/
├── frontend/                      # Aplicación React
│   └── src/
│       ├── components/            # Componentes de UI reutilizables
│       ├── services/              # Llamadas a la API
│       ├── types/                 # Tipos TypeScript
│       ├── validation/            # Esquemas de validación
│       └── mocks/                 # Mocks para pruebas
├── database/
│   └── init/                      # Scripts de inicialización SQL
├── shared/
│   └── contracts/                 # Contratos compartidos entre servicios
├── docs/                          # Documentación técnica y de arquitectura
├── scripts/                       # Scripts utilitarios (sync-version, etc.)
├── reports/                       # Reportes de ejecución de pruebas
├── docker-compose.yml             # Orquestación principal
├── docker-compose.lab.yml         # Orquestación para entorno de laboratorio
├── .env.lab.example               # Plantilla de variables de entorno (lab)
└── package.json                   # Scripts raíz (versionado)
```

### Convención interna por microservicio (.NET)

```
<Service>/
└── src/
    ├── <Service>.Api/             # Controllers, middlewares, configuración
    ├── <Service>.Application/     # Casos de uso, DTOs, interfaces
    ├── <Service>.Domain/          # Entidades y lógica de negocio
    ├── <Service>.Infrastructure/  # Repositorios, EF Core, externos
    └── <Service>.Tests/           # Pruebas unitarias e integración
```

---

## 🧪 Pruebas

```bash
# Pruebas unitarias del frontend
cd frontend && npm test

# Pruebas E2E (Playwright) desde la raíz
npx playwright test
```

Los reportes se generan en `reports/test-runs/`.

---

## 📚 Documentación adicional

| Documento | Descripción |
|-----------|-------------|
| `docs/architecture.md` | Arquitectura de referencia y módulos |
| `docs/modules.md` | Descripción de cada módulo de negocio |
| `docs/guia_pruebas.md` | Guía de estrategia de pruebas |
| `docs/environment.md` | Configuración de entornos |

---

## 🤝 Contribución

1. Crea una rama desde `main`: `git checkout -b feature/mi-funcionalidad`
2. Realiza tus cambios y escribe pruebas
3. Abre un Pull Request describiendo los cambios

Versionamiento semantico centralizado
El proyecto usa SemVer con una sola version en la raiz del monorepo (package.json).

MAJOR: cambios incompatibles.
MINOR: nuevas funcionalidades compatibles.
PATCH: correcciones compatibles.
Comandos desde la raiz:

npm.cmd run version:patch
npm.cmd run version:minor
npm.cmd run version:major
Estos comandos actualizan la version de la raiz y sincronizan:

frontend\package.json y frontend\package-lock.json
backend\node-api-gateway\package.json y backend\node-api-gateway\package-lock.json
backend\services\Directory.Build.props para servicios .NET
tags de imagen en docker-compose.lab.yml usando ${APP_VERSION}
