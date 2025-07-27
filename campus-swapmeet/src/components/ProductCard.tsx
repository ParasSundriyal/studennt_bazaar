import { Heart, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StartChatButton from "./StartChatButton";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  location: string;
  seller: string;
  sellerId: string;
  rating: number;
  category: string;
  isLiked?: boolean;
  footer?: React.ReactNode;
  showChatButton?: boolean;
}

const ProductCard = ({ 
  id,
  title, 
  price, 
  originalPrice, 
  image, 
  location, 
  seller, 
  sellerId,
  rating, 
  category,
  isLiked = false,
  footer,
  showChatButton = false
}: ProductCardProps) => {
  return (
    <div className="group bg-card rounded-xl overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105 transform border border-border">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background ${
            isLiked ? 'text-red-500' : 'text-muted-foreground'
          }`}
        >
          <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
        </Button>
        <Badge className="absolute top-3 left-3 bg-background/90 text-foreground border-0">
          {category}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center space-x-1 mt-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-primary">₹{price}</span>
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ₹{originalPrice}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <span className="text-xs text-muted-foreground">{rating} • {seller}</span>
            </div>
          </div>
        </div>
        
        {/* Chat Button */}
        {showChatButton && (
          <div className="mt-3">
            <StartChatButton
              sellerId={sellerId}
              productId={id}
              productTitle={title}
              variant="outline"
              size="sm"
              className="w-full"
            />
          </div>
        )}
      </div>
      {footer && <div className="p-4 pt-0">{footer}</div>}
    </div>
  );
};

export default ProductCard;