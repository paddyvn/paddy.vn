import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Loader2, ImageIcon, Check } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: files, isLoading } = useQuery({
    queryKey: ["storage-images-picker", searchQuery],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("product-images")
        .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

      if (error) throw error;

      const imageFiles = data
        .filter(file => file.name.match(/\.(jpg|jpeg|png|webp|gif|avif)$/i))
        .filter(file => !searchQuery || file.name.toLowerCase().includes(searchQuery.toLowerCase()));

      return imageFiles.map(file => {
        const ext = file.name.split('.').pop()?.toUpperCase() || 'IMG';
        return {
          name: file.name,
          displayName: file.name.length > 18 ? file.name.substring(0, 15) + '...' : file.name,
          ext,
          url: `https://fexafkqzpbzjcupvbfhe.supabase.co/storage/v1/object/public/product-images/${file.name}`,
        };
      });
    },
    enabled: open,
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

      const publicUrl = `https://fexafkqzpbzjcupvbfhe.supabase.co/storage/v1/object/public/product-images/${fileName}`;
      
      // Refresh the file list
      queryClient.invalidateQueries({ queryKey: ["storage-images-picker"] });
      
      // Auto-select the newly uploaded image
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
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : files && files.length > 0 ? (
              <div className="grid grid-cols-6 gap-4 p-2">
                {files.map((file) => (
                  <button
                    key={file.name}
                    type="button"
                    onClick={() => handleImageClick(file.url)}
                    className="text-left group"
                  >
                    <div
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden border-2 transition-all bg-muted",
                        selectedUrl === file.url 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Checkbox in top-left corner */}
                      <div className="absolute top-2 left-2">
                        <div className={cn(
                          "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                          selectedUrl === file.url
                            ? "bg-primary border-primary"
                            : "bg-background/80 border-muted-foreground/30 group-hover:border-muted-foreground/50"
                        )}>
                          {selectedUrl === file.url && (
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
