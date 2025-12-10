import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductCollectionTagsProps {
  productId: string;
}

export function ProductCollectionTags({ productId }: ProductCollectionTagsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch current collections for this product
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

  // Fetch all available collections for search
  const { data: allCollections } = useQuery({
    queryKey: ["all-collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const currentCollectionIds = productCollections?.map(pc => pc.collection_id) || [];
  
  const filteredCollections = allCollections?.filter(
    (c) =>
      !currentCollectionIds.includes(c.id) &&
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
              {filteredCollections.slice(0, 5).map((collection) => (
                <button
                  key={collection.id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  onClick={() => {
                    // TODO: Add collection to product
                    setSearchQuery("");
                  }}
                >
                  {collection.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current Collections as Tags */}
        {productCollections && productCollections.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {productCollections.map((pc) => {
              const category = pc.categories as { id: string; name: string; slug: string } | null;
              if (!category) return null;
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
                    onClick={() => {
                      // TODO: Remove collection from product
                    }}
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
