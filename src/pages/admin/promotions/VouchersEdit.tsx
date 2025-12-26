import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PromotionFormBase, BasePromotionFormData } from "@/components/admin/PromotionFormBase";
import { DealCardAppearanceCard, CustomIcon } from "@/components/admin/DealCardAppearanceCard";
import { SimpleProductPicker, ProductDiscountSetting } from "@/components/admin/SimpleProductPicker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type VoucherType = "shop_wide" | "product" | "private" | "livestream" | "video" | "new_customer" | "returning_customer";
type DiscountType = "percentage" | "fixed_amount";
type DisplayVisibility = "public" | "private";

type VouchersFormData = BasePromotionFormData & {
  voucher_code: string;
  voucher_type: VoucherType;
  usage_limit: number | null;
  usage_limit_per_customer: number | null;
  min_order_value: number | null;
  discount_type: DiscountType;
  discount_value: number;
  gradient_from: string;
  gradient_to: string;
  icon_type: string;
  custom_icons: CustomIcon[];
  productSettings: ProductDiscountSetting[];
  applies_to_all_products: boolean;
  allow_save_before_usage: boolean;
  save_start_date: Date | null;
  display_visibility: DisplayVisibility;
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
  voucher_type: "shop_wide",
  usage_limit: null,
  usage_limit_per_customer: 1,
  min_order_value: null,
  discount_type: "percentage",
  discount_value: 10,
  gradient_from: "#2c3e50",
  gradient_to: "#4ca1af",
  icon_type: "dog_cat",
  custom_icons: [],
  productSettings: [],
  applies_to_all_products: true,
  allow_save_before_usage: false,
  save_start_date: null,
  display_visibility: "public",
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
              discount_type: data.discount_type,
              discount_value: data.discount_value,
              stock_limit: null,
              purchase_limit: null,
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
      appliesSummary={formData.voucher_type === "shop_wide" 
        ? "Tất cả sản phẩm" 
        : formData.applies_to_all_products 
          ? "Tất cả sản phẩm" 
          : `${formData.selectedProducts.length} sản phẩm`}
      summaryExtra={
        <>
          <div>
            <p className="text-sm text-muted-foreground">Code</p>
            <p className="font-medium font-mono">{formData.voucher_code || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Discount</p>
            <p className="font-medium">
              {formData.discount_type === "percentage" 
                ? `${formData.discount_value}% off` 
                : `${formData.discount_value.toLocaleString()}đ off`}
            </p>
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
      afterDatePickers={
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-start gap-2">
            <Checkbox
              id="allow-save"
              checked={formData.allow_save_before_usage}
              onCheckedChange={(checked) => setFormData((prev) => ({ 
                ...prev, 
                allow_save_before_usage: checked === true,
                save_start_date: checked ? prev.save_start_date : null 
              }))}
            />
            <div className="space-y-1">
              <Label htmlFor="allow-save" className="cursor-pointer">
                Cho phép lưu mã trước Thời gian sử dụng
              </Label>
            </div>
          </div>
          
          {formData.allow_save_before_usage && (
            <div className="ml-6 space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.save_start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.save_start_date ? format(formData.save_start_date, "HH:mm dd-MM-yyyy") : "Chọn thời gian"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.save_start_date || undefined}
                    onSelect={(date) => {
                      if (date) {
                        const existing = formData.save_start_date;
                        if (existing) {
                          date.setHours(existing.getHours(), existing.getMinutes(), existing.getSeconds());
                        }
                      }
                      setFormData((prev) => ({ ...prev, save_start_date: date || null }));
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                  <div className="border-t p-3">
                    <Label className="text-xs text-muted-foreground">Time</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="time"
                        value={formData.save_start_date ? format(formData.save_start_date, "HH:mm") : ""}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(":").map(Number);
                          const newDate = formData.save_start_date ? new Date(formData.save_start_date) : new Date();
                          newDate.setHours(hours || 0, minutes || 0, 0);
                          setFormData((prev) => ({ ...prev, save_start_date: newDate }));
                        }}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Khi voucher có hiệu lực sử dụng, mục này sẽ không được chỉnh sửa
              </p>
            </div>
          )}
        </div>
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
                <Label>Loại Voucher</Label>
                <Select
                  value={formData.voucher_type}
                  onValueChange={(value: VoucherType) =>
                    setFormData({ ...formData, voucher_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shop_wide">Voucher toàn Shop</SelectItem>
                    <SelectItem value="product">Voucher sản phẩm</SelectItem>
                    <SelectItem value="private">Voucher riêng tư</SelectItem>
                    <SelectItem value="livestream">Voucher Livestream</SelectItem>
                    <SelectItem value="video">Voucher Video</SelectItem>
                    <SelectItem value="new_customer">Voucher Khách hàng mới</SelectItem>
                    <SelectItem value="returning_customer">Voucher Khách hàng mua lại</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại giảm giá | Mức giảm</Label>
                <div className="flex">
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: DiscountType) => setFormData({ ...formData, discount_type: value })}
                  >
                    <SelectTrigger className="w-[140px] rounded-r-none border-r-0 focus:ring-0 focus:ring-offset-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Theo phần trăm</SelectItem>
                      <SelectItem value="fixed_amount">Theo số tiền</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    className="rounded-none flex-1"
                  />
                  <div className="flex items-center justify-center px-3 border rounded-r-md bg-muted text-muted-foreground text-sm">
                    {formData.discount_type === "percentage" ? "%" : "đ"}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tổng lượt sử dụng tối đa</Label>
                <Input
                  type="number"
                  value={formData.usage_limit || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, usage_limit: e.target.value ? parseInt(e.target.value) : null })
                  }
                  placeholder="Không giới hạn"
                />
                <p className="text-xs text-muted-foreground">Tổng số Mã giảm giá có thể sử dụng</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giá trị đơn hàng tối thiểu</Label>
                <div className="flex">
                  <Input
                    type="number"
                    value={formData.min_order_value || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, min_order_value: e.target.value ? parseFloat(e.target.value) : null })
                    }
                    placeholder="Không yêu cầu"
                    className="rounded-r-none"
                  />
                  <div className="flex items-center justify-center px-3 border border-l-0 rounded-r-md bg-muted text-muted-foreground text-sm">
                    đ
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Lượt sử dụng tối đa/Người mua</Label>
                <Input
                  type="number"
                  value={formData.usage_limit_per_customer || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, usage_limit_per_customer: e.target.value ? parseInt(e.target.value) : null })
                  }
                  placeholder="1"
                />
              </div>
            </div>

            {/* Display visibility options */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-start gap-6">
                <Label className="text-muted-foreground pt-1 min-w-[120px]">Thiết lập hiển thị</Label>
                <RadioGroup
                  value={formData.display_visibility}
                  onValueChange={(value: DisplayVisibility) => setFormData({ ...formData, display_visibility: value })}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="visibility-public" />
                    <Label htmlFor="visibility-public" className="cursor-pointer font-normal">
                      Hiển thị nhiều nơi
                    </Label>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="visibility-private" />
                      <Label htmlFor="visibility-private" className="cursor-pointer font-normal">
                        Không công khai
                      </Label>
                    </div>
                    {formData.display_visibility === "private" && (
                      <p className="text-xs text-muted-foreground ml-6">
                        Mã giảm giá của bạn sẽ không được công khai, bạn có thể chia sẻ mã giảm giá với người dùng khác
                      </p>
                    )}
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Picker - conditional based on voucher type */}
      {formData.voucher_type === "shop_wide" ? (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Sản phẩm áp dụng</h3>
            <p className="text-muted-foreground">
              Tất cả sản phẩm - Voucher áp dụng cho toàn bộ sản phẩm trong Shop
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Sản phẩm áp dụng</h3>
                <p className="text-sm text-muted-foreground">
                  {formData.voucher_type === "private" && "Voucher riêng tư"}
                  {formData.voucher_type === "livestream" && "Voucher Livestream"}
                  {formData.voucher_type === "video" && "Voucher Video"}
                  {formData.voucher_type === "new_customer" && "Voucher Khách hàng mới"}
                  {formData.voucher_type === "returning_customer" && "Voucher Khách hàng mua lại"}
                  {formData.voucher_type === "product" && "Voucher sản phẩm"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="applies-all" className="text-sm">Tất cả sản phẩm</Label>
                <Switch
                  id="applies-all"
                  checked={formData.applies_to_all_products}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, applies_to_all_products: checked }))}
                />
              </div>
            </div>
            
            {!formData.applies_to_all_products && (
              <SimpleProductPicker
                selectedProductIds={formData.selectedProducts}
                onProductsChange={(productIds) => setFormData((prev) => ({ ...prev, selectedProducts: productIds }))}
                productSettings={formData.productSettings}
                onProductSettingsChange={(settings) => setFormData((prev) => ({ ...prev, productSettings: settings }))}
                discountType={formData.discount_type}
                discountValue={formData.discount_value}
                title=""
                showDiscountSettings={false}
              />
            )}
          </CardContent>
        </Card>
      )}
    </PromotionFormBase>
  );
}
