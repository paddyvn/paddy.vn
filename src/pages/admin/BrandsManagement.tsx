import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Image, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ImagePickerDialog } from "@/components/admin/ImagePickerDialog";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
  country_code: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

interface BrandFormData {
  name: string;
  slug: string;
  logo_url: string;
  description: string;
  website_url: string;
  country_code: string;
  is_active: boolean;
  display_order: number;
}

const initialFormData: BrandFormData = {
  name: "",
  slug: "",
  logo_url: "",
  description: "",
  website_url: "",
  country_code: "",
  is_active: true,
  display_order: 0,
};

export default function BrandsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState<BrandFormData>(initialFormData);

  // Fetch brands
  const { data: brands, isLoading } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Brand[];
    },
  });

  // Fetch product counts per brand
  const { data: productCounts } = useQuery({
    queryKey: ["brand-product-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("brand_id")
        .not("brand_id", "is", null);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((p) => {
        if (p.brand_id) {
          counts[p.brand_id] = (counts[p.brand_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: BrandFormData) => {
      if (editingBrand) {
        const { error } = await supabase
          .from("brands")
          .update({
            name: data.name,
            slug: data.slug,
            logo_url: data.logo_url || null,
            description: data.description || null,
            website_url: data.website_url || null,
            country_code: data.country_code || null,
            is_active: data.is_active,
            display_order: data.display_order,
          })
          .eq("id", editingBrand.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("brands").insert({
          name: data.name,
          slug: data.slug,
          logo_url: data.logo_url || null,
          description: data.description || null,
          website_url: data.website_url || null,
          country_code: data.country_code || null,
          is_active: data.is_active,
          display_order: data.display_order,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      toast({
        title: editingBrand ? "Brand updated" : "Brand created",
        description: `${formData.name} has been ${editingBrand ? "updated" : "created"} successfully.`,
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("brands").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      toast({
        title: "Brand deleted",
        description: "The brand has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setDeletingBrand(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingBrand(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      slug: brand.slug,
      logo_url: brand.logo_url || "",
      description: brand.description || "",
      website_url: brand.website_url || "",
      country_code: brand.country_code || "",
      is_active: brand.is_active,
      display_order: brand.display_order,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBrand(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingBrand ? prev.slug : slug,
    }));
  };

  const filteredBrands = brands?.filter((brand) =>
    brand.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brands</h1>
          <p className="text-muted-foreground text-sm">
            Manage product brands and their details
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Brand
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Logo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-center">Products</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-10 w-10 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredBrands?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No brands found
                </TableCell>
              </TableRow>
            ) : (
              filteredBrands?.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="h-10 w-10 object-contain rounded border"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center">
                        <Image className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {brand.slug}
                  </TableCell>
                  <TableCell className="text-center">
                    {productCounts?.[brand.id] || 0}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={brand.is_active ? "default" : "secondary"}>
                      {brand.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(brand)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingBrand(brand);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingBrand ? "Edit Brand" : "Create Brand"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt="Logo preview"
                    className="h-16 w-16 object-contain rounded border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded border bg-muted flex items-center justify-center">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setImagePickerOpen(true)}
                >
                  Choose Image
                </Button>
                {formData.logo_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, logo_url: "" }))
                    }
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, website_url: e.target.value }))
                  }
                  placeholder="https://"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country_code">Country Code</Label>
                <Input
                  id="country_code"
                  value={formData.country_code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, country_code: e.target.value }))
                  }
                  placeholder="US, VN, JP..."
                  maxLength={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      display_order: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? "Saving..."
                  : editingBrand
                  ? "Update"
                  : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Brand</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete "{deletingBrand?.name}"? This action
            cannot be undone.
          </p>
          {productCounts && deletingBrand && productCounts[deletingBrand.id] > 0 && (
            <p className="text-destructive text-sm">
              Warning: This brand has {productCounts[deletingBrand.id]} products
              associated with it.
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingBrand(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingBrand && deleteMutation.mutate(deletingBrand.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Picker */}
      <ImagePickerDialog
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        onSelect={(url) => {
          setFormData((prev) => ({ ...prev, logo_url: url }));
          setImagePickerOpen(false);
        }}
      />
    </div>
  );
}
