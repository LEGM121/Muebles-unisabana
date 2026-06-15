# Guia para presentacion: casos de prueba del proyecto

Esta guia resume que pruebas tiene el proyecto, que valida cada una y como explicarlas en una presentacion. La idea es mostrar que las pruebas estan organizadas por niveles: unitarias, integrales, sistema/API y end-to-end.

## 1. Objetivo de las pruebas

El objetivo es comprobar que el sistema funciona desde dos perspectivas:

- Reglas internas del negocio, por ejemplo validar que un producto no tenga precio cero.
- Flujo completo del usuario, por ejemplo iniciar sesion, agregar al carrito, crear una orden y pagar.

La estrategia evita mezclar responsabilidades. Cada tipo de prueba responde una pregunta distinta.

## 2. Tipos de prueba usados

| Tipo | Pregunta que responde | Herramienta | Ejemplo en el proyecto |
| --- | --- | --- | --- |
| Unitaria | Una regla funciona aislada? | xUnit / Vitest | `Product.Validate()` |
| Integral | Varias capas colaboran bien? | xUnit | Servicio de catalogo + repositorio en memoria |
| Sistema/API | El endpoint cumple el contrato esperado? | xUnit / HTTP | Validacion de producto como respuesta 200 o 400 |
| E2E simulado | La UI completa el flujo con respuestas controladas? | Vitest + Testing Library | Checkout simulado en `App.e2e.test.tsx` |
| E2E real recomendado | El navegador llega hasta backend real? | Playwright + Docker | Compra real con servicios levantados |

## 3. Casos de prueba backend: CatalogService

### 3.1 Pruebas unitarias de dominio

Archivo:

```text
backend/services/CatalogService/CatalogService.Tests/ProductValidationTests.cs
```

Casos:

| Caso | Entrada | Resultado esperado | Importancia |
| --- | --- | --- | --- |
| Producto completo valido | Id, nombre, categoria y precio mayor a cero | `IsValid = true` | Confirma el camino feliz |
| Precio cero | Producto con `Price = 0` | Error de precio | Valida valor limite |
| Precio negativo | Producto con `Price = -1` | Error de precio | Evita datos invalidos |
| Nombre vacio | Producto sin nombre | Error de nombre obligatorio | Evita productos incompletos |
| Nombre en blanco | Producto con espacios | Error de nombre obligatorio | Evita datos aparentemente llenos pero invalidos |

Mensaje para exposicion:

```text
Estas pruebas son unitarias porque no usan HTTP, base de datos ni servidores. Solo prueban la entidad Product y sus reglas de negocio.
```

### 3.2 Evidencia de TDD

Archivo:

```text
backend/services/CatalogService/CatalogService.Tests/TddIterationEvidenceTests.cs
```

Casos:

| Iteracion | Que demuestra |
| --- | --- |
| TDD 1 Green | Un producto completo debe ser valido |
| TDD 2 Green | El precio cero debe ser invalido |
| TDD 3 Refactor | La validacion puede acumular varios errores sin perder legibilidad |

Mensaje para exposicion:

```text
Este archivo evidencia el ciclo TDD: primero se define el comportamiento esperado, luego se implementa lo minimo para que pase y finalmente se mejora el codigo sin cambiar el resultado.
```

### 3.3 Prueba integral de aplicacion

Archivo:

```text
backend/services/CatalogService/CatalogService.Tests/ProductCatalogServiceIntegrationTests.cs
```

Caso:

| Caso | Componentes involucrados | Resultado esperado |
| --- | --- | --- |
| Catalogo filtra precios invalidos y ordena productos | `ProductCatalogService` + `IProductRepository` + `InMemoryProductRepository` | Devuelve solo productos con precio positivo y ordenados por nombre |

Mensaje para exposicion:

```text
Esta prueba ya no revisa una clase aislada. Comprueba que el caso de uso y el repositorio colaboren correctamente.
```

### 3.4 Pruebas de sistema/API

Archivo:

```text
backend/services/CatalogService/CatalogService.Tests/CatalogEndpointSystemTests.cs
```

Casos:

| Caso | Entrada | Estado esperado |
| --- | --- | --- |
| Producto valido | Producto completo con precio positivo | HTTP 200 |
| Producto invalido | Producto con precio cero | HTTP 400 |

Mensaje para exposicion:

```text
Estas pruebas representan el contrato esperado del endpoint de validacion. La mejora recomendada es conectarlas con una API levantada en memoria usando WebApplicationFactory o con una llamada HTTP real.
```

## 4. Casos de prueba frontend

### 4.1 Pruebas de validacion de formularios

Archivo:

```text
frontend/src/validation/formValidation.test.ts
```

Casos:

| Formulario | Caso | Resultado esperado |
| --- | --- | --- |
| Registro | Nombre, identificacion, correo y contrasenas validas | Sin errores |
| Registro | Nombre vacio o con caracteres no permitidos | Error de nombre |
| Registro | Identificacion no numerica o fuera de rango | Error de identificacion |
| Registro | Contrasenas diferentes | Error de coincidencia |
| Inventario | Datos validos | Sin errores |
| Inventario | Campos obligatorios vacios | Errores por campo requerido |
| Inventario | Caracteres invalidos o stock reservado mayor al disponible | Errores de validacion |

Mensaje para exposicion:

```text
Estas pruebas protegen la calidad de los datos antes de enviarlos al backend.
```

### 4.2 Pruebas de componentes e interfaz

Archivos principales:

```text
frontend/src/App.test.tsx
frontend/src/components/CartPanel.test.tsx
frontend/src/components/LoginForm.validation.test.tsx
frontend/src/services/apiConnection.test.ts
```

Que validan:

- Renderizado de la aplicacion.
- Comportamiento de login.
- Validaciones del formulario.
- Panel de carrito.
- Conexion esperada con servicios de API.

## 5. Caso E2E simulado: flujo completo de compra

Archivo:

```text
frontend/src/App.e2e.test.tsx
```

Flujo validado:

1. La aplicacion carga el catalogo.
2. El usuario inicia sesion.
3. Se muestra el rol `Customer`.
4. El usuario agrega un producto al carrito.
5. El checkout crea una orden.
6. El pago se autoriza.
7. Se genera una factura con prefijo `FAC-E2E`.
8. Se verifica que existan 1 orden y 1 pago en el estado simulado.

Endpoints simulados/verificados:

```text
/api/auth/login
/api/catalog
/api/cart/items
/api/orders
/api/payments/authorize
```

Mensaje para exposicion:

```text
Esta es una prueba end-to-end simulada. Recorre el flujo completo desde la interfaz, pero las respuestas del backend se controlan con mocks. Sirve para validar la experiencia del usuario y la integracion de la UI.
```

## 6. E2E real recomendado

El E2E real debe validar:

```text
Navegador real -> Frontend React -> Gateway Node -> Microservicios .NET -> Base de datos -> Respuesta en pantalla
```

Herramienta recomendada:

```text
Playwright
```

Caso recomendado para automatizar:

| Paso | Accion | Evidencia esperada |
| --- | --- | --- |
| 1 | Abrir `http://localhost:5173?e2eCapture=1` | La aplicacion carga |
| 2 | Iniciar sesion o registrar usuario | Usuario autenticado |
| 3 | Ver catalogo | Productos reales visibles |
| 4 | Agregar producto al carrito | Confirmacion en pantalla |
| 5 | Crear orden | Respuesta `201` o mensaje de orden creada |
| 6 | Autorizar pago | Pago realizado correctamente |
| 7 | Ver factura | Numero de factura visible |
| 8 | Exportar reporte | Evidencia de llamadas reales |

## 7. Comandos para ejecutar pruebas

Backend:

```powershell
dotnet test backend\services\CatalogService\CatalogService.Tests\CatalogService.Tests.csproj
```

Frontend:

```powershell
cd frontend
npm.cmd test -- --run
```

Reporte unificado:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-test-report.ps1
```

Captura manual E2E real:

```text
http://localhost:5173?e2eCapture=1
```

## 8. Matriz resumida para diapositiva

| Nivel | Caso principal | Archivo | Estado |
| --- | --- | --- | --- |
| Unitaria backend | Validar producto | `ProductValidationTests.cs` | Implementado |
| TDD backend | Evidenciar red/green/refactor | `TddIterationEvidenceTests.cs` | Implementado |
| Integral backend | Catalogo + repositorio | `ProductCatalogServiceIntegrationTests.cs` | Implementado |
| Sistema/API | Producto valido/invalido como 200/400 | `CatalogEndpointSystemTests.cs` | Parcial |
| Validacion frontend | Formularios de registro e inventario | `formValidation.test.ts` | Implementado |
| UI/componentes | Login, carrito, renderizado | `*.test.tsx` | Implementado |
| E2E simulado | Compra completa con mocks | `App.e2e.test.tsx` | Implementado |
| E2E real | Compra completa con backend real | Playwright recomendado | Pendiente de automatizar |

## 9. Guion corto para explicar en presentacion

```text
Las pruebas del proyecto estan divididas por niveles. Primero tenemos pruebas unitarias, que validan reglas aisladas como que un producto no pueda tener precio cero. Luego tenemos pruebas integrales, donde el servicio de catalogo trabaja con un repositorio en memoria para comprobar colaboracion entre capas.

Tambien tenemos pruebas de sistema que representan el contrato de los endpoints, por ejemplo que un producto valido corresponda a HTTP 200 y uno invalido a HTTP 400. En el frontend se prueban formularios, componentes y un flujo E2E simulado de compra completa.

El flujo E2E simulado valida login, catalogo, carrito, orden, pago y factura, aunque usando respuestas controladas. Como siguiente paso se recomienda automatizar un E2E real con Playwright, Docker Compose y la ruta http://localhost:5173?e2eCapture=1 para capturar evidencia de llamadas reales.
```

## 10. Diapositivas sugeridas

| Diapositiva | Titulo | Contenido |
| --- | --- | --- |
| 1 | Objetivo de pruebas | Calidad del sistema y prevencion de errores |
| 2 | Piramide de pruebas | Unitarias, integrales, sistema/API y E2E |
| 3 | Unitarias backend | `Product.Validate()` y casos de precio/nombre |
| 4 | TDD | Red, Green, Refactor aplicado al catalogo |
| 5 | Integrales | `ProductCatalogService` con repositorio |
| 6 | Frontend | Validaciones, componentes y servicios |
| 7 | E2E simulado | Login -> catalogo -> carrito -> orden -> pago -> factura |
| 8 | E2E real recomendado | Playwright + Docker + evidencia real |
| 9 | Comandos | `dotnet test`, `npm test`, reporte unificado |
| 10 | Conclusion | El proyecto ya tiene base de pruebas y puede evolucionar a E2E real |
