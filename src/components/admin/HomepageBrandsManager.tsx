import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, ChevronUp, ChevronDown, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BrandItem {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

interface FeaturedBrand {
  id: string;
  brand_id: string;
  position: number;
  brand: BrandItem;
}

export default function HomepageBrandsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch featured brands
  const { data: featuredBrands = [] } = useQuery({
    queryKey: ["admin-homepage-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_featured_brands")
        .select(`
          id, brand_id, position,
          brand:categories (id, name, slug, image_url)
        `)
        .order("position");
      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row,
        brand: row.brand as BrandItem,
      })) as FeaturedBrand[];
    },
  });

  const featuredBrandIds = featuredBrands.map((fb) => fb.brand_id);

  // Search brand collections
  const { data: searchResults = [] } = useQuery({
    queryKey: ["brand-search", debouncedSearch, featuredBrandIds],
    queryFn: async () => {
      let query = supabase
        .from("categories")
        .select("id, name, slug, image_url")
        .eq("collection_type", "brand")
        .eq("is_active", true)
        .order("name")
        .limit(20);

      if (debouncedSearch) {
        query = query.ilike("name", `%${debouncedSearch}%`);
      }

      if (featuredBrandIds.length > 0) {
        query = query.not("id", "in", `(${featuredBrandIds.join(",")})`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as BrandItem[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-homepage-brands"] });
    queryClient.invalidateQueries({ queryKey: ["homepage-featured-brands"] });
    queryClient.invalidateQueries({ queryKey: ["brand-search"] });
  };

  const addBrand = async (brandId: string) => {
    const maxPosition = featuredBrands.length;
    const { error } = await supabase.from("homepage_featured_brands").insert({
      brand_id: brandId,
      position: maxPosition,
    });
    if (error) {
      toast({ title: "Failed to add brand", variant: "destructive" });
      return;
    }
    toast({ title: "Brand added to homepage" });
    invalidate();
  };

  const removeBrand = async (id: string) => {
    const { error } = await supabase.from("homepage_featured_brands").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to remove brand", variant: "destructive" });
      return;
    }
    toast({ title: "Brand removed from homepage" });
    invalidate();
  };

  const moveItem = async (currentIndex: number, direction: -1 | 1) => {
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= featuredBrands.length) return;

    const reordered = [...featuredBrands];
    [reordered[currentIndex], reordered[newIndex]] = [reordered[newIndex], reordered[currentIndex]];

    for (let i = 0; i < reordered.length; i++) {
      await supabase
        .from("homepage_featured_brands")
        .update({ position: i })
        .eq("id", reordered[i].id);
    }
    invalidate();
  };

  const BrandLogo = ({ brand, size = "h-10 w-10" }: { brand: BrandItem; size?: string }) =>
    brand.image_url ? (
      <img src={brand.image_url} alt={brand.name} className={`${size} object-contain rounded border bg-background`} />
    ) : (
      <div className={`${size} rounded border bg-muted flex items-center justify-center`}>
        <Image className="h-4 w-4 text-muted-foreground" />
      </div>
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left panel: Search + Add */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search brands to add</CardTitle>
          <CardDescription>
            Search from {featuredBrandIds.length > 0 ? "remaining" : "all"} brand collections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by brand name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {debouncedSearch ? "No brands found" : "No more brands to add"}
              </p>
            ) : (
              searchResults.map((brand) => (
                <div
                  key={brand.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <BrandLogo brand={brand} />
                    <span className="text-sm font-medium">{brand.name}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addBrand(brand.id)}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Right panel: Featured brands with reorder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Featured Brands ({featuredBrands.length})
          </CardTitle>
          <CardDescription>
            {featuredBrands.length === 0
              ? "No brands selected — default order will be used on homepage"
              : "These brands appear in the homepage section. First 12 are shown."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {featuredBrands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-lg">
              <Image className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Add brands from the left panel to curate the homepage section
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {featuredBrands.map((fb, index) => (
                <div
                  key={fb.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={index === 0}
                        onClick={() => moveItem(index, -1)}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={index === featuredBrands.length - 1}
                        onClick={() => moveItem(index, 1)}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <BrandLogo brand={fb.brand} />
                    <span className="text-sm font-medium">{fb.brand.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeBrand(fb.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
