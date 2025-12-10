import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface ProductTagsInputProps {
  form: UseFormReturn<any>;
}

export function ProductTagsInput({ form }: ProductTagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  
  const tagsString = form.watch("tags") || "";
  const tags = tagsString
    .split(",")
    .map((t: string) => t.trim())
    .filter((t: string) => t.length > 0);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag].join(", ");
      form.setValue("tags", newTags);
    }
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((t: string) => t !== tagToRemove).join(", ");
    form.setValue("tags", newTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Add tags..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) {
              addTag(inputValue);
            }
          }}
        />
        
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: string) => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {tag}
                <button
                  type="button"
                  className="ml-1 hover:bg-muted-foreground/20 rounded p-0.5"
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No tags added
          </p>
        )}
      </CardContent>
    </Card>
  );
}
