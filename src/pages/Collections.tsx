import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowRight } from "lucide-react";

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  pet_type: string;
  display_order: number | null;
}

const usePetCategories = (petType: "dog" | "cat") => {
  return useQuery({
    queryKey: ["pet-categories-with-products", petType],
    queryFn: async () => {
      // Get categories for this pet type that are active and not brands
      const { data: categories, error } = await supabase
        .from("categories")
        .select("id, name, slug, image_url, pet_type, display_order")
        .eq("is_active", true)
        .eq("pet_type", petType)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;

      // Get brand slugs to exclude
      const { data: brands } = await supabase
        .from("brands")
        .select("slug");
      const brandSlugs = new Set((brands || []).map((b) => b.slug));

      // Get categories that have products via product_collections
      const { data: activeCatIds } = await supabase
        .from("product_collections")
        .select("collection_id")
        .limit(10000);
      const activeIds = new Set((activeCatIds || []).map((pc) => pc.collection_id));

      return (categories || []).filter(
        (c) => !brandSlugs.has(c.slug) && activeIds.has(c.id)
      ) as CategoryWithCount[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

const CategoryGrid = ({
  categories,
  isLoading,
}: {
  categories: CategoryWithCount[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">
        Chưa có danh mục nào.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {categories.map((cat) => (
        <Link key={cat.id} to={`/collections/${cat.slug}`}>
          <Card className="group overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200">
            <CardContent className="p-0">
              <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                    <span className="text-3xl">📦</span>
                  </div>
                )}
              </div>
              <div className="p-3 text-center">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {cat.name}
                </h3>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

const Collections = () => {
  const { data: dogCategories = [], isLoading: loadingDog } =
    usePetCategories("dog");
  const { data: catCategories = [], isLoading: loadingCat } =
    usePetCategories("cat");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Danh Mục Sản Phẩm | Paddy.vn</title>
        <meta
          name="description"
          content="Khám phá tất cả danh mục sản phẩm cho thú cưng tại Paddy.vn — thức ăn, phụ kiện, chăm sóc sức khỏe cho chó và mèo."
        />
      </Helmet>

      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-5">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Trang chủ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Danh mục</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
            Danh Mục Sản Phẩm
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Khám phá tất cả danh mục sản phẩm cho thú cưng
          </p>
        </div>

        {/* Hero cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link
            to="/cho"
            className="group relative overflow-hidden rounded-2xl p-6 sm:p-8 flex flex-col justify-between"
            style={{
              backgroundColor: "#0849FF",
              minHeight: 180,
            }}
          >
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                Sản Phẩm Cho Chó 🐕
              </h2>
              <p className="text-white/80 text-sm">
                Thức ăn, phụ kiện, chăm sóc sức khỏe
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-white font-semibold text-sm mt-4 group-hover:gap-2 transition-all">
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            to="/meo"
            className="group relative overflow-hidden rounded-2xl p-6 sm:p-8 flex flex-col justify-between"
            style={{
              backgroundColor: "#FFD700",
              minHeight: 180,
            }}
          >
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                Sản Phẩm Cho Mèo 🐈
              </h2>
              <p className="text-foreground/70 text-sm">
                Thức ăn, phụ kiện, chăm sóc sức khỏe
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-foreground font-semibold text-sm mt-4 group-hover:gap-2 transition-all">
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>

        {/* Dog categories */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            🐕 Danh mục cho Chó
          </h2>
          <CategoryGrid categories={dogCategories} isLoading={loadingDog} />
        </section>

        {/* Cat categories */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            🐈 Danh mục cho Mèo
          </h2>
          <CategoryGrid categories={catCategories} isLoading={loadingCat} />
        </section>

        {/* Brands banner */}
        <Link
          to="/brands-thuong-hieu-thu-cung"
          className="block rounded-2xl border border-border bg-muted/40 p-6 sm:p-8 text-center hover:bg-muted/70 transition-colors group"
        >
          <p className="text-base sm:text-lg font-bold text-foreground mb-1">
            200+ thương hiệu chính hãng
          </p>
          <span className="inline-flex items-center gap-1 text-primary font-semibold text-sm group-hover:gap-2 transition-all">
            Xem tất cả thương hiệu <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </main>

      <Footer />
    </div>
  );
};

export default Collections;
