import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useDeleteAbandonedCheckout,
  useSendRecoveryEmail,
  AbandonedCheckout,
} from "@/hooks/useAbandonedCheckouts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Mail,
  Eye,
  Trash2,
  ShoppingCart,
  Calendar,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { useSyncAbandonedCheckouts } from "@/hooks/useSyncAbandonedCheckouts";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
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

const CHECKOUTS_PER_PAGE = 50;

function applyCheckoutFilters(query: any, searchQuery: string) {
  if (searchQuery) {
    query = query.or(
      `email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,shopify_checkout_id.ilike.%${searchQuery}%`
    );
  }
  return query;
}

export default function AbandonedCheckouts() {
  const deleteCheckout = useDeleteAbandonedCheckout();
  const sendRecoveryEmail = useSendRecoveryEmail();
  const syncAbandonedCheckouts = useSyncAbandonedCheckouts();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCheckout, setSelectedCheckout] = useState<AbandonedCheckout | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [checkoutToDelete, setCheckoutToDelete] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Count query
  const { data: totalCount = 0 } = useQuery({
    queryKey: ["admin-abandoned-checkouts-count", debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from("abandoned_checkouts")
        .select("*", { count: "exact", head: true })
        .is("completed_at", null);

      query = applyCheckoutFilters(query, debouncedSearch);

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  // Data query
  const { data: checkouts, isLoading } = useQuery({
    queryKey: ["admin-abandoned-checkouts", debouncedSearch, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * CHECKOUTS_PER_PAGE;
      const to = from + CHECKOUTS_PER_PAGE - 1;

      let query = supabase
        .from("abandoned_checkouts")
        .select("*")
        .is("completed_at", null)
        .order("shopify_created_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      query = applyCheckoutFilters(query, debouncedSearch);
      query = query.range(from, to);

      const { data, error } = await query;
      if (error) throw error;
      return data as AbandonedCheckout[];
    },
  });

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / CHECKOUTS_PER_PAGE);
  const startIndex = (currentPage - 1) * CHECKOUTS_PER_PAGE;
  const endIndex = Math.min(startIndex + CHECKOUTS_PER_PAGE, totalCount);

  const handleDelete = async () => {
    if (!checkoutToDelete) return;
    await deleteCheckout.mutateAsync(checkoutToDelete);
    setDeleteDialogOpen(false);
    setCheckoutToDelete(null);
  };

  const getTotalItems = (lineItems: any[]) => {
    return lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };

  const getTimeSinceAbandoned = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Abandoned Checkouts</h1>
            <p className="text-muted-foreground mt-1">
              Track and recover abandoned shopping carts
            </p>
          </div>
          <Button
            onClick={() => syncAbandonedCheckouts.mutate()}
            disabled={syncAbandonedCheckouts.isPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncAbandonedCheckouts.isPending ? "animate-spin" : ""}`} />
            {syncAbandonedCheckouts.isPending ? "Syncing..." : "Sync Checkouts"}
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by email, phone, or checkout ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (checkouts || []).length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No abandoned checkouts</h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "No checkouts match your search"
              : "Sync data from Shopify to see abandoned checkouts"}
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Abandoned</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(checkouts || []).map((checkout) => (
                <TableRow
                  key={checkout.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedCheckout(checkout)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {checkout.email || "No email"}
                      </span>
                      {checkout.phone && (
                        <span className="text-sm text-muted-foreground">
                          {checkout.phone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      {getTotalItems(checkout.line_items)} item
                      {getTotalItems(checkout.line_items) !== 1 ? "s" : ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      {formatCurrency(checkout.total_price)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {getTimeSinceAbandoned(
                          checkout.shopify_created_at || checkout.created_at
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => sendRecoveryEmail.mutate(checkout)}
                        title="Send recovery email"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCheckoutToDelete(checkout.id);
                          setDeleteDialogOpen(true);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filteredCheckouts.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredCheckouts.length)}{" "}
            of {filteredCheckouts.length} checkouts
          </p>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {currentPage > 3 && (
                  <>
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage(1)}
                        className="cursor-pointer"
                      >
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

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => Math.abs(page - currentPage) <= 1)
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
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {/* Checkout Details Dialog */}
      <Dialog open={!!selectedCheckout} onOpenChange={() => setSelectedCheckout(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <ShoppingCart className="h-6 w-6" />
              Abandoned Checkout Details
            </DialogTitle>
            <DialogDescription>
              Abandoned {selectedCheckout?.shopify_created_at && formatDate(selectedCheckout.shopify_created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedCheckout && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      {selectedCheckout.email || "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      {selectedCheckout.phone || "—"}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Checkout Summary</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Items:</span>{" "}
                      {getTotalItems(selectedCheckout.line_items)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Total:</span>{" "}
                      {formatCurrency(selectedCheckout.total_price)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Abandoned:</span>{" "}
                      {getTimeSinceAbandoned(
                        selectedCheckout.shopify_created_at || selectedCheckout.created_at
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h3 className="font-semibold mb-3">Items in Cart</h3>
                <div className="border rounded-lg divide-y">
                  {selectedCheckout.line_items.map((item: any, index: number) => (
                    <div key={index} className="p-4 flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        {item.variant_title && (
                          <p className="text-sm text-muted-foreground">
                            {item.variant_title}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(parseFloat(item.price) * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => sendRecoveryEmail.mutate(selectedCheckout)}
                  className="flex-1"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Recovery Email
                </Button>
                {selectedCheckout.abandoned_checkout_url && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(selectedCheckout.abandoned_checkout_url!, "_blank")
                    }
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Checkout
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Abandoned Checkout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this abandoned checkout? This action cannot be
              undone.
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
