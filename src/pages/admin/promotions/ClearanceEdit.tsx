import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PromotionFormBase, BasePromotionFormData } from "@/components/admin/PromotionFormBase";
import { DealCardAppearanceCard, CustomIcon } from "@/components/admin/DealCardAppearanceCard";

type ClearanceFormData = BasePromotionFormData & {
  show_original_price: boolean;
  final_sale: boolean;
  gradient_from: string;
  gradient_to: string;
  icon_type: string;
  custom_icons: CustomIcon[];
};

const getDefaultFormData = (): ClearanceFormData => ({
  title: "",
  subtitle: "",
  is_active: true,
  display_order: 0,
  start_date: null,
  end_date: null,
  selectedCollections: [],
  selectedProducts: [],
  show_original_price: true,
  final_sale: false,
  gradient_from: "#f093fb",
  gradient_to: "#f5576c",
  icon_type: "dog_cat",
  custom_icons: [],
});

export default function ClearanceEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [formData, setFormData] = useState<ClearanceFormData>(getDefaultFormData);

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
        gradient_from: promotion.gradient_from || "#f093fb",
        gradient_to: promotion.gradient_to || "#f5576c",
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
    mutationFn: async (data: ClearanceFormData) => {
      const payload = {
        title: data.title,
        subtitle: data.subtitle || null,
        link_type: "collection",
        link_destination: "",
        promo_type: "clearance",
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
      toast.success(isNew ? "Clearance promotion created" : "Clearance promotion updated");
      navigate("/admin/promotions/clearance");
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
      title={isNew ? "Create Clearance" : formData.title || "Edit Clearance"}
      typeLabel="Clearance"
      formData={formData}
      setFormData={(data) => setFormData((prev) => ({ ...prev, ...data }))}
      onSave={handleSave}
      isSaving={saveMutation.isPending}
      isLoading={!isNew && isLoading}
      backUrl="/admin/promotions/clearance"
      summaryExtra={
        <div>
          <p className="text-sm text-muted-foreground">Final Sale</p>
          <p className="font-medium">{formData.final_sale ? "Yes (no returns)" : "No"}</p>
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
            <h3 className="font-semibold">Clearance Settings</h3>
            <div className="flex items-center justify-between">
              <div>
                <Label>Show Original Price</Label>
                <p className="text-sm text-muted-foreground">Display strikethrough original price</p>
              </div>
              <Switch
                checked={formData.show_original_price}
                onCheckedChange={(checked) => setFormData({ ...formData, show_original_price: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Final Sale</Label>
                <p className="text-sm text-muted-foreground">Mark items as final sale (no returns/exchanges)</p>
              </div>
              <Switch
                checked={formData.final_sale}
                onCheckedChange={(checked) => setFormData({ ...formData, final_sale: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </PromotionFormBase>
  );
}
