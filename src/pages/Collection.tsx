import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { CollectionFilters, FilterState } from "@/components/CollectionFilters";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Grid3X3, LayoutGrid, SlidersHorizontal, X } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

const PRODUCTS_PER_PAGE = 20;
const DEFAULT_MAX_PRICE = 10000000;

const Collection = () => {
  const { slug } = useParams<{ slug: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [gridCols, setGridCols] = useState<4 | 5>(5);
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    priceRange: [0, DEFAULT_MAX_PRICE],
    ageRanges: [],
    sizes: [],
    healthConditions: [],
  });

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

  // Fetch products in collection with related data for filtering
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["collection-products", collection?.id, sortBy],
    queryFn: async () => {
      if (!collection?.id) return { products: [], total: 0, maxPrice: DEFAULT_MAX_PRICE };

      const { data, error } = await supabase
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
            brand,
            created_at,
            target_age_id,
            target_size_id,
            product_images (image_url, alt_text, is_primary),
            reviews (rating),
            product_health_condition_links (health_condition_id)
          )
        `)
        .eq("collection_id", collection.id)
        .eq("products.is_active", true);

      if (error) throw error;

      let products = data?.map((item: any) => ({
        ...item.products,
        position: item.position,
      })) || [];

      // Calculate max price for filter
      const maxPrice = Math.max(...products.map((p: any) => p.base_price), DEFAULT_MAX_PRICE);

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

      return { products, total: products.length, maxPrice };
    },
    enabled: !!collection?.id,
  });

  const allProducts = productsData?.products || [];
  const maxPrice = productsData?.maxPrice || DEFAULT_MAX_PRICE;

  // Extract available filter options from collection products
  const availableFilterOptions = useMemo(() => {
    const brands = new Set<string>();
    const ageRangeIds = new Set<string>();
    const sizeIds = new Set<string>();
    const healthConditionIds = new Set<string>();

    allProducts.forEach((product: any) => {
      if (product.brand) brands.add(product.brand);
      if (product.target_age_id) ageRangeIds.add(product.target_age_id);
      if (product.target_size_id) sizeIds.add(product.target_size_id);
      product.product_health_condition_links?.forEach((link: any) => {
        if (link.health_condition_id) healthConditionIds.add(link.health_condition_id);
      });
    });

    return {
      brands: Array.from(brands).sort(),
      ageRangeIds: Array.from(ageRangeIds),
      sizeIds: Array.from(sizeIds),
      healthConditionIds: Array.from(healthConditionIds),
    };
  }, [allProducts]);

  // Fetch filter label data for chips
  const { data: ageRangesData } = useQuery({
    queryKey: ["age-ranges-labels", availableFilterOptions.ageRangeIds],
    queryFn: async () => {
      if (availableFilterOptions.ageRangeIds.length === 0) return [];
      const { data } = await supabase
        .from("product_age_ranges")
        .select("id, name_vi")
        .in("id", availableFilterOptions.ageRangeIds);
      return data || [];
    },
    enabled: availableFilterOptions.ageRangeIds.length > 0,
  });

  const { data: sizesData } = useQuery({
    queryKey: ["sizes-labels", availableFilterOptions.sizeIds],
    queryFn: async () => {
      if (availableFilterOptions.sizeIds.length === 0) return [];
      const { data } = await supabase
        .from("product_sizes")
        .select("id, name_vi")
        .in("id", availableFilterOptions.sizeIds);
      return data || [];
    },
    enabled: availableFilterOptions.sizeIds.length > 0,
  });

  const { data: healthConditionsData } = useQuery({
    queryKey: ["health-conditions-labels", availableFilterOptions.healthConditionIds],
    queryFn: async () => {
      if (availableFilterOptions.healthConditionIds.length === 0) return [];
      const { data } = await supabase
        .from("product_health_conditions")
        .select("id, name_vi")
        .in("id", availableFilterOptions.healthConditionIds);
      return data || [];
    },
    enabled: availableFilterOptions.healthConditionIds.length > 0,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "₫";
  };

  // Apply filters
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product: any) => {
      // Brand filter
      if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
        return false;
      }

      // Price filter
      if (product.base_price < filters.priceRange[0] || product.base_price > filters.priceRange[1]) {
        return false;
      }

      // Age range filter
      if (filters.ageRanges.length > 0 && !filters.ageRanges.includes(product.target_age_id)) {
        return false;
      }

      // Size filter
      if (filters.sizes.length > 0 && !filters.sizes.includes(product.target_size_id)) {
        return false;
      }

      // Health condition filter
      if (filters.healthConditions.length > 0) {
        const productHealthConditions = product.product_health_condition_links?.map(
          (link: any) => link.health_condition_id
        ) || [];
        if (!filters.healthConditions.some((id) => productHealthConditions.includes(id))) {
          return false;
        }
      }

      return true;
    });
  }, [allProducts, filters]);

  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const activeFilterCount =
    filters.brands.length +
    filters.ageRanges.length +
    filters.sizes.length +
    filters.healthConditions.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice ? 1 : 0);

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
                  <h1 className="text-3xl md:text-4xl font-bold text-white">
                    {collection.name}
                  </h1>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-background py-8 md:py-12">
              <div className="container mx-auto px-4">
                <h1 className="text-3xl md:text-4xl font-bold">
                  {collection.name}
                </h1>
              </div>
            </div>
          )}
        </div>

        {/* Content with Filters */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-8">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-4">
                <h2 className="font-semibold text-lg mb-4">Filters</h2>
                <CollectionFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  maxPrice={maxPrice}
                  availableBrands={availableFilterOptions.brands}
                  availableAgeRangeIds={availableFilterOptions.ageRangeIds}
                  availableSizeIds={availableFilterOptions.sizeIds}
                  availableHealthConditionIds={availableFilterOptions.healthConditionIds}
                />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
                <div className="flex items-center gap-3">
                  {/* Mobile Filter Button */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Filters
                        {activeFilterCount > 0 && (
                          <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                            {activeFilterCount}
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4">
                        <CollectionFilters
                          filters={filters}
                          onFiltersChange={handleFiltersChange}
                          maxPrice={maxPrice}
                          availableBrands={availableFilterOptions.brands}
                          availableAgeRangeIds={availableFilterOptions.ageRangeIds}
                          availableSizeIds={availableFilterOptions.sizeIds}
                          availableHealthConditionIds={availableFilterOptions.healthConditionIds}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <p className="text-sm text-muted-foreground">
                    {totalProducts} {totalProducts === 1 ? "product" : "products"}
                  </p>
                </div>

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

              {/* Active Filter Chips */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {filters.brands.map((brand) => (
                    <span
                      key={`brand-${brand}`}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full"
                    >
                      {brand}
                      <button
                        onClick={() => handleFiltersChange({
                          ...filters,
                          brands: filters.brands.filter((b) => b !== brand),
                        })}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {filters.ageRanges.map((id) => {
                    const age = ageRangesData?.find((a) => a.id === id);
                    return age ? (
                      <span
                        key={`age-${id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full"
                      >
                        {age.name_vi}
                        <button
                          onClick={() => handleFiltersChange({
                            ...filters,
                            ageRanges: filters.ageRanges.filter((a) => a !== id),
                          })}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                  {filters.sizes.map((id) => {
                    const size = sizesData?.find((s) => s.id === id);
                    return size ? (
                      <span
                        key={`size-${id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full"
                      >
                        {size.name_vi}
                        <button
                          onClick={() => handleFiltersChange({
                            ...filters,
                            sizes: filters.sizes.filter((s) => s !== id),
                          })}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                  {filters.healthConditions.map((id) => {
                    const condition = healthConditionsData?.find((h) => h.id === id);
                    return condition ? (
                      <span
                        key={`health-${id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full"
                      >
                        {condition.name_vi}
                        <button
                          onClick={() => handleFiltersChange({
                            ...filters,
                            healthConditions: filters.healthConditions.filter((h) => h !== id),
                          })}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                  {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                      {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
                      <button
                        onClick={() => handleFiltersChange({
                          ...filters,
                          priceRange: [0, maxPrice],
                        })}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => handleFiltersChange({
                      brands: [],
                      priceRange: [0, maxPrice],
                      ageRanges: [],
                      sizes: [],
                      healthConditions: [],
                    })}
                    className="text-sm text-destructive hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Products Grid */}
              {productsLoading ? (
                <div className={`grid grid-cols-2 md:grid-cols-3 ${gridCols === 5 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-80 rounded-lg" />
                  ))}
                </div>
              ) : paginatedProducts.length > 0 ? (
                <>
                  <div className={`grid grid-cols-2 md:grid-cols-3 ${gridCols === 5 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}>
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
                  <p className="text-muted-foreground">No products found matching your filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Collection Description */}
        {collection.description && (
          <div className="container mx-auto px-4 py-12 border-t">
            <h2 className="text-xl font-semibold mb-4">About {collection.name}</h2>
            <div 
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(collection.description) }}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Collection;
