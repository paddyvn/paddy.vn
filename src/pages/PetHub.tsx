import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PetHubHero } from "@/components/PetHubHero";
import { PetHubCategories } from "@/components/PetHubCategories";
import { PetHubSidebar } from "@/components/PetHubSidebar";
import { PetHubProductGrid } from "@/components/PetHubProductGrid";
import { PetHubSeoContent } from "@/components/PetHubSeoContent";
import { usePetHubPage } from "@/hooks/usePetHubPage";
import { usePetHubCategories, PetHubCategory } from "@/hooks/usePetHubCategories";
import { usePetHubProducts, PetHubFilterState } from "@/hooks/usePetHubProducts";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

const DEFAULT_MAX_PRICE = 10000000;

interface PetHubProps {
  petType: "dog" | "cat";
}

const PetHub = ({ petType }: PetHubProps) => {
  const { data: hubPage } = usePetHubPage(petType);
  const { data: hubCategories } = usePetHubCategories(petType);
  const [sortBy, setSortBy] = useState("bestselling");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<PetHubFilterState>({
    brands: [],
    priceRange: [0, DEFAULT_MAX_PRICE],
    categorySlug: null,
  });

  const { data: productsData, isLoading } = usePetHubProducts(
    petType,
    filters,
    sortBy,
    page
  );

  const handleFiltersChange = (newFilters: PetHubFilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleCategorySelect = (slug: string | null) => {
    setFilters((prev) => ({ ...prev, categorySlug: slug }));
    setPage(1);
  };

  // FAQ JSON-LD
  const faqSchema =
    hubPage?.seo_faq && hubPage.seo_faq.length > 0
      ? JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: hubPage.seo_faq.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        })
      : null;

  const breadcrumbSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chủ",
        item: "https://paddy.vn",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: hubPage?.title || (petType === "dog" ? "Sản Phẩm Cho Chó" : "Sản Phẩm Cho Mèo"),
        item: `https://paddy.vn/${petType === "dog" ? "cho" : "meo"}`,
      },
    ],
  });

  return (
    <>
      <Helmet>
        <title>
          {hubPage?.meta_title ||
            (petType === "dog"
              ? "Sản Phẩm Cho Chó | Paddy.vn"
              : "Sản Phẩm Cho Mèo | Paddy.vn")}
        </title>
        {hubPage?.meta_description && (
          <meta name="description" content={hubPage.meta_description} />
        )}
        <link
          rel="canonical"
          href={`https://paddy.vn/${petType === "dog" ? "cho" : "meo"}`}
        />
        <script type="application/ld+json">{breadcrumbSchema}</script>
        {faqSchema && (
          <script type="application/ld+json">{faqSchema}</script>
        )}
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 pt-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Trang chủ</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {hubPage?.title ||
                    (petType === "dog"
                      ? "Sản Phẩm Cho Chó"
                      : "Sản Phẩm Cho Mèo")}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <PetHubHero hubPage={hubPage} petType={petType} />
        <PetHubCategories
          petType={petType}
          activeSlug={filters.categorySlug}
          onSelect={handleCategorySelect}
        />

        <div className="container mx-auto px-4 pb-8">
          {/* Mobile filter button */}
          <div className="lg:hidden mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Bộ lọc
                  {filters.brands.length > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {filters.brands.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Bộ lọc</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <PetHubSidebar
                    petType={petType}
                    categories={hubCategories}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop layout: sidebar + grid */}
          <div className="flex gap-6">
            <div className="hidden lg:block w-[240px] shrink-0">
              <PetHubSidebar
                petType={petType}
                categories={hubCategories}
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </div>
            <PetHubProductGrid
              products={productsData?.products}
              total={productsData?.total || 0}
              isLoading={isLoading}
              sortBy={sortBy}
              onSortChange={(s) => {
                setSortBy(s);
                setPage(1);
              }}
              page={page}
              onPageChange={setPage}
            />
          </div>
        </div>

        <PetHubSeoContent hubPage={hubPage} />
      </main>

      <Footer />
    </>
  );
};

export default PetHub;
