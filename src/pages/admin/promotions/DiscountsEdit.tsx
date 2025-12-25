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
import { SimpleProductPicker } from "@/components/admin/SimpleProductPicker";

type DiscountsFormData = BasePromotionFormData & {
  discount_type: "percentage" | "fixed_amount" | "special_price";
  discount_value: number;
  min_purchase: number | null;
  gradient_from: string;
  gradient_to: string;
  icon_type: string;
  custom_icons: CustomIcon[];
};

const getDefaultFormData = (): DiscountsFormData => ({
  title: "",
  subtitle: "",
  is_active: true,
  display_order: 0,
  start_date: null,
  end_date: null,
  selectedCollections: [],
  selectedProducts: [],
  discount_type: "percentage",
  discount_value: 0,
  min_purchase: null,
  gradient_from: "#667EEA",
  gradient_to: "#764BA2",
  icon_type: "dog_cat",
  custom_icons: [],
});

export default function DiscountsEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [formData, setFormData] = useState<DiscountsFormData>(getDefaultFormData);

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
        gradient_from: promotion.gradient_from || "#667EEA",
        gradient_to: promotion.gradient_to || "#764BA2",
        icon_type: promotion.icon_type || "dog_cat",
        custom_icons: (Array.isArray((promotion as unknown as { custom_icons?: unknown }).custom_icons) 
          ? (promotion as unknown as { custom_icons: CustomIcon[] }).custom_icons 
          : []),
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
    mutationFn: async (data: DiscountsFormData) => {
      const payload = {
        title: data.title,
        subtitle: data.subtitle || null,
        link_type: "collection",
        link_destination: "",
        promo_type: "discounts",
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
      toast.success(isNew ? "Discount created" : "Discount updated");
      navigate("/admin/promotions/discounts");
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

  const getDiscountLabel = () => {
    if (formData.discount_type === "percentage") {
      return `${formData.discount_value}% off`;
    } else if (formData.discount_type === "fixed_amount") {
      return `${formData.discount_value.toLocaleString()}₫ off`;
    } else {
      return `Fixed price: ${formData.discount_value.toLocaleString()}₫`;
    }
  };

  return (
    <PromotionFormBase
      title={isNew ? "Create Discount" : formData.title || "Edit Discount"}
      typeLabel="Discount"
      formData={formData}
      setFormData={(data) => setFormData((prev) => ({ ...prev, ...data }))}
      onSave={handleSave}
      isSaving={saveMutation.isPending}
      isLoading={!isNew && isLoading}
      backUrl="/admin/promotions/discounts"
      hideAppliesTo={true}
      summaryExtra={
        <div>
          <p className="text-sm text-muted-foreground">Discount</p>
          <p className="font-medium">{getDiscountLabel()}</p>
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
            <h3 className="font-semibold">Discount Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: "percentage" | "fixed_amount" | "special_price") =>
                    setFormData({ ...formData, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    <SelectItem value="special_price">Special Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  {formData.discount_type === "percentage"
                    ? "Discount Percentage (%)"
                    : formData.discount_type === "fixed_amount"
                    ? "Discount Amount (₫)"
                    : "Special Price (₫)"}
                </Label>
                <Input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Minimum Purchase (₫)</Label>
              <Input
                type="number"
                value={formData.min_purchase || ""}
                onChange={(e) =>
                  setFormData({ ...formData, min_purchase: e.target.value ? parseFloat(e.target.value) : null })
                }
                placeholder="No minimum"
              />
              <p className="text-sm text-muted-foreground">Minimum order value to apply discount</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flash Sale-style Product Picker */}
      <SimpleProductPicker
        selectedProductIds={formData.selectedProducts}
        onProductsChange={(productIds) => setFormData((prev) => ({ ...prev, selectedProducts: productIds }))}
        title="Sản phẩm áp dụng giảm giá"
      />
    </PromotionFormBase>
  );
}
