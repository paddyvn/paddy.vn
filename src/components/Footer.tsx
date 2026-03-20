import { Facebook, Instagram, Phone, Mail, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import govSeal from "@/assets/gov-seal.png";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useFooterMenus } from "@/hooks/useFooterMenus";

interface FooterProps {
  hideNewsletter?: boolean;
}

interface FooterSectionProps {
  title: string;
  children: React.ReactNode;
}

const FooterSection = ({ title, children }: FooterSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile: Collapsible */}
      <div className="md:hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border-b border-border/50">
            <h3 className="font-bold text-lg">{title}</h3>
            <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="py-3">
            {children}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Desktop: Always visible */}
      <div className="hidden md:block">
        <h3 className="font-bold text-lg mb-4">{title}</h3>
        {children}
      </div>
    </>
  );
};

const socialIcons: Record<string, React.ReactNode> = {
  Facebook: <Facebook className="h-5 w-5" />,
  Instagram: <Instagram className="h-5 w-5" />,
  TikTok: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  ),
};

const FooterLinkList = ({ items }: { items: { id: string; label: string; link: string }[] }) => (
  <ul className="space-y-2">
    {items.map((item) => {
      const isExternal = item.link.startsWith("http");
      return (
        <li key={item.id}>
          {isExternal ? (
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
              {item.label}
            </a>
          ) : (
            <Link to={item.link} className="text-sm text-muted-foreground hover:text-primary transition-smooth">
              {item.label}
            </Link>
          )}
        </li>
      );
    })}
  </ul>
);

const SocialLinks = ({ items }: { items: { id: string; label: string; link: string }[] }) => (
  <div className="flex gap-3 pt-2">
    {items.map((item) => (
      <a
        key={item.id}
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-smooth hover:scale-110"
        aria-label={item.label}
      >
        {socialIcons[item.label] || <span className="text-xs font-bold">{item.label[0]}</span>}
      </a>
    ))}
  </div>
);

export const Footer = ({ hideNewsletter = false }: FooterProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { data: footerMenus } = useFooterMenus();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const showNewsletter = !hideNewsletter && !isLoggedIn;

  const getMenu = (slug: string) => footerMenus?.find((m) => m.slug === slug);
  const vePaddyMenu = getMenu("footer-ve-paddy");
  const shopMenu = getMenu("footer-shop");
  const hoTroMenu = getMenu("footer-ho-tro");
  const socialMenu = getMenu("footer-social");

  return (
    <footer className="bg-muted/30">
      {/* Newsletter Section - only for guest users */}
      {showNewsletter && (
        <div className="bg-background border-b">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">Thành viên Paddiers</h2>
              <p className="text-muted-foreground mb-8">
                Đăng ký thành viên ngay hôm nay để nhận email về sản phẩm mới và chương trình khuyến mãi của Paddy
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                <Input
                  type="email"
                  placeholder="Email của bạn..."
                  className="flex-1 h-12"
                />
                <Button className="h-12 px-8 bg-primary hover:bg-primary/90">
                  Đăng Ký
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 md:gap-8 lg:gap-12">
          {/* Liên Hệ - static contact info */}
          <FooterSection title="Liên Hệ">
            <div className="space-y-3 text-sm">
              <p className="font-semibold">
                CÔNG TY CỔ PHẦN THƯƠNG MẠI & DỊCH VỤ PADDY
              </p>
              <p className="text-muted-foreground">MST: 0316459054</p>
              <p className="text-muted-foreground">
                116 Nguyễn Văn Thủ, Phường Tân Định, Thành phố Hồ Chí Minh, Việt Nam
              </p>
              <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-smooth">
                <Phone className="h-4 w-4" />
                <a href="tel:0867677891">Hotline: 0867677891</a>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-smooth">
                <Mail className="h-4 w-4" />
                <a href="mailto:contact@paddy.vn">Email: contact@paddy.vn</a>
              </div>

              {/* Social Media Icons - dynamic */}
              {socialMenu && socialMenu.items.length > 0 && (
                <SocialLinks items={socialMenu.items} />
              )}
            </div>
          </FooterSection>

          {/* Về Paddy - dynamic */}
          {vePaddyMenu && vePaddyMenu.items.length > 0 && (
            <FooterSection title="Về Paddy">
              <FooterLinkList items={vePaddyMenu.items} />
            </FooterSection>
          )}

          {/* Shop - dynamic */}
          {shopMenu && shopMenu.items.length > 0 && (
            <FooterSection title="Shop">
              <FooterLinkList items={shopMenu.items} />
            </FooterSection>
          )}

          {/* Hỗ Trợ Khách Hàng - dynamic */}
          {hoTroMenu && hoTroMenu.items.length > 0 && (
            <FooterSection title="Hỗ Trợ Khách Hàng">
              <FooterLinkList items={hoTroMenu.items} />
            </FooterSection>
          )}
        </div>
      </div>

      {/* Bottom Copyright Section */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              @2026 Paddy VN. All Rights Reserved.
            </p>
            <div className="flex items-center">
              <img
                src={govSeal}
                alt="Đã thông báo Bộ Công Thương"
                className="h-16 w-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
