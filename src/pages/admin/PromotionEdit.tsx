import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PromotionAppliesTo } from "@/components/admin/PromotionAppliesTo";
import { Separator } from "@/components/ui/separator";

const PROMO_TYPES = [
  { value: "deal", label: "Deal" },
  { value: "flash_sale", label: "Flash Sale" },
  { value: "discounts", label: "Discounts" },
  { value: "vouchers", label: "Vouchers" },
  { value: "combo_buy", label: "Combo Buy" },
  { value: "buy_more_save_more", label: "Buy More Save More" },
  { value: "free_shipping", label: "Free Shipping" },
  { value: "subscription_deals", label: "Subscription Deals" },
  { value: "clearance", label: "Clearance" },
];

const URL_TO_DB_TYPE: Record<string, string> = {
  "flash-sale": "flash_sale",
  "discounts": "discounts",
  "vouchers": "vouchers",
  "combo-buy": "combo_buy",
  "buy-more-save-more": "buy_more_save_more",
  "free-shipping": "free_shipping",
  "subscription-deals": "subscription_deals",
  "clearance": "clearance",
};

type PromotionFormData = {
  title: string;
  subtitle: string;
  gradient_from: string;
  gradient_to: string;
  promo_type: string;
  is_active: boolean;
  display_order: number;
  start_date: Date | null;
  end_date: Date | null;
  selectedCollections: string[];
  selectedProducts: string[];
};

const getDefaultFormData = (typeFromUrl?: string): PromotionFormData => ({
  title: "",
  subtitle: "",
  gradient_from: "#8B5CF6",
  gradient_to: "#D946EF",
  promo_type: typeFromUrl ? (URL_TO_DB_TYPE[typeFromUrl] || "deal") : "deal",
  is_active: true,
  display_order: 0,
  start_date: null,
  end_date: null,
  selectedCollections: [],
  selectedProducts: [],
});

export default function PromotionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isNew = id === "new";
  const typeFromUrl = searchParams.get("type") || undefined;

  const [formData, setFormData] = useState<PromotionFormData>(() => getDefaultFormData(typeFromUrl));

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

  // Fetch existing promotion collections
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

  // Fetch existing promotion products
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
        gradient_from: promotion.gradient_from || "#8B5CF6",
        gradient_to: promotion.gradient_to || "#D946EF",
        promo_type: promotion.promo_type || "deal",
        is_active: promotion.is_active ?? true,
        display_order: promotion.display_order || 0,
        start_date: promotion.start_date ? new Date(promotion.start_date) : null,
        end_date: promotion.end_date ? new Date(promotion.end_date) : null,
      }));
    }
  }, [promotion]);

  // Update selected collections/products when data loads
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
    mutationFn: async (data: PromotionFormData) => {
      const payload = {
        title: data.title,
        subtitle: data.subtitle || null,
        link_type: "collection", // Keep for backwards compatibility
        link_destination: "", // Keep for backwards compatibility
        gradient_from: data.gradient_from || null,
        gradient_to: data.gradient_to || null,
        promo_type: data.promo_type || null,
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
        const { error } = await supabase
          .from("promotions")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      }

      // Clear existing junction records
      if (!isNew) {
        await supabase
          .from("promotion_collections")
          .delete()
          .eq("promotion_id", promotionId);
        await supabase
          .from("promotion_products")
          .delete()
          .eq("promotion_id", promotionId);
      }

      // Insert new collection relationships
      if (data.selectedCollections.length > 0) {
        const collectionRecords = data.selectedCollections.map((collectionId) => ({
          promotion_id: promotionId,
          collection_id: collectionId,
        }));
        const { error } = await supabase
          .from("promotion_collections")
          .insert(collectionRecords);
        if (error) throw error;
      }

      // Insert new product relationships
      if (data.selectedProducts.length > 0) {
        const productRecords = data.selectedProducts.map((productId) => ({
          promotion_id: promotionId,
          product_id: productId,
        }));
        const { error } = await supabase
          .from("promotion_products")
          .insert(productRecords);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success(isNew ? "Promotion created" : "Promotion updated");
      navigate("/admin/promotions");
    },
    onError: (error) => {
      toast.error("Failed to save promotion: " + error.message);
    },
  });

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    saveMutation.mutate(formData);
  };

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/promotions")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              {isNew ? "Create Promotion" : formData.title || "Edit Promotion"}
            </h1>
            <Badge variant={formData.is_active ? "default" : "secondary"}>
              {formData.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/promotions")}>
            Discard
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Settings Card */}
          <Card>
            <CardContent className="p-6 space-y-0">
              {/* Content Section */}
              <div className="space-y-4">
                <h3 className="font-semibold">Content</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Summer Sale"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="e.g., Up to 50% off"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.start_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.start_date ? format(formData.start_date, "PPP") : "No start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.start_date || undefined}
                          onSelect={(date) => setFormData({ ...formData, start_date: date || null })}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.end_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.end_date ? format(formData.end_date, "PPP") : "No end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.end_date || undefined}
                          onSelect={(date) => setFormData({ ...formData, end_date: date || null })}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
            </CardContent>
          </Card>

          {/* Applies To Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Applies To</CardTitle>
              <CardDescription>
                Select which collections or products this promotion applies to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromotionAppliesTo
                selectedCollections={formData.selectedCollections}
                selectedProducts={formData.selectedProducts}
                onCollectionsChange={(ids) =>
                  setFormData({ ...formData, selectedCollections: ids })
                }
                onProductsChange={(ids) =>
                  setFormData({ ...formData, selectedProducts: ids })
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Summary */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <p className="text-sm font-medium text-muted-foreground">
                {formData.title || "No title yet"}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type */}
              <div>
                <p className="text-sm font-semibold mb-1">Type</p>
                <p className="text-sm text-muted-foreground">
                  {PROMO_TYPES.find((t) => t.value === formData.promo_type)?.label || "Deal"}
                </p>
              </div>

              {/* Details */}
              <div>
                <p className="text-sm font-semibold mb-2">Details</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    {formData.selectedCollections.length + formData.selectedProducts.length === 0
                      ? "No products/collections selected"
                      : `${formData.selectedCollections.length} collection(s), ${formData.selectedProducts.length} product(s)`}
                  </li>
                  <li>
                    {formData.start_date
                      ? `Starts ${format(formData.start_date, "MMM d, yyyy")}`
                      : "No start date"}
                  </li>
                  <li>
                    {formData.end_date
                      ? `Ends ${format(formData.end_date, "MMM d, yyyy")}`
                      : "No end date"}
                  </li>
                  <li>{formData.is_active ? "Active" : "Inactive"}</li>
                </ul>
              </div>

              {/* Preview */}
              <div>
                <p className="text-sm font-semibold mb-2">Preview</p>
                <div
                  className="rounded-lg p-4 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${formData.gradient_from}, ${formData.gradient_to})`,
                  }}
                >
                  <p className="font-semibold text-sm">{formData.title || "Title"}</p>
                  {formData.subtitle && (
                    <p className="text-xs opacity-90 mt-0.5">{formData.subtitle}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
