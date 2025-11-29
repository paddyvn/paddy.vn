export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      abandoned_checkouts: {
        Row: {
          abandoned_checkout_url: string | null
          billing_address: Json | null
          cart_token: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          email: string | null
          id: string
          line_items: Json | null
          phone: string | null
          shipping_address: Json | null
          shopify_checkout_id: string | null
          shopify_created_at: string | null
          shopify_updated_at: string | null
          subtotal_price: number | null
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          abandoned_checkout_url?: string | null
          billing_address?: Json | null
          cart_token?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          email?: string | null
          id?: string
          line_items?: Json | null
          phone?: string | null
          shipping_address?: Json | null
          shopify_checkout_id?: string | null
          shopify_created_at?: string | null
          shopify_updated_at?: string | null
          subtotal_price?: number | null
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          abandoned_checkout_url?: string | null
          billing_address?: Json | null
          cart_token?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          email?: string | null
          id?: string
          line_items?: Json | null
          phone?: string | null
          shipping_address?: Json | null
          shopify_checkout_id?: string | null
          shopify_created_at?: string | null
          shopify_updated_at?: string | null
          subtotal_price?: number | null
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string
          district: string | null
          full_name: string
          id: string
          is_default: boolean | null
          phone: string
          postal_code: string | null
          updated_at: string
          user_id: string
          ward: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          created_at?: string
          district?: string | null
          full_name: string
          id?: string
          is_default?: boolean | null
          phone: string
          postal_code?: string | null
          updated_at?: string
          user_id: string
          ward?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          created_at?: string
          district?: string | null
          full_name?: string
          id?: string
          is_default?: boolean | null
          phone?: string
          postal_code?: string | null
          updated_at?: string
          user_id?: string
          ward?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string | null
          blog_title: string | null
          body_html: string | null
          created_at: string
          handle: string
          id: string
          image_url: string | null
          published: boolean | null
          shopify_article_id: string | null
          shopify_blog_id: string | null
          shopify_created_at: string | null
          shopify_published_at: string | null
          shopify_updated_at: string | null
          summary_html: string | null
          tags: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          blog_title?: string | null
          body_html?: string | null
          created_at?: string
          handle: string
          id?: string
          image_url?: string | null
          published?: boolean | null
          shopify_article_id?: string | null
          shopify_blog_id?: string | null
          shopify_created_at?: string | null
          shopify_published_at?: string | null
          shopify_updated_at?: string | null
          summary_html?: string | null
          tags?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          blog_title?: string | null
          body_html?: string | null
          created_at?: string
          handle?: string
          id?: string
          image_url?: string | null
          published?: boolean | null
          shopify_article_id?: string | null
          shopify_blog_id?: string | null
          shopify_created_at?: string | null
          shopify_published_at?: string | null
          shopify_updated_at?: string | null
          summary_html?: string | null
          tags?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          collection_type: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          parent_id: string | null
          shopify_collection_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          collection_type?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          parent_id?: string | null
          shopify_collection_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          collection_type?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          parent_id?: string | null
          shopify_collection_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_purchase: number | null
          starts_at: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_purchase?: number | null
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_purchase?: number | null
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Relationships: []
      }
      customer_segments: {
        Row: {
          created_at: string | null
          customer_count: number | null
          description: string | null
          filters: Json
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_count?: number | null
          description?: string | null
          filters?: Json
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_count?: number | null
          description?: string | null
          filters?: Json
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          accepts_marketing: boolean | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          marketing_opt_in_level: string | null
          note: string | null
          orders_count: number | null
          phone: string | null
          shopify_created_at: string | null
          shopify_customer_id: string | null
          shopify_updated_at: string | null
          tags: string | null
          total_spent: number | null
          updated_at: string
          verified_email: boolean | null
        }
        Insert: {
          accepts_marketing?: boolean | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          marketing_opt_in_level?: string | null
          note?: string | null
          orders_count?: number | null
          phone?: string | null
          shopify_created_at?: string | null
          shopify_customer_id?: string | null
          shopify_updated_at?: string | null
          tags?: string | null
          total_spent?: number | null
          updated_at?: string
          verified_email?: boolean | null
        }
        Update: {
          accepts_marketing?: boolean | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          marketing_opt_in_level?: string | null
          note?: string | null
          orders_count?: number | null
          phone?: string | null
          shopify_created_at?: string | null
          shopify_customer_id?: string | null
          shopify_updated_at?: string | null
          tags?: string | null
          total_spent?: number | null
          updated_at?: string
          verified_email?: boolean | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          quantity: number
          subtotal: number
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          product_name: string
          quantity: number
          subtotal: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          discount: number | null
          id: string
          notes: string | null
          order_number: string
          shipping_address: Json
          shipping_fee: number | null
          shopify_order_id: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          discount?: number | null
          id?: string
          notes?: string | null
          order_number: string
          shipping_address: Json
          shipping_fee?: number | null
          shopify_order_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          discount?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          shipping_address?: Json
          shipping_fee?: number | null
          shopify_order_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          author: string | null
          body_html: string | null
          created_at: string
          handle: string
          id: string
          published: boolean | null
          shopify_created_at: string | null
          shopify_page_id: string | null
          shopify_updated_at: string | null
          template_suffix: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          body_html?: string | null
          created_at?: string
          handle: string
          id?: string
          published?: boolean | null
          shopify_created_at?: string | null
          shopify_page_id?: string | null
          shopify_updated_at?: string | null
          template_suffix?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          body_html?: string | null
          created_at?: string
          handle?: string
          id?: string
          published?: boolean | null
          shopify_created_at?: string | null
          shopify_page_id?: string | null
          shopify_updated_at?: string | null
          template_suffix?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_collections: {
        Row: {
          collection_id: string
          created_at: string | null
          id: string
          position: number | null
          product_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          id?: string
          position?: number | null
          product_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          id?: string
          position?: number | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_collections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          product_id: string
          shopify_image_id: string | null
          variant_ids: Json | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id: string
          shopify_image_id?: string | null
          variant_ids?: Json | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string
          shopify_image_id?: string | null
          variant_ids?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          barcode: string | null
          compare_at_price: number | null
          created_at: string
          id: string
          name: string
          option1: string | null
          option2: string | null
          option3: string | null
          price: number
          product_id: string
          shopify_variant_id: string | null
          sku: string | null
          stock_quantity: number | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          barcode?: string | null
          compare_at_price?: number | null
          created_at?: string
          id?: string
          name: string
          option1?: string | null
          option2?: string | null
          option3?: string | null
          price: number
          product_id: string
          shopify_variant_id?: string | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          barcode?: string | null
          compare_at_price?: number | null
          created_at?: string
          id?: string
          name?: string
          option1?: string | null
          option2?: string | null
          option3?: string | null
          price?: number
          product_id?: string
          shopify_variant_id?: string | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          option1_name: string | null
          option2_name: string | null
          option3_name: string | null
          product_type: string | null
          published_at: string | null
          shopify_created_at: string | null
          shopify_product_id: string | null
          shopify_updated_at: string | null
          short_description: string | null
          slug: string
          tags: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          base_price: number
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          option1_name?: string | null
          option2_name?: string | null
          option3_name?: string | null
          product_type?: string | null
          published_at?: string | null
          shopify_created_at?: string | null
          shopify_product_id?: string | null
          shopify_updated_at?: string | null
          short_description?: string | null
          slug: string
          tags?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          base_price?: number
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          option1_name?: string | null
          option2_name?: string | null
          option3_name?: string | null
          product_type?: string | null
          published_at?: string | null
          shopify_created_at?: string | null
          shopify_product_id?: string | null
          shopify_updated_at?: string | null
          short_description?: string | null
          slug?: string
          tags?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_verified_purchase: boolean | null
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_verified_purchase?: boolean | null
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_verified_purchase?: boolean | null
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      order_status:
        | "pending"
        | "processing"
        | "confirmed"
        | "shipped"
        | "delivered"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
      order_status: [
        "pending",
        "processing",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
