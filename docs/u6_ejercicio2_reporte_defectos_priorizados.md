# U6 - Ejercicio 2: reporte de defectos priorizados

Proyecto: Proyecto Muebles Modernos  
Fecha de referencia: 2026-06-19  
Alcance: frontend React, gateway Node, microservicios .NET y evidencias en `reports/`.

## 1. Criterio de priorizacion

La prioridad se calcula con una escala de 1 a 5:

| Criterio | Descripcion |
| --- | --- |
| Impacto | Afectacion al negocio, usuario o integridad del flujo de compra. |
| Probabilidad | Frecuencia esperada segun el uso normal del sistema. |
| Urgencia | Necesidad de corregir antes de entregar o demostrar el proyecto. |
| Detectabilidad | 5 significa dificil de detectar tarde; 1 significa facil de detectar temprano. |

Formula usada:

```text
Puntaje = Impacto + Probabilidad + Urgencia + Detectabilidad
```

| Puntaje | Prioridad |
| --- | --- |
| 17 a 20 | P1 - Critica |
| 13 a 16 | P2 - Alta |
| 9 a 12 | P3 - Media |
| 4 a 8 | P4 - Baja |

## 2. Matriz priorizada de defectos

| ID | Defecto | Tipo | Severidad | Estado | Impacto | Prob. | Urg. | Detect. | Puntaje | Prioridad | Trazabilidad |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| DEF-004 | El E2E automatico de checkout valida el flujo con mocks, pero no confirma servicios reales, gateway ni PostgreSQL. | Validacion / integracion | Alta | Mitigado | 5 | 4 | 5 | 4 | 18 | P1 - Critica | `frontend/src/App.e2e.test.tsx`, `docs/guia_validacion_pruebas_y_pipeline.md`, `reports/checkout-e2e-report.md` |
| DEF-006 | La cobertura automatica fuerte esta concentrada en CatalogService; CartService, OrderService, PaymentService, InventoryService y AuthService no tienen el mismo nivel de pruebas unitarias/integrales. | Cobertura de pruebas | Alta | Abierto | 5 | 4 | 4 | 4 | 17 | P1 - Critica | `docs/estrategia_pruebas_unitarias_integrales_e2e.md`, `backend/services/*/Program.cs` |
| DEF-005 | La consulta de carrito de otro usuario podia bloquear la carga del frontend con 403; se ajusto para devolver carrito vacio cuando no corresponde al usuario. | Autorizacion / UX | Media | Resuelto | 4 | 4 | 4 | 3 | 15 | P2 - Alta | `backend/services/CartService/CartService.Api/Program.cs` |
| DEF-001 | CatalogService dependia directamente de PostgreSQL en `Program.cs`, dificultando pruebas por capas. | Arquitectura / integracion | Media | Resuelto | 4 | 3 | 4 | 3 | 14 | P2 - Alta | `backend/services/CatalogService/CatalogService.Application`, `CatalogDbProductRepository.cs`, `ProductCatalogServiceIntegrationTests.cs` |
| DEF-002 | No existia endpoint controlado para validar respuestas JSON sin tocar base real. | Sistema/API | Media | Resuelto | 3 | 3 | 3 | 3 | 12 | P3 - Media | `POST /api/catalog/validate`, `CatalogEndpointSystemTests.cs` |
| DEF-003 | La entidad `Product` no tenia reglas de dominio ejecutables para nombre y precio. | Dominio / unitario | Media | Resuelto | 3 | 3 | 3 | 2 | 11 | P3 - Media | `Product.cs`, `ProductValidationTests.cs`, `TddIterationEvidenceTests.cs` |

## 3. Ciclo de vida por defecto

| ID | Identificacion | Clasificacion | Seguimiento y validacion | Cierre |
| --- | --- | --- | --- | --- |
| DEF-004 | Detectado al comparar el E2E simulado contra el flujo real esperado frontend -> gateway -> microservicios. | Defecto de validacion, severidad alta. | Existe reporte E2E simulado y captura manual real con `?e2eCapture=1`; falta automatizar Playwright contra Docker. | Mitigado; cierre total cuando exista prueba E2E real automatica. |
| DEF-006 | Detectado en la matriz de pruebas: solo CatalogService tiene suite backend completa. | Defecto de cobertura, severidad alta. | Se documento estrategia para agregar reglas puras y pruebas integrales por servicio. | Abierto; requiere implementar suites por servicio. |
| DEF-005 | Detectado en CartService por control de acceso que podia afectar carga del frontend. | Defecto funcional/UX, severidad media. | Se valida en `Program.cs`: si no es admin ni propietario, retorna carrito vacio. | Resuelto; falta prueba automatica especifica. |
| DEF-001 | Detectado al intentar probar catalogo sin depender de base real. | Defecto de arquitectura, severidad media. | Se separaron repositorio, servicio de aplicacion y repositorio en memoria para tests. | Resuelto con pruebas integrales. |
| DEF-002 | Detectado por falta de contrato controlado para validar JSON. | Defecto de sistema/API, severidad media. | Se agrego endpoint de validacion y pruebas de respuesta valida/invalida. | Resuelto con pruebas de sistema. |
| DEF-003 | Detectado porque el dominio aceptaba datos invalidos sin regla ejecutable. | Defecto unitario/dominio, severidad media. | Se agrego `Product.Validate()` con clases de equivalencia y valores limite. | Resuelto con pruebas unitarias y evidencia TDD. |

## 4. Priorizacion de entregables

| Prioridad | Entregable | Justificacion | Archivo |
| --- | --- | --- | --- |
| 1 | Reporte de defectos priorizados con trazabilidad | Es la base del ejercicio y demuestra identificacion, clasificacion, seguimiento y cierre. | `docs/u6_ejercicio2_reporte_defectos_priorizados.md` |
| 2 | Dashboard de metricas de calidad | Convierte los defectos y pruebas en indicadores medibles para sustentar la priorizacion. | `docs/u6_ejercicio2_dashboard_metricas.md` |
| 3 | Informe tecnico de validacion | Sintetiza hallazgos, conclusiones y recomendaciones para cierre academico/profesional. | `docs/u6_ejercicio2_informe_tecnico_validacion.md` |

## 5. Criterio de cierre final

El proyecto se considera listo para entrega de la unidad cuando:

- Los defectos P1 tienen plan de mitigacion documentado.
- Los defectos resueltos tienen evidencia de prueba o archivo relacionado.
- `reports/test-summary-report.md` reporta backend `11/11`, frontend `8/8` y checkout E2E `1/1`.
- El informe tecnico explica la diferencia entre E2E simulado y validacion real con Docker.
