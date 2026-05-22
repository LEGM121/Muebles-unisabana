using Npgsql;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("PaymentDb")
    ?? builder.Configuration["DATABASE_URL"]
    ?? "Host=localhost;Port=5432;Database=muebles_db;Username=postgres;Password=postgres";

builder.Services.AddSingleton(new PaymentDb(connectionString));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PaymentDb>();
    db.Initialize();
    db.Seed();
}

app.MapGet("/health", () => Results.Ok(new { service = "PaymentService", database = "PostgreSQL" }));
app.MapGet("/api/payments", (PaymentDb db) => Results.Ok(db.GetPayments()));
app.MapGet("/api/payments/{paymentId:guid}", (Guid paymentId, PaymentDb db) =>
{
    var payment = db.GetPayment(paymentId);
    return payment is null ? Results.NotFound() : Results.Ok(payment);
});

app.MapGet("/api/payments/{paymentId:guid}/invoice/pdf", (Guid paymentId, PaymentDb db) =>
{
    var invoice = db.GetInvoice(paymentId);
    if (invoice is null)
    {
        return Results.NotFound();
    }

    var pdf = InvoicePdfBuilder.Generate(invoice);
    return Results.File(pdf, "application/pdf", $"factura-{invoice.InvoiceNumber}.pdf");
});

app.MapPost("/api/payments/authorize", (AuthorizePaymentRequest request, PaymentDb db) =>
{
    if (request.OrderId == Guid.Empty || string.IsNullOrWhiteSpace(request.CustomerName) || string.IsNullOrWhiteSpace(request.CustomerEmail) || request.Items.Count == 0)
    {
        return Results.BadRequest(new { message = "orderId, customerName, customerEmail e items son obligatorios" });
    }

    var result = db.AuthorizePayment(request);
    return Results.Ok(result);
});

app.MapPut("/api/payments/{paymentId:guid}", (Guid paymentId, UpdatePaymentRequest request, PaymentDb db) =>
{
    var payment = db.UpdatePayment(paymentId, request);
    return payment is null ? Results.NotFound() : Results.Ok(payment);
});

app.MapDelete("/api/payments/{paymentId:guid}", (Guid paymentId, PaymentDb db) =>
{
    var deleted = db.DeletePayment(paymentId);
    return deleted ? Results.Ok(new { message = "Pago eliminado" }) : Results.NotFound();
});

app.Run();

record AuthorizePaymentRequest(Guid OrderId, string CustomerId, string CustomerName, string CustomerEmail, string PaymentMethod, List<PaymentItemRequest> Items);
record PaymentItemRequest(Guid ProductId, string ProductName, int Quantity, decimal UnitPrice);
record UpdatePaymentRequest(string Status, string PaymentMethod);
record PaymentResponse(Guid PaymentId, Guid OrderId, string CustomerId, string CustomerName, string CustomerEmail, string PaymentMethod, string Status, decimal Subtotal, decimal Tax, decimal Total, DateTime CreatedAt, InvoiceResponse Invoice);
record InvoiceResponse(Guid InvoiceId, string InvoiceNumber, DateTime IssuedAt, decimal Subtotal, decimal Tax, decimal Total, List<InvoiceItemResponse> Items);
record InvoiceItemResponse(string ProductName, int Quantity, decimal UnitPrice, decimal Subtotal);

sealed class PaymentDb
{
    private readonly string _connectionString;

    public PaymentDb(string connectionString)
    {
        _connectionString = connectionString;
    }

    public void Initialize()
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            CREATE TABLE IF NOT EXISTS payments (
                payment_id UUID PRIMARY KEY,
                order_id UUID NOT NULL,
                customer_id TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                customer_email TEXT NOT NULL,
                payment_method TEXT NOT NULL,
                status TEXT NOT NULL,
                subtotal NUMERIC(18,2) NOT NULL,
                tax NUMERIC(18,2) NOT NULL,
                total NUMERIC(18,2) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS invoices (
                invoice_id UUID PRIMARY KEY,
                payment_id UUID NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
                invoice_number TEXT NOT NULL UNIQUE,
                issued_at TIMESTAMPTZ NOT NULL,
                subtotal NUMERIC(18,2) NOT NULL,
                tax NUMERIC(18,2) NOT NULL,
                total NUMERIC(18,2) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS invoice_items (
                invoice_item_id UUID PRIMARY KEY,
                invoice_id UUID NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
                product_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price NUMERIC(18,2) NOT NULL,
                subtotal NUMERIC(18,2) NOT NULL
            );
        ";
        command.ExecuteNonQuery();
    }

    public void Seed()
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        using var countCommand = connection.CreateCommand();
        countCommand.CommandText = "SELECT COUNT(*) FROM payments;";
        var count = Convert.ToInt32(countCommand.ExecuteScalar());
        if (count > 0)
        {
            return;
        }

        AuthorizePayment(new AuthorizePaymentRequest(
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            "cliente-demo-001",
            "Cliente Demo Uno",
            "cliente1@muebles.com",
            "Tarjeta",
            new List<PaymentItemRequest>
            {
                new(Guid.Parse("11111111-1111-1111-1111-111111111111"), "Sofá Nórdico Oslo", 1, 2499m),
                new(Guid.Parse("22222222-2222-2222-2222-222222222222"), "Mesa Comedor Luna", 1, 1899m)
            }));
    }

    public List<PaymentResponse> GetPayments()
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT payment_id, order_id, customer_id, customer_name, customer_email, payment_method, status, subtotal, tax, total, created_at
            FROM payments
            ORDER BY created_at DESC;
        ";

        using var reader = command.ExecuteReader();
        var payments = new List<PaymentResponse>();
        while (reader.Read())
        {
            var paymentId = reader.GetGuid(0);
            payments.Add(new PaymentResponse(
                paymentId,
                reader.GetGuid(1),
                reader.GetString(2),
                reader.GetString(3),
                reader.GetString(4),
                reader.GetString(5),
                reader.GetString(6),
                reader.GetDecimal(7),
                reader.GetDecimal(8),
                reader.GetDecimal(9),
                reader.GetDateTime(10),
                GetInvoice(paymentId)!));
        }

        return payments;
    }

    public PaymentResponse? GetPayment(Guid paymentId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT payment_id, order_id, customer_id, customer_name, customer_email, payment_method, status, subtotal, tax, total, created_at
            FROM payments
            WHERE payment_id = @paymentId;
        ";
        command.Parameters.AddWithValue("paymentId", paymentId);

        using var reader = command.ExecuteReader();
        if (!reader.Read())
        {
            return null;
        }

        return new PaymentResponse(
            reader.GetGuid(0),
            reader.GetGuid(1),
            reader.GetString(2),
            reader.GetString(3),
            reader.GetString(4),
            reader.GetString(5),
            reader.GetString(6),
            reader.GetDecimal(7),
            reader.GetDecimal(8),
            reader.GetDecimal(9),
            reader.GetDateTime(10),
            GetInvoice(paymentId)!);
    }

    public PaymentResponse AuthorizePayment(AuthorizePaymentRequest request)
    {
        var subtotal = request.Items.Sum(item => item.Quantity * item.UnitPrice);
        var tax = Math.Round(subtotal * 0.16m, 2, MidpointRounding.AwayFromZero);
        var total = subtotal + tax;
        var paymentId = Guid.NewGuid();
        var invoiceId = Guid.NewGuid();
        var issuedAt = DateTime.UtcNow;
        var invoiceNumber = $"FAC-{issuedAt:yyyyMMdd}-{paymentId.ToString()[..8].ToUpperInvariant()}";

        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();
        using var transaction = connection.BeginTransaction();

        using (var paymentCommand = connection.CreateCommand())
        {
            paymentCommand.Transaction = transaction;
            paymentCommand.CommandText = @"
                INSERT INTO payments (payment_id, order_id, customer_id, customer_name, customer_email, payment_method, status, subtotal, tax, total, created_at, updated_at)
                VALUES (@paymentId, @orderId, @customerId, @customerName, @customerEmail, @paymentMethod, @status, @subtotal, @tax, @total, NOW(), NOW());
            ";
            paymentCommand.Parameters.AddWithValue("paymentId", paymentId);
            paymentCommand.Parameters.AddWithValue("orderId", request.OrderId);
            paymentCommand.Parameters.AddWithValue("customerId", request.CustomerId.Trim());
            paymentCommand.Parameters.AddWithValue("customerName", request.CustomerName.Trim());
            paymentCommand.Parameters.AddWithValue("customerEmail", request.CustomerEmail.Trim());
            paymentCommand.Parameters.AddWithValue("paymentMethod", request.PaymentMethod.Trim());
            paymentCommand.Parameters.AddWithValue("status", "Authorized");
            paymentCommand.Parameters.AddWithValue("subtotal", subtotal);
            paymentCommand.Parameters.AddWithValue("tax", tax);
            paymentCommand.Parameters.AddWithValue("total", total);
            paymentCommand.ExecuteNonQuery();
        }

        using (var invoiceCommand = connection.CreateCommand())
        {
            invoiceCommand.Transaction = transaction;
            invoiceCommand.CommandText = @"
                INSERT INTO invoices (invoice_id, payment_id, invoice_number, issued_at, subtotal, tax, total)
                VALUES (@invoiceId, @paymentId, @invoiceNumber, @issuedAt, @subtotal, @tax, @total);
            ";
            invoiceCommand.Parameters.AddWithValue("invoiceId", invoiceId);
            invoiceCommand.Parameters.AddWithValue("paymentId", paymentId);
            invoiceCommand.Parameters.AddWithValue("invoiceNumber", invoiceNumber);
            invoiceCommand.Parameters.AddWithValue("issuedAt", issuedAt);
            invoiceCommand.Parameters.AddWithValue("subtotal", subtotal);
            invoiceCommand.Parameters.AddWithValue("tax", tax);
            invoiceCommand.Parameters.AddWithValue("total", total);
            invoiceCommand.ExecuteNonQuery();
        }

        foreach (var item in request.Items)
        {
            using var itemCommand = connection.CreateCommand();
            itemCommand.Transaction = transaction;
            itemCommand.CommandText = @"
                INSERT INTO invoice_items (invoice_item_id, invoice_id, product_name, quantity, unit_price, subtotal)
                VALUES (@id, @invoiceId, @productName, @quantity, @unitPrice, @subtotal);
            ";
            itemCommand.Parameters.AddWithValue("id", Guid.NewGuid());
            itemCommand.Parameters.AddWithValue("invoiceId", invoiceId);
            itemCommand.Parameters.AddWithValue("productName", item.ProductName.Trim());
            itemCommand.Parameters.AddWithValue("quantity", item.Quantity);
            itemCommand.Parameters.AddWithValue("unitPrice", item.UnitPrice);
            itemCommand.Parameters.AddWithValue("subtotal", item.Quantity * item.UnitPrice);
            itemCommand.ExecuteNonQuery();
        }

        transaction.Commit();
        return GetPayment(paymentId)!;
    }

    public PaymentResponse? UpdatePayment(Guid paymentId, UpdatePaymentRequest request)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            UPDATE payments
            SET status = @status,
                payment_method = @paymentMethod,
                updated_at = NOW()
            WHERE payment_id = @paymentId;
        ";
        command.Parameters.AddWithValue("paymentId", paymentId);
        command.Parameters.AddWithValue("status", request.Status.Trim());
        command.Parameters.AddWithValue("paymentMethod", request.PaymentMethod.Trim());

        var rows = command.ExecuteNonQuery();
        return rows == 0 ? null : GetPayment(paymentId);
    }

    public bool DeletePayment(Guid paymentId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM payments WHERE payment_id = @paymentId;";
        command.Parameters.AddWithValue("paymentId", paymentId);
        return command.ExecuteNonQuery() > 0;
    }

    public InvoiceResponse? GetInvoice(Guid paymentId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT invoice_id, invoice_number, issued_at, subtotal, tax, total
            FROM invoices
            WHERE payment_id = @paymentId;
        ";
        command.Parameters.AddWithValue("paymentId", paymentId);

        using var reader = command.ExecuteReader();
        if (!reader.Read())
        {
            return null;
        }

        var invoiceId = reader.GetGuid(0);
        return new InvoiceResponse(
            invoiceId,
            reader.GetString(1),
            reader.GetDateTime(2),
            reader.GetDecimal(3),
            reader.GetDecimal(4),
            reader.GetDecimal(5),
            GetInvoiceItems(invoiceId));
    }

    private List<InvoiceItemResponse> GetInvoiceItems(Guid invoiceId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT product_name, quantity, unit_price, subtotal
            FROM invoice_items
            WHERE invoice_id = @invoiceId
            ORDER BY invoice_item_id;
        ";
        command.Parameters.AddWithValue("invoiceId", invoiceId);

        using var reader = command.ExecuteReader();
        var items = new List<InvoiceItemResponse>();
        while (reader.Read())
        {
            items.Add(new InvoiceItemResponse(
                reader.GetString(0),
                reader.GetInt32(1),
                reader.GetDecimal(2),
                reader.GetDecimal(3)));
        }

        return items;
    }
}

static class InvoicePdfBuilder
{
    public static byte[] Generate(InvoiceResponse invoice)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(30);
                page.Size(PageSizes.A4);
                page.Header().Text($"Factura {invoice.InvoiceNumber}").FontSize(20).Bold();
                page.Content().Column(column =>
                {
                    column.Spacing(10);
                    column.Item().Text($"Fecha de emisión: {invoice.IssuedAt:yyyy-MM-dd HH:mm:ss} UTC");
                    column.Item().Text($"Subtotal: ${invoice.Subtotal:N2}");
                    column.Item().Text($"IVA: ${invoice.Tax:N2}");
                    column.Item().Text($"Total: ${invoice.Total:N2}");
                    column.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(4);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(2);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Element(CellStyle).Text("Producto").Bold();
                            header.Cell().Element(CellStyle).Text("Cantidad").Bold();
                            header.Cell().Element(CellStyle).Text("Precio").Bold();
                            header.Cell().Element(CellStyle).Text("Subtotal").Bold();
                        });

                        foreach (var item in invoice.Items)
                        {
                            table.Cell().Element(CellStyle).Text(item.ProductName);
                            table.Cell().Element(CellStyle).Text(item.Quantity.ToString());
                            table.Cell().Element(CellStyle).Text($"${item.UnitPrice:N2}");
                            table.Cell().Element(CellStyle).Text($"${item.Subtotal:N2}");
                        }
                    });
                });
                page.Footer().AlignCenter().Text("Proyecto Muebles Modernos").FontSize(10);
            });
        }).GeneratePdf();

        static IContainer CellStyle(IContainer container) => container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(4);
    }
}
