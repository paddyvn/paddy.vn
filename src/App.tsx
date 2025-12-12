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
import Cart from "./pages/Cart";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ProductsManagement from "./pages/admin/ProductsManagement";
import ProductEdit from "./pages/admin/ProductEdit";
import CollectionsManagement from "./pages/admin/CollectionsManagement";
import CollectionDetails from "./pages/admin/CollectionDetails";
import OrdersManagement from "./pages/admin/OrdersManagement";
import CustomersManagement from "./pages/admin/CustomersManagement";
import CustomerSegments from "./pages/admin/CustomerSegments";
import AbandonedCheckouts from "./pages/admin/AbandonedCheckouts";
import ContentMetaobjects from "./pages/admin/ContentMetaobjects";
import ContentFiles from "./pages/admin/ContentFiles";
import ContentMenus from "./pages/admin/ContentMenus";
import ContentBlog from "./pages/admin/ContentBlog";
import ContentAIGenerator from "./pages/admin/ContentAIGenerator";
import Pages from "./pages/admin/Pages";
import MarketingBanners from "./pages/admin/MarketingBanners";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:slug" element={<Collection />} />
          <Route path="/brands-thuong-hieu-thu-cung" element={<Brands />} />
          <Route path="/search" element={<Search />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/blogs" element={<Blog />} />
          <Route path="/blogs/:handle" element={<BlogPostDetail />} />
          <Route path="/blogs/cham-soc-thu-cung/:handle" element={<BlogPostDetail />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductsManagement />} />
            <Route path="products/:id/edit" element={<ProductEdit />} />
            <Route path="collections" element={<CollectionsManagement />} />
            <Route path="collections/:id" element={<CollectionDetails />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="abandoned-checkouts" element={<AbandonedCheckouts />} />
            <Route path="customers" element={<CustomersManagement />} />
            <Route path="customers/segments" element={<CustomerSegments />} />
            <Route path="content/metaobjects" element={<ContentMetaobjects />} />
            <Route path="content/files" element={<ContentFiles />} />
            <Route path="content/menus" element={<ContentMenus />} />
            <Route path="content/blog" element={<ContentBlog />} />
            <Route path="content/pages" element={<Pages />} />
            <Route path="content/ai-generator" element={<ContentAIGenerator />} />
            <Route path="marketing/banners" element={<MarketingBanners />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
