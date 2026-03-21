import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { CollectionFilters, FilterState } from "@/components/CollectionFilters";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Grid3X3, LayoutGrid, SlidersHorizontal, X, Globe, MapPin } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { useProductsPromotions } from "@/hooks/useProductPromotions";
import { useAllProductVouchers } from "@/hooks/useProductVouchers";

const PRODUCTS_PER_PAGE = 20;
const DEFAULT_MAX_PRICE = 10000000;
const FILTER_THRESHOLD = 0.2; // 20% of products must have data

const Collection = () => {
  const { slug } = useParams<{ slug: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("default");
  const [gridCols, setGridCols] = useState<4 | 5>(5);
  const [filters, setFilters] = useState<FilterState>({
    productTypes: [],
    brands: [],
    priceRange: [0, DEFAULT_MAX_PRICE],
    stockStatus: "all",
    onSale: false,
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

  // Fetch brand metadata if this collection matches a brand
  const { data: brandData } = useQuery({
    queryKey: ["collection-brand", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name, logo_url, website_url, country_code, description")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Fetch products in collection with stock data
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["collection-products", collection?.id],
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
            source_created_at,
            sold_count,
            target_age_id,
            target_size_id,
            product_images (image_url, alt_text, is_primary),
            reviews (rating),
            product_variants (stock_quantity),
            product_health_condition_links (health_condition_id)
          )
        `)
        .eq("collection_id", collection.id)
        .eq("products.is_active", true);

      if (error) throw error;

      const products = data?.map((item: any) => {
        const p = item.products;
        const totalStock = p.product_variants?.reduce(
          (sum: number, v: any) => sum + (v.stock_quantity ?? 0), 0
        ) ?? null;
        return {
          ...p,
          position: item.position,
          total_stock: totalStock,
        };
      }) || [];

      const maxPrice = products.length > 0
        ? Math.max(...products.map((p: any) => p.base_price))
        : DEFAULT_MAX_PRICE;

      return { products, total: products.length, maxPrice };
    },
    enabled: !!collection?.id,
  });

  const allProducts = productsData?.products || [];
  const maxPrice = productsData?.maxPrice || DEFAULT_MAX_PRICE;

  // Extract available filter options from collection products (with 20% threshold)
  const availableFilterOptions = useMemo(() => {
    const brands = new Set<string>();
    const ageRangeIds = new Set<string>();
    const sizeIds = new Set<string>();
    const healthConditionIds = new Set<string>();
    const productTypeCounts = new Map<string, number>();
    let productsWithAge = 0;
    let productsWithSize = 0;
    let inStock = 0;
    let outOfStock = 0;
    let onSaleCount = 0;

    allProducts.forEach((product: any) => {
      if (product.brand) brands.add(product.brand);
      if (product.product_type) {
        productTypeCounts.set(product.product_type, (productTypeCounts.get(product.product_type) || 0) + 1);
      }
      if (product.target_age_id) {
        ageRangeIds.add(product.target_age_id);
        productsWithAge++;
      }
      if (product.target_size_id) {
        sizeIds.add(product.target_size_id);
        productsWithSize++;
      }
      product.product_health_condition_links?.forEach((link: any) => {
        if (link.health_condition_id) healthConditionIds.add(link.health_condition_id);
      });

      const totalStock = product.total_stock;
      if (totalStock !== null && totalStock <= 0) {
        outOfStock++;
      } else {
        inStock++;
      }

      if (product.compare_at_price && product.compare_at_price > product.base_price) {
        onSaleCount++;
      }
    });

    const total = allProducts.length || 1;

    const productTypes = Array.from(productTypeCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      productTypes,
      brands: Array.from(brands).sort(),
      ageRangeIds: productsWithAge / total >= FILTER_THRESHOLD ? Array.from(ageRangeIds) : [],
      sizeIds: productsWithSize / total >= FILTER_THRESHOLD ? Array.from(sizeIds) : [],
      healthConditionIds: Array.from(healthConditionIds),
      stockCounts: { inStock, outOfStock },
      onSaleCount,
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

  const formatPriceDisplay = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "₫";
  };

  // Apply filters
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product: any) => {
      if (filters.productTypes.length > 0 && !filters.productTypes.includes(product.product_type)) return false;
      if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) return false;
      if (product.base_price < filters.priceRange[0] || product.base_price > filters.priceRange[1]) return false;
      if (filters.stockStatus === "in_stock" && product.total_stock !== null && product.total_stock <= 0) return false;
      if (filters.stockStatus === "out_of_stock" && (product.total_stock === null || product.total_stock > 0)) return false;
      if (filters.onSale && !(product.compare_at_price && product.compare_at_price > product.base_price)) return false;
      if (filters.ageRanges.length > 0 && !filters.ageRanges.includes(product.target_age_id)) return false;
      if (filters.sizes.length > 0 && !filters.sizes.includes(product.target_size_id)) return false;
      if (filters.healthConditions.length > 0) {
        const productHealthConditions = product.product_health_condition_links?.map(
          (link: any) => link.health_condition_id
        ) || [];
        if (!filters.healthConditions.some((id) => productHealthConditions.includes(id))) return false;
      }
      return true;
    });
  }, [allProducts, filters]);

  // Sort with OOS pushed to end
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];

    const sortFn = (a: any, b: any) => {
      // Always push out-of-stock to end
      const aOOS = a.total_stock !== null && a.total_stock <= 0;
      const bOOS = b.total_stock !== null && b.total_stock <= 0;
      if (aOOS !== bOOS) return aOOS ? 1 : -1;

      switch (sortBy) {
        case "newest":
          return new Date(b.source_created_at || b.created_at).getTime() - new Date(a.source_created_at || a.created_at).getTime();
        case "bestselling":
          return (b.sold_count || 0) - (a.sold_count || 0);
        case "price-low":
          return a.base_price - b.base_price;
        case "price-high":
          return b.base_price - a.base_price;
        case "default":
        default:
          // Curated: by sold_count DESC
          return (b.sold_count || 0) - (a.sold_count || 0);
      }
    };

    sorted.sort(sortFn);
    return sorted;
  }, [filteredProducts, sortBy]);

  // Fetch promotions for paginated products
  const productIds = useMemo(() => sortedProducts.map((p: any) => p.id), [sortedProducts]);
  const { data: promotionsMap } = useProductsPromotions(productIds);
  
  // Fetch vouchers (shop-wide + product-specific)
  const { data: vouchersData } = useAllProductVouchers();

  const totalProducts = sortedProducts.length;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
  const paginatedProducts = sortedProducts.slice(
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

  // SEO fallback
  const metaTitle = collection?.meta_title || (collection ? `${collection.name} | Paddy.vn - Pet Shop` : "Paddy.vn");
  const metaDescription = collection?.meta_description || (collection
    ? `Mua ${collection.name} chính hãng tại Paddy.vn. Giao hàng nhanh, giá tốt. ${allProducts.length} sản phẩm.`
    : "");

  if (collectionLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-48 w-full rounded-xl mb-8" />
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
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy bộ sưu tập</h1>
          <p className="text-muted-foreground">Bộ sưu tập bạn tìm kiếm không tồn tại.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>
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
                <div className="container mx-auto flex items-end gap-6">
                  {brandData?.logo_url && (
                    <div className="hidden md:block w-24 h-24 rounded-xl bg-background shadow-lg overflow-hidden flex-shrink-0">
                      <img src={brandData.logo_url} alt={brandData.name} className="w-full h-full object-contain p-2" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">{collection.name}</h1>
                    <p className="text-white/70 text-sm mt-1">{allProducts.length} sản phẩm</p>
                    {brandData && (
                      <div className="flex items-center gap-4 mt-2">
                        {brandData.country_code && (
                          <span className="inline-flex items-center gap-1.5 text-sm text-white/80">
                            <MapPin className="h-4 w-4" />{brandData.country_code}
                          </span>
                        )}
                        {brandData.website_url && (
                          <a href={brandData.website_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors">
                            <Globe className="h-4 w-4" />Website
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-8 md:py-12 border-b">
              <div className="container mx-auto px-4">
                <div className="flex items-center gap-6">
                  {brandData?.logo_url && (
                    <div className="w-20 h-20 rounded-xl border bg-background shadow-sm overflow-hidden flex-shrink-0">
                      <img src={brandData.logo_url} alt={brandData.name} className="w-full h-full object-contain p-2" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold">{collection.name}</h1>
                    <p className="text-muted-foreground text-sm mt-1">{allProducts.length} sản phẩm</p>
                    {brandData && (
                      <div className="flex items-center gap-4 mt-2">
                        {brandData.country_code && (
                          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />{brandData.country_code}
                          </span>
                        )}
                        {brandData.website_url && (
                          <a href={brandData.website_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            <Globe className="h-4 w-4" />Website
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
                <h2 className="font-semibold text-lg mb-4">Bộ lọc</h2>
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
                        Bộ lọc
                        {activeFilterCount > 0 && (
                          <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                            {activeFilterCount}
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                      <SheetHeader>
                        <SheetTitle>Bộ lọc</SheetTitle>
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
                    {totalProducts} sản phẩm
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Grid Toggle */}
                  <div className="hidden md:flex items-center gap-1 border rounded-lg p-1">
                    <Button variant={gridCols === 4 ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setGridCols(4)}>
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button variant={gridCols === 5 ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setGridCols(5)}>
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sắp xếp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Mặc định</SelectItem>
                      <SelectItem value="newest">Mới nhất</SelectItem>
                      <SelectItem value="bestselling">Bán chạy</SelectItem>
                      <SelectItem value="price-low">Giá thấp → cao</SelectItem>
                      <SelectItem value="price-high">Giá cao → thấp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filter Chips */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {filters.brands.map((brand) => (
                    <span key={`brand-${brand}`} className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                      {brand}
                      <button onClick={() => handleFiltersChange({ ...filters, brands: filters.brands.filter((b) => b !== brand) })} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {filters.ageRanges.map((id) => {
                    const age = ageRangesData?.find((a) => a.id === id);
                    return age ? (
                      <span key={`age-${id}`} className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                        {age.name_vi}
                        <button onClick={() => handleFiltersChange({ ...filters, ageRanges: filters.ageRanges.filter((a) => a !== id) })} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                  {filters.sizes.map((id) => {
                    const size = sizesData?.find((s) => s.id === id);
                    return size ? (
                      <span key={`size-${id}`} className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                        {size.name_vi}
                        <button onClick={() => handleFiltersChange({ ...filters, sizes: filters.sizes.filter((s) => s !== id) })} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                  {filters.healthConditions.map((id) => {
                    const condition = healthConditionsData?.find((h) => h.id === id);
                    return condition ? (
                      <span key={`health-${id}`} className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                        {condition.name_vi}
                        <button onClick={() => handleFiltersChange({ ...filters, healthConditions: filters.healthConditions.filter((h) => h !== id) })} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                  {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                      {formatPriceDisplay(filters.priceRange[0])} - {formatPriceDisplay(filters.priceRange[1])}
                      <button onClick={() => handleFiltersChange({ ...filters, priceRange: [0, maxPrice] })} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => handleFiltersChange({ brands: [], priceRange: [0, maxPrice], ageRanges: [], sizes: [], healthConditions: [] })}
                    className="text-sm text-destructive hover:underline"
                  >
                    Xóa tất cả
                  </button>
                </div>
              )}

              {/* Products Grid */}
              {productsLoading ? (
                <div className={`grid grid-cols-2 md:grid-cols-3 ${gridCols === 5 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-3 md:gap-4`}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-80 rounded-lg" />
                  ))}
                </div>
              ) : paginatedProducts.length > 0 ? (
                <>
                  <div className={`grid grid-cols-2 md:grid-cols-3 ${gridCols === 5 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-3 md:gap-4`}>
                    {paginatedProducts.map((product: any) => {
                      const shopWide = vouchersData?.shopWideVouchers || [];
                      const productSpecific = vouchersData?.productVouchersMap?.[product.id] || [];
                      const combinedVouchers = [...shopWide, ...productSpecific].filter(
                        (v, i, arr) => i === arr.findIndex((x) => x.id === v.id)
                      ).slice(0, 3);
                      
                      return (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          promotion={promotionsMap?.[product.id]}
                          vouchers={combinedVouchers}
                        />
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
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
                              {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                              <Button variant={currentPage === page ? "default" : "outline"} size="icon" onClick={() => handlePageChange(page)}>
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                      <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">Không tìm thấy sản phẩm phù hợp với bộ lọc.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Collection Description */}
        {collection.description && (
          <div className="container mx-auto px-4 py-12 border-t">
            <h2 className="text-xl font-semibold mb-4">Về {collection.name}</h2>
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
