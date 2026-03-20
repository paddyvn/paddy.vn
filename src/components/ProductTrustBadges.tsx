import { useProductBadgeLinks } from "@/hooks/useProductBadges";
import {
  CheckCircle, Leaf, Truck, Award, Shield, ShieldCheck, Heart,
  Star, ThumbsUp, Zap, Clock, Recycle, BadgeCheck, Gift,
  Package, Sparkles, Lock, Eye, Flame, Crown,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  CheckCircle, Leaf, Truck, Award, Shield, ShieldCheck, Heart,
  Star, ThumbsUp, Zap, Clock, Recycle, BadgeCheck, Gift,
  Package, Sparkles, Lock, Eye, Flame, Crown,
};

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
        const IconComponent = iconMap[badge.icon as string];
        
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