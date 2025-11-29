import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Star } from "lucide-react";

const products = [
  {
    id: 1,
    name: "Premium Dog Food",
    description: "Nutritious kibble for adult dogs",
    price: "450,000",
    originalPrice: "550,000",
    rating: 4.8,
    reviews: 124,
    badge: "Best Seller",
    image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&h=500&fit=crop",
  },
  {
    id: 2,
    name: "Cat Scratching Post",
    description: "Multi-level tower with toys",
    price: "890,000",
    rating: 4.9,
    reviews: 89,
    badge: "New",
    image: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=500&h=500&fit=crop",
  },
  {
    id: 3,
    name: "Interactive Ball Toy",
    description: "Smart motion-activated toy",
    price: "320,000",
    rating: 4.7,
    reviews: 203,
    image: "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=500&h=500&fit=crop",
  },
  {
    id: 4,
    name: "Cozy Pet Bed",
    description: "Ultra-soft orthopedic cushion",
    price: "680,000",
    originalPrice: "850,000",
    rating: 4.9,
    reviews: 156,
    badge: "Sale",
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&h=500&fit=crop",
  },
];

export const FeaturedProducts = () => {
  return (
    <section className="py-16 md:py-24 bg-paddy-lavender/30">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-12 animate-in fade-in slide-in-from-bottom duration-700">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-muted-foreground">
              Hand-picked favorites loved by pets everywhere
            </p>
          </div>
          <Button variant="outline" className="hidden md:inline-flex rounded-full border-2 hover:border-primary hover:bg-primary hover:text-primary-foreground transition-smooth">
            View All
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <Card
              key={product.id}
              className="group overflow-hidden border-2 hover:border-primary transition-smooth shadow-card hover:shadow-hover animate-in fade-in zoom-in duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-0">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-smooth group-hover:scale-110"
                  />
                  
                  {product.badge && (
                    <Badge 
                      className={`absolute top-3 left-3 ${
                        product.badge === "Sale" 
                          ? "bg-secondary text-secondary-foreground hover:bg-secondary" 
                          : "bg-primary text-primary-foreground hover:bg-primary"
                      }`}
                    >
                      {product.badge}
                    </Badge>
                  )}
                  
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-3 right-3 rounded-full opacity-0 group-hover:opacity-100 transition-smooth shadow-lg"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-smooth">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-secondary text-secondary" />
                    <span className="text-sm font-medium">{product.rating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({product.reviews})
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-primary">
                      {product.price}₫
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {product.originalPrice}₫
                      </span>
                    )}
                  </div>

                  <Button className="w-full rounded-full transition-bounce hover:scale-105 group/button">
                    <ShoppingCart className="mr-2 h-4 w-4 transition-transform group-hover/button:rotate-12" />
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Button variant="outline" className="rounded-full border-2 hover:border-primary hover:bg-primary hover:text-primary-foreground transition-smooth">
            View All Products
          </Button>
        </div>
      </div>
    </section>
  );
};
