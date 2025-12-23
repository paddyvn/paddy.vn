import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useBlogPosts, useUpdateBlogPost, useCreateBlogPost, useDeleteBlogPost } from "@/hooks/useBlogPosts";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImagePickerDialog } from "@/components/admin/ImagePickerDialog";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Pencil,
  ChevronDown,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

export default function BlogPostEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: posts, isLoading } = useBlogPosts();
  const { data: categories } = useBlogCategories();
  const updatePost = useUpdateBlogPost();
  const createPost = useCreateBlogPost();
  const deletePost = useDeleteBlogPost();

  const isNewPost = id === "new";

  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [summaryHtml, setSummaryHtml] = useState("");
  const [author, setAuthor] = useState("");
  const [blogTitle, setBlogTitle] = useState("Paddy's Magazine");
  const [tags, setTags] = useState("");
  const [published, setPublished] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [handle, setHandle] = useState("");
  
  const [isExcerptEditing, setIsExcerptEditing] = useState(false);
  const [isSeoEditing, setIsSeoEditing] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const post = !isNewPost ? posts?.find((p) => p.id === id) : null;
  
  // Get category slug for view URL
  const categorySlug = useMemo(() => {
    const category = categories?.find((c) => c.name === blogTitle);
    return category?.slug || 'articles';
  }, [categories, blogTitle]);

  // Always use category-based URLs for better SEO
  const getViewUrl = () => `/blogs/${categorySlug}/${handle}`;
  
  // Get all posts for navigation (only for edit mode)
  const sortedPosts = posts?.slice().sort((a, b) => {
    const dateA = a.shopify_published_at || a.updated_at;
    const dateB = b.shopify_published_at || b.updated_at;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
  const currentIndex = sortedPosts?.findIndex((p) => p.id === id) ?? -1;
  const prevPost = !isNewPost && currentIndex > 0 ? sortedPosts?.[currentIndex - 1] : null;
  const nextPost = !isNewPost && currentIndex < (sortedPosts?.length ?? 0) - 1 ? sortedPosts?.[currentIndex + 1] : null;

  // Get unique blog titles for selector
  const uniqueBlogs = posts
    ? Array.from(new Set(posts.map((p) => p.blog_title).filter(Boolean)))
    : [];

  useEffect(() => {
    if (post && !isNewPost) {
      setTitle(post.title);
      setBodyHtml(post.body_html || "");
      setSummaryHtml(post.summary_html || "");
      setAuthor(post.author || "");
      setBlogTitle(post.blog_title || "Paddy's Magazine");
      setTags(post.tags || "");
      setPublished(post.published ?? true);
      setImageUrl(post.image_url || "");
      setHandle(post.handle);
      setHasChanges(false);
    }
  }, [post, isNewPost]);

  const generateHandle = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleSave = () => {
    if (isNewPost) {
      const finalHandle = handle.trim() || generateHandle(title);
      createPost.mutate(
        {
          title,
          handle: finalHandle,
          body_html: bodyHtml || undefined,
          summary_html: summaryHtml || undefined,
          author: author || undefined,
          blog_title: blogTitle || undefined,
          tags: tags || undefined,
          published,
          image_url: imageUrl || undefined,
        },
        {
          onSuccess: () => {
            setHasChanges(false);
            navigate("/admin/content/blog");
          },
        }
      );
    } else if (id) {
      updatePost.mutate(
        {
          id,
          updates: {
            title,
            body_html: bodyHtml,
            summary_html: summaryHtml || null,
            author: author || null,
            blog_title: blogTitle || null,
            tags: tags || null,
            published,
            image_url: imageUrl || null,
          },
        },
        {
          onSuccess: () => {
            setHasChanges(false);
          },
        }
      );
    }
  };

  const markChanged = () => setHasChanges(true);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Skeleton className="h-96" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!isNewPost && !post) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Blog post not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/admin/content/blog"
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="font-medium truncate max-w-md">
            {isNewPost ? "Create blog post" : title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isNewPost && handle && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to={getViewUrl()} target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    More actions
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={getViewUrl()} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on store
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-none rounded-l-md"
                  disabled={!prevPost}
                  onClick={() => prevPost && navigate(`/admin/content/blog/${prevPost.id}/edit`)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-none rounded-r-md border-l"
                  disabled={!nextPost}
                  onClick={() => nextPost && navigate(`/admin/content/blog/${nextPost.id}/edit`)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    markChanged();
                  }}
                  placeholder="Enter blog post title"
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <RichTextEditor
                  value={bodyHtml}
                  onChange={(val) => {
                    setBodyHtml(val);
                    markChanged();
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Excerpt Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base font-medium">Excerpt</CardTitle>
              {!isExcerptEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsExcerptEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              {isExcerptEditing ? (
                <div className="space-y-4">
                  <RichTextEditor
                    value={summaryHtml}
                    onChange={(val) => {
                      setSummaryHtml(val);
                      markChanged();
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setIsExcerptEditing(false)}
                    >
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsExcerptEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {summaryHtml ? (
                    <span dangerouslySetInnerHTML={{ __html: summaryHtml }} />
                  ) : (
                    "Add a summary of the post to appear on your home page or blog."
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          {/* SEO Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base font-medium">Search engine listing</CardTitle>
              {!isSeoEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsSeoEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              {isSeoEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="handle">URL handle</Label>
                    <Input
                      id="handle"
                      value={handle}
                      onChange={(e) => {
                        setHandle(e.target.value);
                        markChanged();
                      }}
                      placeholder="blog-post-handle"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setIsSeoEditing(false)}
                    >
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsSeoEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
              <div className="space-y-1">
                  <p className="text-sm font-medium text-primary">Paddy Pet Shop</p>
                  <p className="text-sm text-muted-foreground">
                    https://paddy.vn › blogs › {categorySlug} › {handle}
                  </p>
                  <p className="text-base text-primary hover:underline cursor-pointer">
                    {title}
                  </p>
                  {summaryHtml && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      <span dangerouslySetInnerHTML={{ __html: summaryHtml.replace(/<[^>]*>/g, '') }} />
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Visibility Card */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base font-medium">Visibility</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <RadioGroup
                value={published ? "visible" : "hidden"}
                onValueChange={(val) => {
                  setPublished(val === "visible");
                  markChanged();
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="visible" id="visible" />
                  <Label htmlFor="visible" className="font-normal">
                    Visible
                  </Label>
                </div>
                {post?.shopify_published_at && (
                  <p className="text-xs text-muted-foreground ml-6">
                    As of {format(new Date(post.shopify_published_at), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                )}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hidden" id="hidden" />
                  <Label htmlFor="hidden" className="font-normal">
                    Hidden
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Image Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-base font-medium">Image</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Recommended: 1200 × 628px</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="link" size="sm" className="text-primary h-auto p-0">
                    Edit
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsImagePickerOpen(true)}>
                    Change image
                  </DropdownMenuItem>
                  {imageUrl && (
                    <DropdownMenuItem
                      onClick={() => {
                        setImageUrl("");
                        markChanged();
                      }}
                      className="text-destructive"
                    >
                      Remove
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="pt-0">
              {imageUrl ? (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsImagePickerOpen(true)}
                  className="w-full aspect-video rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground hover:border-primary/50 transition-colors"
                >
                  Click to add image
                </button>
              )}
            </CardContent>
          </Card>

          {/* Organization Card */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base font-medium">Organization</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => {
                    setAuthor(e.target.value);
                    markChanged();
                  }}
                  placeholder="Enter author name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blog">Blog</Label>
                <Select
                  value={blogTitle}
                  onValueChange={(val) => {
                    setBlogTitle(val);
                    markChanged();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blog" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueBlogs.map((blog) => (
                      <SelectItem key={blog} value={blog!}>
                        {blog}
                      </SelectItem>
                    ))}
                    <SelectItem value="Paddy's Magazine">
                      Paddy's Magazine
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => {
                    setTags(e.target.value);
                    markChanged();
                  }}
                  placeholder="Comma-separated tags"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Save button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updatePost.isPending}
          size="lg"
        >
          {updatePost.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Image Picker Dialog */}
      <ImagePickerDialog
        open={isImagePickerOpen}
        onOpenChange={setIsImagePickerOpen}
        onSelect={(url) => {
          setImageUrl(url);
          markChanged();
        }}
        currentImage={imageUrl}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete blog post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (id) {
                  deletePost.mutate(id, {
                    onSuccess: () => navigate("/admin/content/blog"),
                  });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
