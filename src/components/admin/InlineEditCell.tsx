import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InlineEditCellProps {
  value: string | number;
  onSave: (newValue: string | number) => Promise<void>;
  type?: "text" | "number";
  formatDisplay?: (value: string | number) => string;
  className?: string;
  inputClassName?: string;
}

export const InlineEditCell = ({
  value,
  onSave,
  type = "text",
  formatDisplay,
  className,
  inputClassName,
}: InlineEditCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  const handleSave = async () => {
    const newValue = type === "number" ? parseFloat(editValue) || 0 : editValue;
    
    if (newValue !== value) {
      setIsSaving(true);
      try {
        await onSave(newValue);
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(String(value));
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className={cn("h-7 py-1 px-2 text-sm", inputClassName)}
      />
    );
  }

  const displayValue = formatDisplay ? formatDisplay(value) : String(value) || "—";

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer hover:bg-accent hover:text-accent-foreground rounded px-2 py-1 -mx-2 transition-colors",
        className
      )}
      title="Click to edit"
    >
      {displayValue}
    </span>
  );
};
