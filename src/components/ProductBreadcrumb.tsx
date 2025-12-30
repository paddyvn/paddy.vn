import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductBreadcrumbProps {
  productName: string;
  categoryName?: string | null;
  categorySlug?: string | null;
}

export function ProductBreadcrumb({ productName, categoryName, categorySlug }: ProductBreadcrumbProps) {
  return (
    <nav className="container mx-auto px-4 py-2 overflow-hidden">
      <div className="text-xs text-muted-foreground leading-relaxed">
        <Link to="/" className="hover:text-primary transition-smooth">
          Home
        </Link>

        <ChevronRight className="h-3 w-3 mx-1 inline-block align-middle" />

        {categoryName && categorySlug ? (
          <>
            <Link to={`/collections/${categorySlug}`} className="hover:text-primary transition-smooth">
              {categoryName}
            </Link>
            <ChevronRight className="h-3 w-3 mx-1 inline-block align-middle" />
          </>
        ) : (
          <>
            <Link to="/" className="hover:text-primary transition-smooth">
              Products
            </Link>
            <ChevronRight className="h-3 w-3 mx-1 inline-block align-middle" />
          </>
        )}

        <span className="text-foreground font-medium">
          {productName}
        </span>
      </div>
    </nav>
  );
}
