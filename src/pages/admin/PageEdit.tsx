import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUpdatePage, useCreatePage, useDeletePage, Page } from "@/hooks/usePages";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  ChevronLeft,
  Eye,
  Pencil,
  ChevronDown,
  ExternalLink,
  Trash2,
} from "lucide-react";

export default function PageEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewPage = id === "new";

  const updatePage = useUpdatePage();
  const createPage = useCreatePage();
  const deletePage = useDeletePage();

  const { data: page, isLoading } = useQuery({
    queryKey: ["admin-page", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as Page | null;
    },
    enabled: id !== "new" && !!id,
  });

  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [published, setPublished] = useState(true);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isSeoEditing, setIsSeoEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (page && !isNewPage) {
      setTitle(page.title);
      setHandle(page.handle);
      setBodyHtml(page.body_html || "");
      setPublished(page.published ?? true);
      setMetaTitle((page as any).meta_title || "");
      setMetaDescription((page as any).meta_description || "");
      setHasChanges(false);
    }
  }, [page, isNewPage]);

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

  const markChanged = () => setHasChanges(true);

  const handleSave = () => {
    if (isNewPage) {
      const finalHandle = handle.trim() || generateHandle(title);
      createPage.mutate(
        {
          title,
          handle: finalHandle,
          body_html: bodyHtml || null,
          published,
          meta_title: metaTitle || null,
          meta_description: metaDescription || null,
        },
        {
          onSuccess: () => {
            setHasChanges(false);
            navigate("/admin/content/pages");
          },
        }
      );
    } else if (id) {
      updatePage.mutate(
        {
          id,
          updates: {
            title,
            handle,
            body_html: bodyHtml,
            published,
            meta_title: metaTitle || null,
            meta_description: metaDescription || null,
          } as any,
        },
        { onSuccess: () => setHasChanges(false) }
      );
    }
  };

  const isSaving = createPage.isPending || updatePage.isPending;

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
          </div>
        </div>
      </div>
    );
  }

  if (!isNewPage && !page) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Page not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/admin/content/pages"
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="font-medium truncate max-w-md">
            {isNewPage ? "Create page" : title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isNewPage && handle && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/pages/${handle}`} target="_blank">
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
                    <Link to={`/pages/${handle}`} target="_blank">
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
                    Delete page
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title + Content Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (isNewPage) {
                      setHandle(generateHandle(e.target.value));
                    }
                    markChanged();
                  }}
                  placeholder="Enter page title"
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
                    <Label htmlFor="metaTitle">Page title</Label>
                    <Input
                      id="metaTitle"
                      value={metaTitle}
                      onChange={(e) => { setMetaTitle(e.target.value); markChanged(); }}
                      placeholder={title || "Page title for search engines"}
                      maxLength={70}
                    />
                    <p className="text-xs text-muted-foreground">{metaTitle.length}/70 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metaDescription">Meta description</Label>
                    <Textarea
                      id="metaDescription"
                      value={metaDescription}
                      onChange={(e) => { setMetaDescription(e.target.value); markChanged(); }}
                      placeholder="Brief description for search engines..."
                      maxLength={160}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">{metaDescription.length}/160 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="handle">URL handle</Label>
                    <Input
                      id="handle"
                      value={handle}
                      onChange={(e) => { setHandle(e.target.value); markChanged(); }}
                      placeholder="page-handle"
                    />
                  </div>

                  <Button size="sm" onClick={() => setIsSeoEditing(false)}>Done</Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-primary">Paddy Pet Shop</p>
                  <p className="text-sm text-muted-foreground">
                    https://paddy.vn › pages › {handle}
                  </p>
                  <p className="text-base text-primary hover:underline cursor-pointer">
                    {metaTitle || title || "Page title"}
                  </p>
                  {metaDescription && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{metaDescription}</p>
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
                  <Label htmlFor="visible" className="font-normal">Published</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hidden" id="hidden" />
                  <Label htmlFor="hidden" className="font-normal">Draft</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Save button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          size="lg"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete page?</AlertDialogTitle>
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
                  deletePage.mutate(id, {
                    onSuccess: () => navigate("/admin/content/pages"),
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
