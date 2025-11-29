import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const ShopifySync = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncingCollections, setSyncingCollections] = useState(false);
  const [syncingOrders, setSyncingOrders] = useState(false);
  const [syncingOlderOrders, setSyncingOlderOrders] = useState(false);
  const [syncingCustomers, setSyncingCustomers] = useState(false);
  const [syncingAbandonedCheckouts, setSyncingAbandonedCheckouts] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  const syncAllProducts = async () => {
    setSyncing(true);
    setProgress({ current: 0, total: 0 });
    
    try {
      let nextBatch: string | null = null;
      let totalSynced = 0;
      let batchCount = 0;

      do {
        batchCount++;
        console.log(`Syncing batch ${batchCount}...`);
        
        const { data, error } = await supabase.functions.invoke('shopify-sync-batch', {
          body: nextBatch ? { continueFrom: nextBatch } : {},
        });

        if (error) throw error;

        if (data) {
          totalSynced += data.stats.syncedProducts;
          setProgress({ current: totalSynced, total: totalSynced });
          
          nextBatch = data.hasMore ? data.nextBatch : null;
          
          console.log(`Batch ${batchCount}: Synced ${data.stats.syncedProducts} products (Total: ${totalSynced})`);
        }

        // Small delay to avoid rate limits
        if (nextBatch) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } while (nextBatch);

      toast({
        title: "Sync Complete!",
        description: `Successfully synced ${totalSynced} products from Shopify.`,
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const syncCollections = async () => {
    setSyncingCollections(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('shopify-sync-collections');

      if (error) throw error;

      toast({
        title: "Collections Sync Complete!",
        description: `Successfully synced ${data.stats.syncedCollections} collections from Shopify.`,
      });
    } catch (error) {
      console.error('Collections sync error:', error);
      toast({
        title: "Collections Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSyncingCollections(false);
    }
  };

  const syncOrders = async () => {
    setSyncingOrders(true);
    setProgress({ current: 0, total: 0 });
    
    try {
      // Check for the most recent order in the database
      const { data: mostRecentOrder } = await supabase
        .from('orders')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let nextBatch: string | null = null;
      let createdAtMin: string | null = mostRecentOrder?.created_at || null;
      let totalSynced = 0;
      let totalItems = 0;
      let batchCount = 0;

      if (createdAtMin) {
        console.log(`Continuing sync from: ${createdAtMin}`);
        toast({
          title: "Incremental Sync",
          description: "Syncing only new orders since last sync...",
        });
      }

      do {
        batchCount++;
        console.log(`Syncing orders batch ${batchCount}...`);
        
        const body: any = {};
        if (nextBatch) {
          body.continueFrom = nextBatch;
        } else if (createdAtMin) {
          body.createdAtMin = createdAtMin;
        }

        const { data, error } = await supabase.functions.invoke('shopify-sync-orders-batch', {
          body,
        });

        if (error) throw error;

        if (data) {
          totalSynced += data.stats.syncedOrders;
          totalItems += data.stats.syncedItems;
          setProgress({ current: totalSynced, total: totalSynced });
          
          nextBatch = data.hasMore ? data.nextBatch : null;
          
          console.log(`Batch ${batchCount}: ${data.stats.syncedOrders} orders, ${data.stats.syncedItems} items (Total: ${totalSynced} orders)`);
        }

        // Small delay between batches
        if (nextBatch) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } while (nextBatch);

      toast({
        title: "Orders Sync Complete!",
        description: totalSynced > 0 
          ? `Successfully synced ${totalSynced} orders with ${totalItems} items from Shopify.`
          : "No new orders to sync.",
      });
    } catch (error) {
      console.error('Orders sync error:', error);
      toast({
        title: "Orders Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSyncingOrders(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const syncOlderOrders = async () => {
    setSyncingOlderOrders(true);
    setProgress({ current: 0, total: 0 });
    
    try {
      // Get the oldest order we currently have
      const { data: oldestOrder } = await supabase
        .from('orders')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (!oldestOrder) {
        toast({
          title: "No Orders Found",
          description: "No existing orders in database. Use 'Sync All Orders' first.",
          variant: "destructive",
        });
        return;
      }

      let nextBatch: string | null = null;
      const createdAtMax = oldestOrder.created_at;
      let totalSynced = 0;
      let totalItems = 0;
      let batchCount = 0;

      console.log(`Syncing older orders before: ${createdAtMax}`);
      toast({
        title: "Syncing Older Orders",
        description: `Fetching orders older than ${new Date(createdAtMax).toLocaleDateString()}...`,
      });

      do {
        batchCount++;
        console.log(`Syncing older orders batch ${batchCount}...`);
        
        const body: any = {};
        if (nextBatch) {
          body.continueFrom = nextBatch;
        } else {
          body.createdAtMax = createdAtMax;
        }

        const { data, error } = await supabase.functions.invoke('shopify-sync-orders-batch', {
          body,
        });

        if (error) throw error;

        if (data) {
          totalSynced += data.stats.syncedOrders;
          totalItems += data.stats.syncedItems;
          setProgress({ current: totalSynced, total: totalSynced });
          
          nextBatch = data.hasMore ? data.nextBatch : null;
          
          console.log(`Batch ${batchCount}: ${data.stats.syncedOrders} orders, ${data.stats.syncedItems} items (Total: ${totalSynced} orders)`);
        }

        // Small delay between batches
        if (nextBatch) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } while (nextBatch);

      toast({
        title: "Older Orders Sync Complete!",
        description: totalSynced > 0 
          ? `Successfully synced ${totalSynced} older orders with ${totalItems} items.`
          : "No older orders found to sync.",
      });
    } catch (error) {
      console.error('Older orders sync error:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSyncingOlderOrders(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const syncCustomers = async () => {
    setSyncingCustomers(true);
    setProgress({ current: 0, total: 0 });
    
    try {
      let nextBatch: string | null = null;
      let totalSynced = 0;
      let batchCount = 0;

      do {
        batchCount++;
        console.log(`Syncing customers batch ${batchCount}...`);
        
        const body: any = {};
        if (nextBatch) {
          body.continueFrom = nextBatch;
        }

        const { data, error } = await supabase.functions.invoke('shopify-sync-customers-batch', {
          body,
        });

        if (error) throw error;

        if (data) {
          totalSynced += data.stats.syncedCustomers;
          setProgress({ current: totalSynced, total: totalSynced });
          
          nextBatch = data.hasMore ? data.nextBatch : null;
          
          console.log(`Batch ${batchCount}: ${data.stats.syncedCustomers} customers (Total: ${totalSynced})`);
        }

        // Small delay between batches
        if (nextBatch) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } while (nextBatch);

      toast({
        title: "Customers Sync Complete!",
        description: totalSynced > 0 
          ? `Successfully synced ${totalSynced} customers from Shopify.`
          : "No customers to sync.",
      });
    } catch (error) {
      console.error('Customers sync error:', error);
      toast({
        title: "Customers Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSyncingCustomers(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const syncAbandonedCheckouts = async () => {
    setSyncingAbandonedCheckouts(true);
    setProgress({ current: 0, total: 0 });
    
    try {
      let nextBatch: string | null = null;
      let totalSynced = 0;
      let batchCount = 0;

      do {
        batchCount++;
        console.log(`Syncing abandoned checkouts batch ${batchCount}...`);
        
        const body: any = {};
        if (nextBatch) {
          body.continueFrom = nextBatch;
        }

        const { data, error } = await supabase.functions.invoke('shopify-sync-abandoned-checkouts', {
          body,
        });

        if (error) throw error;

        if (data) {
          totalSynced += data.stats.syncedCheckouts;
          setProgress({ current: totalSynced, total: totalSynced });
          
          nextBatch = data.hasMore ? data.continueFrom : null;
          
          console.log(`Batch ${batchCount}: ${data.stats.syncedCheckouts} checkouts (Total: ${totalSynced})`);
        }

        // Small delay between batches
        if (nextBatch) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } while (nextBatch);

      toast({
        title: "Abandoned Checkouts Sync Complete!",
        description: totalSynced > 0 
          ? `Successfully synced ${totalSynced} abandoned checkouts from Shopify.`
          : "No abandoned checkouts to sync.",
      });
    } catch (error) {
      console.error('Abandoned checkouts sync error:', error);
      toast({
        title: "Abandoned Checkouts Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSyncingAbandonedCheckouts(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 p-6 border border-border rounded-lg bg-card">
        <div>
          <h3 className="text-lg font-semibold">Shopify Product Sync</h3>
          <p className="text-sm text-muted-foreground">
            Sync all products, variants, and images from your Shopify store.
          </p>
        </div>
        
        {syncing && progress.current > 0 && (
          <div className="text-sm text-muted-foreground">
            Synced {progress.current} products...
          </div>
        )}
        
        <Button 
          onClick={syncAllProducts} 
          disabled={syncing || syncingCollections || syncingOrders || syncingOlderOrders || syncingCustomers || syncingAbandonedCheckouts}
          className="w-full"
        >
          {syncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing Products...
            </>
          ) : (
            'Sync All Products'
          )}
        </Button>
      </div>

      <div className="flex flex-col gap-4 p-6 border border-border rounded-lg bg-card">
        <div>
          <h3 className="text-lg font-semibold">Shopify Collections Sync</h3>
          <p className="text-sm text-muted-foreground">
            Sync all collections (categories) from your Shopify store.
          </p>
        </div>
        
        <Button 
          onClick={syncCollections} 
          disabled={syncing || syncingCollections || syncingOrders || syncingOlderOrders || syncingCustomers || syncingAbandonedCheckouts}
          className="w-full"
        >
          {syncingCollections ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing Collections...
            </>
          ) : (
            'Sync All Collections'
          )}
        </Button>
      </div>

      <div className="flex flex-col gap-4 p-6 border border-border rounded-lg bg-card">
        <div>
          <h3 className="text-lg font-semibold">Shopify Orders Sync</h3>
          <p className="text-sm text-muted-foreground">
            Sync new orders and older order history from your Shopify store.
          </p>
        </div>
        
        {(syncingOrders || syncingOlderOrders) && progress.current > 0 && (
          <div className="text-sm text-muted-foreground">
            Synced {progress.current} orders...
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            onClick={syncOrders} 
            disabled={syncing || syncingCollections || syncingOrders || syncingOlderOrders || syncingCustomers || syncingAbandonedCheckouts}
            className="flex-1"
          >
            {syncingOrders ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing New...
              </>
            ) : (
              'Sync New Orders'
            )}
          </Button>
          
          <Button 
            onClick={syncOlderOrders} 
            disabled={syncing || syncingCollections || syncingOrders || syncingOlderOrders || syncingCustomers || syncingAbandonedCheckouts}
            variant="outline"
            className="flex-1"
          >
            {syncingOlderOrders ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing Older...
              </>
            ) : (
              'Sync Older Orders'
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-6 border border-border rounded-lg bg-card">
        <div>
          <h3 className="text-lg font-semibold">Shopify Customers Sync</h3>
          <p className="text-sm text-muted-foreground">
            Sync all customer data from your Shopify store.
          </p>
        </div>
        
        {syncingCustomers && progress.current > 0 && (
          <div className="text-sm text-muted-foreground">
            Synced {progress.current} customers...
          </div>
        )}
        
        <Button 
          onClick={syncCustomers} 
          disabled={syncing || syncingCollections || syncingOrders || syncingOlderOrders || syncingCustomers || syncingAbandonedCheckouts}
          className="w-full"
        >
          {syncingCustomers ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing Customers...
            </>
          ) : (
            'Sync All Customers'
          )}
        </Button>
      </div>

      <div className="flex flex-col gap-4 p-6 border border-border rounded-lg bg-card">
        <div>
          <h3 className="text-lg font-semibold">Abandoned Checkouts Sync</h3>
          <p className="text-sm text-muted-foreground">
            Sync abandoned checkouts from your Shopify store for recovery.
          </p>
        </div>
        
        {syncingAbandonedCheckouts && progress.current > 0 && (
          <div className="text-sm text-muted-foreground">
            Synced {progress.current} abandoned checkouts...
          </div>
        )}
        
        <Button 
          onClick={syncAbandonedCheckouts} 
          disabled={syncing || syncingCollections || syncingOrders || syncingOlderOrders || syncingCustomers || syncingAbandonedCheckouts}
          className="w-full"
        >
          {syncingAbandonedCheckouts ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing Checkouts...
            </>
          ) : (
            'Sync Abandoned Checkouts'
          )}
        </Button>
      </div>
    </div>
  );
};
