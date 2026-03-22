import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
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
  pet_type: string;
  display_order: number | null;
  productCount: number;
}

// Emoji + color mapping by slug keyword
const getCategoryStyle = (slug: string): { emoji: string; bg: string } => {
  const s = slug.toLowerCase();
  // Food
  if (s.includes("thuc-an-hat") || s.includes("hat-cho") || s.includes("hat-meo"))
    return { emoji: "🍖", bg: "hsl(40 60% 90%)" };
  if (s.includes("pate") || s.includes("do-an-uot") || s.includes("thuc-an-uot"))
    return { emoji: "🥫", bg: "hsl(40 60% 90%)" };
  if (s.includes("banh") || s.includes("xuong-gam") || s.includes("snack") || s.includes("treats") || s.includes("sup-thuong"))
    return { emoji: "🦴", bg: "hsl(40 60% 90%)" };
  if (s.includes("thuc-an") || s.includes("food"))
    return { emoji: "🍗", bg: "hsl(40 60% 90%)" };
  // Toys
  if (s.includes("do-choi") || s.includes("toy"))
    return { emoji: "🎾", bg: "hsl(210 70% 90%)" };
  // Health
  if (s.includes("suc-khoe") || s.includes("health") || s.includes("vitamin") || s.includes("bo-sung"))
    return { emoji: "💊", bg: "hsl(150 50% 90%)" };
  if (s.includes("tri-ve") || s.includes("so-giun") || s.includes("ky-sinh"))
    return { emoji: "🛡️", bg: "hsl(150 50% 90%)" };
  // Hygiene / litter
  if (s.includes("ve-sinh") || s.includes("cat-ve-sinh") || s.includes("ta-") || s.includes("khay"))
    return { emoji: "🧹", bg: "hsl(150 50% 90%)" };
  if (s.includes("dau-goi") || s.includes("sua-tam") || s.includes("cham-soc"))
    return { emoji: "🧴", bg: "hsl(270 40% 90%)" };
  if (s.includes("rang") || s.includes("mieng"))
    return { emoji: "🪥", bg: "hsl(150 50% 90%)" };
  // Accessories
  if (s.includes("phu-kien") || s.includes("day-dat") || s.includes("vong-co") || s.includes("accessori"))
    return { emoji: "🎒", bg: "hsl(270 40% 90%)" };
  if (s.includes("nem") || s.includes("chuong") || s.includes("nha") || s.includes("cat-tree") || s.includes("giuong"))
    return { emoji: "🏠", bg: "hsl(340 50% 92%)" };
  // Puppy/kitten
  if (s.includes("cho-con") || s.includes("puppy"))
    return { emoji: "🐶", bg: "hsl(340 50% 92%)" };
  if (s.includes("meo-con") || s.includes("kitten"))
    return { emoji: "🐱", bg: "hsl(340 50% 92%)" };
  // Fish (cat food)
  if (s.includes("ca") && s.includes("meo"))
    return { emoji: "🐟", bg: "hsl(210 70% 90%)" };
  // Fallback
  return { emoji: "📦", bg: "hsl(220 15% 93%)" };
};

const usePetCategories = (petType: "dog" | "cat") => {
  return useQuery({
    queryKey: ["pet-categories-with-counts", petType],
    queryFn: async () => {
      const { data: categories, error } = await supabase
        .from("categories")
        .select("id, name, slug, pet_type, display_order")
        .eq("is_active", true)
        .or(`pet_type.eq.${petType},pet_type.eq.both`)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;

      const { data: brands } = await supabase.from("brands").select("slug");
      const brandSlugs = new Set((brands || []).map((b) => b.slug));

      // Filter out brands first
      const filtered = (categories || []).filter((c) => !brandSlugs.has(c.slug));

      // Get product counts for each category in parallel
      const countsPromises = filtered.map(async (c) => {
        const { count } = await supabase
          .from("product_collections")
          .select("*", { count: "exact", head: true })
          .eq("collection_id", c.id);
        return { ...c, productCount: count || 0 };
      });

      const withCounts = await Promise.all(countsPromises);
      return withCounts.filter((c) => c.productCount > 0) as CategoryWithCount[];
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {categories.map((cat) => {
        const style = getCategoryStyle(cat.slug);
        return (
          <Link key={cat.id} to={`/collections/${cat.slug}`}>
            <div className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div
                className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: style.bg }}
              >
                {style.emoji}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                  {cat.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cat.productCount} sản phẩm
                </p>
              </div>
            </div>
          </Link>
        );
      })}
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
            style={{ backgroundColor: "#0849FF", minHeight: 180 }}
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
            style={{ backgroundColor: "#FFD700", minHeight: 180 }}
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
