import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BlogPost {
  id: string;
  shopify_article_id: string | null;
  shopify_blog_id: string | null;
  blog_title: string | null;
  title: string;
  handle: string;
  body_html: string | null;
  summary_html: string | null;
  author: string | null;
  published: boolean;
  tags: string | null;
  image_url: string | null;
  category_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  shopify_created_at: string | null;
  shopify_updated_at: string | null;
  shopify_published_at: string | null;
}

export const useBlogPosts = () => {
  return useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("shopify_published_at", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    },
  });
};

export const useSyncBlogPosts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("shopify-sync-blog-posts");

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts-count"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-categories"] });
      toast({
        title: "Sync Complete",
        description: data.message || "Blog posts synced successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateBlogPost = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<BlogPost>;
    }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts-count"] });
      toast({
        title: "Blog Post Updated",
        description: "Blog post has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteBlogPost = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts-count"] });
      toast({
        title: "Blog Post Deleted",
        description: "Blog post has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useCreateBlogPost = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: {
      title: string;
      handle: string;
      body_html?: string;
      summary_html?: string;
      author?: string;
      published?: boolean;
      tags?: string;
      image_url?: string;
      blog_title?: string;
    }) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert({
          title: post.title,
          handle: post.handle,
          body_html: post.body_html || null,
          summary_html: post.summary_html || null,
          author: post.author || null,
          published: post.published ?? false,
          tags: post.tags || null,
          image_url: post.image_url || null,
          blog_title: post.blog_title || "Paddy's Magazine",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts-count"] });
      toast({
        title: "Blog Post Created",
        description: "New blog post has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Create Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};