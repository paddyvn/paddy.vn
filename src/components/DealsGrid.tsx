import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { usePromotions } from "@/hooks/usePromotions";
import { Skeleton } from "@/components/ui/skeleton";

export const DealsGrid = () => {
  const { data: promotions, isLoading } = usePromotions();

  const getLink = (promo: { promo_type: string; link_type: string; link_destination: string }) => {
    // Special promo types with dedicated pages
    if (promo.promo_type === "flash_sale") return "/flash-sale";
    if (promo.promo_type === "subscription_deals") return "/subscription-deals";

    // Other types use collections
    if (promo.link_destination) {
      return `/collections/${promo.link_destination}`;
    }

    // Fallback to collections with promo_type slug
    return `/collections/${promo.promo_type.replace("_", "-")}`;
  };

  if (isLoading) {
    return (
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl max-w-[180px]" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!promotions || promotions.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">Year-end Deals at Paddy</h2>
          <Link 
            to="/promotions" 
            className="flex items-center gap-1 text-primary font-medium hover:opacity-80 transition-opacity"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {promotions.map((promo) => (
            <Link
              key={promo.id}
              to={getLink(promo)}
              className="group relative aspect-square rounded-xl overflow-hidden hover:scale-105 transition-smooth max-w-[180px] shadow-card"
              style={{
                background: `linear-gradient(to bottom right, ${promo.gradient_from}, ${promo.gradient_to})`,
              }}
            >
              {/* Decorative paw patterns */}
              <svg 
                className="absolute -top-2 -right-2 w-16 h-16 text-white/20 rotate-12"
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <ellipse cx="12" cy="17" rx="4" ry="3.5" />
                <ellipse cx="5.5" cy="10" rx="2.5" ry="2" />
                <ellipse cx="18.5" cy="10" rx="2.5" ry="2" />
                <ellipse cx="8" cy="6" rx="2" ry="1.8" />
                <ellipse cx="16" cy="6" rx="2" ry="1.8" />
              </svg>
              <svg 
                className="absolute -bottom-3 -left-3 w-20 h-20 text-white/15 -rotate-45"
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <ellipse cx="12" cy="17" rx="4" ry="3.5" />
                <ellipse cx="5.5" cy="10" rx="2.5" ry="2" />
                <ellipse cx="18.5" cy="10" rx="2.5" ry="2" />
                <ellipse cx="8" cy="6" rx="2" ry="1.8" />
                <ellipse cx="16" cy="6" rx="2" ry="1.8" />
              </svg>
              
              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-3 text-center">
                <p className="text-white text-sm md:text-base font-bold whitespace-pre-line leading-tight drop-shadow-md">
                  {promo.title}
                </p>
                {promo.subtitle && (
                  <p className="text-white/90 text-xs md:text-sm mt-1 drop-shadow-md">
                    {promo.subtitle}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
