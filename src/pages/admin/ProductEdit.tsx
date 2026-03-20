import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Eye, Copy, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Components
import { ProductMediaGallery } from "@/components/admin/ProductMediaGallery";
import { ProductVariantsTable } from "@/components/admin/ProductVariantsTable";
import { ProductSEOPreview } from "@/components/admin/ProductSEOPreview";
import { ProductCollectionTags } from "@/components/admin/ProductCollectionTags";
import { ProductTagsInput } from "@/components/admin/ProductTagsInput";
import { ProductStatusCard } from "@/components/admin/ProductStatusCard";
import { ProductOrganizationCard } from "@/components/admin/ProductOrganizationCard";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { NutritionFactsEditor } from "@/components/admin/NutritionFactsEditor";

const productFormSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(255, "Name must be less than 255 characters"),
  slug: z.string().trim().min(1, "URL handle is required").max(255, "URL handle must be less than 255 characters").regex(/^[a-z0-9-]+$/, "URL handle can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().nullable(),
  short_description: z.string().max(500, "Short description must be less than 500 characters").nullable(),
  base_price: z.coerce.number().min(0, "Price must be at least 0"),
  compare_at_price: z.coerce.number().min(0, "Compare price must be at least 0").nullable(),
  category_id: z.string().nullable(),
  brand: z.string().max(100, "Brand must be less than 100 characters").nullable(),
  product_type: z.string().max(100, "Product type must be less than 100 characters").nullable(),
  pet_type: z.string().max(50, "Pet type must be less than 50 characters").nullable(),
  tags: z.string().nullable(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  meta_title: z.string().max(60, "Meta title should be less than 60 characters for optimal SEO").nullable(),
  meta_description: z.string().max(160, "Meta description should be less than 160 characters for optimal SEO").nullable(),
  option1_name: z.string().max(50, "Option name must be less than 50 characters").nullable(),
  option2_name: z.string().max(50, "Option name must be less than 50 characters").nullable(),
  option3_name: z.string().max(50, "Option name must be less than 50 characters").nullable(),
  target_age_id: z.string().nullable(),
  target_size_id: z.string().nullable(),
  origin_id: z.string().nullable(),
  ingredients: z.string().nullable(),
  feeding_guidelines: z.string().nullable(),
  nutrition_facts: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).nullable(),
  show_description: z.boolean(),
  show_ingredients: z.boolean(),
  show_feeding_guidelines: z.boolean(),
  show_nutrition_facts: z.boolean(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === undefined;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedHealthConditions, setSelectedHealthConditions] = useState<string[]>([]);

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
    enabled: !isNew && !!id,
  });

  const { data: variantsCount = 0 } = useQuery({
    queryKey: ["product-variants-count", id],
    queryFn: async () => {
      if (!id) return 0;
      const { count, error } = await supabase
        .from("product_variants")
        .select("*", { count: "exact", head: true })
        .eq("product_id", id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!id,
  });

  // Fetch product's health conditions
  const { data: productHealthConditions = [] } = useQuery({
    queryKey: ["product-health-conditions", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("product_health_condition_links")
        .select("health_condition_id")
        .eq("product_id", id);
      if (error) throw error;
      return data.map(d => d.health_condition_id);
    },
    enabled: !!id,
  });

  // Sync health conditions from query to state
  useEffect(() => {
    if (productHealthConditions.length > 0) {
      setSelectedHealthConditions(productHealthConditions);
    }
  }, [productHealthConditions]);

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
      brand: "",
      product_type: "",
      pet_type: "",
      tags: "",
      is_active: false,
      is_featured: false,
      meta_title: "",
      meta_description: "",
      option1_name: "",
      option2_name: "",
      option3_name: "",
      target_age_id: null,
      target_size_id: null,
      origin_id: null,
      ingredients: "",
      feeding_guidelines: "",
      nutrition_facts: [],
      show_description: true,
      show_ingredients: true,
      show_feeding_guidelines: true,
      show_nutrition_facts: true,
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
        brand: product.brand || "",
        product_type: product.product_type || "",
        pet_type: product.pet_type || "",
        tags: product.tags || "",
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
        meta_title: product.meta_title || "",
        meta_description: product.meta_description || "",
        option1_name: product.option1_name || "",
        option2_name: product.option2_name || "",
        option3_name: product.option3_name || "",
        target_age_id: product.target_age_id || null,
        target_size_id: product.target_size_id || null,
        origin_id: product.origin_id || null,
        ingredients: product.ingredients || "",
        feeding_guidelines: product.feeding_guidelines || "",
        nutrition_facts: (product.nutrition_facts as any) || [],
        show_description: product.show_description ?? true,
        show_ingredients: product.show_ingredients ?? true,
        show_feeding_guidelines: product.show_feeding_guidelines ?? true,
        show_nutrition_facts: product.show_nutrition_facts ?? true,
      });
    }
  }, [product, form]);

  // Auto-generate slug from name for new products
  const watchedName = form.watch("name");
  useEffect(() => {
    if (isNew && watchedName) {
      const slug = watchedName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d").replace(/Đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      form.setValue("slug", slug);
    }
  }, [isNew, watchedName]);

  const onSubmit = async (values: ProductFormValues) => {
    try {
      if (isNew) {
        // INSERT new product
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert({
            name: values.name,
            slug: values.slug,
            description: values.description || null,
            short_description: values.short_description || null,
            base_price: values.base_price,
            compare_at_price: values.compare_at_price || null,
            category_id: values.category_id || null,
            is_active: values.is_active,
            is_featured: values.is_featured,
            brand: values.brand || null,
            product_type: values.product_type || null,
            pet_type: values.pet_type || null,
            tags: values.tags || null,
            meta_title: values.meta_title || null,
            meta_description: values.meta_description || null,
            option1_name: values.option1_name || null,
            option2_name: values.option2_name || null,
            option3_name: values.option3_name || null,
            target_age_id: values.target_age_id || null,
            target_size_id: values.target_size_id || null,
            origin_id: values.origin_id || null,
            ingredients: values.ingredients || null,
            feeding_guidelines: values.feeding_guidelines || null,
            nutrition_facts: values.nutrition_facts && values.nutrition_facts.length > 0
              ? values.nutrition_facts as any
              : null,
            show_description: values.show_description,
            show_ingredients: values.show_ingredients,
            show_feeding_guidelines: values.show_feeding_guidelines,
            show_nutrition_facts: values.show_nutrition_facts,
          })
          .select("id")
          .single();

        if (error) throw error;

        // Save health conditions
        if (selectedHealthConditions.length > 0) {
          await supabase.from("product_health_condition_links").insert(
            selectedHealthConditions.map((hcId) => ({
              product_id: newProduct.id,
              health_condition_id: hcId,
            }))
          );
        }

        toast({ title: "Product created", description: "Redirecting to edit page..." });
        queryClient.invalidateQueries({ queryKey: ["admin-products"] });
        navigate(`/admin/products/${newProduct.id}/edit`, { replace: true });
      } else {
        if (!id) return;
        // UPDATE existing product
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
            brand: values.brand || null,
            product_type: values.product_type || null,
            pet_type: values.pet_type || null,
            tags: values.tags || null,
            is_active: values.is_active,
            is_featured: values.is_featured,
            meta_title: values.meta_title || null,
            meta_description: values.meta_description || null,
            option1_name: values.option1_name || null,
            option2_name: values.option2_name || null,
            option3_name: values.option3_name || null,
            target_age_id: values.target_age_id || null,
            target_size_id: values.target_size_id || null,
            origin_id: values.origin_id || null,
            ingredients: values.ingredients || null,
            feeding_guidelines: values.feeding_guidelines || null,
            nutrition_facts: values.nutrition_facts && values.nutrition_facts.length > 0
              ? values.nutrition_facts as any
              : null,
            show_description: values.show_description,
            show_ingredients: values.show_ingredients,
            show_feeding_guidelines: values.show_feeding_guidelines,
            show_nutrition_facts: values.show_nutrition_facts,
          })
          .eq("id", id);

        if (error) throw error;

        // Update health conditions
        await supabase
          .from("product_health_condition_links")
          .delete()
          .eq("product_id", id);

        if (selectedHealthConditions.length > 0) {
          const { error: healthError } = await supabase
            .from("product_health_condition_links")
            .insert(
              selectedHealthConditions.map(conditionId => ({
                product_id: id,
                health_condition_id: conditionId,
              }))
            );
          if (healthError) throw healthError;
        }

        queryClient.invalidateQueries({ queryKey: ["product-health-conditions", id] });

        toast({
          title: "Product updated",
          description: "Your changes have been saved successfully.",
        });

        navigate("/admin/products");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save product",
        variant: "destructive",
      });
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-[300px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[150px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!isNew && !product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product not found</p>
        <Button onClick={() => navigate("/admin/products")} className="mt-4">
          Back to Products
        </Button>
      </div>
    );
  }

  const isActive = form.watch("is_active");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/products")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">
                {isNew ? "New Product" : product?.name}
              </h2>
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Active" : "Draft"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && product && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(`/products/${product.slug}`, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                form.reset();
                navigate("/admin/products");
              }}
              disabled={form.formState.isSubmitting}
            >
              Discard
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
            {!isNew && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(`/products/${product?.slug}`, '_blank')}>
                    View on store
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & Description Card */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Short sleeve t-shirt" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Add a description for this product..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Pet-Specific Content */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Thông tin sản phẩm</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Thành phần, hướng dẫn cho ăn và thông tin dinh dưỡng
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Ingredients */}
                  <FormField
                    control={form.control}
                    name="ingredients"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Thành phần</FormLabel>
                          <FormField
                            control={form.control}
                            name="show_ingredients"
                            render={({ field: toggleField }) => (
                              <Switch
                                checked={toggleField.value}
                                onCheckedChange={toggleField.onChange}
                              />
                            )}
                          />
                        </div>
                        <FormControl>
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Nhập danh sách thành phần..."
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Feeding Guidelines */}
                  <FormField
                    control={form.control}
                    name="feeding_guidelines"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Hướng dẫn cho ăn</FormLabel>
                          <FormField
                            control={form.control}
                            name="show_feeding_guidelines"
                            render={({ field: toggleField }) => (
                              <Switch
                                checked={toggleField.value}
                                onCheckedChange={toggleField.onChange}
                              />
                            )}
                          />
                        </div>
                        <FormControl>
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Nhập hướng dẫn cho ăn, bảng liều lượng..."
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Nutrition Facts */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Thông tin dinh dưỡng</Label>
                      <FormField
                        control={form.control}
                        name="show_nutrition_facts"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                    <NutritionFactsEditor
                      value={(form.watch("nutrition_facts") || []) as Array<{ label: string; value: string }>}
                      onChange={(facts) => form.setValue("nutrition_facts", facts)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Media */}
              {!isNew && id && <ProductMediaGallery productId={id} />}

              {/* Helper message for new products */}
              {isNew && (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <p>Save the product first to add images, variants, and collections.</p>
                  </CardContent>
                </Card>
              )}

              {/* Pricing Card - Only show when no variants or new product */}
              {(isNew || variantsCount === 0) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">Pricing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="base_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                  ₫
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="1000"
                                  placeholder="0"
                                  className="pl-7"
                                  {...field}
                                />
                              </div>
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
                            <FormLabel>Compare-at price</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                  ₫
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="1000"
                                  placeholder="0"
                                  className="pl-7"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Variants */}
              {!isNew && id && (
                <ProductVariantsTable
                  productId={id}
                  option1Name={product?.option1_name}
                  option2Name={product?.option2_name}
                  option3Name={product?.option3_name}
                />
              )}

              {/* SEO */}
              <ProductSEOPreview
                form={form}
                productName={isNew ? form.watch("name") || "New Product" : product?.name || ""}
                basePrice={isNew ? form.watch("base_price") || 0 : product?.base_price || 0}
              />
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Status */}
              <ProductStatusCard form={form} />

              {/* Product Organization */}
              <ProductOrganizationCard 
                form={form} 
                selectedHealthConditions={selectedHealthConditions}
                onHealthConditionsChange={setSelectedHealthConditions}
              />

              {/* Collections */}
              {!isNew && id && <ProductCollectionTags productId={id} />}

              {/* Tags */}
              <ProductTagsInput form={form} />
            </div>
          </div>
        </form>
      </Form>
  );
}
