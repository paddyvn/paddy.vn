import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PromotionFormBase, BasePromotionFormData } from "@/components/admin/PromotionFormBase";

type SubscriptionDealsFormData = BasePromotionFormData & {
  frequency: "weekly" | "biweekly" | "monthly" | "bimonthly" | "quarterly";
  discount_percentage: number;
  first_order_discount: number;
};

const getDefaultFormData = (): SubscriptionDealsFormData => ({
  title: "",
  subtitle: "",
  is_active: true,
  display_order: 0,
  start_date: null,
  end_date: null,
  selectedCollections: [],
  selectedProducts: [],
  frequency: "monthly",
  discount_percentage: 10,
  first_order_discount: 20,
});

export default function SubscriptionDealsEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [formData, setFormData] = useState<SubscriptionDealsFormData>(getDefaultFormData);

  const { data: promotion, isLoading } = useQuery({
    queryKey: ["promotion", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  const { data: existingCollections = [] } = useQuery({
    queryKey: ["promotion-collections", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotion_collections")
        .select("collection_id")
        .eq("promotion_id", id);
      if (error) throw error;
      return data.map((d) => d.collection_id);
    },
    enabled: !isNew && !!id,
  });

  const { data: existingProducts = [] } = useQuery({
    queryKey: ["promotion-products", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotion_products")
        .select("product_id")
        .eq("promotion_id", id);
      if (error) throw error;
      return data.map((d) => d.product_id);
    },
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (promotion) {
      setFormData((prev) => ({
        ...prev,
        title: promotion.title || "",
        subtitle: promotion.subtitle || "",
        is_active: promotion.is_active ?? true,
        display_order: promotion.display_order || 0,
        start_date: promotion.start_date ? new Date(promotion.start_date) : null,
        end_date: promotion.end_date ? new Date(promotion.end_date) : null,
      }));
    }
  }, [promotion]);

  useEffect(() => {
    if (existingCollections.length > 0 || existingProducts.length > 0) {
      setFormData((prev) => ({
        ...prev,
        selectedCollections: existingCollections,
        selectedProducts: existingProducts,
      }));
    }
  }, [existingCollections, existingProducts]);

  const saveMutation = useMutation({
    mutationFn: async (data: SubscriptionDealsFormData) => {
      const payload = {
        title: data.title,
        subtitle: data.subtitle || null,
        link_type: "collection",
        link_destination: "",
        promo_type: "subscription_deals",
        is_active: data.is_active,
        display_order: data.display_order,
        start_date: data.start_date?.toISOString() || null,
        end_date: data.end_date?.toISOString() || null,
      };

      let promotionId = id;

      if (isNew) {
        const { data: newPromo, error } = await supabase
          .from("promotions")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        promotionId = newPromo.id;
      } else {
        const { error } = await supabase.from("promotions").update(payload).eq("id", id);
        if (error) throw error;
      }

      if (!isNew) {
        await supabase.from("promotion_collections").delete().eq("promotion_id", promotionId);
        await supabase.from("promotion_products").delete().eq("promotion_id", promotionId);
      }

      if (data.selectedCollections.length > 0) {
        await supabase.from("promotion_collections").insert(
          data.selectedCollections.map((cid) => ({ promotion_id: promotionId, collection_id: cid }))
        );
      }

      if (data.selectedProducts.length > 0) {
        await supabase.from("promotion_products").insert(
          data.selectedProducts.map((pid) => ({ promotion_id: promotionId, product_id: pid }))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success(isNew ? "Subscription Deal created" : "Subscription Deal updated");
      navigate("/admin/promotions/subscription-deals");
    },
    onError: (error) => {
      toast.error("Failed to save: " + error.message);
    },
  });

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    saveMutation.mutate(formData);
  };

  const frequencyLabels: Record<string, string> = {
    weekly: "Weekly",
    biweekly: "Every 2 weeks",
    monthly: "Monthly",
    bimonthly: "Every 2 months",
    quarterly: "Quarterly",
  };

  return (
    <PromotionFormBase
      title={isNew ? "Create Subscription Deal" : formData.title || "Edit Subscription Deal"}
      typeLabel="Subscription Deal"
      formData={formData}
      setFormData={(data) => setFormData({ ...formData, ...data })}
      onSave={handleSave}
      isSaving={saveMutation.isPending}
      isLoading={!isNew && isLoading}
      backUrl="/admin/promotions/subscription-deals"
      summaryExtra={
        <>
          <div>
            <p className="text-sm text-muted-foreground">Frequency</p>
            <p className="font-medium">{frequencyLabels[formData.frequency]}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Discount</p>
            <p className="font-medium">{formData.discount_percentage}% recurring</p>
          </div>
        </>
      }
    >
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Subscription Settings</h3>
            <div className="space-y-2">
              <Label>Delivery Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: SubscriptionDealsFormData["frequency"]) =>
                  setFormData({ ...formData, frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="bimonthly">Every 2 Months</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Recurring Discount (%)</Label>
                <Input
                  type="number"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-sm text-muted-foreground">Applied to all recurring orders</p>
              </div>
              <div className="space-y-2">
                <Label>First Order Discount (%)</Label>
                <Input
                  type="number"
                  value={formData.first_order_discount}
                  onChange={(e) => setFormData({ ...formData, first_order_discount: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-sm text-muted-foreground">Extra discount for first subscription order</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PromotionFormBase>
  );
}
