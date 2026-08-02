# U6 - Ejercicio 2: dashboard de metricas de calidad

Proyecto: Proyecto Muebles Modernos  
Fuente principal: `reports/test-summary-report.md`, `reports/checkout-e2e-report.md` y matriz de defectos priorizados.

## 1. Resumen ejecutivo del dashboard

| Indicador | Resultado | Estado | Lectura |
| --- | ---: | --- | --- |
| Pruebas backend CatalogService | 11/11 | Verde | Suite estable para dominio, integracion y sistema en catalogo. |
| Pruebas frontend | 8/8 | Verde | UI y flujos principales pasan con mocks controlados. |
| Checkout E2E simulado | 1/1 | Verde | Flujo login -> catalogo -> carrito -> orden -> pago -> factura validado en UI. |
| Defectos totales gestionados | 6 | Amarillo | Hay defectos documentados, pero aun existen P1 abiertos/mitigados. |
| Defectos cerrados | 4/6 | Amarillo | 66.7% cerrados; los restantes impactan validacion real y cobertura. |
| Defectos P1 | 2 | Rojo | Requieren atencion antes de una entrega productiva. |
| Servicios con pruebas backend completas | 1/6 | Rojo | CatalogService esta bien cubierto; faltan suites equivalentes en otros servicios. |

## 2. Distribucion de defectos por prioridad

| Prioridad | Cantidad | Porcentaje | Defectos |
| --- | ---: | ---: | --- |
| P1 - Critica | 2 | 33.3% | DEF-004, DEF-006 |
| P2 - Alta | 2 | 33.3% | DEF-005, DEF-001 |
| P3 - Media | 2 | 33.3% | DEF-002, DEF-003 |
| P4 - Baja | 0 | 0% | Ninguno |

## 3. Distribucion por estado

| Estado | Cantidad | Porcentaje | Interpretacion |
| --- | ---: | ---: | --- |
| Resuelto | 4 | 66.7% | Hay evidencia o ajuste aplicado. |
| Mitigado | 1 | 16.7% | Existe evidencia parcial, pero falta automatizacion real. |
| Abierto | 1 | 16.7% | Requiere implementacion de pruebas adicionales. |

## 4. Metricas de pruebas

| Capa | Evidencia | Resultado | Riesgo residual |
| --- | --- | ---: | --- |
| Backend CatalogService | `reports/backend-test-results/catalog-tests.trx` | 11/11 | Bajo para catalogo; medio para integracion HTTP real. |
| Frontend React | Vitest + Testing Library | 8/8 | Medio porque usa mocks para servicios. |
| Checkout E2E | `reports/checkout-e2e-report.md` | 1/1 | Medio-alto porque no reemplaza E2E real con Docker. |
| E2E real manual | `docs/guia_validacion_pruebas_y_pipeline.md` | Procedimiento documentado | Medio; depende de ejecucion manual. |

## 5. Semaforo de calidad por componente

| Componente | Calidad actual | Evidencia | Accion prioritaria |
| --- | --- | --- | --- |
| CatalogService | Verde | Unitarias, integrales y sistema implementadas. | Mantener suite y sumar pruebas HTTP reales si se requiere. |
| Frontend | Verde/Amarillo | 8 pruebas pasan y E2E simulado OK. | Conectar Playwright a servicios reales. |
| CartService | Amarillo | Ajuste de autorizacion en `Program.cs`. | Agregar pruebas de propietario/admin e invitado. |
| OrderService | Amarillo | Flujo cubierto por E2E simulado. | Agregar pruebas de calculo y contrato HTTP. |
| PaymentService | Amarillo | Factura validada en E2E simulado. | Agregar pruebas de impuesto, total y PDF. |
| InventoryService | Amarillo | UI admin cubierta por frontend. | Agregar pruebas de CRUD y validaciones. |
| AuthService | Amarillo | Login cubierto por frontend. | Agregar pruebas de registro, login, roles y usuarios. |
| Gateway Node | Amarillo | Flujo consume rutas `/api/*`. | Agregar pruebas de proxy, headers y errores 502. |

## 6. Analisis de tendencias y decisiones

| Hallazgo | Decision |
| --- | --- |
| La mayor calidad comprobada esta en CatalogService. | Usar ese servicio como plantilla para pruebas de los demas microservicios. |
| El flujo de compra esta validado en UI, pero con mocks. | Mantenerlo como prueba rapida y sumar E2E real automatizado para integracion. |
| Los P1 no rompen la demo actual, pero reducen confianza de entrega real. | Priorizarlos antes de considerar el proyecto listo para produccion. |
| Hay trazabilidad entre defectos, archivos y reportes. | Mantener IDs `DEF-*` en commits, issues o futuras evidencias. |

## 7. Acciones recomendadas por prioridad

| Orden | Accion | Defecto relacionado | Resultado esperado |
| ---: | --- | --- | --- |
| 1 | Automatizar Playwright contra Docker Compose. | DEF-004 | E2E real repetible desde navegador hasta factura. |
| 2 | Crear pruebas unitarias/integrales para Cart, Order, Payment, Inventory y Auth. | DEF-006 | Menor riesgo de regresion por servicio. |
| 3 | Agregar pruebas especificas de autorizacion de carrito. | DEF-005 | Validar admin, propietario e invitado. |
| 4 | Mantener dashboard y reporte de pruebas actualizado. | Todos | Evidencia clara para entrega y sustentacion. |

## 8. Indicadores finales para entrega

| Indicador | Meta minima | Resultado actual | Cumple |
| --- | ---: | ---: | --- |
| Pruebas automaticas sin fallos | 100% | 20/20 | Si |
| Defectos con trazabilidad | 100% | 6/6 | Si |
| Defectos P1 cerrados | 100% | 0/2 cerrados | No |
| Informe tecnico disponible | 100% | Documentado | Si |
| Dashboard de metricas disponible | 100% | Documentado | Si |

Conclusion del dashboard: el proyecto esta bien preparado para sustentacion academica, con evidencias claras y pruebas automaticas verdes. Para una entrega mas robusta, la prioridad tecnica es cerrar DEF-004 y DEF-006.
