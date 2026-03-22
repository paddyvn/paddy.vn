import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Gift, Send, Calendar, Loader2, CheckCircle2 } from "lucide-react";
import { useGiftCardDesigns, useGiftCardDenominations } from "@/hooks/useGiftCards";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";

const DESIGN_CATEGORIES = ["Tất cả", "Sinh nhật", "Dịp lễ", "Chung"];

export default function GiftCard() {
  const { data: designs = [], isLoading: designsLoading } = useGiftCardDesigns();
  const { data: denominations = [], isLoading: denomsLoading } = useGiftCardDenominations();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
  const [designFilter, setDesignFilter] = useState("Tất cả");
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [deliveryOption, setDeliveryOption] = useState<"now" | "schedule">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
      }
    });
  }, []);

  // Set first design as default
  useEffect(() => {
    if (designs.length > 0 && !selectedDesign) {
      setSelectedDesign(designs[0].id);
    }
  }, [designs, selectedDesign]);

  // Set first denomination as default
  useEffect(() => {
    if (denominations.length > 0 && selectedAmount === null) {
      setSelectedAmount(denominations[0].amount);
    }
  }, [denominations, selectedAmount]);

  const activeAmount = isCustomAmount ? Number(customAmount) || 0 : (selectedAmount || 0);
  const activeDesign = designs.find((d) => d.id === selectedDesign);

  const filteredDesigns = designFilter === "Tất cả"
    ? designs
    : designs.filter((d) => d.category === designFilter);

  const validateCustomAmount = () => {
    const amt = Number(customAmount);
    if (amt < 50000) return "Tối thiểu 50.000₫";
    if (amt > 5000000) return "Tối đa 5.000.000₫";
    if (amt % 10000 !== 0) return "Phải là bội số của 10.000₫";
    return null;
  };

  const canSubmit = () => {
    if (!activeAmount || activeAmount < 50000) return false;
    if (isCustomAmount && validateCustomAmount()) return false;
    if (!selectedDesign) return false;
    if (!senderName.trim() || !recipientName.trim() || !recipientEmail.trim()) return false;
    return true;
  };

  const handlePurchase = async () => {
    if (!userId) {
      navigate("/auth");
      return;
    }
    if (!canSubmit()) return;

    setIsSubmitting(true);
    try {
      // Generate unique code
      const { data: code, error: codeErr } = await supabase.rpc("generate_gift_card_code");
      if (codeErr || !code) throw new Error("Không thể tạo mã thẻ");

      const scheduledAt = deliveryOption === "schedule" && scheduledDate ? new Date(scheduledDate).toISOString() : null;

      // Create the gift card
      const { data: card, error: cardErr } = await supabase
        .from("gift_cards")
        .insert({
          code,
          initial_amount: activeAmount,
          balance: activeAmount,
          status: scheduledAt ? "pending" : "active",
          design_id: selectedDesign,
          purchased_by: userId,
          sender_name: senderName,
          sender_email: userEmail,
          recipient_name: recipientName,
          recipient_email: recipientEmail,
          recipient_phone: recipientPhone || null,
          personal_message: personalMessage || null,
          delivery_method: "email",
          scheduled_delivery_at: scheduledAt,
          delivered_at: scheduledAt ? null : new Date().toISOString(),
          delivery_status: scheduledAt ? "pending" : "sent",
          expires_at: null,
        })
        .select()
        .single();

      if (cardErr) throw cardErr;

      // Log purchase transaction
      await supabase.from("gift_card_transactions").insert({
        gift_card_id: card.id,
        type: "purchase",
        amount: activeAmount,
        balance_before: 0,
        balance_after: activeAmount,
        performed_by: userId,
      });

      toast({
        title: "Mua thành công! 🎉",
        description: `Phiếu quà tặng ${formatPrice(activeAmount)}₫ đã được tạo. Mã: ${code}`,
      });

      // Reset form
      setSenderName("");
      setRecipientName("");
      setRecipientEmail("");
      setRecipientPhone("");
      setPersonalMessage("");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo phiếu quà tặng",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (designsLoading || denomsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer hideNewsletter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Trang chủ</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">Phiếu Quà Tặng</span>
        </nav>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
            <Gift className="h-8 w-8 text-primary" />
            Phiếu Quà Tặng Paddy
          </h1>
          <p className="text-muted-foreground mt-2">Không có hạn sử dụng · Không phí · Sử dụng nhiều lần</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Left: Live Preview */}
          <div className="order-2 lg:order-1">
            <div className="sticky top-24">
              <div
                className="relative rounded-2xl overflow-hidden shadow-lg aspect-[3/2] bg-cover bg-center"
                style={{
                  backgroundImage: activeDesign ? `url(${activeDesign.image_url})` : undefined,
                  backgroundColor: activeDesign ? undefined : "hsl(var(--muted))",
                }}
              >
                <div className="absolute inset-0 bg-black/30 flex flex-col justify-between p-6 text-white">
                  <div>
                    <p className="text-sm font-medium opacity-80">Phiếu Quà Tặng Paddy</p>
                    <p className="text-4xl font-bold mt-2">
                      {activeAmount > 0 ? `${formatPrice(activeAmount)}₫` : "---"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {senderName && <p className="text-sm">Từ: <span className="font-medium">{senderName}</span></p>}
                    {recipientName && <p className="text-sm">Gửi đến: <span className="font-medium">{recipientName}</span></p>}
                    {personalMessage && (
                      <p className="text-xs italic opacity-80 mt-2 line-clamp-2">"{personalMessage}"</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <Link to="/phieu-qua-tang/kiem-tra" className="text-sm text-primary hover:underline">
                  Kiểm tra số dư thẻ quà tặng →
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Configuration Form */}
          <div className="order-1 lg:order-2 space-y-6">
            {/* Step 1: Amount */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h2 className="font-semibold text-foreground">1. Chọn mệnh giá</h2>
                <div className="flex flex-wrap gap-2">
                  {denominations.map((d) => (
                    <Button
                      key={d.id}
                      variant={!isCustomAmount && selectedAmount === d.amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedAmount(d.amount);
                        setIsCustomAmount(false);
                      }}
                    >
                      {d.label}
                    </Button>
                  ))}
                  <Button
                    variant={isCustomAmount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsCustomAmount(true)}
                  >
                    Tùy chỉnh
                  </Button>
                </div>
                {isCustomAmount && (
                  <div className="space-y-1">
                    <Input
                      type="number"
                      placeholder="Nhập số tiền (VNĐ)"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      min={50000}
                      max={5000000}
                      step={10000}
                    />
                    {customAmount && validateCustomAmount() && (
                      <p className="text-xs text-destructive">{validateCustomAmount()}</p>
                    )}
                    <p className="text-xs text-muted-foreground">50.000₫ – 5.000.000₫, bội số 10.000₫</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Design */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h2 className="font-semibold text-foreground">2. Chọn mẫu thiết kế</h2>
                <div className="flex gap-2 flex-wrap">
                  {DESIGN_CATEGORIES.map((cat) => (
                    <Button
                      key={cat}
                      variant={designFilter === cat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDesignFilter(cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredDesigns.map((design) => (
                    <button
                      key={design.id}
                      onClick={() => setSelectedDesign(design.id)}
                      className={`relative rounded-lg overflow-hidden aspect-[3/2] border-2 transition-all ${
                        selectedDesign === design.id
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent hover:border-border"
                      }`}
                    >
                      <img
                        src={design.thumbnail_url || design.image_url}
                        alt={design.name}
                        className="w-full h-full object-cover"
                      />
                      {selectedDesign === design.id && (
                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                      <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center">
                        {design.name}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Personalize */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h2 className="font-semibold text-foreground">3. Cá nhân hóa</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sender">Tên người gửi *</Label>
                    <Input
                      id="sender"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Tên người gửi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Tên người nhận *</Label>
                    <Input
                      id="recipient"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Tên người nhận"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 4: Delivery */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h2 className="font-semibold text-foreground">4. Gửi tặng</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email người nhận *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="Email người nhận"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại (tùy chọn)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="Số điện thoại (để gửi qua Zalo)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Lời nhắn (tùy chọn)</Label>
                    <Textarea
                      id="message"
                      value={personalMessage}
                      onChange={(e) => setPersonalMessage(e.target.value.slice(0, 200))}
                      placeholder="Lời nhắn (tối đa 200 ký tự)"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground text-right">{personalMessage.length}/200</p>
                  </div>

                  <Separator />

                  <RadioGroup
                    value={deliveryOption}
                    onValueChange={(v) => setDeliveryOption(v as "now" | "schedule")}
                  >
                    <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer" onClick={() => setDeliveryOption("now")}>
                      <RadioGroupItem value="now" />
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-primary" />
                        <span className="font-medium">Gửi ngay</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer" onClick={() => setDeliveryOption("schedule")}>
                      <RadioGroupItem value="schedule" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-medium">Hẹn giờ gửi</span>
                        </div>
                        {deliveryOption === "schedule" && (
                          <Input
                            type="datetime-local"
                            className="mt-2"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
                            max={new Date(Date.now() + 365 * 24 * 3600000).toISOString().slice(0, 16)}
                          />
                        )}
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Summary & CTA */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Giá trị thẻ</span>
                  <span className="text-xl font-bold text-primary">
                    {activeAmount > 0 ? `${formatPrice(activeAmount)}₫` : "---"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Không phí giao hàng · Sản phẩm kỹ thuật số</p>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={!canSubmit() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Gift className="mr-2 h-5 w-5" />
                      Mua ngay — {activeAmount > 0 ? `${formatPrice(activeAmount)}₫` : ""}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer hideNewsletter />
    </div>
  );
}
