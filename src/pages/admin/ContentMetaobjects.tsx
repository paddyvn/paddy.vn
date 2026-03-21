import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type AttributeType = "age_ranges" | "sizes" | "health_conditions" | "origins";

interface Attribute {
  id: string;
  name: string;
  name_vi: string;
  display_order: number;
  is_active: boolean;
  country_code?: string;
}

interface OptionTemplateValue {
  value: string;
  value_vi: string;
}

interface OptionTemplate {
  id: string;
  name: string;
  name_vi: string;
  display_order: number;
  is_active: boolean;
  values: OptionTemplateValue[];
}

const ATTRIBUTE_CONFIG: Record<AttributeType, { 
  title: string; 
  titleVi: string;
  table: string;
  hasCountryCode: boolean;
}> = {
  age_ranges: { 
    title: "Age Ranges", 
    titleVi: "Độ tuổi",
    table: "product_age_ranges",
    hasCountryCode: false
  },
  sizes: { 
    title: "Sizes", 
    titleVi: "Giống/Kích thước",
    table: "product_sizes",
    hasCountryCode: false
  },
  health_conditions: { 
    title: "Health Conditions", 
    titleVi: "Tình trạng sức khoẻ",
    table: "product_health_conditions",
    hasCountryCode: false
  },
  origins: { 
    title: "Origins", 
    titleVi: "Xuất xứ",
    table: "product_origins",
    hasCountryCode: true
  },
};

function AttributeTable({ type }: { type: AttributeType }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const config = ATTRIBUTE_CONFIG[type];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Attribute | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_vi: "",
    country_code: "",
    is_active: true,
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["product-attributes", type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(config.table as "product_age_ranges")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as unknown as Attribute[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Attribute>) => {
      if (editingItem) {
        const { error } = await supabase
          .from(config.table as "product_age_ranges")
          .update(data as any)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const maxOrder = items?.reduce((max, item) => Math.max(max, item.display_order), 0) || 0;
        const { error } = await supabase
          .from(config.table as "product_age_ranges")
          .insert({ ...data, display_order: maxOrder + 1 } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-attributes", type] });
      toast({ title: editingItem ? "Updated" : "Created", description: `Attribute ${editingItem ? "updated" : "created"} successfully.` });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(config.table as "product_age_ranges")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-attributes", type] });
      toast({ title: "Deleted", description: "Attribute deleted successfully." });
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from(config.table as "product_age_ranges")
        .update({ is_active } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-attributes", type] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from(config.table as "product_age_ranges")
        .update({ display_order: newOrder } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-attributes", type] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    if (!items) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) return;

    const currentItem = items[index];
    const swapItem = items[swapIndex];

    reorderMutation.mutate({ id: currentItem.id, newOrder: swapItem.display_order });
    reorderMutation.mutate({ id: swapItem.id, newOrder: currentItem.display_order });
  };

  const handleOpenDialog = (item?: Attribute) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        name_vi: item.name_vi,
        country_code: item.country_code || "",
        is_active: item.is_active,
      });
    } else {
      setEditingItem(null);
      setFormData({ name: "", name_vi: "", country_code: "", is_active: true });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData({ name: "", name_vi: "", country_code: "", is_active: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      name: formData.name,
      name_vi: formData.name_vi,
      is_active: formData.is_active,
    };
    if (config.hasCountryCode) {
      data.country_code = formData.country_code;
    }
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{items?.length || 0} items</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              Add {config.title.slice(0, -1)}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit" : "Add"} {config.title.slice(0, -1)}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (English)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_vi">Name (Vietnamese)</Label>
                <Input
                  id="name_vi"
                  value={formData.name_vi}
                  onChange={(e) => setFormData((p) => ({ ...p, name_vi: e.target.value }))}
                  required
                />
              </div>
              {config.hasCountryCode && (
                <div className="space-y-2">
                  <Label htmlFor="country_code">Country Code</Label>
                  <Input
                    id="country_code"
                    value={formData.country_code}
                    onChange={(e) => setFormData((p) => ({ ...p, country_code: e.target.value.toUpperCase() }))}
                    placeholder="VN, US, JP..."
                    maxLength={2}
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Vietnamese</TableHead>
              {config.hasCountryCode && <TableHead>Code</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={config.hasCountryCode ? 6 : 5} className="text-center py-8 text-muted-foreground">
                  No items yet. Add your first one.
                </TableCell>
              </TableRow>
            ) : (
              items?.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === 0 || reorderMutation.isPending}
                        onClick={() => handleMoveItem(index, "up")}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === (items?.length ?? 0) - 1 || reorderMutation.isPending}
                        onClick={() => handleMoveItem(index, "down")}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.name_vi}</TableCell>
                  {config.hasCountryCode && (
                    <TableCell>
                      <Badge variant="outline">{item.country_code || "—"}</Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({ id: item.id, is_active: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this attribute. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
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

function OptionTemplatesTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OptionTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_vi: "",
    is_active: true,
    values: [] as OptionTemplateValue[],
  });
  const [newValue, setNewValue] = useState("");
  const [newValueVi, setNewValueVi] = useState("");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["option-templates-full"],
    queryFn: async () => {
      const { data: templatesData, error: templatesError } = await supabase
        .from("product_option_templates")
        .select("id, name, name_vi, display_order, is_active")
        .order("display_order", { ascending: true });
      if (templatesError) throw templatesError;

      const { data: valuesData, error: valuesError } = await supabase
        .from("product_option_template_values")
        .select("template_id, value, value_vi, display_order")
        .order("display_order", { ascending: true });
      if (valuesError) throw valuesError;

      const result: OptionTemplate[] = templatesData.map((t) => ({
        id: t.id,
        name: t.name,
        name_vi: t.name_vi || "",
        display_order: t.display_order || 0,
        is_active: t.is_active ?? true,
        values: valuesData
          .filter((v) => v.template_id === t.id)
          .map((v) => ({ value: v.value, value_vi: v.value_vi || "" })),
      }));
      return result;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { name: string; name_vi: string; is_active: boolean; values: OptionTemplateValue[] }) => {
      if (editingTemplate) {
        const { error: updateError } = await supabase
          .from("product_option_templates")
          .update({ name: data.name, name_vi: data.name_vi, is_active: data.is_active })
          .eq("id", editingTemplate.id);
        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from("product_option_template_values")
          .delete()
          .eq("template_id", editingTemplate.id);
        if (deleteError) throw deleteError;

        if (data.values.length > 0) {
          const { error: insertError } = await supabase
            .from("product_option_template_values")
            .insert(
              data.values.map((v, index) => ({
                template_id: editingTemplate.id,
                value: v.value,
                value_vi: v.value_vi,
                display_order: index,
              }))
            );
          if (insertError) throw insertError;
        }
      } else {
        const maxOrder = templates?.reduce((max, t) => Math.max(max, t.display_order), 0) || 0;
        const { data: newTemplate, error: createError } = await supabase
          .from("product_option_templates")
          .insert({ name: data.name, name_vi: data.name_vi, is_active: data.is_active, display_order: maxOrder + 1 })
          .select("id")
          .single();
        if (createError) throw createError;

        if (data.values.length > 0) {
          const { error: insertError } = await supabase
            .from("product_option_template_values")
            .insert(
              data.values.map((v, index) => ({
                template_id: newTemplate.id,
                value: v.value,
                value_vi: v.value_vi,
                display_order: index,
              }))
            );
          if (insertError) throw insertError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["option-templates-full"] });
      queryClient.invalidateQueries({ queryKey: ["option-templates"] });
      toast({ title: editingTemplate ? "Updated" : "Created", description: `Option template ${editingTemplate ? "updated" : "created"} successfully.` });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: valuesError } = await supabase
        .from("product_option_template_values")
        .delete()
        .eq("template_id", id);
      if (valuesError) throw valuesError;

      const { error } = await supabase
        .from("product_option_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["option-templates-full"] });
      queryClient.invalidateQueries({ queryKey: ["option-templates"] });
      toast({ title: "Deleted", description: "Option template deleted successfully." });
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("product_option_templates")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["option-templates-full"] });
      queryClient.invalidateQueries({ queryKey: ["option-templates"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from("product_option_templates")
        .update({ display_order: newOrder })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["option-templates-full"] });
      queryClient.invalidateQueries({ queryKey: ["option-templates"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleMoveTemplate = (index: number, direction: "up" | "down") => {
    if (!templates) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= templates.length) return;

    const currentItem = templates[index];
    const swapItem = templates[swapIndex];

    reorderMutation.mutate({ id: currentItem.id, newOrder: swapItem.display_order });
    reorderMutation.mutate({ id: swapItem.id, newOrder: currentItem.display_order });
  };

  const handleOpenDialog = (template?: OptionTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        name_vi: template.name_vi,
        is_active: template.is_active,
        values: [...template.values],
      });
    } else {
      setEditingTemplate(null);
      setFormData({ name: "", name_vi: "", is_active: true, values: [] });
    }
    setNewValue("");
    setNewValueVi("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setFormData({ name: "", name_vi: "", is_active: true, values: [] });
    setNewValue("");
    setNewValueVi("");
  };

  const handleAddValue = () => {
    if (newValue.trim() && !formData.values.some(v => v.value === newValue.trim())) {
      setFormData((p) => ({ 
        ...p, 
        values: [...p.values, { value: newValue.trim(), value_vi: newValueVi.trim() }] 
      }));
      setNewValue("");
      setNewValueVi("");
    }
  };

  const handleRemoveValue = (valueToRemove: string) => {
    setFormData((p) => ({ ...p, values: p.values.filter((v) => v.value !== valueToRemove) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{templates?.length || 0} templates</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit" : "Add"} Option Template
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Option Name (EN)</Label>
                  <Input
                    id="template-name"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., Size, Color"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-name-vi">Option Name (VI)</Label>
                  <Input
                    id="template-name-vi"
                    value={formData.name_vi}
                    onChange={(e) => setFormData((p) => ({ ...p, name_vi: e.target.value }))}
                    placeholder="e.g., Kích thước, Màu sắc"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Suggested Values</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Value (EN)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddValue();
                      }
                    }}
                  />
                  <Input
                    value={newValueVi}
                    onChange={(e) => setNewValueVi(e.target.value)}
                    placeholder="Value (VI)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddValue();
                      }
                    }}
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddValue} className="mt-1">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Value
                </Button>
                {formData.values.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.values.map((v) => (
                      <Badge key={v.value} variant="secondary" className="gap-1">
                        {v.value}{v.value_vi ? ` (${v.value_vi})` : ""}
                        <button
                          type="button"
                          onClick={() => handleRemoveValue(v.value)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="template-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_active: checked }))}
                />
                <Label htmlFor="template-is_active">Active</Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Order</TableHead>
              <TableHead>Option Name</TableHead>
              <TableHead>Values</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No option templates yet. Add your first one.
                </TableCell>
              </TableRow>
            ) : (
              templates?.map((template, index) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === 0 || reorderMutation.isPending}
                        onClick={() => handleMoveTemplate(index, "up")}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === (templates?.length ?? 0) - 1 || reorderMutation.isPending}
                        onClick={() => handleMoveTemplate(index, "down")}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>{template.name}</div>
                    {template.name_vi && (
                      <div className="text-xs text-muted-foreground">{template.name_vi}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {template.values.slice(0, 5).map((v) => (
                        <Badge key={v.value} variant="outline" className="text-xs">
                          {v.value}
                        </Badge>
                      ))}
                      {template.values.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.values.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({ id: template.id, is_active: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(template)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget({ id: template.id, name: template.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this option template and all its values. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
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

export default function ContentMetaobjects() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Product Attributes</h2>
        <p className="text-muted-foreground">
          Manage predefined values for product classification
        </p>
      </div>

      <Tabs defaultValue="option_templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="option_templates">Option Templates</TabsTrigger>
          <TabsTrigger value="age_ranges">Age Ranges</TabsTrigger>
          <TabsTrigger value="sizes">Sizes</TabsTrigger>
          <TabsTrigger value="health_conditions">Health Conditions</TabsTrigger>
          <TabsTrigger value="origins">Origins</TabsTrigger>
        </TabsList>
        <TabsContent value="option_templates">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Variant Option Templates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Predefined options shown when adding variant options to products (e.g., Size, Color, Flavor)
              </p>
            </CardHeader>
            <CardContent>
              <OptionTemplatesTable />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="age_ranges">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Age Ranges (Độ tuổi)</CardTitle>
            </CardHeader>
            <CardContent>
              <AttributeTable type="age_ranges" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sizes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sizes (Giống/Kích thước)</CardTitle>
            </CardHeader>
            <CardContent>
              <AttributeTable type="sizes" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="health_conditions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Health Conditions (Tình trạng sức khoẻ)</CardTitle>
            </CardHeader>
            <CardContent>
              <AttributeTable type="health_conditions" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="origins">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Origins (Xuất xứ)</CardTitle>
            </CardHeader>
            <CardContent>
              <AttributeTable type="origins" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
