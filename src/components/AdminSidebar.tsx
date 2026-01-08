import { Package, ShoppingCart, Users, Megaphone, Tag, FileText, BarChart3, Settings, ChevronDown, LogOut, LayoutDashboard, ExternalLink, PanelLeft, FileCode, Sparkles, RefreshCw, Truck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import paddyLogoFull from "@/assets/paddy-logo-full.avif";
import paddyFavicon from "@/assets/paddy-favicon.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const mainItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    icon: ShoppingCart,
    subItems: [
      { title: "All Orders", url: "/admin/orders" },
      { title: "Abandoned Checkouts", url: "/admin/abandoned-checkouts" },
    ],
  },
  {
    title: "Products",
    icon: Package,
    subItems: [
      { title: "All Products", url: "/admin/products" },
      { title: "Collections", url: "/admin/collections" },
      { title: "Brands", url: "/admin/products/brands" },
      { title: "Inventory Sync", url: "/admin/products/inventory-sync" },
    ],
  },
  {
    title: "Customers",
    icon: Users,
    subItems: [
      { title: "All Customers", url: "/admin/customers" },
      { title: "Segments", url: "/admin/customers/segments" },
    ],
  },
  {
    title: "Marketing",
    icon: Megaphone,
    subItems: [
      { title: "Banners", url: "/admin/marketing/banners" },
    ],
  },
  {
    title: "Deals",
    url: "/admin/promotions",
    icon: Tag,
    subItems: [
      { title: "Flash Sale", url: "/admin/promotions/flash-sale" },
      { title: "Discounts", url: "/admin/promotions/discounts" },
      { title: "Vouchers", url: "/admin/promotions/vouchers" },
      { title: "Combo Buy", url: "/admin/promotions/combo-buy" },
      { title: "Buy More Save More", url: "/admin/promotions/buy-more-save-more" },
      { title: "Free Shipping", url: "/admin/promotions/free-shipping" },
      { title: "Subscription Deals", url: "/admin/promotions/subscription-deals" },
    ],
  },
  {
    title: "Content",
    icon: FileText,
    subItems: [
      { title: "Metaobjects", url: "/admin/content/metaobjects" },
      { title: "Files", url: "/admin/content/files" },
      { title: "Menus", url: "/admin/content/menus" },
      { title: "Blog posts", url: "/admin/content/blog" },
      { title: "Blog categories", url: "/admin/content/blog-categories" },
      { title: "Pages", url: "/admin/content/pages" },
      { title: "AI Generator", url: "/admin/content/ai-generator" },
    ],
  },
  {
    title: "Analytics",
    icon: BarChart3,
    subItems: [
      { title: "Sales", url: "/admin/analytics/sales" },
      { title: "Traffic", url: "/admin/analytics/traffic" },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    subItems: [
      { title: "Delivery Methods", url: "/admin/settings/delivery-methods" },
      { title: "Store Locations", url: "/admin/settings/stores" },
    ],
  },
];

export function AdminSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (url: string) => currentPath === url;
  const hasActiveChild = (subItems?: Array<{ url: string }>) => 
    subItems?.some((item) => isActive(item.url));

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        {collapsed ? (
          <div className="flex items-center justify-center">
            <img 
              src={paddyFavicon} 
              alt="Paddy.vn" 
              className="h-12 w-12 object-contain"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-16">
            <img 
              src={paddyLogoFull} 
              alt="Paddy.vn" 
              className="h-10 w-auto object-contain max-w-full"
            />
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase text-muted-foreground">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => {
                if (item.subItems) {
                  const hasActive = hasActiveChild(item.subItems) || (item.url && isActive(item.url));
                  return (
                    <Collapsible
                      key={item.title}
                      defaultOpen={hasActive}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <div className="flex items-center w-full">
                          {item.url ? (
                            <SidebarMenuButton asChild className={`flex-1 text-xs ${hasActive ? "bg-muted text-primary font-medium" : ""}`}>
                              <NavLink
                                to={item.url}
                                end
                                className="hover:bg-muted/50 text-xs"
                                activeClassName="bg-muted text-primary font-medium"
                              >
                                <item.icon className="h-4 w-4" />
                                {!collapsed && <span className="text-xs">{item.title}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                          ) : (
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                className={`flex-1 text-xs ${hasActive ? "bg-muted text-primary font-medium" : ""}`}
                              >
                                <item.icon className="h-4 w-4" />
                                {!collapsed && <span className="text-xs">{item.title}</span>}
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                          )}
                          {!collapsed && (
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
                                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                              </Button>
                            </CollapsibleTrigger>
                          )}
                        </div>
                        {!collapsed && (
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.subItems.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild className="text-xs">
                                    <NavLink
                                      to={subItem.url}
                                      className="hover:bg-muted/50 text-xs"
                                      activeClassName="bg-muted text-primary font-medium"
                                    >
                                      <span className="text-xs">{subItem.title}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        )}
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="text-xs">
                      <NavLink
                        to={item.url!}
                        end={item.url === "/admin"}
                        className="hover:bg-muted/50 text-xs"
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="text-xs">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-xs">
              <NavLink
                to="/"
                className="hover:bg-muted/50 text-xs"
              >
                <ExternalLink className="h-4 w-4" />
                {!collapsed && <span className="text-xs">Back to Site</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="text-xs">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="text-xs">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleSidebar} className="text-xs">
              <PanelLeft className="h-4 w-4" />
              {!collapsed && <span className="text-xs">Collapse</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}