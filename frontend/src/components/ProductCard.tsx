import type { Product } from '../types/product';

interface Props {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: Props) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
      <img className="h-56 w-full object-cover" src={product.image} alt={product.name} />
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-500">{product.category}</p>
            <h3 className="text-lg font-semibold">{product.name}</h3>
          </div>
          <span className="text-lg font-bold">${product.price}</span>
        </div>

        <div className="text-sm text-stone-600">
          <p><strong>Colores:</strong> {product.colors.join(', ')}</p>
          <p><strong>Medidas:</strong> {product.measures.join(' / ')}</p>
        </div>

        <button
          className="w-full rounded-xl bg-brand-700 px-4 py-3 font-medium text-white transition hover:bg-brand-900"
          onClick={() => onAddToCart(product)}
        >
          Agregar al carrito
        </button>
      </div>
    </article>
  );
}
