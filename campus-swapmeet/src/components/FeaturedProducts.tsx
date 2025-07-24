import ProductCard from "./ProductCard";
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Helper to get API URL
const API_URL = import.meta.env.VITE_API_URL;
const api = (path: string) => `${API_URL}${path}`;

const FeaturedProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const [showBuyModal, setShowBuyModal] = useState<{ open: boolean, product: any | null }>({ open: false, product: null });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(api('/products/all'));
        const data = await res.json();
        if (data.success) {
          // Show the latest 8 products (sorted by createdAt desc)
          setProducts(data.products.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8));
        }
      } catch {}
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleBuyClick = (product: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowBuyModal({ open: true, product });
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Discover amazing deals from students across different colleges
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No products found. Be the first to list an item!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                title={product.title}
                price={product.price}
                originalPrice={product.originalPrice}
                image={product.images && product.images[0]}
                location={product.location || product.collegeName || ''}
                seller={product.seller?.name || ''}
                rating={product.rating || null}
                category={product.category}
                isLiked={false}
                footer={
                  <Button variant="hero" size="sm" className="mt-2 w-full" onClick={() => handleBuyClick(product)}>
                    Send Buy Request
                  </Button>
                }
              />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <button className="bg-gradient-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:shadow-medium hover:scale-105 transform transition-all duration-300">
            View All Products
          </button>
        </div>
      </div>
      {showBuyModal.open && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 w-full max-w-md relative flex flex-col">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setShowBuyModal({ open: false, product: null })}>
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4">Send Buy Request</h3>
            <form /* ...buy request form logic as in dashboard... */ />
          </div>
        </div>
      )}
    </section>
  );
};

export default FeaturedProducts;