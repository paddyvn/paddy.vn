import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DealsGrid } from "@/components/DealsGrid";
import { VouchersSection } from "@/components/VouchersSection";
import { DealsSidebar } from "@/components/DealsSidebar";
import { DealsProductGrid } from "@/components/DealsProductGrid";
import { useDealsProducts, DEFAULT_DEALS_FILTERS, DealsFilterState } from "@/hooks/useDealsProducts";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const DISCOUNT_CHIPS = [
  { value: 0, label: "Tất cả" },
  { value: 10, label: "10%+" },
  { value: 20, label: "20%+" },
  { value: 30, label: "30%+" },
  { value: 50, label: "50%+" },
];

const Promotions = () => {
  const [filters, setFilters] = useState<DealsFilterState>(DEFAULT_DEALS_FILTERS);
  const [sortBy, setSortBy] = useState("discount_desc");
  const [page, setPage] = useState(1);

  const { data: productsData, isLoading } = useDealsProducts(filters, sortBy, page);

  const handleFiltersChange = (newFilters: DealsFilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Khuyến Mãi & Giảm Giá | Paddy.vn</title>
        <meta
          name="description"
          content="Khám phá 300+ sản phẩm đang giảm giá tại Paddy.vn. Thức ăn, đồ chơi, phụ kiện cho chó mèo giá tốt. Freeship đơn từ 500K."
        />
      </Helmet>

      <Header />

      <main>
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 pt-4 pb-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Khuyến mãi</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Page title */}
        <div className="container mx-auto px-4 pb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Khuyến Mãi & Ưu Đãi
          </h1>
          <p className="text-muted-foreground mt-1">
            {productsData?.total
              ? `${productsData.total} sản phẩm đang giảm giá tại Paddy`
              : "Khám phá các ưu đãi hấp dẫn dành cho thú cưng"}
          </p>
        </div>

        {/* Section A: Promo bento banner */}
        <DealsGrid hideViewAll />

        {/* Section B: Voucher strip */}
        <VouchersSection />

        {/* Section C: Products grid with sidebar */}
        <div className="container mx-auto px-4 py-6">
          {/* Mobile: discount chips + filter button */}
          <div className="flex items-center gap-2 mb-4 md:hidden">
            <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {DISCOUNT_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => handleFiltersChange({ ...filters, minDiscount: chip.value })}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filters.minDiscount === chip.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex-shrink-0">
                  <SlidersHorizontal className="h-4 w-4 mr-1" />
                  Bộ lọc
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>Bộ lọc</SheetTitle>
                </SheetHeader>
                <div className="mt-4 overflow-y-auto max-h-[calc(100vh-100px)]">
                  <DealsSidebar filters={filters} onFiltersChange={handleFiltersChange} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex gap-6">
            {/* Desktop sidebar */}
            <div className="hidden md:block w-[220px] flex-shrink-0">
              <DealsSidebar filters={filters} onFiltersChange={handleFiltersChange} />
            </div>

            {/* Product grid */}
            <DealsProductGrid
              products={productsData?.products}
              total={productsData?.total || 0}
              isLoading={isLoading}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              page={page}
              onPageChange={setPage}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Promotions;
