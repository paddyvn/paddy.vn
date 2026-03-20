import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { MapPin, Clock, Phone, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveStores, Store } from "@/hooks/useStores";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const StoreLocator = () => {
  const { data: stores, isLoading } = useActiveStores();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current || !stores || stores.length === 0) return;

    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // If Leaflet already loaded, init directly
    if ((window as any).L) {
      initMap((window as any).L);
      return;
    }

    // Load Leaflet JS
    if (!document.querySelector('script[src*="leaflet"]')) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        const L = (window as any).L;
        if (L) initMap(L);
      };
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [stores]);

  const initMap = (L: any) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current).setView([10.79, 106.71], 12);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    const blueIcon = L.divIcon({
      className: "",
      html: `<div style="width:28px;height:28px;background:#0849FF;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -16],
    });

    markersRef.current = [];
    stores?.forEach((store) => {
      if (store.latitude && store.longitude) {
        const marker = L.marker([store.latitude, store.longitude], { icon: blueIcon }).addTo(map);
        marker.bindPopup(`
          <div style="min-width:180px">
            <strong style="color:#0849FF;font-size:14px">${store.name}</strong><br/>
            <span style="font-size:12px;color:#666">${store.address}</span><br/>
            ${store.phone ? `<a href="tel:${store.phone}" style="font-size:12px;color:#0849FF">${store.phone}</a>` : ""}
          </div>
        `);
        markersRef.current.push({ store, marker });
      }
    });
  };

  const handleCardClick = (store: Store) => {
    if (!store.latitude || !store.longitude || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([store.latitude, store.longitude], 15);
    const entry = markersRef.current.find((m) => m.store.id === store.id);
    if (entry) entry.marker.openPopup();
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const jsonLd = stores
    ? {
        "@context": "https://schema.org",
        "@type": "PetStore",
        name: "Paddy Pet Shop",
        url: "https://paddy.vn",
        telephone: "+84867677891",
        department: stores.map((store) => ({
          "@type": "PetStore",
          name: store.name,
          address: {
            "@type": "PostalAddress",
            streetAddress: store.address,
            addressLocality: "Hồ Chí Minh",
            addressCountry: "VN",
          },
          telephone: store.phone,
          openingHours: "Mo-Su 09:00-22:00",
          ...(store.latitude && store.longitude
            ? {
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: store.latitude,
                  longitude: store.longitude,
                },
              }
            : {}),
        })),
      }
    : null;

  return (
    <>
      <Helmet>
        <title>Hệ thống cửa hàng Paddy Pet Shop | Paddy.vn</title>
        <meta
          name="description"
          content="Tìm cửa hàng Paddy Pet Shop gần bạn. 4 chi nhánh tại Tp. Hồ Chí Minh — mở cửa 7 ngày trong tuần, 9h-22h."
        />
        {jsonLd && (
          <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        )}
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {/* Header section */}
        <section className="bg-primary/5 py-8 md:py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MapPin className="h-7 w-7 text-primary" />
              <h1 className="text-2xl md:text-4xl font-bold text-foreground">
                Hệ thống cửa hàng Paddy
              </h1>
            </div>
            <p className="text-muted-foreground text-base md:text-lg">
              {stores?.length || 4} cửa hàng tại Tp. Hồ Chí Minh — mở cửa 7
              ngày trong tuần
            </p>
          </div>
        </section>

        {/* Map section */}
        <section className="container mx-auto px-4 py-6">
          {isLoading ? (
            <Skeleton className="w-full h-[250px] md:h-[400px] rounded-xl" />
          ) : (
            <div
              ref={mapRef}
              className="w-full h-[250px] md:h-[400px] rounded-xl overflow-hidden border border-border"
            />
          )}
        </section>

        {/* Store cards grid */}
        <section className="container mx-auto px-4 pb-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : !stores || stores.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Chưa có thông tin cửa hàng.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stores.map((store) => (
                <Card
                  key={store.id}
                  className="group cursor-pointer overflow-hidden bg-card hover:shadow-lg transition-shadow duration-300 flex flex-col"
                  onClick={() => handleCardClick(store)}
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
                    <h2 className="font-semibold text-lg text-[#0849FF] mb-2">
                      {store.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-3 flex-1">
                      {store.address}
                    </p>
                    <div className="space-y-1.5 mb-3">
                      {store.opening_hours && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{store.opening_hours}</span>
                        </div>
                      )}
                      {store.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                          <a
                            href={`tel:${store.phone}`}
                            className="hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {store.phone}
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-auto">
                      {store.map_url && (
                        <Button asChild size="sm" className="flex-1">
                          <a
                            href={store.map_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Navigation className="h-3.5 w-3.5 mr-1" />
                            Chỉ đường
                          </a>
                        </Button>
                      )}
                      {store.phone && (
                        <Button asChild size="sm" variant="outline" className="flex-1">
                          <a
                            href={`tel:${store.phone}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="h-3.5 w-3.5 mr-1" />
                            Gọi ngay
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* CTA section */}
        <section className="bg-primary/5 py-8">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
              Mua sắm online — giao hàng tận nơi toàn quốc
            </h2>
            <p className="text-muted-foreground mb-4">
              Không tiện ghé cửa hàng? Đặt hàng online và nhận tại nhà!
            </p>
            <Button asChild size="lg">
              <Link to="/">Mua sắm ngay</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default StoreLocator;
