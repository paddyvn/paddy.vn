import { useState } from "react";
import { Plus, Trash2, GripVertical, ExternalLink, Pencil, Image } from "lucide-react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
} from "@/hooks/useNavigationMenus";
import { ImagePickerDialog } from "./ImagePickerDialog";

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

  const [showPromoEdit, setShowPromoEdit] = useState(false);
  const [promoTitle, setPromoTitle] = useState(menu.promo_title || "");
  const [promoBadge, setPromoBadge] = useState(menu.promo_badge || "");
  const [promoLink, setPromoLink] = useState(menu.promo_link || "");
  const [promoImage, setPromoImage] = useState(menu.promo_image_url || "");
  const [showImagePicker, setShowImagePicker] = useState(false);

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
    updateMenu.mutate(
      {
        id: menu.id,
        promo_title: promoTitle || null,
        promo_badge: promoBadge || null,
        promo_link: promoLink || null,
        promo_image_url: promoImage || null,
      },
      {
        onSuccess: () => setShowPromoEdit(false),
      }
    );
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

      {/* Promotional Banner */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Promotional Banner</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowPromoEdit(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          {menu.promo_image_url || menu.promo_title ? (
            <div className="flex gap-4">
              {menu.promo_image_url && (
                <img
                  src={menu.promo_image_url}
                  alt="Promo"
                  className="w-32 h-20 object-cover rounded-lg"
                />
              )}
              <div>
                {menu.promo_badge && (
                  <Badge variant="secondary" className="mb-1">{menu.promo_badge}</Badge>
                )}
                {menu.promo_title && <p className="font-medium">{menu.promo_title}</p>}
                {menu.promo_link && (
                  <p className="text-sm text-muted-foreground">{menu.promo_link}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No promotional banner configured</p>
          )}
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
            menu.columns.map((column) => (
              <Collapsible key={column.id} defaultOpen>
                <div className="border rounded-lg">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{column.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {column.items.length} items
                            {column.shop_all_link && ` · Shop all: ${column.shop_all_link}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingColumn(column);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteColumnId(column.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t p-4 space-y-2 bg-muted/20">
                      {column.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-md bg-background border"
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                {item.link}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingItem(item)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDeleteItemId({ id: item.id, columnId: column.id })}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setShowAddItem(column.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add item
                      </Button>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))
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
