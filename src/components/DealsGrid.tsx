import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { usePromotions } from "@/hooks/usePromotions";
import { Skeleton } from "@/components/ui/skeleton";
import { DogIcon, CatIcon, DogFace2Icon, CatFace2Icon, PawIcon, BoneIcon, FishIcon } from "@/components/PaddyIconPatterns";

interface CustomIcon {
  position: "top_left" | "top_right" | "bottom_left" | "bottom_right";
  url: string;
}

const positionStyles: Record<string, string> = {
  top_left: "-top-2 -left-2",
  top_right: "-top-2 -right-2",
  bottom_left: "-bottom-2 -left-2",
  bottom_right: "-bottom-2 -right-2",
};

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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {promotions.slice(0, 6).map((promo, index) => (
            <Link
              key={promo.id}
              to={getLink(promo)}
              className={`group relative aspect-square rounded-xl overflow-hidden hover:scale-105 transition-smooth max-w-[180px] shadow-card ${index >= 4 ? 'hidden md:block' : ''}`}
              style={{
                background: `linear-gradient(to bottom right, ${promo.gradient_from}, ${promo.gradient_to})`,
              }}
            >
              {/* Decorative brand pattern icons - only render if explicitly set */}
              {(() => {
                // Check for custom_icons first
                const customIcons = Array.isArray(promo.custom_icons) ? promo.custom_icons as CustomIcon[] : [];
                
                if (customIcons.length > 0) {
                  return customIcons.map((icon) => (
                    <img 
                      key={icon.position}
                      src={icon.url} 
                      alt="" 
                      className={`absolute w-14 h-14 object-contain opacity-20 ${positionStyles[icon.position]}`}
                    />
                  ));
                }
                
                // Only show icons if icon_type is explicitly set
                if (promo.icon_type && iconTypeMap[promo.icon_type]) {
                  const { TopIcon, BottomIcon } = iconTypeMap[promo.icon_type];
                  return (
                    <>
                      <TopIcon className="absolute -top-2 -right-2 w-16 h-16 text-white/15 rotate-12" />
                      <BottomIcon className="absolute -bottom-3 -left-3 w-14 h-14 text-white/10 -rotate-12" />
                    </>
                  );
                }
                
                // No icons if nothing is set
                return null;
              })()}
              
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
