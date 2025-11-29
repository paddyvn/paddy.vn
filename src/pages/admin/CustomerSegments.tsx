import { Users, Filter, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function CustomerSegments() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Segments</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage customer segments for targeted marketing
          </p>
        </div>
        <Button>
          <Filter className="mr-2 h-4 w-4" />
          Create Segment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">High Value</h3>
              <p className="text-sm text-muted-foreground">Top 20% spenders</p>
            </div>
          </div>
          <div className="mt-4 text-2xl font-bold">Coming Soon</div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">First Time Buyers</h3>
              <p className="text-sm text-muted-foreground">Made 1 purchase</p>
            </div>
          </div>
          <div className="mt-4 text-2xl font-bold">Coming Soon</div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Inactive</h3>
              <p className="text-sm text-muted-foreground">No orders in 90 days</p>
            </div>
          </div>
          <div className="mt-4 text-2xl font-bold">Coming Soon</div>
        </Card>
      </div>

      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Customer Segmentation</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Segment your customers by behavior, spending, location, and more to create targeted marketing campaigns.
        </p>
        <Button className="mt-4" variant="outline">
          Learn More
        </Button>
      </div>
    </div>
  );
}
