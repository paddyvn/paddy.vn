import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Collection {
  id: string;
  name: string;
  slug: string;
}

interface CollectionSelectorPopoverProps {
  onSelect: (link: string, name: string) => void;
  currentLink?: string;
}

export function CollectionSelectorPopover({ onSelect, currentLink }: CollectionSelectorPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["collections-for-selector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []) as Collection[];
    },
  });

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (collection: Collection) => {
    const link = `/collections/${collection.slug}`;
    onSelect(link, collection.name);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-muted-foreground font-normal"
        >
          <ChevronsUpDown className="h-4 w-4 mr-2" />
          Select collections
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="start" 
        side="bottom" 
        sideOffset={4}
        avoidCollisions={true}
        collisionPadding={10}
      >
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading collections...
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No collections found
            </div>
          ) : (
            <div className="p-1">
              {filteredCollections.map((collection) => {
                const link = `/collections/${collection.slug}`;
                const isSelected = currentLink === link;
                return (
                  <button
                    key={collection.id}
                    onClick={() => handleSelect(collection)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-accent text-left",
                      isSelected && "bg-accent"
                    )}
                  >
                    <div>
                      <p className="font-medium">{collection.name}</p>
                      <p className="text-xs text-muted-foreground">/collections/{collection.slug}</p>
                    </div>
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
