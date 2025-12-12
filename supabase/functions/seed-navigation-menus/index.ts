import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const dogMenuColumns = [
  {
    title: "Dog Food",
    items: [
      { label: "Dry Food", link: "/collections/dog-dry-food" },
      { label: "Wet Food", link: "/collections/dog-wet-food" },
      { label: "Treats", link: "/collections/dog-treats" },
      { label: "Grain-Free", link: "/collections/dog-grain-free" },
      { label: "Puppy Food", link: "/collections/puppy-food" },
      { label: "Senior Dog Food", link: "/collections/senior-dog-food" },
    ],
    shopAllLink: "/collections/dog-food",
  },
  {
    title: "Dog Toys",
    items: [
      { label: "Chew Toys", link: "/collections/dog-chew-toys" },
      { label: "Plush Toys", link: "/collections/dog-plush-toys" },
      { label: "Interactive Toys", link: "/collections/dog-interactive-toys" },
      { label: "Balls & Launchers", link: "/collections/dog-balls" },
      { label: "Rope Toys", link: "/collections/dog-rope-toys" },
      { label: "Tough Toys", link: "/collections/dog-tough-toys" },
    ],
    shopAllLink: "/collections/dog-toys",
  },
  {
    title: "Dog Beds",
    items: [
      { label: "Orthopedic Beds", link: "/collections/dog-orthopedic-beds" },
      { label: "Bolster Beds", link: "/collections/dog-bolster-beds" },
      { label: "Crate Beds", link: "/collections/dog-crate-beds" },
      { label: "Mats & Rugs", link: "/collections/dog-mats" },
      { label: "Cooling Beds", link: "/collections/dog-cooling-beds" },
      { label: "Blankets", link: "/collections/dog-blankets" },
    ],
    shopAllLink: "/collections/dog-beds",
  },
  {
    title: "Apparel",
    items: [
      { label: "Coats & Jackets", link: "/collections/dog-coats" },
      { label: "Sweaters", link: "/collections/dog-sweaters" },
      { label: "Bandanas", link: "/collections/dog-bandanas" },
      { label: "Boots & Pawwear", link: "/collections/dog-boots" },
      { label: "Life Jackets", link: "/collections/dog-life-jackets" },
      { label: "Collars & Leashes", link: "/collections/dog-collars" },
    ],
    shopAllLink: "/collections/dog-apparel",
  },
  {
    title: "Health",
    items: [
      { label: "Vitamins", link: "/collections/dog-vitamins" },
      { label: "Supplements", link: "/collections/dog-supplements" },
      { label: "Dental Care", link: "/collections/dog-dental" },
      { label: "Flea & Tick", link: "/collections/dog-flea-tick" },
      { label: "Grooming", link: "/collections/dog-grooming" },
      { label: "Calming Aids", link: "/collections/dog-calming" },
    ],
    shopAllLink: "/collections/dog-health",
  },
];

const catMenuColumns = [
  {
    title: "Cat Food",
    items: [
      { label: "Dry Food", link: "/collections/cat-dry-food" },
      { label: "Wet Food", link: "/collections/cat-wet-food" },
      { label: "Treats", link: "/collections/cat-treats" },
      { label: "Grain-Free", link: "/collections/cat-grain-free" },
      { label: "Kitten Food", link: "/collections/kitten-food" },
      { label: "Senior Cat Food", link: "/collections/senior-cat-food" },
    ],
    shopAllLink: "/collections/cat-food",
  },
  {
    title: "Cat Toys",
    items: [
      { label: "Feather Toys", link: "/collections/cat-feather-toys" },
      { label: "Laser Toys", link: "/collections/cat-laser-toys" },
      { label: "Interactive Toys", link: "/collections/cat-interactive-toys" },
      { label: "Catnip Toys", link: "/collections/cat-catnip-toys" },
      { label: "Balls & Chasers", link: "/collections/cat-balls" },
      { label: "Tunnels", link: "/collections/cat-tunnels" },
    ],
    shopAllLink: "/collections/cat-toys",
  },
  {
    title: "Cat Beds",
    items: [
      { label: "Cat Trees", link: "/collections/cat-trees" },
      { label: "Cat Caves", link: "/collections/cat-caves" },
      { label: "Window Perches", link: "/collections/cat-window-perches" },
      { label: "Heated Beds", link: "/collections/cat-heated-beds" },
      { label: "Bolster Beds", link: "/collections/cat-bolster-beds" },
      { label: "Blankets", link: "/collections/cat-blankets" },
    ],
    shopAllLink: "/collections/cat-beds",
  },
  {
    title: "Litter & Hygiene",
    items: [
      { label: "Litter Boxes", link: "/collections/cat-litter-boxes" },
      { label: "Cat Litter", link: "/collections/cat-litter" },
      { label: "Litter Mats", link: "/collections/cat-litter-mats" },
      { label: "Waste Disposal", link: "/collections/cat-waste-disposal" },
      { label: "Odor Control", link: "/collections/cat-odor-control" },
      { label: "Litter Scoops", link: "/collections/cat-litter-scoops" },
    ],
    shopAllLink: "/collections/cat-litter",
  },
  {
    title: "Health",
    items: [
      { label: "Vitamins", link: "/collections/cat-vitamins" },
      { label: "Supplements", link: "/collections/cat-supplements" },
      { label: "Dental Care", link: "/collections/cat-dental" },
      { label: "Flea & Tick", link: "/collections/cat-flea-tick" },
      { label: "Grooming", link: "/collections/cat-grooming" },
      { label: "Calming Aids", link: "/collections/cat-calming" },
    ],
    shopAllLink: "/collections/cat-health",
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // This is a one-time seed function, no auth required
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create Dog menu
    const { data: dogMenu, error: dogMenuError } = await supabase
      .from("navigation_menus")
      .insert({
        name: "Dog Menu",
        slug: "dog",
        is_active: true,
        display_order: 1,
        promo_title: "New Arrivals",
        promo_badge: "NEW",
        promo_link: "/collections/dog-new-arrivals",
      })
      .select()
      .single();

    if (dogMenuError) throw dogMenuError;

    // Insert dog columns and items
    for (let i = 0; i < dogMenuColumns.length; i++) {
      const col = dogMenuColumns[i];
      const { data: column, error: colError } = await supabase
        .from("navigation_columns")
        .insert({
          menu_id: dogMenu.id,
          title: col.title,
          shop_all_link: col.shopAllLink,
          display_order: i,
        })
        .select()
        .single();

      if (colError) throw colError;

      const itemInserts = col.items.map((item, idx) => ({
        column_id: column.id,
        label: item.label,
        link: item.link,
        display_order: idx,
      }));

      const { error: itemsError } = await supabase
        .from("navigation_items")
        .insert(itemInserts);

      if (itemsError) throw itemsError;
    }

    // Create Cat menu
    const { data: catMenu, error: catMenuError } = await supabase
      .from("navigation_menus")
      .insert({
        name: "Cat Menu",
        slug: "cat",
        is_active: true,
        display_order: 2,
        promo_title: "Best Sellers",
        promo_badge: "HOT",
        promo_link: "/collections/cat-best-sellers",
      })
      .select()
      .single();

    if (catMenuError) throw catMenuError;

    // Insert cat columns and items
    for (let i = 0; i < catMenuColumns.length; i++) {
      const col = catMenuColumns[i];
      const { data: column, error: colError } = await supabase
        .from("navigation_columns")
        .insert({
          menu_id: catMenu.id,
          title: col.title,
          shop_all_link: col.shopAllLink,
          display_order: i,
        })
        .select()
        .single();

      if (colError) throw colError;

      const itemInserts = col.items.map((item, idx) => ({
        column_id: column.id,
        label: item.label,
        link: item.link,
        display_order: idx,
      }));

      const { error: itemsError } = await supabase
        .from("navigation_items")
        .insert(itemInserts);

      if (itemsError) throw itemsError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Dog and Cat menus seeded successfully",
        dogMenuId: dogMenu.id,
        catMenuId: catMenu.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error seeding menus:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
