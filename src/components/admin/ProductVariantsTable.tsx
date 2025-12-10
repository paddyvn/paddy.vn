import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProductVariantsTableProps {
  productId: string;
  option1Name?: string | null;
  option2Name?: string | null;
  option3Name?: string | null;
}

export function ProductVariantsTable({
  productId,
  option1Name,
  option2Name,
  option3Name,
}: ProductVariantsTableProps) {
  const { data: variants, isLoading } = useQuery({
    queryKey: ["product-variants", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const totalInventory = variants?.reduce(
    (sum, v) => sum + (v.stock_quantity || 0),
    0
  ) || 0;

  // Get unique option values for display
  const getOptionValues = () => {
    const options: { name: string; values: string[] }[] = [];
    
    if (option1Name && variants) {
      const values = [...new Set(variants.map(v => v.option1).filter(Boolean))] as string[];
      if (values.length > 0) options.push({ name: option1Name, values });
    }
    if (option2Name && variants) {
      const values = [...new Set(variants.map(v => v.option2).filter(Boolean))] as string[];
      if (values.length > 0) options.push({ name: option2Name, values });
    }
    if (option3Name && variants) {
      const values = [...new Set(variants.map(v => v.option3).filter(Boolean))] as string[];
      if (values.length > 0) options.push({ name: option3Name, values });
    }

    return options;
  };

  const optionGroups = getOptionValues();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Variants</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary">
            <Plus className="h-4 w-4 mr-1" />
            Add variant
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Option Groups */}
        {optionGroups.length > 0 && (
          <div className="space-y-3">
            {optionGroups.map((group) => (
              <div key={group.name} className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground min-w-[80px]">
                  {group.name}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {group.values.map((value) => (
                    <Badge key={value} variant="secondary" className="font-normal">
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Variants Table */}
        {variants && variants.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40%]">Variant</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{variant.name}</p>
                          {variant.sku && (
                            <p className="text-xs text-muted-foreground">SKU: {variant.sku}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={variant.price}
                        className="w-32 ml-auto text-right h-8"
                        readOnly
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={variant.stock_quantity || 0}
                        className="w-20 ml-auto text-right h-8"
                        readOnly
                      />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={2} className="font-medium text-sm">
                    Total inventory
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {totalInventory}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground">No variants configured</p>
            <Button variant="secondary" size="sm" className="mt-2">
              <Plus className="h-4 w-4 mr-1" />
              Add variant
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
