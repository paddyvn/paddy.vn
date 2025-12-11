import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Image, Bell, LayoutTemplate } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MarketingBanners = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banners</h1>
          <p className="text-muted-foreground">
            Manage hero banners, announcement bars, and promotional displays
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Banner
        </Button>
      </div>

      <Tabs defaultValue="hero" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hero" className="gap-2">
            <Image className="h-4 w-4" />
            Hero Banners
          </TabsTrigger>
          <TabsTrigger value="announcement" className="gap-2">
            <Bell className="h-4 w-4" />
            Announcement Bars
          </TabsTrigger>
          <TabsTrigger value="promotional" className="gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Promotional Sections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hero Banners</CardTitle>
              <CardDescription>
                Full-width banners displayed on the homepage carousel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-lg">
                <Image className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No hero banners yet</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Create promotional banners to showcase on your homepage carousel. 
                  Upload images and set display order.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Hero Banner
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Announcement Bars</CardTitle>
              <CardDescription>
                Top-of-page banners for important messages and promotions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-lg">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No announcement bars yet</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Create announcement bars to display important messages like 
                  free shipping offers, sales, or store updates.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Announcement
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Promotional Sections</CardTitle>
              <CardDescription>
                Custom promotional blocks and feature sections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-lg">
                <LayoutTemplate className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No promotional sections yet</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Create custom promotional sections to highlight special offers, 
                  featured categories, or seasonal campaigns.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Section
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingBanners;
