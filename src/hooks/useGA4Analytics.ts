import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GA4Summary {
  pageViews: number;
  users: number;
  sessions: number;
  bounceRate: string;
  avgSessionDuration: string;
}

interface DailyTraffic {
  date: string;
  pageViews: number;
  visitors: number;
  sessions: number;
}

interface TrafficSource {
  name: string;
  value: number;
}

interface TopPage {
  page: string;
  views: number;
}

interface DeviceData {
  name: string;
  value: number;
}

export interface GA4AnalyticsData {
  summary: GA4Summary;
  dailyTraffic: DailyTraffic[];
  trafficSources: TrafficSource[];
  topPages: TopPage[];
  devices: DeviceData[];
}

export function useGA4Analytics(startDate = "7daysAgo", endDate = "today") {
  return useQuery({
    queryKey: ["ga4-analytics", startDate, endDate],
    queryFn: async (): Promise<GA4AnalyticsData> => {
      const { data, error } = await supabase.functions.invoke("ga4-analytics", {
        body: { startDate, endDate },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
