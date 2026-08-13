# Reporte E2E de compra

Fecha de ejecucion: 2026-08-05T01:50:03.567Z

## Datos de compra

- Datos generados durante la ejecucion del test, sin depender de registros quemados.
- Cliente: Cliente compra ab77ce68
- Correo: cliente.ab77ce68@muebles.test
- Producto: Producto compra 48e7ca7c
- Precio unitario: $1800.00
- Orden: b36fccde-81da-44f2-95ca-889c4f53f5a3
- Pago: ee55921f-a042-47b8-b639-0669550de261
- Factura: FAC-E2E-ee55921f
- Total pagado: $2088.00

## Flujo validado

- Se inicio sesion como cliente autenticado.
- Se cargo el catalogo de productos.
- Se agrego un producto al carrito.
- Se creo la orden de compra.
- Se autorizo el pago.
- Se genero una factura visible para el cliente.

## Endpoints verificados

- Login: /api/auth/login
- Catalogo: /api/catalog
- Carrito: /api/cart/items
- Orden: /api/orders
- Pago: /api/payments/authorize

## Tests/validaciones realizadas

- La aplicacion muestra el producto cargado desde catalogo.
- El login cambia el rol visible a Customer.
- El carrito confirma que el producto fue agregado.
- La compra muestra mensaje de pago realizado.
- La factura generada contiene prefijo FAC-E2E.
- El estado interno del flujo registra 1 orden y 1 pago.
- Se verifico que las llamadas principales del checkout fueron ejecutadas.
