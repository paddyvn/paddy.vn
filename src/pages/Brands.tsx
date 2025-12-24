import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState, useMemo } from "react";
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

// Helper to create slug from brand name
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

  const { data: brands, isLoading } = useQuery({
    queryKey: ['all-brands-from-products'],
    queryFn: async () => {
      // Get all unique brands from products
      const { data: productsData } = await supabase
        .from('products')
        .select('brand')
        .not('brand', 'is', null)
        .neq('brand', '')
        .eq('is_active', true);
      
      if (!productsData) return [];

      // Count occurrences and create unique brand list
      const brandCounts: Record<string, number> = {};
      productsData.forEach((product) => {
        const brand = product.brand?.trim();
        if (brand) {
          brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        }
      });

      // Fetch brand logos from brands table
      const { data: brandsData } = await supabase
        .from('brands')
        .select('name, logo_url')
        .eq('is_active', true);

      // Create a map of brand name to logo
      const logoMap: Record<string, string | null> = {};
      brandsData?.forEach((b) => {
        logoMap[b.name.toLowerCase()] = b.logo_url;
      });

      // Convert to array and sort
      const brandsArray: Brand[] = Object.entries(brandCounts)
        .map(([name, count]) => ({
          name,
          slug: createSlug(name),
          productCount: count,
          logo_url: logoMap[name.toLowerCase()] || null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return brandsArray;
    }
  });

  // Get top brands by product count for carousel
  const featuredBrands = useMemo(() => {
    if (!brands) return [];
    return [...brands]
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 20);
  }, [brands]);

  // Group brands by first letter
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
      <Header />
      
      <main className="flex-1">
        {/* Featured Brands Carousel */}
        <section className="py-8 border-b">
          <div className="container mx-auto px-4">
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
                      to={`/search?brand=${encodeURIComponent(brand.name)}`}
                      className="flex-shrink-0 w-48 border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all bg-background"
                    >
                      <div className="h-16 flex items-center justify-center mb-2">
                        {brand.logo_url ? (
                          <img 
                            src={brand.logo_url} 
                            alt={brand.name}
                            className="max-h-14 max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-lg font-semibold text-center">
                            {brand.name}
                          </span>
                        )}
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

        {/* Breadcrumb & Alphabet Filter */}
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

            <div className="flex flex-wrap gap-1">
              <Button
                variant={activeLetter === null ? "default" : "ghost"}
                size="sm"
                className="px-3 py-1 h-8 text-xs font-medium"
                onClick={() => {
                  setActiveLetter(null);
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
                  disabled={!groupedBrands[letter]}
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
                  const letterBrands = groupedBrands[letter];
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
                            to={`/search?brand=${encodeURIComponent(brand.name)}`}
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
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
