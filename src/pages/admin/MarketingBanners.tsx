import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Image, Bell, LayoutTemplate, GripVertical, Pencil, Trash2, Calendar, Grid3X3, Star, Award, Clock } from "lucide-react";
import HomepageCategoriesManager from "@/components/admin/HomepageCategoriesManager";
import HomepagePromosManager from "@/components/admin/HomepagePromosManager";
import HomepageFeaturedManager from "@/components/admin/HomepageFeaturedManager";
import HomepageBrandsManager from "@/components/admin/HomepageBrandsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, useReorderBanners, Banner, BannerType, BannerInsert } from "@/hooks/useBanners";
import { BannerFormDialog } from "@/components/admin/BannerFormDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

// --- Status helpers ---
type BannerStatus = "active" | "inactive" | "scheduled";

const getBannerStatus = (banner: Banner): BannerStatus => {
  if (!banner.is_active) return "inactive";
  const now = new Date();
  if (banner.starts_at && new Date(banner.starts_at) > now) return "scheduled";
  return "active";
};

const STATUS_CONFIG: Record<BannerStatus, { label: string; variant: "default" | "secondary" | "outline"; className: string }> = {
  active: { label: "Đang hoạt động", variant: "default", className: "bg-green-100 text-green-800 border-green-200" },
  inactive: { label: "Tắt", variant: "secondary", className: "bg-gray-100 text-gray-600 border-gray-200" },
  scheduled: { label: "Lên lịch", variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
};

const StatusBadge = ({ banner }: { banner: Banner }) => {
  const status = getBannerStatus(banner);
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant} className={config.className}>
      {status === "scheduled" && <Clock className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
};

// --- Sortable Row ---
interface SortableRowProps {
  banner: Banner;
  onEdit: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
  onToggleActive: (banner: Banner) => void;
}

const SortableRow = ({ banner, onEdit, onDelete, onToggleActive }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatSchedule = () => {
    if (!banner.starts_at && !banner.ends_at) return "Không giới hạn";
    const parts: string[] = [];
    if (banner.starts_at) parts.push(format(new Date(banner.starts_at), "dd/MM/yyyy"));
    if (banner.ends_at) parts.push(format(new Date(banner.ends_at), "dd/MM/yyyy"));
    return parts.join(" → ");
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <button className="cursor-grab hover:bg-muted p-1 rounded" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        {banner.image_url ? (
          <img src={banner.image_url} alt={banner.title} className="h-10 w-20 object-cover rounded" />
        ) : (
          <div
            className="h-10 w-20 rounded flex items-center justify-center text-[10px] font-medium"
            style={{ backgroundColor: banner.background_color || "#000", color: banner.text_color || "#fff" }}
          >
            Preview
          </div>
        )}
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium text-sm">{banner.title}</p>
          {banner.subtitle && (
            <p className="text-xs text-muted-foreground truncate max-w-xs">{banner.subtitle}</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge banner={banner} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 shrink-0" />
          <span>{formatSchedule()}</span>
        </div>
      </TableCell>
      <TableCell>
        <Switch checked={banner.is_active ?? false} onCheckedChange={() => onToggleActive(banner)} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(banner)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(banner)}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

// --- Banner List ---
interface BannerListProps {
  type: BannerType;
  title: string;
  description: string;
  icon: React.ReactNode;
  emptyMessage: string;
}

const BannerList = ({ type, title, description, icon, emptyMessage }: BannerListProps) => {
  const { data: banners = [], isLoading } = useBanners(type);
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const reorderBanners = useReorderBanners();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = banners.findIndex((b) => b.id === active.id);
    const newIndex = banners.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(banners, oldIndex, newIndex);

    try {
      await reorderBanners.mutateAsync(reordered.map((b, i) => ({ id: b.id, display_order: i })));
      toast.success("Đã cập nhật thứ tự");
    } catch {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  const handleSave = async (data: BannerInsert) => {
    if (editingBanner) {
      await updateBanner.mutateAsync({ id: editingBanner.id, ...data });
      toast.success("Đã lưu banner thành công");
    } else {
      const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.display_order ?? 0)) + 1 : 0;
      await createBanner.mutateAsync({ ...data, display_order: maxOrder });
      toast.success("Đã lưu banner thành công");
    }
    setEditingBanner(null);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setDialogOpen(true);
  };

  const handleDelete = (banner: Banner) => {
    setBannerToDelete(banner);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bannerToDelete) return;
    try {
      await deleteBanner.mutateAsync(bannerToDelete.id);
      toast.success("Đã xóa banner");
    } catch {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    }
    setDeleteDialogOpen(false);
    setBannerToDelete(null);
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await updateBanner.mutateAsync({ id: banner.id, is_active: !banner.is_active });
      toast.success(banner.is_active ? "Đã tắt banner" : "Đã kích hoạt banner");
    } catch {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  const handleCreateNew = () => {
    setEditingBanner(null);
    setDialogOpen(true);
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
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm banner
          </Button>
        </CardHeader>
        <CardContent>
          {banners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-lg">
              {icon}
              <h3 className="text-lg font-medium mb-2 mt-4">Chưa có banner nào</h3>
              <p className="text-muted-foreground mb-4 max-w-md">{emptyMessage}</p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm banner
              </Button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="w-24">Ảnh</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead className="w-32">Trạng thái</TableHead>
                    <TableHead>Lịch trình</TableHead>
                    <TableHead className="w-16">Bật/Tắt</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext items={banners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    {banners.map((banner) => (
                      <SortableRow
                        key={banner.id}
                        banner={banner}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleActive={handleToggleActive}
                      />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <BannerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        banner={editingBanner}
        bannerType={type}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa banner</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa banner "{bannerToDelete?.title}"? Hành động này không thể hoàn tác.
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

// --- Main Page ---
const MarketingBanners = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Banners & CMS</h1>
        <p className="text-muted-foreground">
          Quản lý banner trang chủ, thanh thông báo và các mục hiển thị
        </p>
      </div>

      <Tabs defaultValue="hero" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hero" className="gap-2">
            <Image className="h-4 w-4" />
            Hero Banners
          </TabsTrigger>
          <TabsTrigger value="announcement" className="gap-2">
            <Bell className="h-4 w-4" />
            Thanh thông báo
          </TabsTrigger>
          <TabsTrigger value="promotional" className="gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Ưu đãi Homepage
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            Danh mục
          </TabsTrigger>
          <TabsTrigger value="featured" className="gap-2">
            <Star className="h-4 w-4" />
            Sản phẩm nổi bật
          </TabsTrigger>
          <TabsTrigger value="brands" className="gap-2">
            <Award className="h-4 w-4" />
            Thương hiệu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <BannerList
            type="hero"
            title="Hero Banners"
            description="Banner carousel toàn trang hiển thị trên trang chủ"
            icon={<Image className="h-12 w-12 text-muted-foreground" />}
            emptyMessage="Chưa có banner hero nào. Thêm banner đầu tiên để hiển thị trên trang chủ."
          />
        </TabsContent>

        <TabsContent value="announcement">
          <BannerList
            type="announcement"
            title="Thanh thông báo"
            description="Thanh thông báo ở đầu trang cho các thông tin quan trọng"
            icon={<Bell className="h-12 w-12 text-muted-foreground" />}
            emptyMessage="Tạo thanh thông báo để hiển thị miễn phí ship, khuyến mãi, hoặc thông tin cập nhật."
          />
        </TabsContent>

        <TabsContent value="promotional">
          <HomepagePromosManager />
        </TabsContent>

        <TabsContent value="categories">
          <HomepageCategoriesManager />
        </TabsContent>

        <TabsContent value="featured">
          <HomepageFeaturedManager />
        </TabsContent>

        <TabsContent value="brands">
          <HomepageBrandsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingBanners;
