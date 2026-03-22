import { useState } from "react";
import { PetHubPage } from "@/hooks/usePetHubPage";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface PetHubSeoContentProps {
  hubPage: PetHubPage | null | undefined;
}

export const PetHubSeoContent = ({ hubPage }: PetHubSeoContentProps) => {
  const [expanded, setExpanded] = useState(false);

  if (!hubPage) return null;

  const hasSeoContent = hubPage.seo_heading || hubPage.seo_body_html;
  const hasFaq = hubPage.seo_faq && hubPage.seo_faq.length > 0;

  if (!hasSeoContent && !hasFaq) return null;

  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      {/* SEO content */}
      {hasSeoContent && (
        <div className="max-w-4xl">
          {hubPage.seo_heading && (
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
              {hubPage.seo_heading}
            </h2>
          )}
          {hubPage.seo_body_html && (
            <div className="relative">
              <div
                className={`prose prose-sm max-w-none text-muted-foreground ${
                  !expanded ? "max-h-[120px] overflow-hidden" : ""
                }`}
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(hubPage.seo_body_html),
                }}
              />
              {!expanded && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
              )}
              <Button
                variant="link"
                size="sm"
                className="mt-1 p-0 h-auto"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Thu gọn" : "Xem thêm"}
                <ChevronDown
                  className={`h-4 w-4 ml-1 transition-transform ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* FAQ */}
      {hasFaq && (
        <div className="max-w-4xl mt-8">
          <h3 className="text-lg font-bold text-foreground mb-4">
            Câu hỏi thường gặp
          </h3>
          <Accordion type="single" collapsible className="space-y-2">
            {hubPage.seo_faq!.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-semibold text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </section>
  );
};
