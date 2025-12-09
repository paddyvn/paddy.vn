import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { StorageFileBrowser } from "@/components/StorageFileBrowser";
import { useState } from "react";

export default function ContentFiles() {
  const [isFileBrowserOpen, setIsFileBrowserOpen] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Files</h2>
          <p className="text-muted-foreground">
            Manage images, videos, and other media assets
          </p>
        </div>
      </div>

      <Collapsible open={isFileBrowserOpen} onOpenChange={setIsFileBrowserOpen}>
        <div className="rounded-lg border bg-card">
          <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-accent/50 transition-colors">
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold">File Browser</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Browse, upload, and manage all files in Supabase Storage
              </p>
            </div>
            {isFileBrowserOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="px-6 pb-6">
              <StorageFileBrowser />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
