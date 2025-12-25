import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usePromotions } from "@/hooks/usePromotions";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "lucide-react";

const Promotions = () => {
  const { data: promotions, isLoading } = usePromotions();

  // Filter only active promotions within date range
  const now = new Date();
  const activePromotions = promotions?.filter((promo) => {
    if (!promo.is_active) return false;
    if (promo.start_date && new Date(promo.start_date) > now) return false;
    if (promo.end_date && new Date(promo.end_date) < now) return false;
    return true;
  });

  const getLink = (linkType: string, linkDestination: string) => {
    switch (linkType) {
      case "collection":
        return `/collections/${linkDestination}`;
      case "product":
        return `/products/${linkDestination}`;
      case "page":
        return `/pages/${linkDestination}`;
      case "flash_sale":
        return "/flash-sale";
      case "external":
        return linkDestination;
      default:
        return `/collections/${linkDestination}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Tag className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Khuyến mãi đang diễn ra
            </h1>
            <p className="text-muted-foreground">
              Khám phá các ưu đãi hấp dẫn dành cho thú cưng của bạn
            </p>
          </div>
        </div>

        {/* Promotions Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        ) : activePromotions && activePromotions.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {activePromotions.map((promo) => (
              <Link
                key={promo.id}
                to={getLink(promo.link_type, promo.link_destination)}
                className="group relative aspect-square rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${promo.gradient_from}, ${promo.gradient_to})`,
                }}
              >
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-10 h-10 bg-white/20 rounded-br-2xl" />
                <div className="absolute bottom-0 right-0 w-10 h-10 bg-white/20 rounded-tl-2xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                
                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 text-center">
                  <p className="text-white text-lg md:text-xl font-bold whitespace-pre-line leading-tight drop-shadow-lg">
                    {promo.title}
                  </p>
                  {promo.subtitle && (
                    <p className="text-white/90 text-sm md:text-base mt-2 drop-shadow-md">
                      {promo.subtitle}
                    </p>
                  )}
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Tag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              Hiện không có chương trình khuyến mãi nào đang diễn ra
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Promotions;
