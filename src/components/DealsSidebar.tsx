import { useState } from "react";
import { DealsFilterState, useDealsBrands } from "@/hooks/useDealsProducts";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Search, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const DEFAULT_MAX_PRICE = 10000000;
const BRANDS_VISIBLE = 8;

const DISCOUNT_OPTIONS = [
  { value: "0", label: "Tất cả" },
  { value: "10", label: "Giảm 10%+" },
  { value: "20", label: "Giảm 20%+" },
  { value: "30", label: "Giảm 30%+" },
  { value: "50", label: "Giảm 50%+" },
];

const PET_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "dog", label: "🐕 Chó" },
  { value: "cat", label: "🐈 Mèo" },
];

interface DealsSidebarProps {
  filters: DealsFilterState;
  onFiltersChange: (filters: DealsFilterState) => void;
}

export const DealsSidebar = ({ filters, onFiltersChange }: DealsSidebarProps) => {
  const { data: brands } = useDealsBrands();
  const [brandSearch, setBrandSearch] = useState("");
  const [showAllBrands, setShowAllBrands] = useState(false);

  const filteredBrands = (brands || []).filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );
  const visibleBrands = showAllBrands
    ? filteredBrands
    : filteredBrands.slice(0, BRANDS_VISIBLE);

  const hasActiveFilters =
    filters.minDiscount > 0 ||
    filters.petType !== null ||
    filters.brands.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < DEFAULT_MAX_PRICE;

  const clearFilters = () => {
    onFiltersChange({
      minDiscount: 0,
      petType: null,
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
        defaultValue={["discount", "pet", "brands", "price"]}
        className="space-y-0"
      >
        {/* Discount range */}
        <AccordionItem value="discount" className="border-b">
          <AccordionTrigger className="text-sm font-bold py-3">
            Mức giảm giá
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <RadioGroup
              value={String(filters.minDiscount)}
              onValueChange={(val) =>
                onFiltersChange({ ...filters, minDiscount: Number(val) })
              }
              className="space-y-2"
            >
              {DISCOUNT_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`disc-${opt.value}`} />
                  <Label
                    htmlFor={`disc-${opt.value}`}
                    className="text-sm cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        {/* Pet type */}
        <AccordionItem value="pet" className="border-b">
          <AccordionTrigger className="text-sm font-bold py-3">
            Loại thú cưng
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <RadioGroup
              value={filters.petType || "all"}
              onValueChange={(val) =>
                onFiltersChange({ ...filters, petType: val === "all" ? null : val })
              }
              className="space-y-2"
            >
              {PET_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`pet-${opt.value}`} />
                  <Label
                    htmlFor={`pet-${opt.value}`}
                    className="text-sm cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

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
