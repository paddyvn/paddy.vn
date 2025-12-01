import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductBreadcrumbProps {
  productName: string;
  categoryName?: string | null;
  categorySlug?: string | null;
}

export function ProductBreadcrumb({ productName, categoryName, categorySlug }: ProductBreadcrumbProps) {
  return (
    <nav className="container mx-auto px-4 py-4">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        <li>
          <Link to="/" className="hover:text-primary transition-smooth">
            Home
          </Link>
        </li>
        
        <ChevronRight className="h-4 w-4" />
        
        {categoryName && categorySlug ? (
          <>
            <li>
              <Link to={`/collections/${categorySlug}`} className="hover:text-primary transition-smooth">
                {categoryName}
              </Link>
            </li>
            <ChevronRight className="h-4 w-4" />
          </>
        ) : (
          <>
            <li>
              <Link to="/" className="hover:text-primary transition-smooth">
                Products
              </Link>
            </li>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        
        <li className="text-foreground font-medium line-clamp-1">
          {productName}
        </li>
      </ol>
    </nav>
  );
}
