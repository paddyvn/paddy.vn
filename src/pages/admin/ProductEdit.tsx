import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const productFormSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(255, "Name must be less than 255 characters"),
  slug: z.string().trim().min(1, "URL handle is required").max(255, "URL handle must be less than 255 characters").regex(/^[a-z0-9-]+$/, "URL handle can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().nullable(),
  short_description: z.string().max(500, "Short description must be less than 500 characters").nullable(),
  base_price: z.coerce.number().min(0, "Price must be at least 0"),
  compare_at_price: z.coerce.number().min(0, "Compare price must be at least 0").nullable(),
  category_id: z.string().nullable(),
  vendor: z.string().max(100, "Vendor must be less than 100 characters").nullable(),
  product_type: z.string().max(100, "Product type must be less than 100 characters").nullable(),
  tags: z.string().nullable(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  meta_title: z.string().max(60, "Meta title should be less than 60 characters for optimal SEO").nullable(),
  meta_description: z.string().max(160, "Meta description should be less than 160 characters for optimal SEO").nullable(),
  option1_name: z.string().max(50, "Option name must be less than 50 characters").nullable(),
  option2_name: z.string().max(50, "Option name must be less than 50 characters").nullable(),
  option3_name: z.string().max(50, "Option name must be less than 50 characters").nullable(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ["product-edit", id],
    queryFn: async () => {
      if (!id) throw new Error("Product ID is required");
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      short_description: "",
      base_price: 0,
      compare_at_price: null,
      category_id: null,
      vendor: "",
      product_type: "",
      tags: "",
      is_active: true,
      is_featured: false,
      meta_title: "",
      meta_description: "",
      option1_name: "",
      option2_name: "",
      option3_name: "",
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        slug: product.slug,
        description: product.description || "",
        short_description: product.short_description || "",
        base_price: product.base_price,
        compare_at_price: product.compare_at_price,
        category_id: product.category_id,
        vendor: product.vendor || "",
        product_type: product.product_type || "",
        tags: product.tags || "",
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
        meta_title: product.meta_title || "",
        meta_description: product.meta_description || "",
        option1_name: product.option1_name || "",
        option2_name: product.option2_name || "",
        option3_name: product.option3_name || "",
      });
    }
  }, [product, form]);

  const onSubmit = async (values: ProductFormValues) => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: values.name,
          slug: values.slug,
          description: values.description || null,
          short_description: values.short_description || null,
          base_price: values.base_price,
          compare_at_price: values.compare_at_price || null,
          category_id: values.category_id || null,
          vendor: values.vendor || null,
          product_type: values.product_type || null,
          tags: values.tags || null,
          is_active: values.is_active,
          is_featured: values.is_featured,
          meta_title: values.meta_title || null,
          meta_description: values.meta_description || null,
          option1_name: values.option1_name || null,
          option2_name: values.option2_name || null,
          option3_name: values.option3_name || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Product updated",
        description: "Your changes have been saved successfully.",
      });

      navigate("/admin/products");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-[300px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product not found</p>
        <Button onClick={() => navigate("/admin/products")} className="mt-4">
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/products")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Product</h2>
          <p className="text-muted-foreground">Update product information and settings</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <div className="space-y-6 md:col-span-2">
              <h3 className="text-lg font-semibold">Basic Information</h3>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
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
                  <FormLabel>URL Handle *</FormLabel>
                  <FormControl>
                    <Input placeholder="product-url-handle" {...field} />
                  </FormControl>
                  <FormDescription>
                    Used in the product URL. Use lowercase letters, numbers, and hyphens only.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="short_description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief product description for listings"
                      className="min-h-[100px]"
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
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Full Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed product description"
                      className="min-h-[200px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pricing */}
            <div className="space-y-6 md:col-span-2">
              <h3 className="text-lg font-semibold">Pricing</h3>
            </div>

            <FormField
              control={form.control}
              name="base_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (VND) *</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="1000" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="compare_at_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compare at Price (VND)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="0"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Original price to show savings. Leave empty if not on sale.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Organization */}
            <div className="space-y-6 md:col-span-2">
              <h3 className="text-lg font-semibold">Organization</h3>
            </div>

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <FormControl>
                    <Input placeholder="Brand or vendor name" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="product_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Toys, Food, Accessories" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="Comma-separated tags" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>
                    Separate tags with commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Variant Options */}
            <div className="space-y-6 md:col-span-2">
              <h3 className="text-lg font-semibold">Variant Options</h3>
            </div>

            <FormField
              control={form.control}
              name="option1_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Option 1 Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Size, Color" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>
                    Label for the first variant option
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="option2_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Option 2 Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Material, Flavor" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>
                    Label for the second variant option
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="option3_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Option 3 Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Style" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>
                    Label for the third variant option
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SEO */}
            <div className="space-y-6 md:col-span-2">
              <h3 className="text-lg font-semibold">Search Engine Optimization</h3>
            </div>

            <FormField
              control={form.control}
              name="meta_title"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Meta Title</FormLabel>
                  <FormControl>
                    <Input placeholder="SEO title for search engines" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>
                    Recommended: 50-60 characters. This appears in search results.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="meta_description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Meta Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="SEO description for search engines"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Recommended: 150-160 characters. This appears in search results.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <div className="space-y-6 md:col-span-2">
              <h3 className="text-lg font-semibold">Status</h3>
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Make this product visible in your store
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_featured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Featured</FormLabel>
                    <FormDescription>
                      Show this product in featured sections
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/products")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
