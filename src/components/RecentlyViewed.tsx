import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

interface RecentlyViewedProps {
  userId: string;
}

export const RecentlyViewed = ({ userId }: RecentlyViewedProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["recently-viewed", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recently_viewed")
        .select(`
          product_id,
          viewed_at,
          products:product_id (
            id, name, slug, base_price, compare_at_price, brand, is_featured,
            product_images (image_url, is_primary),
            product_variants (stock_quantity)
          )
        `)
        .eq("user_id", userId)
        .order("viewed_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || [])
        .map((item: any) => item.products)
        .filter(Boolean);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !products || products.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Sản phẩm bạn đã xem
          </h2>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scroll("left")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scroll("right")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product: any) => (
            <div key={product.id} className="min-w-[180px] max-w-[220px] snap-start flex-shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
