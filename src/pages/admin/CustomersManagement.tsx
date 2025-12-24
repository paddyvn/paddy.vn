import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomers, useUpdateCustomer, Customer } from "@/hooks/useCustomers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Mail, 
  Phone, 
  ShoppingBag, 
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Tag,
  FileText,
  User,
  RefreshCw
} from "lucide-react";
import { useSyncCustomers } from "@/hooks/useSyncCustomers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

const CUSTOMERS_PER_PAGE = 50;

export default function CustomersManagement() {
  const navigate = useNavigate();
  const { data: customers, isLoading } = useCustomers();
  const updateCustomer = useUpdateCustomer();
  const syncCustomers = useSyncCustomers();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [marketingFilter, setMarketingFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    
    return customers.filter((customer) => {
      const matchesSearch = 
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery);
      
      const matchesMarketing = 
        marketingFilter === "all" ||
        (marketingFilter === "subscribed" && customer.accepts_marketing) ||
        (marketingFilter === "not-subscribed" && !customer.accepts_marketing);
      
      return matchesSearch && matchesMarketing;
    });
  }, [customers, searchQuery, marketingFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCustomers.length / CUSTOMERS_PER_PAGE);
  const startIndex = (currentPage - 1) * CUSTOMERS_PER_PAGE;
  const endIndex = startIndex + CUSTOMERS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, marketingFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSaveNote = () => {
    if (selectedCustomer) {
      updateCustomer.mutate({
        id: selectedCustomer.id,
        updates: { note },
      });
      setEditingNote(false);
    }
  };

  const openCustomerDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setNote(customer.note || "");
    setEditingNote(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground mt-1">
              Manage your customer database
            </p>
          </div>
          <Button
            onClick={() => syncCustomers.mutate()}
            disabled={syncCustomers.isPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncCustomers.isPending ? "animate-spin" : ""}`} />
            {syncCustomers.isPending ? "Syncing..." : "Sync Customers"}
          </Button>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search customers by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={marketingFilter} onValueChange={setMarketingFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Marketing status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All customers</SelectItem>
              <SelectItem value="subscribed">Subscribed</SelectItem>
              <SelectItem value="not-subscribed">Not subscribed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : paginatedCustomers.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No customers found</h3>
          <p className="text-muted-foreground">
            {searchQuery || marketingFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Sync customers from Shopify to get started"}
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Marketing</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/admin/customers/${customer.id}`)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {customer.first_name} {customer.last_name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {customer.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.verified_email ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Not verified
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      {customer.orders_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      {formatCurrency(customer.total_spent)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.accepts_marketing ? (
                      <Badge variant="default">Subscribed</Badge>
                    ) : (
                      <Badge variant="outline">Not subscribed</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(customer.updated_at)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filteredCustomers.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of{" "}
            {filteredCustomers.length} customers
          </p>
          
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {/* First page */}
                {currentPage > 3 && (
                  <>
                    <PaginationItem>
                      <PaginationLink onClick={() => setCurrentPage(1)} className="cursor-pointer">
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {currentPage > 4 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                  </>
                )}

                {/* Page numbers around current page */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return Math.abs(page - currentPage) <= 1;
                  })
                  .map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                {/* Last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage(totalPages)}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className={
                      currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <User className="h-6 w-6" />
              Customer Details
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase">Name</Label>
                    <p className="text-lg font-semibold mt-1">
                      {selectedCustomer.first_name} {selectedCustomer.last_name}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      Email
                    </Label>
                    <p className="mt-1">{selectedCustomer.email || "N/A"}</p>
                    {selectedCustomer.verified_email && (
                      <Badge variant="default" className="mt-1 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-xs uppercase flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      Phone
                    </Label>
                    <p className="mt-1">{selectedCustomer.phone || "N/A"}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <ShoppingBag className="h-4 w-4" />
                      <span className="text-xs uppercase font-semibold">Orders</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedCustomer.orders_count}</p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs uppercase font-semibold">Total Spent</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(selectedCustomer.total_spent)}
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Mail className="h-4 w-4" />
                      <span className="text-xs uppercase font-semibold">Marketing</span>
                    </div>
                    <Badge variant={selectedCustomer.accepts_marketing ? "default" : "outline"}>
                      {selectedCustomer.accepts_marketing ? "Subscribed" : "Not subscribed"}
                    </Badge>
                    {selectedCustomer.marketing_opt_in_level && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Level: {selectedCustomer.marketing_opt_in_level}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tags */}
              {selectedCustomer.tags && (
                <div>
                  <Label className="text-muted-foreground text-xs uppercase flex items-center gap-2 mb-2">
                    <Tag className="h-3 w-3" />
                    Tags
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-muted-foreground text-xs uppercase flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    Notes
                  </Label>
                  {!editingNote && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingNote(true)}
                    >
                      Edit Note
                    </Button>
                  )}
                </div>
                
                {editingNote ? (
                  <div className="space-y-2">
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a note about this customer..."
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSaveNote} disabled={updateCustomer.isPending}>
                        Save Note
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingNote(false);
                          setNote(selectedCustomer.note || "");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                    {selectedCustomer.note || "No notes yet"}
                  </p>
                )}
              </div>

              <Separator />

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Customer Since</Label>
                  <p className="mt-1">
                    {selectedCustomer.shopify_created_at 
                      ? formatDate(selectedCustomer.shopify_created_at)
                      : formatDate(selectedCustomer.created_at)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Last Updated</Label>
                  <p className="mt-1">{formatDate(selectedCustomer.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
