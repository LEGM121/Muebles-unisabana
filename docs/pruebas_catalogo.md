# Evidencia de pruebas - CatalogService

## Unitarias

### TDD Red - Green - Refactor

| Iteracion | Rojo | Verde | Refactor |
| --- | --- | --- | --- |
| 1. Producto valido | Se escribio una prueba esperando que un producto completo fuera valido; fallo porque no existia `Product.Validate()`. | Se agrego `Validate()` con `ProductValidationResult`. | Se dejo la estructura AAA y mensajes de error legibles. |
| 2. Precio limite | Se agrego prueba para precio `0`; fallo porque no habia regla de precio. | Se agrego regla `Price <= 0`. | Se convirtio en teoria para cubrir `0` y `-1`. |
| 3. Errores acumulados | Se agrego prueba con varios campos invalidos; fallo al devolver un solo error. | Se acumularon todos los errores. | Se centralizo el resultado en `ProductValidationResult`. |

Pruebas relacionadas: `ProductValidationTests` y `TddIterationEvidenceTests`.

### Patron AAA

Ejemplo: `Validate_WhenProductIsComplete_ReturnsValid`.

- Arrange: crea un `Product` con id, nombre, categoria y precio valido.
- Act: ejecuta `product.Validate()`.
- Assert: verifica `IsValid` y que no existan errores.

La legibilidad se cuida con nombres `Metodo_Escenario_Resultado`, bloques AAA marcados por comentarios y datos simples.

### Clases de equivalencia y valores limite

| Campo | Clase valida | Clase invalida | Valores limite | Cobertura esperada |
| --- | --- | --- | --- | --- |
| `Price` | Mayor que `0` | `0` o menor | `0`, `-1`, `2499` | Regla de precio y borde inferior. |
| `Name` | Texto no vacio | Vacio o espacios | `""`, `" "`, `"Sofa Oslo"` | Nombre requerido. |
| `Category` | Texto no vacio | Vacio | `""`, `"Sala"` | Categoria requerida. |
| `Id` | GUID distinto de vacio | `Guid.Empty` | `Guid.Empty`, `Guid.NewGuid()` | Identificador requerido. |

## BDD

| Escenario Given - When - Then | Prueba |
| --- | --- |
| Given un producto completo, When se valida, Then el resultado es valido. | `Validate_WhenProductIsComplete_ReturnsValid` |
| Given un producto con precio cero, When se valida, Then retorna error de precio. | `Validate_WhenPriceIsZeroOrNegative_ReturnsPriceError` |
| Given un producto con varios campos invalidos, When se valida, Then acumula los errores. | `ProductValidationAccumulatesErrors` |
| Given un POST de validacion correcto, When se procesa el endpoint, Then retorna `200 OK`. | `ShouldReturnValidWhenPostRequest` |

## Integrales

La prueba `ProductCatalogServiceIntegrationTests` valida la colaboracion `ProductCatalogService` hacia `IProductRepository` usando `InMemoryProductRepository`. Este enfoque aisla la dependencia de PostgreSQL sin requerir una base real, equivalente a usar un doble controlado para verificar service-repository.

Configuracion equivalente:

```csharp
var repository = new InMemoryProductRepository(products);
var service = new ProductCatalogService(repository);
```

## Sistema

`CatalogEndpointSystemTests` valida el contrato esperado del endpoint de validacion:

- `ShouldReturnValidWhenPostRequest()` espera estado `200` para un producto valido.
- `ShouldReturnBadRequestWhenPostRequestHasBoundaryPriceZero()` espera estado `400` para el borde `Price = 0`.

El endpoint real esta expuesto en `POST /api/catalog/validate` y aplica la misma regla de dominio.

## Cobertura y resultados

Comando recomendado:

```powershell
dotnet test backend\services\CatalogService\CatalogService.Tests\CatalogService.Tests.csproj --collect:"XPlat Code Coverage"
```

El reporte XML se genera en `backend/services/CatalogService/CatalogService.Tests/TestResults/**/coverage.cobertura.xml`. Para HTML, instalar ReportGenerator y ejecutar:

```powershell
reportgenerator -reports:backend\services\CatalogService\CatalogService.Tests\TestResults\**\coverage.cobertura.xml -targetdir:backend\services\CatalogService\CatalogService.Tests\TestResults\CoverageReport -reporttypes:Html
```

Lineas no cubiertas esperadas: acceso real a PostgreSQL en `CatalogDbProductRepository`, porque las pruebas integrales usan repositorio en memoria para evitar dependencia externa.
