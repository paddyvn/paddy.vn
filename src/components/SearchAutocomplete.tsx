import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, Tag, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Suggestion {
  suggestion: string;
  type: string;
  slug: string;
  image_url: string | null;
}

interface SearchAutocompleteProps {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  isMobile?: boolean;
}

export const SearchAutocomplete = ({
  className = "",
  inputClassName = "",
  placeholder = "Tìm kiếm sản phẩm...",
  isMobile = false,
}: SearchAutocompleteProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc("search_suggestions", {
          p_query: query.trim(),
          p_limit: 8,
        });

        if (error) throw error;
        setSuggestions((data as Suggestion[]) || []);
        setShowDropdown(true);
      } catch (error) {
        console.error("Search error:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelect = (item: Suggestion) => {
    setShowDropdown(false);
    setQuery("");
    if (item.type === "product") {
      navigate(`/products/${item.slug}`);
    } else if (item.type === "brand") {
      navigate(`/brands-thuong-hieu-thu-cung/${item.slug}`);
    } else if (item.type === "category") {
      navigate(`/collections/${item.slug}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === "brand") return <Store className="h-3 w-3 text-muted-foreground" />;
    if (type === "category") return <Tag className="h-3 w-3 text-muted-foreground" />;
    return null;
  };

  const getTypeLabel = (type: string) => {
    if (type === "brand") return "Thương hiệu";
    if (type === "category") return "Danh mục";
    return null;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative w-full">
          <Input
            ref={inputRef}
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            onKeyDown={handleKeyDown}
            className={inputClassName}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className={`absolute right-1 top-1/2 -translate-y-1/2 ${
              isMobile ? "h-8 w-8" : "h-9 w-9"
            } text-muted-foreground hover:text-foreground hover:bg-muted`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-[100] overflow-hidden">
          {suggestions.length > 0 ? (
            <>
              <ul className="max-h-[400px] overflow-y-auto">
                {suggestions.map((item, index) => (
                  <li key={`${item.type}-${item.slug}-${index}`}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left ${
                        index === selectedIndex ? "bg-muted" : ""
                      }`}
                    >
                      <img
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.suggestion}
                        className="w-12 h-12 object-contain rounded bg-muted flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.suggestion}</p>
                        {(item.type === "brand" || item.type === "category") && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {getTypeIcon(item.type)}
                            {getTypeLabel(item.type)}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              {query.trim() && (
                <button
                  type="button"
                  onClick={handleSubmit as any}
                  className="w-full p-3 text-sm text-center text-primary hover:bg-muted border-t border-border transition-colors"
                >
                  Xem tất cả kết quả cho "{query}"
                </button>
              )}
            </>
          ) : !isLoading && query.trim().length >= 2 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Không tìm thấy kết quả cho "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
