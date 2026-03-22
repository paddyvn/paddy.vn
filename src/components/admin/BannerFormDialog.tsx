import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Upload, X, Monitor, Smartphone } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Banner, BannerType, BannerInsert, uploadBannerImage } from "@/hooks/useBanners";
import { toast } from "sonner";

interface BannerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: Banner | null;
  bannerType: BannerType;
  onSave: (data: BannerInsert) => Promise<void>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ".jpg,.jpeg,.png,.webp";

interface ImageUploadFieldProps {
  label: string;
  hint: string;
  value: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
}

const ImageUploadField = ({ label, hint, value, uploading, onUpload, onClear }: ImageUploadFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File quá lớn. Tối đa 5MB.");
      return;
    }
    onUpload(file);
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {value ? (
        <div className="relative group">
          <img src={value} alt="Preview" className="w-full h-36 object-cover rounded-lg border" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
            className="hidden"
            disabled={uploading}
          />
          <Upload className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {uploading ? "Đang tải lên..." : "Kéo thả hoặc nhấn để tải ảnh"}
          </p>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
};

export const BannerFormDialog = ({
  open,
  onOpenChange,
  banner,
  bannerType,
  onSave,
}: BannerFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [mobileImageUrl, setMobileImageUrl] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#0849FF");
  const [textColor, setTextColor] = useState("#ffffff");
  const [isActive, setIsActive] = useState(true);
  const [startsAt, setStartsAt] = useState<Date | undefined>();
  const [endsAt, setEndsAt] = useState<Date | undefined>();
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    if (banner) {
      setTitle(banner.title);
      setSubtitle(banner.subtitle || "");
      setImageUrl(banner.image_url || "");
      setMobileImageUrl(banner.mobile_image_url || "");
      setBadgeText(banner.badge_text || "");
      setLinkUrl(banner.link_url || "");
      setLinkText(banner.link_text || "");
      setBackgroundColor(banner.background_color || "#0849FF");
      setTextColor(banner.text_color || "#ffffff");
      setIsActive(banner.is_active ?? true);
      setStartsAt(banner.starts_at ? new Date(banner.starts_at) : undefined);
      setEndsAt(banner.ends_at ? new Date(banner.ends_at) : undefined);
    } else {
      resetForm();
    }
  }, [banner, open]);

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setImageUrl("");
    setMobileImageUrl("");
    setBadgeText("");
    setLinkUrl("");
    setLinkText("");
    setBackgroundColor(bannerType === "announcement" ? "#FFD700" : "#0849FF");
    setTextColor(bannerType === "announcement" ? "#000000" : "#ffffff");
    setIsActive(true);
    setStartsAt(undefined);
    setEndsAt(undefined);
  };

  const handleImageUpload = async (file: File, type: "desktop" | "mobile") => {
    const setUploading = type === "desktop" ? setUploadingDesktop : setUploadingMobile;
    const setUrl = type === "desktop" ? setImageUrl : setMobileImageUrl;
    const folder = type === "mobile" ? "hero/mobile" : "hero";

    setUploading(true);
    try {
      const url = await uploadBannerImage(file, folder);
      setUrl(url);
      toast.success("Tải ảnh thành công");
    } catch (error) {
      toast.error("Tải ảnh thất bại: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }

    setLoading(true);
    try {
      await onSave({
        type: bannerType,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        image_url: imageUrl || null,
        mobile_image_url: mobileImageUrl || null,
        badge_text: badgeText.trim() || null,
        link_url: linkUrl.trim() || null,
        link_text: linkText.trim() || null,
        background_color: backgroundColor,
        text_color: textColor,
        is_active: isActive,
        starts_at: startsAt?.toISOString() || null,
        ends_at: endsAt?.toISOString() || null,
        display_order: banner?.display_order || 0,
      });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("Lưu thất bại: " + (error instanceof Error ? error.message : "Lỗi không xác định"));
    } finally {
      setLoading(false);
    }
  };

  const isHero = bannerType === "hero";
  const isAnnouncement = bannerType === "announcement";

  const typeLabel = isHero ? "hero" : isAnnouncement ? "thông báo" : "khuyến mãi";

  const previewImage = previewMode === "mobile" && mobileImageUrl ? mobileImageUrl : imageUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {banner ? "Sửa" : "Thêm"} banner {typeLabel}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image uploads - hero only */}
          {isHero && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUploadField
                label="Ảnh desktop"
                hint="Khuyến nghị: 1920×600px"
                value={imageUrl}
                uploading={uploadingDesktop}
                onUpload={(f) => handleImageUpload(f, "desktop")}
                onClear={() => setImageUrl("")}
              />
              <ImageUploadField
                label="Ảnh mobile"
                hint="Khuyến nghị: 768×400px"
                value={mobileImageUrl}
                uploading={uploadingMobile}
                onUpload={(f) => handleImageUpload(f, "mobile")}
                onClear={() => setMobileImageUrl("")}
              />
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Tiêu đề *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isAnnouncement ? "Miễn phí vận chuyển cho đơn từ 500.000đ" : "Tiêu đề banner"}
            />
          </div>

          {/* Subtitle - hero only */}
          {isHero && (
            <div className="space-y-1.5">
              <Label>Tiêu đề phụ</Label>
              <Textarea
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Mô tả ngắn cho banner"
                rows={2}
              />
            </div>
          )}

          {/* Badge - hero only */}
          {isHero && (
            <div className="space-y-1.5">
              <Label>Badge</Label>
              <Input
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder='-30%, MỚI, HOT'
              />
              <p className="text-xs text-muted-foreground">Hiển thị nhãn nhỏ trên banner</p>
            </div>
          )}

          {/* CTA */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nút CTA - Text</Label>
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Mua ngay"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nút CTA - Link</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/collections/sale"
              />
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Màu nền</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-10 w-12 rounded border cursor-pointer"
                />
                <Input
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  placeholder="#0849FF"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Màu chữ</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-10 w-12 rounded border cursor-pointer"
                />
                <Input
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Bắt đầu</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startsAt && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startsAt ? format(startsAt, "dd/MM/yyyy") : "Không giới hạn"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startsAt} onSelect={setStartsAt} initialFocus />
                  {startsAt && (
                    <div className="p-2 border-t">
                      <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => setStartsAt(undefined)}>
                        Xóa ngày
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Kết thúc</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !endsAt && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endsAt ? format(endsAt, "dd/MM/yyyy") : "Không giới hạn"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endsAt} onSelect={setEndsAt} initialFocus />
                  {endsAt && (
                    <div className="p-2 border-t">
                      <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => setEndsAt(undefined)}>
                        Xóa ngày
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-3">Để trống = hiển thị không giới hạn</p>

          {/* Active toggle */}
          <div className="flex items-center gap-2">
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="isActive">Kích hoạt</Label>
          </div>

          {/* Live Preview */}
          {isHero && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Xem trước</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={previewMode === "desktop" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setPreviewMode("desktop")}
                  >
                    <Monitor className="h-3.5 w-3.5 mr-1" />
                    Desktop
                  </Button>
                  <Button
                    type="button"
                    variant={previewMode === "mobile" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setPreviewMode("mobile")}
                  >
                    <Smartphone className="h-3.5 w-3.5 mr-1" />
                    Mobile
                  </Button>
                </div>
              </div>
              <div
                className={cn(
                  "relative rounded-lg overflow-hidden flex items-center transition-all",
                  previewMode === "desktop" ? "h-[200px] w-full" : "h-[180px] w-[320px] mx-auto"
                )}
                style={{
                  backgroundColor: backgroundColor,
                  backgroundImage: previewImage ? `url(${previewImage})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {previewImage && <div className="absolute inset-0 bg-black/20" />}
                <div className="relative z-10 p-6 space-y-2">
                  {badgeText && (
                    <span
                      className="inline-block px-2 py-0.5 text-xs font-bold rounded"
                      style={{ backgroundColor: textColor, color: backgroundColor }}
                    >
                      {badgeText}
                    </span>
                  )}
                  {title && (
                    <h3 className="text-lg font-bold leading-tight" style={{ color: textColor }}>
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-sm opacity-90" style={{ color: textColor }}>
                      {subtitle}
                    </p>
                  )}
                  {linkText && (
                    <button
                      type="button"
                      className="mt-2 px-4 py-1.5 text-sm font-medium rounded-md"
                      style={{ backgroundColor: textColor, color: backgroundColor }}
                    >
                      {linkText}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu banner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
