import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, X, LayoutTemplate, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  useHomepagePromos, useCreateHomepagePromo, useUpdateHomepagePromo,
  useDeleteHomepagePromo, type HomepagePromo,
} from "@/hooks/useHomepagePromos";

const EMPTY_FORM = {
  title: "",
  eyebrow: "",
  cta_text: "Mua ngay",
  image_url: "",
  mobile_image_url: "",
  bg_color: "#DBEAFE",
  layout_slot: "half" as string,
  link_url: "",
  is_active: true,
};

const COLOR_PRESETS = ["#DBEAFE", "#DDDFF6", "#E0F2FE", "#EDE9FE", "#FCE7F3", "#FEF3C7", "#D1FAE5", "#F3F3F3"];

const SLOT_LABELS: Record<string, string> = {
  hero: "Hero (trái lớn)",
  wide: "Wide (phải rộng)",
  half: "Half (dưới nhỏ)",
};

// Visual bento card for promos
const PromoCard = ({
  promo,
  onEdit,
  onDelete,
  className,
}: {
  promo: HomepagePromo | null;
  slotLabel: string;
  onEdit: (p: HomepagePromo) => void;
  onDelete: (p: HomepagePromo) => void;
  className?: string;
}) => {
  if (!promo) {
    return (
      <div className={cn("rounded-xl border-2 border-dashed border-muted flex items-center justify-center p-4", className)}>
        <p className="text-sm text-muted-foreground text-center">Trống</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden group cursor-pointer transition-shadow hover:shadow-lg",
        className
      )}
      style={{
        backgroundColor: promo.bg_color,
        backgroundImage: promo.image_url ? `url(${promo.image_url})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {promo.image_url && <div className="absolute inset-0 bg-black/30" />}
      <div className="relative z-10 p-4 h-full flex flex-col justify-between">
        <div>
          {promo.eyebrow && (
            <p className={cn("text-xs font-medium mb-1", promo.image_url ? "text-white/80" : "text-foreground/60")}>
              {promo.eyebrow}
            </p>
          )}
          <h3 className={cn(
            "font-bold text-sm leading-tight whitespace-pre-line",
            promo.image_url ? "text-white" : "text-foreground"
          )}>
            {promo.title}
          </h3>
        </div>
        <div className="flex items-end justify-between mt-2">
          <span className={cn(
            "text-xs font-medium",
            promo.image_url ? "text-white/80" : "text-foreground/60"
          )}>
            {promo.cta_text}
          </span>
          {!promo.is_active && (
            <span className="text-[10px] bg-gray-800/60 text-white px-1.5 py-0.5 rounded">Tắt</span>
          )}
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
        <Button size="sm" variant="secondary" onClick={() => onEdit(promo)}>
          <Pencil className="h-3.5 w-3.5 mr-1" /> Sửa
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onDelete(promo)}>
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa
        </Button>
      </div>
    </div>
  );
};

const HomepagePromosManager = () => {
  const { data: promos = [], isLoading } = useHomepagePromos();
  const createPromo = useCreateHomepagePromo();
  const updatePromo = useUpdateHomepagePromo();
  const deletePromo = useDeleteHomepagePromo();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<HomepagePromo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

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
      mobile_image_url: p.mobile_image_url || "",
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
          mobile_image_url: form.mobile_image_url || null,
          bg_color: form.bg_color,
          layout_slot: form.layout_slot,
          link_url: form.link_url || null,
          is_active: form.is_active,
        });
        toast.success("Đã lưu thành công");
      } else {
        const maxPos = promos.length > 0 ? Math.max(...promos.map(p => p.position)) + 1 : 0;
        await createPromo.mutateAsync({
          title: form.title,
          eyebrow: form.eyebrow || null,
          cta_text: form.cta_text,
          image_url: form.image_url || null,
          mobile_image_url: form.mobile_image_url || null,
          bg_color: form.bg_color,
          layout_slot: form.layout_slot,
          link_url: form.link_url || null,
          is_active: form.is_active,
          position: maxPos,
        });
        toast.success("Đã tạo thành công");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  const handleToggleActive = async (p: HomepagePromo) => {
    try {
      await updatePromo.mutateAsync({ id: p.id, is_active: !p.is_active });
      toast.success(p.is_active ? "Đã tắt" : "Đã kích hoạt");
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };

  const confirmDelete = async () => {
    if (!promoToDelete) return;
    try {
      await deletePromo.mutateAsync(promoToDelete.id);
      toast.success("Đã xóa");
    } catch {
      toast.error("Có lỗi xảy ra");
    }
    setDeleteDialogOpen(false);
    setPromoToDelete(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "image_url" | "mobile_image_url") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const setLoading = field === "image_url" ? setUploading : setUploadingMobile;
    setLoading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `promos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("banners").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("banners").getPublicUrl(path);
      setForm(f => ({ ...f, [field]: urlData.publicUrl }));
      toast.success("Tải ảnh thành công");
    } catch (err: any) {
      toast.error("Tải ảnh thất bại: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group promos by slot for visual grid
  const heroPromo = promos.find(p => p.layout_slot === "hero") || null;
  const widePromo = promos.find(p => p.layout_slot === "wide") || null;
  const halfPromos = promos.filter(p => p.layout_slot === "half");

  const handleDeleteClick = (p: HomepagePromo) => {
    setPromoToDelete(p);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Đang tải...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Ưu đãi tại Paddy</CardTitle>
            <CardDescription>Quản lý bento grid khuyến mãi trên trang chủ. Bố cục: 1 Hero + 1 Wide + 2 Half.</CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm
          </Button>
        </CardHeader>
        <CardContent>
          {promos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-lg">
              <LayoutTemplate className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2 mt-4">Chưa có thẻ khuyến mãi</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Tạo thẻ khuyến mãi để hiển thị trong bento grid trên trang chủ.
              </p>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm thẻ
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Visual bento grid preview */}
              <div className="grid grid-cols-2 gap-3" style={{ gridTemplateRows: "180px 120px" }}>
                <PromoCard
                  promo={heroPromo}
                  slotLabel="Hero"
                  onEdit={openEdit}
                  onDelete={handleDeleteClick}
                  className="row-span-2"
                />
                <PromoCard
                  promo={widePromo}
                  slotLabel="Wide"
                  onEdit={openEdit}
                  onDelete={handleDeleteClick}
                />
                <div className="grid grid-cols-2 gap-3">
                  <PromoCard
                    promo={halfPromos[0] || null}
                    slotLabel="Half 1"
                    onEdit={openEdit}
                    onDelete={handleDeleteClick}
                  />
                  <PromoCard
                    promo={halfPromos[1] || null}
                    slotLabel="Half 2"
                    onEdit={openEdit}
                    onDelete={handleDeleteClick}
                  />
                </div>
              </div>

              {/* Extra promos not in the 4 main slots */}
              {promos.length > 4 && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Các thẻ bổ sung:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {promos.slice(4).map(p => (
                      <PromoCard
                        key={p.id}
                        promo={p}
                        slotLabel={p.layout_slot}
                        onEdit={openEdit}
                        onDelete={handleDeleteClick}
                        className="h-24"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Sửa thẻ khuyến mãi" : "Thêm thẻ khuyến mãi"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Layout Slot */}
            <div className="space-y-1.5">
              <Label>Vị trí hiển thị</Label>
              <Select value={form.layout_slot} onValueChange={(v) => setForm(f => ({ ...f, layout_slot: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SLOT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Bento grid gồm 1 hero + 1 wide + 2 half.</p>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label>Tiêu đề *</Label>
              <Textarea
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={"Sản phẩm mới\ncho Boss yêu"}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">Nhấn Enter để xuống dòng.</p>
            </div>

            {/* Eyebrow */}
            <div className="space-y-1.5">
              <Label>Eyebrow</Label>
              <Input
                value={form.eyebrow}
                onChange={(e) => setForm(f => ({ ...f, eyebrow: e.target.value }))}
                placeholder="Thương hiệu mới tại Paddy"
              />
              <p className="text-xs text-muted-foreground">Dòng chữ nhỏ phía trên tiêu đề.</p>
            </div>

            {/* CTA */}
            <div className="space-y-1.5">
              <Label>Nút CTA</Label>
              <Input
                value={form.cta_text}
                onChange={(e) => setForm(f => ({ ...f, cta_text: e.target.value }))}
                placeholder="Mua ngay"
              />
            </div>

            {/* Link URL */}
            <div className="space-y-1.5">
              <Label>Link URL</Label>
              <Input
                value={form.link_url}
                onChange={(e) => setForm(f => ({ ...f, link_url: e.target.value }))}
                placeholder="/collections/san-pham-moi"
              />
            </div>

            {/* Image Uploads */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ảnh desktop</Label>
                {form.image_url ? (
                  <div className="relative group">
                    <img src={form.image_url} alt="Preview" className="w-full h-28 object-cover rounded-lg border" />
                    <Button
                      variant="destructive" size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setForm(f => ({ ...f, image_url: "" }))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file" accept="image/*"
                      onChange={(e) => handleImageUpload(e, "image_url")}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">
                      {uploading ? "Đang tải..." : "Tải ảnh"}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Ảnh mobile</Label>
                {form.mobile_image_url ? (
                  <div className="relative group">
                    <img src={form.mobile_image_url} alt="Preview" className="w-full h-28 object-cover rounded-lg border" />
                    <Button
                      variant="destructive" size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setForm(f => ({ ...f, mobile_image_url: "" }))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    onClick={() => mobileFileInputRef.current?.click()}
                  >
                    <input
                      ref={mobileFileInputRef}
                      type="file" accept="image/*"
                      onChange={(e) => handleImageUpload(e, "mobile_image_url")}
                      className="hidden"
                      disabled={uploadingMobile}
                    />
                    <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">
                      {uploadingMobile ? "Đang tải..." : "Tải ảnh"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Background Color */}
            <div className="space-y-1.5">
              <Label>Màu nền (khi không có ảnh)</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.bg_color}
                  onChange={(e) => setForm(f => ({ ...f, bg_color: e.target.value }))}
                  className="w-10 h-10 p-0.5 cursor-pointer rounded border"
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
                      className={cn(
                        "w-6 h-6 rounded-full border hover:ring-2 ring-primary transition-all",
                        form.bg_color === c && "ring-2"
                      )}
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
              <Label>Kích hoạt</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={!form.title.trim()}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa thẻ khuyến mãi</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa "{promoToDelete?.title}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default HomepagePromosManager;
