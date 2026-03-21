import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { X, Save, Star, Search, Loader2 } from "lucide-react";

interface CollectionOption {
  id: string;
  name: string;
  slug: string;
  collection_type: string | null;
  image_url: string | null;
}

const HomepageFeaturedManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["homepage-featured-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_featured_config")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Local state initialized from config
  const [sectionTitle, setSectionTitle] = useState<string | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Derive effective values (local override or config)
  const effectiveTitle = sectionTitle ?? config?.section_title ?? "Sản phẩm nổi bật";
  const effectiveCount = productCount ?? config?.product_count ?? 10;
  const effectiveActive = isActive ?? config?.is_active ?? true;
  const effectiveCollectionId = selectedCollectionId !== undefined ? selectedCollectionId : config?.collection_id;

  // Fetch selected collection details
  const { data: selectedCollection } = useQuery({
    queryKey: ["collection-detail", effectiveCollectionId],
    queryFn: async () => {
      if (!effectiveCollectionId) return null;
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, collection_type, image_url")
        .eq("id", effectiveCollectionId)
        .single();
      if (error) return null;
      return data as CollectionOption;
    },
    enabled: !!effectiveCollectionId,
  });

  // Fetch product count for selected collection
  const { data: selectedProductCount } = useQuery({
    queryKey: ["collection-product-count", effectiveCollectionId],
    queryFn: async () => {
      if (!effectiveCollectionId) return 0;
      const { count, error } = await supabase
        .from("product_collections")
        .select("*", { count: "exact", head: true })
        .eq("collection_id", effectiveCollectionId);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!effectiveCollectionId,
  });

  // Search collections
  const { data: searchResults } = useQuery({
    queryKey: ["search-collections", search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, collection_type, image_url")
        .ilike("name", `%${search}%`)
        .order("name")
        .limit(10);
      if (error) return [];
      return data as CollectionOption[];
    },
    enabled: search.trim().length > 0,
  });

  // Fetch product counts for search results
  const searchResultIds = useMemo(() => searchResults?.map(c => c.id) || [], [searchResults]);
  const { data: searchProductCounts } = useQuery({
    queryKey: ["collection-product-counts", searchResultIds],
    queryFn: async () => {
      if (searchResultIds.length === 0) return {};
      const { data, error } = await supabase
        .from("product_collections")
        .select("collection_id")
        .in("collection_id", searchResultIds);
      if (error) return {};
      const counts: Record<string, number> = {};
      data.forEach(pc => {
        counts[pc.collection_id] = (counts[pc.collection_id] || 0) + 1;
      });
      return counts;
    },
    enabled: searchResultIds.length > 0,
  });

  // Preview products from selected collection
  const { data: previewProducts } = useQuery({
    queryKey: ["featured-preview", effectiveCollectionId, effectiveCount],
    queryFn: async () => {
      if (!effectiveCollectionId) return [];
      const { data: productIds } = await supabase
        .from("product_collections")
        .select("product_id")
        .eq("collection_id", effectiveCollectionId)
        .order("position")
        .limit(effectiveCount);
      if (!productIds || productIds.length === 0) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, name, product_images(image_url, is_primary)")
        .in("id", productIds.map(p => p.product_id))
        .eq("is_active", true);
      if (error) return [];
      // Sort by position order
      const posMap = new Map(productIds.map((p, i) => [p.product_id, i]));
      return data?.sort((a, b) => (posMap.get(a.id) ?? 99) - (posMap.get(b.id) ?? 99)) || [];
    },
    enabled: !!effectiveCollectionId,
  });

  const getPrimaryImage = (product: any) => {
    const primary = product.product_images?.find((img: any) => img.is_primary);
    return primary?.image_url || product.product_images?.[0]?.image_url;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("homepage_featured_config")
        .update({
          collection_id: effectiveCollectionId || null,
          section_title: effectiveTitle,
          product_count: effectiveCount,
          is_active: effectiveActive,
          updated_at: new Date().toISOString(),
        })
        .not("id", "is", null);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["homepage-featured-config"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-featured-products"] });
      toast({ title: "Featured section updated" });
    } catch (error) {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (configLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Featured Products Section
          </CardTitle>
          <CardDescription>
            Configure which collection powers the "Sản phẩm nổi bật" section on the homepage
          </CardDescription>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Title */}
        <div className="space-y-2">
          <Label>Section Title</Label>
          <Input
            value={effectiveTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            placeholder="Sản phẩm nổi bật"
          />
        </div>

        {/* Collection Picker */}
        <div className="space-y-2">
          <Label>Source Collection</Label>
          {effectiveCollectionId && selectedCollection ? (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {selectedCollection.image_url && (
                <img src={selectedCollection.image_url} alt="" className="h-10 w-10 rounded object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{selectedCollection.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedProductCount ?? 0} products · /collections/{selectedCollection.slug}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedCollectionId(null);
                  setSearch("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search collections..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {search.trim() && searchResults && searchResults.length > 0 && (
                <div className="border rounded-lg max-h-60 overflow-y-auto divide-y">
                  {searchResults.map((c) => (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-3"
                      onClick={() => {
                        setSelectedCollectionId(c.id);
                        setSearch("");
                      }}
                    >
                      {c.image_url ? (
                        <img src={c.image_url} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {searchProductCounts?.[c.id] || 0} products · {c.collection_type || "Custom"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {search.trim() && searchResults?.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">No collections found</p>
              )}
              {!effectiveCollectionId && (
                <p className="text-xs text-muted-foreground">
                  No collection selected — will show newest products as fallback
                </p>
              )}
            </div>
          )}
        </div>

        {/* Product Count */}
        <div className="space-y-2">
          <Label>Products to Show</Label>
          <Input
            type="number"
            min={1}
            max={50}
            value={effectiveCount}
            onChange={(e) => setProductCount(Number(e.target.value) || 10)}
            className="w-32"
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Active</Label>
            <p className="text-xs text-muted-foreground">Show the featured section on the homepage</p>
          </div>
          <Switch checked={effectiveActive} onCheckedChange={(v) => setIsActive(v)} />
        </div>

        {/* Product Preview */}
        {previewProducts && previewProducts.length > 0 && (
          <div className="space-y-2">
            <Label>Preview ({previewProducts.length} products)</Label>
            <div className="grid grid-cols-5 gap-2">
              {previewProducts.map((p: any) => (
                <div key={p.id} className="border rounded-lg p-2 text-center">
                  {getPrimaryImage(p) ? (
                    <img
                      src={getPrimaryImage(p)}
                      alt={p.name}
                      className="w-full aspect-square object-cover rounded"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-muted rounded" />
                  )}
                  <p className="text-[10px] truncate mt-1">{p.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HomepageFeaturedManager;
