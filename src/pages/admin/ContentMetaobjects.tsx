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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical, X } from "lucide-react";
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

interface OptionTemplate {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  values: string[];
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

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
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
              <TableHead className="w-10"></TableHead>
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
              items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
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
                        onClick={() => handleDelete(item.id, item.name)}
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
    </div>
  );
}

function OptionTemplatesTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OptionTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    is_active: true,
    values: [] as string[],
  });
  const [newValue, setNewValue] = useState("");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["option-templates-full"],
    queryFn: async () => {
      const { data: templatesData, error: templatesError } = await supabase
        .from("product_option_templates")
        .select("id, name, display_order, is_active")
        .order("display_order", { ascending: true });
      if (templatesError) throw templatesError;

      const { data: valuesData, error: valuesError } = await supabase
        .from("product_option_template_values")
        .select("template_id, value, display_order")
        .order("display_order", { ascending: true });
      if (valuesError) throw valuesError;

      const result: OptionTemplate[] = templatesData.map((t) => ({
        id: t.id,
        name: t.name,
        display_order: t.display_order || 0,
        is_active: t.is_active ?? true,
        values: valuesData.filter((v) => v.template_id === t.id).map((v) => v.value),
      }));
      return result;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { name: string; is_active: boolean; values: string[] }) => {
      if (editingTemplate) {
        // Update template
        const { error: updateError } = await supabase
          .from("product_option_templates")
          .update({ name: data.name, is_active: data.is_active })
          .eq("id", editingTemplate.id);
        if (updateError) throw updateError;

        // Delete existing values
        const { error: deleteError } = await supabase
          .from("product_option_template_values")
          .delete()
          .eq("template_id", editingTemplate.id);
        if (deleteError) throw deleteError;

        // Insert new values
        if (data.values.length > 0) {
          const { error: insertError } = await supabase
            .from("product_option_template_values")
            .insert(
              data.values.map((value, index) => ({
                template_id: editingTemplate.id,
                value,
                display_order: index,
              }))
            );
          if (insertError) throw insertError;
        }
      } else {
        // Create new template
        const maxOrder = templates?.reduce((max, t) => Math.max(max, t.display_order), 0) || 0;
        const { data: newTemplate, error: createError } = await supabase
          .from("product_option_templates")
          .insert({ name: data.name, is_active: data.is_active, display_order: maxOrder + 1 })
          .select("id")
          .single();
        if (createError) throw createError;

        // Insert values
        if (data.values.length > 0) {
          const { error: insertError } = await supabase
            .from("product_option_template_values")
            .insert(
              data.values.map((value, index) => ({
                template_id: newTemplate.id,
                value,
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
      // Delete values first
      const { error: valuesError } = await supabase
        .from("product_option_template_values")
        .delete()
        .eq("template_id", id);
      if (valuesError) throw valuesError;

      // Delete template
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

  const handleOpenDialog = (template?: OptionTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        is_active: template.is_active,
        values: [...template.values],
      });
    } else {
      setEditingTemplate(null);
      setFormData({ name: "", is_active: true, values: [] });
    }
    setNewValue("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setFormData({ name: "", is_active: true, values: [] });
    setNewValue("");
  };

  const handleAddValue = () => {
    if (newValue.trim() && !formData.values.includes(newValue.trim())) {
      setFormData((p) => ({ ...p, values: [...p.values, newValue.trim()] }));
      setNewValue("");
    }
  };

  const handleRemoveValue = (value: string) => {
    setFormData((p) => ({ ...p, values: p.values.filter((v) => v !== value) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit" : "Add"} Option Template
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Option Name</Label>
                <Input
                  id="template-name"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Size, Color, Flavor"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Suggested Values</Label>
                <div className="flex gap-2">
                  <Input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Add a value"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddValue();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddValue}>
                    Add
                  </Button>
                </div>
                {formData.values.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.values.map((value) => (
                      <Badge key={value} variant="secondary" className="gap-1">
                        {value}
                        <button
                          type="button"
                          onClick={() => handleRemoveValue(value)}
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
              <TableHead className="w-10"></TableHead>
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
              templates?.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {template.values.slice(0, 5).map((value) => (
                        <Badge key={value} variant="outline" className="text-xs">
                          {value}
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
                        onClick={() => handleDelete(template.id, template.name)}
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