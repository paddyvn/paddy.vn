import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Image, Bell, LayoutTemplate, GripVertical, Pencil, Trash2, Eye, EyeOff, Calendar, Grid3X3, Star, Award } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
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

  const isScheduled = banner.starts_at || banner.ends_at;
  const now = new Date();
  const isWithinSchedule = 
    (!banner.starts_at || new Date(banner.starts_at) <= now) &&
    (!banner.ends_at || new Date(banner.ends_at) > now);

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <button
          className="cursor-grab hover:bg-muted p-1 rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        {banner.image_url ? (
          <img
            src={banner.image_url}
            alt={banner.title}
            className="h-12 w-20 object-cover rounded"
          />
        ) : (
          <div 
            className="h-12 w-20 rounded flex items-center justify-center text-xs"
            style={{ 
              backgroundColor: banner.background_color, 
              color: banner.text_color 
            }}
          >
            Preview
          </div>
        )}
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{banner.title}</p>
          {banner.subtitle && (
            <p className="text-sm text-muted-foreground truncate max-w-xs">
              {banner.subtitle}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell>
        {isScheduled ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {banner.starts_at && format(new Date(banner.starts_at), "MMM d")}
              {banner.starts_at && banner.ends_at && " - "}
              {banner.ends_at && format(new Date(banner.ends_at), "MMM d")}
            </span>
            {!isWithinSchedule && (
              <Badge variant="outline" className="ml-1 text-xs">
                Scheduled
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Always</span>
        )}
      </TableCell>
      <TableCell>
        <Switch
          checked={banner.is_active}
          onCheckedChange={() => onToggleActive(banner)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(banner)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(banner)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

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
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = banners.findIndex((b) => b.id === active.id);
    const newIndex = banners.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(banners, oldIndex, newIndex);

    try {
      await reorderBanners.mutateAsync(
        reordered.map((b, i) => ({ id: b.id, display_order: i }))
      );
      toast({ title: "Order updated" });
    } catch (error) {
      toast({ title: "Failed to reorder", variant: "destructive" });
    }
  };

  const handleSave = async (data: BannerInsert) => {
    if (editingBanner) {
      await updateBanner.mutateAsync({ id: editingBanner.id, ...data });
      toast({ title: "Banner updated" });
    } else {
      const maxOrder = banners.length > 0 
        ? Math.max(...banners.map(b => b.display_order)) + 1 
        : 0;
      await createBanner.mutateAsync({ ...data, display_order: maxOrder });
      toast({ title: "Banner created" });
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
      toast({ title: "Banner deleted" });
    } catch (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
    setDeleteDialogOpen(false);
    setBannerToDelete(null);
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await updateBanner.mutateAsync({ id: banner.id, is_active: !banner.is_active });
      toast({ title: banner.is_active ? "Banner deactivated" : "Banner activated" });
    } catch (error) {
      toast({ title: "Failed to update", variant: "destructive" });
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
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Banner
          </Button>
        </CardHeader>
        <CardContent>
          {banners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-lg">
              {icon}
              <h3 className="text-lg font-medium mb-2 mt-4">No banners yet</h3>
              <p className="text-muted-foreground mb-4 max-w-md">{emptyMessage}</p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Banner
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="w-24">Preview</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead className="w-20">Active</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={banners.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
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
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{bannerToDelete?.title}"? This action cannot be undone.
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

const MarketingBanners = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Banners</h1>
        <p className="text-muted-foreground">
          Manage hero banners, announcement bars, and promotional displays
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
            Announcement Bars
          </TabsTrigger>
          <TabsTrigger value="promotional" className="gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Promotional Sections
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            Homepage Categories
          </TabsTrigger>
          <TabsTrigger value="featured" className="gap-2">
            <Star className="h-4 w-4" />
            Featured Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <BannerList
            type="hero"
            title="Hero Banners"
            description="Full-width banners displayed on the homepage carousel"
            icon={<Image className="h-12 w-12 text-muted-foreground" />}
            emptyMessage="Create promotional banners to showcase on your homepage carousel. Upload images and set display order."
          />
        </TabsContent>

        <TabsContent value="announcement">
          <BannerList
            type="announcement"
            title="Announcement Bars"
            description="Top-of-page banners for important messages and promotions"
            icon={<Bell className="h-12 w-12 text-muted-foreground" />}
            emptyMessage="Create announcement bars to display important messages like free shipping offers, sales, or store updates."
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
      </Tabs>
    </div>
  );
};

export default MarketingBanners;
