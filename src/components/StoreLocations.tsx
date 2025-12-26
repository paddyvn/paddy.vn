import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Store {
  id: string;
  name: string;
  address: string;
  imageUrl: string;
  mapUrl: string;
}

const stores: Store[] = [
  {
    id: "1",
    name: "Paddy Pet Shop - Trường Sa",
    address: "168 Trường Sa, P. Gia Định, Tp. HCM (Phường 1, Q. Bình Thạnh cũ)",
    imageUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop",
    mapUrl: "https://maps.google.com/?q=168+Trường+Sa,+Bình+Thạnh,+HCM",
  },
  {
    id: "2",
    name: "Paddy Pet Shop - Nơ Trang Long",
    address: "412/3 Nơ Trang Long, P. Bình Lợi Trung, Tp. HCM (Phường 13, Q.Bình Thạnh cũ)",
    imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop",
    mapUrl: "https://maps.google.com/?q=412/3+Nơ+Trang+Long,+Bình+Thạnh,+HCM",
  },
  {
    id: "3",
    name: "Paddy Pet Shop - Trần Não",
    address: "91B Trần Não, P. An Khánh, Tp. HCM (Quận 2 cũ)",
    imageUrl: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&h=300&fit=crop",
    mapUrl: "https://maps.google.com/?q=91B+Trần+Não,+Quận+2,+HCM",
  },
  {
    id: "4",
    name: "Paddy Pet Shop - Nguyễn Thị Thập",
    address: "406 Nguyễn Thị Thập, P. Tân Hưng, Tp. HCM (P. Tân Quy, Q.7 cũ)",
    imageUrl: "https://images.unsplash.com/photo-1597633125184-9fd7e54f0832?w=400&h=300&fit=crop",
    mapUrl: "https://maps.google.com/?q=406+Nguyễn+Thị+Thập,+Quận+7,+HCM",
  },
];

export const StoreLocations = () => {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-8">
          <MapPin className="h-6 w-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Hệ thống cửa hàng Paddy Pet
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stores.map((store) => (
            <Card 
              key={store.id} 
              className="group overflow-hidden bg-card hover:shadow-lg transition-shadow duration-300"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={store.imageUrl}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {store.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 min-h-[3rem]">
                  {store.address}
                </p>
                <Button 
                  asChild
                  className="w-full max-w-[180px]"
                >
                  <a href={store.mapUrl} target="_blank" rel="noopener noreferrer">
                    Chỉ Đường
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
