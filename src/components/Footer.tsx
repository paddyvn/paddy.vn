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

export const Footer = ({ hideNewsletter = false }: FooterProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
          {/* Liên Hệ - Always visible, not collapsible */}
          <div className="pb-6 md:pb-0">
            <h3 className="font-bold text-lg mb-4">Liên Hệ</h3>
            <div className="space-y-3 text-sm">
              <p className="font-semibold">
                CÔNG TY CỔ PHẦN THƯƠNG MẠI & DỊCH VỤ PADDY
              </p>
              <p className="text-muted-foreground">
                MST: 0316459054
              </p>
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
              
              {/* Social Media Icons */}
              <div className="flex gap-3 pt-2">
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-smooth hover:scale-110"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-smooth hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-smooth hover:scale-110"
                  aria-label="TikTok"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Về Paddy */}
          <FooterSection title="Về Paddy">
            <ul className="space-y-2">
              <li>
                <Link to="/pages/gioi-thieu" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Giới Thiệu
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Thành Viên Paddier
                </Link>
              </li>
              <li>
                <Link to="/pages/dieu-khoan-su-dung" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Điều Khoản Sử Dụng
                </Link>
              </li>
              <li>
                <Link to="/pages/tuyen-dung" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Tuyển Dụng
                </Link>
              </li>
            </ul>
          </FooterSection>

          {/* Shop */}
          <FooterSection title="Shop">
            <ul className="space-y-2">
              <li>
                <Link to="/collections/cho" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Dành Cho Chó
                </Link>
              </li>
              <li>
                <Link to="/collections/meo" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Dành Cho Mèo
                </Link>
              </li>
              <li>
                <Link to="/brands-thuong-hieu-thu-cung" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Thương Hiệu
                </Link>
              </li>
              <li>
                <Link to="/blogs" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Blogs
                </Link>
              </li>
              <li>
                <Link to="/collections" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Bộ Sưu Tập
                </Link>
              </li>
            </ul>
          </FooterSection>

          {/* Hỗ Trợ Khách Hàng */}
          <FooterSection title="Hỗ Trợ Khách Hàng">
            <ul className="space-y-2">
              <li>
                <Link to="/pages/chinh-sach-doi-tra-hang" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Chính Sách Đổi Trả Hàng
                </Link>
              </li>
              <li>
                <Link to="/pages/phuong-thuc-van-chuyen" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Phương Thức Vận Chuyển
                </Link>
              </li>
              <li>
                <Link to="/pages/chinh-sach-bao-mat" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Chính Sách Bảo Mật
                </Link>
              </li>
              <li>
                <Link to="/pages/phuong-thuc-thanh-toan" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Phương Thức Thanh Toán
                </Link>
              </li>
              <li>
                <Link to="/pages/chinh-sach-hoan-tien" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Chính Sách Hoàn Tiền
                </Link>
              </li>
            </ul>
          </FooterSection>
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
