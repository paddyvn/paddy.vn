import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import giftCardPromo from "@/assets/gift-card-promo.jpg";

interface MenuColumn {
  title: string;
  items: { label: string; href: string }[];
  shopAllHref: string;
}

interface MegaMenuProps {
  columns: MenuColumn[];
  promoImage?: string;
  promoTitle?: string;
  promoSubtitle?: string;
  promoBadge?: string;
  promoHref?: string;
  giftCardImage?: string;
}

export const MegaMenu = ({
  columns,
  promoImage,
  promoTitle,
  promoSubtitle,
  promoBadge,
  promoHref,
  giftCardImage,
}: MegaMenuProps) => {
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

  return (
    <div className="absolute left-0 top-full w-full bg-background shadow-lg border-t border-border z-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Left Side - Menu Columns + Bottom Section */}
          <div className="flex-1 flex flex-col">
            {/* Menu Columns */}
            <div className="grid grid-cols-5 gap-8">
              {columns.map((column, index) => (
                <div key={index} className="space-y-3">
                  <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
                    {column.title}
                  </h3>
                  <ul className="space-y-2">
                    {column.items.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        <Link
                          to={item.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={column.shopAllHref}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline pt-2"
                  >
                    Shop All {column.title}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
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
                      className="flex-shrink-0 w-20 h-20 rounded-xl bg-white border border-border flex items-center justify-center hover:border-primary transition-colors overflow-hidden"
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
                to={promoHref || "#"}
                className="block relative rounded-xl overflow-hidden h-full group"
              >
                <img
                  src={promoImage}
                  alt={promoTitle || "Promotion"}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                  {promoBadge && (
                    <span className="self-start bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                      {promoBadge}
                    </span>
                  )}
                  <div className="text-white">
                    {promoTitle && (
                      <h4 className="text-xl font-bold leading-tight">{promoTitle}</h4>
                    )}
                    {promoSubtitle && (
                      <p className="text-sm opacity-90 mt-1">{promoSubtitle}</p>
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

// Dog menu data
export const dogMenuColumns: MenuColumn[] = [
  {
    title: "Dog Food",
    items: [
      { label: "Dry Food", href: "/collections/dog-dry-food" },
      { label: "Wet Food", href: "/collections/dog-wet-food" },
      { label: "Treats", href: "/collections/dog-treats" },
      { label: "Grain-Free", href: "/collections/dog-grain-free" },
      { label: "Puppy Food", href: "/collections/puppy-food" },
      { label: "Senior Dog Food", href: "/collections/senior-dog-food" },
    ],
    shopAllHref: "/collections/dog-food",
  },
  {
    title: "Dog Toys",
    items: [
      { label: "Chew Toys", href: "/collections/dog-chew-toys" },
      { label: "Plush Toys", href: "/collections/dog-plush-toys" },
      { label: "Interactive Toys", href: "/collections/dog-interactive-toys" },
      { label: "Balls & Launchers", href: "/collections/dog-balls" },
      { label: "Rope Toys", href: "/collections/dog-rope-toys" },
      { label: "Tough Toys", href: "/collections/dog-tough-toys" },
    ],
    shopAllHref: "/collections/dog-toys",
  },
  {
    title: "Dog Beds",
    items: [
      { label: "Orthopedic Beds", href: "/collections/dog-orthopedic-beds" },
      { label: "Bolster Beds", href: "/collections/dog-bolster-beds" },
      { label: "Crate Beds", href: "/collections/dog-crate-beds" },
      { label: "Mats & Rugs", href: "/collections/dog-mats" },
      { label: "Cooling Beds", href: "/collections/dog-cooling-beds" },
      { label: "Blankets", href: "/collections/dog-blankets" },
    ],
    shopAllHref: "/collections/dog-beds",
  },
  {
    title: "Apparel",
    items: [
      { label: "Coats & Jackets", href: "/collections/dog-coats" },
      { label: "Sweaters", href: "/collections/dog-sweaters" },
      { label: "Bandanas", href: "/collections/dog-bandanas" },
      { label: "Boots & Pawwear", href: "/collections/dog-boots" },
      { label: "Life Jackets", href: "/collections/dog-life-jackets" },
      { label: "Collars & Leashes", href: "/collections/dog-collars" },
    ],
    shopAllHref: "/collections/dog-apparel",
  },
  {
    title: "Health",
    items: [
      { label: "Vitamins", href: "/collections/dog-vitamins" },
      { label: "Supplements", href: "/collections/dog-supplements" },
      { label: "Dental Care", href: "/collections/dog-dental" },
      { label: "Flea & Tick", href: "/collections/dog-flea-tick" },
      { label: "Grooming", href: "/collections/dog-grooming" },
      { label: "Calming Aids", href: "/collections/dog-calming" },
    ],
    shopAllHref: "/collections/dog-health",
  },
];

// Cat menu data
export const catMenuColumns: MenuColumn[] = [
  {
    title: "Cat Food",
    items: [
      { label: "Dry Food", href: "/collections/cat-dry-food" },
      { label: "Wet Food", href: "/collections/cat-wet-food" },
      { label: "Treats", href: "/collections/cat-treats" },
      { label: "Grain-Free", href: "/collections/cat-grain-free" },
      { label: "Kitten Food", href: "/collections/kitten-food" },
      { label: "Senior Cat Food", href: "/collections/senior-cat-food" },
    ],
    shopAllHref: "/collections/cat-food",
  },
  {
    title: "Cat Toys",
    items: [
      { label: "Feather Toys", href: "/collections/cat-feather-toys" },
      { label: "Laser Toys", href: "/collections/cat-laser-toys" },
      { label: "Interactive Toys", href: "/collections/cat-interactive-toys" },
      { label: "Catnip Toys", href: "/collections/cat-catnip-toys" },
      { label: "Balls & Chasers", href: "/collections/cat-balls" },
      { label: "Tunnels", href: "/collections/cat-tunnels" },
    ],
    shopAllHref: "/collections/cat-toys",
  },
  {
    title: "Cat Beds",
    items: [
      { label: "Cat Trees", href: "/collections/cat-trees" },
      { label: "Cat Caves", href: "/collections/cat-caves" },
      { label: "Window Perches", href: "/collections/cat-window-perches" },
      { label: "Heated Beds", href: "/collections/cat-heated-beds" },
      { label: "Bolster Beds", href: "/collections/cat-bolster-beds" },
      { label: "Blankets", href: "/collections/cat-blankets" },
    ],
    shopAllHref: "/collections/cat-beds",
  },
  {
    title: "Litter & Hygiene",
    items: [
      { label: "Litter Boxes", href: "/collections/cat-litter-boxes" },
      { label: "Cat Litter", href: "/collections/cat-litter" },
      { label: "Litter Mats", href: "/collections/cat-litter-mats" },
      { label: "Waste Disposal", href: "/collections/cat-waste-disposal" },
      { label: "Odor Control", href: "/collections/cat-odor-control" },
      { label: "Litter Scoops", href: "/collections/cat-litter-scoops" },
    ],
    shopAllHref: "/collections/cat-litter",
  },
  {
    title: "Health",
    items: [
      { label: "Vitamins", href: "/collections/cat-vitamins" },
      { label: "Supplements", href: "/collections/cat-supplements" },
      { label: "Dental Care", href: "/collections/cat-dental" },
      { label: "Flea & Tick", href: "/collections/cat-flea-tick" },
      { label: "Grooming", href: "/collections/cat-grooming" },
      { label: "Calming Aids", href: "/collections/cat-calming" },
    ],
    shopAllHref: "/collections/cat-health",
  },
];
