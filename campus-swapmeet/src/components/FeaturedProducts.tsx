import ProductCard from "./ProductCard";
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Select } from './ui/select';

// Helper to get API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = (path: string) => `${API_URL}${path}`;

interface FeaturedProductsProps {
  selectedCategory?: string;
}

const FeaturedProducts = ({ selectedCategory }: FeaturedProductsProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const [showBuyModal, setShowBuyModal] = useState<{ open: boolean, product: any | null }>({ open: false, product: null });
  const [buyForm, setBuyForm] = useState({ name: '', phone: '', message: '' });
  const [buyLoading, setBuyLoading] = useState(false);
  const navigate = useNavigate();

  // Search/filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [location, setLocation] = useState('');

  // Fetch products with filters
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('keyword', search);
        if (category) params.append('category', category);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (location) params.append('location', location);
        const res = await fetch(api(`/products?${params.toString()}`));
        const data = await res.json();
        if (data.success) {
          setProducts(data.products.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      } catch {}
      setLoading(false);
    };
    fetchProducts();
  }, [search, category, minPrice, maxPrice, location]);

  const handleBuyClick = (product: any) => {
    // For non-logged-in users, show the modal directly
    // For logged-in users, pre-fill with their info
    setShowBuyModal({ open: true, product });
    if (user) {
      setBuyForm({ name: user.name || '', phone: user.phone || '', message: '' });
    } else {
      setBuyForm({ name: '', phone: '', message: '' });
    }
  };

  const handleSendBuyRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showBuyModal.product) return;
    
    setBuyLoading(true);
    try {
      let res;
      
      if (user) {
        // Logged-in user - use existing flow
        const token = localStorage.getItem('token');
        res = await fetch(api(`/products/${showBuyModal.product._id}/buy-request`), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: buyForm.message,
            buyerName: buyForm.name,
            buyerPhone: buyForm.phone
          })
        });
      } else {
        // Non-logged-in user - use guest buy request endpoint
        res = await fetch(api(`/products/${showBuyModal.product._id}/guest-buy-request`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: buyForm.message,
            buyerName: buyForm.name,
            buyerPhone: buyForm.phone
          })
        });
      }
      
      const data = await res.json();
      if (data.success) {
        setShowBuyModal({ open: false, product: null });
        toast({ 
          title: 'Request Sent', 
          description: user 
            ? 'Your buy request has been sent to the seller.' 
            : 'Your buy request has been sent to the seller. Please check your phone for updates.', 
          variant: 'default' 
        });
        setBuyForm({ name: '', phone: '', message: '' });
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to send buy request', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to send buy request', variant: 'destructive' });
    }
    setBuyLoading(false);
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold">
            {selectedCategory ? `${selectedCategory} Products` : 'Featured Products'}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {selectedCategory 
              ? `Discover amazing ${selectedCategory.toLowerCase()} deals from students`
              : 'Discover amazing deals from students across different colleges'
            }
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-2 mb-8 items-center justify-center bg-white/80 rounded-lg p-4 shadow-sm">
          <input
            type="text"
            placeholder="Search products..."
            className="border rounded px-3 py-2 text-sm w-48"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2 text-sm w-36"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Books">Books</option>
            <option value="Home & Living">Home & Living</option>
            <option value="Fashion">Fashion</option>
            <option value="Sports">Sports</option>
            <option value="Other">Other</option>
          </select>
          <input
            type="number"
            placeholder="Min Price"
            className="border rounded px-3 py-2 text-sm w-28"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            min={0}
          />
          <input
            type="number"
            placeholder="Max Price"
            className="border rounded px-3 py-2 text-sm w-28"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            min={0}
          />
          <input
            type="text"
            placeholder="Location"
            className="border rounded px-3 py-2 text-sm w-36"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
          <Button variant="outline" size="sm" onClick={() => {
            setSearch(''); setCategory(''); setMinPrice(''); setMaxPrice(''); setLocation('');
          }}>Clear</Button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {selectedCategory 
              ? `No ${selectedCategory.toLowerCase()} products found.`
              : 'No products found. Be the first to list an item!'
            }
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                id={product._id}
                title={product.title}
                price={product.price}
                originalPrice={product.originalPrice}
                image={product.images && product.images[0]}
                location={product.location || product.collegeName || ''}
                seller={product.seller?.name || ''}
                sellerId={product.seller?._id || ''}
                rating={product.rating || null}
                category={product.category}
                isLiked={false}
                showChatButton={true}
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

      {/* Buy Request Modal */}
      {showBuyModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 w-full max-w-md relative flex flex-col">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setShowBuyModal({ open: false, product: null })}>
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4">
              {user ? 'Send Buy Request' : 'Send Buy Request (Guest)'}
            </h3>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Product: {showBuyModal.product?.title}</p>
              <p className="text-sm text-gray-600">Price: ₹{showBuyModal.product?.price}</p>
              {!user && (
                <p className="text-xs text-blue-600 mt-2">
                  💡 Guest users: The seller will contact you directly via phone/SMS
                </p>
              )}
            </div>
            <form onSubmit={handleSendBuyRequest} className="space-y-4 flex flex-col">
              <div>
                <label className="block mb-1 font-medium text-sm">Your Name *</label>
                <input 
                  type="text" 
                  className="w-full border rounded px-3 py-2 text-sm" 
                  value={buyForm.name} 
                  onChange={e => setBuyForm(prev => ({ ...prev, name: e.target.value }))} 
                  required 
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-sm">Your Phone Number *</label>
                <input 
                  type="tel" 
                  className="w-full border rounded px-3 py-2 text-sm" 
                  value={buyForm.phone} 
                  onChange={e => setBuyForm(prev => ({ ...prev, phone: e.target.value }))} 
                  required 
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-sm">Message/Offer to Seller *</label>
                <textarea
                  className="w-full border rounded px-3 py-2 text-sm"
                  rows={3}
                  value={buyForm.message}
                  onChange={e => setBuyForm(prev => ({ ...prev, message: e.target.value }))}
                  required
                  placeholder="Type your offer or message to the seller..."
                />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={buyLoading}>
                {buyLoading ? 'Sending...' : 'Send Request'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default FeaturedProducts;