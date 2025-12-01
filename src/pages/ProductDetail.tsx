import { useParams, useNavigate } from "react-router-dom";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ShoppingCart, Heart } from "lucide-react";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { ProductVariantSelector } from "@/components/ProductVariantSelector";
import { ProductReviews } from "@/components/ProductReviews";
import { RelatedProducts } from "@/components/RelatedProducts";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: product, isLoading, error } = useProduct(slug || "");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { addToCart } = useCart(session?.user?.id);

  useEffect(() => {
    if (product?.product_variants?.[0]) {
      setSelectedVariant(product.product_variants[0]);
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button onClick={() => navigate("/")}>Return to home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const primaryImage = product.product_images?.find((img: any) => img.is_primary) || product.product_images?.[0];
  const currentPrice = selectedVariant?.price || product.base_price;
  const comparePrice = selectedVariant?.compare_at_price || product.compare_at_price;
  const averageRating = product.reviews?.length > 0
    ? product.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / product.reviews.length
    : 0;

  const handleAddToCart = () => {
    if (!session?.user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    addToCart({
      productId: product.id,
      variantId: selectedVariant?.id,
      quantity,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 -ml-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to products
        </Button>

        {/* Main Product Section - Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Left Column - Images */}
          <div>
            <ProductImageGallery images={product.product_images || []} productName={product.name} />
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-6">
            {/* Vendor Badge */}
            {product.vendor && (
              <Badge variant="secondary" className="font-bold">
                {product.vendor}
              </Badge>
            )}

            {/* Product Name */}
            <h1 className="text-4xl font-bold text-foreground">{product.name}</h1>

            {/* Rating */}
            {product.reviews?.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Math.round(averageRating) ? "text-yellow-400" : "text-muted"}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {averageRating.toFixed(1)} ({product.reviews.length} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">
                {currentPrice.toLocaleString('vi-VN')} ₫
              </span>
              {comparePrice && comparePrice > currentPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  {comparePrice.toLocaleString('vi-VN')} ₫
                </span>
              )}
            </div>

            {/* Short Description */}
            {product.short_description && (
              <p className="text-muted-foreground text-lg">{product.short_description}</p>
            )}

            <Separator />

            {/* Variants Selector */}
            {product.product_variants && product.product_variants.length > 0 && (
              <ProductVariantSelector
                variants={product.product_variants}
                selectedVariant={selectedVariant}
                onVariantChange={setSelectedVariant}
                optionNames={{
                  option1: product.option1_name,
                  option2: product.option2_name,
                  option3: product.option3_name,
                }}
              />
            )}

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="font-semibold">Quantity:</label>
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3"
                  >
                    -
                  </Button>
                  <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3"
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>
                <Button size="lg" variant="outline">
                  <Heart className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Stock Status */}
            {selectedVariant && (
              <div className="text-sm">
                {selectedVariant.stock_quantity > 0 ? (
                  <span className="text-green-600 font-medium">
                    In stock ({selectedVariant.stock_quantity} available)
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">Out of stock</span>
                )}
              </div>
            )}

            {/* Product Tags */}
            {product.tags && (
              <div className="flex flex-wrap gap-2">
                {product.tags.split(',').map((tag: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="details">Details & Ingredients</TabsTrigger>
            <TabsTrigger value="recommendations">For Your Pet</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="py-6">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description || "No description available." }}
            />
          </TabsContent>
          
          <TabsContent value="details" className="py-6 space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-3">Product Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {product.product_type && (
                  <div>
                    <span className="font-semibold">Type:</span> {product.product_type}
                  </div>
                )}
                {product.vendor && (
                  <div>
                    <span className="font-semibold">Brand:</span> {product.vendor}
                  </div>
                )}
                {selectedVariant?.weight && (
                  <div>
                    <span className="font-semibold">Weight:</span> {selectedVariant.weight}g
                  </div>
                )}
                {selectedVariant?.sku && (
                  <div>
                    <span className="font-semibold">SKU:</span> {selectedVariant.sku}
                  </div>
                )}
              </div>
            </div>
            
            {product.description && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Ingredients & Materials</h3>
                <div 
                  className="prose max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recommendations" className="py-6 space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-3">Age & Size Recommendations</h3>
              <p className="text-muted-foreground">
                This product is suitable for pets based on the product type and specifications.
                {product.product_type && ` Categorized as: ${product.product_type}`}
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-3">Usage Instructions</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Always follow feeding guidelines and consult your veterinarian for specific dietary needs</p>
                <p>• Store in a cool, dry place away from direct sunlight</p>
                <p>• Ensure fresh water is always available</p>
                <p>• Monitor your pet for any adverse reactions when introducing new products</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Reviews Section */}
        <div className="mb-12">
          <ProductReviews
            productId={product.id}
            reviews={product.reviews || []}
            userId={session?.user?.id}
          />
        </div>

        {/* Related Products */}
        <RelatedProducts
          currentProductId={product.id}
          productType={product.product_type}
          vendor={product.vendor}
        />
      </div>

      <Footer />
    </div>
  );
}
