import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  is_verified_purchase?: boolean;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface ProductReviewsProps {
  productId: string;
  reviews: Review[];
  userId?: string;
}

export function ProductReviews({ productId, reviews, userId }: ProductReviewsProps) {
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Please sign in to leave a review");
      
      const { error } = await supabase
        .from("reviews")
        .insert({
          product_id: productId,
          user_id: userId,
          rating,
          title: title || null,
          comment: comment || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      setIsWritingReview(false);
      setTitle("");
      setComment("");
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 
      ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) 
      : 0,
  }));

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatName = (name: string | null) => {
    if (!name) return "Anonymous";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1][0]}.`;
    }
    return name;
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl md:text-3xl font-bold text-primary">Customer Reviews</h2>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Rating Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="pt-6 space-y-6">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-6xl font-bold mb-2">{averageRating.toFixed(1)}</div>
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on {reviews.length.toLocaleString()} reviews
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-3">
                {ratingDistribution.map(({ star, percentage }) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-4">{star}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-10 text-right">
                      {percentage}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Write Review Button */}
              {userId && !isWritingReview && (
                <Button 
                  onClick={() => setIsWritingReview(true)} 
                  variant="outline"
                  className="w-full"
                >
                  Write a Review
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Reviews List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Review Form */}
          {isWritingReview && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle>Write Your Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Rating</Label>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                      >
                        <Star
                          className={`h-8 w-8 cursor-pointer transition-colors ${
                            star <= (hoveredRating || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Review Title (Optional)</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Sum up your experience"
                  />
                </div>

                <div>
                  <Label htmlFor="comment">Your Review (Optional)</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this product"
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => submitReview.mutate()} disabled={submitReview.isPending}>
                    {submitReview.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsWritingReview(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No reviews yet. Be the first to review this product!
                </p>
              </CardContent>
            </Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6 space-y-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={review.profiles.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                          {getInitials(review.profiles.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">
                          {formatName(review.profiles.full_name)}
                        </p>
                        <p className="text-sm text-green-600 font-medium">
                          Verified Buyer
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Title */}
                  {review.title && (
                    <h4 className="font-bold text-lg">{review.title}</h4>
                  )}

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-muted-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
