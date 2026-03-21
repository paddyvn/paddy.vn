import { useState } from "react";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { slugify } from "@/lib/utils";
import {
  useBlogCategories,
  useCreateBlogCategory,
  useUpdateBlogCategory,
  useDeleteBlogCategory,
  BlogCategory,
} from "@/hooks/useBlogCategories";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  name_vi: z.string().trim().max(100).optional(),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase and URL-safe"),
  description: z.string().trim().max(500).optional(),
  display_order: z.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

interface SortableRowProps {
  category: BlogCategory;
  onEdit: (category: BlogCategory) => void;
  onDelete: (category: BlogCategory) => void;
  onToggleActive: (category: BlogCategory) => void;
}

const SortableRow = ({ category, onEdit, onDelete, onToggleActive }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const postCount = category.post_count ?? 0;

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? "bg-muted" : ""}>
      <TableCell>
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        <div>
          <span className="font-medium">{category.name_vi || category.name}</span>
          {category.name_vi && (
            <span className="text-xs text-muted-foreground ml-2">({category.name})</span>
          )}
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">{category.slug}</TableCell>
      <TableCell className="text-center">{postCount}</TableCell>
      <TableCell>
        <Switch
          checked={category.is_active}
          onCheckedChange={() => onToggleActive(category)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(category)}
            disabled={postCount > 0}
            title={postCount > 0 ? `Has ${postCount} posts — reassign them first` : "Delete category"}
          >
            <Trash2 className={`h-4 w-4 ${postCount > 0 ? "text-muted-foreground" : "text-destructive"}`} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const BlogCategories = () => {
  const { data: categories, isLoading } = useBlogCategories();
  const createCategory = useCreateBlogCategory();
  const updateCategory = useUpdateBlogCategory();
  const deleteCategory = useDeleteBlogCategory();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [deleteCategory_target, setDeleteTarget] = useState<BlogCategory | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    name_vi: "",
    slug: "",
    description: "",
    display_order: 0,
    is_active: true,
  });

  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const generateSlug = (name: string) => slugify(name);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && categories) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(categories, oldIndex, newIndex);
        
        // Update display_order for all affected items
        reordered.forEach((category, index) => {
          const newOrder = index + 1;
          if (category.display_order !== newOrder) {
            updateCategory.mutate({
              id: category.id,
              updates: { display_order: newOrder },
            });
          }
        });
      }
    }
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      name_vi: "",
      slug: "",
      description: "",
      display_order: (categories?.length || 0) + 1,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (category: BlogCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      name_vi: category.name_vi || "",
      slug: category.slug,
      description: category.description || "",
      display_order: category.display_order,
      is_active: category.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const slug = (formData.slug || generateSlug(formData.name)).trim();

    const parsed = categorySchema.safeParse({
      name: formData.name,
      name_vi: formData.name_vi || undefined,
      slug,
      description: formData.description || undefined,
      display_order: Number(formData.display_order) || 0,
      is_active: !!formData.is_active,
    });

    if (!parsed.success) {
      toast({
        title: "Invalid category",
        description: parsed.error.issues[0]?.message || "Please check your inputs",
        variant: "destructive",
      });
      return;
    }

    const payload = parsed.data as z.infer<typeof categorySchema>;

    if (editingCategory) {
      updateCategory.mutate(
        {
          id: editingCategory.id,
          updates: payload,
        },
        { onSuccess: () => setIsDialogOpen(false) }
      );
    } else {
      createCategory.mutate(
        payload as {
          name: string;
          name_vi?: string;
          slug: string;
          description?: string;
          display_order?: number;
          is_active?: boolean;
        },
        { onSuccess: () => setIsDialogOpen(false) }
      );
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteCategory.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const handleToggleActive = (category: BlogCategory) => {
    updateCategory.mutate({
      id: category.id,
      updates: { is_active: !category.is_active },
    });
  };

  const sortedCategories = categories?.slice().sort((a, b) => a.display_order - b.display_order) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Categories</h1>
          <p className="text-muted-foreground">
            Manage blog categories and their display order
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-20">Order</TableHead>
              <TableHead className="w-20">Active</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : sortedCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No categories found. Create your first category.
                </TableCell>
              </TableRow>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedCategories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedCategories.map((category) => (
                    <SortableRow
                      key={category.id}
                      category={category}
                      onEdit={handleOpenEdit}
                      onDelete={setDeleteId}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const nextName = e.target.value;
                  setFormData({
                    ...formData,
                    name: nextName,
                    slug: formData.slug || generateSlug(nextName),
                  });
                }}
                placeholder="Category name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_vi">Name (Vietnamese)</Label>
              <Input
                id="name_vi"
                value={formData.name_vi}
                onChange={(e) =>
                  setFormData({ ...formData, name_vi: e.target.value })
                }
                placeholder="Tên danh mục"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => {
                  setFormData({ ...formData, slug: slugify(e.target.value) });
                }}
                placeholder="category-slug"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Category description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label>Active</Label>
                <div className="pt-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.name ||
                createCategory.isPending ||
                updateCategory.isPending
              }
            >
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Blog posts using this category will
              need to be reassigned.
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
    </div>
  );
};

export default BlogCategories;
