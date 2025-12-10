import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";

interface ProductStatusCardProps {
  form: UseFormReturn<any>;
}

export function ProductStatusCard({ form }: ProductStatusCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Status</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem>
              <Select
                onValueChange={(value) => field.onChange(value === "active")}
                value={field.value ? "active" : "draft"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
