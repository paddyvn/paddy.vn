import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Upload, X, Save, Eye, Plus, Trash2, Copy, MoreHorizontal, Pencil } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const collectionSchema = z.object({
  name: z.string().trim().min(1, "Title is required").max(100),
  slug: z.string().trim().min(1, "Slug is required").max(100),
  description: z.string().max(50000).optional(),
  image_url: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(160).optional(),
});

type CollectionRule = {
  field: string;
  operator: string;
  value: string;
};

const RULE_FIELDS = [
  { value: "brand", label: "Brand" },
  { value: "name", label: "Title" },
  { value: "product_type", label: "Product type" },
  { value: "tags", label: "Tags" },
];

const RULE_OPERATORS = [
  { value: "equals", label: "is equal to" },
  { value: "not_equals", label: "is not equal to" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
];

const COLLECTION_TYPES = [
  { value: "custom", label: "Custom collection" },
  { value: "brand", label: "Brand" },
  { value: "smart", label: "Smart collection" },
  { value: "category", label: "Category" },
  { value: "sale", label: "Sale / Promotion" },
  { value: "new", label: "New Arrivals" },
  { value: "featured", label: "Featured" },
  { value: "pet_type", label: "Pet Type" },
];

export default function CollectionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isSeoEditing, setIsSeoEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    is_active: true,
    meta_title: "",
    meta_description: "",
    collection_type: "custom",
    rules_match_type: "all",
  });
  const [rules, setRules] = useState<CollectionRule[]>([]);
  const [seoFormData, setSeoFormData] = useState({
    meta_title: "",
    meta_description: "",
    slug: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: collection, isLoading } = useQuery({
    queryKey: ["collection", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select(`
          *,
          product_collections(
            id,
            position,
            product_id,
            products(
              id,
              name,
              base_price,
              is_active,
              product_images(image_url, is_primary)
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name,
        slug: collection.slug,
        description: collection.description || "",
        image_url: collection.image_url || "",
        is_active: collection.is_active,
        meta_title: collection.meta_title || "",
        meta_description: collection.meta_description || "",
        collection_type: collection.collection_type || "custom",
        rules_match_type: collection.rules_match_type || "all",
      });
      setSeoFormData({
        meta_title: collection.meta_title || "",
        meta_description: collection.meta_description || "",
        slug: collection.slug,
      });
      setRules(collection.rules || []);
    }
  }, [collection]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name, slug: generateSlug(name) });
  };

  const validateForm = () => {
    try {
      collectionSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("categories")
        .update({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim() || null,
          image_url: formData.image_url.trim() || null,
          is_active: formData.is_active,
          meta_title: formData.meta_title.trim() || null,
          meta_description: formData.meta_description.trim() || null,
          collection_type: formData.collection_type,
          rules: rules.length > 0 ? rules : null,
          rules_match_type: formData.rules_match_type,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Collection updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addRule = () => {
    setRules([...rules, { field: "vendor", operator: "equals", value: "" }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof CollectionRule, value: string) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  const handleSeoSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("categories")
        .update({
          meta_title: seoFormData.meta_title.trim() || null,
          meta_description: seoFormData.meta_description.trim() || null,
          slug: seoFormData.slug.trim(),
        })
        .eq("id", id);

      if (error) throw error;

      setFormData({
        ...formData,
        meta_title: seoFormData.meta_title,
        meta_description: seoFormData.meta_description,
        slug: seoFormData.slug,
      });

      toast({
        title: "SEO settings updated",
        description: "Your search engine listing has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save SEO settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPrimaryImage = (images: Array<{ image_url: string; is_primary: boolean }>) => {
    const primary = images?.find(img => img.is_primary);
    return primary?.image_url || images?.[0]?.image_url;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-[300px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[300px]" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[300px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Collection not found</p>
        <Button onClick={() => navigate("/admin/collections")} className="mt-4">
          Back to Collections
        </Button>
      </div>
    );
  }

  const products = collection.product_collections
    ?.map((pc: any) => pc.products)
    .filter(Boolean) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/collections")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{collection.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(`/collection/${formData.slug}`, '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                More actions
                <MoreHorizontal className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive">
                Delete collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Description */}
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Summer Collection"
                maxLength={100}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
              />
              {formErrors.description && (
                <p className="text-sm text-destructive">{formErrors.description}</p>
              )}
            </div>
          </Card>

          {/* Conditions */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Conditions</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm">Products must match:</span>
                <RadioGroup
                  value={formData.rules_match_type}
                  onValueChange={(value) => setFormData({ ...formData, rules_match_type: value })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="font-normal cursor-pointer">all conditions</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="any" id="any" />
                    <Label htmlFor="any" className="font-normal cursor-pointer">any condition</Label>
                  </div>
                </RadioGroup>
              </div>

              {rules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={rule.field}
                    onValueChange={(value) => updateRule(index, "field", value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RULE_FIELDS.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={rule.operator}
                    onValueChange={(value) => updateRule(index, "operator", value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RULE_OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={rule.value}
                    onChange={(e) => updateRule(index, "value", e.target.value)}
                    placeholder="Enter value..."
                    className="flex-1"
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRule(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={addRule}
                className="w-fit"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add another condition
              </Button>
            </div>
          </Card>

          {/* Products */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Products ({products.length})
              </h3>
              <Select defaultValue="best-selling">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best-selling">Best selling</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="price-low">Price: Low to high</SelectItem>
                  <SelectItem value="price-high">Price: High to low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No products in this collection</p>
              </div>
            ) : (
              <div className="space-y-2">
                {products.slice(0, 15).map((product: any, index: number) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    {getPrimaryImage(product.product_images) ? (
                      <img
                        src={getPrimaryImage(product.product_images)}
                        alt={product.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                    </div>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
                {products.length > 15 && (
                  <Button variant="link" className="w-full">
                    Show more products
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Search Engine Listing */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Search engine listing</h3>
              {!isSeoEditing && (
                <Button 
                  variant="link" 
                  size="sm"
                  className="text-primary p-0 h-auto"
                  onClick={() => {
                    setSeoFormData({
                      meta_title: formData.meta_title || formData.name,
                      meta_description: formData.meta_description || formData.description?.replace(/<[^>]*>/g, '') || "",
                      slug: formData.slug,
                    });
                    setIsSeoEditing(true);
                  }}
                >
                  Edit
                </Button>
              )}
            </div>
            
            {isSeoEditing ? (
              <div className="space-y-4">
                {/* Live Preview */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-1">
                  <h4 className="text-primary text-lg font-medium">
                    {seoFormData.meta_title || formData.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    https://paddy.vn › collections › {seoFormData.slug}
                  </p>
                  {seoFormData.meta_description && (
                    <p className="text-sm">
                      {seoFormData.meta_description}
                    </p>
                  )}
                </div>

                {/* Page Title */}
                <div className="space-y-2">
                  <Label htmlFor="seo-title">Page title</Label>
                  <Input
                    id="seo-title"
                    value={seoFormData.meta_title}
                    onChange={(e) => setSeoFormData({ ...seoFormData, meta_title: e.target.value })}
                    placeholder={formData.name}
                    maxLength={70}
                  />
                  <p className="text-xs text-muted-foreground">
                    {seoFormData.meta_title.length} of 70 characters used
                  </p>
                </div>

                {/* Meta Description */}
                <div className="space-y-2">
                  <Label htmlFor="seo-description">Meta description</Label>
                  <Textarea
                    id="seo-description"
                    value={seoFormData.meta_description}
                    onChange={(e) => setSeoFormData({ ...seoFormData, meta_description: e.target.value })}
                    placeholder="Enter a description..."
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    {seoFormData.meta_description.length} of 160 characters used
                  </p>
                </div>

                {/* URL Handle */}
                <div className="space-y-2">
                  <Label htmlFor="seo-slug">URL handle</Label>
                  <Input
                    id="seo-slug"
                    value={seoFormData.slug}
                    onChange={(e) => setSeoFormData({ ...seoFormData, slug: e.target.value })}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    https://paddy.vn/collections/{seoFormData.slug}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsSeoEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={async () => {
                      await handleSeoSave();
                      setIsSeoEditing(false);
                    }} 
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <h4 className="text-primary text-lg">
                  {formData.meta_title || formData.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  https://paddy.vn › collections › {formData.slug}
                </p>
                {(formData.meta_description || formData.description) && (
                  <p className="text-sm line-clamp-2">
                    {formData.meta_description || formData.description?.replace(/<[^>]*>/g, '')}
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Publishing */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Publishing</h3>
              <Button variant="link" size="sm" className="text-primary p-0 h-auto">
                Manage
              </Button>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Sales channels</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${formData.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm">
                  {formData.is_active ? 'Online Store' : 'Inactive'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className="w-full"
              >
                {formData.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </Card>

          {/* Image */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Image</h3>
              {formData.image_url && (
                <Button variant="link" size="sm" className="text-primary p-0 h-auto">
                  Edit
                </Button>
              )}
            </div>
            
            {formData.image_url ? (
              <div className="relative group">
                <img
                  src={formData.image_url}
                  alt={formData.name}
                  className="w-full aspect-square object-contain rounded-lg bg-muted/30"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setFormData({ ...formData, image_url: "" })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Add an image to showcase this collection
                </p>
                <div className="space-y-2">
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="Image URL"
                    maxLength={500}
                  />
                  {formErrors.image_url && (
                    <p className="text-sm text-destructive">{formErrors.image_url}</p>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Collection Type */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Collection type</h3>
            <Select
              value={formData.collection_type}
              onValueChange={(value) => setFormData({ ...formData, collection_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLLECTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.collection_type === 'brand' 
                ? 'Brand collections appear in the Brands section on the homepage'
                : formData.collection_type === 'smart'
                ? 'Smart collections automatically include products based on conditions'
                : 'Custom collections allow manual product selection'}
            </p>
          </Card>
        </div>
      </div>

    </div>
  );
}
