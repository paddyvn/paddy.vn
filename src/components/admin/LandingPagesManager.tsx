import { useState } from "react";
import {
  useLandingPages,
  useCreateLandingPage,
  useUpdateLandingPage,
  useDeleteLandingPage,
  LandingPage,
} from "@/hooks/useLandingPages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Eye, Edit, Trash2, Check, X } from "lucide-react";

interface LandingPageForm {
  title: string;
  handle: string;
  external_url: string;
  meta_title: string;
  meta_description: string;
  og_image_url: string;
  show_header: boolean;
  show_footer: boolean;
  is_active: boolean;
}

const emptyForm: LandingPageForm = {
  title: "",
  handle: "",
  external_url: "",
  meta_title: "",
  meta_description: "",
  og_image_url: "",
  show_header: true,
  show_footer: true,
  is_active: true,
};

const generateHandle = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

export default function LandingPagesManager() {
  const { data: pages, isLoading } = useLandingPages();
  const createLP = useCreateLandingPage();
  const updateLP = useUpdateLandingPage();
  const deleteLP = useDeleteLandingPage();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LandingPage | null>(null);
  const [form, setForm] = useState<LandingPageForm>(emptyForm);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (lp: LandingPage) => {
    setForm({
      title: lp.title,
      handle: lp.handle,
      external_url: lp.external_url,
      meta_title: lp.meta_title || "",
      meta_description: lp.meta_description || "",
      og_image_url: lp.og_image_url || "",
      show_header: lp.show_header,
      show_footer: lp.show_footer,
      is_active: lp.is_active,
    });
    setEditingId(lp.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = {
      title: form.title,
      handle: form.handle || generateHandle(form.title),
      external_url: form.external_url,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      og_image_url: form.og_image_url || null,
      show_header: form.show_header,
      show_footer: form.show_footer,
      is_active: form.is_active,
    };

    if (editingId) {
      updateLP.mutate(
        { id: editingId, updates: payload },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createLP.mutate(payload as any, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const isSaving = createLP.isPending || updateLP.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            External pages embedded at paddy.vn/lp/&#123;handle&#125;
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Landing Page
        </Button>
      </div>

      <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">💡 Tip:</strong> When building campaign pages in separate Lovable projects, use{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">target="_top"</code>{" "}
        on links back to paddy.vn so they navigate the full browser instead of inside the iframe.
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Handle</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Header / Footer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !pages?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No landing pages yet. Click "Add Landing Page" to create one.
                </TableCell>
              </TableRow>
            ) : (
              pages.map((lp) => (
                <TableRow key={lp.id}>
                  <TableCell className="font-medium">{lp.title}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    /lp/{lp.handle}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">
                    {lp.external_url}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {lp.show_header ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className="text-muted-foreground">/</span>
                      {lp.show_footer ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={lp.is_active ? "default" : "secondary"}>
                      {lp.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(`/lp/${lp.handle}`, "_blank")}
                        title="View on store"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(lp)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDeleteTarget(lp)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Landing Page" : "Add Landing Page"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title (internal)</Label>
              <Input
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({
                    ...f,
                    title,
                    ...(!editingId ? { handle: generateHandle(title) } : {}),
                  }));
                }}
                placeholder="Tết Sale 2026"
              />
            </div>

            <div className="space-y-2">
              <Label>URL handle</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">paddy.vn/lp/</span>
                <Input
                  value={form.handle}
                  onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))}
                  placeholder="tet-sale-2026"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>External URL</Label>
              <Input
                value={form.external_url}
                onChange={(e) => setForm((f) => ({ ...f, external_url: e.target.value }))}
                placeholder="https://paddy-tet-sale.lovable.app"
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                The deployed URL of the landing page (from Lovable, Vercel, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Meta title (for social sharing)</Label>
              <Input
                value={form.meta_title}
                onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
                placeholder={form.title}
                maxLength={70}
              />
              <p className="text-xs text-muted-foreground">{form.meta_title.length}/70</p>
            </div>

            <div className="space-y-2">
              <Label>Meta description</Label>
              <Textarea
                value={form.meta_description}
                onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
                maxLength={160}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">{form.meta_description.length}/160</p>
            </div>

            <div className="space-y-2">
              <Label>OG image URL</Label>
              <Input
                value={form.og_image_url}
                onChange={(e) => setForm((f) => ({ ...f, og_image_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.show_header}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, show_header: v }))}
                />
                <Label className="font-normal">Show Paddy header</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.show_footer}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, show_footer: v }))}
                />
                <Label className="font-normal">Show Paddy footer</Label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
              <Label className="font-normal">Active</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.title || !form.external_url || isSaving}>
                {isSaving ? "Saving..." : editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete landing page?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.title}". The external site will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteLP.mutate(deleteTarget.id, {
                    onSuccess: () => setDeleteTarget(null),
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
