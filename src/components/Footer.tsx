import { Phone, Mail, Facebook, Instagram, ChevronDown } from "lucide-react";
import paddyLogo from "@/assets/logo.png";
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
import { useActiveStores } from "@/hooks/useStores";

interface FooterProps {
  hideNewsletter?: boolean;
}

/* ─── Social Icons ─── */
const socialIcons: Record<string, React.ReactNode> = {
  Facebook: <Facebook className="h-[18px] w-[18px]" />,
  Instagram: <Instagram className="h-[18px] w-[18px]" />,
  TikTok: (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  ),
  Zalo: (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="800" fill="white" fontFamily="sans-serif">Z</text>
    </svg>
  ),
};

/* ─── Collapsible footer section (mobile) ─── */
const FooterSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <div className="lg:hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border-b border-border/50">
            <h4 className="text-sm font-extrabold text-foreground">{title}</h4>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="py-3">{children}</CollapsibleContent>
        </Collapsible>
      </div>
      <div className="hidden lg:block">
        <h4 className="text-sm font-extrabold text-foreground mb-3.5">{title}</h4>
        {children}
      </div>
    </>
  );
};

/* ─── Link list ─── */
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

/* ─── Social links ─── */
const SocialLinks = ({ items }: { items: { id: string; label: string; link: string }[] }) => (
  <div className="flex gap-2">
    {items.map((item) => (
      <a
        key={item.id}
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="w-9 h-9 rounded-[10px] bg-primary text-primary-foreground flex items-center justify-center transition-smooth hover:scale-110 hover:bg-primary/85"
        aria-label={item.label}
      >
        {socialIcons[item.label] || <span className="text-xs font-bold">{item.label[0]}</span>}
      </a>
    ))}
  </div>
);

/* ─── Trust badges ─── */
const TrustBadges = ({ label, items }: { label: string; items: string[] }) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
    <div className="flex gap-2 flex-wrap">
      {items.map((name) => (
        <div key={name} className="bg-background border border-border rounded-md px-2 py-1 text-[11px] font-bold text-muted-foreground">
          {name}
        </div>
      ))}
    </div>
  </div>
);

/* ─── Main Footer ─── */
export const Footer = ({ hideNewsletter = false }: FooterProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { data: footerMenus } = useFooterMenus();
  const { data: stores } = useActiveStores();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
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
    <footer>
      {/* Newsletter - guests only */}
      {showNewsletter && (
        <div className="bg-background border-b border-border">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-xl md:text-2xl font-bold text-primary mb-4">Thành viên Paddiers</h2>
              <p className="text-muted-foreground mb-8">
                Đăng ký thành viên ngay hôm nay để nhận email về sản phẩm mới và chương trình khuyến mãi của Paddy
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                <Input type="email" placeholder="Email của bạn..." className="flex-1 h-12" />
                <Button className="h-12 px-8 bg-primary hover:bg-primary/90">Đăng Ký</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main footer */}
      <div className="bg-muted/20 border-t border-border">
        <div className="container mx-auto px-4 py-10 lg:py-12">
          {/* 5-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr_1.2fr] gap-6 lg:gap-8">

            {/* Col 1: Brand + Contact */}
            <div>
              <img src={paddyLogo} alt="Paddy.vn" className="h-10 w-auto" />
              <p className="text-sm text-muted-foreground mt-1.5 mb-4 leading-snug">
                Cửa hàng thú cưng online hàng đầu Việt Nam
              </p>

              <div className="flex flex-col gap-2 mb-4">
                <a href="tel:0867677891" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-smooth">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>Hotline: <strong className="font-bold">0867 677 891</strong></span>
                </a>
                <a href="mailto:contact@paddy.vn" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-smooth">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span>contact@paddy.vn</span>
                </a>
              </div>

              {/* Social */}
              {socialMenu && socialMenu.items.length > 0 && (
                <div className="mt-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                    Theo dõi Paddy
                  </span>
                  <SocialLinks items={socialMenu.items} />
                </div>
              )}
            </div>

            {/* Col 2: Về Paddy */}
            {vePaddyMenu && vePaddyMenu.items.length > 0 && (
              <FooterSection title="Về Paddy">
                <FooterLinkList items={vePaddyMenu.items} />
              </FooterSection>
            )}

            {/* Col 3: Mua Sắm */}
            {shopMenu && shopMenu.items.length > 0 && (
              <FooterSection title="Mua Sắm">
                <FooterLinkList items={shopMenu.items} />
              </FooterSection>
            )}

            {/* Col 4: Hỗ Trợ */}
            {hoTroMenu && hoTroMenu.items.length > 0 && (
              <FooterSection title="Hỗ Trợ Khách Hàng">
                <FooterLinkList items={hoTroMenu.items} />
              </FooterSection>
            )}

            {/* Col 5: Stores */}
            {stores && stores.length > 0 && (
              <FooterSection title="Hệ Thống Cửa Hàng">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                  {stores.slice(0, 4).map((store) => (
                    <div key={store.id}>
                      <div className="text-sm font-bold text-foreground">{store.name}</div>
                      <div className="text-xs text-muted-foreground leading-snug mt-0.5">{store.address}</div>
                    </div>
                  ))}
                </div>
              </FooterSection>
            )}
          </div>

          {/* Trust strip */}
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-10 pt-6 mt-7 border-t border-border">
            <TrustBadges label="Thanh toán" items={["COD", "Momo", "ZaloPay", "VISA", "MC", "Bank"]} />
            <TrustBadges label="Vận chuyển" items={["GHN", "GHTK", "J&T", "Viettel Post"]} />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-muted/40 border-t border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex flex-col gap-0.5 text-center md:text-left">
              <p className="text-xs text-muted-foreground">
                © 2026 Công Ty Cổ Phần TM & DV Paddy. MST: 0316459054.
              </p>
              <p className="text-xs text-muted-foreground">
                36 Mạc Đĩnh Chi, Phường Tân Định, TP. Hồ Chí Minh, Việt Nam
              </p>
            </div>
            <div className="flex items-center">
              <img src={govSeal} alt="Đã thông báo Bộ Công Thương" className="h-14 w-auto" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
