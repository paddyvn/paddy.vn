import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CollectionSelectorPopover } from "@/components/admin/CollectionSelectorPopover";

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
  link_type: string;
  link_destination: string;
  gradient_from: string;
  gradient_to: string;
  promo_type: string;
  is_active: boolean;
  display_order: number;
  start_date: Date | null;
  end_date: Date | null;
};

const getDefaultFormData = (typeFromUrl?: string): PromotionFormData => ({
  title: "",
  subtitle: "",
  link_type: "collection",
  link_destination: "",
  gradient_from: "#8B5CF6",
  gradient_to: "#D946EF",
  promo_type: typeFromUrl ? (URL_TO_DB_TYPE[typeFromUrl] || "deal") : "deal",
  is_active: true,
  display_order: 0,
  start_date: null,
  end_date: null,
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

  useEffect(() => {
    if (promotion) {
      setFormData({
        title: promotion.title || "",
        subtitle: promotion.subtitle || "",
        link_type: promotion.link_type || "collection",
        link_destination: promotion.link_destination || "",
        gradient_from: promotion.gradient_from || "#8B5CF6",
        gradient_to: promotion.gradient_to || "#D946EF",
        promo_type: promotion.promo_type || "deal",
        is_active: promotion.is_active ?? true,
        display_order: promotion.display_order || 0,
        start_date: promotion.start_date ? new Date(promotion.start_date) : null,
        end_date: promotion.end_date ? new Date(promotion.end_date) : null,
      });
    }
  }, [promotion]);

  const saveMutation = useMutation({
    mutationFn: async (data: PromotionFormData) => {
      const payload = {
        title: data.title,
        subtitle: data.subtitle || null,
        link_type: data.link_type,
        link_destination: data.link_destination,
        gradient_from: data.gradient_from || null,
        gradient_to: data.gradient_to || null,
        promo_type: data.promo_type || null,
        is_active: data.is_active,
        display_order: data.display_order,
        start_date: data.start_date?.toISOString() || null,
        end_date: data.end_date?.toISOString() || null,
      };

      if (isNew) {
        const { error } = await supabase.from("promotions").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("promotions")
          .update(payload)
          .eq("id", id);
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
    if (!formData.link_destination.trim()) {
      toast.error("Link destination is required");
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
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Card */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* Link Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Link Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Link Type</Label>
                <Select
                  value={formData.link_type}
                  onValueChange={(value) => setFormData({ ...formData, link_type: value, link_destination: "" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collection">Collection</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="page">Page</SelectItem>
                    <SelectItem value="custom">Custom URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Link Destination *</Label>
                {formData.link_type === "collection" ? (
                  <CollectionSelectorPopover
                    currentLink={formData.link_destination}
                    onSelect={(link) => setFormData({ ...formData, link_destination: link })}
                  />
                ) : (
                  <Input
                    value={formData.link_destination}
                    onChange={(e) => setFormData({ ...formData, link_destination: e.target.value })}
                    placeholder={
                      formData.link_type === "product"
                        ? "/products/product-slug"
                        : formData.link_type === "page"
                        ? "/pages/page-slug"
                        : "https://example.com"
                    }
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl p-6 text-white"
                style={{
                  background: `linear-gradient(135deg, ${formData.gradient_from}, ${formData.gradient_to})`,
                }}
              >
                <h3 className="text-xl font-bold">{formData.title || "Promotion Title"}</h3>
                {formData.subtitle && <p className="text-sm opacity-90 mt-1">{formData.subtitle}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule Card */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

          {/* Styling Card */}
          <Card>
            <CardHeader>
              <CardTitle>Styling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Promo Type</Label>
                <Select
                  value={formData.promo_type}
                  onValueChange={(value) => setFormData({ ...formData, promo_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMO_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradient_from">Gradient From</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.gradient_from}
                    onChange={(e) => setFormData({ ...formData, gradient_from: e.target.value })}
                    className="h-10 w-10 rounded border cursor-pointer"
                  />
                  <Input
                    id="gradient_from"
                    value={formData.gradient_from}
                    onChange={(e) => setFormData({ ...formData, gradient_from: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradient_to">Gradient To</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.gradient_to}
                    onChange={(e) => setFormData({ ...formData, gradient_to: e.target.value })}
                    className="h-10 w-10 rounded border cursor-pointer"
                  />
                  <Input
                    id="gradient_to"
                    value={formData.gradient_to}
                    onChange={(e) => setFormData({ ...formData, gradient_to: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
