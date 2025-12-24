import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  useDeliveryMethods,
  useCreateDeliveryMethod,
  useUpdateDeliveryMethod,
  useDeleteDeliveryMethod,
  DeliveryMethod,
} from "@/hooks/useDeliveryMethods";

interface FormData {
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  display_order: number;
}

const initialFormData: FormData = {
  name: "",
  description: "",
  price: 0,
  is_active: true,
  display_order: 0,
};

export default function DeliveryMethods() {
  const { data: methods, isLoading } = useDeliveryMethods();
  const createMethod = useCreateDeliveryMethod();
  const updateMethod = useUpdateDeliveryMethod();
  const deleteMethod = useDeleteDeliveryMethod();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (method: DeliveryMethod) => {
    setEditingId(method.id);
    setFormData({
      name: method.name,
      description: method.description || "",
      price: method.price,
      is_active: method.is_active,
      display_order: method.display_order,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    if (editingId) {
      await updateMethod.mutateAsync({ id: editingId, ...formData });
    } else {
      await createMethod.mutateAsync(formData);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc muốn xóa phương thức giao hàng này?")) {
      await deleteMethod.mutateAsync(id);
    }
  };

  const handleToggleActive = async (method: DeliveryMethod) => {
    await updateMethod.mutateAsync({ id: method.id, is_active: !method.is_active });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Phương thức giao hàng</h1>
          <p className="text-muted-foreground">Quản lý các phương thức giao hàng cho khách hàng</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Danh sách phương thức
          </CardTitle>
          <CardDescription>
            Các phương thức giao hàng sẽ hiển thị cho khách hàng khi thanh toán
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="text-right">Phí</TableHead>
                <TableHead className="text-center">Thứ tự</TableHead>
                <TableHead className="text-center">Hoạt động</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-10 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : methods?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Chưa có phương thức giao hàng nào
                  </TableCell>
                </TableRow>
              ) : (
                methods?.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.name}</TableCell>
                    <TableCell className="text-muted-foreground">{method.description || "-"}</TableCell>
                    <TableCell className="text-right font-medium">{formatPrice(method.price)}₫</TableCell>
                    <TableCell className="text-center">{method.display_order}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={method.is_active}
                        onCheckedChange={() => handleToggleActive(method)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(method)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(method.id)}
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
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Chỉnh sửa phương thức" : "Thêm phương thức mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên phương thức *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Giao hàng nhanh"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="VD: Giao trong 24 giờ"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Phí giao hàng (₫)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Thứ tự hiển thị</Label>
                <Input
                  id="display_order"
                  type="number"
                  min={0}
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Hoạt động</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || createMethod.isPending || updateMethod.isPending}
            >
              {editingId ? "Lưu" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
