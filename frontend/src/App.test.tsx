import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { App } from './App';

const mockFetch = vi.fn();
global.fetch = mockFetch as typeof fetch;

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}

beforeEach(() => {
  mockFetch.mockReset();

  mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';

    if (url.includes('/api/catalog')) {
      return jsonResponse([
        {
          id: 'prod-1',
          name: 'Sofá Oslo',
          category: 'Sala',
          price: 2499,
          image: 'https://example.com/sofa.jpg',
          colors: ['Gris'],
          measures: ['200x90']
        }
      ]);
    }

    if (url.includes('/api/inventory/products')) {
      return jsonResponse([
        {
          productId: 'prod-1',
          sku: 'SKU-001',
          name: 'Sofá Oslo',
          category: 'Sala',
          price: 2499,
          image: 'https://example.com/sofa.jpg',
          colors: ['Gris'],
          measures: ['200x90'],
          available: 5,
          reserved: 1,
          supplierName: 'Proveedor Uno',
          createdAt: '2026-05-22T10:00:00Z',
          updatedAt: '2026-05-22T10:00:00Z'
        }
      ]);
    }

    if (url.includes('/api/auth/login')) {
      return jsonResponse({
        token: 'token-demo',
        expiresIn: 3600,
        user: {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'cliente@muebles.com',
          fullName: 'Cliente Demo',
          role: 'Admin'
        }
      });
    }

    if (url.includes('/api/auth/users')) {
      return jsonResponse([
        {
          id: 'user-1',
          email: 'admin@muebles.com',
          fullName: 'Administrador',
          role: 'Admin',
          createdAt: '2026-05-22T10:00:00Z',
          isActive: true
        }
      ]);
    }

    if (url.includes('/api/orders')) {
      if (method === 'POST') {
        return jsonResponse({
          orderId: 'order-2',
          customerId: '11111111-1111-1111-1111-111111111111',
          status: 'Created',
          subtotal: 2499,
          tax: 399.84,
          total: 2898.84,
          createdAt: '2026-05-22T10:00:00Z',
          updatedAt: '2026-05-22T10:00:00Z',
          items: [
            {
              orderItemId: 'order-item-1',
              productId: 'prod-1',
              quantity: 1,
              unitPrice: 2499,
              subtotal: 2499
            }
          ]
        });
      }

      return jsonResponse([
        {
          orderId: 'order-1',
          customerId: '11111111-1111-1111-1111-111111111111',
          status: 'Paid',
          subtotal: 2499,
          tax: 399.84,
          total: 2898.84,
          createdAt: '2026-05-22T10:00:00Z',
          updatedAt: '2026-05-22T10:00:00Z',
          items: [
            {
              orderItemId: 'order-item-1',
              productId: 'prod-1',
              quantity: 1,
              unitPrice: 2499,
              subtotal: 2499
            }
          ]
        }
      ]);
    }

    if (url.includes('/api/payments')) {
      return jsonResponse([
        {
          paymentId: 'payment-1',
          orderId: 'order-1',
          customerId: '11111111-1111-1111-1111-111111111111',
          customerName: 'Cliente Demo',
          customerEmail: 'cliente@muebles.com',
          paymentMethod: 'Tarjeta',
          status: 'Authorized',
          subtotal: 2499,
          tax: 399.84,
          total: 2898.84,
          createdAt: '2026-05-22T10:00:00Z',
          invoice: {
            invoiceNumber: 'FAC-20260522-AAAA1111',
            issuedAt: '2026-05-22T10:00:00Z',
            items: [
              {
                productName: 'Sofá Oslo',
                quantity: 1,
                unitPrice: 2499,
                subtotal: 2499
              }
            ],
            subtotal: 2499,
            tax: 399.84,
            total: 2898.84
          }
        }
      ]);
    }

    if (url.includes('/api/cart/items') && method === 'POST') {
      return jsonResponse({
        id: 'cart-1',
        customerId: '11111111-1111-1111-1111-111111111111',
        items: [
          {
            productId: 'prod-1',
            productName: 'Sofá Oslo',
            quantity: 1,
            unitPrice: 2499,
            subtotal: 2499
          }
        ],
        totalAmount: 2499
      });
    }

    if (url.includes('/api/cart/') && method === 'DELETE') {
      return jsonResponse({ message: 'Item eliminado del carrito' });
    }

    if (url.includes('/api/cart/')) {
      return jsonResponse({
        id: 'cart-1',
        customerId: '11111111-1111-1111-1111-111111111111',
        items: [
          {
            productId: 'prod-1',
            productName: 'Sofá Oslo',
            quantity: 1,
            unitPrice: 2499,
            subtotal: 2499
          }
        ],
        totalAmount: 2499
      });
    }

    return jsonResponse({});
  });
});

describe('App', () => {
  it('renders with login and shows admin menu', async () => {
    render(<App />);

    expect(screen.getByText('Tienda de muebles modernos')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Menú')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Órdenes' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Pagos' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Usuarios' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Carritos' })).toBeInTheDocument();
  });

  it('renders orders payments and users views', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await screen.findByText('Menú');

    fireEvent.click(screen.getByRole('button', { name: 'Órdenes' }));
    expect(await screen.findByText('order-1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pagos' }));
    expect(await screen.findByText('payment-1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Usuarios' }));
    expect(await screen.findByText('Administrador')).toBeInTheDocument();
  });

  it('supports cart flow with add and remove item', async () => {
    render(<App />);

    expect(await screen.findByText('Sofá Oslo')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /agregar al carrito/i }));
    await screen.findByText('Sofá Oslo agregado al carrito');

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await screen.findByText('Menú');

    fireEvent.click(screen.getByRole('button', { name: 'Carritos' }));
    expect(await screen.findByText('Total del carrito: $2499.00')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/cart/11111111-1111-1111-1111-111111111111/items/prod-1'), expect.objectContaining({ method: 'DELETE' }));
    });
  });
});
