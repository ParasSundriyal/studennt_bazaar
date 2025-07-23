import ProductCard from "./ProductCard";

// Mock data for featured products
const featuredProducts = [
  {
    id: 1,
    title: "MacBook Air M1 - Excellent Condition",
    price: 65000,
    originalPrice: 80000,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop&crop=center",
    location: "Delhi University",
    seller: "Rahul S.",
    rating: 4.8,
    category: "Electronics",
    isLiked: false
  },
  {
    id: 2,
    title: "Complete Engineering Mathematics Books Set",
    price: 2500,
    originalPrice: 4000,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop&crop=center",
    location: "IIT Delhi",
    seller: "Priya M.",
    rating: 4.9,
    category: "Books",
    isLiked: true
  },
  {
    id: 3,
    title: "iPhone 13 Pro - Like New",
    price: 45000,
    originalPrice: 55000,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop&crop=center",
    location: "JNU",
    seller: "Arjun K.",
    rating: 4.7,
    category: "Electronics",
    isLiked: false
  },
  {
    id: 4,
    title: "Gaming Chair - Ergonomic Design",
    price: 8500,
    originalPrice: 12000,
    image: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&h=400&fit=crop&crop=center",
    location: "BITS Pilani",
    seller: "Neha R.",
    rating: 4.6,
    category: "Home & Living",
    isLiked: false
  },
  {
    id: 5,
    title: "Canon DSLR Camera with Lens",
    price: 25000,
    originalPrice: 35000,
    image: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=400&fit=crop&crop=center",
    location: "Jamia Millia",
    seller: "Karan T.",
    rating: 4.8,
    category: "Electronics",
    isLiked: true
  },
  {
    id: 6,
    title: "Study Table with Drawers",
    price: 3500,
    originalPrice: 5000,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center",
    location: "DU North Campus",
    seller: "Shreya P.",
    rating: 4.5,
    category: "Home & Living",
    isLiked: false
  }
];

const FeaturedProducts = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Discover amazing deals from students across different colleges
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              title={product.title}
              price={product.price}
              originalPrice={product.originalPrice}
              image={product.image}
              location={product.location}
              seller={product.seller}
              rating={product.rating}
              category={product.category}
              isLiked={product.isLiked}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="bg-gradient-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:shadow-medium hover:scale-105 transform transition-all duration-300">
            View All Products
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;