import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";

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
      <div className="bg-white text-primary font-bold text-lg md:text-xl px-2 md:px-3 py-1 rounded-md min-w-[40px] text-center shadow-sm">
        {String(value).padStart(2, "0")}
      </div>
      <span className="text-white/80 text-xs mt-1">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <TimeBox value={timeLeft.days} label="Ngày" />
      <span className="text-white text-xl font-bold">:</span>
      <TimeBox value={timeLeft.hours} label="Giờ" />
      <span className="text-white text-xl font-bold">:</span>
      <TimeBox value={timeLeft.minutes} label="Phút" />
      <span className="text-white text-xl font-bold">:</span>
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
    queryKey: ["flash-sale-products", flashSale?.link_destination],
    enabled: !!flashSale?.link_destination,
    queryFn: async () => {
      // Fetch products from the flash sale collection
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_images(image_url, is_primary, display_order),
          product_variants(id, price, compare_at_price)
        `)
        .eq("is_active", true)
        .limit(8);

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
        {/* Flash Sale Banner */}
        <div
          className="rounded-xl p-6 mb-6"
          style={{
            background: `linear-gradient(135deg, ${flashSale?.gradient_from || "#EF4444"}, ${flashSale?.gradient_to || "#F59E0B"})`,
          }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full">
                <Zap className="h-8 w-8 text-white fill-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                  ⚡ {flashSale?.title || "Flash Sale"}
                </h2>
                {flashSale?.subtitle && (
                  <p className="text-white/90 text-sm md:text-base">
                    {flashSale.subtitle}
                  </p>
                )}
              </div>
            </div>

            {flashSale?.end_date && (
              <div className="flex flex-col items-center md:items-end gap-2">
                <span className="text-white/80 text-sm">Kết thúc sau:</span>
                <CountdownTimer endDate={flashSale.end_date} />
              </div>
            )}
          </div>
        </div>

        {/* Flash Sale Products */}
        {isLoadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {products.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {flashSale?.link_destination && (
              <div className="flex justify-center mt-6">
                <Link
                  to={`/collections/${flashSale.link_destination}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity"
                >
                  Xem tất cả Flash Sale
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
};
