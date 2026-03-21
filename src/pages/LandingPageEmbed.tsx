import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const LandingPageEmbed = () => {
  const { handle } = useParams<{ handle: string }>();

  const { data: page, isLoading } = useQuery({
    queryKey: ["landing-page", handle],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("handle", handle!)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!handle,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Không tìm thấy trang</h1>
            <p className="text-muted-foreground">
              Trang bạn tìm kiếm không tồn tại hoặc đã kết thúc.
            </p>
          </div>
        </main>
        <Footer hideNewsletter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{page.meta_title || page.title} | Paddy.vn</title>
        {page.meta_description && (
          <meta name="description" content={page.meta_description} />
        )}
        {page.og_image_url && (
          <meta property="og:image" content={page.og_image_url} />
        )}
        <meta property="og:title" content={page.meta_title || page.title} />
        {page.meta_description && (
          <meta property="og:description" content={page.meta_description} />
        )}
      </Helmet>

      {page.show_header && <Header />}

      <iframe
        src={page.external_url}
        title={page.title}
        className="flex-1 w-full border-0"
        style={{
          minHeight: page.show_header || page.show_footer
            ? "calc(100vh - 200px)"
            : "100vh",
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
      />

      {page.show_footer && <Footer hideNewsletter />}
    </div>
  );
};

export default LandingPageEmbed;
