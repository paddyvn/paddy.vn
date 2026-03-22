import { PetHubPage } from "@/hooks/usePetHubPage";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface PetHubHeroProps {
  hubPage: PetHubPage | null | undefined;
  petType: "dog" | "cat";
}

export const PetHubHero = ({ hubPage, petType }: PetHubHeroProps) => {
  const fallbackTitle = petType === "dog" ? "Sản Phẩm Cho Chó" : "Sản Phẩm Cho Mèo";
  const fallbackSubtitle =
    petType === "dog"
      ? "Thức ăn, đồ chơi, phụ kiện và chăm sóc sức khoẻ cho cún cưng"
      : "Thức ăn, đồ chơi, phụ kiện và chăm sóc sức khoẻ cho mèo cưng";

  return (
    <section className="container mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
            {hubPage?.title || fallbackTitle}
          </h1>
          <p className="text-muted-foreground mt-1.5 max-w-2xl">
            {hubPage?.subtitle || fallbackSubtitle}
          </p>
        </div>
        {hubPage?.hero_cta_text && hubPage?.hero_cta_link && (
          <Button asChild className="shrink-0">
            <Link to={hubPage.hero_cta_link}>{hubPage.hero_cta_text}</Link>
          </Button>
        )}
      </div>
    </section>
  );
};
