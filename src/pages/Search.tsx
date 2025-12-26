import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionFilters, FilterState } from "@/components/CollectionFilters";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useProductsPromotions } from "@/hooks/useProductPromotions";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Fetch all matching products first (without client-side filtering)
  const { data: allProducts, isLoading } = useQuery({
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
          target_age_id,
          target_size_id,
          product_images (
            image_url,
            is_primary
          ),
          product_health_condition_links (
            health_condition_id
          )
        `)
        .eq("is_active", true)
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%,tags.ilike.%${query}%`)
        .order("name")
        .limit(200);

      if (error) throw error;
      return data;
    },
    enabled: !!query.trim(),
  });

  // Calculate available filter options from search results
  const filterOptions = useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return {
        brands: [],
        maxPrice: 10000000,
        ageRangeIds: [],
        sizeIds: [],
        healthConditionIds: [],
      };
    }

    const brands = [...new Set(allProducts.map((p) => p.brand).filter(Boolean))] as string[];
    const maxPrice = Math.max(...allProducts.map((p) => p.base_price), 10000000);
    const ageRangeIds = [...new Set(allProducts.map((p) => p.target_age_id).filter(Boolean))] as string[];
    const sizeIds = [...new Set(allProducts.map((p) => p.target_size_id).filter(Boolean))] as string[];
    const healthConditionIds = [...new Set(
      allProducts.flatMap((p) => 
        p.product_health_condition_links?.map((l) => l.health_condition_id) || []
      )
    )] as string[];

    return { brands, maxPrice, ageRangeIds, sizeIds, healthConditionIds };
  }, [allProducts]);

  // Initialize filters
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    priceRange: [0, 10000000],
    ageRanges: [],
    sizes: [],
    healthConditions: [],
  });

  // Update price range when maxPrice changes
  useMemo(() => {
    if (filterOptions.maxPrice && filters.priceRange[1] === 10000000) {
      setFilters((prev) => ({
        ...prev,
        priceRange: [0, filterOptions.maxPrice],
      }));
    }
  }, [filterOptions.maxPrice]);

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];

    return allProducts.filter((product) => {
      // Brand filter
      if (filters.brands.length > 0 && (!product.brand || !filters.brands.includes(product.brand))) {
        return false;
      }

      // Price filter
      if (product.base_price < filters.priceRange[0] || product.base_price > filters.priceRange[1]) {
        return false;
      }

      // Age range filter
      if (filters.ageRanges.length > 0 && (!product.target_age_id || !filters.ageRanges.includes(product.target_age_id))) {
        return false;
      }

      // Size filter
      if (filters.sizes.length > 0 && (!product.target_size_id || !filters.sizes.includes(product.target_size_id))) {
        return false;
      }

      // Health condition filter
      if (filters.healthConditions.length > 0) {
        const productHealthIds = product.product_health_condition_links?.map((l) => l.health_condition_id) || [];
        if (!filters.healthConditions.some((id) => productHealthIds.includes(id))) {
          return false;
        }
      }

      return true;
    });
  }, [allProducts, filters]);

  // Fetch promotions for filtered products
  const productIds = useMemo(() => filteredProducts.map(p => p.id), [filteredProducts]);
  const { data: promotionsMap } = useProductsPromotions(productIds);

  const hasActiveFilters =
    filters.brands.length > 0 ||
    filters.ageRanges.length > 0 ||
    filters.sizes.length > 0 ||
    filters.healthConditions.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < filterOptions.maxPrice;

  const activeFilterCount = 
    filters.brands.length + 
    filters.ageRanges.length + 
    filters.sizes.length + 
    filters.healthConditions.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < filterOptions.maxPrice ? 1 : 0);

  const FiltersContent = () => (
    <CollectionFilters
      filters={filters}
      onFiltersChange={setFilters}
      maxPrice={filterOptions.maxPrice}
      availableBrands={filterOptions.brands}
      availableAgeRangeIds={filterOptions.ageRangeIds}
      availableSizeIds={filterOptions.sizeIds}
      availableHealthConditionIds={filterOptions.healthConditionIds}
    />
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Search Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <SearchIcon className="h-6 w-6 text-muted-foreground" />
              <h1 className="text-2xl font-bold">
                {query ? `Search results for "${query}"` : "Search"}
              </h1>
            </div>
            {allProducts && (
              <p className="text-muted-foreground">
                {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} found
                {hasActiveFilters && allProducts.length !== filteredProducts.length && (
                  <span> (filtered from {allProducts.length})</span>
                )}
              </p>
            )}
          </div>

          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-4">
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4 overflow-y-auto max-h-[calc(100vh-120px)]">
                  <FiltersContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Main Content */}
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            {query && allProducts && allProducts.length > 0 && (
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-4">
                  <h2 className="font-semibold mb-4">Filters</h2>
                  <FiltersContent />
                </div>
              </aside>
            )}

            {/* Results */}
            <div className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-square rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts && filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      promotion={promotionsMap?.[product.id]}
                    />
                  ))}
                </div>
              ) : query ? (
                <div className="text-center py-16">
                  <SearchIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">
                    {hasActiveFilters ? "No products match your filters" : "No products found"}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {hasActiveFilters 
                      ? "Try adjusting your filters to see more results."
                      : `We couldn't find any products matching "${query}".`
                    }
                  </p>
                  {hasActiveFilters ? (
                    <Button
                      variant="outline"
                      onClick={() => setFilters({
                        brands: [],
                        priceRange: [0, filterOptions.maxPrice],
                        ageRanges: [],
                        sizes: [],
                        healthConditions: [],
                      })}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear all filters
                    </Button>
                  ) : (
                    <Link 
                      to="/" 
                      className="text-primary hover:underline"
                    >
                      Continue shopping
                    </Link>
                  )}
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Search;
