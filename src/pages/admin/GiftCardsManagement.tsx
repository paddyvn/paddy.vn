import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Gift,
  Search,
  Eye,
  Ban,
  CheckCircle2,
  Clock,
  CreditCard,
  TrendingUp,
  DollarSign,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface GiftCard {
  id: string;
  code: string;
  initial_amount: number;
  balance: number;
  status: string;
  sender_name: string;
  recipient_name: string;
  recipient_email: string;
  recipient_phone: string | null;
  personal_message: string | null;
  delivery_status: string | null;
  created_at: string;
  purchased_at: string | null;
  design: { name: string; image_url: string } | null;
}

interface GiftCardTransaction {
  id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  order_id: string | null;
  note: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Hoạt động", variant: "default" },
  pending: { label: "Chờ gửi", variant: "secondary" },
  partially_used: { label: "Đã dùng 1 phần", variant: "outline" },
  fully_used: { label: "Đã hết", variant: "secondary" },
  disabled: { label: "Vô hiệu", variant: "destructive" },
};

export default function GiftCardsManagement() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);

  // Fetch gift cards
  const { data: giftCards = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-gift-cards", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("gift_cards")
        .select("*, design:gift_card_designs(name, image_url)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GiftCard[];
    },
  });

  // Fetch transactions for selected card
  const { data: transactions = [] } = useQuery({
    queryKey: ["admin-gift-card-transactions", selectedCard?.id],
    queryFn: async () => {
      if (!selectedCard) return [];
      const { data, error } = await supabase
        .from("gift_card_transactions")
        .select("*")
        .eq("gift_card_id", selectedCard.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GiftCardTransaction[];
    },
    enabled: !!selectedCard,
  });

  // Dashboard stats
  const stats = {
    totalCards: giftCards.length,
    totalValue: giftCards.reduce((sum, c) => sum + c.initial_amount, 0),
    outstandingBalance: giftCards.reduce((sum, c) => sum + c.balance, 0),
    activeCards: giftCards.filter((c) => c.status === "active" || c.status === "partially_used").length,
  };

  const filtered = giftCards.filter((card) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      card.code.toLowerCase().includes(q) ||
      card.sender_name.toLowerCase().includes(q) ||
      card.recipient_name.toLowerCase().includes(q) ||
      card.recipient_email.toLowerCase().includes(q)
    );
  });

  const handleToggleStatus = async (card: GiftCard) => {
    const newStatus = card.status === "disabled" ? "active" : "disabled";
    const { error } = await supabase
      .from("gift_cards")
      .update({ status: newStatus })
      .eq("id", card.id);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Đã cập nhật", description: `Thẻ ${card.code} đã ${newStatus === "disabled" ? "vô hiệu hóa" : "kích hoạt lại"}` });
      refetch();
      if (selectedCard?.id === card.id) setSelectedCard({ ...card, status: newStatus });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Đã sao chép", description: code });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Gift className="h-6 w-6 text-primary" />
          Quản lý Thẻ Quà Tặng
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Theo dõi và quản lý phiếu quà tặng</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CreditCard className="h-3.5 w-3.5" />
              Tổng thẻ
            </div>
            <p className="text-2xl font-bold">{stats.totalCards}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              Tổng giá trị
            </div>
            <p className="text-2xl font-bold">{formatPrice(stats.totalValue)}₫</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Số dư chưa dùng
            </div>
            <p className="text-2xl font-bold text-primary">{formatPrice(stats.outstandingBalance)}₫</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đang hoạt động
            </div>
            <p className="text-2xl font-bold">{stats.activeCards}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã, tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="pending">Chờ gửi</SelectItem>
            <SelectItem value="partially_used">Đã dùng 1 phần</SelectItem>
            <SelectItem value="fully_used">Đã hết</SelectItem>
            <SelectItem value="disabled">Vô hiệu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Mệnh giá</TableHead>
                <TableHead>Số dư</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Người gửi</TableHead>
                <TableHead>Người nhận</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Không có thẻ quà tặng nào
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((card) => {
                  const cfg = STATUS_CONFIG[card.status] || { label: card.status, variant: "outline" as const };
                  return (
                    <TableRow key={card.id}>
                      <TableCell>
                        <button
                          onClick={() => copyCode(card.code)}
                          className="font-mono text-xs hover:text-primary flex items-center gap-1"
                          title="Copy"
                        >
                          {card.code}
                          <Copy className="h-3 w-3 opacity-50" />
                        </button>
                      </TableCell>
                      <TableCell>{formatPrice(card.initial_amount)}₫</TableCell>
                      <TableCell className="font-medium">{formatPrice(card.balance)}₫</TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{card.sender_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">{card.recipient_name}</div>
                        <div className="text-xs text-muted-foreground">{card.recipient_email}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {card.created_at ? format(new Date(card.created_at), "dd/MM/yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedCard(card)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleStatus(card)}
                          >
                            {card.status === "disabled" ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Ban className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Chi tiết thẻ quà tặng
            </DialogTitle>
          </DialogHeader>

          {selectedCard && (
            <div className="space-y-4">
              {/* Card Preview */}
              {selectedCard.design && (
                <div
                  className="relative rounded-xl overflow-hidden aspect-[3/2] bg-cover bg-center"
                  style={{ backgroundImage: `url(${selectedCard.design.image_url})` }}
                >
                  <div className="absolute inset-0 bg-black/30 flex flex-col justify-between p-4 text-white">
                    <div>
                      <p className="text-xs opacity-80">Phiếu Quà Tặng Paddy</p>
                      <p className="text-2xl font-bold mt-1">{formatPrice(selectedCard.initial_amount)}₫</p>
                    </div>
                    <div className="space-y-0.5 text-sm">
                      <p>Từ: {selectedCard.sender_name}</p>
                      <p>Gửi đến: {selectedCard.recipient_name}</p>
                      {selectedCard.personal_message && (
                        <p className="text-xs italic opacity-80 mt-1">"{selectedCard.personal_message}"</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Mã:</span>
                  <p className="font-mono font-medium">{selectedCard.code}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <p>
                    <Badge variant={STATUS_CONFIG[selectedCard.status]?.variant || "outline"}>
                      {STATUS_CONFIG[selectedCard.status]?.label || selectedCard.status}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p>{selectedCard.recipient_email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">SĐT:</span>
                  <p>{selectedCard.recipient_phone || "—"}</p>
                </div>
              </div>

              {/* Balance Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Số dư</span>
                  <span className="font-medium">{formatPrice(selectedCard.balance)}₫ / {formatPrice(selectedCard.initial_amount)}₫</span>
                </div>
                <Progress
                  value={((selectedCard.initial_amount - selectedCard.balance) / selectedCard.initial_amount) * 100}
                  className="h-2"
                />
              </div>

              <Separator />

              {/* Transaction Ledger */}
              <div>
                <h3 className="font-medium text-sm mb-2">Lịch sử giao dịch</h3>
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có giao dịch</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                        <div>
                          <span className={`font-medium ${tx.type === "purchase" ? "text-green-600" : "text-destructive"}`}>
                            {tx.type === "purchase" ? "Mua" : tx.type === "redemption" ? "Sử dụng" : tx.type}
                          </span>
                          {tx.note && <span className="text-muted-foreground ml-2">— {tx.note}</span>}
                          <p className="text-xs text-muted-foreground">
                            {tx.created_at ? format(new Date(tx.created_at), "dd/MM/yyyy HH:mm") : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${tx.type === "purchase" ? "text-green-600" : "text-destructive"}`}>
                            {tx.type === "purchase" ? "+" : "-"}{formatPrice(tx.amount)}₫
                          </p>
                          <p className="text-xs text-muted-foreground">Dư: {formatPrice(tx.balance_after)}₫</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant={selectedCard.status === "disabled" ? "default" : "destructive"}
                  size="sm"
                  onClick={() => handleToggleStatus(selectedCard)}
                  className="flex-1"
                >
                  {selectedCard.status === "disabled" ? (
                    <><CheckCircle2 className="h-4 w-4 mr-1" /> Kích hoạt lại</>
                  ) : (
                    <><Ban className="h-4 w-4 mr-1" /> Vô hiệu hóa</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
