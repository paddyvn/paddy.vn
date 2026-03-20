import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { CategoryIllustration } from "@/components/CategoryIllustrations";
import {
  useHomepageCategories,
  useCreateHomepageCategory,
  useUpdateHomepageCategory,
  useDeleteHomepageCategory,
  useReorderHomepageCategories,
  HomepageCategory,
} from "@/hooks/useHomepageCategories";
import { useToast } from "@/hooks/use-toast";

const AVAILABLE_ICONS = [
  "dryfood", "wetfood", "treat", "toy", "leash",
  "clothing", "bed", "bowl", "hygiene", "health",
  "pad", "litter", "cattree", "carrier", "deals",
];

interface CategoryFormData {
  name: string;
  slug: string;
  icon: string;
  is_active: boolean;
}

const emptyForm: CategoryFormData = { name: "", slug: "", icon: "toy", is_active: true };

const CategoryList = ({ petType }: { petType: string }) => {
  const { data: categories = [], isLoading } = useHomepageCategories(petType);
  const createCategory = useCreateHomepageCategory();
  const updateCategory = useUpdateHomepageCategory();
  const deleteCategory = useDeleteHomepageCategory();
  const reorderCategories = useReorderHomepageCategories();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<HomepageCategory | null>(null);

  const handleCreateNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleEdit = (cat: HomepageCategory) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, icon: cat.icon, is_active: cat.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) {
      toast({ title: "Name and slug are required", variant: "destructive" });
      return;
    }
    if (editingId) {
      await updateCategory.mutateAsync({ id: editingId, ...form });
      toast({ title: "Category updated" });
    } else {
      const maxPosition = categories.length;
      await createCategory.mutateAsync({ pet_type: petType, position: maxPosition, ...form });
    }
    setDialogOpen(false);
  };

  const handleDelete = (cat: HomepageCategory) => {
    setCategoryToDelete(cat);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    await deleteCategory.mutateAsync(categoryToDelete.id);
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const handleToggleActive = async (cat: HomepageCategory) => {
    await updateCategory.mutateAsync({ id: cat.id, is_active: !cat.is_active });
    toast({ title: cat.is_active ? "Category deactivated" : "Category activated" });
  };

  const moveItem = async (currentIndex: number, direction: -1 | 1) => {
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const updated = [...categories];
    [updated[currentIndex], updated[newIndex]] = [updated[newIndex], updated[currentIndex]];

    await reorderCategories.mutateAsync(updated.map((c, i) => ({ id: c.id, position: i })));
    toast({ title: "Order updated" });
  };

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-lg">
          <h3 className="text-lg font-medium mb-2">No categories yet</h3>
          <p className="text-muted-foreground mb-4">Add categories for the homepage grid.</p>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Order</TableHead>
              <TableHead className="w-16">Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-20">Active</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat, index) => (
              <TableRow key={cat.id}>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === 0}
                      onClick={() => moveItem(index, -1)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === categories.length - 1}
                      onClick={() => moveItem(index, 1)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="w-8 h-8">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <CategoryIllustration type={cat.icon} />
                    </svg>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{cat.slug}</TableCell>
                <TableCell>
                  <Switch checked={cat.is_active} onCheckedChange={() => handleToggleActive(cat)} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cat)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Thức Ăn Hạt"
              />
            </div>
            <div>
              <Label>Collection slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="hat-cho-cho"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Links to /collections/{form.slug || "..."}
              </p>
            </div>
            <div>
              <Label>Icon</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {AVAILABLE_ICONS.map((iconType) => (
                  <button
                    key={iconType}
                    type="button"
                    onClick={() => setForm({ ...form, icon: iconType })}
                    className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-colors ${
                      form.icon === iconType
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:border-muted"
                    }`}
                  >
                    <div className="w-10 h-10">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <CategoryIllustration type={iconType} />
                      </svg>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{iconType}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
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

const HomepageCategoriesManager = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage Categories</CardTitle>
        <CardDescription>Manage the "Shop by Category" grid on the homepage</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dog">
          <TabsList className="mb-4">
            <TabsTrigger value="dog">🐕 Dog</TabsTrigger>
            <TabsTrigger value="cat">🐈 Cat</TabsTrigger>
          </TabsList>
          <TabsContent value="dog">
            <CategoryList petType="dog" />
          </TabsContent>
          <TabsContent value="cat">
            <CategoryList petType="cat" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default HomepageCategoriesManager;
