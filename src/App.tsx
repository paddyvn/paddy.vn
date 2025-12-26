import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { Navigate } from "react-router-dom";
import Profile from "./pages/Profile";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ProductsManagement from "./pages/admin/ProductsManagement";
import ProductEdit from "./pages/admin/ProductEdit";
import CollectionsManagement from "./pages/admin/CollectionsManagement";
import CollectionDetails from "./pages/admin/CollectionDetails";
import OrdersManagement from "./pages/admin/OrdersManagement";
import OrderDetail from "./pages/admin/OrderDetail";
import OrderEdit from "./pages/admin/OrderEdit";
import CustomersManagement from "./pages/admin/CustomersManagement";
import CustomerSegments from "./pages/admin/CustomerSegments";
import CustomerDetail from "./pages/admin/CustomerDetail";
import AbandonedCheckouts from "./pages/admin/AbandonedCheckouts";
import ContentMetaobjects from "./pages/admin/ContentMetaobjects";
import ContentFiles from "./pages/admin/ContentFiles";
import ContentMenus from "./pages/admin/ContentMenus";
import ContentBlog from "./pages/admin/ContentBlog";
import BlogPostEdit from "./pages/admin/BlogPostEdit";
import BlogCategories from "./pages/admin/BlogCategories";
import ContentAIGenerator from "./pages/admin/ContentAIGenerator";
import Pages from "./pages/admin/Pages";
import MarketingBanners from "./pages/admin/MarketingBanners";
import PromotionsManagement from "./pages/admin/PromotionsManagement";
import PromotionEdit from "./pages/admin/PromotionEdit";
import FlashSaleEdit from "./pages/admin/promotions/FlashSaleEdit";
import DiscountsEdit from "./pages/admin/promotions/DiscountsEdit";
import VouchersEdit from "./pages/admin/promotions/VouchersEdit";
import ComboBuyEdit from "./pages/admin/promotions/ComboBuyEdit";
import BuyMoreSaveMoreEdit from "./pages/admin/promotions/BuyMoreSaveMoreEdit";
import FreeShippingEdit from "./pages/admin/promotions/FreeShippingEdit";
import SubscriptionDealsEdit from "./pages/admin/promotions/SubscriptionDealsEdit";
import ClearanceEdit from "./pages/admin/promotions/ClearanceEdit";
import InventorySync from "./pages/admin/InventorySync";
import BrandsManagement from "./pages/admin/BrandsManagement";
import BrandDetails from "./pages/admin/BrandDetails";
import SalesAnalytics from "./pages/admin/SalesAnalytics";
import TrafficAnalytics from "./pages/admin/TrafficAnalytics";
import DeliveryMethods from "./pages/admin/DeliveryMethods";
import StoresManagement from "./pages/admin/StoresManagement";
import StoreEdit from "./pages/admin/StoreEdit";
import NotFound from "./pages/NotFound";

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
          <Route path="/admin" element={<AdminLayout />}>
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
            {/* Type-specific promotion edit routes */}
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
