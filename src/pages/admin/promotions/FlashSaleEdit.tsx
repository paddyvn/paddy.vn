import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PromotionFormBase, BasePromotionFormData } from "@/components/admin/PromotionFormBase";

type FlashSaleFormData = BasePromotionFormData & {
  show_countdown: boolean;
  urgency_message: string;
  limit_per_customer: number | null;
};

const getDefaultFormData = (): FlashSaleFormData => ({
  title: "",
  subtitle: "",
  is_active: true,
  display_order: 0,
  start_date: null,
  end_date: null,
  selectedCollections: [],
  selectedProducts: [],
  show_countdown: true,
  urgency_message: "Hurry! Sale ends soon",
  limit_per_customer: null,
});

export default function FlashSaleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [formData, setFormData] = useState<FlashSaleFormData>(getDefaultFormData);

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
    mutationFn: async (data: FlashSaleFormData) => {
      const payload = {
        title: data.title,
        subtitle: data.subtitle || null,
        link_type: "collection",
        link_destination: "",
        promo_type: "flash_sale",
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

      // Update junction tables
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
      toast.success(isNew ? "Flash Sale created" : "Flash Sale updated");
      navigate("/admin/promotions/flash-sale");
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

  return (
    <PromotionFormBase
      title={isNew ? "Create Flash Sale" : formData.title || "Edit Flash Sale"}
      typeLabel="Flash Sale"
      formData={formData}
      setFormData={(data) => setFormData({ ...formData, ...data })}
      onSave={handleSave}
      isSaving={saveMutation.isPending}
      isLoading={!isNew && isLoading}
      backUrl="/admin/promotions/flash-sale"
      summaryExtra={
        <div>
          <p className="text-sm text-muted-foreground">Countdown</p>
          <p className="font-medium">{formData.show_countdown ? "Enabled" : "Disabled"}</p>
        </div>
      }
    >
      {/* Flash Sale specific fields */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Flash Sale Settings</h3>
            <div className="flex items-center justify-between">
              <div>
                <Label>Show Countdown Timer</Label>
                <p className="text-sm text-muted-foreground">Display countdown on product pages</p>
              </div>
              <Switch
                checked={formData.show_countdown}
                onCheckedChange={(checked) => setFormData({ ...formData, show_countdown: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label>Urgency Message</Label>
              <Input
                value={formData.urgency_message}
                onChange={(e) => setFormData({ ...formData, urgency_message: e.target.value })}
                placeholder="e.g., Hurry! Sale ends soon"
              />
            </div>
            <div className="space-y-2">
              <Label>Limit Per Customer</Label>
              <Input
                type="number"
                value={formData.limit_per_customer || ""}
                onChange={(e) =>
                  setFormData({ ...formData, limit_per_customer: e.target.value ? parseInt(e.target.value) : null })
                }
                placeholder="No limit"
              />
              <p className="text-sm text-muted-foreground">Maximum items per customer (leave empty for no limit)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PromotionFormBase>
  );
}
