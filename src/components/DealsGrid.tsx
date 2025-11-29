export const DealsGrid = () => {
  const deals = [
    { text: "Buy 2,\nget 3rd\nfree", gradient: "from-emerald-400 via-pink-300 to-primary" },
    { text: "Up to\n40% off", gradient: "from-emerald-400 via-pink-300 to-primary" },
    { text: "Shop all\nholiday\ndeals", gradient: "from-emerald-400 via-pink-300 to-primary" },
    { text: "Treats", gradient: "from-emerald-400 via-pink-300 to-primary" },
    { text: "Toys", gradient: "from-emerald-400 via-pink-300 to-primary" },
    { text: "Shop all\ndeals", gradient: "from-emerald-400 via-pink-300 to-primary" },
  ];

  return (
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Year-end Deals at Paddy</h2>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {deals.map((deal, index) => (
            <button
              key={index}
              className="group relative aspect-square rounded-xl overflow-hidden hover:scale-105 transition-smooth max-w-[180px]"
            >
              {/* Decorative corners */}
              <div className="absolute inset-0 bg-primary"></div>
              <div className="absolute top-0 left-0 w-8 h-8 bg-emerald-400"></div>
              <div className="absolute top-0 right-0 w-10 h-10 bg-pink-300"></div>
              <div className="absolute bottom-0 left-0 w-10 h-10 bg-pink-300"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-400"></div>
              
              {/* Content */}
              <div className="relative z-10 h-full flex items-center justify-center p-3">
                <p className="text-white text-sm md:text-base font-bold text-center whitespace-pre-line leading-tight">
                  {deal.text}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
