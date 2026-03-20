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
import { DealCardAppearanceCard, CustomIcon } from "@/components/admin/DealCardAppearanceCard";

type ComboBuyFormData = BasePromotionFormData & {
  combo_type: "buy_x_discount_y" | "buy_x_free_y" | "bundles";
  buy_quantity: number;
  get_quantity: number;
  discount_percentage: number;
  bundle_price: number;
  gradient_from: string;
  gradient_to: string;
  icon_type: string;
  custom_icons: CustomIcon[];
};

const getDefaultFormData = (): ComboBuyFormData => ({
  title: "",
  subtitle: "",
  is_active: true,
  display_order: 0,
  start_date: null,
  end_date: null,
  selectedCollections: [],
  selectedProducts: [],
  combo_type: "buy_x_discount_y",
  buy_quantity: 2,
  get_quantity: 1,
  discount_percentage: 50,
  bundle_price: 0,
  gradient_from: "#f7971e",
  gradient_to: "#ffd200",
  icon_type: "dog_cat",
  custom_icons: [],
});

export default function ComboBuyEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [formData, setFormData] = useState<ComboBuyFormData>(getDefaultFormData);

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
      const rules = (promotion as any).rules || {};
      setFormData((prev) => ({
        ...prev,
        title: promotion.title || "",
        subtitle: promotion.subtitle || "",
        is_active: promotion.is_active ?? true,
        display_order: promotion.display_order || 0,
        start_date: promotion.start_date ? new Date(promotion.start_date) : null,
        end_date: promotion.end_date ? new Date(promotion.end_date) : null,
        gradient_from: promotion.gradient_from || "#f7971e",
        gradient_to: promotion.gradient_to || "#ffd200",
        icon_type: promotion.icon_type || "dog_cat",
        custom_icons: (Array.isArray((promotion as unknown as { custom_icons?: unknown }).custom_icons) 
          ? (promotion as unknown as { custom_icons: CustomIcon[] }).custom_icons 
          : []),
        combo_type: rules.combo_type || "buy_x_discount_y",
        buy_quantity: rules.buy_quantity || 2,
        get_quantity: rules.get_quantity || 1,
        discount_percentage: rules.discount_percentage || 50,
        bundle_price: rules.bundle_price || 0,
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
    mutationFn: async (data: ComboBuyFormData) => {
      const payload = {
        title: data.title,
        subtitle: data.subtitle || null,
        link_type: "collection",
        link_destination: "",
        promo_type: "deal",
        program_kind: "combo_buy",
        is_active: data.is_active,
        display_order: data.display_order,
        start_date: data.start_date?.toISOString() || null,
        end_date: data.end_date?.toISOString() || null,
        gradient_from: data.gradient_from,
        gradient_to: data.gradient_to,
        icon_type: data.icon_type,
        custom_icons: data.custom_icons.length > 0 ? JSON.parse(JSON.stringify(data.custom_icons)) : null,
      };

      let promotionId = id;

      if (isNew) {
        const { data: newPromo, error } = await supabase
          .from("promotions")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert(payload as any)
          .select("id")
          .single();
        if (error) throw error;
        promotionId = newPromo.id;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from("promotions").update(payload as any).eq("id", id);
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
      toast.success(isNew ? "Combo Buy promotion created" : "Combo Buy promotion updated");
      navigate("/admin/promotions/combo-buy");
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

  const getComboDescription = () => {
    if (formData.combo_type === "buy_x_free_y") {
      return `Buy ${formData.buy_quantity}, get ${formData.get_quantity} free`;
    } else if (formData.combo_type === "buy_x_discount_y") {
      return `Buy ${formData.buy_quantity}, get ${formData.discount_percentage}% off`;
    }
    return "Bundle deal";
  };

  return (
    <PromotionFormBase
      title={isNew ? "Create Combo Buy" : formData.title || "Edit Combo Buy"}
      typeLabel="Combo Buy"
      formData={formData}
      setFormData={(data) => setFormData((prev) => ({ ...prev, ...data }))}
      onSave={handleSave}
      isSaving={saveMutation.isPending}
      isLoading={!isNew && isLoading}
      backUrl="/admin/promotions/combo-buy"
      summaryExtra={
        <div>
          <p className="text-sm text-muted-foreground">Deal</p>
          <p className="font-medium">{getComboDescription()}</p>
        </div>
      }
      rightColumnExtra={
        <DealCardAppearanceCard
          gradientFrom={formData.gradient_from}
          gradientTo={formData.gradient_to}
          iconType={formData.icon_type}
          customIcons={formData.custom_icons}
          title={formData.title}
          subtitle={formData.subtitle}
          onGradientFromChange={(value) => setFormData((prev) => ({ ...prev, gradient_from: value }))}
          onGradientToChange={(value) => setFormData((prev) => ({ ...prev, gradient_to: value }))}
          onIconTypeChange={(value) => setFormData((prev) => ({ ...prev, icon_type: value }))}
          onCustomIconsChange={(icons) => setFormData((prev) => ({ ...prev, custom_icons: icons }))}
        />
      }
    >
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Combo Settings</h3>
            <div className="space-y-2">
              <Label>Combo Type</Label>
              <Select
                value={formData.combo_type}
                onValueChange={(value: "buy_x_discount_y" | "buy_x_free_y" | "bundles") =>
                  setFormData({ ...formData, combo_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy_x_discount_y">Buy X, Get Discount</SelectItem>
                  <SelectItem value="buy_x_free_y">Buy X, Get Y Free</SelectItem>
                  <SelectItem value="bundles">Bundle Deal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.combo_type !== "bundles" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Buy Quantity</Label>
                  <Input
                    type="number"
                    value={formData.buy_quantity}
                    onChange={(e) => setFormData({ ...formData, buy_quantity: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
                {formData.combo_type === "buy_x_free_y" ? (
                  <div className="space-y-2">
                    <Label>Get Free Quantity</Label>
                    <Input
                      type="number"
                      value={formData.get_quantity}
                      onChange={(e) => setFormData({ ...formData, get_quantity: parseInt(e.target.value) || 1 })}
                      min={1}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Discount Percentage (%)</Label>
                    <Input
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </PromotionFormBase>
  );
}
