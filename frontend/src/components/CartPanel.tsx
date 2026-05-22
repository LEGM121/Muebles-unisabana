import type { InvoiceResponse, CartResponse } from '../services/api';

interface Props {
  cart: CartResponse | null;
  loading?: boolean;
  onCheckout?: () => void;
  checkoutDisabled?: boolean;
  invoice?: InvoiceResponse | null;
  onDownloadInvoice?: () => void;
}

export function CartPanel({
  cart,
  loading = false,
  onCheckout,
  checkoutDisabled = false,
  invoice,
  onDownloadInvoice
}: Props) {
  const items = cart?.items ?? [];
  const total = cart?.totalAmount ?? 0;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <h3 className="mb-4 text-lg font-semibold">Resumen del carrito</h3>
      <div className="space-y-3">
        {loading && <p className="text-sm text-stone-500">Cargando carrito...</p>}
        {!loading && items.length === 0 && <p className="text-sm text-stone-500">Tu carrito está vacío.</p>}
        {items.map((item) => (
          <div key={item.productId} className="flex items-center justify-between text-sm">
            <span>{item.productName} x {item.quantity}</span>
            <span>${item.subtotal}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 border-t border-stone-200 pt-4">
        <div className="mb-4 flex items-center justify-between font-semibold">
          <span>Total</span>
          <span>${total}</span>
        </div>
        <button
          className="w-full rounded-xl bg-stone-900 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-stone-400"
          onClick={onCheckout}
          disabled={checkoutDisabled}
          type="button"
        >
          Pagar y generar factura
        </button>
      </div>

      {invoice && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Factura generada: {invoice.invoiceNumber}</p>
          <p>Cliente: {invoice.customerName}</p>
          <p>Total pagado: ${invoice.total.toFixed(2)}</p>
          <button
            className="mt-3 w-full rounded-xl bg-emerald-700 px-4 py-3 font-medium text-white"
            onClick={onDownloadInvoice}
            type="button"
          >
            Descargar factura PDF
          </button>
        </div>
      )}
    </div>
  );
}
