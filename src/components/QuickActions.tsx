import { Link } from "react-router-dom";

export const QuickActions = () => {
  return (
    <section className="bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-2xl font-bold text-foreground mb-1">Hi</p>
            <Link to="/auth" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground mb-1">Save 35% Today</p>
            <p className="text-sm text-muted-foreground">Set up Autoship</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground mb-1">Recent Order</p>
            <Link to="/orders" className="text-sm text-muted-foreground hover:underline">
              Track Package
            </Link>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground mb-1">Premium Care</p>
            <p className="text-sm text-muted-foreground">Shop Now</p>
          </div>
        </div>
      </div>
    </section>
  );
};
