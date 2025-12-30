import { useProductBadgeLinks, ProductBadge } from "@/hooks/useProductBadges";
import { icons, LucideIcon } from "lucide-react";

interface ProductTrustBadgesProps {
  productId: string | undefined;
}

export function ProductTrustBadges({ productId }: ProductTrustBadgesProps) {
  const { data: badges = [], isLoading } = useProductBadgeLinks(productId);

  if (isLoading || badges.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-4 pt-4">
      {badges.map((badge) => {
        const IconComponent = icons[badge.icon as keyof typeof icons] as LucideIcon;
        
        return (
          <div key={badge.id} className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: badge.bg_color }}
            >
              {IconComponent && (
                <IconComponent 
                  className="h-5 w-5" 
                  style={{ color: badge.icon_color }}
                />
              )}
            </div>
            <span className="text-sm font-medium">
              {badge.name_vi || badge.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
