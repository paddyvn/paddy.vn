import { PetHubCategory } from "@/hooks/usePetHubCategories";
import { Link } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface PetHubCategoriesProps {
  categories: PetHubCategory[] | undefined;
  activeCategory: string | null;
  onSelect: (categoryId: string | null) => void;
}

export const PetHubCategories = ({
  categories,
  activeCategory,
  onSelect,
}: PetHubCategoriesProps) => {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="container mx-auto px-4 pb-6">
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-3">
          {/* "All" pill */}
          <button
            onClick={() => onSelect(null)}
            className={cn(
              "flex flex-col items-center gap-2 min-w-[80px] group cursor-pointer"
            )}
          >
            <div
              className={cn(
                "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-2 transition-all",
                !activeCategory
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-muted/40 group-hover:border-primary/50"
              )}
            >
              <span className="text-xl md:text-2xl">🐾</span>
            </div>
            <span
              className={cn(
                "text-xs md:text-sm font-medium text-center leading-tight",
                !activeCategory ? "text-primary font-bold" : "text-muted-foreground"
              )}
            >
              Tất cả
            </span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(activeCategory === cat.id ? null : cat.id)}
              className="flex flex-col items-center gap-2 min-w-[80px] group cursor-pointer"
            >
              <div
                className={cn(
                  "w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition-all",
                  activeCategory === cat.id
                    ? "border-primary shadow-md ring-2 ring-primary/20"
                    : "border-border group-hover:border-primary/50"
                )}
              >
                {cat.hub_icon_url || cat.image_url ? (
                  <img
                    src={cat.hub_icon_url || cat.image_url || ""}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-lg text-muted-foreground font-bold">
                      {cat.name[0]}
                    </span>
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "text-xs md:text-sm font-medium text-center leading-tight max-w-[80px]",
                  activeCategory === cat.id
                    ? "text-primary font-bold"
                    : "text-muted-foreground"
                )}
              >
                {cat.name}
              </span>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};
