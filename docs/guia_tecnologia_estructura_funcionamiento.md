# Guia para presentacion: tecnologia, estructura y funcionamiento del proyecto

Esta guia resume como esta construido el proyecto de tienda de muebles, que tecnologias usa, como se organiza el codigo y como fluye una compra desde la interfaz hasta los servicios backend.

## 1. Idea general del sistema

El proyecto representa una tienda de muebles modernos. El usuario puede entrar al frontend, iniciar sesion, consultar el catalogo, agregar productos al carrito, crear una orden y generar un pago/factura.

La solucion esta organizada como un monorepo:

- `frontend`: aplicacion web para el usuario.
- `backend`: servicios del negocio organizados por modulos funcionales.
- `node-api-gateway`: puerta de entrada para conectar el frontend con los microservicios.
- `shared`: contratos compartidos entre servicios.
- `docs`: documentacion tecnica y estrategia de pruebas.
- `reports`: evidencias y reportes de ejecucion de pruebas.
- `scripts`: automatizacion de reportes y ejecucion de validaciones.

## 2. Tecnologias principales

| Capa | Tecnologia | Para que se usa |
| --- | --- | --- |
| Frontend | React 18 | Construir la interfaz de usuario por componentes |
| Frontend | Vite | Servidor de desarrollo, build rapido y tooling moderno |
| Frontend | TypeScript | Tipado para reducir errores en componentes y servicios |
| Frontend | Tailwind CSS | Estilos de la aplicacion |
| Pruebas frontend | Vitest + Testing Library | Pruebas unitarias, validaciones y flujo E2E simulado |
| Gateway | Node.js + Express | Centralizar las llamadas del frontend hacia los servicios |
| Backend | .NET 8 | Implementar APIs de negocio por servicio |
| Backend | Minimal APIs | Endpoints HTTP ligeros en cada microservicio |
| Pruebas backend | xUnit + coverlet | Pruebas unitarias, integrales y cobertura |
| Infraestructura | Docker Compose | Levantar frontend, gateway, base de datos y servicios juntos |
| Persistencia | PostgreSQL / SQLite segun servicio | Guardar datos reales o locales de autenticacion |

## 3. Estructura del proyecto

```text
Proyecto-Muebles4-main/
+-- frontend/
|   +-- src/
|   |   +-- components/
|   |   +-- services/
|   |   +-- validation/
|   |   +-- mocks/
|   |   +-- App.tsx
|   +-- package.json
+-- backend/
|   +-- 1-customer-experience/
|   +-- 2-order-management/
|   +-- 3-inventory-product/
|   +-- 4-customer-loyalty/
|   +-- 5-admin-analytics/
|   +-- node-api-gateway/
|   +-- services/
|       +-- AuthService/
|       +-- CatalogService/
|       +-- CartService/
|       +-- OrderService/
|       +-- PaymentService/
|       +-- InventoryService/
+-- shared/
+-- docs/
+-- reports/
+-- scripts/
```

## 4. Organizacion backend por modulos

El backend esta dividido en 5 grandes areas del negocio:

| Modulo | Responsabilidad | Servicios relacionados |
| --- | --- | --- |
| `1-customer-experience` | Experiencia directa del cliente | catalogo, configurador, carrito, CMS |
| `2-order-management` | Ciclo de compra | ordenes, pagos, envios, notificaciones |
| `3-inventory-product` | Producto y stock | inventario, productos, precios, proveedores |
| `4-customer-loyalty` | Identidad y relacion con cliente | autenticacion, usuarios, resenas, wishlist, soporte |
| `5-admin-analytics` | Operacion interna | administracion, analitica, marketing, integraciones |

Esta separacion ayuda a que cada parte del negocio pueda evolucionar de forma independiente.

## 5. Arquitectura limpia en servicios .NET

El servicio mas desarrollado para explicar la arquitectura es `CatalogService`.

```text
backend/services/CatalogService/
+-- CatalogService.Api/
+-- CatalogService.Application/
+-- CatalogService.Domain/
+-- CatalogService.Infrastructure/
+-- CatalogService.Tests/
```

Cada capa tiene una responsabilidad:

| Capa | Responsabilidad | Ejemplo |
| --- | --- | --- |
| `Api` | Expone endpoints HTTP | `POST /api/catalog/validate` |
| `Application` | Casos de uso y reglas de aplicacion | `ProductCatalogService` |
| `Domain` | Entidades y reglas puras del negocio | `Product.Validate()` |
| `Infrastructure` | Acceso a datos o implementaciones tecnicas | `InMemoryProductRepository` |
| `Tests` | Validacion automatizada del comportamiento | xUnit |

La idea central es que el dominio no dependa de la base de datos ni de HTTP. Por eso se puede probar una regla como `Product.Validate()` sin levantar servidores.

## 6. Como funciona el flujo principal

Flujo de compra esperado:

```text
Usuario
  |
  v
Frontend React en http://localhost:5173
  |
  v
API Gateway Node en http://localhost:9090
  |
  v
Microservicios .NET
  |
  v
Base de datos / repositorios
  |
  v
Respuesta al frontend
```

Pasos funcionales:

1. El usuario abre la tienda en el navegador.
2. El frontend carga productos desde el catalogo.
3. El usuario inicia sesion por medio de `AuthService`.
4. El usuario agrega un producto al carrito usando `CartService`.
5. El checkout crea una orden en `OrderService`.
6. El pago se autoriza en `PaymentService`.
7. La interfaz muestra confirmacion y factura.

## 7. Papel del API Gateway

El gateway Node actua como punto unico de entrada para el frontend. En lugar de que React llame directamente a muchos puertos distintos, el frontend consume rutas bajo:

```text
http://localhost:9090/api/...
```

Ventajas:

- Centraliza rutas.
- Oculta la ubicacion interna de cada microservicio.
- Permite manejar errores de comunicacion.
- Facilita que el frontend tenga una sola URL base.

## 8. Servicios implementados o expuestos

| Servicio | Puerto local en Docker | Funcion |
| --- | --- | --- |
| `AuthService` | `8081` | Registro, login y usuarios |
| `CatalogService` | `8082` | Catalogo y validacion de productos |
| `CartService` | `8083` | Carrito de compras |
| `OrderService` | `8084` | Creacion y consulta de ordenes |
| `PaymentService` | `8085` | Autorizacion de pagos y factura |
| `InventoryService` | `8086` | Productos de inventario |
| `API Gateway` | `9090` | Entrada unica para el frontend |
| `Frontend` | `5173` | Aplicacion web |

## 9. Como levantar el proyecto

Desde la raiz o segun la configuracion de `docker-compose.yml`:

```powershell
docker compose up --build
```

Luego abrir:

```text
http://localhost:5173
```

Para desarrollo frontend:

```powershell
cd frontend
npm.cmd run dev
```

## 10. Guion corto para explicar en presentacion

Texto sugerido:

```text
Nuestro proyecto es una tienda de muebles organizada como monorepo. El frontend esta hecho con React, Vite y TypeScript. El backend usa .NET 8 y esta separado por microservicios, siguiendo arquitectura limpia en las partes mas desarrolladas como CatalogService.

La comunicacion no va directamente del navegador a cada servicio. Primero pasa por un API Gateway en Node.js, que centraliza las rutas y redirige las peticiones hacia AuthService, CatalogService, CartService, OrderService, PaymentService e InventoryService.

El flujo principal inicia cuando el usuario entra al frontend, inicia sesion, consulta productos, agrega al carrito, crea una orden y autoriza un pago. Esta organizacion permite separar responsabilidades, probar reglas de negocio de forma aislada y escalar cada modulo segun la necesidad del sistema.
```

## 11. Diapositivas sugeridas

| Diapositiva | Titulo | Contenido |
| --- | --- | --- |
| 1 | Contexto del proyecto | Tienda de muebles modernos y objetivo del sistema |
| 2 | Stack tecnologico | React, Vite, TypeScript, Tailwind, Node, .NET 8, Docker |
| 3 | Estructura del monorepo | Carpetas principales y responsabilidad de cada una |
| 4 | Arquitectura backend | Modulos funcionales y microservicios |
| 5 | Arquitectura limpia | Api, Application, Domain, Infrastructure, Tests |
| 6 | Flujo de compra | Usuario -> Frontend -> Gateway -> Servicios -> Respuesta |
| 7 | Servicios y puertos | Tabla de servicios |
| 8 | Beneficios | Separacion de responsabilidades, mantenibilidad, pruebas y escalabilidad |
