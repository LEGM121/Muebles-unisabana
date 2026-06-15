# Estrategia de pruebas unitarias, integrales y E2E

Este documento aterriza como aplicar pruebas unitarias, integrales y end-to-end en el proyecto de muebles. La idea principal es no mezclar responsabilidades: cada tipo de prueba responde una pregunta distinta.

## 1. Resumen ejecutivo

| Tipo de prueba | Pregunta que responde | Herramienta actual/recomendada | Estado en el proyecto |
| --- | --- | --- | --- |
| Unitaria | La regla de negocio funciona aislada? | xUnit / Vitest | Implementada en CatalogService |
| Integral | Dos o mas capas colaboran correctamente? | xUnit + repositorio en memoria o DB de prueba | Implementada parcialmente en CatalogService |
| Sistema/API | El endpoint responde con el contrato esperado? | xUnit, WebApplicationFactory o peticiones HTTP | Implementada parcialmente en CatalogService |
| E2E simulado | La UI ejecuta el flujo completo con respuestas controladas? | Vitest + Testing Library + fetch mock | Implementada en frontend |
| E2E real | El clic del usuario llega al backend real y vuelve a la UI? | Playwright + Docker Compose | Viable, pendiente de automatizar |

Conclusion: si se puede probar el flujo completo. Actualmente el proyecto ya tiene buena base para CatalogService y frontend. Para E2E real falta automatizar navegador con Playwright o Cypress, usando Docker Compose para levantar gateway, microservicios y PostgreSQL.

## 2. Diferencia importante: E2E simulado vs E2E real

### E2E simulado actual

Archivo:

```text
frontend/src/App.e2e.test.tsx
```

Que valida:

- El usuario inicia sesion.
- Se carga catalogo.
- Se agrega producto al carrito.
- Se crea orden.
- Se autoriza pago.
- Se genera factura.
- Se verifican las llamadas esperadas a `/api/auth/login`, `/api/catalog`, `/api/cart/items`, `/api/orders` y `/api/payments/authorize`.

Limitacion:

```text
No usa backend real. Usa fetch mock.
```

Por eso es una prueba muy util de flujo UI, pero no reemplaza una prueba E2E real.

### E2E real recomendado

Debe cubrir:

```text
Navegador real -> React/Vite -> Gateway Node -> Microservicios .NET -> PostgreSQL -> Respuesta al navegador
```

Herramienta recomendada:

```text
Playwright
```

Flujo E2E real minimo:

1. Abrir `http://localhost:5173?e2eCapture=1`.
2. Iniciar sesion o registrar usuario.
3. Ver productos del catalogo.
4. Agregar producto al carrito.
5. Pagar y generar factura.
6. Verificar en pantalla que la factura fue generada.
7. Confirmar que las respuestas reales fueron `200` o `201`.

El proyecto ya tiene soporte para capturar evidencia real en:

```text
frontend/src/services/api.ts
```

Cuando se usa:

```text
http://localhost:5173?e2eCapture=1
```

la app guarda llamadas reales, payloads y respuestas para generar reportes descargables.

## 3. Matriz por servicio

| Servicio | Unitarias recomendadas | Integrales recomendadas | E2E recomendado |
| --- | --- | --- | --- |
| AuthService | Validar email/password requeridos, rol por defecto, reglas de admin | Registro, login, listado de usuarios con SQLite de prueba | Usuario se registra/inicia sesion desde UI |
| CatalogService | `Product.Validate()` y clases de equivalencia | `ProductCatalogService` + `IProductRepository` | Catalogo visible en pantalla desde gateway |
| CartService | Cantidad valida, precio valido, subtotal | Agregar item, consultar carrito, limpiar carrito con PostgreSQL de prueba | Usuario agrega producto al carrito |
| OrderService | Calculo subtotal, IVA, total, validacion de items | Crear orden, consultar orden, filtrar por cliente | Checkout crea orden real |
| PaymentService | Calculo de factura, impuesto, total, numero de factura | Autorizar pago, consultar pago, descargar PDF | Pago real genera factura visible |
| InventoryService | Validacion de producto, stock disponible/reservado | CRUD de productos y consulta por id | Admin crea/edita/elimina producto desde UI |
| Gateway Node | Ruteo, headers de usuario, errores 502 | Proxy hacia cada servicio levantado | Todo flujo pasa por `localhost:9090` |

## 4. Cobertura actual del proyecto

### Unitarias existentes

Archivo:

```text
backend/services/CatalogService/CatalogService.Tests/ProductValidationTests.cs
```

Casos cubiertos:

- Producto completo valido.
- Precio `0` o negativo invalido.
- Nombre vacio o en blanco invalido.

Conceptos aplicados:

- AAA: Arrange, Act, Assert.
- Clases de equivalencia.
- Valores limite.
- Reglas de dominio aisladas.

### TDD existente

Archivo:

```text
backend/services/CatalogService/CatalogService.Tests/TddIterationEvidenceTests.cs
```

Conceptos aplicados:

- Red: se define primero el comportamiento esperado.
- Green: se implementa lo minimo para pasar.
- Refactor: se mejora sin cambiar el comportamiento.

### Integrales existentes

Archivo:

```text
backend/services/CatalogService/CatalogService.Tests/ProductCatalogServiceIntegrationTests.cs
```

Valida:

```text
ProductCatalogService -> IProductRepository -> InMemoryProductRepository
```

Esto es integral porque prueba colaboracion entre capas, pero evita depender de PostgreSQL real.

### Sistema/API existente

Archivo:

```text
backend/services/CatalogService/CatalogService.Tests/CatalogEndpointSystemTests.cs
```

Valida el contrato esperado del endpoint:

```text
POST /api/catalog/validate
```

Casos:

- Producto valido equivale a HTTP `200`.
- Producto con precio `0` equivale a HTTP `400`.

Mejora recomendada: convertir estas pruebas en llamadas reales al endpoint con `WebApplicationFactory` o con peticiones HTTP contra el servicio levantado.

### Frontend existente

Archivos:

```text
frontend/src/App.test.tsx
frontend/src/App.e2e.test.tsx
```

Validan:

- Renderizado de la aplicacion.
- Login.
- Roles admin/customer.
- Inventario.
- Ordenes.
- Pagos.
- Usuarios.
- Carrito.
- Checkout simulado.

## 5. Propuesta de automatizacion E2E real

Para automatizar el E2E real se recomienda agregar:

```text
frontend/playwright.config.ts
frontend/e2e/checkout-real.spec.ts
```

Dependencias:

```powershell
cd frontend
npm install -D @playwright/test
npx playwright install
```

Script sugerido en `frontend/package.json`:

```json
{
  "scripts": {
    "e2e": "playwright test"
  }
}
```

Escenario base:

```ts
import { expect, test } from '@playwright/test';

test('compra real desde navegador hasta factura', async ({ page }) => {
  await page.goto('http://localhost:5173?e2eCapture=1');

  await expect(page.getByText(/Tienda de muebles/i)).toBeVisible();

  await page.getByRole('button', { name: /iniciar sesion/i }).click();
  await expect(page.getByText(/Rol: Customer|Rol: Admin/i)).toBeVisible();

  await page.getByRole('button', { name: /agregar al carrito/i }).first().click();
  await expect(page.getByText(/agregado al carrito/i)).toBeVisible();

  await page.getByRole('button', { name: /Pagar y generar factura/i }).click();

  await expect(page.getByText(/Pago realizado correctamente/i)).toBeVisible();
  await expect(page.getByText(/Factura generada/i)).toBeVisible();
});
```

Antes de ejecutar:

```powershell
docker compose up --build
```

En otra terminal:

```powershell
cd frontend
npm run dev
```

Luego:

```powershell
cd frontend
npm run e2e
```

## 6. Pruebas integrales para los servicios/controladores

En este proyecto los servicios usan minimal APIs, por ejemplo:

```text
backend/services/CatalogService/CatalogService.Api/Program.cs
backend/services/AuthService/AuthService.Api/Program.cs
backend/services/CartService/CartService.Api/Program.cs
backend/services/OrderService/OrderService.Api/Program.cs
backend/services/PaymentService/PaymentService.Api/Program.cs
backend/services/InventoryService/InventoryService.Api/Program.cs
```

No son controladores MVC tradicionales, pero se prueban igual desde el contrato HTTP.

### Enfoque recomendado

| Nivel | Como probar minimal APIs |
| --- | --- |
| Unidad | Extraer reglas a clases puras: validadores, calculadores, servicios de dominio |
| Integral | Levantar la API en memoria con `WebApplicationFactory` o usar DB de prueba |
| Sistema | Hacer peticiones HTTP a la API real levantada |
| E2E | Clics en navegador y verificacion de respuestas reales |

### Refactor minimo recomendado

Para facilitar unitarias en servicios distintos a CatalogService, conviene mover logica fuera de `Program.cs`.

Ejemplos:

```text
OrderTotalsCalculator
PaymentInvoiceFactory
CartItemValidator
InventoryProductValidator
AuthRequestValidator
```

Asi las pruebas unitarias no necesitan servidor, base de datos ni HTTP.

## 7. Orden recomendado de implementacion

1. Mantener y ejecutar las pruebas actuales de CatalogService.
2. Agregar unitarias puras para calculos de OrderService y PaymentService.
3. Agregar integrales HTTP para CatalogService usando endpoint real.
4. Agregar integrales para CartService, OrderService y PaymentService con base de prueba.
5. Agregar Playwright para E2E real de checkout.
6. Unificar resultados en `reports/index.html`.

## 8. Checklist para explicar en clase

Usa esta lectura corta:

```text
Las pruebas unitarias validan reglas aisladas, como Product.Validate().
Las pruebas integrales validan colaboracion entre capas, como servicio mas repositorio.
Las pruebas de sistema validan el contrato HTTP de los endpoints.
Las pruebas E2E reales validan el flujo completo desde el clic del usuario hasta la respuesta del backend.
En este proyecto ya tenemos unitarias, integrales y E2E simulado. Para E2E real se recomienda Playwright con Docker Compose.
```

## 9. Comandos utiles

Backend CatalogService:

```powershell
dotnet test backend\services\CatalogService\CatalogService.Tests\CatalogService.Tests.csproj
```

Frontend:

```powershell
cd frontend
npm.cmd test -- --run
```

Backend real:

```powershell
docker compose up --build
```

Frontend real:

```powershell
cd frontend
npm.cmd run dev
```

Captura E2E real manual:

```text
http://localhost:5173?e2eCapture=1
```

Reporte unificado:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-test-report.ps1
```

