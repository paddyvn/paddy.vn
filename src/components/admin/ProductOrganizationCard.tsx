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
import { UseFormReturn } from "react-hook-form";

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
}

export function ProductOrganizationCard({ form }: ProductOrganizationCardProps) {
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
          name="vendor"
          render={({ field }) => (
            <FormItem>
              <Label className="text-sm font-medium">Vendor</Label>
              <FormControl>
                <Input
                  placeholder="Brand or vendor name"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
