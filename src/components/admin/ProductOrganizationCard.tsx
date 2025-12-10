import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";

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
