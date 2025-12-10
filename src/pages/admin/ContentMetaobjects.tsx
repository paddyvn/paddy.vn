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
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
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

export default function ContentMetaobjects() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Product Attributes</h2>
        <p className="text-muted-foreground">
          Manage predefined values for product classification
        </p>
      </div>

      <Tabs defaultValue="age_ranges" className="space-y-4">
        <TabsList>
          <TabsTrigger value="age_ranges">Age Ranges</TabsTrigger>
          <TabsTrigger value="sizes">Sizes</TabsTrigger>
          <TabsTrigger value="health_conditions">Health Conditions</TabsTrigger>
          <TabsTrigger value="origins">Origins</TabsTrigger>
        </TabsList>
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