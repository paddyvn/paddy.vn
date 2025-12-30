import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductBreadcrumbProps {
  productName: string;
  categoryName?: string | null;
  categorySlug?: string | null;
}

export function ProductBreadcrumb({ productName, categoryName, categorySlug }: ProductBreadcrumbProps) {
  return (
    <nav className="container mx-auto px-4 py-2 overflow-x-hidden">
      <ol className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap min-w-0">
        <li className="flex-shrink-0">
          <Link to="/" className="hover:text-primary transition-smooth">
            Home
          </Link>
        </li>

        <ChevronRight className="h-3 w-3 flex-shrink-0" />

        {categoryName && categorySlug ? (
          <>
            <li className="flex-shrink-0">
              <Link to={`/collections/${categorySlug}`} className="hover:text-primary transition-smooth">
                {categoryName}
              </Link>
            </li>
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
          </>
        ) : (
          <>
            <li className="flex-shrink-0">
              <Link to="/" className="hover:text-primary transition-smooth">
                Products
              </Link>
            </li>
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
          </>
        )}

        <li className="text-foreground font-medium line-clamp-1 min-w-0 break-words">
          {productName}
        </li>
      </ol>
    </nav>
  );
}
