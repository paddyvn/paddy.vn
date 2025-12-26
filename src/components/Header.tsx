import { ShoppingCart, Search, Heart, Menu, User, Package, Settings, LogOut, ChevronDown, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import paddyLogo from "@/assets/paddy-logo.avif";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { MegaMenu } from "@/components/MegaMenu";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { CartDrawer } from "@/components/CartDrawer";
import categoryDogs from "@/assets/category-dogs.jpg";
import categoryCats from "@/assets/category-cats.jpg";
import { useActiveBanners } from "@/hooks/useBanners";

export const Header = () => {
  const [userId, setUserId] = useState<string | undefined>();
  const [userName, setUserName] = useState<string | null>(null);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const { cart } = useCart(userId);
  const cartCount = cart.length;
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: announcements = [] } = useActiveBanners('announcement');
  const activeAnnouncement = announcements[0]; // Show first active announcement

  // Progressive header hiding on scroll with direction detection
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const isScrollingUp = scrollY < lastScrollY;
      
      // At top: show everything
      setIsAtTop(scrollY <= 20);
      
      // Show header when scrolling up, hide when scrolling down past threshold
      if (isScrollingUp) {
        setHideHeader(false);
      } else if (scrollY > 100) {
        setHideHeader(true);
      }
      
      lastScrollY = scrollY;
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
            {/* Mobile Menu Button - in blue bar */}
            <Button variant="ghost" size="icon" className="md:hidden text-primary-foreground hover:bg-primary/90">
              <Menu className="h-5 w-5" />
            </Button>

            {/* Logo - centered on mobile */}
            <a href="/" className="flex-shrink-0 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
              <img src={paddyLogo} alt="Paddy.vn" className="h-10 w-auto brightness-0 invert" />
            </a>

            {/* Search Bar - Centered (desktop only) */}
            <SearchAutocomplete
              className="hidden md:block flex-1 max-w-lg"
              inputClassName="w-full pr-12 h-11 bg-background text-foreground rounded-md"
            />

            {/* Profile - positioned independently on mobile */}
            <div className="md:hidden absolute right-12">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-1 text-primary-foreground hover:text-primary-foreground hover:bg-primary/90 h-10"
                  >
                    <User className="h-4 w-4" />
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background">
                  {userId ? (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        My Orders
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Profile Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => navigate('/auth')} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Sign In / Sign Up
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right Actions - Desktop profile + Cart */}
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                className="hidden lg:flex items-center gap-1 text-primary-foreground hover:text-primary-foreground hover:bg-primary/90 h-10"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm">24/7 Help</span>
                <ChevronDown className="h-4 w-4" />
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
                          <span className="text-xs opacity-80">Hi, {userName.split(' ')[0]}</span>
                        )}
                        <span className="text-sm">
                          {userId ? 'Account' : 'Sign In'}
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
                          My Orders
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Profile Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem onClick={() => navigate('/auth')} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Sign In / Sign Up
                      </DropdownMenuItem>
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
                    <span className="hidden md:inline ml-1 text-sm">Cart</span>
                    <ChevronDown className="hidden md:inline h-4 w-4 ml-1" />
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar - Desktop Only */}
      <div 
        className="hidden md:block bg-primary-foreground text-foreground border-t border-border/20 relative"
        onMouseLeave={() => setActiveMegaMenu(null)}
      >
        <div className="container mx-auto px-4">
          <nav className="hidden md:flex h-12 items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-6">
              <button 
                className="flex items-center gap-1 hover:text-primary transition-smooth"
                onMouseEnter={() => setActiveMegaMenu('dog')}
              >
                Dog
                <ChevronDown className="h-4 w-4" />
              </button>
              <button 
                className="flex items-center gap-1 hover:text-primary transition-smooth"
                onMouseEnter={() => setActiveMegaMenu('cat')}
              >
                Cat
                <ChevronDown className="h-4 w-4" />
              </button>
              <button 
                className="flex items-center gap-1 hover:text-primary transition-smooth"
                onMouseEnter={() => setActiveMegaMenu(null)}
              >
                Other Animals
                <ChevronDown className="h-4 w-4" />
              </button>
              <a 
                href="/blogs" 
                className="hover:text-primary transition-smooth"
                onMouseEnter={() => setActiveMegaMenu(null)}
              >
                Pagazine chăm Boss
              </a>
              <a 
                href="/brands-thuong-hieu-thu-cung" 
                className="hover:text-primary transition-smooth"
                onMouseEnter={() => setActiveMegaMenu(null)}
              >
                Thương hiệu
              </a>
              <a 
                href="#" 
                className="hover:text-primary transition-smooth"
                onMouseEnter={() => setActiveMegaMenu(null)}
              >
                Today's Deals
              </a>
            </div>
            <div className="text-secondary font-semibold text-sm">
              Tiết kiệm đến 25% khi là thành viên Paddy
            </div>
          </nav>

        </div>

        {/* Mega Menus */}
        {activeMegaMenu === 'dog' && (
          <MegaMenu
            menuSlug="dog"
            fallbackPromoImage={categoryDogs}
          />
        )}
        {activeMegaMenu === 'cat' && (
          <MegaMenu
            menuSlug="cat"
            fallbackPromoImage={categoryCats}
          />
        )}
      </div>

      {/* Mobile Search */}
      <div 
        className="md:hidden bg-primary-foreground border-t border-border/20 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
        style={{ 
          maxHeight: isAtTop ? '60px' : '0px',
          opacity: isAtTop ? 1 : 0
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
          opacity: isAtTop ? 1 : 0
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
        ) : !activeAnnouncement ? (
          <div className="bg-background">
            <div className="container mx-auto px-4">
              <div className="bg-muted rounded-lg py-2 text-center">
                <p className="text-sm font-medium">
                  Miễn phí giao hàng cho đơn hàng đầu tiên trên 500.000đ 🎉
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
};
