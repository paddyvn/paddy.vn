import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Search } from "lucide-react";

export interface FilterState {
  vendors: string[];
  priceRange: [number, number];
  ageRanges: string[];
  sizes: string[];
  healthConditions: string[];
}

interface CollectionFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  maxPrice: number;
}

const SEARCHABLE_THRESHOLD = 6;

export const CollectionFilters = ({
  filters,
  onFiltersChange,
  maxPrice,
}: CollectionFiltersProps) => {
  const [vendorSearch, setVendorSearch] = useState("");
  const [healthSearch, setHealthSearch] = useState("");

  // Fetch vendors
  const { data: vendors } = useQuery({
    queryKey: ["filter-vendors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("vendor")
        .eq("is_active", true)
        .not("vendor", "is", null);
      
      const uniqueVendors = [...new Set(data?.map(p => p.vendor).filter(Boolean))];
      return uniqueVendors.sort() as string[];
    },
  });

  // Fetch age ranges
  const { data: ageRanges } = useQuery({
    queryKey: ["filter-age-ranges"],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_age_ranges")
        .select("id, name, name_vi")
        .eq("is_active", true)
        .order("display_order");
      return data || [];
    },
  });

  // Fetch sizes
  const { data: sizes } = useQuery({
    queryKey: ["filter-sizes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_sizes")
        .select("id, name, name_vi")
        .eq("is_active", true)
        .order("display_order");
      return data || [];
    },
  });

  // Fetch health conditions
  const { data: healthConditions } = useQuery({
    queryKey: ["filter-health-conditions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_health_conditions")
        .select("id, name, name_vi")
        .eq("is_active", true)
        .order("display_order");
      return data || [];
    },
  });

  // Filter vendors by search
  const filteredVendors = vendors?.filter((vendor) =>
    vendor.toLowerCase().includes(vendorSearch.toLowerCase())
  ) || [];

  // Filter health conditions by search
  const filteredHealthConditions = healthConditions?.filter((condition) =>
    condition.name_vi.toLowerCase().includes(healthSearch.toLowerCase()) ||
    condition.name.toLowerCase().includes(healthSearch.toLowerCase())
  ) || [];

  const handleVendorChange = (vendor: string, checked: boolean) => {
    const newVendors = checked
      ? [...filters.vendors, vendor]
      : filters.vendors.filter((v) => v !== vendor);
    onFiltersChange({ ...filters, vendors: newVendors });
  };

  const handleAgeRangeChange = (id: string, checked: boolean) => {
    const newAgeRanges = checked
      ? [...filters.ageRanges, id]
      : filters.ageRanges.filter((a) => a !== id);
    onFiltersChange({ ...filters, ageRanges: newAgeRanges });
  };

  const handleSizeChange = (id: string, checked: boolean) => {
    const newSizes = checked
      ? [...filters.sizes, id]
      : filters.sizes.filter((s) => s !== id);
    onFiltersChange({ ...filters, sizes: newSizes });
  };

  const handleHealthConditionChange = (id: string, checked: boolean) => {
    const newHealthConditions = checked
      ? [...filters.healthConditions, id]
      : filters.healthConditions.filter((h) => h !== id);
    onFiltersChange({ ...filters, healthConditions: newHealthConditions });
  };

  const handlePriceChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      priceRange: [values[0], values[1]] as [number, number],
    });
  };

  const hasActiveFilters =
    filters.vendors.length > 0 ||
    filters.ageRanges.length > 0 ||
    filters.sizes.length > 0 ||
    filters.healthConditions.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < maxPrice;

  const clearAllFilters = () => {
    onFiltersChange({
      vendors: [],
      priceRange: [0, maxPrice],
      ageRanges: [],
      sizes: [],
      healthConditions: [],
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "₫";
  };

  return (
    <div className="w-full">
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="w-full justify-start text-destructive hover:text-destructive mb-2"
        >
          <X className="h-4 w-4 mr-2" />
          Clear all filters
        </Button>
      )}

      <Accordion type="multiple" defaultValue={["brand", "price"]} className="w-full">
        {/* Brand Filter */}
        {vendors && vendors.length > 0 && (
          <AccordionItem value="brand">
            <AccordionTrigger className="text-base font-semibold">
              Brand
            </AccordionTrigger>
            <AccordionContent>
              {vendors.length > SEARCHABLE_THRESHOLD && (
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search brands..."
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
              )}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredVendors.map((vendor) => (
                  <label
                    key={vendor}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                  >
                    <Checkbox
                      checked={filters.vendors.includes(vendor)}
                      onCheckedChange={(checked) =>
                        handleVendorChange(vendor, checked as boolean)
                      }
                    />
                    <span className="text-sm">{vendor}</span>
                  </label>
                ))}
                {filteredVendors.length === 0 && vendorSearch && (
                  <p className="text-sm text-muted-foreground py-2">No brands found</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Price Filter */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-base font-semibold">
            Price
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-2 pt-2 pb-4">
              <Slider
                value={[filters.priceRange[0], filters.priceRange[1]]}
                onValueChange={handlePriceChange}
                max={maxPrice}
                min={0}
                step={10000}
                className="mb-4"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatPrice(filters.priceRange[0])}</span>
                <span>{formatPrice(filters.priceRange[1])}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Life Stage Filter */}
        {ageRanges && ageRanges.length > 0 && (
          <AccordionItem value="life-stage">
            <AccordionTrigger className="text-base font-semibold">
              Life Stage
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {ageRanges.map((age) => (
                  <label
                    key={age.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                  >
                    <Checkbox
                      checked={filters.ageRanges.includes(age.id)}
                      onCheckedChange={(checked) =>
                        handleAgeRangeChange(age.id, checked as boolean)
                      }
                    />
                    <span className="text-sm">{age.name_vi}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Breed Size Filter */}
        {sizes && sizes.length > 0 && (
          <AccordionItem value="breed-size">
            <AccordionTrigger className="text-base font-semibold">
              Breed Size
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {sizes.map((size) => (
                  <label
                    key={size.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                  >
                    <Checkbox
                      checked={filters.sizes.includes(size.id)}
                      onCheckedChange={(checked) =>
                        handleSizeChange(size.id, checked as boolean)
                      }
                    />
                    <span className="text-sm">{size.name_vi}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Health Condition Filter */}
        {healthConditions && healthConditions.length > 0 && (
          <AccordionItem value="health-condition">
            <AccordionTrigger className="text-base font-semibold">
              Health Condition
            </AccordionTrigger>
            <AccordionContent>
              {healthConditions.length > SEARCHABLE_THRESHOLD && (
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conditions..."
                    value={healthSearch}
                    onChange={(e) => setHealthSearch(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
              )}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredHealthConditions.map((condition) => (
                  <label
                    key={condition.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                  >
                    <Checkbox
                      checked={filters.healthConditions.includes(condition.id)}
                      onCheckedChange={(checked) =>
                        handleHealthConditionChange(condition.id, checked as boolean)
                      }
                    />
                    <span className="text-sm">{condition.name_vi}</span>
                  </label>
                ))}
                {filteredHealthConditions.length === 0 && healthSearch && (
                  <p className="text-sm text-muted-foreground py-2">No conditions found</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};
