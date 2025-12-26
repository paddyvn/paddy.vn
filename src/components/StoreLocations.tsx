import { MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Store {
  id: string;
  name: string;
  address: string[];
  openingHours: string;
  imageUrl: string;
}

const stores: Store[] = [
  {
    id: "1",
    name: "Paddy Pet Quận 1",
    address: ["123 Nguyễn Huệ", "Phường Bến Nghé", "Quận 1, TP.HCM"],
    openingHours: "8:00 - 21:00",
    imageUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop",
  },
  {
    id: "2",
    name: "Paddy Pet Quận 7",
    address: ["45 Nguyễn Thị Thập", "Phường Tân Phú", "Quận 7, TP.HCM"],
    openingHours: "8:00 - 21:00",
    imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop",
  },
  {
    id: "3",
    name: "Paddy Pet Thủ Đức",
    address: ["789 Võ Văn Ngân", "Phường Linh Chiểu", "TP. Thủ Đức"],
    openingHours: "8:00 - 20:00",
    imageUrl: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&h=300&fit=crop",
  },
  {
    id: "4",
    name: "Paddy Pet Bình Thạnh",
    address: ["56 Điện Biên Phủ", "Phường 15", "Quận Bình Thạnh"],
    openingHours: "8:00 - 21:00",
    imageUrl: "https://images.unsplash.com/photo-1597633125184-9fd7e54f0832?w=400&h=300&fit=crop",
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
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {store.name}
                </h3>
                <div className="text-sm text-muted-foreground mb-3 space-y-0.5">
                  {store.address.map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-primary font-medium">
                  <Clock className="h-4 w-4" />
                  <span>Mở cửa: {store.openingHours}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
