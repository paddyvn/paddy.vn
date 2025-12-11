import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";

interface ProductSEOPreviewProps {
  form: UseFormReturn<any>;
  productName: string;
  basePrice: number;
  productId?: string;
}

export function ProductSEOPreview({ form, productName, basePrice, productId }: ProductSEOPreviewProps) {
  const metaTitle = form.watch("meta_title") || productName;
  const metaDescription = form.watch("meta_description") || "";
  const slug = form.watch("slug") || "";
  
  // Show the new URL format with ID appended
  const displayUrl = productId ? `${slug}-${productId}` : slug || "product-handle";

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const titleLength = (form.watch("meta_title") || "").length;
  const descriptionLength = (form.watch("meta_description") || "").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Search engine listing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SEO Preview */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-1">
          <p className="text-xs text-muted-foreground truncate">
            paddy.vn › products › {displayUrl}
          </p>
          <p className="text-primary font-medium text-lg truncate hover:underline cursor-pointer">
            {metaTitle || "Product Title"} - {formatPrice(basePrice)}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {metaDescription || "Add a description to see how this product might appear in search engine results."}
          </p>
        </div>

        {/* Editable Fields */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="meta_title"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Page title</Label>
                  <span className={`text-xs ${titleLength > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {titleLength} of 70 characters used
                  </span>
                </div>
                <FormControl>
                  <Input
                    placeholder="Enter page title for search engines"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="meta_description"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Meta description</Label>
                  <span className={`text-xs ${descriptionLength > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {descriptionLength} of 160 characters used
                  </span>
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Enter meta description for search engines"
                    className="min-h-[80px] resize-none"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm font-medium">URL handle</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    paddy.vn/products/
                  </span>
                  <FormControl>
                    <Input
                      placeholder="product-url-handle"
                      className="flex-1"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
