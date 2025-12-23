import { useState, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

const PRODUCT_FIELDS = [
  { value: "name", label: "Title" },
  { value: "product_type", label: "Type" },
  { value: "category", label: "Category" },
  { value: "brand", label: "Brand" },
  { value: "tags", label: "Tag" },
  { value: "base_price", label: "Price" },
  { value: "weight", label: "Weight" },
  { value: "stock_quantity", label: "Inventory stock" },
  { value: "variant_title", label: "Variant's title" },
];

const METAFIELDS = [
  { value: "product_rating", label: "Product rating" },
];

interface ConditionFieldSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function ConditionFieldSelector({ value, onValueChange }: ConditionFieldSelectorProps) {
  const [open, setOpen] = useState(false);
  
  const selectedField = [...PRODUCT_FIELDS, ...METAFIELDS].find(f => f.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[180px] justify-between font-normal"
        >
          {selectedField?.label || "Select field..."}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0 bg-popover z-50" align="start">
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandEmpty>No field found.</CommandEmpty>
            <CommandGroup heading="Product fields">
              {PRODUCT_FIELDS.map((field) => (
                <CommandItem
                  key={field.value}
                  value={field.value}
                  onSelect={() => {
                    onValueChange(field.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === field.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {field.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Metafields">
              {METAFIELDS.map((field) => (
                <CommandItem
                  key={field.value}
                  value={field.value}
                  onSelect={() => {
                    onValueChange(field.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === field.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {field.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Operator selector with similar searchable dropdown
const TEXT_OPERATORS = [
  { value: "equals", label: "is equal to" },
  { value: "not_equals", label: "is not equal to" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
];

const NUMERIC_OPERATORS = [
  { value: "equals", label: "is equal to" },
  { value: "not_equals", label: "is not equal to" },
  { value: "greater_than", label: "is greater than" },
  { value: "less_than", label: "is less than" },
];

interface ConditionOperatorSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  fieldType: "text" | "numeric";
}

export function ConditionOperatorSelector({ value, onValueChange, fieldType }: ConditionOperatorSelectorProps) {
  const [open, setOpen] = useState(false);
  
  const operators = fieldType === "numeric" ? NUMERIC_OPERATORS : TEXT_OPERATORS;
  const selectedOperator = operators.find(op => op.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[180px] justify-between font-normal"
        >
          {selectedOperator?.label || "Select operator..."}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-popover z-50" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No operator found.</CommandEmpty>
            <CommandGroup>
              {operators.map((op) => (
                <CommandItem
                  key={op.value}
                  value={op.value}
                  onSelect={() => {
                    onValueChange(op.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === op.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {op.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Value selector with autocomplete based on field type
interface ConditionValueSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  field: string;
}

export function ConditionValueSelector({ value, onValueChange, field }: ConditionValueSelectorProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<{ value: string; label: string; parent?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fields that support dropdown autocomplete
  const supportsAutocomplete = ["brand", "product_type", "category", "tags"].includes(field);

  useEffect(() => {
    if (!supportsAutocomplete) return;
    
    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        if (field === "brand") {
          const { data } = await supabase
            .from("products")
            .select("brand")
            .not("brand", "is", null)
            .order("brand");
          
          const uniqueBrands = [...new Set(data?.map(p => p.brand).filter(Boolean))];
          setOptions(uniqueBrands.map(b => ({ value: b as string, label: b as string })));
        } else if (field === "product_type") {
          const { data } = await supabase
            .from("products")
            .select("product_type")
            .not("product_type", "is", null)
            .order("product_type");
          
          const uniqueTypes = [...new Set(data?.map(p => p.product_type).filter(Boolean))];
          setOptions(uniqueTypes.map(t => ({ value: t as string, label: t as string })));
        } else if (field === "category") {
          const { data, error } = await supabase
            .from("categories")
            .select("id, name")
            .eq("is_active", true)
            .order("name");
          
          if (error) {
            console.error("Error fetching categories:", error);
          }
          
          setOptions((data || []).map((c: any) => ({
            value: c.name,
            label: c.name
          })));
        } else if (field === "tags") {
          const { data } = await supabase
            .from("products")
            .select("tags")
            .not("tags", "is", null);
          
          const allTags = data?.flatMap(p => 
            (p.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean)
          ) || [];
          const uniqueTags = [...new Set(allTags)].sort();
          setOptions(uniqueTags.map(t => ({ value: t, label: t })));
        }
      } catch (error) {
        console.error("Error fetching options:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [field, supportsAutocomplete]);

  // For numeric fields, just use a plain input
  if (!supportsAutocomplete) {
    return (
      <Input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="Enter value..."
        className="flex-1"
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex-1 justify-between font-normal"
        >
          {value || "Select value..."}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-popover z-50" align="start">
        <Command>
          <CommandInput 
            placeholder="Search..." 
            value={value}
            onValueChange={onValueChange}
          />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : (
              <>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => {
                        onValueChange(option.value);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        {option.parent && (
                          <span className="text-xs text-muted-foreground">
                            in {option.parent}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Helper to determine field type
export function getFieldType(field: string): "text" | "numeric" {
  const numericFields = ["base_price", "compare_at_price", "weight", "stock_quantity", "product_rating"];
  return numericFields.includes(field) ? "numeric" : "text";
}

// Helper to get field label
export function getFieldLabel(field: string): string {
  const allFields = [...PRODUCT_FIELDS, ...METAFIELDS];
  return allFields.find(f => f.value === field)?.label || field;
}
