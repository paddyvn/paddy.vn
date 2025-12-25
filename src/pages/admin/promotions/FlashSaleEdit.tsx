import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PromotionFormBase, BasePromotionFormData } from "@/components/admin/PromotionFormBase";
import { FlashSaleProducts, FlashSaleProduct } from "@/components/admin/FlashSaleProducts";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type FlashSaleFormData = Omit<BasePromotionFormData, 'start_date' | 'end_date' | 'selectedProducts'> & {
  show_countdown: boolean;
  urgency_message: string;
  limit_per_customer: number | null;
  sale_date: Date | null;
  start_time: string;
  end_time: string;
  flashSaleProducts: FlashSaleProduct[];
};

const getDefaultFormData = (): FlashSaleFormData => ({
  title: "",
  subtitle: "",
  is_active: true,
  display_order: 0,
  selectedCollections: [],
  show_countdown: true,
  urgency_message: "Hurry! Sale ends soon",
  limit_per_customer: null,
  sale_date: null,
  start_time: "00:00",
  end_time: "23:59",
  flashSaleProducts: [],
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
      // Parse start_date and end_date into sale_date and times
      let saleDate: Date | null = null;
      let startTime = "00:00";
      let endTime = "23:59";
      
      if (promotion.start_date) {
        const startDate = new Date(promotion.start_date);
        saleDate = startDate;
        startTime = format(startDate, "HH:mm");
      }
      if (promotion.end_date) {
        const endDate = new Date(promotion.end_date);
        endTime = format(endDate, "HH:mm");
      }
      
      setFormData((prev) => ({
        ...prev,
        title: promotion.title || "",
        subtitle: promotion.subtitle || "",
        is_active: promotion.is_active ?? true,
        display_order: promotion.display_order || 0,
        sale_date: saleDate,
        start_time: startTime,
        end_time: endTime,
      }));
    }
  }, [promotion]);

  useEffect(() => {
    if (existingCollections.length > 0) {
      setFormData((prev) => ({
        ...prev,
        selectedCollections: existingCollections,
      }));
    }
  }, [existingCollections]);

  // TODO: In a real implementation, you would also fetch flash sale product details
  // from a dedicated table that stores variant-level pricing

  const saveMutation = useMutation({
    mutationFn: async (data: FlashSaleFormData) => {
      // Combine sale_date with start_time and end_time
      let startDateTime: string | null = null;
      let endDateTime: string | null = null;
      
      if (data.sale_date) {
        const [startHour, startMin] = data.start_time.split(":").map(Number);
        const [endHour, endMin] = data.end_time.split(":").map(Number);
        
        const startDate = new Date(data.sale_date);
        startDate.setHours(startHour, startMin, 0, 0);
        startDateTime = startDate.toISOString();
        
        const endDate = new Date(data.sale_date);
        endDate.setHours(endHour, endMin, 59, 999);
        endDateTime = endDate.toISOString();
      }
      
      const payload = {
        title: data.title,
        subtitle: data.subtitle || null,
        link_type: "collection",
        link_destination: "",
        promo_type: "flash_sale",
        is_active: data.is_active,
        display_order: data.display_order,
        start_date: startDateTime,
        end_date: endDateTime,
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

      // Save product IDs from flash sale products
      const productIds = data.flashSaleProducts.map((p) => p.productId);
      if (productIds.length > 0) {
        await supabase.from("promotion_products").insert(
          productIds.map((pid) => ({ promotion_id: promotionId, product_id: pid }))
        );
      }

      // TODO: In a real implementation, also save variant-level pricing to a dedicated table
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

  // Build a BasePromotionFormData for the base component
  const baseFormData = {
    title: formData.title,
    subtitle: formData.subtitle,
    is_active: formData.is_active,
    display_order: formData.display_order,
    start_date: null as Date | null,
    end_date: null as Date | null,
    selectedCollections: formData.selectedCollections,
    selectedProducts: [] as string[],
  };

  // Build schedule summary
  const scheduleSummary = formData.sale_date
    ? `${format(formData.sale_date, "MMM d, yyyy")} • ${formData.start_time} - ${formData.end_time}`
    : "Not scheduled";

  // Count enabled variants
  const flashSaleProducts = formData.flashSaleProducts || [];
  const enabledVariants = flashSaleProducts.reduce(
    (acc, p) => acc + (p.variants || []).filter((v) => v.isEnabled).length,
    0
  );
  const totalVariants = flashSaleProducts.reduce(
    (acc, p) => acc + (p.variants || []).length,
    0
  );

  // Build applies summary
  const appliesSummary = flashSaleProducts.length > 0
    ? `${formData.flashSaleProducts.length} product(s), ${enabledVariants}/${totalVariants} variants`
    : "—";

  return (
    <PromotionFormBase
      title={isNew ? "Create Flash Sale" : formData.title || "Edit Flash Sale"}
      typeLabel="Flash Sale"
      formData={baseFormData}
      setFormData={(data) => setFormData({ 
        ...formData, 
        title: data.title,
        subtitle: data.subtitle,
        is_active: data.is_active,
        display_order: data.display_order,
        selectedCollections: data.selectedCollections,
      })}
      onSave={handleSave}
      isSaving={saveMutation.isPending}
      isLoading={!isNew && isLoading}
      backUrl="/admin/promotions/flash-sale"
      hideDatePickers
      hideAppliesTo
      scheduleSummary={scheduleSummary}
      appliesSummary={appliesSummary}
      summaryExtra={
        <div>
          <p className="text-sm text-muted-foreground">Countdown</p>
          <p className="font-medium">{formData.show_countdown ? "Enabled" : "Disabled"}</p>
        </div>
      }
    >
      {/* Flash Sale Date & Time */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Schedule</h3>
            <div className="space-y-2">
              <Label>Sale Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.sale_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.sale_date ? format(formData.sale_date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.sale_date || undefined}
                    onSelect={(date) => setFormData({ ...formData, sale_date: date || null })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flash Sale Products */}
      <FlashSaleProducts
        selectedProducts={formData.flashSaleProducts}
        onProductsChange={(products) => setFormData({ ...formData, flashSaleProducts: products })}
      />

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
