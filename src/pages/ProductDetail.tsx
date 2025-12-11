import { useParams, useNavigate } from "react-router-dom";
import { useProductById, useProductBySlug } from "@/hooks/useProducts";
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
import { ProductBreadcrumb } from "@/components/ProductBreadcrumb";
import { useToast } from "@/hooks/use-toast";
import { parseProductIdFromUrl, parseProductSlugFromUrl, isNewUrlFormat, generateProductUrl } from "@/lib/productUrl";

export default function ProductDetail() {
  const { slugId } = useParams<{ slugId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Parse URL to get ID and slug
  const isNewFormat = slugId ? isNewUrlFormat(slugId) : false;
  const productId = slugId ? parseProductIdFromUrl(slugId) : "";
  const urlSlug = slugId ? parseProductSlugFromUrl(slugId) : "";
  
  // Use ID-based lookup for new URLs, slug-based for legacy
  const { data: productById, isLoading: loadingById, error: errorById } = useProductById(isNewFormat ? productId : "");
  const { data: productBySlug, isLoading: loadingBySlug, error: errorBySlug } = useProductBySlug(!isNewFormat ? slugId || "" : "");
  
  // Determine which product data to use
  const product = isNewFormat ? productById : productBySlug;
  const isLoading = isNewFormat ? loadingById : loadingBySlug;
  const error = isNewFormat ? errorById : errorBySlug;
  
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

  // Redirect legacy URLs to new format (301-like behavior for SEO)
  useEffect(() => {
    if (!isNewFormat && product && product.id && product.slug) {
      // Redirect old slug-only URL to new slug-id URL
      const newUrl = generateProductUrl(product.slug, product.id);
      navigate(newUrl, { replace: true });
    } else if (isNewFormat && product && product.slug !== urlSlug) {
      // Redirect if slug doesn't match (slug was updated)
      const newUrl = generateProductUrl(product.slug, product.id);
      navigate(newUrl, { replace: true });
    }
  }, [product, isNewFormat, urlSlug, navigate]);

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

  // Get category from product_collections if available
  const primaryCategory = product.product_collections?.[0]?.categories;

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
      
      {/* Breadcrumb Navigation */}
      <ProductBreadcrumb
        productName={product.name}
        categoryName={primaryCategory?.name}
        categorySlug={primaryCategory?.slug}
      />
      
      <div className="container mx-auto px-4 py-8">

        {/* Main Product Section - Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Left Column - Images */}
          <div>
            <ProductImageGallery images={product.product_images || []} productName={product.name} />
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-5">
            {/* Product Name */}
            <h1 className="text-3xl font-bold text-foreground leading-tight">{product.name}</h1>

            {/* Brand and Rating Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {product.vendor && (
                <>
                  <span className="text-sm text-muted-foreground">Brand -</span>
                  <span className="text-sm font-semibold text-primary">{product.vendor}</span>
                  <span className="text-muted-foreground">|</span>
                </>
              )}
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Math.round(averageRating) ? "text-yellow-400 text-sm" : "text-muted text-sm"}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({product.reviews?.length || 0} Review)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              {comparePrice && comparePrice > currentPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {comparePrice.toLocaleString('vi-VN')} ₫
                </span>
              )}
              <span className="text-3xl font-bold text-foreground">
                {currentPrice.toLocaleString('vi-VN')} ₫
              </span>
            </div>

            {/* Short Description */}
            {product.short_description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{product.short_description}</p>
            )}

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

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-base font-semibold">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 rounded-md"
                >
                  -
                </Button>
                <span className="text-lg font-medium min-w-[3rem] text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10 rounded-md"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 h-12 text-base"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button 
                size="lg" 
                className="flex-1 h-12 text-base bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                Buy Now
              </Button>
            </div>

            {/* Action Links */}
            <div className="flex items-center gap-6 pt-2">
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-smooth">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Compare
              </button>
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-smooth">
                <Heart className="h-4 w-4" />
                Add to Wishlist
              </button>
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-smooth">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Now
              </button>
            </div>

            {/* Stock Status */}
            {selectedVariant && selectedVariant.stock_quantity !== null && (
              <div className="text-sm pt-2">
                {selectedVariant.stock_quantity > 0 ? (
                  <span className="text-green-600 font-medium">
                    In stock ({selectedVariant.stock_quantity} available)
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">Out of stock</span>
                )}
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
