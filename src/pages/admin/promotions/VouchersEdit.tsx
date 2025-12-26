import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PromotionFormBase, BasePromotionFormData } from "@/components/admin/PromotionFormBase";
import { DealCardAppearanceCard, CustomIcon } from "@/components/admin/DealCardAppearanceCard";
import { SimpleProductPicker, ProductDiscountSetting } from "@/components/admin/SimpleProductPicker";

type VouchersFormData = BasePromotionFormData & {
  voucher_code: string;
  voucher_type: "public" | "private" | "influencer";
  usage_limit: number | null;
  one_per_customer: boolean;
  discount_percentage: number;
  gradient_from: string;
  gradient_to: string;
  icon_type: string;
  custom_icons: CustomIcon[];
  productSettings: ProductDiscountSetting[];
};

const getDefaultFormData = (): VouchersFormData => ({
  title: "",
  subtitle: "",
  is_active: true,
  display_order: 0,
  start_date: null,
  end_date: null,
  selectedCollections: [],
  selectedProducts: [],
  voucher_code: "",
  voucher_type: "public",
  usage_limit: null,
  one_per_customer: true,
  discount_percentage: 10,
  gradient_from: "#2c3e50",
  gradient_to: "#4ca1af",
  icon_type: "dog_cat",
  custom_icons: [],
  productSettings: [],
});

export default function VouchersEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [formData, setFormData] = useState<VouchersFormData>(getDefaultFormData);

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

  const { data: existingProductData = { productIds: [], settings: [] } } = useQuery({
    queryKey: ["promotion-products", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotion_products")
        .select("product_id, variant_id, discount_type, discount_value, stock_limit, purchase_limit, is_enabled")
        .eq("promotion_id", id);
      if (error) throw error;
      
      const productIds = [...new Set(data.map((d) => d.product_id))];
      const settings: ProductDiscountSetting[] = data
        .filter(d => d.variant_id)
        .map(d => ({
          productId: d.product_id,
          variantId: d.variant_id!,
          discountType: (d.discount_type as "percentage" | "fixed_amount" | "special_price") || "percentage",
          discountValue: d.discount_value || 0,
          isEnabled: d.is_enabled ?? true,
          stockLimit: d.stock_limit ?? undefined,
          purchaseLimit: d.purchase_limit ?? undefined,
        }));
      
      return { productIds, settings };
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
        gradient_from: promotion.gradient_from || "#2c3e50",
        gradient_to: promotion.gradient_to || "#4ca1af",
        icon_type: promotion.icon_type || "dog_cat",
        custom_icons: (Array.isArray((promotion as unknown as { custom_icons?: unknown }).custom_icons) 
          ? (promotion as unknown as { custom_icons: CustomIcon[] }).custom_icons 
          : []),
      }));
    }
  }, [promotion]);

  useEffect(() => {
    if (existingCollections.length > 0 || existingProductData.productIds.length > 0) {
      setFormData((prev) => ({
        ...prev,
        selectedCollections: existingCollections,
        selectedProducts: existingProductData.productIds,
        productSettings: existingProductData.settings,
      }));
    }
  }, [existingCollections, existingProductData]);

  const saveMutation = useMutation({
    mutationFn: async (data: VouchersFormData) => {
      const payload = {
        title: data.title,
        subtitle: data.subtitle || null,
        link_type: "collection",
        link_destination: "",
        promo_type: "vouchers",
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

      // Insert product settings with variant-level discounts
      if (data.selectedProducts.length > 0) {
        // Group settings by product
        const productSettingsMap = new Map<string, ProductDiscountSetting[]>();
        data.productSettings.forEach(setting => {
          const existing = productSettingsMap.get(setting.productId) || [];
          existing.push(setting);
          productSettingsMap.set(setting.productId, existing);
        });

        const insertData = data.selectedProducts.flatMap((productId) => {
          const settings = productSettingsMap.get(productId) || [];
          if (settings.length > 0) {
            // Insert each variant setting
            return settings.map(setting => ({
              promotion_id: promotionId,
              product_id: productId,
              variant_id: setting.variantId,
              discount_type: setting.discountType,
              discount_value: setting.discountValue,
              stock_limit: setting.stockLimit ?? null,
              purchase_limit: setting.purchaseLimit ?? null,
              is_enabled: setting.isEnabled,
            }));
          } else {
            // Insert product without variant settings
            return [{
              promotion_id: promotionId,
              product_id: productId,
              variant_id: null,
              discount_type: "percentage",
              discount_value: data.discount_percentage,
              is_enabled: true,
            }];
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from("promotion_products").insert(insertData as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success(isNew ? "Voucher created" : "Voucher updated");
      navigate("/admin/promotions/vouchers");
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
    if (!formData.voucher_code.trim()) {
      toast.error("Voucher code is required");
      return;
    }
    saveMutation.mutate(formData);
  };

  const generateCode = () => {
    const code = `${formData.voucher_type.toUpperCase().slice(0, 3)}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setFormData({ ...formData, voucher_code: code });
  };

  return (
    <PromotionFormBase
      title={isNew ? "Create Voucher" : formData.title || "Edit Voucher"}
      typeLabel="Voucher"
      formData={formData}
      setFormData={(data) => setFormData((prev) => ({ ...prev, ...data }))}
      onSave={handleSave}
      isSaving={saveMutation.isPending}
      isLoading={!isNew && isLoading}
      backUrl="/admin/promotions/vouchers"
      hideAppliesTo={true}
      summaryExtra={
        <>
          <div>
            <p className="text-sm text-muted-foreground">Code</p>
            <p className="font-medium font-mono">{formData.voucher_code || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Discount</p>
            <p className="font-medium">{formData.discount_percentage}% off</p>
          </div>
        </>
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
            <h3 className="font-semibold">Voucher Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Voucher Code *</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.voucher_code}
                    onChange={(e) => setFormData({ ...formData, voucher_code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SUMMER20"
                    className="font-mono"
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-3 text-sm text-primary hover:underline"
                  >
                    Generate
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Voucher Type</Label>
                <Select
                  value={formData.voucher_type}
                  onValueChange={(value: "public" | "private" | "influencer") =>
                    setFormData({ ...formData, voucher_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="influencer">Influencer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Percentage (%)</Label>
                <Input
                  type="number"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Usage Limit</Label>
                <Input
                  type="number"
                  value={formData.usage_limit || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, usage_limit: e.target.value ? parseInt(e.target.value) : null })
                  }
                  placeholder="Unlimited"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>One Use Per Customer</Label>
                <p className="text-sm text-muted-foreground">Each customer can only use this voucher once</p>
              </div>
              <Switch
                checked={formData.one_per_customer}
                onCheckedChange={(checked) => setFormData({ ...formData, one_per_customer: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Picker */}
      <SimpleProductPicker
        selectedProductIds={formData.selectedProducts}
        onProductsChange={(productIds) => setFormData((prev) => ({ ...prev, selectedProducts: productIds }))}
        productSettings={formData.productSettings}
        onProductSettingsChange={(settings) => setFormData((prev) => ({ ...prev, productSettings: settings }))}
        discountType="percentage"
        discountValue={formData.discount_percentage}
        title="Sản phẩm áp dụng"
        showDiscountSettings={true}
      />
    </PromotionFormBase>
  );
}
