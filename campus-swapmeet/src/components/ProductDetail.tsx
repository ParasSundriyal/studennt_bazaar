import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';

interface Review {
  _id: string;
  user: { name: string; avatar?: string };
  rating: number;
  comment: string;
  createdAt: string;
}

interface ProductDetailProps {
  productId: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = (path: string) => `${API_URL}${path}`;

const ProductDetail = ({ productId }: ProductDetailProps) => {
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(api(`/products/${productId}`));
        const data = await res.json();
        if (data.success) setProduct(data.product);
      } catch {}
      setLoading(false);
    };
    const fetchReviews = async () => {
      try {
        const res = await fetch(api(`/products/reviews/${productId}`));
        const data = await res.json();
        if (data.success) setReviews(data.reviews);
      } catch {}
    };
    fetchProduct();
    fetchReviews();
  }, [productId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(api('/products/reviews'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        })
      });
      const data = await res.json();
      if (data.success) {
        setReviews(prev => [data.review, ...prev]);
        setReviewForm({ rating: 5, comment: '' });
      } else {
        setError(data.message || 'Failed to submit review');
      }
    } catch {
      setError('Failed to submit review');
    }
    setSubmitting(false);
  };

  if (loading) return <div>Loading product...</div>;
  if (!product) return <div>Product not found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-2 sm:p-4 w-full">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-shrink-0 w-full sm:w-64">
          <img src={product.images && product.images[0]} alt={product.title} className="w-full h-48 sm:h-64 object-cover rounded mb-2 sm:mb-0" />
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{product.title}</h2>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="font-semibold">{product.rating?.toFixed(1) || 'N/A'}</span>
              <span className="text-muted-foreground">({product.reviewCount || 0} reviews)</span>
            </div>
            <div className="mb-2 text-muted-foreground text-sm">{product.description}</div>
          </div>
          <div className="mb-2">
            <span className="text-lg sm:text-xl font-bold text-primary">₹{product.price}</span>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Reviews</h3>
        {reviews.length === 0 ? (
          <div className="text-muted-foreground mb-4">No reviews yet.</div>
        ) : (
          <div className="space-y-4 mb-4 max-h-48 sm:max-h-64 overflow-y-auto pr-2">
            {reviews.map(r => (
              <div key={r._id} className="border rounded p-3 bg-white/80">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="font-semibold">{r.rating}</span>
                  <span className="text-xs text-muted-foreground ml-2">by {r.user?.name || 'Unknown'} on {new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-sm break-words">{r.comment}</div>
              </div>
            ))}
          </div>
        )}
        {user && (
          <form onSubmit={handleReviewSubmit} className="bg-white/90 rounded p-4 shadow space-y-3 mt-2">
            <h4 className="font-semibold">Add Your Review</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-sm">Rating:</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={reviewForm.rating}
                onChange={e => setReviewForm(f => ({ ...f, rating: Number(e.target.value) }))}
                required
              >
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <textarea
              className="w-full border rounded px-3 py-2 text-sm"
              rows={3}
              value={reviewForm.comment}
              onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
              required
              placeholder="Write your review..."
            />
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Button type="submit" variant="hero" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProductDetail; 