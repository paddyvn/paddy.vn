import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Promotion } from "@/hooks/usePromotions";

type PromotionFormData = {
  title: string;
  subtitle: string;
  gradient_from: string;
  gradient_to: string;
  link_type: string;
  link_destination: string;
  promo_type: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
};

const defaultFormData: PromotionFormData = {
  title: "",
  subtitle: "",
  gradient_from: "#8B5CF6",
  gradient_to: "#6366F1",
  link_type: "collection",
  link_destination: "",
  promo_type: "deal",
  is_active: true,
  start_date: "",
  end_date: "",
};

export default function PromotionsManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<PromotionFormData>(defaultFormData);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: promotions, isLoading } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Promotion[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PromotionFormData) => {
      const maxOrder = promotions?.length ? Math.max(...promotions.map(p => p.display_order)) + 1 : 0;
      const { error } = await supabase.from("promotions").insert({
        ...data,
        display_order: maxOrder,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast({ title: "Promotion created" });
      closeDialog();
    },
    onError: () => toast({ title: "Error creating promotion", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PromotionFormData }) => {
      const { error } = await supabase
        .from("promotions")
        .update({
          ...data,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast({ title: "Promotion updated" });
      closeDialog();
    },
    onError: () => toast({ title: "Error updating promotion", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast({ title: "Promotion deleted" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "Error deleting promotion", variant: "destructive" }),
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPromotion(null);
    setFormData(defaultFormData);
  };

  const openCreate = () => {
    setFormData(defaultFormData);
    setEditingPromotion(null);
    setIsDialogOpen(true);
  };

  const openEdit = (promo: Promotion) => {
    setEditingPromotion(promo);
    setFormData({
      title: promo.title,
      subtitle: promo.subtitle || "",
      gradient_from: promo.gradient_from,
      gradient_to: promo.gradient_to,
      link_type: promo.link_type,
      link_destination: promo.link_destination,
      promo_type: promo.promo_type,
      is_active: promo.is_active,
      start_date: promo.start_date?.split("T")[0] || "",
      end_date: promo.end_date?.split("T")[0] || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.link_destination) {
      toast({ title: "Title and link destination are required", variant: "destructive" });
      return;
    }
    if (editingPromotion) {
      updateMutation.mutate({ id: editingPromotion.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promotions</h1>
          <p className="text-muted-foreground">Manage deals and promotional banners</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Promotion
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Promotions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : !promotions?.length ? (
            <p className="text-muted-foreground">No promotions yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <div
                        className="w-24 h-12 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                        style={{
                          background: `linear-gradient(135deg, ${promo.gradient_from}, ${promo.gradient_to})`,
                        }}
                      >
                        {promo.title.slice(0, 10)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{promo.title}</p>
                        {promo.subtitle && (
                          <p className="text-sm text-muted-foreground">{promo.subtitle}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{promo.promo_type}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {promo.link_type}: {promo.link_destination}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          promo.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {promo.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(promo)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(promo.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? "Edit Promotion" : "Create Promotion"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Flash Sale 50%"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Limited time only"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Promo Type</Label>
                <Select
                  value={formData.promo_type}
                  onValueChange={(v) => setFormData({ ...formData, promo_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deal">Deal</SelectItem>
                    <SelectItem value="flash_sale">Flash Sale</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                    <SelectItem value="clearance">Clearance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Link Type</Label>
                <Select
                  value={formData.link_type}
                  onValueChange={(v) => setFormData({ ...formData, link_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collection">Collection</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="url">Custom URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Link Destination *</Label>
              <Input
                value={formData.link_destination}
                onChange={(e) => setFormData({ ...formData, link_destination: e.target.value })}
                placeholder={formData.link_type === "url" ? "https://..." : "collection-slug"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gradient From</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.gradient_from}
                    onChange={(e) => setFormData({ ...formData, gradient_from: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.gradient_from}
                    onChange={(e) => setFormData({ ...formData, gradient_from: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Gradient To</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.gradient_to}
                    onChange={(e) => setFormData({ ...formData, gradient_to: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.gradient_to}
                    onChange={(e) => setFormData({ ...formData, gradient_to: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div
                className="h-20 rounded-xl flex flex-col items-center justify-center text-white"
                style={{
                  background: `linear-gradient(135deg, ${formData.gradient_from}, ${formData.gradient_to})`,
                }}
              >
                <span className="font-bold">{formData.title || "Title"}</span>
                {formData.subtitle && <span className="text-sm opacity-90">{formData.subtitle}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingPromotion ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
