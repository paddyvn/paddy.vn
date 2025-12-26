import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, ImageIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useStores,
  useCreateStore,
  useUpdateStore,
} from "@/hooks/useStores";
import { ImagePickerDialog } from "@/components/admin/ImagePickerDialog";

interface StoreFormData {
  name: string;
  address: string;
  image_url: string;
  map_url: string;
  phone: string;
  opening_hours: string;
  is_active: boolean;
  display_order: number;
}

const defaultFormData: StoreFormData = {
  name: "",
  address: "",
  image_url: "",
  map_url: "",
  phone: "",
  opening_hours: "",
  is_active: true,
  display_order: 0,
};

export default function StoreEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id && id !== "new";

  const { data: stores, isLoading: isLoadingStores } = useStores();
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();

  const [formData, setFormData] = useState<StoreFormData>(defaultFormData);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing && stores) {
      const store = stores.find((s) => s.id === id);
      if (store) {
        setFormData({
          name: store.name,
          address: store.address,
          image_url: store.image_url || "",
          map_url: store.map_url || "",
          phone: store.phone || "",
          opening_hours: store.opening_hours || "",
          is_active: store.is_active,
          display_order: store.display_order,
        });
      }
    }
  }, [isEditing, stores, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await updateStore.mutateAsync({
          id: id!,
          ...formData,
          image_url: formData.image_url || null,
          map_url: formData.map_url || null,
          phone: formData.phone || null,
          opening_hours: formData.opening_hours || null,
        });
      } else {
        await createStore.mutateAsync({
          ...formData,
          image_url: formData.image_url || null,
          map_url: formData.map_url || null,
          phone: formData.phone || null,
          opening_hours: formData.opening_hours || null,
        });
      }
      navigate("/admin/settings/stores");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && isLoadingStores) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/settings/stores")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? "Edit Store" : "Add New Store"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter store name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Enter full address"
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="e.g., 0123 456 789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="opening_hours">Opening Hours</Label>
                    <Input
                      id="opening_hours"
                      value={formData.opening_hours}
                      onChange={(e) =>
                        setFormData({ ...formData, opening_hours: e.target.value })
                      }
                      placeholder="e.g., 8:00 - 21:00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="map_url">Google Maps URL</Label>
                  <Input
                    id="map_url"
                    value={formData.map_url}
                    onChange={(e) =>
                      setFormData({ ...formData, map_url: e.target.value })
                    }
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Store Image</CardTitle>
              </CardHeader>
              <CardContent>
                {formData.image_url ? (
                  <div className="space-y-3">
                    <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border bg-muted">
                      <img
                        src={formData.image_url}
                        alt="Store"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => setFormData({ ...formData, image_url: "" })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsImagePickerOpen(true)}
                    >
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsImagePickerOpen(true)}
                    className="w-full max-w-md aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors bg-muted/50"
                  >
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to select image</span>
                  </button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        display_order: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEditing ? "Update Store" : "Create Store"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      <ImagePickerDialog
        open={isImagePickerOpen}
        onOpenChange={setIsImagePickerOpen}
        onSelect={(url) => setFormData({ ...formData, image_url: url })}
        currentImage={formData.image_url}
      />
    </div>
  );
}
