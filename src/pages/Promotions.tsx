import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DealsGrid } from "@/components/DealsGrid";
import { VouchersSection } from "@/components/VouchersSection";
import { DealsSidebar } from "@/components/DealsSidebar";
import { DealsProductGrid } from "@/components/DealsProductGrid";
import { useDealsProducts, DEFAULT_DEALS_FILTERS, DealsFilterState } from "@/hooks/useDealsProducts";
import { useActiveHomepageCategories } from "@/hooks/useHomepageCategories";
import { CategoryIllustration } from "@/components/CategoryIllustrations";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
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

const PET_TABS = [
  { id: "dog" as const, label: "Chó", emoji: "🐕" },
  { id: "cat" as const, label: "Mèo", emoji: "🐈" },
];

const Promotions = () => {
  const [filters, setFilters] = useState<DealsFilterState>(DEFAULT_DEALS_FILTERS);
  const [sortBy, setSortBy] = useState("discount_desc");
  const [page, setPage] = useState(1);
  const [activePet, setActivePet] = useState<"dog" | "cat">("dog");

  const { data: categories = [] } = useActiveHomepageCategories(activePet);
  const { data: productsData, isLoading } = useDealsProducts(filters, sortBy, page);

  const handleFiltersChange = (newFilters: DealsFilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setPage(1);
  };

  const handleCategoryClick = (slug: string) => {
    const newSlug = filters.categorySlug === slug ? null : slug;
    handleFiltersChange({ ...filters, categorySlug: newSlug });
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

        {/* Category circle filters */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Lọc theo danh mục
            </h3>
            <div className="flex gap-1 bg-muted rounded-xl p-[3px]">
              {PET_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActivePet(tab.id);
                    handleFiltersChange({ ...filters, categorySlug: null });
                  }}
                  className={cn(
                    "px-3 py-1 rounded-[9px] text-xs font-bold transition-all duration-200 flex items-center gap-1",
                    activePet === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="text-xs">{tab.emoji}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            {categories
              .filter((cat) => cat.icon !== "deals")
              .map((cat) => {
                const isActive = filters.categorySlug === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoryClick(cat.slug)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 flex-shrink-0 w-[72px] sm:w-[84px] py-2 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-primary/10 ring-2 ring-primary"
                        : "hover:bg-muted/60"
                    )}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center p-1.5 transition-transform",
                        isActive
                          ? "bg-primary/15 scale-105"
                          : "bg-gradient-to-br from-[hsl(235,67%,95%)] to-muted"
                      )}
                    >
                      <CategoryIllustration type={cat.icon} />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] sm:text-xs font-medium text-center leading-tight line-clamp-2",
                        isActive ? "text-primary font-bold" : "text-foreground"
                      )}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

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
