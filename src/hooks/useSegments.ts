import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SegmentFilter {
  field: string;
  operator: string;
  value: any;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string | null;
  filters: SegmentFilter[];
  customer_count: number;
  created_at: string;
  updated_at: string;
}

export const useSegments = () => {
  return useQuery({
    queryKey: ["customer-segments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_segments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map((segment) => ({
        ...segment,
        filters: Array.isArray(segment.filters) ? segment.filters as unknown as SegmentFilter[] : [],
      })) as CustomerSegment[];
    },
  });
};

export const useCreateSegment = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (segment: {
      name: string;
      description?: string;
      filters: SegmentFilter[];
    }) => {
      const { data, error } = await supabase
        .from("customer_segments")
        .insert({
          name: segment.name,
          description: segment.description || null,
          filters: segment.filters as any,
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        filters: Array.isArray(data.filters) ? data.filters as unknown as SegmentFilter[] : [],
      } as CustomerSegment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-segments"] });
      toast({
        title: "Success",
        description: "Segment created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create segment",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateSegment = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CustomerSegment>;
    }) => {
      const updateData: any = { ...updates };
      if (updateData.filters) {
        updateData.filters = updateData.filters as any;
      }
      
      const { data, error } = await supabase
        .from("customer_segments")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        filters: Array.isArray(data.filters) ? data.filters as unknown as SegmentFilter[] : [],
      } as CustomerSegment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-segments"] });
      toast({
        title: "Success",
        description: "Segment updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update segment",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteSegment = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customer_segments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-segments"] });
      toast({
        title: "Success",
        description: "Segment deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete segment",
        variant: "destructive",
      });
    },
  });
};

export const useSegmentCustomers = (filters: SegmentFilter[]) => {
  return useQuery({
    queryKey: ["segment-customers", JSON.stringify(filters)],
    queryFn: async () => {
      // Use any to avoid TypeScript deep instantiation issues with query builder
      let query: any = supabase.from("customers").select("*");
      
      // Apply each filter
      for (const filter of filters) {
        const { field, operator, value } = filter;
        
        if (operator === "equals") {
          query = query.eq(field, value);
        } else if (operator === "not_equals") {
          query = query.neq(field, value);
        } else if (operator === "greater_than") {
          query = query.gt(field, value);
        } else if (operator === "less_than") {
          query = query.lt(field, value);
        } else if (operator === "greater_than_or_equal") {
          query = query.gte(field, value);
        } else if (operator === "less_than_or_equal") {
          query = query.lte(field, value);
        } else if (operator === "contains") {
          query = query.ilike(field, `%${value}%`);
        } else if (operator === "is_true") {
          query = query.eq(field, true);
        } else if (operator === "is_false") {
          query = query.eq(field, false);
        }
      }

      const result = await query.order("created_at", { ascending: false });

      if (result.error) throw result.error;
      return result.data || [];
    },
    enabled: filters.length > 0,
  });
};
