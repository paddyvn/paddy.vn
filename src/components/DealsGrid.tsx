import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { usePromotions } from "@/hooks/usePromotions";
import { Skeleton } from "@/components/ui/skeleton";

export const DealsGrid = () => {
  const { data: promotions, isLoading } = usePromotions();

  const getLink = (linkType: string, linkDestination: string) => {
    switch (linkType) {
      case "collection":
        return `/collections/${linkDestination}`;
      case "product":
        return `/products/${linkDestination}`;
      case "page":
        return `/pages/${linkDestination}`;
      case "external":
        return linkDestination;
      default:
        return `/collections/${linkDestination}`;
    }
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
            to="/collections/deals" 
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
              to={getLink(promo.link_type, promo.link_destination)}
              className="group relative aspect-square rounded-xl overflow-hidden hover:scale-105 transition-smooth max-w-[180px] shadow-card"
              style={{
                background: `linear-gradient(to bottom right, ${promo.gradient_from}, ${promo.gradient_to})`,
              }}
            >
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-6 h-6 bg-white/20 rounded-br-xl"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-white/20 rounded-tl-xl"></div>
              
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
