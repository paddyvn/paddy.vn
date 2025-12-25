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
                to={getLink(promo)}
                className="group relative aspect-square rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${promo.gradient_from}, ${promo.gradient_to})`,
                }}
              >
                {/* Decorative brand pattern icons */}
                {/* Paw icon - top right */}
                <svg 
                  className="absolute -top-3 -right-3 w-20 h-20 text-white/15 rotate-12"
                  viewBox="0 0 100 100" 
                  fill="currentColor"
                >
                  <ellipse cx="50" cy="65" rx="22" ry="18" />
                  <circle cx="25" cy="35" r="12" />
                  <circle cx="75" cy="35" r="12" />
                  <circle cx="35" cy="18" r="10" />
                  <circle cx="65" cy="18" r="10" />
                </svg>
                {/* Bone icon - bottom left */}
                <svg 
                  className="absolute -bottom-4 -left-4 w-24 h-24 text-white/10 -rotate-45"
                  viewBox="0 0 100 50" 
                  fill="currentColor"
                >
                  <circle cx="15" cy="12" r="10" />
                  <circle cx="15" cy="38" r="10" />
                  <circle cx="85" cy="12" r="10" />
                  <circle cx="85" cy="38" r="10" />
                  <rect x="15" y="15" width="70" height="20" rx="3" />
                </svg>
                {/* Fish icon - top left small */}
                <svg 
                  className="absolute top-4 left-3 w-10 h-10 text-white/10 rotate-12"
                  viewBox="0 0 100 60" 
                  fill="currentColor"
                >
                  <ellipse cx="45" cy="30" rx="35" ry="22" />
                  <polygon points="85,30 100,10 100,50" />
                  <circle cx="25" cy="25" r="4" fill="currentColor" opacity="0.5" />
                </svg>
                
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
