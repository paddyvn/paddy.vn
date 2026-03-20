import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";

// Storefront pages - eagerly loaded (customer-facing, fast first paint)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProductDetail from "./pages/ProductDetail";
import Collection from "./pages/Collection";
import Collections from "./pages/Collections";
import Brands from "./pages/Brands";
import Blog from "./pages/Blog";
import BlogPostDetail from "./pages/BlogPostDetail";
import Search from "./pages/Search";
import FlashSale from "./pages/FlashSale";
import Promotions from "./pages/Promotions";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
const PageDetail = lazy(() => import("./pages/PageDetail"));

// Admin pages - lazy loaded (only downloaded when admin navigates there)
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const ProductsManagement = lazy(() => import("./pages/admin/ProductsManagement"));
const ProductEdit = lazy(() => import("./pages/admin/ProductEdit"));
const CollectionsManagement = lazy(() => import("./pages/admin/CollectionsManagement"));
const CollectionDetails = lazy(() => import("./pages/admin/CollectionDetails"));
const OrdersManagement = lazy(() => import("./pages/admin/OrdersManagement"));
const OrderDetail = lazy(() => import("./pages/admin/OrderDetail"));
const OrderEdit = lazy(() => import("./pages/admin/OrderEdit"));
const CustomersManagement = lazy(() => import("./pages/admin/CustomersManagement"));
const CustomerSegments = lazy(() => import("./pages/admin/CustomerSegments"));
const CustomerDetail = lazy(() => import("./pages/admin/CustomerDetail"));
const AbandonedCheckouts = lazy(() => import("./pages/admin/AbandonedCheckouts"));
const ContentMetaobjects = lazy(() => import("./pages/admin/ContentMetaobjects"));
const ContentFiles = lazy(() => import("./pages/admin/ContentFiles"));
const ContentMenus = lazy(() => import("./pages/admin/ContentMenus"));
const ContentBlog = lazy(() => import("./pages/admin/ContentBlog"));
const BlogPostEdit = lazy(() => import("./pages/admin/BlogPostEdit"));
const BlogCategories = lazy(() => import("./pages/admin/BlogCategories"));
const ContentAIGenerator = lazy(() => import("./pages/admin/ContentAIGenerator"));
const Pages = lazy(() => import("./pages/admin/Pages"));
const MarketingBanners = lazy(() => import("./pages/admin/MarketingBanners"));
const PromotionsManagement = lazy(() => import("./pages/admin/PromotionsManagement"));
const PromotionEdit = lazy(() => import("./pages/admin/PromotionEdit"));
const FlashSaleEdit = lazy(() => import("./pages/admin/promotions/FlashSaleEdit"));
const DiscountsEdit = lazy(() => import("./pages/admin/promotions/DiscountsEdit"));
const VouchersEdit = lazy(() => import("./pages/admin/promotions/VouchersEdit"));
const ComboBuyEdit = lazy(() => import("./pages/admin/promotions/ComboBuyEdit"));
const BuyMoreSaveMoreEdit = lazy(() => import("./pages/admin/promotions/BuyMoreSaveMoreEdit"));
const FreeShippingEdit = lazy(() => import("./pages/admin/promotions/FreeShippingEdit"));
const SubscriptionDealsEdit = lazy(() => import("./pages/admin/promotions/SubscriptionDealsEdit"));
const ClearanceEdit = lazy(() => import("./pages/admin/promotions/ClearanceEdit"));
const InventorySync = lazy(() => import("./pages/admin/InventorySync"));
const BrandsManagement = lazy(() => import("./pages/admin/BrandsManagement"));
const BrandDetails = lazy(() => import("./pages/admin/BrandDetails"));
const SalesAnalytics = lazy(() => import("./pages/admin/SalesAnalytics"));
const TrafficAnalytics = lazy(() => import("./pages/admin/TrafficAnalytics"));
const DeliveryMethods = lazy(() => import("./pages/admin/DeliveryMethods"));
const StoresManagement = lazy(() => import("./pages/admin/StoresManagement"));
const StoreEdit = lazy(() => import("./pages/admin/StoreEdit"));

const AdminFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const CategoryRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/collections/${slug}`} replace />;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider delayDuration={0}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:slug" element={<Collection />} />
          <Route path="/brands-thuong-hieu-thu-cung" element={<Brands />} />
          <Route path="/search" element={<Search />} />
          <Route path="/flash-sale" element={<FlashSale />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Navigate to="/profile?tab=orders" replace />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/blogs" element={<Blog />} />
          <Route path="/blogs/:categorySlug/:handle" element={<BlogPostDetail />} />
          <Route path="/blogs/:handle" element={<BlogPostDetail />} />
          <Route path="/pages/:handle" element={<PageDetail />} />
          <Route
            path="/admin"
            element={
              <Suspense fallback={<AdminFallback />}>
                <AdminLayout />
              </Suspense>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductsManagement />} />
            <Route path="products/:id/edit" element={<ProductEdit />} />
            <Route path="products/inventory-sync" element={<InventorySync />} />
            <Route path="products/brands" element={<BrandsManagement />} />
            <Route path="products/brands/:id" element={<BrandDetails />} />
            <Route path="collections" element={<CollectionsManagement />} />
            <Route path="collections/:id" element={<CollectionDetails />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="orders/:id/edit" element={<OrderEdit />} />
            <Route path="abandoned-checkouts" element={<AbandonedCheckouts />} />
            <Route path="customers" element={<CustomersManagement />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="customers/segments" element={<CustomerSegments />} />
            <Route path="content/metaobjects" element={<ContentMetaobjects />} />
            <Route path="content/files" element={<ContentFiles />} />
            <Route path="content/menus" element={<ContentMenus />} />
            <Route path="content/blog" element={<ContentBlog />} />
            <Route path="content/blog/:id/edit" element={<BlogPostEdit />} />
            <Route path="content/blog-categories" element={<BlogCategories />} />
            <Route path="content/pages" element={<Pages />} />
            <Route path="content/ai-generator" element={<ContentAIGenerator />} />
            <Route path="marketing/banners" element={<MarketingBanners />} />
            <Route path="promotions" element={<PromotionsManagement />} />
            <Route path="promotions/:promoType" element={<PromotionsManagement />} />
            <Route path="promotions/:id/edit" element={<PromotionEdit />} />
            <Route path="promotions/flash-sale/:id/edit" element={<FlashSaleEdit />} />
            <Route path="promotions/discounts/:id/edit" element={<DiscountsEdit />} />
            <Route path="promotions/vouchers/:id/edit" element={<VouchersEdit />} />
            <Route path="promotions/combo-buy/:id/edit" element={<ComboBuyEdit />} />
            <Route path="promotions/buy-more-save-more/:id/edit" element={<BuyMoreSaveMoreEdit />} />
            <Route path="promotions/free-shipping/:id/edit" element={<FreeShippingEdit />} />
            <Route path="promotions/subscription-deals/:id/edit" element={<SubscriptionDealsEdit />} />
            <Route path="promotions/clearance/:id/edit" element={<ClearanceEdit />} />
            <Route path="analytics/sales" element={<SalesAnalytics />} />
            <Route path="analytics/traffic" element={<TrafficAnalytics />} />
            <Route path="settings/delivery-methods" element={<DeliveryMethods />} />
            <Route path="settings/stores" element={<StoresManagement />} />
            <Route path="settings/stores/:id" element={<StoreEdit />} />
          </Route>
          {/* Redirect legacy /category/ links to /collections/ */}
          <Route path="/category/:slug" element={<CategoryRedirect />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
