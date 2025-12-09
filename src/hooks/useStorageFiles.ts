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

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const allFilesData: StorageFile[] = [];
      
      // List top-level folders
      const { data: rootItems, error: rootError } = await supabase.storage
        .from(bucketName)
        .list("", { limit: 100 });
      
      if (rootError) throw rootError;
      
      const folders: string[] = [];
      
      for (const item of rootItems || []) {
        if (item.id === null) {
          folders.push(item.name);
        } else {
          allFilesData.push({
            id: item.id,
            name: item.name,
            created_at: item.created_at,
            updated_at: item.updated_at,
            metadata: item.metadata as { size: number; mimetype: string; cacheControl: string },
            publicUrl: supabase.storage.from(bucketName).getPublicUrl(item.name).data.publicUrl,
          });
        }
      }
      
      // Fetch files from each top-level folder with 2 levels of depth
      for (const folder of folders) {
        const { data: folderItems } = await supabase.storage
          .from(bucketName)
          .list(folder, { limit: 200 });
        
        for (const item of folderItems || []) {
          if (item.id === null) {
            // This is a subfolder - list its contents (level 2)
            const subPath = `${folder}/${item.name}`;
            const { data: subItems } = await supabase.storage
              .from(bucketName)
              .list(subPath, { limit: 100 });
            
            for (const subItem of subItems || []) {
              if (subItem.id === null) {
                // Level 3 subfolder
                const subSubPath = `${subPath}/${subItem.name}`;
                const { data: subSubItems } = await supabase.storage
                  .from(bucketName)
                  .list(subSubPath, { limit: 50 });
                
                for (const subSubItem of subSubItems || []) {
                  if (subSubItem.id !== null) {
                    const fullPath = `${subSubPath}/${subSubItem.name}`;
                    allFilesData.push({
                      id: subSubItem.id,
                      name: fullPath,
                      created_at: subSubItem.created_at,
                      updated_at: subSubItem.updated_at,
                      metadata: subSubItem.metadata as { size: number; mimetype: string; cacheControl: string },
                      publicUrl: supabase.storage.from(bucketName).getPublicUrl(fullPath).data.publicUrl,
                    });
                  }
                }
              } else {
                const fullPath = `${subPath}/${subItem.name}`;
                allFilesData.push({
                  id: subItem.id,
                  name: fullPath,
                  created_at: subItem.created_at,
                  updated_at: subItem.updated_at,
                  metadata: subItem.metadata as { size: number; mimetype: string; cacheControl: string },
                  publicUrl: supabase.storage.from(bucketName).getPublicUrl(fullPath).data.publicUrl,
                });
              }
            }
          } else {
            const fullPath = `${folder}/${item.name}`;
            allFilesData.push({
              id: item.id,
              name: fullPath,
              created_at: item.created_at,
              updated_at: item.updated_at,
              metadata: item.metadata as { size: number; mimetype: string; cacheControl: string },
              publicUrl: supabase.storage.from(bucketName).getPublicUrl(fullPath).data.publicUrl,
            });
          }
        }
      }
      
      allFilesData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
