import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useUpdateCustomer } from "@/hooks/useCustomers";

interface CustomerTagsInputProps {
  customerId: string;
  initialTags: string | null;
}

export function CustomerTagsInput({ customerId, initialTags }: CustomerTagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const updateCustomer = useUpdateCustomer();
  
  const tagsString = initialTags || "";
  const tags = tagsString
    .split(",")
    .map((t: string) => t.trim())
    .filter((t: string) => t.length > 0);

  const saveTags = (newTagsArray: string[]) => {
    const newTags = newTagsArray.join(", ");
    updateCustomer.mutate({
      id: customerId,
      updates: {
        tags: newTags || null,
      },
    });
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      saveTags(newTags);
    }
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((t: string) => t !== tagToRemove);
    saveTags(newTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Tags</CardTitle>
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
          className="text-sm"
        />
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag: string) => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center gap-1 pr-1 text-xs"
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
        )}
      </CardContent>
    </Card>
  );
}
