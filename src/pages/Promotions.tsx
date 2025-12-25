import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usePromotions } from "@/hooks/usePromotions";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "lucide-react";
import { DogIcon, CatIcon, DogFace2Icon, CatFace2Icon, PawIcon, BoneIcon, FishIcon } from "@/components/PaddyIconPatterns";

// Map icon_type to icon components
const iconTypeMap: Record<string, { TopIcon: React.FC<{ className?: string }>; BottomIcon: React.FC<{ className?: string }> }> = {
  dog_cat: { TopIcon: DogIcon, BottomIcon: CatIcon },
  cat_dog: { TopIcon: CatIcon, BottomIcon: DogIcon },
  dog_face_2: { TopIcon: DogFace2Icon, BottomIcon: CatFace2Icon },
  paw_bone: { TopIcon: PawIcon, BottomIcon: BoneIcon },
  bone_paw: { TopIcon: BoneIcon, BottomIcon: PawIcon },
  fish_paw: { TopIcon: FishIcon, BottomIcon: PawIcon },
};

// Fallback cycling for promotions without icon_type
const iconPatterns = [
  { TopIcon: DogIcon, BottomIcon: CatIcon },
  { TopIcon: CatIcon, BottomIcon: DogIcon },
  { TopIcon: DogFace2Icon, BottomIcon: CatFace2Icon },
  { TopIcon: PawIcon, BottomIcon: BoneIcon },
];

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
                {(() => {
                  // Use icon_type from database if set, otherwise fallback to cycling
                  const iconConfig = promo.icon_type && iconTypeMap[promo.icon_type]
                    ? iconTypeMap[promo.icon_type]
                    : iconPatterns[(activePromotions?.indexOf(promo) ?? 0) % iconPatterns.length];
                  const { TopIcon, BottomIcon } = iconConfig;
                  return (
                    <>
                      <TopIcon className="absolute -top-3 -right-3 w-24 h-24 text-white/15 rotate-12" />
                      <BottomIcon className="absolute -bottom-4 -left-4 w-20 h-20 text-white/10 -rotate-12" />
                    </>
                  );
                })()}
                
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
