import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const Blog = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("shopify_published_at", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const featuredPost = posts?.[0];
  const popularPosts = posts?.slice(1, 6) || [];
  const gridPosts = posts?.slice(1, 7) || [];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "dd MMM, yyyy", { locale: vi });
  };

  const stripHtml = (html: string | null) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").substring(0, 150) + "...";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-8">
          Paddy's Magazine
        </h1>

        {isLoading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <Skeleton className="lg:col-span-3 h-64" />
              <Skeleton className="lg:col-span-6 h-96" />
              <Skeleton className="lg:col-span-3 h-64" />
            </div>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
              {/* Featured Article Info */}
              <div className="lg:col-span-3 flex flex-col justify-center">
                {featuredPost && (
                  <Link to={`/blogs/${featuredPost.handle}`} className="group">
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight mb-4 group-hover:text-primary transition-colors">
                      {featuredPost.title}
                    </h2>
                    <p className="text-muted-foreground text-sm md:text-base">
                      {stripHtml(featuredPost.summary_html || featuredPost.body_html)}
                    </p>
                  </Link>
                )}
              </div>

              {/* Featured Image */}
              <div className="lg:col-span-6">
                {featuredPost?.image_url && (
                  <Link to={`/blogs/${featuredPost.handle}`}>
                    <div className="relative aspect-video rounded-2xl overflow-hidden">
                      <img
                        src={featuredPost.image_url}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                )}
              </div>

              {/* Popular Sidebar */}
              <div className="lg:col-span-3 bg-secondary/30 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Phổ biến</h3>
                <div className="space-y-4">
                  {popularPosts.map((post, index) => (
                    <Link
                      key={post.id}
                      to={`/blogs/${post.handle}`}
                      className="flex gap-3 group"
                    >
                      <span className="text-2xl font-bold text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                        {post.author && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {post.author}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blogs/${post.handle}`}
                  className="group"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No image</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {stripHtml(post.summary_html || post.body_html)}
                  </p>
                </Link>
              ))}
            </div>

            {/* Load More / All Posts */}
            {posts && posts.length > 7 && (
              <div className="mt-12">
                <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">
                  Tất cả bài viết
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {posts.slice(7).map((post) => (
                    <Link
                      key={post.id}
                      to={`/blogs/${post.handle}`}
                      className="group"
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                        {post.image_url ? (
                          <img
                            src={post.image_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">No image</span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(post.shopify_published_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
