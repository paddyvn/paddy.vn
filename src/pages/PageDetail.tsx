import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet-async";
import DOMPurify from "isomorphic-dompurify";

const PageDetail = () => {
  const { handle } = useParams<{ handle: string }>();

  const { data: page, isLoading } = useQuery({
    queryKey: ["page", handle],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("handle", handle)
        .eq("published", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!handle,
  });

  return (
    <div className="min-h-screen flex flex-col">
      {page && (
        <Helmet>
          <title>{(page as any).meta_title || page.title} | Paddy.vn</title>
          {(page as any).meta_description && (
            <meta name="description" content={(page as any).meta_description} />
          )}
        </Helmet>
      )}
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        {isLoading ? (
          <div className="max-w-3xl mx-auto space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : !page ? (
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-foreground mb-2">Không tìm thấy trang</h1>
            <p className="text-muted-foreground">Trang bạn tìm kiếm không tồn tại hoặc đã bị ẩn.</p>
          </div>
        ) : (
          <article className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">{page.title}</h1>
            {page.body_html && (
              <div
                className="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(page.body_html),
                }}
              />
            )}
          </article>
        )}
      </main>
      <Footer hideNewsletter />
    </div>
  );
};

export default PageDetail;
