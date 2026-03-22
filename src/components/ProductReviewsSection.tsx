import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ProductReviewsSectionProps {
  productId: string;
  userId?: string;
}

export const ProductReviewsSection = ({ productId, userId }: ProductReviewsSectionProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: reviews, refetch } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, title, comment, created_at, profiles!reviews_user_id_fkey(full_name)")
        .eq("product_id", productId)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
  });

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("Vui lòng đăng nhập để đánh giá");
      return;
    }
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        user_id: userId,
        rating,
        title: title || null,
        comment: comment || null,
        moderation_status: "pending",
      });

      if (error) throw error;

      toast.success("Cảm ơn bạn đã đánh giá! Đánh giá sẽ được duyệt trước khi hiển thị.");
      setRating(0);
      setTitle("");
      setComment("");
      refetch();
    } catch (err) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-t pt-8 mt-8">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Đánh giá sản phẩm
        {reviews && reviews.length > 0 && (
          <span className="text-sm font-normal text-muted-foreground">
            ({reviews.length} đánh giá • {avgRating.toFixed(1)} ★)
          </span>
        )}
      </h2>

      {/* Review Form */}
      <div className="bg-muted/50 rounded-xl p-6 mb-8">
        <h3 className="font-semibold mb-4">
          {reviews && reviews.length > 0 ? "Viết đánh giá" : "Hãy là người đầu tiên đánh giá sản phẩm này"}
        </h3>

        {/* Star Rating */}
        <div className="flex items-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-7 w-7 ${
                  star <= (hoverRating || rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
          {rating > 0 && <span className="text-sm text-muted-foreground ml-2">{rating}/5</span>}
        </div>

        <Input
          placeholder="Tiêu đề đánh giá (tùy chọn)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3"
        />
        <Textarea
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="mb-4"
        />
        <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
          {submitting ? "Đang gửi..." : "Gửi đánh giá"}
        </Button>
        {!userId && (
          <p className="text-xs text-muted-foreground mt-2">Bạn cần đăng nhập để gửi đánh giá</p>
        )}
      </div>

      {/* Reviews List */}
      {reviews && reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= (review.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">
                  {(review.profiles as any)?.full_name || "Khách hàng"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(review.created_at), "dd/MM/yyyy", { locale: vi })}
                </span>
              </div>
              {review.title && <p className="font-medium mb-1">{review.title}</p>}
              {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">Chưa có đánh giá nào</p>
      )}
    </section>
  );
};
