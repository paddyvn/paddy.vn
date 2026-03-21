import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { usePromotions } from "@/hooks/usePromotions";
import { Skeleton } from "@/components/ui/skeleton";
import type { Promotion } from "@/hooks/usePromotions";

function assignSlots(promos: Promotion[]) {
  const hero = promos.find(p => p.layout_slot === "hero");
  const wide = promos.find(p => p.layout_slot === "wide");
  const halves = promos.filter(p => p.layout_slot === "half").slice(0, 2);
  const used = new Set([hero?.id, wide?.id, ...halves.map(h => h.id)].filter(Boolean));
  const rest = promos.filter(p => !used.has(p.id));
  return {
    hero: hero || rest.shift() || null,
    wide: wide || rest.shift() || null,
    halves: halves.length >= 2 ? halves : [...halves, ...rest].slice(0, 2),
  };
}

function getLink(promo: Promotion) {
  if (promo.promo_type === "flash_sale") return "/flash-sale";
  if (promo.promo_type === "subscription_deals") return "/subscription-deals";
  if (promo.link_destination) return `/collections/${promo.link_destination}`;
  return "/promotions";
}

function BentoCard({ promo, slot }: { promo: Promotion | null; slot: string }) {
  if (!promo) return null;
  const hasImage = !!promo.image_url;
  const isDark = hasImage;

  const paddingClass = slot === "hero" ? "p-5" : slot === "half" ? "p-3.5" : "p-4";

  return (
    <Link
      to={getLink(promo)}
      className={`group relative rounded-[14px] overflow-hidden flex text-decoration-none cursor-pointer bg-cover bg-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${slot === "wide" ? "flex-1" : ""}`}
      style={{
        backgroundImage: hasImage ? `url(${promo.image_url})` : "none",
        backgroundColor: hasImage ? "#333" : (promo.bg_color || "#DBEAFE"),
      }}
    >
      {/* Dark overlay for text readability on images */}
      {hasImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-black/45 to-black/15 z-[1]" />
      )}

      <div className={`relative z-[2] ${paddingClass} flex flex-col gap-1 justify-end h-full w-full`}>
        {promo.eyebrow && (
          <span className={`text-[11px] font-semibold ${isDark ? "text-white/80" : "text-foreground/60"}`}>
            {promo.eyebrow}
          </span>
        )}
        <h3
          className={`font-extrabold leading-tight m-0 whitespace-pre-line ${
            slot === "hero" ? "text-[22px]" : slot === "half" ? "text-[15px]" : "text-[17px]"
          } ${isDark ? "text-white drop-shadow-md" : "text-foreground"}`}
        >
          {promo.title}
        </h3>
        <span
          className={`inline-flex text-xs font-bold px-3.5 py-1.5 rounded-full self-start mt-1.5 shadow-sm transition-colors ${
            isDark
              ? "bg-white/95 text-foreground group-hover:bg-white/80"
              : "bg-white text-foreground group-hover:bg-muted"
          }`}
        >
          {promo.cta_text || "Mua ngay"}
        </span>
      </div>
    </Link>
  );
}

export const DealsGrid = () => {
  const { data: promotions, isLoading } = usePromotions();

  if (isLoading) {
    return (
      <section className="py-5 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-2.5 h-auto md:h-[360px]">
            <Skeleton className="rounded-[14px] min-h-[200px]" />
            <div className="flex flex-col gap-2.5">
              <Skeleton className="rounded-[14px] flex-1 min-h-[140px]" />
              <div className="grid grid-cols-2 gap-2.5 flex-1">
                <Skeleton className="rounded-[14px] min-h-[140px]" />
                <Skeleton className="rounded-[14px] min-h-[140px]" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!promotions || promotions.length === 0) return null;

  // Filter to only promotions with display_visibility = 'homepage' or layout_slot set
  const bentoPromos = promotions.filter(
    p => p.layout_slot === "hero" || p.layout_slot === "wide" || p.layout_slot === "half"
  );

  // Fallback: if no bento-assigned promos, use first 4
  const effectivePromos = bentoPromos.length > 0 ? bentoPromos : promotions.slice(0, 4);

  const { hero, wide, halves } = assignSlots(effectivePromos);

  if (!hero && !wide && halves.length === 0) return null;

  return (
    <section className="py-5 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-primary">Ưu đãi tại Paddy</h2>
          <Link
            to="/promotions"
            className="flex items-center gap-1 text-primary font-medium hover:opacity-80 transition-opacity"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
          <BentoCard promo={hero} slot="hero" />
          <div className="flex flex-col gap-2.5">
            <BentoCard promo={wide} slot="wide" />
            <div className="grid grid-cols-2 gap-2.5 flex-1">
              {halves.map(p => (
                <BentoCard key={p.id} promo={p} slot="half" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
