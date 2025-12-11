import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Grid3X3, LayoutGrid } from "lucide-react";

const PRODUCTS_PER_PAGE = 20;

const Collection = () => {
  const { slug } = useParams<{ slug: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [gridCols, setGridCols] = useState<4 | 5>(5);

  // Fetch collection details
  const { data: collection, isLoading: collectionLoading } = useQuery({
    queryKey: ["collection", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Fetch products in collection
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["collection-products", collection?.id, sortBy],
    queryFn: async () => {
      if (!collection?.id) return { products: [], total: 0 };

      let query = supabase
        .from("product_collections")
        .select(`
          position,
          products!inner (
            id,
            name,
            slug,
            base_price,
            compare_at_price,
            is_featured,
            is_active,
            vendor,
            created_at,
            product_images (image_url, alt_text, is_primary),
            reviews (rating)
          )
        `)
        .eq("collection_id", collection.id)
        .eq("products.is_active", true);

      const { data, error } = await query;

      if (error) throw error;

      let products = data?.map((item: any) => ({
        ...item.products,
        position: item.position,
      })) || [];

      // Sort products
      switch (sortBy) {
        case "newest":
          products.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case "price-low":
          products.sort((a: any, b: any) => a.base_price - b.base_price);
          break;
        case "price-high":
          products.sort((a: any, b: any) => b.base_price - a.base_price);
          break;
        case "name-az":
          products.sort((a: any, b: any) => a.name.localeCompare(b.name));
          break;
        case "name-za":
          products.sort((a: any, b: any) => b.name.localeCompare(a.name));
          break;
        case "position":
        default:
          products.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
          break;
      }

      return { products, total: products.length };
    },
    enabled: !!collection?.id,
  });

  const products = productsData?.products || [];
  const totalProducts = productsData?.total || 0;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
  const paginatedProducts = products.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (collectionLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full rounded-xl mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Collection Not Found</h1>
          <p className="text-muted-foreground">The collection you're looking for doesn't exist.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Collection Header */}
        <div className="relative">
          {collection.image_url ? (
            <div className="relative h-48 md:h-64 overflow-hidden">
              <img
                src={collection.image_url}
                alt={collection.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="container mx-auto">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {collection.name}
                  </h1>
                  {collection.description && (
                    <p className="text-white/80 max-w-2xl line-clamp-2">
                      {collection.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted py-8 md:py-12">
              <div className="container mx-auto px-4">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {collection.name}
                </h1>
                {collection.description && (
                  <p className="text-muted-foreground max-w-2xl">
                    {collection.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {totalProducts} {totalProducts === 1 ? "product" : "products"}
            </p>

            <div className="flex items-center gap-3">
              {/* Grid Toggle */}
              <div className="hidden md:flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={gridCols === 4 ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setGridCols(4)}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={gridCols === 5 ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setGridCols(5)}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="position">Featured</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name-az">Name: A to Z</SelectItem>
                  <SelectItem value="name-za">Name: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="container mx-auto px-4 pb-12">
          {productsLoading ? (
            <div className={`grid grid-cols-2 md:grid-cols-4 ${gridCols === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-4`}>
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-lg" />
              ))}
            </div>
          ) : paginatedProducts.length > 0 ? (
            <>
              <div className={`grid grid-cols-2 md:grid-cols-4 ${gridCols === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-4`}>
                {paginatedProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, index, arr) => {
                      const showEllipsis = index > 0 && page - arr[index - 1] > 1;
                      return (
                        <div key={page} className="flex items-center gap-2">
                          {showEllipsis && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="icon"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        </div>
                      );
                    })}

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No products found in this collection.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Collection;
