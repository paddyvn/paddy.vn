import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, cn } from "@/lib/utils";
import { Crown, Search, Plus, Minus, Users, Loader2, Save } from "lucide-react";

interface LoyaltyMember {
  user_id: string;
  total_spent: number;
  tier: string;
  points_balance: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
  profiles: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
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
}

export default function LoyaltyManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [adjustDialog, setAdjustDialog] = useState<LoyaltyMember | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [editingTiers, setEditingTiers] = useState<Record<string, Partial<TierBenefit>>>({});

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["admin-loyalty-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_points")
        .select("*, profiles(full_name, email, phone, avatar_url)")
        .order("total_spent", { ascending: false });
      if (error) throw error;
      return data as unknown as LoyaltyMember[];
    },
  });

  const { data: tiers, isLoading: tiersLoading } = useQuery({
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

  const adjustPointsMutation = useMutation({
    mutationFn: async ({ userId, points, description }: { userId: string; points: number; description: string }) => {
      // Insert transaction
      const { error: txError } = await supabase.from("loyalty_transactions").insert({
        user_id: userId,
        points,
        type: "admin_adjust",
        description,
      });
      if (txError) throw txError;

      // Update balance
      const member = members?.find(m => m.user_id === userId);
      if (member) {
        const { error: updateError } = await supabase
          .from("loyalty_points")
          .update({
            lifetime_redeemed: points < 0
              ? (member.lifetime_redeemed || 0) + Math.abs(points)
              : member.lifetime_redeemed,
            lifetime_earned: points > 0
              ? (member.lifetime_earned || 0) + points
              : member.lifetime_earned,
          })
          .eq("user_id", userId);
        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-loyalty-members"] });
      setAdjustDialog(null);
      setAdjustAmount("");
      setAdjustDescription("");
      toast({ title: "Đã điều chỉnh điểm thành công" });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể điều chỉnh điểm.", variant: "destructive" });
    },
  });

  const updateTierMutation = useMutation({
    mutationFn: async ({ tier, updates }: { tier: string; updates: Partial<TierBenefit> }) => {
      const { error } = await supabase
        .from("loyalty_tier_benefits")
        .update(updates)
        .eq("tier", tier);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-tier-benefits"] });
      setEditingTiers({});
      toast({ title: "Đã cập nhật quyền lợi hạng thành viên" });
    },
  });

  const filteredMembers = members?.filter(m => {
    const matchesTier = tierFilter === "all" || m.tier === tierFilter;
    const matchesSearch = !search || [
      m.profiles?.full_name,
      m.profiles?.email,
      m.profiles?.phone,
    ].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    return matchesTier && matchesSearch;
  });

  const tierCounts = members?.reduce((acc, m) => {
    acc[m.tier] = (acc[m.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Quản lý thành viên</h2>
        <p className="text-muted-foreground">Quản lý hạng thành viên, điểm thưởng và quyền lợi</p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{members?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Tổng thành viên</p>
          </CardContent>
        </Card>
        {tiers?.slice(1).map(tier => (
          <Card key={tier.tier}>
            <CardContent className="p-4 text-center">
              <Badge className="mb-2 border-0" style={{ backgroundColor: tier.tier_color, color: '#1a1a1a' }}>
                {tier.display_name}
              </Badge>
              <p className="text-2xl font-bold">{tierCounts[tier.tier] || 0}</p>
              <p className="text-xs text-muted-foreground">thành viên</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Member List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách thành viên</CardTitle>
          <div className="flex gap-3 mt-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, email, SĐT..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hạng</SelectItem>
                {tiers?.map(t => (
                  <SelectItem key={t.tier} value={t.tier}>{t.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMembers?.map(member => {
                const tier = tiers?.find(t => t.tier === member.tier);
                return (
                  <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {(member.profiles?.full_name || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{member.profiles?.full_name || 'Chưa có tên'}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.profiles?.email || member.profiles?.phone || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-medium">{formatPrice(member.total_spent || 0)}₫</p>
                        <p className="text-xs text-muted-foreground">chi tiêu</p>
                      </div>
                      <Badge className="border-0 text-xs" style={{ backgroundColor: tier?.tier_color || '#FFF9DB', color: '#1a1a1a' }}>
                        {tier?.display_name || 'Paddier'}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{(member.points_balance || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">điểm</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setAdjustDialog(member)}>
                        Điều chỉnh
                      </Button>
                    </div>
                  </div>
                );
              })}
              {filteredMembers?.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">Không tìm thấy thành viên nào</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tier Benefits Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình quyền lợi hạng thành viên</CardTitle>
          <CardDescription>Chỉnh sửa voucher, freeship và ưu đãi sinh nhật cho từng hạng</CardDescription>
        </CardHeader>
        <CardContent>
          {tiersLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <ScrollArea className="w-full">
              <div className="min-w-[700px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Hạng</th>
                      <th className="text-right p-2 font-medium">Chi tiêu tối thiểu</th>
                      <th className="text-right p-2 font-medium">Voucher thăng hạng</th>
                      <th className="text-right p-2 font-medium">Freeship max</th>
                      <th className="text-right p-2 font-medium">Freeship đơn tối thiểu</th>
                      <th className="text-right p-2 font-medium">Sinh nhật %</th>
                      <th className="text-center p-2 font-medium">Lưu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers?.map(tier => {
                      const editing = editingTiers[tier.tier] || {};
                      return (
                        <tr key={tier.tier} className="border-b">
                          <td className="p-2">
                            <Badge className="border-0" style={{ backgroundColor: tier.tier_color, color: '#1a1a1a' }}>
                              {tier.display_name}
                            </Badge>
                          </td>
                          <td className="p-2 text-right text-muted-foreground">
                            {formatPrice(tier.min_spent)}₫
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              className="w-24 ml-auto text-right"
                              defaultValue={tier.upgrade_voucher_amount}
                              onChange={e => setEditingTiers(prev => ({
                                ...prev,
                                [tier.tier]: { ...prev[tier.tier], upgrade_voucher_amount: Number(e.target.value) }
                              }))}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              className="w-24 ml-auto text-right"
                              defaultValue={tier.freeship_max}
                              onChange={e => setEditingTiers(prev => ({
                                ...prev,
                                [tier.tier]: { ...prev[tier.tier], freeship_max: Number(e.target.value) }
                              }))}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              className="w-24 ml-auto text-right"
                              defaultValue={tier.freeship_min_order}
                              onChange={e => setEditingTiers(prev => ({
                                ...prev,
                                [tier.tier]: { ...prev[tier.tier], freeship_min_order: Number(e.target.value) }
                              }))}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              className="w-20 ml-auto text-right"
                              defaultValue={tier.birthday_discount_pct}
                              onChange={e => setEditingTiers(prev => ({
                                ...prev,
                                [tier.tier]: { ...prev[tier.tier], birthday_discount_pct: Number(e.target.value) }
                              }))}
                            />
                          </td>
                          <td className="p-2 text-center">
                            {editingTiers[tier.tier] && Object.keys(editingTiers[tier.tier]).length > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateTierMutation.mutate({ tier: tier.tier, updates: editingTiers[tier.tier] })}
                                disabled={updateTierMutation.isPending}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Adjust Points Dialog */}
      <Dialog open={!!adjustDialog} onOpenChange={() => setAdjustDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Điều chỉnh điểm thưởng</DialogTitle>
          </DialogHeader>
          {adjustDialog && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={adjustDialog.profiles?.avatar_url || undefined} />
                  <AvatarFallback>{(adjustDialog.profiles?.full_name || 'U')[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{adjustDialog.profiles?.full_name || 'Chưa có tên'}</p>
                  <p className="text-sm text-muted-foreground">
                    Hiện có: <span className="font-bold text-primary">{adjustDialog.points_balance}</span> điểm
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Số điểm (dương = cộng, âm = trừ)</Label>
                <Input
                  type="number"
                  placeholder="VD: 100 hoặc -50"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Lý do *</Label>
                <Textarea
                  placeholder="VD: Bù điểm cho đơn hàng lỗi"
                  value={adjustDescription}
                  onChange={e => setAdjustDescription(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(null)}>Hủy</Button>
            <Button
              onClick={() => {
                if (!adjustDialog || !adjustAmount || !adjustDescription.trim()) return;
                adjustPointsMutation.mutate({
                  userId: adjustDialog.user_id,
                  points: Number(adjustAmount),
                  description: adjustDescription,
                });
              }}
              disabled={!adjustAmount || !adjustDescription.trim() || adjustPointsMutation.isPending}
            >
              {adjustPointsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
