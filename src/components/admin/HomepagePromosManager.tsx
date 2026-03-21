import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, X, LayoutTemplate } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  useHomepagePromos, useCreateHomepagePromo, useUpdateHomepagePromo,
  useDeleteHomepagePromo, useReorderHomepagePromos, type HomepagePromo,
} from "@/hooks/useHomepagePromos";

const EMPTY_FORM = {
  title: "",
  eyebrow: "",
  cta_text: "Mua ngay",
  image_url: "",
  bg_color: "#DBEAFE",
  layout_slot: "half" as string,
  link_url: "",
  is_active: true,
};

const COLOR_PRESETS = ["#DBEAFE", "#E0F2FE", "#EDE9FE", "#FCE7F3", "#FEF3C7", "#D1FAE5"];

const SLOT_LABELS: Record<string, string> = {
  hero: "Hero (tall left)",
  wide: "Wide (top right)",
  half: "Half (bottom right)",
};

const HomepagePromosManager = () => {
  const { data: promos = [], isLoading } = useHomepagePromos();
  const createPromo = useCreateHomepagePromo();
  const updatePromo = useUpdateHomepagePromo();
  const deletePromo = useDeleteHomepagePromo();
  const reorderPromos = useReorderHomepagePromos();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<HomepagePromo | null>(null);
  const [uploading, setUploading] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: HomepagePromo) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      eyebrow: p.eyebrow || "",
      cta_text: p.cta_text,
      image_url: p.image_url || "",
      bg_color: p.bg_color,
      layout_slot: p.layout_slot,
      link_url: p.link_url || "",
      is_active: p.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updatePromo.mutateAsync({
          id: editingId,
          title: form.title,
          eyebrow: form.eyebrow || null,
          cta_text: form.cta_text,
          image_url: form.image_url || null,
          bg_color: form.bg_color,
          layout_slot: form.layout_slot,
          link_url: form.link_url || null,
          is_active: form.is_active,
        });
        toast({ title: "Promo updated" });
      } else {
        const maxPos = promos.length > 0 ? Math.max(...promos.map(p => p.position)) + 1 : 0;
        await createPromo.mutateAsync({
          title: form.title,
          eyebrow: form.eyebrow || null,
          cta_text: form.cta_text,
          image_url: form.image_url || null,
          bg_color: form.bg_color,
          layout_slot: form.layout_slot,
          link_url: form.link_url || null,
          is_active: form.is_active,
          position: maxPos,
        });
        toast({ title: "Promo created" });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const handleToggleActive = async (p: HomepagePromo) => {
    try {
      await updatePromo.mutateAsync({ id: p.id, is_active: !p.is_active });
      toast({ title: p.is_active ? "Deactivated" : "Activated" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= promos.length) return;
    const reordered = [...promos];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    try {
      await reorderPromos.mutateAsync(reordered.map((p, i) => ({ id: p.id, position: i })));
    } catch {
      toast({ title: "Failed to reorder", variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!promoToDelete) return;
    try {
      await deletePromo.mutateAsync(promoToDelete.id);
      toast({ title: "Promo deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
    setDeleteDialogOpen(false);
    setPromoToDelete(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `promos/promo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("banners").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("banners").getPublicUrl(path);
      setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Promotional Sections</CardTitle>
            <CardDescription>Manage the bento promo grid on the homepage.</CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Promo
          </Button>
        </CardHeader>
        <CardContent>
          {promos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-lg">
              <LayoutTemplate className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2 mt-4">No promo cards yet</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Create promo cards to display in the bento grid on the homepage.
              </p>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Promo
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Slot</TableHead>
                  <TableHead className="w-16">Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead className="w-20">Active</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promos.map((promo, index) => (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {promo.layout_slot}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {promo.image_url ? (
                        <img
                          src={promo.image_url}
                          alt=""
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded border"
                          style={{ backgroundColor: promo.bg_color }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm line-clamp-2">{promo.title}</p>
                        {promo.eyebrow && (
                          <p className="text-xs text-muted-foreground">{promo.eyebrow}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                        {promo.link_url || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={promo.is_active}
                        onCheckedChange={() => handleToggleActive(promo)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMove(index, -1)} disabled={index === 0}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMove(index, 1)} disabled={index === promos.length - 1}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(promo)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPromoToDelete(promo); setDeleteDialogOpen(true); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Promo Card" : "Add Promo Card"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Layout Slot */}
            <div>
              <Label>Layout Slot</Label>
              <Select value={form.layout_slot} onValueChange={(v) => setForm(f => ({ ...f, layout_slot: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SLOT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                The bento grid has 1 hero + 1 wide + 2 half slots.
              </p>
            </div>

            {/* Title */}
            <div>
              <Label>Title</Label>
              <Textarea
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={"Sản phẩm mới\ncho Boss yêu"}
                rows={2}
              />
              <p className="text-xs text-muted-foreground mt-1">Use Enter for line breaks.</p>
            </div>

            {/* Eyebrow */}
            <div>
              <Label>Eyebrow text</Label>
              <Input
                value={form.eyebrow}
                onChange={(e) => setForm(f => ({ ...f, eyebrow: e.target.value }))}
                placeholder="Thương hiệu mới tại Paddy"
              />
              <p className="text-xs text-muted-foreground mt-1">Small text above the title.</p>
            </div>

            {/* CTA */}
            <div>
              <Label>Button text</Label>
              <Input
                value={form.cta_text}
                onChange={(e) => setForm(f => ({ ...f, cta_text: e.target.value }))}
                placeholder="Mua ngay"
              />
            </div>

            {/* Link URL */}
            <div>
              <Label>Link URL</Label>
              <Input
                value={form.link_url}
                onChange={(e) => setForm(f => ({ ...f, link_url: e.target.value }))}
                placeholder="/collections/san-pham-moi"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Examples: /collections/slug, /flash-sale, /promotions
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <Label>Background image</Label>
              {form.image_url ? (
                <div className="relative">
                  <img src={form.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => setForm(f => ({ ...f, image_url: "" }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Image covers the entire card with a dark overlay for text readability.
                  </p>
                </div>
              )}
            </div>

            {/* Background Color */}
            <div>
              <Label>Background color (when no image)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={form.bg_color}
                  onChange={(e) => setForm(f => ({ ...f, bg_color: e.target.value }))}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={form.bg_color}
                  onChange={(e) => setForm(f => ({ ...f, bg_color: e.target.value }))}
                  placeholder="#DBEAFE"
                  className="flex-1"
                />
                <div className="flex gap-1">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, bg_color: c }))}
                      className="w-6 h-6 rounded-full border border-border hover:ring-2 ring-primary"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Active */}
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{promoToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default HomepagePromosManager;
