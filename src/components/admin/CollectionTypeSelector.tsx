import { useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_COLLECTION_TYPES = [
  { value: "custom", label: "Custom collection" },
  { value: "brand", label: "Brand" },
  { value: "smart", label: "Smart collection" },
  { value: "category", label: "Category" },
  { value: "sale", label: "Sale / Promotion" },
  { value: "new", label: "New Arrivals" },
  { value: "featured", label: "Featured" },
  { value: "pet_type", label: "Pet Type" },
];

interface CollectionTypeSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function CollectionTypeSelector({ value, onValueChange }: CollectionTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customTypes, setCustomTypes] = useState<{ value: string; label: string }[]>([]);
  const [newTypeName, setNewTypeName] = useState("");
  
  const allTypes = [...DEFAULT_COLLECTION_TYPES, ...customTypes];
  const selectedType = allTypes.find(t => t.value === value);

  const handleAddCustomType = () => {
    if (!newTypeName.trim()) return;
    
    const typeValue = newTypeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "_");
    
    const newType = { value: typeValue, label: newTypeName.trim() };
    setCustomTypes([...customTypes, newType]);
    onValueChange(typeValue);
    setNewTypeName("");
    setIsDialogOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selectedType?.label || value || "Select type..."}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search type..." />
            <CommandList>
              <CommandEmpty>No type found.</CommandEmpty>
              <CommandGroup>
                {allTypes.map((type) => (
                  <CommandItem
                    key={type.value}
                    value={type.value}
                    onSelect={() => {
                      onValueChange(type.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === type.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {type.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setIsDialogOpen(true);
                  }}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new type
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create collection type</DialogTitle>
            <DialogDescription>
              Add a new collection type to organize your collections.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type-name">Type name</Label>
              <Input
                id="type-name"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="e.g., Seasonal, Limited Edition"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomType();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomType} disabled={!newTypeName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function getCollectionTypeDescription(type: string): string {
  switch (type) {
    case 'brand':
      return 'Brand collections appear in the Brands section on the homepage';
    case 'smart':
      return 'Smart collections automatically include products based on conditions';
    case 'category':
      return 'Category collections organize products by type';
    case 'sale':
      return 'Sale collections highlight discounted products';
    case 'new':
      return 'New Arrivals collections showcase recently added products';
    case 'featured':
      return 'Featured collections are prominently displayed on the site';
    case 'pet_type':
      return 'Pet Type collections organize products by pet species';
    default:
      return 'Custom collections allow manual product selection';
  }
}
