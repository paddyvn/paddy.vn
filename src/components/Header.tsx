import { ShoppingCart, Search, Heart, Menu, User, Package, Settings, LogOut, ChevronDown, HelpCircle, X, Gift, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import paddyLogo from "@/assets/paddy-logo.avif";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { MegaMenu } from "@/components/MegaMenu";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { CartDrawer } from "@/components/CartDrawer";
import categoryDogs from "@/assets/category-dogs.jpg";
import categoryCats from "@/assets/category-cats.jpg";
import { useActiveBanners } from "@/hooks/useBanners";
import { useMegaMenuData } from "@/hooks/useMegaMenuData";

function MobileMenuAccordion({
  label,
  menuSlug,
  onNavigate,
}: {
  label: string;
  menuSlug: string;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: menuData } = useMegaMenuData(expanded ? menuSlug : null);

  return (
    <div>
      <button
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {label}
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && menuData && (
        <div className="bg-muted/30 px-4 py-2">
          {menuData.columns.map((column) => (
            <div key={column.id} className="py-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                {column.title}
              </p>
              {column.items.map((item) => (
                <Link
                  key={item.id}
                  to={item.link}
                  className="block py-1.5 text-sm hover:text-primary"
                  onClick={onNavigate}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const Header = () => {
  const [userId, setUserId] = useState<string | undefined>();
  const [userName, setUserName] = useState<string | null>(null);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cart } = useCart(userId);
  const cartCount = cart.length;
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: announcements = [] } = useActiveBanners('announcement');
  const activeAnnouncement = announcements[0];

  // Fetch DB-driven top nav items
  const { data: navItems } = useQuery({
    queryKey: ["top-nav-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("top_nav_items")
        .select(`
          id, label, link_url, mega_menu_id, position,
          mega_menu:navigation_menus(id, slug)
        `)
        .eq("is_active", true)
        .order("position");
      if (error) throw error;
      return data;
    },
  });

  // Progressive header hiding on scroll with direction detection
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let rafId = 0;
    let cachedIsAtTop = true;
    let cachedHideHeader = false;

    const handleScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const scrollY = window.scrollY;
        const isScrollingUp = scrollY < lastScrollY;

        let nextIsAtTop = cachedIsAtTop;
        if (cachedIsAtTop) {
          if (scrollY > 40) nextIsAtTop = false;
        } else {
          if (scrollY < 6) nextIsAtTop = true;
        }

        if (nextIsAtTop !== cachedIsAtTop) {
          cachedIsAtTop = nextIsAtTop;
          setIsAtTop(nextIsAtTop);
        }

        let nextHideHeader = cachedHideHeader;
        if (cachedHideHeader) {
          if (isScrollingUp || scrollY < 80) nextHideHeader = false;
        } else {
          if (!isScrollingUp && scrollY > 140) nextHideHeader = true;
        }

        if (nextHideHeader !== cachedHideHeader) {
          cachedHideHeader = nextHideHeader;
          setHideHeader(nextHideHeader);
        }

        lastScrollY = scrollY;
      });
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
      if (session?.user?.id) {
        fetchUserName(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id);
      if (session?.user?.id) {
        setTimeout(() => {
          fetchUserName(session.user.id);
        }, 0);
      } else {
        setUserName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserName = async (id: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', id)
      .single();
    
    if (data?.full_name) {
      setUserName(data.full_name);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out successfully",
      });
      navigate("/");
    }
  };

  return (
    <header className={`sticky top-0 z-50 w-full bg-primary transition-transform duration-300 ${hideHeader ? '-translate-y-full' : 'translate-y-0'}`}>
      {/* Top Header Bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-2 md:px-4">
          <div className="flex h-16 items-center justify-between gap-6 relative">
            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-primary-foreground hover:bg-primary/90"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Logo */}
            <a href="/" className="flex-shrink-0 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
              <img src={paddyLogo} alt="Paddy.vn" className="h-10 w-auto brightness-0 invert" />
            </a>

            {/* Search Bar - Desktop only */}
            <SearchAutocomplete
              className="hidden md:block flex-1 max-w-lg"
              inputClassName="w-full pr-12 h-11 bg-background text-foreground rounded-md"
            />

            {/* Profile - mobile */}
            <div className="md:hidden absolute right-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-primary-foreground">
                    <User className="h-5 w-5" />
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background">
                  {userId ? (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        Đơn hàng của tôi
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/profile?tab=rewards')} className="cursor-pointer">
                        <Gift className="mr-2 h-4 w-4" />
                        Điểm thưởng
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/profile?tab=vouchers')} className="cursor-pointer">
                        <Ticket className="mr-2 h-4 w-4" />
                        Mã giảm giá
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Cài đặt tài khoản
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Đăng xuất
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/track-order')} className="cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        Tra cứu đơn hàng
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/auth')} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Đăng nhập / Đăng ký
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right Actions - Desktop profile + Cart */}
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                className="hidden lg:flex items-center gap-1 text-primary-foreground hover:text-primary-foreground hover:bg-primary/90 h-10"
                onClick={() => navigate('/pages/lien-he')}
              >
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm">Hỗ trợ</span>
              </Button>

              {/* Desktop Profile */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex items-center gap-1 text-primary-foreground hover:text-primary-foreground hover:bg-primary/90 h-10"
                    >
                      <User className="h-4 w-4" />
                      <div className="flex flex-col items-start text-left">
                        {userId && userName && (
                          <span className="text-xs opacity-80">Xin chào, {userName.split(' ')[0]}</span>
                        )}
                        <span className="text-sm">
                          {userId ? 'Tài khoản' : 'Đăng nhập'}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-background">
                    {userId ? (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer">
                          <Package className="mr-2 h-4 w-4" />
                          Đơn hàng của tôi
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/profile?tab=rewards')} className="cursor-pointer">
                          <Gift className="mr-2 h-4 w-4" />
                          Điểm thưởng
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/profile?tab=vouchers')} className="cursor-pointer">
                          <Ticket className="mr-2 h-4 w-4" />
                          Mã giảm giá
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Cài đặt tài khoản
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                          <LogOut className="mr-2 h-4 w-4" />
                          Đăng xuất
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/track-order')} className="cursor-pointer">
                          <Package className="mr-2 h-4 w-4" />
                          Tra cứu đơn hàng
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/auth')} className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Đăng nhập / Đăng ký
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CartDrawer 
                userId={userId}
                trigger={
                  <Button 
                    variant="ghost" 
                    className="relative text-primary-foreground hover:text-primary-foreground hover:bg-primary/90 h-10 px-3"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                        {cartCount}
                      </span>
                    )}
                    <span className="hidden md:inline ml-1 text-sm">Giỏ hàng</span>
                    <ChevronDown className="hidden md:inline h-4 w-4 ml-1" />
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar - Desktop Only (DB-driven) */}
      <div 
        className="hidden md:block bg-primary-foreground text-foreground border-t border-border/20 relative"
        onMouseLeave={() => setActiveMegaMenu(null)}
      >
        <div className="container mx-auto px-4">
          <nav className="hidden md:flex h-12 items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-6">
              {navItems?.map((item) => {
                const menuSlug = (item.mega_menu as any)?.slug;

                if (menuSlug) {
                  return (
                    <Link
                      key={item.id}
                      to={item.link_url || '#'}
                      className="flex items-center gap-1 hover:text-primary transition-smooth"
                      onMouseEnter={() => setActiveMegaMenu(menuSlug)}
                    >
                      {item.label}
                      <ChevronDown className="h-4 w-4" />
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    to={item.link_url || "#"}
                    className="hover:text-primary transition-smooth"
                    onMouseEnter={() => setActiveMegaMenu(null)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <Link to="/pages/uu-dai-tich-luy-thanh-vien-paddier" className="text-secondary font-semibold text-sm hover:underline">
              Tiết kiệm đến 25% khi là thành viên Paddy
            </Link>
          </nav>
        </div>

        {/* Mega Menu - dynamic for any slug */}
        {activeMegaMenu && (
          <MegaMenu
            menuSlug={activeMegaMenu}
            fallbackPromoImage={
              activeMegaMenu === 'dog' ? categoryDogs :
              activeMegaMenu === 'cat' ? categoryCats :
              undefined
            }
          />
        )}
      </div>

      {/* Mobile Search */}
      <div 
        className="md:hidden bg-primary-foreground border-t border-border/20 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
        style={{ 
          maxHeight: isAtTop ? '60px' : '0px',
          opacity: isAtTop ? 1 : 0,
          pointerEvents: isAtTop ? 'auto' : 'none',
          willChange: 'max-height, opacity'
        }}
      >
        <div className="px-4 py-3">
          <SearchAutocomplete
            inputClassName="w-full pr-12 h-10"
            isMobile
          />
        </div>
      </div>

      {/* Announcement Bar */}
      <div 
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
        style={{ 
          maxHeight: isAtTop ? '60px' : '0px',
          opacity: isAtTop ? 1 : 0,
          pointerEvents: isAtTop ? 'auto' : 'none',
          willChange: 'max-height, opacity'
        }}
      >
        {activeAnnouncement && !dismissedAnnouncement ? (
          <div 
            className="relative"
            style={{ 
              backgroundColor: activeAnnouncement.background_color,
              color: activeAnnouncement.text_color
            }}
          >
            <div className="container mx-auto px-4">
              <div className="py-2 text-center">
                {activeAnnouncement.link_url ? (
                  <a 
                    href={activeAnnouncement.link_url}
                    className="text-xs md:text-sm font-medium hover:underline"
                  >
                    {activeAnnouncement.title}
                    {activeAnnouncement.link_text && (
                      <span className="ml-2 underline">{activeAnnouncement.link_text}</span>
                    )}
                  </a>
                ) : (
                  <p className="text-xs md:text-sm font-medium">{activeAnnouncement.title}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setDismissedAnnouncement(true)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Mobile Navigation Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[300px] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>
              <img src={paddyLogo} alt="Paddy.vn" className="h-8 w-auto" />
            </SheetTitle>
          </SheetHeader>

          <div className="py-2">
            {navItems?.map((item) => {
              const menuSlug = (item.mega_menu as any)?.slug;

              if (menuSlug) {
                return (
                  <MobileMenuAccordion
                    key={item.id}
                    label={item.label}
                    menuSlug={menuSlug}
                    onNavigate={() => setMobileMenuOpen(false)}
                  />
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.link_url || "#"}
                  className="block px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t mt-4 pt-4 px-4 space-y-3">
            <Link to="/track-order" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Tra cứu đơn hàng
            </Link>
            <Link to="/orders" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Đơn hàng của tôi
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};
