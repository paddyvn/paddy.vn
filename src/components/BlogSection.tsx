import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

export const BlogSection = () => {
  const { data: posts } = useQuery({
    queryKey: ['recent-blog-posts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('shopify_published_at', { ascending: false })
        .limit(4);
      return data || [];
    }
  });

  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">
            Blog & Tin Tức
          </h2>
          <Link 
            to="/blog" 
            className="text-primary hover:underline text-sm font-medium"
          >
            Xem tất cả
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {posts.map((post) => (
            <Link key={post.id} to={`/blog/${post.handle}`}>
              <Card className="group overflow-hidden border-0 shadow-card hover:shadow-hover transition-all h-full">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={post.image_url || '/placeholder.svg'}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    {post.shopify_published_at 
                      ? format(new Date(post.shopify_published_at), 'dd/MM/yyyy')
                      : format(new Date(post.created_at), 'dd/MM/yyyy')
                    }
                    {post.author && ` • ${post.author}`}
                  </p>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
