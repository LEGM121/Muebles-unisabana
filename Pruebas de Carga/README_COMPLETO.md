# 🧪 Pruebas de Carga - Compumuebles Sabana

## 📋 Descripción

Este repositorio contiene la ejecución, análisis y resultados de las pruebas de carga realizadas sobre la plataforma **Compumuebles Sabana**, utilizando **Apache JMeter 5.6.3**. El objetivo principal fue evaluar el comportamiento de la aplicación bajo diferentes niveles de concurrencia, identificando puntos de saturación, tiempos de respuesta, estabilidad de los servicios y capacidad de procesamiento.

Las pruebas se enfocaron en dos flujos críticos del negocio:

- Selección de productos.
- Flujo completo de compra y pago.

---

# 🎯 Objetivos

- Evaluar el rendimiento de la aplicación bajo carga concurrente.
- Medir tiempos de respuesta y throughput.
- Identificar cuellos de botella.
- Determinar la estabilidad de los servicios críticos.
- Detectar errores de infraestructura y aplicación bajo estrés.

---

# 🛠 Herramientas Utilizadas

| Herramienta | Versión |
|------------|----------|
| Apache JMeter | 5.6.3 |
| Java | 1.8 |
| Navegador | Google Chrome |
| Backend | Node.js / Express |
| Infraestructura | Nginx |

---

# 📊 Escenario 1: Selección de Productos

## Descripción

Esta prueba simuló el comportamiento de usuarios autenticados navegando por el catálogo y agregando productos al carrito de compras.

### Flujo evaluado

```text
Ingreso Usuario
        ↓
Seleccionar Escritorio
        ↓
Seleccionar Mesa
        ↓
Seleccionar Modular Neo
        ↓
Seleccionar Sofá
```

## Resultados Generales

| Métrica | Resultado |
|----------|------------|
| Usuarios Concurrentes | 1000 |
| Solicitudes Totales | 5000 |
| Solicitudes Fallidas | 0 |
| Tasa de Error | 0.00% |
| Throughput | 37.49 req/s |
| Tiempo Promedio | 262.29 ms |
| Tiempo Máximo | 6078 ms |
| APDEX General | 0.939 |

## Resultados por Servicio

| Servicio | Muestras | Error % | Promedio (ms) | APDEX | Estado |
|-----------|-----------|-----------|-----------|-----------|-----------|
| Ingreso Usuario | 1000 | 0.00% | 546.61 | 0.735 | 🟡 Aceptable |
| Seleccionar Escritorio | 1000 | 0.00% | 163.93 | 0.996 | 🟢 Excelente |
| Seleccionar Mesa | 1000 | 0.00% | 172.58 | 0.994 | 🟢 Excelente |
| Seleccionar Neo | 1000 | 0.00% | 168.48 | 0.995 | 🟢 Excelente |
| Seleccionar Sofá | 1000 | 0.00% | 259.86 | 0.974 | 🟢 Excelente |

## Análisis

La prueba procesó satisfactoriamente 5.000 solicitudes sin registrar errores funcionales ni problemas de infraestructura. El sistema mantuvo tiempos de respuesta inferiores a 300 ms para la mayoría de los servicios y alcanzó un APDEX de 0.939, indicando una experiencia de usuario satisfactoria.

El módulo de catálogo demostró una alta capacidad de procesamiento concurrente, siendo uno de los componentes más estables de la aplicación.

---

# 💳 Escenario 2: Flujo Completo de Pago

## Descripción

Esta prueba evaluó el proceso completo de compra desde la autenticación hasta la autorización del pago.

### Flujo evaluado

```text
Ingreso Usuario
        ↓
Seleccionar Producto
        ↓
Crear Orden
        ↓
Autorizar Pago
        ↓
Vaciar Carrito
        ↓
Consultar Órdenes
        ↓
Consultar Pagos
```

## Resultados Generales

| Métrica | Resultado |
|----------|------------|
| Usuarios Concurrentes | 500 |
| Solicitudes Totales | 1129 |
| Solicitudes Fallidas | 468 |
| Tasa de Error | 41.45% |
| Throughput | 21.65 req/s |
| Tiempo Promedio | 7331 ms |
| Tiempo Máximo | 22239 ms |
| APDEX General | 0.223 |

## Resultados por Servicio

| Servicio | Muestras | Error % | Promedio (ms) | Estado |
|-----------|-----------|-----------|-----------|-----------|
| Ingreso Usuario | 500 | 49.20% | 11764 | 🔴 Crítico |
| Seleccionar Mesa | 150 | 78.00% | 5162 | 🔴 Crítico |
| Seleccionar Sofá | 254 | 40.94% | 3919 | 🟠 Alto |
| Seleccionar Neo | 33 | 3.03% | 222 | 🟢 Estable |
| Crear Orden | 32 | 0.00% | 212 | 🟢 Estable |
| Autorizar Pago | 32 | 0.00% | 273 | 🟢 Estable |
| Vaciar Carrito | 32 | 0.00% | 201 | 🟢 Estable |
| Consultar Órdenes | 32 | 0.00% | 10717 | 🟠 Lento |
| Consultar Pagos | 32 | 0.00% | 7693 | 🟠 Lento |

## Distribución de Errores

| Error | Cantidad | Porcentaje |
|---------|-----------|------------|
| HTTP 500 Internal Server Error | 242 | 51.71% |
| NoHttpResponseException | 181 | 38.68% |
| SSLHandshakeException | 45 | 9.62% |

## Análisis

El sistema mostró degradación significativa al ejecutar el flujo completo de compra. Aunque los servicios transaccionales más importantes mantuvieron un comportamiento estable, la autenticación y la selección de productos presentaron altos porcentajes de error y tiempos de respuesta excesivos.

Se observó saturación del backend, agotamiento de conexiones y fallos de comunicación HTTPS cuando la concurrencia alcanzó los 500 usuarios.

---

# 📈 Comparación de Escenarios

| Métrica | Selección de Productos | Flujo de Pago |
|----------|----------------------|---------------|
| Usuarios | 1000 | 500 |
| Solicitudes | 5000 | 1129 |
| Error Rate | 0.00% | 41.45% |
| Tiempo Promedio | 262 ms | 7331 ms |
| Throughput | 37.49 req/s | 21.65 req/s |
| APDEX | 0.939 | 0.223 |

---

# 🔍 Hallazgos Principales

## Fortalezas

✅ El catálogo de productos soporta correctamente 1000 usuarios concurrentes.

✅ El proceso de creación de órdenes mantiene tiempos inferiores a 250 ms.

✅ La autorización de pagos presenta una tasa de éxito del 100%.

✅ El vaciado de carrito se ejecuta correctamente incluso bajo carga.

## Debilidades

⚠️ El servicio de autenticación es el principal cuello de botella.

⚠️ Los endpoints de selección de algunos productos presentan errores HTTP 500 bajo alta concurrencia.

⚠️ Se identificaron fallos de infraestructura relacionados con conexiones HTTPS.

⚠️ El tiempo de respuesta de consultas posteriores al pago supera los 7 segundos.

---

# 🚀 Recomendaciones

## Corto Plazo

- Optimizar el servicio de autenticación.
- Revisar la gestión de sesiones y conexiones concurrentes.
- Ajustar timeouts del backend.
- Analizar los errores HTTP 500 en el módulo de catálogo.

## Mediano Plazo

- Implementar balanceo de carga.
- Optimizar consultas a base de datos.
- Incorporar mecanismos de caché para consultas frecuentes.

## Largo Plazo

- Implementar monitoreo continuo mediante métricas APM.
- Realizar pruebas de estrés y resistencia periódicas.
- Diseñar estrategias de escalabilidad horizontal.

---

# 📌 Conclusión

Los resultados obtenidos evidencian que **Compumuebles Sabana posee una arquitectura estable para la navegación y selección de productos**, siendo capaz de soportar 1000 usuarios concurrentes sin errores ni degradación significativa.

Sin embargo, el **flujo completo de compra y pago presenta limitaciones importantes cuando la concurrencia alcanza los 500 usuarios**, especialmente en los procesos de autenticación y consulta de información. Aunque los servicios críticos del negocio mantienen un comportamiento estable, la infraestructura actual requiere optimizaciones para garantizar una experiencia consistente bajo escenarios de alta demanda.
