import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CategoryIllustration } from "@/components/CategoryIllustrations";
import { useActiveHomepageCategories } from "@/hooks/useHomepageCategories";

const PET_TABS = [
  { id: "dog" as const, label: "Chó", emoji: "🐕" },
  { id: "cat" as const, label: "Mèo", emoji: "🐈" },
];

export const Categories = () => {
  const [activePet, setActivePet] = useState<"dog" | "cat">("dog");
  const { data: categories = [] } = useActiveHomepageCategories(activePet);

  return (
    <section className="py-6 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-xl md:text-2xl font-bold text-primary">
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
                to={cat.icon === "deals" ? "/khuyen-mai" : `/collections/${cat.slug}`}
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
