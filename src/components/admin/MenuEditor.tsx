import { useState } from "react";
import { Plus, Trash2, Image, Pencil } from "lucide-react";
import { CollectionSelectorPopover } from "./CollectionSelectorPopover";
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
import {
  NavigationMenu,
  NavigationColumn,
  NavigationItem,
  useUpdateMenu,
  useCreateColumn,
  useUpdateColumn,
  useDeleteColumn,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useBulkUpdateColumnOrder,
  useBulkUpdateItemOrder,
} from "@/hooks/useNavigationMenus";
import { ImagePickerDialog } from "./ImagePickerDialog";
import { SortableColumn } from "./SortableColumn";
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface MenuEditorProps {
  menu: NavigationMenu;
  onToggleActive: () => void;
  onDelete: () => void;
}

export default function MenuEditor({ menu, onToggleActive, onDelete }: MenuEditorProps) {
  const updateMenu = useUpdateMenu();
  const createColumn = useCreateColumn();
  const updateColumn = useUpdateColumn();
  const deleteColumn = useDeleteColumn();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const bulkUpdateColumnOrder = useBulkUpdateColumnOrder();
  const bulkUpdateItemOrder = useBulkUpdateItemOrder();

  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newColumnLink, setNewColumnLink] = useState("");
  
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemLink, setNewItemLink] = useState("");

  const [editingColumn, setEditingColumn] = useState<NavigationColumn | null>(null);
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<{ id: string; columnId: string } | null>(null);

  const [promoTitle, setPromoTitle] = useState(menu.promo_title || "");
  const [promoBadge, setPromoBadge] = useState(menu.promo_badge || "");
  const [promoLink, setPromoLink] = useState(menu.promo_link || "");
  const [promoImage, setPromoImage] = useState(menu.promo_image_url || "");
  const [showImagePicker, setShowImagePicker] = useState(false);

  const promoChanged =
    promoTitle !== (menu.promo_title || "") ||
    promoBadge !== (menu.promo_badge || "") ||
    promoLink !== (menu.promo_link || "") ||
    promoImage !== (menu.promo_image_url || "");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = menu.columns.findIndex((c) => c.id === active.id);
      const newIndex = menu.columns.findIndex((c) => c.id === over.id);
      
      const newColumns = [...menu.columns];
      const [removed] = newColumns.splice(oldIndex, 1);
      newColumns.splice(newIndex, 0, removed);
      
      const updates = newColumns.map((col, index) => ({
        id: col.id,
        display_order: index,
      }));
      
      bulkUpdateColumnOrder.mutate({ menu_id: menu.id, columns: updates });
    }
  };

  const handleItemsReorder = (columnId: string, items: NavigationItem[]) => {
    const updates = items.map((item, index) => ({
      id: item.id,
      display_order: index,
      column_id: columnId,
    }));
    
    bulkUpdateItemOrder.mutate({ menu_id: menu.id, items: updates });
  };

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return;
    createColumn.mutate(
      { menu_id: menu.id, title: newColumnTitle, shop_all_link: newColumnLink || undefined },
      {
        onSuccess: () => {
          setShowAddColumn(false);
          setNewColumnTitle("");
          setNewColumnLink("");
        },
      }
    );
  };

  const handleUpdateColumn = () => {
    if (!editingColumn) return;
    updateColumn.mutate(
      {
        id: editingColumn.id,
        menu_id: menu.id,
        title: editingColumn.title,
        shop_all_link: editingColumn.shop_all_link || undefined,
      },
      {
        onSuccess: () => setEditingColumn(null),
      }
    );
  };

  const handleDeleteColumn = (id: string) => {
    deleteColumn.mutate(
      { id, menu_id: menu.id },
      {
        onSuccess: () => setDeleteColumnId(null),
      }
    );
  };

  const handleAddItem = (columnId: string) => {
    if (!newItemLabel.trim() || !newItemLink.trim()) return;
    createItem.mutate(
      { column_id: columnId, label: newItemLabel, link: newItemLink, menu_id: menu.id },
      {
        onSuccess: () => {
          setShowAddItem(null);
          setNewItemLabel("");
          setNewItemLink("");
        },
      }
    );
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;
    updateItem.mutate(
      {
        id: editingItem.id,
        menu_id: menu.id,
        label: editingItem.label,
        link: editingItem.link,
      },
      {
        onSuccess: () => setEditingItem(null),
      }
    );
  };

  const handleDeleteItem = (id: string) => {
    deleteItem.mutate(
      { id, menu_id: menu.id },
      {
        onSuccess: () => setDeleteItemId(null),
      }
    );
  };

  const handleSavePromo = () => {
    updateMenu.mutate({
      id: menu.id,
      promo_title: promoTitle || null,
      promo_badge: promoBadge || null,
      promo_link: promoLink || null,
      promo_image_url: promoImage || null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl">{menu.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">/{menu.slug}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={menu.is_active} onCheckedChange={onToggleActive} />
              <Label>Active</Label>
            </div>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Promotional Banner - Inline Edit */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Promotional Banner</CardTitle>
          {promoChanged && (
            <Button size="sm" onClick={handleSavePromo} disabled={updateMenu.isPending}>
              Save changes
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Promo image</Label>
            <div className="flex items-center gap-2">
              {promoImage ? (
                <img src={promoImage} alt="Promo" className="w-20 h-12 object-cover rounded" />
              ) : (
                <div className="w-20 h-12 bg-muted rounded flex items-center justify-center">
                  <Image className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowImagePicker(true)}>
                {promoImage ? "Change" : "Select image"}
              </Button>
              {promoImage && (
                <Button variant="ghost" size="sm" onClick={() => setPromoImage("")}>
                  Remove
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="promoTitle">Title</Label>
              <Input
                id="promoTitle"
                placeholder="e.g., New Arrivals"
                value={promoTitle}
                onChange={(e) => setPromoTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promoBadge">Badge (optional)</Label>
              <Input
                id="promoBadge"
                placeholder="e.g., NEW, SALE"
                value={promoBadge}
                onChange={(e) => setPromoBadge(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promoLink">Link</Label>
              <Input
                id="promoLink"
                placeholder="e.g., /collections/new-arrivals"
                value={promoLink}
                onChange={(e) => setPromoLink(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Columns */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Menu Columns</CardTitle>
          <Button size="sm" onClick={() => setShowAddColumn(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add column
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {menu.columns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No columns yet. Add your first column to start building the menu.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleColumnDragEnd}
            >
              <SortableContext
                items={menu.columns.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {menu.columns.map((column) => (
                  <SortableColumn
                    key={column.id}
                    column={column}
                    onEditColumn={setEditingColumn}
                    onDeleteColumn={setDeleteColumnId}
                    onEditItem={setEditingItem}
                    onDeleteItem={(itemId, columnId) => setDeleteItemId({ id: itemId, columnId })}
                    onAddItem={setShowAddItem}
                    onItemsReorder={handleItemsReorder}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Add Column Dialog */}
      <Dialog open={showAddColumn} onOpenChange={setShowAddColumn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="columnTitle">Column title</Label>
              <Input
                id="columnTitle"
                placeholder="e.g., Food, Toys, Health"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="columnLink">Shop all link (optional)</Label>
              <Input
                id="columnLink"
                placeholder="e.g., /collections/dog-food"
                value={newColumnLink}
                onChange={(e) => setNewColumnLink(e.target.value)}
              />
              <CollectionSelectorPopover
                currentLink={newColumnLink}
                onSelect={(link) => setNewColumnLink(link)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddColumn(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddColumn} disabled={createColumn.isPending}>
              Add column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog */}
      <Dialog open={!!editingColumn} onOpenChange={() => setEditingColumn(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editColumnTitle">Column title</Label>
              <Input
                id="editColumnTitle"
                value={editingColumn?.title || ""}
                onChange={(e) =>
                  setEditingColumn((prev) => prev ? { ...prev, title: e.target.value } : null)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editColumnLink">Shop all link</Label>
              <Input
                id="editColumnLink"
                value={editingColumn?.shop_all_link || ""}
                onChange={(e) =>
                  setEditingColumn((prev) => prev ? { ...prev, shop_all_link: e.target.value } : null)
                }
              />
              <CollectionSelectorPopover
                currentLink={editingColumn?.shop_all_link || ""}
                onSelect={(link) =>
                  setEditingColumn((prev) => prev ? { ...prev, shop_all_link: link } : null)
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingColumn(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateColumn} disabled={updateColumn.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Column Dialog */}
      <AlertDialog open={!!deleteColumnId} onOpenChange={() => setDeleteColumnId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete column?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the column and all its items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteColumnId && handleDeleteColumn(deleteColumnId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Item Dialog */}
      <Dialog open={!!showAddItem} onOpenChange={() => setShowAddItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add menu item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="itemLabel">Label</Label>
              <Input
                id="itemLabel"
                placeholder="e.g., Dry Food, Wet Food"
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemLink">Link</Label>
              <Input
                id="itemLink"
                placeholder="e.g., /collections/dry-food"
                value={newItemLink}
                onChange={(e) => setNewItemLink(e.target.value)}
              />
              <CollectionSelectorPopover
                currentLink={newItemLink}
                onSelect={(link, name) => {
                  setNewItemLink(link);
                  if (!newItemLabel) setNewItemLabel(name);
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItem(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => showAddItem && handleAddItem(showAddItem)}
              disabled={createItem.isPending}
            >
              Add item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit menu item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editItemLabel">Label</Label>
              <Input
                id="editItemLabel"
                value={editingItem?.label || ""}
                onChange={(e) =>
                  setEditingItem((prev) => prev ? { ...prev, label: e.target.value } : null)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editItemLink">Link</Label>
              <Input
                id="editItemLink"
                value={editingItem?.link || ""}
                onChange={(e) =>
                  setEditingItem((prev) => prev ? { ...prev, link: e.target.value } : null)
                }
              />
              <CollectionSelectorPopover
                currentLink={editingItem?.link || ""}
                onSelect={(link) =>
                  setEditingItem((prev) => prev ? { ...prev, link: link } : null)
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateItem} disabled={updateItem.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Dialog */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this menu item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItemId && handleDeleteItem(deleteItemId.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Promo Dialog */}
      <Dialog open={showPromoEdit} onOpenChange={setShowPromoEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit promotional banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Promo image</Label>
              <div className="flex items-center gap-2">
                {promoImage ? (
                  <img src={promoImage} alt="Promo" className="w-20 h-12 object-cover rounded" />
                ) : (
                  <div className="w-20 h-12 bg-muted rounded flex items-center justify-center">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowImagePicker(true)}>
                  {promoImage ? "Change" : "Select image"}
                </Button>
                {promoImage && (
                  <Button variant="ghost" size="sm" onClick={() => setPromoImage("")}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="promoTitle">Title</Label>
              <Input
                id="promoTitle"
                placeholder="e.g., New Arrivals"
                value={promoTitle}
                onChange={(e) => setPromoTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promoBadge">Badge (optional)</Label>
              <Input
                id="promoBadge"
                placeholder="e.g., NEW, SALE"
                value={promoBadge}
                onChange={(e) => setPromoBadge(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promoLink">Link</Label>
              <Input
                id="promoLink"
                placeholder="e.g., /collections/new-arrivals"
                value={promoLink}
                onChange={(e) => setPromoLink(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromoEdit(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePromo} disabled={updateMenu.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Picker */}
      <ImagePickerDialog
        open={showImagePicker}
        onOpenChange={setShowImagePicker}
        onSelect={(url) => {
          setPromoImage(url);
          setShowImagePicker(false);
        }}
      />
    </div>
  );
}
