import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface ProductCollectionTagsProps {
  productId: string;
}

interface CollectionRule {
  field: string;
  operator: string;
  value: string;
}

export function ProductCollectionTags({ productId }: ProductCollectionTagsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch the product details to check smart collection rules
  const { data: product } = useQuery({
    queryKey: ["product-for-collections", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, brand, product_type, tags, pet_type")
        .eq("id", productId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  // Fetch current explicit collections for this product
  const { data: productCollections, isLoading } = useQuery({
    queryKey: ["product-collections-edit", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_collections")
        .select(`
          id,
          collection_id,
          categories:collection_id (
            id,
            name,
            slug
          )
        `)
        .eq("product_id", productId);
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  // Fetch all available collections including smart collections
  const { data: allCollections } = useQuery({
    queryKey: ["all-collections-with-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, collection_type, rules, rules_match_type")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Check if a product matches a smart collection's rules
  const checkProductMatchesRules = (rules: CollectionRule[] | null, matchType: string | null): boolean => {
    if (!rules || !Array.isArray(rules) || rules.length === 0 || !product) return false;
    
    const results = rules.map((rule) => {
      let productValue = "";
      switch (rule.field) {
        case "vendor":
        case "brand":
          productValue = product.brand?.toLowerCase() || "";
          break;
        case "product_type":
          productValue = product.product_type?.toLowerCase() || "";
          break;
        case "tag":
          productValue = product.tags?.toLowerCase() || "";
          break;
        default:
          return false;
      }

      const ruleValue = rule.value?.toLowerCase() || "";
      
      switch (rule.operator) {
        case "equals":
          return productValue === ruleValue;
        case "contains":
          return productValue.includes(ruleValue);
        case "starts_with":
          return productValue.startsWith(ruleValue);
        case "ends_with":
          return productValue.endsWith(ruleValue);
        default:
          return false;
      }
    });

    return matchType === "any" ? results.some(Boolean) : results.every(Boolean);
  };

  // Compute smart collections that match this product
  const smartCollections = useMemo(() => {
    if (!allCollections || !product) return [];
    
    return allCollections.filter((c) => {
      if (c.collection_type === "custom" || !c.rules) return false;
      return checkProductMatchesRules(c.rules as unknown as CollectionRule[], c.rules_match_type);
    });
  }, [allCollections, product]);

  const currentCollectionIds = productCollections?.map(pc => pc.collection_id) || [];
  const smartCollectionIds = smartCollections.map(c => c.id);
  
  const filteredCollections = allCollections?.filter(
    (c) =>
      !currentCollectionIds.includes(c.id) &&
      !smartCollectionIds.includes(c.id) &&
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleAddCollection = async (collectionId: string) => {
    try {
      const { error } = await supabase
        .from("product_collections")
        .insert({ product_id: productId, collection_id: collectionId });
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["product-collections-edit", productId] });
      toast.success("Collection added");
      setSearchQuery("");
    } catch (error) {
      toast.error("Failed to add collection");
    }
  };

  const handleRemoveCollection = async (pcId: string) => {
    try {
      const { error } = await supabase
        .from("product_collections")
        .delete()
        .eq("id", pcId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["product-collections-edit", productId] });
      toast.success("Collection removed");
    } catch (error) {
      toast.error("Failed to remove collection");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2 mt-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAnyCollections = (productCollections && productCollections.length > 0) || smartCollections.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Collections</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          
          {/* Search Results Dropdown */}
          {searchQuery && filteredCollections.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredCollections.map((collection) => (
                <button
                  key={collection.id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  onClick={() => handleAddCollection(collection.id)}
                >
                  {collection.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current Collections as Tags */}
        {hasAnyCollections ? (
          <div className="flex flex-wrap gap-2">
            {/* Smart/Auto Collections (non-removable) */}
            {smartCollections.map((collection) => (
              <Badge
                key={collection.id}
                variant="outline"
                className="flex items-center gap-1 bg-primary/10 border-primary/30"
              >
                <Sparkles className="h-3 w-3" />
                {collection.name}
              </Badge>
            ))}
            
            {/* Explicit Collections (removable) */}
            {productCollections?.map((pc) => {
              const category = pc.categories as { id: string; name: string; slug: string } | null;
              if (!category) return null;
              // Skip if already shown as smart collection
              if (smartCollectionIds.includes(category.id)) return null;
              return (
                <Badge
                  key={pc.id}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  {category.name}
                  <button
                    type="button"
                    className="ml-1 hover:bg-muted-foreground/20 rounded p-0.5"
                    onClick={() => handleRemoveCollection(pc.id)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No collections assigned
          </p>
        )}
      </CardContent>
    </Card>
  );
}
