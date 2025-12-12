import { useState } from "react";
import { Plus, GripVertical, Pencil, Trash2, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  useNavigationMenus,
  useCreateMenu,
  useUpdateMenu,
  useDeleteMenu,
  NavigationMenu,
} from "@/hooks/useNavigationMenus";
import MenuEditor from "@/components/admin/MenuEditor";

export default function ContentMenus() {
  const { data: menus, isLoading } = useNavigationMenus();
  const createMenu = useCreateMenu();
  const updateMenu = useUpdateMenu();
  const deleteMenu = useDeleteMenu();

  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuSlug, setNewMenuSlug] = useState("");

  const handleCreateMenu = () => {
    if (!newMenuName.trim() || !newMenuSlug.trim()) return;
    createMenu.mutate(
      { name: newMenuName, slug: newMenuSlug },
      {
        onSuccess: () => {
          setShowCreateDialog(false);
          setNewMenuName("");
          setNewMenuSlug("");
        },
      }
    );
  };

  const handleToggleActive = (menu: NavigationMenu) => {
    updateMenu.mutate({ id: menu.id, is_active: !menu.is_active });
  };

  const handleDeleteMenu = (id: string) => {
    deleteMenu.mutate(id, {
      onSuccess: () => {
        setShowDeleteDialog(null);
        if (selectedMenuId === id) {
          setSelectedMenuId(null);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Menus</h2>
          <p className="text-muted-foreground">
            Create and manage navigation menus for your store
          </p>
        </div>
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const selectedMenu = menus?.find((m) => m.id === selectedMenuId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Menus</h2>
          <p className="text-muted-foreground">
            Create and manage navigation menus for your store
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create menu
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Menu List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Navigation Menus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {menus?.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No menus yet. Create your first menu.
              </p>
            ) : (
              menus?.map((menu) => (
                <div
                  key={menu.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedMenuId === menu.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedMenuId(menu.id)}
                >
                  <div className="flex items-center gap-3">
                    <Menu className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{menu.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {menu.columns.length} columns · {menu.columns.reduce((acc, col) => acc + col.items.length, 0)} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={menu.is_active ? "default" : "secondary"}>
                      {menu.is_active ? "Active" : "Draft"}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Menu Editor */}
        <div className="lg:col-span-2">
          {selectedMenu ? (
            <MenuEditor
              menu={selectedMenu}
              onToggleActive={() => handleToggleActive(selectedMenu)}
              onDelete={() => setShowDeleteDialog(selectedMenu.id)}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Menu className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select a menu to edit or create a new one
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Menu Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new menu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Menu name</Label>
              <Input
                id="name"
                placeholder="e.g., Dogs, Cats, Main Navigation"
                value={newMenuName}
                onChange={(e) => {
                  setNewMenuName(e.target.value);
                  setNewMenuSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="e.g., dogs, cats"
                value={newMenuSlug}
                onChange={(e) => setNewMenuSlug(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMenu} disabled={createMenu.isPending}>
              {createMenu.isPending ? "Creating..." : "Create menu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete menu?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this menu and all its columns and items.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteDialog && handleDeleteMenu(showDeleteDialog)}
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
