import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Gift, Search, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Link } from "react-router-dom";

interface BalanceResult {
  found: boolean;
  balance: number;
  initial_amount: number;
  status: string;
}

export default function GiftCardBalance() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<BalanceResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheck = async () => {
    if (!code.trim()) return;
    setIsChecking(true);
    setResult(null);
    setNotFound(false);

    try {
      const { data, error } = await supabase.rpc("check_gift_card_balance", { p_code: code.trim().toUpperCase() });
      if (error) throw error;

      const res = data as unknown as BalanceResult;
      if (res?.found) {
        setResult(res);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setIsChecking(false);
    }
  };

  const usedPercentage = result ? ((result.initial_amount - result.balance) / result.initial_amount) * 100 : 0;

  const statusLabel: Record<string, string> = {
    active: "Đang hoạt động",
    pending: "Chờ kích hoạt",
    partially_used: "Đã sử dụng một phần",
    fully_used: "Đã sử dụng hết",
    disabled: "Đã vô hiệu hóa",
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Trang chủ</Link>
          <span className="mx-2">/</span>
          <Link to="/phieu-qua-tang" className="hover:text-primary">Phiếu Quà Tặng</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">Kiểm tra số dư</span>
        </nav>

        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center">
            <Gift className="h-12 w-12 text-primary mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-foreground">Kiểm tra số dư thẻ quà tặng</h1>
            <p className="text-muted-foreground mt-1">Nhập mã thẻ để kiểm tra số dư còn lại</p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="GC-XXXX-XXXX-XXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                  className="font-mono"
                />
                <Button onClick={handleCheck} disabled={isChecking || !code.trim()}>
                  {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {notFound && (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-lg p-3">
                  <XCircle className="h-5 w-5" />
                  <span className="text-sm">Không tìm thấy thẻ quà tặng với mã này</span>
                </div>
              )}

              {result && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">{statusLabel[result.status] || result.status}</span>
                  </div>

                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Số dư còn lại</p>
                    <p className="text-3xl font-bold text-primary">{formatPrice(result.balance)}₫</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      / {formatPrice(result.initial_amount)}₫ ban đầu
                    </p>
                  </div>

                  <Progress value={usedPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Đã sử dụng {formatPrice(result.initial_amount - result.balance)}₫
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Chưa có thẻ quà tặng?{" "}
            <Link to="/phieu-qua-tang" className="text-primary hover:underline font-medium">
              Mua ngay →
            </Link>
          </p>
        </div>
      </main>

      <Footer hideNewsletter />
    </div>
  );
}
