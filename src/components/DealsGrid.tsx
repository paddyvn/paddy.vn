import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const DealsGrid = () => {
  const deals = [
    { text: "Buy 2,\nget 3rd\nfree", bgColor: "bg-gradient-to-br from-emerald-400 to-emerald-500" },
    { text: "Up to\n40% off", bgColor: "bg-gradient-to-br from-pink-300 to-pink-400" },
    { text: "Shop all\nholiday\ndeals", bgColor: "bg-gradient-to-br from-purple-400 to-purple-500" },
    { text: "Treats", bgColor: "bg-gradient-to-br from-yellow-300 to-yellow-400" },
    { text: "Toys", bgColor: "bg-gradient-to-br from-blue-400 to-blue-500" },
    { text: "Shop all\ndeals", bgColor: "bg-gradient-to-br from-orange-300 to-orange-400" },
  ];

  return (
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Year-end Deals at Paddy</h2>
          <Link 
            to="/collections/deals" 
            className="flex items-center gap-1 text-primary font-medium hover:opacity-80 transition-opacity"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {deals.map((deal, index) => (
            <button
              key={index}
              className={`group relative aspect-square rounded-xl overflow-hidden hover:scale-105 transition-smooth max-w-[180px] shadow-card ${deal.bgColor}`}
            >
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-6 h-6 bg-white/20 rounded-br-xl"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-white/20 rounded-tl-xl"></div>
              
              {/* Content */}
              <div className="relative z-10 h-full flex items-center justify-center p-3">
                <p className="text-white text-sm md:text-base font-bold text-center whitespace-pre-line leading-tight drop-shadow-md">
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
