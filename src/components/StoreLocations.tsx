import { MapPin, Clock, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveStores } from "@/hooks/useStores";

export const StoreLocations = () => {
  const { data: stores, isLoading } = useActiveStores();

  if (isLoading) {
    return (
      <section className="py-6 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!stores || stores.length === 0) {
    return null;
  }

  return (
    <section className="py-6 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-6 w-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Hệ thống cửa hàng Paddy
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stores.map((store) => (
            <Card 
              key={store.id} 
              className="group overflow-hidden bg-card hover:shadow-lg transition-shadow duration-300 flex flex-col"
            >
              <div className="aspect-[16/9] overflow-hidden bg-muted">
                {store.image_url ? (
                  <img
                    src={store.image_url}
                    alt={store.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <CardContent className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-lg text-[#0849FF] mb-2">
                  {store.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-2 flex-1">
                  {store.address}
                </p>
                <div className="flex items-end justify-between gap-2 mt-auto">
                  <div className="space-y-1">
                    {store.opening_hours && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{store.opening_hours}</span>
                      </div>
                    )}
                    {store.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                        <a href={`tel:${store.phone}`} className="hover:text-primary transition-colors">
                          {store.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  {store.map_url && (
                    <Button asChild size="sm" className="shrink-0">
                      <a href={store.map_url} target="_blank" rel="noopener noreferrer">
                        Chỉ Đường
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
