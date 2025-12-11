import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

const POSTS_PER_PAGE = 12;

const Blog = () => {
  const [currentPage, setCurrentPage] = useState(1);

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
  const allPosts = posts?.slice(7) || [];

  // Pagination calculations
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = allPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "dd MMM, yyyy", { locale: vi });
  };

  const stripHtml = (html: string | null) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").substring(0, 150) + "...";
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: document.getElementById("all-posts")?.offsetTop || 0, behavior: "smooth" });
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

            {/* All Posts with Pagination */}
            {allPosts.length > 0 && (
              <div id="all-posts" className="mt-12">
                <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">
                  Tất cả bài viết
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {paginatedPosts.map((post) => (
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first, last, current, and adjacent pages
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="icon"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        );
                      }
                      // Show ellipsis
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2 text-muted-foreground">...</span>;
                      }
                      return null;
                    })}
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Page info */}
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Hiển thị {startIndex + 1} - {Math.min(startIndex + POSTS_PER_PAGE, allPosts.length)} trong {allPosts.length} bài viết
                </p>
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
