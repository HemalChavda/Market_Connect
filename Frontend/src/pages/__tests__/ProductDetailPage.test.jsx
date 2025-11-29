import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductDetailPage from '../ProductDetailPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { ProductsProvider } from '../../contexts/ProductsContext';
import { CartProvider } from '../../contexts/CartContext';
import * as productApi from '../../../services/product';
import api from '../../../services/axios';

vi.mock('../../../services/product');
vi.mock('../../../services/axios');

const mockNavigate = vi.fn();
const mockParams = { productId: '123' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
    useLocation: () => ({ pathname: '/test', state: null })
  };
});

const renderProductDetailPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            <ProductDetailPage />
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ProductDetailPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    productApi.getProductById.mockImplementation(() => new Promise(() => {}));
    api.get.mockImplementation(() => new Promise(() => {}));

    renderProductDetailPage();

    expect(screen.getByText(/Loading product/i)).toBeInTheDocument();
  });

  it('shows error when product is not found', async () => {
    productApi.getProductById.mockResolvedValue(null);  // force product not found
    api.get.mockResolvedValue({ data: { success: true, data: [] } });

    renderProductDetailPage();

    expect(await screen.findByText(/Product Not Found/i)).toBeInTheDocument();
  });

  it('renders product details when product is found', async () => {
    const mockProduct = {
      _id: '123',
      title: 'Test Product',
      description: 'Test description',
      price: 999,
      stock: 10,
      images: [{ url: 'test.jpg' }],
      categoryId: { name: 'Electronics' },
      sellerId: { name: 'Test Seller' }
    };

    productApi.getProductById.mockResolvedValue({
      success: true,
      product: mockProduct
    });

    api.get.mockResolvedValue({ data: { success: true, data: [] } });

    renderProductDetailPage();

    // Wait for main UI
    expect(await screen.findByText(/Test Product/i)).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    productApi.getProductById.mockRejectedValue(new Error('API Error'));
    api.get.mockResolvedValue({ data: { success: true, data: [] } });

    renderProductDetailPage();

    expect(await screen.findByText(/Unable to load product/i)).toBeInTheDocument();
  });
});
