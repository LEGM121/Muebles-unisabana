# Guia: donde estan los tests y como validar desde el frontend

Esta guia reemplaza la anterior. Explica donde quedaron implementadas las pruebas, que valida cada una y como comprobar que el sistema funciona cuando se usa el frontend contra los servicios reales.

## 1. Resumen rapido

Hay dos tipos de validacion:

| Validacion | Que comprueba | Usa servicios reales |
| --- | --- | --- |
| Tests backend | Reglas de dominio, servicio de catalogo, contrato de validacion | No, usan ejecucion de test .NET |
| Tests frontend | Pantallas, flujos de UI, carrito, orden, pago y E2E simulado | No, usan mocks de `fetch` |
| Prueba manual desde frontend | Frontend -> Gateway -> Microservicios -> PostgreSQL | Si |
| Pipeline GitHub Actions | Build y tests backend/frontend | No levanta Docker completo |

Punto clave: el E2E automatico de `frontend/src/App.e2e.test.tsx` valida el flujo completo de compra en la UI, pero con respuestas simuladas. Para comprobar integracion real con servicios, se debe levantar Docker y usar la app en `http://localhost:5173`.

## 1.1 Forma recomendada: reporte visual

Si quieres ver todo en una pagina y no perderte en la consola, ejecuta:

```powershell
cd C:\Proyecto\Proyecto-Muebles4-main
powershell -ExecutionPolicy Bypass -File scripts\run-test-report.ps1
```

Ese comando corre:

- Tests backend de CatalogService.
- Tests frontend con Vitest.
- E2E automatico de compra.
- Cobertura backend.
- Logs de cada ejecucion.

Luego abre este archivo en el navegador:

```text
C:\Proyecto\Proyecto-Muebles4-main\reports\index.html
```

Ese `index.html` muestra:

- Total backend, por ejemplo `11/11`.
- Total frontend, por ejemplo `8/8`.
- Lista de pruebas unitarias.
- Lista de pruebas integrales.
- Lista de pruebas de sistema.
- Enlaces a logs, TRX, cobertura y reporte E2E.

## 2. Donde quedaron los tests implementados

### 2.1 Tests unitarios backend

Archivo:

```text
backend/services/CatalogService/CatalogService.Tests/ProductValidationTests.cs
```

Pruebas:

- `Validate_WhenProductIsComplete_ReturnsValid`
- `Validate_WhenPriceIsZeroOrNegative_ReturnsPriceError`
- `Validate_WhenNameIsBlank_ReturnsNameError`

Validan la entidad:

```text
backend/services/CatalogService/CatalogService.Domain/Entities/Product.cs
```

Que comprueban:

- Producto completo es valido.
- Precio `0` o negativo es invalido.
- Nombre vacio o con espacios es invalido.

Tambien hay evidencia TDD en:

```text
backend/services/CatalogService/CatalogService.Tests/TddIterationEvidenceTests.cs
```

Pruebas:

- `TDD 1 Green: producto completo es valido`
- `TDD 2 Green: precio en limite cero es invalido`
- `TDD 3 Refactor: errores se acumulan sin perder legibilidad`

### 2.2 Tests integrales backend

Archivo:

```text
backend/services/CatalogService/CatalogService.Tests/ProductCatalogServiceIntegrationTests.cs
```

Prueba:

```text
GetAvailableProducts_WhenRepositoryHasInvalidPrices_ReturnsOnlyPositivePricesOrderedByName
```

Valida la colaboracion entre:

```text
ProductCatalogService
IProductRepository
InMemoryProductRepository
```

Que comprueba:

- El servicio lee productos desde un repositorio.
- Excluye productos con precio invalido.
- Ordena productos disponibles por nombre.

### 2.3 Tests de sistema backend

Archivo:

```text
backend/services/CatalogService/CatalogService.Tests/CatalogEndpointSystemTests.cs
```

Pruebas:

- `ShouldReturnValidWhenPostRequest`
- `ShouldReturnBadRequestWhenPostRequestHasBoundaryPriceZero`

Que comprueban:

- Un producto valido equivale a respuesta `200`.
- Un producto con precio `0` equivale a respuesta `400`.

Endpoint relacionado:

```text
POST /api/catalog/validate
```

### 2.4 Tests frontend

Archivo:

```text
frontend/src/App.test.tsx
```

Pruebas:

- Render inicial y menu admin.
- Opciones de cliente.
- CRUD de inventario.
- Flujos de ordenes y pagos.
- Bloqueo de checkout para invitado.
- Usuarios, carrito y sesion.

Archivo:

```text
frontend/src/App.e2e.test.tsx
```

Prueba:

```text
logs in, loads products, adds to cart and finishes payment with invoice
```

Que comprueba:

- Login de cliente.
- Carga de catalogo.
- Agregar producto al carrito.
- Crear orden.
- Autorizar pago.
- Generar factura.
- Generar reporte E2E.

Reporte generado:

```text
reports/checkout-e2e-report.md
```

## 3. Como ejecutar los tests localmente

### 3.1 Backend completo de pruebas

Desde la raiz:

```powershell
cd C:\Proyecto\Proyecto-Muebles4-main
dotnet test backend\services\CatalogService\CatalogService.Tests\CatalogService.Tests.csproj
```

Resultado esperado:

```text
Correctas! - Con error: 0, Superado: 11, Omitido: 0, Total: 11
```

### 3.2 Backend con reporte y cobertura

```powershell
dotnet test backend\services\CatalogService\CatalogService.Tests\CatalogService.Tests.csproj --logger "trx;LogFileName=catalog-tests.trx" --results-directory reports\backend-test-results --collect:"XPlat Code Coverage"
```

Reportes esperados:

```text
reports/backend-test-results/catalog-tests.trx
reports/backend-test-results/{guid}/coverage.cobertura.xml
```

### 3.3 Frontend completo de pruebas

```powershell
cd C:\Proyecto\Proyecto-Muebles4-main\frontend
npm.cmd test -- --run
```

Resultado esperado:

```text
Test Files  2 passed
Tests       8 passed
```

Reporte E2E esperado:

```text
C:\Proyecto\Proyecto-Muebles4-main\reports\checkout-e2e-report.md
```

### 3.4 Build frontend

```powershell
cd C:\Proyecto\Proyecto-Muebles4-main\frontend
npm.cmd run build
```

Resultado esperado:

```text
built
```

## 4. Como comprobar que funciona usando servicios reales desde frontend

Esta es la validacion importante cuando quieres demostrar que la app funciona de verdad con microservicios.

### 4.1 Levantar backend completo

Desde la raiz:

```powershell
cd C:\Proyecto\Proyecto-Muebles4-main
docker compose up --build
```

Esperar a que levanten:

```text
postgres
authservice
catalogservice
cartservice
orderservice
paymentservice
inventoryservice
gateway
```

Puertos importantes:

| Servicio | URL |
| --- | --- |
| Gateway | `http://localhost:9090` |
| AuthService | `http://localhost:8081` |
| CatalogService | `http://localhost:8082` |
| CartService | `http://localhost:8083` |
| OrderService | `http://localhost:8084` |
| PaymentService | `http://localhost:8085` |
| InventoryService | `http://localhost:8086` |

### 4.2 Verificar gateway y catalogo

En otra terminal:

```powershell
Invoke-RestMethod http://localhost:9090/health
```

Luego:

```powershell
Invoke-RestMethod http://localhost:9090/api/catalog
```

Si responde una lista de productos, el frontend podra cargar catalogo por el gateway.

### 4.3 Levantar frontend

En otra terminal:

```powershell
cd C:\Proyecto\Proyecto-Muebles4-main\frontend
npm.cmd run dev
```

Abrir:

```text
http://localhost:5173
```

El frontend llama por defecto al gateway:

```text
http://localhost:9090
```

Esto esta configurado en:

```text
frontend/src/services/api.ts
```

Linea clave:

```ts
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9090';
```

## 5. Flujo manual para confirmar integracion real

Con Docker y frontend encendidos:

1. Abrir `http://localhost:5173`.
2. Verificar que carguen productos del catalogo.
3. Iniciar sesion o registrar un usuario.
4. Agregar un producto al carrito.
5. Presionar `Pagar y generar factura`.
6. Confirmar que aparece mensaje de pago correcto.
7. Confirmar que aparece una factura en pantalla.
8. Entrar a la seccion de pagos o facturas si aplica.

Si este flujo funciona, entonces se comprobo:

```text
Frontend -> Gateway -> AuthService
Frontend -> Gateway -> CatalogService
Frontend -> Gateway -> CartService
Frontend -> Gateway -> OrderService
Frontend -> Gateway -> PaymentService
```

### 5.1 Generar reporte despues del flujo manual desde Git Bash

Despues de hacer el login y el pago desde `http://localhost:5173`, puedes generar un reporte manual desde Git Bash.

Desde la raiz del proyecto:

```bash
cd /c/Proyecto/Proyecto-Muebles4-main
powershell.exe -ExecutionPolicy Bypass -File scripts/generate-manual-e2e-report.ps1
```

El script te va a preguntar:

- Cliente mostrado en pantalla.
- Correo mostrado en pantalla.
- Producto comprado.
- Factura generada.
- Total pagado.

Tambien puedes pasarlo todo en el comando:

```bash
powershell.exe -ExecutionPolicy Bypass -File scripts/generate-manual-e2e-report.ps1 \
  -Customer "Nelson gomez" \
  -Email "nelson@muebles.com" \
  -Product "Mesa Comedor Luna" \
  -Invoice "FAC-20260615-A7273B44" \
  -Total "$3709.68"
```

Reportes generados:

```text
reports/manual-e2e-report.md
reports/manual-e2e/{fecha-hora}/manual-e2e-report.md
reports/manual-e2e/{fecha-hora}/docker-services.log
reports/manual-e2e/{fecha-hora}/purchase-services.log
```

Este reporte no reemplaza los tests automaticos. Sirve como evidencia de que realizaste una compra manual usando frontend, gateway y microservicios reales.

## 6. Como ver que las llamadas salen del frontend

En el navegador:

1. Abrir DevTools.
2. Ir a la pestana `Network`.
3. Filtrar por `api`.
4. Ejecutar el flujo de compra.
5. Confirmar llamadas a:

```text
POST http://localhost:9090/api/auth/login
GET  http://localhost:9090/api/catalog
POST http://localhost:9090/api/cart/items
POST http://localhost:9090/api/orders
POST http://localhost:9090/api/payments/authorize
```

Resultado esperado:

- Las respuestas deben ser `200` o `201`.
- No debe haber errores `500`.
- No debe haber errores de CORS.
- La factura debe mostrarse en pantalla.

## 6.1 Captura automatica de payloads reales del frontend

Tambien se puede generar evidencia automatica de los datos enviados desde el frontend hacia los servicios reales de Docker.

1. Levantar Docker:

```powershell
docker compose up --build
```

2. Levantar el frontend:

```powershell
cd frontend
npm.cmd run dev
```

3. Abrir el frontend con la captura activada:

```text
http://localhost:5173?e2eCapture=1
```

4. Ejecutar el flujo real:

- Iniciar sesion.
- Agregar producto al carrito.
- Presionar `Pagar y generar factura`.

Cuando la captura esta activa aparece un panel en la esquina inferior derecha:

```text
Captura E2E activa
Llamadas capturadas: ...
Descargar reporte
Limpiar captura
```

Al terminar el pago, presionar `Descargar reporte`. El navegador descarga:

```text
real-e2e-report-{fecha}.md
real-e2e-calls-{fecha}.json
```

El reporte incluye:

- Endpoint llamado.
- Metodo HTTP.
- Payload enviado por el frontend.
- Codigo de respuesta.
- Respuesta del servicio.
- Pago, factura, cliente y total cuando el servicio los devuelve.

Nota: los campos sensibles como `password` y `token` se registran como `[REDACTADO]`.

La captura no cambia el flujo normal de la aplicacion. Solo se activa con `?e2eCapture=1`. Para apagarla:

```text
http://localhost:5173?e2eCapture=0
```

## 7. Diferencia entre E2E automatico y prueba real desde navegador

### E2E automatico

Archivo:

```text
frontend/src/App.e2e.test.tsx
```

Ventajas:

- Corre rapido.
- No necesita Docker.
- Genera `reports/checkout-e2e-report.md`.
- Valida que la UI haga las llamadas correctas y mande los payloads esperados.

Limitacion:

- No llama a los servicios reales; usa mocks.

### Prueba real desde navegador

Ventajas:

- Valida integracion real.
- Usa gateway y microservicios.
- Usa PostgreSQL por Docker.

Limitacion:

- Es manual.
- Requiere Docker y servicios levantados.

## 8. Donde quedan los reportes

Reporte resumen:

```text
reports/test-summary-report.md
```

Reporte visual unificado:

```text
reports/index.html
```

Reporte E2E de compra:

```text
reports/checkout-e2e-report.md
```

Reporte tecnico backend:

```text
reports/backend-test-results/catalog-tests.trx
```

Cobertura backend:

```text
reports/backend-test-results/{guid}/coverage.cobertura.xml
```

Cobertura anterior generada por el proyecto:

```text
backend/services/CatalogService/CatalogService.Tests/TestResults/{guid}/coverage.cobertura.xml
```

## 8.1 Unificar pruebas automaticas + E2E real del navegador

Despues de descargar desde el navegador:

```text
real-e2e-report-{fecha}.md
real-e2e-calls-{fecha}.json
```

se puede generar un solo reporte HTML que incluya:

- Pruebas unitarias backend.
- Pruebas integrales backend.
- Pruebas de sistema backend.
- Pruebas frontend.
- E2E simulado.
- E2E real Docker descargado desde el navegador.

Ejemplo:

```powershell
cd C:\Proyecto\Proyecto-Muebles4-main
powershell -ExecutionPolicy Bypass -File scripts\run-test-report.ps1 `
  -RealE2eReportPath "C:\Users\LENOVO\Downloads\real-e2e-report-2026-06-15T18-00-35-775Z.md" `
  -RealE2eCallsPath "C:\Users\LENOVO\Downloads\real-e2e-calls-2026-06-15T18-00-35-775Z.json"
```

Forma rapida despues de cada compra real:

```powershell
cd C:\Proyecto\Proyecto-Muebles4-main
powershell -ExecutionPolicy Bypass -File scripts\run-test-report.ps1 -IncludeLatestRealE2eFromDownloads
```

Esta forma toma automaticamente el ultimo:

```text
C:\Users\LENOVO\Downloads\real-e2e-report-*.md
C:\Users\LENOVO\Downloads\real-e2e-calls-*.json
```

y agrega al HTML la seccion:

```text
Mapa E2E real y pruebas relacionadas
```

Esa tabla muestra:

- Endpoint real llamado por el frontend.
- Metodo HTTP.
- Status real.
- Payload real enviado.
- Respuesta real recibida.
- Tipo de validacion relacionada: E2E real, integral, sistema o unitaria.
- Archivos de test relacionados.

Resultado:

```text
reports/index.html
reports/test-runs/{fecha-hora}/real-e2e/real-e2e-report-{fecha}.md
reports/test-runs/{fecha-hora}/real-e2e/real-e2e-calls-{fecha}.json
```

## 9. Pipeline GitHub Actions

Workflow:

```text
.github/workflows/local-ci.yml
```

Corre cuando:

- Hay `push` a `main`.
- Hay `push` a `master`.
- Se abre o actualiza un Pull Request.
- Se ejecuta manualmente desde GitHub Actions.

### Backend en pipeline

Ejecuta:

```bash
dotnet restore backend/services/FurnitureStore.sln
dotnet build backend/services/FurnitureStore.sln --no-restore --configuration Release
dotnet test backend/services/FurnitureStore.sln --no-build --configuration Release --logger trx --results-directory TestResults/backend
```

Sube artifact:

```text
backend-test-results
```

### Frontend en pipeline

Ejecuta:

```bash
npm ci
npm test -- --run
npm run build
```

Sube artifact:

```text
frontend-test-reports
```

## 10. Checklist final de verificacion

Antes de entregar o subir cambios:

```powershell
cd C:\Proyecto\Proyecto-Muebles4-main
dotnet test backend\services\CatalogService\CatalogService.Tests\CatalogService.Tests.csproj
```

```powershell
cd C:\Proyecto\Proyecto-Muebles4-main\frontend
npm.cmd test -- --run
npm.cmd run build
```

Para validar servicios reales:

```powershell
cd C:\Proyecto\Proyecto-Muebles4-main
docker compose up --build
```

Luego:

```powershell
cd C:\Proyecto\Proyecto-Muebles4-main\frontend
npm.cmd run dev
```

Abrir:

```text
http://localhost:5173
```

Y confirmar manualmente:

- Catalogo visible.
- Login funcionando.
- Producto agregado al carrito.
- Orden creada.
- Pago autorizado.
- Factura generada.
- Network muestra llamadas a `localhost:9090/api/...`.

## 11. Como saber si realmente funciona

Se considera funcionando cuando se cumplen estas tres cosas:

1. Los tests automaticos pasan:

```text
Backend: 11/11
Frontend: 8/8
```

2. Los reportes existen:

```text
reports/test-summary-report.md
reports/checkout-e2e-report.md
reports/backend-test-results/catalog-tests.trx
```

3. El flujo manual desde navegador funciona con Docker:

```text
Frontend -> Gateway -> Servicios -> PostgreSQL
```
