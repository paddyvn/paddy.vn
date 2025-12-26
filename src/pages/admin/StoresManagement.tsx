import { useState } from "react";
import { Plus, Pencil, Trash2, MapPin, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useStores,
  useCreateStore,
  useUpdateStore,
  useDeleteStore,
  Store,
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

export default function StoresManagement() {
  const { data: stores, isLoading } = useStores();
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();
  const deleteStore = useDeleteStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState<StoreFormData>(defaultFormData);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingStore(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (store: Store) => {
    setEditingStore(store);
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
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingStore) {
      updateStore.mutate(
        { id: editingStore.id, ...formData },
        { onSuccess: () => setIsDialogOpen(false) }
      );
    } else {
      createStore.mutate(formData, {
        onSuccess: () => setIsDialogOpen(false),
      });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteStore.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const handleToggleActive = (store: Store) => {
    updateStore.mutate({ id: store.id, is_active: !store.is_active });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Store Locations</h1>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Store
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Stores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead className="w-24">Active</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores?.map((store, index) => (
                <TableRow key={store.id}>
                  <TableCell className="text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {store.address}
                  </TableCell>
                  <TableCell>{store.phone || "-"}</TableCell>
                  <TableCell>{store.opening_hours || "-"}</TableCell>
                  <TableCell>
                    <Switch
                      checked={store.is_active}
                      onCheckedChange={() => handleToggleActive(store)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(store)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(store.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!stores || stores.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No stores found. Add your first store location.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingStore ? "Edit Store" : "Add New Store"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Store Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Paddy Pet Shop - Location"
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
                placeholder="Full address"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="0901 234 567"
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
                  placeholder="8:00 - 21:00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Store Image</Label>
              {formData.image_url ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
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
              ) : (
                <button
                  type="button"
                  onClick={() => setIsImagePickerOpen(true)}
                  className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors bg-muted/50"
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to select image</span>
                </button>
              )}
              {formData.image_url && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsImagePickerOpen(true)}
                  className="w-full"
                >
                  Change Image
                </Button>
              )}
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
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !formData.name ||
                !formData.address ||
                createStore.isPending ||
                updateStore.isPending
              }
            >
              {editingStore ? "Save Changes" : "Create Store"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Store</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this store? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Picker Dialog */}
      <ImagePickerDialog
        open={isImagePickerOpen}
        onOpenChange={setIsImagePickerOpen}
        onSelect={(url) => setFormData({ ...formData, image_url: url })}
        currentImage={formData.image_url}
      />
    </div>
  );
}
