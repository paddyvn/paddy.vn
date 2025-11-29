import { Facebook, Instagram, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Footer = () => {
  return (
    <footer className="bg-muted/30">
      {/* Newsletter Section */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Thành viên Paddiers</h2>
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

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Shop */}
          <div>
            <h3 className="font-bold text-lg mb-4">Shop</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Dành Cho Chó
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Dành Cho Mèo
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Thương Hiệu
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Blogs
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Bộ Sưu Tập
                </a>
              </li>
            </ul>
          </div>

          {/* Paddy Pet Shop */}
          <div>
            <h3 className="font-bold text-lg mb-4">Paddy Pet Shop</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Giới Thiệu
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Thành Viên Paddier
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Điều Khoản Sử Dụng
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Tuyển Dụng
                </a>
              </li>
            </ul>
          </div>

          {/* Hỗ Trợ Khách Hàng */}
          <div>
            <h3 className="font-bold text-lg mb-4">Hỗ Trợ Khách Hàng</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Chính Sách Đổi Trả Hàng
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Phương Thức Vận Chuyển
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Chính Sách Bảo Mật
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Phương Thức Thanh Toán
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Chính Sách Hoàn Tiền
                </a>
              </li>
            </ul>
          </div>

          {/* Liên Hệ */}
          <div>
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
        </div>
      </div>

      {/* Bottom Copyright Section */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              @2024 Paddy VN. All Rights Reserved.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md text-xs font-semibold">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <div className="text-left">
                  <div>ĐÃ THÔNG BÁO</div>
                  <div>BỘ CÔNG THƯƠNG</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
