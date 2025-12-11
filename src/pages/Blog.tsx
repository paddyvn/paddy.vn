import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const POSTS_PER_PAGE = 12;

const Blog = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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

  // Extract unique categories and tags
  const { categories, tags } = useMemo(() => {
    if (!posts) return { categories: [], tags: [] };
    
    const categorySet = new Set<string>();
    const tagSet = new Set<string>();
    
    posts.forEach(post => {
      if (post.blog_title) categorySet.add(post.blog_title);
      if (post.tags) {
        post.tags.split(",").forEach(tag => tagSet.add(tag.trim()));
      }
    });
    
    return {
      categories: Array.from(categorySet).sort(),
      tags: Array.from(tagSet).sort()
    };
  }, [posts]);

  // Filter posts based on selected category and tag
  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    
    return posts.filter(post => {
      const matchesCategory = !selectedCategory || post.blog_title === selectedCategory;
      const matchesTag = !selectedTag || (post.tags && post.tags.includes(selectedTag));
      return matchesCategory && matchesTag;
    });
  }, [posts, selectedCategory, selectedTag]);

  const isFiltering = selectedCategory || selectedTag;
  
  // When filtering, show all filtered posts; otherwise use original layout
  const featuredPost = isFiltering ? null : filteredPosts?.[0];
  const popularPosts = isFiltering ? [] : filteredPosts?.slice(1, 6) || [];
  const gridPosts = isFiltering ? [] : filteredPosts?.slice(1, 7) || [];
  const allPosts = isFiltering ? filteredPosts : filteredPosts?.slice(7) || [];

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

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleTagChange = (tag: string | null) => {
    setSelectedTag(tag);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6">
          Paddy's Magazine
        </h1>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange(null)}
            className="rounded-full"
          >
            Tất cả
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Tags Filter */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.slice(0, 15).map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "secondary"}
                className="cursor-pointer hover:bg-primary/80 transition-colors"
                onClick={() => handleTagChange(selectedTag === tag ? null : tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Active Filters */}
        {isFiltering && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Đang lọc:</span>
            {selectedCategory && (
              <Badge variant="outline" className="gap-1">
                {selectedCategory}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleCategoryChange(null)} />
              </Badge>
            )}
            {selectedTag && (
              <Badge variant="outline" className="gap-1">
                #{selectedTag}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleTagChange(null)} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-xs">
              Xóa bộ lọc
            </Button>
          </div>
        )}

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
            {/* Hero Section - Only show when not filtering */}
            {!isFiltering && (
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
            )}

            {/* Articles Grid - Only show when not filtering */}
            {!isFiltering && gridPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
            )}

            {/* All Posts with Pagination */}
            {allPosts.length > 0 ? (
              <div id="all-posts">
                {!isFiltering && (
                  <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">
                    Tất cả bài viết
                  </h2>
                )}
                
                {isFiltering && (
                  <p className="text-muted-foreground mb-6">
                    Tìm thấy {filteredPosts.length} bài viết
                  </p>
                )}
                
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
            ) : isFiltering ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Không tìm thấy bài viết nào phù hợp</p>
                <Button variant="outline" onClick={clearFilters}>
                  Xóa bộ lọc
                </Button>
              </div>
            ) : null}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
