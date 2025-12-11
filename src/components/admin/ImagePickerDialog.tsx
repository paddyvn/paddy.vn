import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Loader2, ImageIcon, Check, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type SourceFilter = "all" | "product" | "collection" | "blog" | "uploaded";

interface StorageFile {
  id: string;
  name: string;
  displayName: string;
  ext: string;
  publicUrl: string;
  source: SourceFilter;
}

const sourceLabels: Record<SourceFilter, string> = {
  all: "All sources",
  product: "Products",
  collection: "Collections",
  blog: "Blog",
  uploaded: "Uploaded",
};

interface ImagePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  currentImage?: string;
}

export function ImagePickerDialog({ 
  open, 
  onOpenChange, 
  onSelect,
  currentImage 
}: ImagePickerDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const extractFileName = (url: string): string => {
    try {
      const parts = url.split("/");
      return decodeURIComponent(parts[parts.length - 1]) || "Unknown";
    } catch {
      return "Unknown";
    }
  };

  const getFileExt = (name: string): string => {
    const ext = name.split('.').pop()?.toUpperCase() || 'IMG';
    return ext;
  };

  const truncateName = (name: string): string => {
    return name.length > 18 ? name.substring(0, 15) + '...' : name;
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const allFilesData: StorageFile[] = [];
      
      // Fetch product images from database
      const { data: productImages, error: productError } = await supabase
        .from("product_images")
        .select("id, image_url, alt_text")
        .order("created_at", { ascending: false })
        .limit(500);

      if (productError) throw productError;

      for (const img of productImages || []) {
        if (img.image_url) {
          const name = img.alt_text || extractFileName(img.image_url);
          allFilesData.push({
            id: img.id,
            name,
            displayName: truncateName(name),
            ext: getFileExt(img.image_url),
            publicUrl: img.image_url,
            source: "product",
          });
        }
      }
      
      // Fetch collection images
      const { data: collections, error: collectionError } = await supabase
        .from("categories")
        .select("id, name, image_url")
        .not("image_url", "is", null);
      
      if (collectionError) throw collectionError;
      
      for (const col of collections || []) {
        if (col.image_url) {
          const name = col.name || extractFileName(col.image_url);
          allFilesData.push({
            id: col.id,
            name,
            displayName: truncateName(name),
            ext: getFileExt(col.image_url),
            publicUrl: col.image_url,
            source: "collection",
          });
        }
      }

      // Fetch blog post images
      const { data: blogPosts, error: blogError } = await supabase
        .from("blog_posts")
        .select("id, title, image_url")
        .not("image_url", "is", null);
      
      if (blogError) throw blogError;
      
      for (const post of blogPosts || []) {
        if (post.image_url) {
          const name = post.title || extractFileName(post.image_url);
          allFilesData.push({
            id: post.id,
            name,
            displayName: truncateName(name),
            ext: getFileExt(post.image_url),
            publicUrl: post.image_url,
            source: "blog",
          });
        }
      }
      
      // Fetch files from storage root
      const { data: rootItems } = await supabase.storage
        .from("product-images")
        .list("", { limit: 100 });
      
      for (const item of rootItems || []) {
        if (item.id !== null && item.name.match(/\.(jpg|jpeg|png|webp|gif|avif)$/i)) {
          allFilesData.push({
            id: item.id,
            name: item.name,
            displayName: truncateName(item.name),
            ext: getFileExt(item.name),
            publicUrl: supabase.storage.from("product-images").getPublicUrl(item.name).data.publicUrl,
            source: "uploaded",
          });
        }
      }
      
      setFiles(allFilesData);
    } catch (error) {
      console.error("Failed to load files:", error);
      toast({
        title: "Failed to load files",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchFiles();
    }
  }, [open]);

  const filteredFiles = files.filter(file => {
    const matchesSearch = !searchQuery || file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === "all" || file.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `collection-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const publicUrl = supabase.storage.from("product-images").getPublicUrl(fileName).data.publicUrl;
      
      // Refresh the file list and auto-select
      await fetchFiles();
      setSelectedUrl(publicUrl);
      
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDone = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onOpenChange(false);
    }
  };

  const handleImageClick = (url: string) => {
    setSelectedUrl(selectedUrl === url ? null : url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Select image</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  {sourceLabels[sourceFilter]}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-background">
                {(Object.keys(sourceLabels) as SourceFilter[]).map((key) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setSourceFilter(key)}
                    className={cn(sourceFilter === key && "bg-accent")}
                  >
                    {sourceLabels[key]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Upload area */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                id="image-upload"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add files
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Drag and drop images</p>
          </div>

          {/* Image grid */}
          <ScrollArea className="flex-1 -mx-2">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFiles.length > 0 ? (
              <div className="grid grid-cols-6 gap-4 p-2">
                {filteredFiles.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => handleImageClick(file.publicUrl)}
                    className="text-left group"
                  >
                    <div
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden border-2 transition-all bg-muted",
                        selectedUrl === file.publicUrl 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <img
                        src={file.publicUrl}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Checkbox in top-left corner */}
                      <div className="absolute top-2 left-2">
                        <div className={cn(
                          "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                          selectedUrl === file.publicUrl
                            ? "bg-primary border-primary"
                            : "bg-background/80 border-muted-foreground/30 group-hover:border-muted-foreground/50"
                        )}>
                          {selectedUrl === file.publicUrl && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-foreground truncate">{file.displayName}</p>
                    <p className="text-xs text-muted-foreground">{file.ext}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-2" />
                <p>No images found</p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDone} disabled={!selectedUrl}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
