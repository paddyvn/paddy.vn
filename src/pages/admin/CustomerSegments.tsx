import { useState } from "react";
import { Users, Plus, Trash2, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import {
  useSegments,
  useCreateSegment,
  useUpdateSegment,
  useDeleteSegment,
  useSegmentCustomers,
  SegmentFilter,
  CustomerSegment,
} from "@/hooks/useSegments";
import { SegmentFilterBuilder } from "@/components/SegmentFilterBuilder";
import { useCustomers } from "@/hooks/useCustomers";

export default function CustomerSegments() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | null>(null);
  const [previewFilters, setPreviewFilters] = useState<SegmentFilter[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    filters: [] as SegmentFilter[],
  });

  const { data: segments, isLoading } = useSegments();
  const { data: allCustomers } = useCustomers();
  const { data: previewCustomers } = useSegmentCustomers(previewFilters);
  const createSegment = useCreateSegment();
  const updateSegment = useUpdateSegment();
  const deleteSegment = useDeleteSegment();

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      filters: [],
    });
  };

  const handleCreate = async () => {
    await createSegment.mutateAsync(formData);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEdit = (segment: CustomerSegment) => {
    setSelectedSegment(segment);
    setFormData({
      name: segment.name,
      description: segment.description || "",
      filters: segment.filters,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedSegment) return;
    await updateSegment.mutateAsync({
      id: selectedSegment.id,
      updates: formData,
    });
    setIsEditDialogOpen(false);
    setSelectedSegment(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedSegment) return;
    await deleteSegment.mutateAsync(selectedSegment.id);
    setIsDeleteDialogOpen(false);
    setSelectedSegment(null);
  };

  const handlePreview = (filters: SegmentFilter[]) => {
    setPreviewFilters(filters);
    setIsPreviewDialogOpen(true);
  };

  const getSegmentCustomerCount = (filters: SegmentFilter[]) => {
    if (!allCustomers) return 0;
    
    return allCustomers.filter((customer) => {
      return filters.every((filter) => {
        const fieldValue = customer[filter.field as keyof typeof customer];
        
        switch (filter.operator) {
          case "equals":
            return fieldValue == filter.value;
          case "not_equals":
            return fieldValue != filter.value;
          case "greater_than":
            return Number(fieldValue) > Number(filter.value);
          case "less_than":
            return Number(fieldValue) < Number(filter.value);
          case "greater_than_or_equal":
            return Number(fieldValue) >= Number(filter.value);
          case "less_than_or_equal":
            return Number(fieldValue) <= Number(filter.value);
          case "contains":
            return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
          case "is_true":
            return fieldValue === true;
          case "is_false":
            return fieldValue === false;
          default:
            return true;
        }
      });
    }).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Segments</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage customer segments for targeted marketing
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Segment
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : segments && segments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Segments</CardTitle>
            <CardDescription>
              {segments.length} segment{segments.length !== 1 ? "s" : ""} created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Filters</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.map((segment) => (
                  <TableRow key={segment.id}>
                    <TableCell className="font-medium">{segment.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {segment.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {segment.filters.length} filter{segment.filters.length !== 1 ? "s" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getSegmentCustomerCount(segment.filters)} customers
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreview(segment.filters)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(segment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedSegment(segment);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Segments Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            Create your first customer segment to organize customers by behavior, spending, and more.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Segment
          </Button>
        </div>
      )}

      {/* Create Segment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Customer Segment</DialogTitle>
            <DialogDescription>
              Define filters to automatically group customers based on their attributes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Segment Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., High Value Customers"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe this segment..."
                rows={3}
              />
            </div>

            <SegmentFilterBuilder
              filters={formData.filters}
              onChange={(filters) => setFormData({ ...formData, filters })}
            />

            {formData.filters.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  Estimated customers: {getSegmentCustomerCount(formData.filters)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(formData.filters)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || formData.filters.length === 0}
            >
              Create Segment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Segment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer Segment</DialogTitle>
            <DialogDescription>
              Update the segment name, description, or filters.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Segment Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., High Value Customers"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe this segment..."
                rows={3}
              />
            </div>

            <SegmentFilterBuilder
              filters={formData.filters}
              onChange={(filters) => setFormData({ ...formData, filters })}
            />

            {formData.filters.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  Estimated customers: {getSegmentCustomerCount(formData.filters)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(formData.filters)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.name || formData.filters.length === 0}
            >
              Update Segment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Customers Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Segment Preview</DialogTitle>
            <DialogDescription>
              Customers matching the current filters
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            {previewCustomers && previewCustomers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        {customer.first_name} {customer.last_name}
                      </TableCell>
                      <TableCell>{customer.email || "—"}</TableCell>
                      <TableCell>{customer.orders_count}</TableCell>
                      <TableCell>
                        {customer.total_spent?.toLocaleString("vi-VN")}₫
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No customers match these filters
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Segment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSegment?.name}"? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
