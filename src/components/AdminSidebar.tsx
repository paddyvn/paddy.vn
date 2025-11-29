import { Package, ShoppingCart, Users, Megaphone, Tag, FileText, BarChart3, Settings, ChevronDown } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import paddyLogoFull from "@/assets/paddy-logo-full.avif";
import paddyFavicon from "@/assets/paddy-favicon.png";
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
    ],
  },
  {
    title: "Customers",
    url: "/admin/customers",
    icon: Users,
  },
  {
    title: "Marketing",
    url: "/admin/marketing",
    icon: Megaphone,
  },
  {
    title: "Promotions",
    url: "/admin/promotions",
    icon: Tag,
  },
  {
    title: "Content",
    url: "/admin/content",
    icon: FileText,
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (url: string) => currentPath === url;
  const hasActiveChild = (subItems?: Array<{ url: string }>) => 
    subItems?.some((item) => isActive(item.url));

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center justify-center flex-1">
            {collapsed ? (
              <img 
                src={paddyFavicon} 
                alt="Paddy.vn" 
                className="h-8 w-8 object-contain"
              />
            ) : (
              <img 
                src={paddyLogoFull} 
                alt="Paddy.vn" 
                className="h-10 w-auto object-contain"
              />
            )}
          </div>
        </div>
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
                  const hasActive = hasActiveChild(item.subItems);
                  return (
                    <Collapsible
                      key={item.title}
                      defaultOpen={hasActive}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className={hasActive ? "bg-muted text-primary font-medium" : ""}
                          >
                            <item.icon className="h-4 w-4" />
                            {!collapsed && (
                              <>
                                <span>{item.title}</span>
                                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        {!collapsed && (
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.subItems.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild>
                                    <NavLink
                                      to={subItem.url}
                                      className="hover:bg-muted/50"
                                      activeClassName="bg-muted text-primary font-medium"
                                    >
                                      <span>{subItem.title}</span>
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
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url!}
                        className="hover:bg-muted/50"
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
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
            <SidebarMenuButton asChild>
              <NavLink
                to="/admin/settings"
                className="hover:bg-muted/50"
                activeClassName="bg-muted text-primary font-medium"
              >
                <Settings className="h-4 w-4" />
                {!collapsed && <span>Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-3 py-2">
          <SidebarTrigger />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}