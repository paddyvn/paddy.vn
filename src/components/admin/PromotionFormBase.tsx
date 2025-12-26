import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { PromotionAppliesTo } from "./PromotionAppliesTo";

export type BasePromotionFormData = {
  title: string;
  subtitle: string;
  is_active: boolean;
  display_order: number;
  start_date: Date | null;
  end_date: Date | null;
  selectedCollections: string[];
  selectedProducts: string[];
};

type PromotionFormBaseProps = {
  title: string;
  typeLabel: string;
  formData: BasePromotionFormData;
  setFormData: (data: BasePromotionFormData) => void;
  onSave: () => void;
  isSaving: boolean;
  isLoading?: boolean;
  backUrl: string;
  children?: ReactNode; // Type-specific form fields
  summaryExtra?: ReactNode; // Extra summary info
  rightColumnExtra?: ReactNode; // Extra content for right column (below Status card)
  hideDatePickers?: boolean; // Hide default date pickers (for custom date/time UI)
  hideAppliesTo?: boolean; // Hide default applies to section
  scheduleSummary?: string; // Custom schedule summary text
  appliesSummary?: string; // Custom applies to summary text
  afterDatePickers?: ReactNode; // Content to render after date pickers
};

export function PromotionFormBase({
  title,
  typeLabel,
  formData,
  setFormData,
  onSave,
  isSaving,
  isLoading,
  backUrl,
  children,
  summaryExtra,
  rightColumnExtra,
  hideDatePickers,
  hideAppliesTo,
  scheduleSummary,
  appliesSummary,
  afterDatePickers,
}: PromotionFormBaseProps) {
  const navigate = useNavigate();

  if (isLoading) {
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
          <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <Badge variant="outline">{typeLabel}</Badge>
            <Badge variant={formData.is_active ? "default" : "secondary"}>
              {formData.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(backUrl)}>
            Discard
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left Panel - Main Settings (7/10) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Base Fields Card */}
          <Card>
            <CardContent className="p-6">
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
                  {!hideDatePickers && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date & Time</Label>
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
                              {formData.start_date ? format(formData.start_date, "PPP HH:mm") : "No start date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.start_date || undefined}
                              onSelect={(date) => {
                                if (date) {
                                  const existing = formData.start_date;
                                  if (existing) {
                                    date.setHours(existing.getHours(), existing.getMinutes(), existing.getSeconds());
                                  }
                                }
                                setFormData({ ...formData, start_date: date || null });
                              }}
                              initialFocus
                              className="pointer-events-auto"
                            />
                            <div className="border-t p-3">
                              <Label className="text-xs text-muted-foreground">Time</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Input
                                  type="time"
                                  step="1"
                                  value={formData.start_date ? format(formData.start_date, "HH:mm:ss") : ""}
                                  onChange={(e) => {
                                    const [hours, minutes, seconds] = e.target.value.split(":").map(Number);
                                    const newDate = formData.start_date ? new Date(formData.start_date) : new Date();
                                    newDate.setHours(hours || 0, minutes || 0, seconds || 0);
                                    setFormData({ ...formData, start_date: newDate });
                                  }}
                                  className="flex-1"
                                />
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>End Date & Time</Label>
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
                              {formData.end_date ? format(formData.end_date, "PPP HH:mm") : "No end date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.end_date || undefined}
                              onSelect={(date) => {
                                if (date) {
                                  const existing = formData.end_date;
                                  if (existing) {
                                    date.setHours(existing.getHours(), existing.getMinutes(), existing.getSeconds());
                                  }
                                }
                                setFormData({ ...formData, end_date: date || null });
                              }}
                              initialFocus
                              className="pointer-events-auto"
                            />
                            <div className="border-t p-3">
                              <Label className="text-xs text-muted-foreground">Time</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Input
                                  type="time"
                                  step="1"
                                  value={formData.end_date ? format(formData.end_date, "HH:mm:ss") : ""}
                                  onChange={(e) => {
                                    const [hours, minutes, seconds] = e.target.value.split(":").map(Number);
                                    const newDate = formData.end_date ? new Date(formData.end_date) : new Date();
                                    newDate.setHours(hours || 0, minutes || 0, seconds || 0);
                                    setFormData({ ...formData, end_date: newDate });
                                  }}
                                  className="flex-1"
                                />
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                  {afterDatePickers}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Type-specific fields */}
          {children}

          {/* Applies To Card */}
          {!hideAppliesTo && (
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
                  onCollectionsChange={(ids) => setFormData({ ...formData, selectedCollections: ids })}
                  onProductsChange={(ids) => setFormData({ ...formData, selectedProducts: ids })}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Summary (3/10) */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="font-medium">{formData.title || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{typeLabel}</p>
              </div>
              {summaryExtra}
              <div>
                <p className="text-sm text-muted-foreground">Applies to</p>
                <p className="font-medium">
                  {appliesSummary ? (
                    appliesSummary
                  ) : (
                    <>
                      {formData.selectedCollections.length > 0 && `${formData.selectedCollections.length} collection(s)`}
                      {formData.selectedCollections.length > 0 && formData.selectedProducts.length > 0 && ", "}
                      {formData.selectedProducts.length > 0 && `${formData.selectedProducts.length} product(s)`}
                      {formData.selectedCollections.length === 0 && formData.selectedProducts.length === 0 && "—"}
                    </>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Schedule</p>
                <p className="font-medium">
                  {scheduleSummary ? (
                    scheduleSummary
                  ) : formData.start_date || formData.end_date ? (
                    <>
                      {formData.start_date && format(formData.start_date, "MMM d, yyyy")}
                      {formData.start_date && formData.end_date && " — "}
                      {formData.end_date && format(formData.end_date, "MMM d, yyyy")}
                    </>
                  ) : (
                    "Always active"
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status</CardTitle>
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

          {rightColumnExtra}
        </div>
      </div>
    </div>
  );
}
