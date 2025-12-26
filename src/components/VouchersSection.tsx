import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Ticket, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useActiveVouchers, useUserSavedVouchers, useSaveVoucher } from "@/hooks/useVouchers";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface VoucherCardProps {
  voucher: {
    id: string;
    title: string;
    subtitle: string | null;
    end_date: string | null;
  };
  isSaved: boolean;
  saveCount: number;
  onSave: () => void;
  isSaving: boolean;
  isLoggedIn: boolean;
}

const VoucherCard = ({ voucher, isSaved, saveCount, onSave, isSaving, isLoggedIn }: VoucherCardProps) => {
  const navigate = useNavigate();
  
  // Parse title to extract discount info (assuming format like "Giảm 10%" or "Giảm 50k")
  const discountMatch = voucher.title.match(/(\d+)(%|k|đ)?/i);
  const discountValue = discountMatch ? discountMatch[1] : "";
  const discountUnit = discountMatch ? (discountMatch[2] || "%") : "%";
  
  // Mock usage percentage (in real app, this would come from backend)
  const usagePercent = Math.floor(Math.random() * 40) + 50; // 50-90%
  
  const handleSave = () => {
    if (!isLoggedIn) {
      navigate("/auth");
      return;
    }
    onSave();
  };

  return (
    <div className="relative bg-card rounded-lg border overflow-hidden min-w-[280px] md:min-w-[320px] flex-shrink-0">
      {/* Ticket notch design */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-r-full -ml-2" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-l-full -mr-2" />
      
      {/* Main content */}
      <div className="p-4 pl-6 pr-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Discount title */}
            <h3 className="text-lg font-bold text-destructive">
              Giảm {discountValue}{discountUnit === "%" ? "%" : "k"}
            </h3>
            
            {/* Subtitle with min order */}
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {voucher.subtitle || `Đơn Tối Thiểu 0đ`}
            </p>
            
            {/* Product badge */}
            <Badge variant="outline" className="mt-2 text-xs border-destructive/30 text-destructive">
              Sản phẩm nhất định
            </Badge>
          </div>
          
          {/* Save button and count */}
          <div className="flex flex-col items-center gap-1 ml-3">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              x{saveCount}
            </span>
            <Button
              size="sm"
              variant={isSaved ? "secondary" : "default"}
              className={isSaved ? "bg-muted" : "bg-destructive hover:bg-destructive/90"}
              onClick={handleSave}
              disabled={isSaved || isSaving}
            >
              {isSaved ? "Đã lưu" : "Lưu"}
            </Button>
          </div>
        </div>
        
        {/* Progress bar and expiry */}
        <div className="mt-3 pt-3 border-t border-dashed">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="text-destructive">Đã dùng {usagePercent}%</span>
            {voucher.end_date && (
              <span>HSD: {format(new Date(voucher.end_date), "dd.MM.yyyy")}</span>
            )}
          </div>
          <Progress 
            value={usagePercent} 
            className="h-1.5 bg-muted"
          />
        </div>
      </div>
    </div>
  );
};

export const VouchersSection = () => {
  const [userId, setUserId] = useState<string | undefined>();
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>({});
  
  const { data: vouchers, isLoading } = useActiveVouchers();
  const { data: savedVoucherIds = [] } = useUserSavedVouchers(userId);
  const saveVoucherMutation = useSaveVoucher();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
    });
  }, []);

  // Fetch save counts for all vouchers
  useEffect(() => {
    if (vouchers && vouchers.length > 0) {
      const fetchCounts = async () => {
        const counts: Record<string, number> = {};
        for (const voucher of vouchers) {
          const { count } = await supabase
            .from("user_saved_vouchers")
            .select("*", { count: "exact", head: true })
            .eq("promotion_id", voucher.id);
          counts[voucher.id] = count || 0;
        }
        setSaveCounts(counts);
      };
      fetchCounts();
    }
  }, [vouchers]);

  // Don't show if no vouchers
  if (!isLoading && (!vouchers || vouchers.length === 0)) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="py-4 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-36 w-80 rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-bold">Mã giảm giá</h2>
          </div>
          <Link
            to="/promotions"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Xem thêm
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Voucher cards - horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {vouchers?.map((voucher) => (
            <VoucherCard
              key={voucher.id}
              voucher={voucher}
              isSaved={savedVoucherIds.includes(voucher.id)}
              saveCount={saveCounts[voucher.id] || 0}
              onSave={() => userId && saveVoucherMutation.mutate({ userId, promotionId: voucher.id })}
              isSaving={saveVoucherMutation.isPending}
              isLoggedIn={!!userId}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
