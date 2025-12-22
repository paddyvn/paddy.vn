import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  user_has_liked?: boolean;
}

export const useBlogComments = (postId: string | undefined) => {
  return useQuery({
    queryKey: ["blog-comments", postId],
    queryFn: async () => {
      if (!postId) return [];

      const { data: comments, error } = await supabase
        .from("blog_comments")
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get current user's likes
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: likes } = await supabase
          .from("blog_comment_likes")
          .select("comment_id")
          .eq("user_id", user.id);

        const likedCommentIds = new Set(likes?.map(l => l.comment_id) || []);
        
        return (comments || []).map(comment => ({
          ...comment,
          user_has_liked: likedCommentIds.has(comment.id)
        })) as BlogComment[];
      }

      return (comments || []) as BlogComment[];
    },
    enabled: !!postId,
  });
};

export const useCreateBlogComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      content,
      parentId,
    }: {
      postId: string;
      content: string;
      parentId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Bạn cần đăng nhập để bình luận");

      const { data, error } = await supabase
        .from("blog_comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_id: parentId || null,
        })
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments", variables.postId] });
      toast.success("Bình luận đã được đăng!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteBlogComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const { error } = await supabase
        .from("blog_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments", postId] });
      toast.success("Đã xóa bình luận");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useToggleCommentLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId, isLiked }: { commentId: string; postId: string; isLiked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Bạn cần đăng nhập để thích bình luận");

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("blog_comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);

        if (error) throw error;

        // Decrement likes_count
        await supabase.rpc('decrement_comment_likes', { comment_id: commentId }).maybeSingle();
      } else {
        // Like
        const { error } = await supabase
          .from("blog_comment_likes")
          .insert({
            comment_id: commentId,
            user_id: user.id,
          });

        if (error) throw error;

        // Increment likes_count
        await supabase.rpc('increment_comment_likes', { comment_id: commentId }).maybeSingle();
      }

      return { postId };
    },
    onSuccess: ({ postId }) => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments", postId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
