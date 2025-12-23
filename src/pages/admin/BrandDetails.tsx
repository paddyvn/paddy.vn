import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Upload, ChevronDown, MoreHorizontal, Eye, ExternalLink, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { ImagePickerDialog } from "@/components/admin/ImagePickerDialog";

const brandSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  slug: z.string().trim().min(1, "Slug is required").max(100),
  description: z.string().max(5000).optional(),
  logo_url: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  website_url: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  country_code: z.string().max(3).optional(),
});

export default function BrandDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isNewBrand = id === "new";
  const [isSaving, setIsSaving] = useState(false);
  const [isSeoEditing, setIsSeoEditing] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    logo_url: "",
    website_url: "",
    country_code: "",
    is_active: true,
    display_order: 0,
  });
  const [seoFormData, setSeoFormData] = useState({
    slug: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: brand, isLoading } = useQuery({
    queryKey: ["brand", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !isNewBrand,
  });

  // Get product count for this brand
  const { data: productCount } = useQuery({
    queryKey: ["brand-products-count", id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("brand_id", id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!id && !isNewBrand,
  });

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name,
        slug: brand.slug,
        description: brand.description || "",
        logo_url: brand.logo_url || "",
        website_url: brand.website_url || "",
        country_code: brand.country_code || "",
        is_active: brand.is_active,
        display_order: brand.display_order || 0,
      });
      setSeoFormData({
        slug: brand.slug,
      });
    }
  }, [brand]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name, slug: isNewBrand ? generateSlug(name) : formData.slug });
  };

  const validateForm = () => {
    try {
      brandSchema.parse(formData);
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
      const brandData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        logo_url: formData.logo_url.trim() || null,
        website_url: formData.website_url.trim() || null,
        country_code: formData.country_code.trim() || null,
        is_active: formData.is_active,
        display_order: formData.display_order,
      };

      if (isNewBrand) {
        const { data, error } = await supabase
          .from("brands")
          .insert(brandData)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Brand created",
          description: "Your brand has been created successfully.",
        });

        navigate(`/admin/products/brands/${data.id}`, { replace: true });
      } else {
        const { error } = await supabase
          .from("brands")
          .update(brandData)
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Brand updated",
          description: "Your changes have been saved successfully.",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      queryClient.invalidateQueries({ queryKey: ["brand", id] });
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

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("brands")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Brand deleted",
        description: "The brand has been deleted successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      navigate("/admin/products/brands");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete brand",
        variant: "destructive",
      });
    }
  };

  const handleSeoSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("brands")
        .update({
          slug: seoFormData.slug.trim(),
        })
        .eq("id", id);

      if (error) throw error;

      setFormData({
        ...formData,
        slug: seoFormData.slug,
      });

      toast({
        title: "URL updated",
        description: "The brand URL has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save URL",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !isNewBrand) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-[300px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[200px]" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[250px]" />
            <Skeleton className="h-[150px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!brand && !isNewBrand) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Brand not found</p>
        <Button onClick={() => navigate("/admin/products/brands")} className="mt-4">
          Back to Brands
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/products/brands")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isNewBrand ? "Create brand" : brand?.name}
          </h1>
          {!isNewBrand && (
            <Badge variant={formData.is_active ? "default" : "secondary"}>
              {formData.is_active ? "Active" : "Inactive"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isNewBrand && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`/collections/${formData.slug}`, '_blank')}
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
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete brand
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? (isNewBrand ? "Creating..." : "Saving...") : (isNewBrand ? "Create" : "Save")}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Name & Description */}
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Royal Canin"
                maxLength={100}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter a description for this brand..."
                rows={4}
                maxLength={5000}
              />
              {formErrors.description && (
                <p className="text-sm text-destructive">{formErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://example.com"
                />
                {formErrors.website_url && (
                  <p className="text-sm text-destructive">{formErrors.website_url}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="country_code">Country</Label>
                <Input
                  id="country_code"
                  value={formData.country_code}
                  onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })}
                  placeholder="US, VN, JP..."
                  maxLength={3}
                />
              </div>
            </div>
          </Card>

          {/* Products in this brand */}
          {!isNewBrand && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Products</h3>
                <Badge variant="secondary">{productCount} products</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Products are linked to this brand through the product edit page.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/products?brand=${formData.name}`)}
              >
                View products
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Card>
          )}

          {/* URL Handle */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">URL handle</h3>
              {!isSeoEditing && !isNewBrand && (
                <Button 
                  variant="link" 
                  size="sm"
                  className="text-primary p-0 h-auto"
                  onClick={() => {
                    setSeoFormData({
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
                <div className="space-y-2">
                  <Label htmlFor="seo-slug">URL handle</Label>
                  <Input
                    id="seo-slug"
                    value={seoFormData.slug}
                    onChange={(e) => setSeoFormData({ ...seoFormData, slug: e.target.value })}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    https://paddy.vn/brands/{seoFormData.slug}
                  </p>
                </div>

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
                <p className="text-sm text-muted-foreground">
                  https://paddy.vn/brands/{formData.slug}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Status</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Inactive brands won't appear on the storefront.
            </p>
          </Card>

          {/* Logo */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Logo</h3>
              {formData.logo_url && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="link" size="sm" className="text-primary p-0 h-auto">
                      Edit
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background">
                    <DropdownMenuItem onClick={() => setIsImagePickerOpen(true)}>
                      Change logo
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive" 
                      onClick={() => setFormData({ ...formData, logo_url: "" })}
                    >
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {formData.logo_url ? (
              <img
                src={formData.logo_url}
                alt={formData.name}
                className="w-full aspect-square object-contain rounded-lg bg-muted/30 p-4"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsImagePickerOpen(true)}
                className="w-full border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
              >
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to add a logo
                </p>
              </button>
            )}
          </Card>

          {/* Display Order */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Display order</h3>
            <div className="space-y-2">
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first in brand listings.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Image Picker Dialog */}
      <ImagePickerDialog
        open={isImagePickerOpen}
        onOpenChange={setIsImagePickerOpen}
        onSelect={(url) => setFormData({ ...formData, logo_url: url })}
        currentImage={formData.logo_url}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete brand</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{brand?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {productCount && productCount > 0 && (
            <p className="text-sm text-destructive">
              Warning: This brand has {productCount} products associated with it.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
