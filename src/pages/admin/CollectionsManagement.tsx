import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, MoreVertical, Pencil, Trash2, Plus, Filter, Image as ImageIcon, ChevronLeft, ChevronRight, Tags, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 20;

const COLLECTION_TYPES = [
  { value: "custom", label: "Custom" },
  { value: "smart", label: "Smart" },
  { value: "brand", label: "Brand" },
  { value: "featured", label: "Featured" },
  { value: "sale", label: "Sale" },
  { value: "seasonal", label: "Seasonal" },
  { value: "pet-type", label: "Pet Type" },
  { value: "age-group", label: "Age Group" },
  { value: "health-condition", label: "Health Condition" },
];

type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number | null;
  collection_type: string | null;
  product_collections: Array<{ id: string }>;
  rules: any;
};

const collectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  slug: z.string().trim().min(1, "Slug is required").max(100, "Slug must be less than 100 characters").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  image_url: z.string().url("Invalid URL").max(500, "URL too long").optional().or(z.literal("")),
});

type SortColumn = "name" | "collection_type" | "display_order" | "is_active";
type SortDirection = "asc" | "desc";

export default function CollectionsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn>("display_order");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkTypeDialogOpen, setIsBulkTypeDialogOpen] = useState(false);
  const [bulkCollectionType, setBulkCollectionType] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="ml-1 h-3 w-3" /> 
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const { data: collectionsData, isLoading, refetch } = useQuery({
    queryKey: ["admin-collections", searchQuery, statusFilter, typeFilter, currentPage, sortColumn, sortDirection],
    queryFn: async () => {
      // First get the total count
      let countQuery = supabase
        .from("categories")
        .select("*", { count: "exact", head: true });

      if (searchQuery) {
        countQuery = countQuery.ilike("name", `%${searchQuery}%`);
      }

      if (statusFilter !== "all") {
        countQuery = countQuery.eq("is_active", statusFilter === "active");
      }

      if (typeFilter !== "all") {
        countQuery = countQuery.eq("collection_type", typeFilter);
      }

      const { count } = await countQuery;

      // Then get the paginated data
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("categories")
        .select(`
          id,
          name,
          slug,
          description,
          image_url,
          is_active,
          display_order,
          collection_type,
          rules,
          rules_match_type,
          product_collections(id)
        `)
        .order(sortColumn, { ascending: sortDirection === "asc", nullsFirst: false })
        .range(from, to);

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("is_active", statusFilter === "active");
      }

      if (typeFilter !== "all") {
        query = query.eq("collection_type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      console.log('Collections data sample:', data?.[0]);
      
      return {
        collections: data as Collection[],
        totalCount: count || 0,
      };
    },
  });

  const collections = collectionsData?.collections;
  const totalCount = collectionsData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name, slug: generateSlug(name) });
  };

  const validateForm = () => {
    try {
      collectionSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    try {
      const collectionData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        image_url: formData.image_url.trim() || null,
        is_active: true,
      };

      if (editingCollection) {
        const { error } = await supabase
          .from("categories")
          .update(collectionData)
          .eq("id", editingCollection.id);

        if (error) throw error;

        toast({
          title: "Collection updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        const { error } = await supabase
          .from("categories")
          .insert(collectionData);

        if (error) throw error;

        toast({
          title: "Collection created",
          description: `${formData.name} has been created successfully.`,
        });
      }

      setIsDialogOpen(false);
      setEditingCollection(null);
      setFormData({ name: "", slug: "", description: "", image_url: "" });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save collection",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (collection: Collection) => {
    navigate(`/admin/collections/${collection.id}`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will not delete the products in this collection.`)) return;

    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Collection deleted",
        description: `${name} has been deleted successfully.`,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete collection",
        variant: "destructive",
      });
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean, name: string) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `${name} is now ${!currentStatus ? "active" : "inactive"}.`,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleAddNew = () => {
    navigate("/admin/collections/new");
  };

  const toggleSelectAll = () => {
    if (!collections) return;
    if (selectedIds.size === collections.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(collections.map(c => c.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkTypeChange = async () => {
    if (!bulkCollectionType || selectedIds.size === 0) return;

    try {
      const { error } = await supabase
        .from("categories")
        .update({ collection_type: bulkCollectionType })
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "Collection type updated",
        description: `Updated ${selectedIds.size} collection(s) to "${COLLECTION_TYPES.find(t => t.value === bulkCollectionType)?.label}"`,
      });

      setSelectedIds(new Set());
      setIsBulkTypeDialogOpen(false);
      setBulkCollectionType("");
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update collection type",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Collections</h2>
          <p className="text-muted-foreground">Organize products into collections</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Collection
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-card p-4 rounded-lg border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select 
          value={typeFilter} 
          onValueChange={(value) => {
            setTypeFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Collection Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
            <SelectItem value="smart">Smart</SelectItem>
            <SelectItem value="brand">Brand</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="sale">Sale</SelectItem>
            <SelectItem value="seasonal">Seasonal</SelectItem>
            <SelectItem value="pet-type">Pet Type</SelectItem>
            <SelectItem value="age-group">Age Group</SelectItem>
            <SelectItem value="health-condition">Health Condition</SelectItem>
          </SelectContent>
        </Select>
        <Select 
          value={statusFilter} 
          onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 bg-primary/10 p-3 rounded-lg border border-primary/20">
          <span className="text-sm font-medium">
            {selectedIds.size} collection{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsBulkTypeDialogOpen(true)}
          >
            <Tags className="mr-2 h-4 w-4" />
            Change Type
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
          >
            <X className="mr-2 h-4 w-4" />
            Clear Selection
          </Button>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={collections && collections.length > 0 && selectedIds.size === collections.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>
                <button 
                  onClick={() => handleSort("name")} 
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Collection
                  <SortIcon column="name" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  onClick={() => handleSort("collection_type")} 
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Type
                  <SortIcon column="collection_type" />
                </button>
              </TableHead>
              <TableHead>Conditions</TableHead>
              <TableHead>
                <button 
                  onClick={() => handleSort("is_active")} 
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Status
                  <SortIcon column="is_active" />
                </button>
              </TableHead>
              <TableHead>Products</TableHead>
              <TableHead>
                <button 
                  onClick={() => handleSort("display_order")} 
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Order
                  <SortIcon column="display_order" />
                </button>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-12 w-12 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[250px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : collections?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No collections found. Create your first collection to get started.
                </TableCell>
              </TableRow>
            ) : (
              collections?.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(collection.id)}
                      onCheckedChange={() => toggleSelectOne(collection.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {collection.image_url ? (
                      <img
                        src={collection.image_url}
                        alt={collection.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div 
                      className="font-medium cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/admin/collections/${collection.id}`)}
                    >
                      {collection.name}
                    </div>
                    <div className="text-sm text-muted-foreground">{collection.slug}</div>
                  </TableCell>
                  <TableCell>
                    {collection.collection_type ? (
                      <button
                        onClick={() => {
                          setTypeFilter(collection.collection_type || "all");
                          setCurrentPage(1);
                        }}
                        className="text-sm capitalize text-primary cursor-pointer hover:underline transition-colors"
                      >
                        {COLLECTION_TYPES.find(t => t.value === collection.collection_type)?.label || collection.collection_type}
                      </button>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {collection.rules && Array.isArray(collection.rules) && collection.rules.length > 0 ? (
                      <span className="text-sm text-muted-foreground">
                        {collection.rules.length} condition{collection.rules.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={collection.is_active ? "default" : "secondary"}>
                      {collection.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {collection.product_collections.length} product{collection.product_collections.length !== 1 ? "s" : ""}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {collection.display_order ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background">
                        <DropdownMenuItem onClick={() => handleEdit(collection)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleStatus(collection.id, collection.is_active, collection.name)}
                        >
                          {collection.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(collection.id, collection.name)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {collections && collections.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startItem} to {endItem} of {totalCount} collection{totalCount !== 1 ? "s" : ""}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}


      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingCollection ? "Edit Collection" : "Add Collection"}</DialogTitle>
            <DialogDescription>
              {editingCollection ? "Update the collection details below." : "Create a new collection to organize your products."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Summer Collection"
                maxLength={100}
              />
              {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="summer-collection"
                maxLength={100}
              />
              {formErrors.slug && <p className="text-sm text-destructive">{formErrors.slug}</p>}
              <p className="text-xs text-muted-foreground">URL-friendly identifier (lowercase, hyphens only)</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this collection..."
                rows={3}
                maxLength={1000}
              />
              {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                maxLength={500}
              />
              {formErrors.image_url && <p className="text-sm text-destructive">{formErrors.image_url}</p>}
              {formData.image_url && (
                <div className="mt-2">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="h-32 w-32 rounded object-cover border"
                    onError={(e) => {
                      e.currentTarget.src = "";
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingCollection ? "Update Collection" : "Create Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Change Type Dialog */}
      <Dialog open={isBulkTypeDialogOpen} onOpenChange={setIsBulkTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Collection Type</DialogTitle>
            <DialogDescription>
              Update the type for {selectedIds.size} selected collection{selectedIds.size !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bulk-type">Collection Type</Label>
              <Select value={bulkCollectionType} onValueChange={setBulkCollectionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {COLLECTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsBulkTypeDialogOpen(false);
              setBulkCollectionType("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleBulkTypeChange} disabled={!bulkCollectionType}>
              Update Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}