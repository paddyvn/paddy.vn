import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StorageFile {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  metadata: {
    size: number;
    mimetype: string;
    cacheControl: string;
  };
  publicUrl: string;
}

export function useStorageFiles(bucketName = "product-images") {
  const { toast } = useToast();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFilesRecursively = async (path: string): Promise<StorageFile[]> => {
    const files: StorageFile[] = [];
    
    const { data: items, error } = await supabase.storage
      .from(bucketName)
      .list(path, { limit: 1000 });
    
    if (error) {
      console.error(`Error listing ${path}:`, error);
      return files;
    }
    
    for (const item of items || []) {
      const fullPath = path ? `${path}/${item.name}` : item.name;
      
      if (item.id === null) {
        // This is a folder - recurse into it
        const nestedFiles = await fetchFilesRecursively(fullPath);
        files.push(...nestedFiles);
      } else {
        // This is a file
        files.push({
          id: item.id,
          name: fullPath,
          created_at: item.created_at,
          updated_at: item.updated_at,
          metadata: item.metadata as { size: number; mimetype: string; cacheControl: string },
          publicUrl: supabase.storage.from(bucketName).getPublicUrl(fullPath).data.publicUrl,
        });
      }
    }
    
    return files;
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const allFilesData = await fetchFilesRecursively("");
      
      // Sort by created_at descending
      allFilesData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setFiles(allFilesData);
    } catch (error) {
      toast({
        title: "Failed to load files",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, path?: string) => {
    try {
      const fileName = path || `${Date.now()}-${file.name}`;
      
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      toast({
        title: "File uploaded",
        description: `${file.name} uploaded successfully`,
      });

      await fetchFiles();
      return true;
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteFile = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);

      if (error) throw error;

      toast({
        title: "File deleted",
        description: `${fileName} deleted successfully`,
      });

      await fetchFiles();
      return true;
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      });
      return false;
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copied",
      description: "File URL copied to clipboard",
    });
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    files: filteredFiles,
    allFiles: files,
    loading,
    searchQuery,
    setSearchQuery,
    uploadFile,
    deleteFile,
    copyUrl,
    refetch: fetchFiles,
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

export { formatFileSize };
