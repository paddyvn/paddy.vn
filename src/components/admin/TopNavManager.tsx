import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Link as LinkIcon, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { NavigationMenu } from "@/hooks/useNavigationMenus";

interface TopNavItem {
  id: string;
  label: string;
  link_url: string | null;
  mega_menu_id: string | null;
  position: number;
  is_active: boolean;
  mega_menu: { id: string; slug: string; name: string } | null;
}

interface TopNavManagerProps {
  menus: NavigationMenu[] | undefined;
}

interface FormState {
  label: string;
  type: "link" | "mega_menu";
  link_url: string;
  mega_menu_id: string;
  is_active: boolean;
}

const defaultForm: FormState = {
  label: "",
  type: "link",
  link_url: "",
  mega_menu_id: "",
  is_active: true,
};

export default function TopNavManager({ menus }: TopNavManagerProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const { data: navItems = [], isLoading } = useQuery({
    queryKey: ["admin-top-nav-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("top_nav_items")
        .select(`
          id, label, link_url, mega_menu_id, position, is_active,
          mega_menu:navigation_menus(id, slug, name)
        `)
        .order("position");
      if (error) throw error;
      return (data || []) as unknown as TopNavItem[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-top-nav-items"] });
    queryClient.invalidateQueries({ queryKey: ["top-nav-items"] });
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (item: TopNavItem) => {
    setEditingId(item.id);
    setForm({
      label: item.label,
      type: item.mega_menu_id ? "mega_menu" : "link",
      link_url: item.link_url || "",
      mega_menu_id: item.mega_menu_id || "",
      is_active: item.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.label.trim()) return;

    const payload = {
      label: form.label.trim(),
      link_url: form.type === "link" ? form.link_url.trim() || null : null,
      mega_menu_id: form.type === "mega_menu" && form.mega_menu_id ? form.mega_menu_id : null,
      is_active: form.is_active,
    };

    if (editingId) {
      const { error } = await supabase.from("top_nav_items").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Item updated");
    } else {
      const { error } = await supabase.from("top_nav_items").insert({
        ...payload,
        position: navItems.length,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Item added");
    }

    setDialogOpen(false);
    invalidate();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("top_nav_items").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Item deleted");
    invalidate();
  };

  const handleToggleActive = async (item: TopNavItem) => {
    await supabase.from("top_nav_items").update({ is_active: !item.is_active }).eq("id", item.id);
    invalidate();
  };

  const moveItem = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= navItems.length) return;
    const reordered = [...navItems];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from("top_nav_items").update({ position: i }).eq("id", reordered[i].id);
    }
    invalidate();
  };

  const filteredMenus = menus?.filter(
    (m) => !m.slug.startsWith("footer") && m.slug !== "pet-selector"
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Top Navigation Bar</CardTitle>
          <CardDescription>Control which items appear in the main navigation bar.</CardDescription>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : navItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No nav items yet.</p>
        ) : (
          <div className="space-y-2">
            {navItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-background"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      disabled={index === 0}
                      onClick={() => moveItem(index, -1)}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      disabled={index === navItems.length - 1}
                      onClick={() => moveItem(index, 1)}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.mega_menu_id
                        ? `→ ${item.mega_menu?.name || "Menu"}`
                        : `→ ${item.link_url || "—"}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.mega_menu_id ? "default" : "secondary"}>
                    {item.mega_menu_id ? (
                      <><Layers className="h-3 w-3 mr-1" />Mega menu</>
                    ) : (
                      <><LinkIcon className="h-3 w-3 mr-1" />Link</>
                    )}
                  </Badge>
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={() => handleToggleActive(item)}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Nav Item" : "Add Nav Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Chó"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as "link" | "mega_menu" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Simple link</SelectItem>
                  <SelectItem value="mega_menu">Mega menu dropdown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.type === "link" ? (
              <div className="space-y-2">
                <Label>Link URL</Label>
                <Input
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  placeholder="/flash-sale"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Mega menu</Label>
                <Select
                  value={form.mega_menu_id}
                  onValueChange={(v) => setForm({ ...form, mega_menu_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a menu..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMenus?.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.columns.length} cols, {m.columns.reduce((a, c) => a + c.items.length, 0)} items)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This item will open a mega menu dropdown on hover. Manage menu content below.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
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
    </Card>
  );
}
