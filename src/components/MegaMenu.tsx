import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMegaMenuData } from "@/hooks/useMegaMenuData";
import giftCardPromo from "@/assets/gift-card-promo.jpg";

interface MegaMenuProps {
  menuSlug: string;
  fallbackPromoImage?: string;
}

export const MegaMenu = ({ menuSlug, fallbackPromoImage }: MegaMenuProps) => {
  const { data: menuData, isLoading } = useMegaMenuData(menuSlug);

  // Fetch popular brands from database
  const { data: brands } = useQuery({
    queryKey: ["mega-menu-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, image_url")
        .eq("collection_type", "brand")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(6);
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !menuData) {
    return null;
  }

  const promoImage = menuData.promo_image_url || fallbackPromoImage;

  return (
    <div className="absolute left-0 top-full w-full bg-background shadow-lg border-t border-border z-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Left Side - Menu Columns + Bottom Section */}
          <div className="flex-1 flex flex-col">
            {/* Menu Columns */}
            <div className="grid grid-cols-5 gap-8">
              {menuData.columns.map((column) => (
                <div key={column.id} className="space-y-3">
                  <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
                    {column.title}
                  </h3>
                  <ul className="space-y-2">
                    {column.items.map((item) => (
                      <li key={item.id}>
                        <Link
                          to={item.link}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {column.shop_all_link && (
                    <Link
                      to={column.shop_all_link}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline pt-2"
                    >
                      Shop All {column.title}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Section - Gift Cards & Popular Brands */}
            <div className="mt-6 pt-6 border-t border-border flex gap-10">
              {/* Gift Cards */}
              <div className="flex-shrink-0">
                <h4 className="text-sm font-bold text-foreground mb-3">Gift Cards</h4>
                <Link 
                  to="/collections/gift-cards" 
                  className="block group"
                >
                  <img 
                    src={giftCardPromo} 
                    alt="Gift Cards" 
                    className="w-44 h-24 object-cover rounded-xl group-hover:scale-105 transition-transform"
                  />
                </Link>
              </div>

              {/* Popular Brands */}
              <div className="flex-1">
                <h4 className="text-sm font-bold text-foreground mb-3">Popular Brands</h4>
                <div className="flex items-center gap-4">
                  {brands?.map((brand) => (
                    <Link
                      key={brand.id}
                      to={`/collections/${brand.slug}`}
                      className="flex-shrink-0 w-20 h-20 rounded-xl bg-white flex items-center justify-center hover:opacity-80 transition-opacity overflow-hidden"
                    >
                      {brand.image_url ? (
                        <img
                          src={brand.image_url}
                          alt={brand.name}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground text-center px-1">
                          {brand.name}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Promo Banner (full height) */}
          {promoImage && (
            <div className="w-52 flex-shrink-0">
              <Link
                to={menuData.promo_link || "#"}
                className="block relative rounded-xl overflow-hidden h-full group"
              >
                <img
                  src={promoImage}
                  alt={menuData.promo_title || "Promotion"}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                  {menuData.promo_badge && (
                    <span className="self-start bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                      {menuData.promo_badge}
                    </span>
                  )}
                  <div className="text-white">
                    {menuData.promo_title && (
                      <h4 className="text-xl font-bold leading-tight">{menuData.promo_title}</h4>
                    )}
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-2 group-hover:underline">
                      Shop Now
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
