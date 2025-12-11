import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const PET_TYPES = [
  { value: "dog", label: "Chó (Dog)" },
  { value: "cat", label: "Mèo (Cat)" },
  { value: "bird", label: "Chim (Bird)" },
  { value: "fish", label: "Cá (Fish)" },
  { value: "hamster", label: "Hamster" },
  { value: "rabbit", label: "Thỏ (Rabbit)" },
  { value: "other", label: "Khác (Other)" },
];

interface ProductOrganizationCardProps {
  form: UseFormReturn<any>;
  selectedHealthConditions: string[];
  onHealthConditionsChange: (ids: string[]) => void;
}

export function ProductOrganizationCard({ 
  form, 
  selectedHealthConditions,
  onHealthConditionsChange 
}: ProductOrganizationCardProps) {
  // Fetch lookup data
  const { data: ageRanges = [], isLoading: loadingAges } = useQuery({
    queryKey: ["product_age_ranges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_age_ranges")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: sizes = [], isLoading: loadingSizes } = useQuery({
    queryKey: ["product_sizes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_sizes")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: origins = [], isLoading: loadingOrigins } = useQuery({
    queryKey: ["product_origins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_origins")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: healthConditions = [], isLoading: loadingHealth } = useQuery({
    queryKey: ["product_health_conditions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_health_conditions")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const handleHealthConditionToggle = (conditionId: string, checked: boolean) => {
    if (checked) {
      onHealthConditionsChange([...selectedHealthConditions, conditionId]);
    } else {
      onHealthConditionsChange(selectedHealthConditions.filter(id => id !== conditionId));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Product organization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="product_type"
          render={({ field }) => (
            <FormItem>
              <Label className="text-sm font-medium">Product type</Label>
              <FormControl>
                <Input
                  placeholder="e.g., Toys, Food, Accessories"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pet_type"
          render={({ field }) => (
            <FormItem>
              <Label className="text-sm font-medium">Pet</Label>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pet type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PET_TYPES.map((pet) => (
                    <SelectItem key={pet.value} value={pet.value}>
                      {pet.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <Label className="text-sm font-medium">Brand</Label>
              <FormControl>
                <Input
                  placeholder="Brand name"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Target Age Range */}
        <FormField
          control={form.control}
          name="target_age_id"
          render={({ field }) => (
            <FormItem>
              <Label className="text-sm font-medium">Target Age</Label>
              {loadingAges ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select age range" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ageRanges.map((age) => (
                      <SelectItem key={age.id} value={age.id}>
                        {age.name_vi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormItem>
          )}
        />

        {/* Target Size */}
        <FormField
          control={form.control}
          name="target_size_id"
          render={({ field }) => (
            <FormItem>
              <Label className="text-sm font-medium">Target Size</Label>
              {loadingSizes ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sizes.map((size) => (
                      <SelectItem key={size.id} value={size.id}>
                        {size.name_vi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormItem>
          )}
        />

        {/* Origin Country */}
        <FormField
          control={form.control}
          name="origin_id"
          render={({ field }) => (
            <FormItem>
              <Label className="text-sm font-medium">Origin</Label>
              {loadingOrigins ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select origin country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {origins.map((origin) => (
                      <SelectItem key={origin.id} value={origin.id}>
                        {origin.name_vi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormItem>
          )}
        />

        {/* Health Conditions (Multi-select) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Health Conditions</Label>
          {loadingHealth ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
              {healthConditions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No health conditions available</p>
              ) : (
                healthConditions.map((condition) => (
                  <div key={condition.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={condition.id}
                      checked={selectedHealthConditions.includes(condition.id)}
                      onCheckedChange={(checked) => 
                        handleHealthConditionToggle(condition.id, checked === true)
                      }
                    />
                    <label
                      htmlFor={condition.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {condition.name_vi}
                    </label>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
