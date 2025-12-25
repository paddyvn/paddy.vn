import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlashSaleProductCard } from "@/components/FlashSaleProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { useFlashSaleSoldCounts } from "@/hooks/useFlashSaleSoldCounts";

interface FlashSalePromotion {
  id: string;
  title: string;
  subtitle: string | null;
  gradient_from: string;
  gradient_to: string;
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
      <div className="bg-white text-primary font-bold text-lg md:text-2xl px-3 py-1 rounded-lg min-w-[48px] md:min-w-[60px] text-center shadow-sm">
        {String(value).padStart(2, "0")}
      </div>
      <span className="text-white/80 text-xs mt-1">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <TimeBox value={timeLeft.days} label="Ngày" />
      <span className="text-white text-2xl font-bold">:</span>
      <TimeBox value={timeLeft.hours} label="Giờ" />
      <span className="text-white text-2xl font-bold">:</span>
      <TimeBox value={timeLeft.minutes} label="Phút" />
      <span className="text-white text-2xl font-bold">:</span>
      <TimeBox value={timeLeft.seconds} label="Giây" />
    </div>
  );
};

const FlashSale = () => {
  const { data: flashSale, isLoading: isLoadingPromo } = useQuery({
    queryKey: ["flash-sale-page-active"],
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
    queryKey: ["flash-sale-page-products", flashSale?.id],
    enabled: !!flashSale?.id,
    queryFn: async () => {
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
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
  });

  const productIds = products?.map((p) => p.id) || [];
  const { data: soldCounts } = useFlashSaleSoldCounts(
    productIds,
    flashSale?.start_date || null,
    flashSale?.end_date || null
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {isLoadingPromo ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          </div>
        ) : !flashSale ? (
          <div className="text-center py-16">
            <Zap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Không có Flash Sale</h1>
            <p className="text-muted-foreground">Hiện tại không có chương trình Flash Sale nào đang diễn ra.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Flash Sale Header Banner */}
            <div
              className="rounded-xl p-6 md:p-8"
              style={{
                background: `linear-gradient(135deg, ${flashSale.gradient_from || "#EF4444"}, ${flashSale.gradient_to || "#F59E0B"})`,
              }}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Zap className="h-8 w-8 text-white fill-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                      ⚡ {flashSale.title}
                    </h1>
                    {flashSale.subtitle && (
                      <p className="text-white/90 text-sm md:text-base mt-1">
                        {flashSale.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {flashSale.end_date && (
                  <div className="flex flex-col items-center md:items-end gap-2">
                    <span className="text-white/80 text-sm">Kết thúc sau:</span>
                    <CountdownTimer endDate={flashSale.end_date} />
                  </div>
                )}
              </div>
            </div>

            {/* Products Grid */}
            {isLoadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {products.map((product) => (
                  <FlashSaleProductCard key={product.id} product={product} soldCount={soldCounts?.[product.id] || 0} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Không có sản phẩm nào trong chương trình Flash Sale này.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FlashSale;
