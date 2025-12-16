import { useState, useEffect } from "react";
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

const SUB_TYPES: Record<string, { label: string; value: string }[]> = {
  "discounts": [
    { label: "Percentage", value: "percentage" },
    { label: "Fixed Amount", value: "fixed_amount" },
    { label: "Special Price", value: "special_price" },
  ],
  "vouchers": [
    { label: "Public", value: "public" },
    { label: "Private", value: "private" },
    { label: "Influencer", value: "influencer" },
  ],
  "combo-buy": [
    { label: "Buy X Get Discount Y", value: "buy_x_discount_y" },
    { label: "Buy X Get Free Y", value: "buy_x_free_y" },
    { label: "Bundles", value: "bundles" },
  ],
};

const ALL_PROMO_TYPES = [
  { label: "Flash Sale", value: "flash_sale" },
  { label: "Discounts", value: "discounts" },
  { label: "Vouchers", value: "vouchers" },
  { label: "Combo Buy", value: "combo_buy" },
  { label: "Buy More Save More", value: "buy_more_save_more" },
  { label: "Free Shipping", value: "free_shipping" },
  { label: "Subscription Deals", value: "subscription_deals" },
  { label: "Clearance", value: "clearance" },
];

export default function PromotionsManagement() {
  const navigate = useNavigate();
  const { promoType } = useParams<{ promoType?: string }>();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedSubType, setSelectedSubType] = useState<string | null>(null);
  const [selectedPromoType, setSelectedPromoType] = useState<string | null>(null);

  // Reset filters when promo type changes
  useEffect(() => {
    setSelectedSubType(null);
    setSelectedPromoType(null);
  }, [promoType]);

  const typeConfig = promoType ? PROMO_TYPE_MAP[promoType] : null;
  const subTypes = promoType ? SUB_TYPES[promoType] : null;
  const pageTitle = typeConfig ? typeConfig.label : "All Deals";
  const pageDescription = typeConfig 
    ? `Manage ${typeConfig.label.toLowerCase()} promotions` 
    : "Manage deals and promotional banners";

  const { data: promotions, isLoading } = useQuery({
    queryKey: ["promotions", promoType, selectedPromoType],
    queryFn: async () => {
      let query = supabase
        .from("promotions")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (typeConfig) {
        query = query.eq("promo_type", typeConfig.dbValue);
      } else if (selectedPromoType) {
        query = query.eq("promo_type", selectedPromoType);
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
      ? `/admin/promotions/${promoType}/new/edit` 
      : "/admin/promotions/new/edit";
    navigate(url);
  };

  const handleEdit = (promoId: string, promoTypeValue?: string) => {
    const typeSlug = promoTypeValue ? Object.entries(PROMO_TYPE_MAP).find(([_, v]) => v.dbValue === promoTypeValue)?.[0] : null;
    const url = typeSlug 
      ? `/admin/promotions/${typeSlug}/${promoId}/edit`
      : `/admin/promotions/${promoId}/edit`;
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

      {/* Promo type filter for main page */}
      {!promoType && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground mr-2">Type:</span>
              <Badge 
                variant={selectedPromoType === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedPromoType(null)}
              >
                All
              </Badge>
              {ALL_PROMO_TYPES.map((type) => (
                <Badge
                  key={type.value}
                  variant={selectedPromoType === type.value ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedPromoType(type.value)}
                >
                  {type.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sub-type filter for specific promo type pages */}
      {subTypes && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground mr-2">Type:</span>
              <Badge 
                variant={selectedSubType === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedSubType(null)}
              >
                All
              </Badge>
              {subTypes.map((subType) => (
                <Badge
                  key={subType.value}
                  variant={selectedSubType === subType.value ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedSubType(subType.value)}
                >
                  {subType.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                        onClick={() => handleEdit(promo.id, promo.promo_type)}
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
