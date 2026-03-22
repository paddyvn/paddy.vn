import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Brand {
  name: string;
  slug: string;
  productCount: number;
  logo_url?: string | null;
}

const ALPHABET = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'];

const createSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export default function Brands() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: brands, isLoading } = useQuery({
    queryKey: ['all-brands-from-products'],
    queryFn: async () => {
      const { data: productsData } = await supabase
        .from('products')
        .select('brand')
        .not('brand', 'is', null)
        .neq('brand', '')
        .eq('is_active', true);
      
      if (!productsData) return [];

      const brandCounts: Record<string, number> = {};
      productsData.forEach((product) => {
        const brand = product.brand?.trim();
        if (brand) {
          brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        }
      });

      const { data: brandsData } = await supabase
        .from('brands')
        .select('name, logo_url')
        .eq('is_active', true);

      const { data: brandCollections } = await supabase
        .from('categories')
        .select('name, slug')
        .eq('collection_type', 'brand')
        .eq('is_active', true);

      const logoMap: Record<string, string | null> = {};
      brandsData?.forEach((b) => {
        logoMap[b.name.toLowerCase()] = b.logo_url;
      });

      const slugMap: Record<string, string> = {};
      brandCollections?.forEach((c) => {
        slugMap[c.name.toLowerCase()] = c.slug;
      });

      const brandsArray: Brand[] = Object.entries(brandCounts)
        .map(([name, count]) => ({
          name,
          slug: slugMap[name.toLowerCase()] || createSlug(name),
          productCount: count,
          logo_url: logoMap[name.toLowerCase()] || null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return brandsArray;
    }
  });

  // Fix 5: Only brands with logos in carousel
  const featuredBrands = useMemo(() => {
    if (!brands) return [];
    return [...brands]
      .filter(b => b.logo_url)
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 20);
  }, [brands]);

  const groupedBrands = useMemo(() => {
    if (!brands) return {};
    
    const groups: Record<string, Brand[]> = {};
    
    brands.forEach(brand => {
      const firstChar = brand.name.charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
      
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(brand);
    });
    
    return groups;
  }, [brands]);

  // Fix 1: Filter brands by search
  const filteredGroupedBrands = useMemo(() => {
    if (!searchQuery.trim()) return groupedBrands;
    
    const query = searchQuery.toLowerCase();
    const filtered: Record<string, Brand[]> = {};
    
    Object.entries(groupedBrands).forEach(([letter, letterBrands]) => {
      const matching = letterBrands.filter(b => 
        b.name.toLowerCase().includes(query)
      );
      if (matching.length > 0) {
        filtered[letter] = matching;
      }
    });
    
    return filtered;
  }, [groupedBrands, searchQuery]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollToLetter = (letter: string) => {
    setActiveLetter(letter);
    const element = document.getElementById(`brand-section-${letter}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Thương Hiệu Thú Cưng | Paddy.vn</title>
        <meta 
          name="description" 
          content="Khám phá 200+ thương hiệu thức ăn, đồ chơi và phụ kiện cho chó mèo tại Paddy.vn. Royal Canin, Pedigree, CattyMan và nhiều hơn nữa." 
        />
      </Helmet>

      <Header />
      
      <main className="flex-1">
        {/* Fix 3 & 4: Page title + Featured Brands Carousel */}
        <section className="pb-8">
          <div className="container mx-auto px-4 pt-6 pb-4">
            <h1 className="text-2xl md:text-3xl font-bold">Thương Hiệu Thú Cưng</h1>
            <p className="text-muted-foreground mt-1">
              {brands?.length || 200}+ thương hiệu chính hãng tại Paddy
            </p>
          </div>

          <div className="container mx-auto px-4">
            <h2 className="text-lg font-semibold mb-4">Thương hiệu nổi bật</h2>
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background shadow-md"
                onClick={() => scrollCarousel('left')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div
                ref={carouselRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide px-12"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-48">
                      <Skeleton className="h-32 w-full rounded-lg" />
                    </div>
                  ))
                ) : (
                  featuredBrands?.map((brand) => (
                    <Link
                      key={brand.name}
                      to={`/collections/${brand.slug}`}
                      className="flex-shrink-0 w-48 border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all bg-background"
                    >
                      <div className="h-16 flex items-center justify-center mb-2">
                        <img 
                          src={brand.logo_url!} 
                          alt={brand.name}
                          className="max-h-14 max-w-full object-contain"
                        />
                      </div>
                      <p className="text-sm text-center text-muted-foreground">
                        {brand.productCount} sản phẩm
                      </p>
                    </Link>
                  ))
                )}
              </div>
              
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background shadow-md"
                onClick={() => scrollCarousel('right')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Breadcrumb, Search & Alphabet Filter */}
        <section className="py-6 border-b sticky top-0 bg-background z-20">
          <div className="container mx-auto px-4">
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Trang Chủ</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Thương Hiệu Thú Cưng</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Fix 1: Brand search bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm thương hiệu..."
                className="pl-10 h-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              <Button
                variant={activeLetter === null ? "default" : "ghost"}
                size="sm"
                className="px-3 py-1 h-8 text-xs font-medium"
                onClick={() => {
                  setActiveLetter(null);
                  setSearchQuery("");
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                TẤT CẢ
              </Button>
              {ALPHABET.map((letter) => (
                <Button
                  key={letter}
                  variant={activeLetter === letter ? "default" : "ghost"}
                  size="sm"
                  className="px-3 py-1 h-8 text-xs font-medium min-w-[32px]"
                  onClick={() => scrollToLetter(letter)}
                  disabled={!filteredGroupedBrands[letter]}
                >
                  {letter}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Brands List */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="space-y-8">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-8 w-8" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <Skeleton key={j} className="h-6 w-full" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-10">
                {ALPHABET.map((letter) => {
                  const letterBrands = filteredGroupedBrands[letter];
                  if (!letterBrands || letterBrands.length === 0) return null;

                  return (
                    <div
                      key={letter}
                      id={`brand-section-${letter}`}
                      className="scroll-mt-32"
                    >
                      <h2 className="text-3xl font-bold mb-6 text-foreground">
                        {letter}
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3">
                        {letterBrands.map((brand) => (
                          <Link
                            key={brand.name}
                            to={`/collections/${brand.slug}`}
                            className="text-sm text-foreground hover:text-primary hover:underline transition-colors flex items-center justify-between"
                          >
                            <span>{brand.name}</span>
                            <span className="text-muted-foreground text-xs">({brand.productCount})</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isLoading && brands?.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Chưa có thương hiệu nào.</p>
              </div>
            )}

            {!isLoading && searchQuery && Object.keys(filteredGroupedBrands).length === 0 && brands && brands.length > 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Không tìm thấy thương hiệu "{searchQuery}"</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
