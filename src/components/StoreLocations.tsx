import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveStores } from "@/hooks/useStores";

export const StoreLocations = () => {
  const { data: stores, isLoading } = useActiveStores();

  if (isLoading) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
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
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {store.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 flex-1">
                  {store.address}
                </p>
                {store.map_url && (
                  <Button asChild className="self-start">
                    <a href={store.map_url} target="_blank" rel="noopener noreferrer">
                      Chỉ Đường
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
