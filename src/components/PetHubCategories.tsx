import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CategoryIllustration } from "@/components/CategoryIllustrations";
import { useActiveHomepageCategories } from "@/hooks/useHomepageCategories";

interface PetHubCategoriesProps {
  petType: "dog" | "cat";
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
}

export const PetHubCategories = ({
  petType,
  activeSlug,
  onSelect,
}: PetHubCategoriesProps) => {
  const { data: categories = [] } = useActiveHomepageCategories(petType);

  if (categories.length === 0) return null;

  return (
    <section className="container mx-auto px-4 pb-6">
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-3">
          {/* "All" pill */}
          <button
            onClick={() => onSelect(null)}
            className="flex flex-col items-center gap-2 min-w-[80px] group cursor-pointer"
          >
            <div
              className={cn(
                "w-16 h-16 sm:w-[88px] sm:h-[88px] rounded-full flex items-center justify-center p-1.5 sm:p-2.5 shrink-0 transition-all duration-300 group-hover:scale-[1.08]",
                !activeSlug
                  ? "bg-primary/10 ring-2 ring-primary shadow-md"
                  : "bg-gradient-to-br from-[hsl(235,67%,95%)] to-muted"
              )}
            >
              <span className="text-2xl sm:text-3xl">🐾</span>
            </div>
            <span
              className={cn(
                "text-xs sm:text-[13px] font-bold text-center leading-tight",
                !activeSlug ? "text-primary" : "text-foreground"
              )}
            >
              Tất cả
            </span>
          </button>

          {categories.map((cat) => {
            const isActive = activeSlug === cat.slug;
            const isDeals = cat.icon === "deals";

            return (
              <button
                key={cat.slug}
                onClick={() => onSelect(isActive ? null : cat.slug)}
                className="flex flex-col items-center gap-2 min-w-[80px] group cursor-pointer"
              >
                <div
                  className={cn(
                    "w-16 h-16 sm:w-[88px] sm:h-[88px] rounded-full flex items-center justify-center p-1.5 sm:p-2.5 shrink-0 transition-all duration-300 group-hover:scale-[1.08]",
                    isActive
                      ? "ring-2 ring-primary shadow-md"
                      : "",
                    isDeals
                      ? "bg-gradient-to-br from-[hsl(55,100%,95%)] to-[hsl(48,100%,93%)]"
                      : "bg-gradient-to-br from-[hsl(235,67%,95%)] to-muted"
                  )}
                >
                  <CategoryIllustration type={cat.icon} />
                </div>
                <span
                  className={cn(
                    "text-xs sm:text-[13px] font-bold text-center leading-tight max-w-[80px]",
                    isActive
                      ? "text-primary"
                      : isDeals
                        ? "text-[hsl(45,100%,35%)]"
                        : "text-foreground"
                  )}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};
