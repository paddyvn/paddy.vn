import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, GripVertical, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const PROMO_TYPE_MAP: Record<string, { label: string; dbValue: string }> = {
  "flash-sale": { label: "Flash Sale", dbValue: "flash_sale" },
  "discounts": { label: "Discounts", dbValue: "discounts" },
  "vouchers": { label: "Vouchers", dbValue: "vouchers" },
  "combo-buy": { label: "Combo Buy", dbValue: "combo_buy" },
  "buy-more-save-more": { label: "Buy More Save More", dbValue: "buy_more_save_more" },
  "free-shipping": { label: "Free Shipping", dbValue: "free_shipping" },
  "subscription-deals": { label: "Subscription Deals", dbValue: "subscription_deals" },
  "clearance": { label: "Clearance", dbValue: "clearance" },
};

export default function PromotionsManagement() {
  const navigate = useNavigate();
  const { promoType } = useParams<{ promoType?: string }>();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const typeConfig = promoType ? PROMO_TYPE_MAP[promoType] : null;
  const pageTitle = typeConfig ? typeConfig.label : "All Deals";
  const pageDescription = typeConfig 
    ? `Manage ${typeConfig.label.toLowerCase()} promotions` 
    : "Manage deals and promotional banners";

  const { data: promotions, isLoading } = useQuery({
    queryKey: ["promotions", promoType],
    queryFn: async () => {
      let query = supabase
        .from("promotions")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (typeConfig) {
        query = query.eq("promo_type", typeConfig.dbValue);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promotion deleted");
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });

  const handleAddNew = () => {
    const url = promoType 
      ? `/admin/promotions/new/edit?type=${promoType}` 
      : "/admin/promotions/new/edit";
    navigate(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add {typeConfig ? typeConfig.label : "Promotion"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{pageTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !promotions?.length ? (
            <p className="text-muted-foreground text-center py-8">
              No {typeConfig ? typeConfig.label.toLowerCase() : "promotions"} yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  {!typeConfig && <TableHead>Type</TableHead>}
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>
                      <div
                        className="w-24 h-12 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                        style={{
                          background: `linear-gradient(135deg, ${promo.gradient_from || "#8B5CF6"}, ${promo.gradient_to || "#D946EF"})`,
                        }}
                      >
                        {promo.title.length > 10 ? `${promo.title.slice(0, 10)}...` : promo.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{promo.title}</p>
                        {promo.subtitle && (
                          <p className="text-sm text-muted-foreground">{promo.subtitle}</p>
                        )}
                      </div>
                    </TableCell>
                    {!typeConfig && (
                      <TableCell>
                        <Badge variant="outline">{promo.promo_type || "deal"}</Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="text-sm">
                        {promo.start_date && (
                          <div>From: {format(new Date(promo.start_date), "MMM d, yyyy")}</div>
                        )}
                        {promo.end_date && (
                          <div>To: {format(new Date(promo.end_date), "MMM d, yyyy")}</div>
                        )}
                        {!promo.start_date && !promo.end_date && (
                          <span className="text-muted-foreground">Always</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={promo.is_active ? "default" : "secondary"}>
                        {promo.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/promotions/${promo.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(promo.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this promotion? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
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
