import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { FlashSaleProductCard } from "@/components/FlashSaleProductCard";

interface FlashSalePromotion {
  id: string;
  title: string;
  subtitle: string | null;
  gradient_from: string;
  gradient_to: string;
  link_destination: string;
  start_date: string | null;
  end_date: string | null;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer = ({ endDate }: { endDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white text-primary font-bold text-sm md:text-lg px-2 py-0.5 rounded-md min-w-[32px] md:min-w-[40px] text-center shadow-sm">
        {String(value).padStart(2, "0")}
      </div>
      <span className="text-white/80 text-[10px] mt-0.5">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-1.5">
      <TimeBox value={timeLeft.days} label="Ngày" />
      <span className="text-white text-lg font-bold">:</span>
      <TimeBox value={timeLeft.hours} label="Giờ" />
      <span className="text-white text-lg font-bold">:</span>
      <TimeBox value={timeLeft.minutes} label="Phút" />
      <span className="text-white text-lg font-bold">:</span>
      <TimeBox value={timeLeft.seconds} label="Giây" />
    </div>
  );
};

export const FlashSaleSection = () => {
  const { data: flashSale, isLoading: isLoadingPromo } = useQuery({
    queryKey: ["flash-sale-active"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("promo_type", "flash_sale")
        .eq("is_active", true)
        .lte("start_date", now)
        .gte("end_date", now)
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as FlashSalePromotion | null;
    },
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["flash-sale-products", flashSale?.id],
    enabled: !!flashSale?.id,
    queryFn: async () => {
      // Fetch products linked to this flash sale promotion
      const { data: promotionProducts, error: ppError } = await supabase
        .from("promotion_products")
        .select("product_id")
        .eq("promotion_id", flashSale!.id);

      if (ppError) throw ppError;
      if (!promotionProducts || promotionProducts.length === 0) return [];

      const productIds = promotionProducts.map((pp) => pp.product_id);

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_images(image_url, is_primary, display_order),
          product_variants(id, price, compare_at_price)
        `)
        .in("id", productIds)
        .eq("is_active", true)
        .limit(6);

      if (error) throw error;
      return data;
    },
  });

  // Don't show if no active flash sale
  if (!isLoadingPromo && !flashSale) {
    return null;
  }

  if (isLoadingPromo) {
    return (
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4">
        {/* Flash Sale Card with Products Inside */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${flashSale?.gradient_from || "#EF4444"}, ${flashSale?.gradient_to || "#F59E0B"})`,
          }}
        >
          {/* Flash Sale Header */}
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-full">
                  <Zap className="h-6 w-6 text-white fill-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    ⚡ {flashSale?.title || "Flash Sale"}
                  </h2>
                  {flashSale?.subtitle && (
                    <p className="text-white/90 text-sm">
                      {flashSale.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {flashSale?.end_date && (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-white/80 text-xs text-left w-full">Kết thúc sau:</span>
                  <CountdownTimer endDate={flashSale.end_date} />
                  <Link
                    to={flashSale?.link_destination ? `/collections/${flashSale.link_destination}` : "/collections/flash-sale"}
                    className="hidden md:inline-flex items-center gap-1 text-white text-sm font-medium hover:underline mt-1"
                  >
                    Xem tất cả
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Flash Sale Products - Inside the gradient */}
          <div className="px-3 md:px-6 pb-4 md:pb-6">
            {isLoadingProducts ? (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] rounded-xl bg-white/20" />
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                  {products.slice(0, 6).map((product) => (
                    <FlashSaleProductCard key={product.id} product={product} />
                  ))}
                </div>
                {flashSale?.link_destination && (
                  <div className="flex justify-center mt-4 md:hidden">
                    <Link
                      to={`/collections/${flashSale.link_destination}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary rounded-full font-medium text-sm hover:bg-white/90 transition-opacity"
                    >
                      Xem tất cả Flash Sale
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};
