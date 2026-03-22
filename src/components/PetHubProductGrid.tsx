import { ProductCard } from "@/components/ProductCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useProductsPromotions } from "@/hooks/useProductPromotions";
import { useAllProductVouchers } from "@/hooks/useProductVouchers";

const PRODUCTS_PER_PAGE = 20;

interface PetHubProductGridProps {
  products: any[] | undefined;
  total: number;
  isLoading: boolean;
  sortBy: string;
  onSortChange: (sort: string) => void;
  page: number;
  onPageChange: (page: number) => void;
}

export const PetHubProductGrid = ({
  products,
  total,
  isLoading,
  sortBy,
  onSortChange,
  page,
  onPageChange,
}: PetHubProductGridProps) => {
  const productIds = (products || []).map((p) => p.id);
  const { data: promotionsMap } = useProductsPromotions(productIds);
  const { data: vouchersMap } = useAllProductVouchers();

  const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE);

  return (
    <div className="flex-1 min-w-0">
      {/* Sort bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {total > 0
            ? `${total} sản phẩm`
            : isLoading
            ? ""
            : "Không tìm thấy sản phẩm"}
        </p>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bestselling">Bán chạy nhất</SelectItem>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="price_asc">Giá thấp → cao</SelectItem>
            <SelectItem value="price_desc">Giá cao → thấp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {(products || []).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              promotion={promotionsMap?.[product.id]}
              vouchers={vouchersMap?.[product.id]}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (page <= 4) {
              pageNum = i + 1;
            } else if (page >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = page - 3 + i;
            }
            return (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                size="icon"
                className="h-9 w-9"
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
