import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Crown, Gift, Check, Lock, Loader2 } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface RewardsSectionProps {
  userId: string;
  profileName?: string | null;
}

interface TierBenefit {
  id: string;
  tier: string;
  tier_order: number;
  display_name: string;
  min_spent: number;
  tier_color: string;
  upgrade_voucher_amount: number;
  freeship_max: number;
  freeship_min_order: number;
  birthday_discount_pct: number;
  birthday_discount_orders: number;
  promotion_notifications: boolean;
  product_samples: boolean;
}

interface LoyaltyPoints {
  user_id: string;
  total_spent: number;
  tier: string;
  points_balance: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
}

const formatVND = (amount: number) => {
  if (amount >= 1000000) return `${amount / 1000000}tr`;
  if (amount >= 1000) return `${amount / 1000}k`;
  return `${amount}`;
};

export const RewardsSection = ({ userId, profileName }: RewardsSectionProps) => {
  const navigate = useNavigate();

  const { data: loyalty, isLoading: loyaltyLoading } = useQuery({
    queryKey: ["loyalty-points", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as LoyaltyPoints | null;
    },
  });

  const { data: tiers } = useQuery({
    queryKey: ["loyalty-tier-benefits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_tier_benefits")
        .select("*")
        .order("tier_order");
      if (error) throw error;
      return data as TierBenefit[];
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ["loyalty-transactions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  if (loyaltyLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentTier = tiers?.find(t => t.tier === (loyalty?.tier || "paddier"));
  const nextTier = tiers?.find(t => t.tier_order === (currentTier?.tier_order || 0) + 1);
  const isMaxTier = !nextTier;

  const totalSpent = loyalty?.total_spent || 0;
  const progress = nextTier && currentTier
    ? Math.min(100, ((totalSpent - currentTier.min_spent) / (nextTier.min_spent - currentTier.min_spent)) * 100)
    : 100;
  const remaining = nextTier ? nextTier.min_spent - totalSpent : 0;

  // Build benefits list for current tier
  const currentBenefits: { label: string; available: boolean; unlockTier?: string }[] = [];
  if (currentTier) {
    currentBenefits.push({ label: "Nhận thông báo ưu đãi mới", available: true });
    currentBenefits.push({ label: "Nhận mẫu thử sản phẩm mới", available: true });

    // Voucher
    if (currentTier.upgrade_voucher_amount > 0) {
      currentBenefits.push({ label: `Voucher thăng hạng ${formatVND(currentTier.upgrade_voucher_amount)}`, available: true });
    } else {
      const voucherTier = tiers?.find(t => t.upgrade_voucher_amount > 0);
      if (voucherTier) currentBenefits.push({ label: `Voucher thăng hạng`, available: false, unlockTier: voucherTier.display_name });
    }

    // Freeship
    if (currentTier.freeship_max > 0) {
      const freeshipLabel = currentTier.freeship_min_order > 0
        ? `Freeship tối đa ${formatVND(currentTier.freeship_max)} (đơn từ ${formatVND(currentTier.freeship_min_order)})`
        : `Freeship tối đa ${formatVND(currentTier.freeship_max)} (tất cả đơn hàng)`;
      currentBenefits.push({ label: freeshipLabel, available: true });
    } else {
      const freeshipTier = tiers?.find(t => t.freeship_max > 0);
      if (freeshipTier) currentBenefits.push({ label: "Miễn phí vận chuyển", available: false, unlockTier: freeshipTier.display_name });
    }

    // Birthday
    if (currentTier.birthday_discount_pct > 0) {
      currentBenefits.push({
        label: `Ưu đãi sinh nhật ${currentTier.birthday_discount_pct}% (${currentTier.birthday_discount_orders} đơn hàng)`,
        available: true,
      });
    } else {
      const bdTier = tiers?.find(t => t.birthday_discount_pct > 0);
      if (bdTier) currentBenefits.push({ label: "Ưu đãi sinh nhật", available: false, unlockTier: bdTier.display_name });
    }
  }

  return (
    <div className="space-y-6">
      {/* Section A: Member Card */}
      <Card
        className="overflow-hidden border-0 shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${currentTier?.tier_color || '#FFF9DB'}22, ${currentTier?.tier_color || '#FFF9DB'}44)`,
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center shadow-md"
                style={{ backgroundColor: currentTier?.tier_color || '#FFF9DB' }}
              >
                <Crown className="h-7 w-7 text-foreground/80" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    className="text-sm font-bold px-3 py-1 border-0"
                    style={{
                      backgroundColor: currentTier?.tier_color || '#FFF9DB',
                      color: '#1a1a1a',
                    }}
                  >
                    {currentTier?.display_name || 'Paddier'} Member
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{profileName || 'Thành viên'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tổng chi tiêu</span>
              <span className="font-bold">{formatPrice(totalSpent)}₫</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Điểm tích lũy</span>
              <span className="font-bold text-primary">{(loyalty?.points_balance || 0).toLocaleString()} điểm</span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <Progress value={progress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {isMaxTier
                  ? "🎉 Bạn đã đạt hạng cao nhất!"
                  : `Còn ${formatPrice(remaining)}₫ để lên ${nextTier?.display_name}`}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-foreground/10">
            <div className="text-center">
              <p className="text-lg font-bold">{(loyalty?.lifetime_earned || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Đã tích lũy</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{(loyalty?.lifetime_redeemed || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Đã sử dụng</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{(loyalty?.points_balance || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Hiện có</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section B: Current Benefits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quyền lợi hiện tại</CardTitle>
          <CardDescription>Quyền lợi dành cho hạng {currentTier?.display_name || 'Paddier'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentBenefits.map((benefit, i) => (
              <div key={i} className={cn("flex items-center gap-3 text-sm", !benefit.available && "opacity-50")}>
                {benefit.available ? (
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
                <span>{benefit.label}</span>
                {!benefit.available && benefit.unlockTier && (
                  <Badge variant="outline" className="text-[10px] ml-auto">
                    Mở khóa ở hạng {benefit.unlockTier}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section C: Tier Comparison Table */}
      {tiers && tiers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Bảng xếp hạng thành viên</CardTitle>
            <CardDescription>So sánh quyền lợi các hạng thành viên Paddy</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <div className="min-w-[600px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary/10">
                      <th className="text-left p-3 font-semibold text-foreground min-w-[160px]">Quyền lợi</th>
                      {tiers.map(tier => (
                        <th
                          key={tier.tier}
                          className={cn(
                            "p-3 text-center min-w-[90px]",
                            tier.tier === (loyalty?.tier || "paddier") && "bg-primary/20"
                          )}
                        >
                          <Badge
                            className="text-[10px] font-bold border-0 mb-1"
                            style={{ backgroundColor: tier.tier_color, color: '#1a1a1a' }}
                          >
                            {tier.display_name}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {tier.min_spent > 0 ? `từ ${formatVND(tier.min_spent)}` : 'Mặc định'}
                          </p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Row 1: Notifications */}
                    <tr className="border-b">
                      <td className="p-3 text-muted-foreground">Thông báo ưu đãi</td>
                      {tiers.map(tier => (
                        <td key={tier.tier} className={cn("p-3 text-center", tier.tier === (loyalty?.tier || "paddier") && "bg-primary/5")}>
                          <span className="text-primary text-lg">🐾</span>
                        </td>
                      ))}
                    </tr>
                    {/* Row 2: Product samples */}
                    <tr className="border-b">
                      <td className="p-3 text-muted-foreground">Mẫu thử sản phẩm</td>
                      {tiers.map(tier => (
                        <td key={tier.tier} className={cn("p-3 text-center", tier.tier === (loyalty?.tier || "paddier") && "bg-primary/5")}>
                          <span className="text-primary text-lg">🐾</span>
                        </td>
                      ))}
                    </tr>
                    {/* Row 3: Upgrade voucher */}
                    <tr className="border-b">
                      <td className="p-3 text-muted-foreground">Voucher thăng hạng</td>
                      {tiers.map(tier => (
                        <td key={tier.tier} className={cn("p-3 text-center font-medium", tier.tier === (loyalty?.tier || "paddier") && "bg-primary/5")}>
                          {tier.upgrade_voucher_amount > 0 ? formatVND(tier.upgrade_voucher_amount) : '—'}
                        </td>
                      ))}
                    </tr>
                    {/* Row 4: Freeship */}
                    <tr className="border-b">
                      <td className="p-3 text-muted-foreground">Miễn phí vận chuyển</td>
                      {tiers.map(tier => (
                        <td key={tier.tier} className={cn("p-3 text-center text-xs", tier.tier === (loyalty?.tier || "paddier") && "bg-primary/5")}>
                          {tier.freeship_max > 0 ? (
                            <div>
                              <p className="font-medium">Tối đa {formatVND(tier.freeship_max)}</p>
                              <p className="text-muted-foreground">
                                {tier.freeship_min_order > 0 ? `Đơn từ ${formatVND(tier.freeship_min_order)}` : 'Tất cả đơn'}
                              </p>
                            </div>
                          ) : '—'}
                        </td>
                      ))}
                    </tr>
                    {/* Row 5: Birthday discount */}
                    <tr>
                      <td className="p-3 text-muted-foreground">Ưu đãi sinh nhật</td>
                      {tiers.map(tier => (
                        <td key={tier.tier} className={cn("p-3 text-center text-xs", tier.tier === (loyalty?.tier || "paddier") && "bg-primary/5")}>
                          {tier.birthday_discount_pct > 0 ? (
                            <div>
                              <p className="font-medium">{tier.birthday_discount_pct}%</p>
                              <p className="text-muted-foreground">{tier.birthday_discount_orders} đơn</p>
                            </div>
                          ) : '—'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Section D: Transaction History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Lịch sử điểm thưởng</CardTitle>
          <CardDescription>Theo dõi điểm tích lũy và sử dụng</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                      tx.points > 0 ? "bg-primary/10" : "bg-destructive/10"
                    )}>
                      <Gift className={cn("h-4 w-4", tx.points > 0 ? "text-primary" : "text-destructive")} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description || tx.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={tx.points > 0 ? "default" : "destructive"} className="font-mono">
                    {tx.points > 0 ? `+${tx.points}` : tx.points}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có giao dịch nào</p>
              <p className="text-sm mb-4">Mua sắm để tích lũy điểm thưởng</p>
              <Button onClick={() => navigate("/")} size="sm">
                Mua sắm ngay
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
