import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CategoryIllustration } from "@/components/CategoryIllustrations";

const PET_TABS = [
  { id: "dog" as const, label: "Chó", emoji: "🐕" },
  { id: "cat" as const, label: "Mèo", emoji: "🐈" },
];

const CATEGORIES = {
  dog: [
    { name: "Thức Ăn Hạt", slug: "hat-cho-cho", icon: "dryfood" },
    { name: "Pate", slug: "pate-cho", icon: "wetfood" },
    { name: "Bánh Thưởng", slug: "banh-thuong-cho-cho", icon: "treat" },
    { name: "Đồ Chơi", slug: "do-choi-cho-cho", icon: "toy" },
    { name: "Dây Dắt", slug: "vong-co-day-dat", icon: "leash" },
    { name: "Quần Áo", slug: "thoi-trang-cho-meo", icon: "clothing" },
    { name: "Nệm & Chuồng", slug: "nem-chuong-cho", icon: "bed" },
    { name: "Bát & Bình", slug: "bat-binh-nuoc", icon: "bowl" },
    { name: "Vệ Sinh", slug: "ve-sinh-cho", icon: "hygiene" },
    { name: "Sức Khỏe", slug: "suc-khoe-cho", icon: "health" },
    { name: "Tã & Bỉm", slug: "ta-bim-cho", icon: "pad" },
    { name: "Khuyến Mãi", slug: "promotions", icon: "deals" },
  ],
  cat: [
    { name: "Thức Ăn Hạt", slug: "hat-cho-meo", icon: "dryfood" },
    { name: "Pate", slug: "pate-cho-meo", icon: "wetfood" },
    { name: "Bánh Thưởng", slug: "banh-thuong-cho-meo", icon: "treat" },
    { name: "Đồ Chơi", slug: "do-choi-cho-meo", icon: "toy" },
    { name: "Cát Vệ Sinh", slug: "cat-litter", icon: "litter" },
    { name: "Nhà Mèo", slug: "cat-trees", icon: "cattree" },
    { name: "Balo Vận Chuyển", slug: "balo-meo", icon: "carrier" },
    { name: "Bát & Bình", slug: "bat-binh-nuoc-meo", icon: "bowl" },
    { name: "Vệ Sinh", slug: "ve-sinh-meo", icon: "hygiene" },
    { name: "Sức Khỏe", slug: "suc-khoe-meo", icon: "health" },
    { name: "Quần Áo", slug: "quan-ao-meo", icon: "clothing" },
    { name: "Khuyến Mãi", slug: "promotions", icon: "deals" },
  ],
};

export const Categories = () => {
  const [activePet, setActivePet] = useState<"dog" | "cat">("dog");
  const categories = CATEGORIES[activePet];

  return (
    <section className="py-6 md:py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-2xl font-extrabold text-foreground">
            Mua sắm theo danh mục
          </h2>
          <div className="flex gap-1 bg-background rounded-xl p-[3px] shadow-card">
            {PET_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePet(tab.id)}
                className={cn(
                  "px-4 py-1.5 rounded-[9px] border-none text-[13.5px] font-bold cursor-pointer transition-all duration-200 flex items-center gap-1.5",
                  activePet === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="text-sm">{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {categories.map((cat) => {
            const isDeals = cat.icon === "deals";
            return (
              <Link
                key={cat.slug}
                to={cat.icon === "deals" ? "/promotions" : `/collections/${cat.slug}`}
                className={cn(
                  "flex flex-col items-center px-1 py-2.5 sm:px-2 sm:py-4 bg-background rounded-2xl transition-all duration-250 cursor-pointer group",
                  "hover:border-primary hover:shadow-hover hover:-translate-y-1 active:translate-y-0 active:scale-[0.97]",
                  isDeals
                    ? "border-2 border-secondary"
                    : "border-[1.5px] border-transparent"
                )}
              >
                <div
                  className={cn(
                    "w-16 h-16 sm:w-[88px] sm:h-[88px] rounded-full flex items-center justify-center p-1.5 sm:p-2.5 shrink-0 transition-transform duration-300 group-hover:scale-[1.08]",
                    isDeals
                      ? "bg-gradient-to-br from-[hsl(55,100%,95%)] to-[hsl(48,100%,93%)]"
                      : "bg-gradient-to-br from-[hsl(235,67%,95%)] to-muted"
                  )}
                >
                  <CategoryIllustration type={cat.icon} />
                </div>
                <div
                  className={cn(
                    "mt-2.5 text-xs sm:text-[13px] font-bold text-center leading-tight",
                    isDeals ? "text-[hsl(45,100%,35%)]" : "text-foreground"
                  )}
                >
                  {cat.name}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
