import { useState } from "react";
import { PetHubCategory } from "@/hooks/usePetHubCategories";
import { PetHubFilterState, usePetHubBrands } from "@/hooks/usePetHubProducts";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const DEFAULT_MAX_PRICE = 10000000;
const BRANDS_VISIBLE = 8;

interface PetHubSidebarProps {
  petType: "dog" | "cat";
  categories: PetHubCategory[] | undefined;
  filters: PetHubFilterState;
  onFiltersChange: (filters: PetHubFilterState) => void;
}

export const PetHubSidebar = ({
  petType,
  categories,
  filters,
  onFiltersChange,
}: PetHubSidebarProps) => {
  const { data: brands } = usePetHubBrands(petType);
  const [brandSearch, setBrandSearch] = useState("");
  const [showAllBrands, setShowAllBrands] = useState(false);

  const filteredBrands = (brands || []).filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );
  const visibleBrands = showAllBrands
    ? filteredBrands
    : filteredBrands.slice(0, BRANDS_VISIBLE);

  const hasActiveFilters =
    filters.brands.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < DEFAULT_MAX_PRICE ||
    filters.categorySlug !== null;

  const clearFilters = () => {
    onFiltersChange({
      brands: [],
      priceRange: [0, DEFAULT_MAX_PRICE],
      categorySlug: null,
    });
  };

  return (
    <aside className="w-full space-y-1">
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-destructive hover:text-destructive mb-2 w-full justify-start"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Xoá bộ lọc
        </Button>
      )}

      <Accordion
        type="multiple"
        defaultValue={["categories", "brands", "price"]}
        className="space-y-0"
      >
        {/* Category filter */}
        {categories && categories.length > 0 && (
          <AccordionItem value="categories" className="border-b">
            <AccordionTrigger className="text-sm font-bold py-3">
              Danh mục
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="space-y-1">
                <button
                  onClick={() =>
                    onFiltersChange({ ...filters, categorySlug: null })
                  }
                  className={cn(
                    "w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors",
                    !filters.categorySlug
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  Tất cả sản phẩm
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        categorySlug:
                          filters.categorySlug === cat.slug ? null : cat.slug,
                      })
                    }
                    className={cn(
                      "w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors",
                      filters.categorySlug === cat.slug
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Brand filter */}
        <AccordionItem value="brands" className="border-b">
          <AccordionTrigger className="text-sm font-bold py-3">
            Thương hiệu
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            {(brands || []).length > BRANDS_VISIBLE && (
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  placeholder="Tìm thương hiệu..."
                  className="pl-8 h-8 text-sm"
                />
              </div>
            )}
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
              {visibleBrands.map((brand) => (
                <label
                  key={brand.name}
                  className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                >
                  <Checkbox
                    checked={filters.brands.includes(brand.name)}
                    onCheckedChange={(checked) => {
                      const newBrands = checked
                        ? [...filters.brands, brand.name]
                        : filters.brands.filter((b) => b !== brand.name);
                      onFiltersChange({ ...filters, brands: newBrands });
                    }}
                  />
                  <span className="flex-1 truncate">{brand.name}</span>
                  <span className="text-xs text-muted-foreground/70">
                    ({brand.count})
                  </span>
                </label>
              ))}
            </div>
            {filteredBrands.length > BRANDS_VISIBLE && !showAllBrands && (
              <Button
                variant="link"
                size="sm"
                className="mt-1 p-0 h-auto text-xs"
                onClick={() => setShowAllBrands(true)}
              >
                Xem thêm ({filteredBrands.length - BRANDS_VISIBLE})
              </Button>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Price filter */}
        <AccordionItem value="price" className="border-b">
          <AccordionTrigger className="text-sm font-bold py-3">
            Khoảng giá
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <Slider
              value={filters.priceRange}
              min={0}
              max={DEFAULT_MAX_PRICE}
              step={50000}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  priceRange: value as [number, number],
                })
              }
              className="mt-2"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{formatPrice(filters.priceRange[0])}</span>
              <span>{formatPrice(filters.priceRange[1])}</span>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
};
