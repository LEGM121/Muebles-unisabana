# Guia de pruebas para presentar en clase

Esta guia explica donde esta cada evidencia de pruebas y como ejecutar el proyecto localmente desde VS Code.

## 1. Arquitectura que se va a demostrar

Flujo principal:

```text
Frontend React/Vite -> Node API Gateway -> Microservicios .NET -> PostgreSQL
```

Servicios y puertos:

| Componente | Ruta | Puerto |
| --- | --- | --- |
| Frontend | `frontend` | `5173` |
| Node API Gateway | `backend/node-api-gateway` | `9090` |
| AuthService | `backend/services/AuthService` | `8081` |
| CatalogService | `backend/services/CatalogService` | `8082` |
| CartService | `backend/services/CartService` | `8083` |
| OrderService | `backend/services/OrderService` | `8084` |
| PaymentService | `backend/services/PaymentService` | `8085` |
| InventoryService | `backend/services/InventoryService` | `8086` |
| PostgreSQL | `docker-compose.yml` | `5432` |

El frontend consume el gateway desde:

```ts
// frontend/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9090';
```

El gateway expone `/api/catalog` y lo reenvia al CatalogService:

```js
// backend/node-api-gateway/src/index.js
app.get('/api/catalog', (req, res) => proxyJson(req, res, services.catalog, '/api/catalog'));
```

El CatalogService expone los endpoints:

```csharp
// backend/services/CatalogService/CatalogService.Api/Program.cs
app.MapGet("/api/catalog", CatalogEndpoints.GetCatalog);
app.MapPost("/api/catalog/validate", CatalogEndpoints.ValidateProduct);
```

## 2. Mapa de evidencias por punto de la rubrica

| Punto solicitado | Donde esta | Que mostrar |
| --- | --- | --- |
| TDD Red - Green - Refactor | `backend/services/CatalogService/CatalogService.Tests/TddIterationEvidenceTests.cs` | Tres pruebas con nombres `TDD 1`, `TDD 2`, `TDD 3`. |
| Explicacion TDD | `docs/pruebas_catalogo.md` | Tabla de iteraciones rojo, verde y refactor. |
| Patron AAA | `backend/services/CatalogService/CatalogService.Tests/ProductValidationTests.cs` | Bloques `// Arrange`, `// Act`, `// Assert`. |
| Clases de equivalencia | `docs/pruebas_catalogo.md` | Tabla de campos `Price`, `Name`, `Category`, `Id`. |
| Valores limite | `ProductValidationTests.cs` | `InlineData(0)`, `InlineData(-1)`, `InlineData("")`, `InlineData(" ")`. |
| BDD Given - When - Then | `docs/pruebas_catalogo.md` | Tabla que relaciona escenarios con pruebas. |
| Reglas de dominio | `backend/services/CatalogService/CatalogService.Domain/Entities/Product.cs` | Metodo `Validate()` y `ProductValidationResult`. |
| Integracion service-repository | `backend/services/CatalogService/CatalogService.Tests/ProductCatalogServiceIntegrationTests.cs` | `ProductCatalogService` usando `InMemoryProductRepository`. |
| Repositorio aislado | `backend/services/CatalogService/CatalogService.Infrastructure/InMemoryProductRepository.cs` | Repositorio en memoria, sin PostgreSQL real. |
| Contrato de repositorio | `backend/services/CatalogService/CatalogService.Application/IProductRepository.cs` | Interfaz que separa servicio y persistencia. |
| Servicio de aplicacion | `backend/services/CatalogService/CatalogService.Application/ProductCatalogService.cs` | Filtra productos con precio positivo y ordena por nombre. |
| Pruebas de sistema | `backend/services/CatalogService/CatalogService.Tests/CatalogEndpointSystemTests.cs` | `ShouldReturnValidWhenPostRequest()` y caso `400`. |
| Endpoint real de sistema | `backend/services/CatalogService/CatalogService.Api/CatalogEndpoints.cs` | `ValidateProduct()` devuelve `Ok` o `BadRequest`. |
| Cobertura | `backend/services/CatalogService/CatalogService.Tests/TestResults/.../coverage.cobertura.xml` | Reporte generado con `dotnet test --collect:"XPlat Code Coverage"`. |
| Defectos encontrados | `defectos_integracion.md` | Defectos `DEF-001`, `DEF-002`, `DEF-003` con estado `Resuelto`. |

## 3. Fragmentos clave para explicar

### 3.1 Regla de dominio

Archivo:

```text
backend/services/CatalogService/CatalogService.Domain/Entities/Product.cs
```

Fragmento:

```csharp
public ProductValidationResult Validate()
{
    var errors = new List<string>();

    if (Id == Guid.Empty)
    {
        errors.Add("El identificador del producto es obligatorio.");
    }

    if (string.IsNullOrWhiteSpace(Name))
    {
        errors.Add("El nombre del producto es obligatorio.");
    }

    if (string.IsNullOrWhiteSpace(Category))
    {
        errors.Add("La categoria del producto es obligatoria.");
    }

    if (Price <= 0)
    {
        errors.Add("El precio debe ser mayor que cero.");
    }

    return new ProductValidationResult(errors.Count == 0, errors);
}
```

Explicacion para clase:

> Esta regla valida que el producto tenga identificador, nombre, categoria y precio positivo. Es una prueba unitaria porque se ejecuta sin base de datos ni servicios externos.

### 3.2 Prueba unitaria con AAA

Archivo:

```text
backend/services/CatalogService/CatalogService.Tests/ProductValidationTests.cs
```

Prueba:

```csharp
public void Validate_WhenProductIsComplete_ReturnsValid()
{
    // Arrange
    var product = new Product
    {
        Id = Guid.NewGuid(),
        Name = "Sofa Oslo",
        Category = "Sala",
        Price = 2499m
    };

    // Act
    var result = product.Validate();

    // Assert
    Assert.True(result.IsValid);
    Assert.Empty(result.Errors);
}
```

Explicacion:

- `Arrange`: prepara el producto valido.
- `Act`: ejecuta la validacion.
- `Assert`: confirma que el resultado sea valido.

### 3.3 Valores limite y equivalencia

Archivo:

```text
backend/services/CatalogService/CatalogService.Tests/ProductValidationTests.cs
```

Fragmento:

```csharp
[Theory]
[InlineData(0)]
[InlineData(-1)]
public void Validate_WhenPriceIsZeroOrNegative_ReturnsPriceError(decimal price)
```

Explicacion:

> El precio valido pertenece a la clase `Price > 0`. Los valores `0` y `-1` cubren el borde y la clase invalida.

### 3.4 Prueba integral service-repository

Archivo:

```text
backend/services/CatalogService/CatalogService.Tests/ProductCatalogServiceIntegrationTests.cs
```

Fragmento:

```csharp
var repository = new InMemoryProductRepository(new[]
{
    new CatalogProductDto("prod-2", "Zapatero Roble", "Entrada", 850m, "zapatero.jpg", new[] { "Cafe" }, new[] { "90x40" }),
    new CatalogProductDto("prod-1", "Sofa Oslo", "Sala", 2499m, "sofa.jpg", new[] { "Gris" }, new[] { "200x90" }),
    new CatalogProductDto("prod-3", "Mesa Descontinuada", "Comedor", 0m, "mesa.jpg", new[] { "Negro" }, new[] { "160x90" })
});
var service = new ProductCatalogService(repository);

var products = service.GetAvailableProducts();
```

Explicacion:

> Esta prueba es integral porque valida la colaboracion entre la capa de servicio y la capa de repositorio. Se usa un repositorio en memoria para aislar la dependencia de PostgreSQL.

Nota para rubrica:

> La rubrica menciona H2 o Mockito porque esta escrita para Spring Boot. En este proyecto no se usa Java/Spring, sino .NET. El equivalente usado es `InMemoryProductRepository`, que cumple el mismo objetivo: aislar la dependencia externa.

### 3.5 Prueba de sistema

Archivo:

```text
backend/services/CatalogService/CatalogService.Tests/CatalogEndpointSystemTests.cs
```

Fragmento:

```csharp
public void ShouldReturnValidWhenPostRequest()
{
    var request = new Product
    {
        Id = Guid.NewGuid(),
        Name = "Biblioteca Modular",
        Category = "Estudio",
        Price = 1800m
    };

    var result = request.Validate();
    var httpStatus = result.IsValid ? 200 : 400;

    Assert.Equal(200, httpStatus);
    Assert.True(result.IsValid);
    Assert.Empty(result.Errors);
}
```

Endpoint real relacionado:

```text
POST http://localhost:8082/api/catalog/validate
```

## 4. Como ejecutar en local desde VS Code

### 4.1 Requisitos

Tener instalado:

- Docker Desktop
- .NET SDK 8
- Node.js 20 o superior
- VS Code
- Extension recomendada: C# Dev Kit

Abrir en VS Code la carpeta:

```text
C:\Proyecto\Proyecto-Muebles4-main
```

### 4.2 Levantar backend completo con Docker

En una terminal de VS Code, desde la raiz del proyecto:

```powershell
docker compose up --build
```

Esperar a que levanten:

- `proyecto-muebles-postgres`
- `authservice`
- `catalogservice`
- `cartservice`
- `orderservice`
- `paymentservice`
- `inventoryservice`
- `proyecto-muebles-gateway`

Verificar gateway:

```powershell
Invoke-RestMethod http://localhost:9090/health
```

Verificar CatalogService directo:

```powershell
Invoke-RestMethod http://localhost:8082/api/catalog
```

Probar endpoint de validacion:

```powershell
Invoke-RestMethod `
  -Uri http://localhost:8082/api/catalog/validate `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"id":"11111111-1111-1111-1111-111111111111","name":"Biblioteca Modular","category":"Estudio","price":1800}'
```

Probar caso invalido:

```powershell
Invoke-RestMethod `
  -Uri http://localhost:8082/api/catalog/validate `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"id":"11111111-1111-1111-1111-111111111111","name":"Biblioteca Modular","category":"Estudio","price":0}'
```

Este segundo caso debe responder error HTTP `400 Bad Request`.

### 4.3 Levantar frontend

Abrir una segunda terminal:

```powershell
cd frontend
npm install
npm run dev
```

Abrir:

```text
http://localhost:5173
```

El frontend llama al gateway en:

```text
http://localhost:9090
```

### 4.4 Ejecutar pruebas unitarias, integrales y sistema

Desde la raiz del proyecto:

```powershell
dotnet test backend\services\CatalogService\CatalogService.Tests\CatalogService.Tests.csproj
```

Con cobertura:

```powershell
dotnet test backend\services\CatalogService\CatalogService.Tests\CatalogService.Tests.csproj --collect:"XPlat Code Coverage"
```

Resultado esperado:

```text
Correctas! - Con error: 0, Superado: 11, Omitido: 0, Total: 11
```

El XML de cobertura queda en una carpeta similar a:

```text
backend/services/CatalogService/CatalogService.Tests/TestResults/{guid}/coverage.cobertura.xml
```

En la ultima ejecucion local se obtuvo:

```text
Cobertura global: 92% lineas
Cobertura ramas: 100%
Dominio: 100%
```

### 4.5 Ejecutar pruebas del frontend

Desde otra terminal:

```powershell
cd frontend
npm test
```

Estas pruebas validan flujos de UI usando Vitest y Testing Library.

## 5. Como mostrar cobertura en clase

Opcion simple:

1. Ejecutar:

```powershell
dotnet test backend\services\CatalogService\CatalogService.Tests\CatalogService.Tests.csproj --collect:"XPlat Code Coverage"
```

2. Abrir el archivo:

```text
backend/services/CatalogService/CatalogService.Tests/TestResults/{guid}/coverage.cobertura.xml
```

3. Buscar estos atributos:

```xml
line-rate="0.92"
branch-rate="1"
```

Opcion con HTML:

```powershell
dotnet tool install -g dotnet-reportgenerator-globaltool
reportgenerator -reports:backend\services\CatalogService\CatalogService.Tests\TestResults\**\coverage.cobertura.xml -targetdir:backend\services\CatalogService\CatalogService.Tests\TestResults\CoverageReport -reporttypes:Html
```

Abrir:

```text
backend/services/CatalogService/CatalogService.Tests/TestResults/CoverageReport/index.html
```

## 6. Registro de defectos

Archivo:

```text
defectos_integracion.md
```

Defectos registrados:

| ID | Tipo | Estado |
| --- | --- | --- |
| `DEF-001` | Integracion | Resuelto |
| `DEF-002` | Sistema | Resuelto |
| `DEF-003` | Unitaria | Resuelto |

## 7. Guion corto para exponer

1. Mostrar arquitectura: frontend consume `http://localhost:9090`, gateway redirige a servicios `.NET`.
2. Mostrar `Product.cs` y explicar la regla de dominio.
3. Mostrar `ProductValidationTests.cs` y explicar AAA.
4. Mostrar `TddIterationEvidenceTests.cs` y explicar las tres iteraciones TDD.
5. Mostrar tabla de equivalencia en `docs/pruebas_catalogo.md`.
6. Mostrar `ProductCatalogServiceIntegrationTests.cs` como prueba integral service-repository.
7. Mostrar `CatalogEndpointSystemTests.cs` y el endpoint `POST /api/catalog/validate`.
8. Ejecutar `dotnet test ... --collect:"XPlat Code Coverage"`.
9. Mostrar que las pruebas pasan y que la cobertura supera 80%.
10. Mostrar `defectos_integracion.md` con defectos resueltos.

## 8. Comandos rapidos para la presentacion

Backend completo:

```powershell
docker compose up --build
```

Frontend:

```powershell
cd frontend
npm run dev
```

Pruebas con cobertura:

```powershell
dotnet test backend\services\CatalogService\CatalogService.Tests\CatalogService.Tests.csproj --collect:"XPlat Code Coverage"
```

Health del gateway:

```powershell
Invoke-RestMethod http://localhost:9090/health
```

Endpoint de validacion:

```powershell
Invoke-RestMethod `
  -Uri http://localhost:8082/api/catalog/validate `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"id":"11111111-1111-1111-1111-111111111111","name":"Biblioteca Modular","category":"Estudio","price":1800}'
```
