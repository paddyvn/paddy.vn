import { useState, useMemo } from "react";
import { useBlogPosts, useSyncBlogPosts, useUpdateBlogPost, useDeleteBlogPost } from "@/hooks/useBlogPosts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, Eye, Edit, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default function ContentBlog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [blogFilter, setBlogFilter] = useState<string>("all");
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const POSTS_PER_PAGE = 20;

  const { data: posts, isLoading } = useBlogPosts();
  const syncPosts = useSyncBlogPosts();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();

  // Get unique blogs for filter
  const blogs = useMemo(() => {
    if (!posts) return [];
    const uniqueBlogs = new Map<string, string>();
    posts.forEach((post) => {
      if (post.shopify_blog_id && post.blog_title) {
        uniqueBlogs.set(post.shopify_blog_id, post.blog_title);
      }
    });
    return Array.from(uniqueBlogs.entries()).map(([id, title]) => ({ id, title }));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!posts) return [];

    return posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.tags && post.tags.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesBlog =
        blogFilter === "all" || post.shopify_blog_id === blogFilter;

      return matchesSearch && matchesBlog;
    });
  }, [posts, searchQuery, blogFilter]);

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    return filteredPosts.slice(startIndex, endIndex);
  }, [filteredPosts, currentPage, POSTS_PER_PAGE]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, blogFilter]);

  const selectedPostData = posts?.find((p) => p.id === selectedPost);

  const handleSync = () => {
    syncPosts.mutate();
  };

  const handleEdit = (post: any) => {
    setEditingPost({
      ...post,
    });
  };

  const handleSaveEdit = () => {
    if (!editingPost) return;

    updatePost.mutate(
      {
        id: editingPost.id,
        updates: {
          title: editingPost.title,
          body_html: editingPost.body_html,
          summary_html: editingPost.summary_html,
          tags: editingPost.tags,
          published: editingPost.published,
        },
      },
      {
        onSuccess: () => {
          setEditingPost(null);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deletePostId) return;

    deletePost.mutate(deletePostId, {
      onSuccess: () => {
        setDeletePostId(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Blog posts</h2>
          <p className="text-muted-foreground">
            Manage blog posts synced from Shopify
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncPosts.isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncPosts.isPending ? "animate-spin" : ""}`} />
          {syncPosts.isPending ? "Syncing..." : "Sync Blog Posts"}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, handle, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={blogFilter} onValueChange={setBlogFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by blog" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Blogs</SelectItem>
            {blogs.map((blog) => (
              <SelectItem key={blog.id} value={blog.id}>
                {blog.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Blog</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-32 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchQuery || blogFilter !== "all"
                      ? "No blog posts found"
                      : "No blog posts synced yet. Click 'Sync Blog Posts' to import from Shopify."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.blog_title || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.author || "—"}
                  </TableCell>
                  <TableCell>
                    {post.tags ? (
                      <div className="flex flex-wrap gap-1">
                        {post.tags.split(",").slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                        {post.tags.split(",").length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{post.tags.split(",").length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.published ? "default" : "secondary"}>
                      {post.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.shopify_published_at
                      ? format(new Date(post.shopify_published_at), "MMM d, yyyy HH:mm")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPost(post.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(post)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletePostId(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredPosts.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * POSTS_PER_PAGE) + 1} to {Math.min(currentPage * POSTS_PER_PAGE, filteredPosts.length)} of {filteredPosts.length} posts
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPostData?.title}</DialogTitle>
            <DialogDescription>
              {selectedPostData?.blog_title} • {selectedPostData?.handle} •{" "}
              {selectedPostData && format(new Date(selectedPostData.updated_at), "MMM d, yyyy HH:mm")}
            </DialogDescription>
          </DialogHeader>

          {selectedPostData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={selectedPostData.published ? "default" : "secondary"}>
                  {selectedPostData.published ? "Published" : "Draft"}
                </Badge>
                {selectedPostData.tags && selectedPostData.tags.split(",").map((tag, idx) => (
                  <Badge key={idx} variant="outline">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>

              {selectedPostData.image_url && (
                <div>
                  <img
                    src={selectedPostData.image_url}
                    alt={selectedPostData.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {selectedPostData.summary_html && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedPostData.summary_html }}
                  />
                </div>
              )}

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Content</h3>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedPostData.body_html || "" }}
                />
              </div>

              {selectedPostData.author && (
                <div>
                  <h3 className="font-semibold mb-2">Author</h3>
                  <p className="text-sm text-muted-foreground">{selectedPostData.author}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
            <DialogDescription>
              Make changes to the blog post content and settings
            </DialogDescription>
          </DialogHeader>

          {editingPost && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingPost.title}
                  onChange={(e) =>
                    setEditingPost({ ...editingPost, title: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="summary">Summary (HTML)</Label>
                <Textarea
                  id="summary"
                  value={editingPost.summary_html || ""}
                  onChange={(e) =>
                    setEditingPost({ ...editingPost, summary_html: e.target.value })
                  }
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="body">Content (HTML)</Label>
                <Textarea
                  id="body"
                  value={editingPost.body_html || ""}
                  onChange={(e) =>
                    setEditingPost({ ...editingPost, body_html: e.target.value })
                  }
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={editingPost.tags || ""}
                  onChange={(e) =>
                    setEditingPost({ ...editingPost, tags: e.target.value })
                  }
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={editingPost.published}
                  onCheckedChange={(checked) =>
                    setEditingPost({ ...editingPost, published: checked })
                  }
                />
                <Label htmlFor="published">Published</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPost(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updatePost.isPending}>
              {updatePost.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the blog post from your database. This action cannot be undone.
              The post will still exist in Shopify.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}