# U6 - Ejercicio 2: informe tecnico de validacion

## 1. Objetivo

Documentar el proceso de gestion de defectos y validacion final del Proyecto Muebles Modernos, priorizando hallazgos con base en impacto, probabilidad, urgencia y detectabilidad. El informe consolida los entregables solicitados en la guia: reporte de defectos, dashboard de metricas e informe tecnico de conclusiones.

## 2. Contexto del proyecto

El sistema es una tienda web de muebles modernos con:

- Frontend React/Vite.
- API Gateway Node/Express.
- Microservicios .NET 8: Auth, Catalog, Cart, Order, Payment e Inventory.
- PostgreSQL como base principal en Docker.
- Pruebas automatizadas con xUnit, Vitest y Testing Library.
- Reportes de evidencia en `reports/`.

El flujo funcional principal es:

```text
Frontend -> Gateway -> Auth/Catalog/Cart/Order/Payment/Inventory -> PostgreSQL -> Frontend
```

## 3. Evidencias revisadas

| Evidencia | Uso dentro de la validacion |
| --- | --- |
| `reports/test-summary-report.md` | Resultado consolidado de pruebas backend, frontend y checkout. |
| `reports/checkout-e2e-report.md` | Evidencia del flujo de compra simulado de extremo a extremo. |
| `docs/estrategia_pruebas_unitarias_integrales_e2e.md` | Estrategia de cobertura por nivel y servicio. |
| `docs/guia_validacion_pruebas_y_pipeline.md` | Guia para validar con servicios reales y pipeline. |
| `defectos_integracion.md` | Registro inicial de defectos de integracion. |
| `backend/services/CartService/CartService.Api/Program.cs` | Evidencia de ajuste en autorizacion/carga de carrito. |

## 4. Hallazgos principales

| Hallazgo | Interpretacion |
| --- | --- |
| Las pruebas automaticas actuales pasan: backend `11/11`, frontend `8/8`, checkout `1/1`. | La base del proyecto esta estable para sustentacion. |
| CatalogService tiene la mejor cobertura del backend. | Sirve como patron para extender pruebas a otros servicios. |
| El checkout E2E automatico es simulado. | Es util para regresion rapida, pero no prueba integracion real completa. |
| El procedimiento de E2E real esta documentado. | Hay ruta de validacion con Docker, pero falta automatizacion completa. |
| Los defectos tienen trazabilidad hacia archivos y reportes. | El ciclo de vida del defecto queda documentado tecnicamente. |

## 5. Analisis de defectos

Se gestionaron seis defectos:

| Estado | Cantidad | Defectos |
| --- | ---: | --- |
| Resuelto | 4 | DEF-001, DEF-002, DEF-003, DEF-005 |
| Mitigado | 1 | DEF-004 |
| Abierto | 1 | DEF-006 |

Los defectos mas importantes son:

| ID | Prioridad | Motivo |
| --- | --- | --- |
| DEF-004 | P1 - Critica | Sin E2E real automatizado, la integracion completa depende de validacion manual. |
| DEF-006 | P1 - Critica | La cobertura backend no esta distribuida de forma uniforme entre microservicios. |

## 6. Validacion realizada

| Nivel | Resultado | Comentario |
| --- | --- | --- |
| Unitario | OK en CatalogService | Se validan reglas de producto como nombre y precio. |
| Integral | OK en CatalogService | Se prueba colaboracion entre servicio de aplicacion y repositorio. |
| Sistema/API | OK en CatalogService | Se valida contrato de endpoint de producto valido/invalido. |
| Frontend | OK | Se validan roles, carrito, ordenes, pagos, usuarios e inventario con mocks. |
| E2E simulado | OK | Se valida compra completa con factura, sin servicios reales. |
| E2E real | Documentado | Debe ejecutarse con Docker y `?e2eCapture=1`; pendiente automatizar. |

## 7. Priorizacion de entregables

| Prioridad | Entregable | Estado | Justificacion |
| --- | --- | --- | --- |
| 1 | Reporte de defectos priorizados con trazabilidad | Completado | Es el insumo central del ciclo de vida del defecto. |
| 2 | Dashboard de metricas de calidad | Completado | Permite justificar decisiones con datos. |
| 3 | Informe tecnico de validacion | Completado | Comunica hallazgos, cierre y riesgos residuales. |

## 8. Riesgos residuales

| Riesgo | Nivel | Mitigacion recomendada |
| --- | --- | --- |
| Regresiones en servicios sin pruebas propias. | Alto | Crear suites unitarias/integrales por microservicio. |
| Integracion real no automatizada. | Alto | Implementar Playwright con Docker Compose. |
| Diferencia entre mocks y comportamiento real del backend. | Medio | Ejecutar capturas reales y compararlas contra contratos esperados. |
| Validaciones de autorizacion incompletas. | Medio | Agregar pruebas para admin, propietario e invitado. |

## 9. Conclusiones

El proyecto cumple con los entregables academicos de la unidad porque documenta defectos, los prioriza con criterios tecnicos, relaciona evidencias y sintetiza resultados de validacion. La calidad actual es suficiente para presentacion y sustentacion, especialmente por la existencia de reportes automaticos y flujo E2E simulado.

La principal oportunidad de mejora es convertir la validacion real con Docker en una prueba automatizada de navegador. La segunda mejora es extender el modelo de pruebas de CatalogService a CartService, OrderService, PaymentService, InventoryService y AuthService.

## 10. Recomendaciones finales

1. Cerrar DEF-004 implementando Playwright contra `http://localhost:5173?e2eCapture=1`.
2. Cerrar DEF-006 agregando pruebas por servicio, empezando por CartService, OrderService y PaymentService.
3. Mantener `reports/test-summary-report.md` como evidencia principal de ejecucion.
4. Usar los IDs `DEF-*` en issues, commits o bitacora para conservar trazabilidad.
