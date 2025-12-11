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
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

const ALPHABET = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'];

export default function Brands() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const { data: brands, isLoading } = useQuery({
    queryKey: ['all-brands'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, image_url')
        .eq('collection_type', 'brand')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      return data as Brand[] || [];
    }
  });

  const { data: featuredBrands } = useQuery({
    queryKey: ['featured-brands'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, image_url')
        .eq('collection_type', 'brand')
        .eq('is_active', true)
        .not('image_url', 'is', null)
        .order('display_order', { ascending: true })
        .limit(20);
      
      return data as Brand[] || [];
    }
  });

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
                      key={brand.id}
                      to={`/collection/${brand.slug}`}
                      className="flex-shrink-0 w-48 border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all bg-background"
                    >
                      <div className="h-24 flex items-center justify-center mb-2">
                        {brand.image_url ? (
                          <img
                            src={brand.image_url}
                            alt={brand.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-lg font-semibold text-center">
                            {brand.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-center text-muted-foreground truncate">
                        {brand.name}
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
                            key={brand.id}
                            to={`/collection/${brand.slug}`}
                            className="text-sm text-foreground hover:text-primary hover:underline transition-colors"
                          >
                            {brand.name}
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
