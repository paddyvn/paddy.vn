import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon } from "lucide-react";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data: products, isLoading } = useQuery({
    queryKey: ["search-products", query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          base_price,
          compare_at_price,
          brand,
          pet_type,
          is_active,
          product_images (
            image_url,
            is_primary
          )
        `)
        .eq("is_active", true)
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%,tags.ilike.%${query}%`)
        .order("name")
        .limit(48);

      if (error) throw error;
      return data;
    },
    enabled: !!query.trim(),
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Search Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <SearchIcon className="h-6 w-6 text-muted-foreground" />
              <h1 className="text-2xl font-bold">
                {query ? `Search results for "${query}"` : "Search"}
              </h1>
            </div>
            {products && (
              <p className="text-muted-foreground">
                {products.length} {products.length === 1 ? "product" : "products"} found
              </p>
            )}
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : query ? (
            <div className="text-center py-16">
              <SearchIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No products found</h2>
              <p className="text-muted-foreground mb-6">
                We couldn't find any products matching "{query}".
              </p>
              <Link 
                to="/" 
                className="text-primary hover:underline"
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <div className="text-center py-16">
              <SearchIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Start searching</h2>
              <p className="text-muted-foreground">
                Enter a search term to find products.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Search;
