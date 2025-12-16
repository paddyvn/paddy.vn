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
      acc_transaction_categories: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          name_vi: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          name_vi: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_vi?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      acc_transactions: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          credit_account: string | null
          currency: string | null
          debit_account: string | null
          description: string | null
          id: string
          notes: string | null
          payment_method: string | null
          reference_number: string | null
          status: string | null
          tax_amount: number | null
          tax_rate: number | null
          transaction_date: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_account?: string | null
          currency?: string | null
          debit_account?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference_number?: string | null
          status?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          transaction_date: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_account?: string | null
          currency?: string | null
          debit_account?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference_number?: string | null
          status?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          transaction_date?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_transactions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "acc_transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          rules: Json | null
          rules_match_type: string | null
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
          rules?: Json | null
          rules_match_type?: string | null
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
          rules?: Json | null
          rules_match_type?: string | null
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
      custom_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
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
      misa_invoice_marketplaces: {
        Row: {
          address: string | null
          buyer_name: string | null
          buyer_person: string | null
          created_at: string
          discount_amount: number | null
          email: string | null
          id: string
          invoice_date: string | null
          invoice_number: number
          order_code: string | null
          payment_method: string | null
          product_code: string
          product_name: string
          quantity: number | null
          subtotal: number | null
          tax_code: string | null
          unit: string | null
          unit_price: number | null
          updated_at: string
          vat_amount: number | null
          vat_rate: string | null
        }
        Insert: {
          address?: string | null
          buyer_name?: string | null
          buyer_person?: string | null
          created_at?: string
          discount_amount?: number | null
          email?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number: number
          order_code?: string | null
          payment_method?: string | null
          product_code: string
          product_name: string
          quantity?: number | null
          subtotal?: number | null
          tax_code?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: string | null
        }
        Update: {
          address?: string | null
          buyer_name?: string | null
          buyer_person?: string | null
          created_at?: string
          discount_amount?: number | null
          email?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: number
          order_code?: string | null
          payment_method?: string | null
          product_code?: string
          product_name?: string
          quantity?: number | null
          subtotal?: number | null
          tax_code?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: string | null
        }
        Relationships: []
      }
      misa_products: {
        Row: {
          branch: string | null
          calculation: string | null
          category: string | null
          conversion_rate: number | null
          conversion_unit: string | null
          created_at: string
          description: string | null
          fixed_price: number | null
          fixed_purchase_price: number | null
          fixed_selling_price: number | null
          id: string
          main_unit: string | null
          name: string
          product_group: string | null
          product_nature: string | null
          selling_price_1: number | null
          selling_price_2: number | null
          selling_price_3: number | null
          sku: string
          source: string | null
          status: string | null
          stock_quantity: number | null
          stock_value: number | null
          synced_at: string
          tax_reduction: string | null
          updated_at: string
          vat: string | null
        }
        Insert: {
          branch?: string | null
          calculation?: string | null
          category?: string | null
          conversion_rate?: number | null
          conversion_unit?: string | null
          created_at?: string
          description?: string | null
          fixed_price?: number | null
          fixed_purchase_price?: number | null
          fixed_selling_price?: number | null
          id?: string
          main_unit?: string | null
          name: string
          product_group?: string | null
          product_nature?: string | null
          selling_price_1?: number | null
          selling_price_2?: number | null
          selling_price_3?: number | null
          sku: string
          source?: string | null
          status?: string | null
          stock_quantity?: number | null
          stock_value?: number | null
          synced_at?: string
          tax_reduction?: string | null
          updated_at?: string
          vat?: string | null
        }
        Update: {
          branch?: string | null
          calculation?: string | null
          category?: string | null
          conversion_rate?: number | null
          conversion_unit?: string | null
          created_at?: string
          description?: string | null
          fixed_price?: number | null
          fixed_purchase_price?: number | null
          fixed_selling_price?: number | null
          id?: string
          main_unit?: string | null
          name?: string
          product_group?: string | null
          product_nature?: string | null
          selling_price_1?: number | null
          selling_price_2?: number | null
          selling_price_3?: number | null
          sku?: string
          source?: string | null
          status?: string | null
          stock_quantity?: number | null
          stock_value?: number | null
          synced_at?: string
          tax_reduction?: string | null
          updated_at?: string
          vat?: string | null
        }
        Relationships: []
      }
      navigation_columns: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          menu_id: string
          shop_all_link: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          menu_id: string
          shop_all_link?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          menu_id?: string
          shop_all_link?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "navigation_columns_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "navigation_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_items: {
        Row: {
          column_id: string
          created_at: string | null
          display_order: number | null
          id: string
          label: string
          link: string
          updated_at: string | null
        }
        Insert: {
          column_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          label: string
          link: string
          updated_at?: string | null
        }
        Update: {
          column_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          label?: string
          link?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "navigation_items_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "navigation_columns"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_menus: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          promo_badge: string | null
          promo_image_url: string | null
          promo_link: string | null
          promo_title: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          promo_badge?: string | null
          promo_image_url?: string | null
          promo_link?: string | null
          promo_title?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          promo_badge?: string | null
          promo_image_url?: string | null
          promo_link?: string | null
          promo_title?: string | null
          slug?: string
          updated_at?: string | null
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
      pets: {
        Row: {
          age_months: number | null
          age_years: number | null
          breed: string | null
          created_at: string
          id: string
          name: string
          photo_url: string | null
          species: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_months?: number | null
          age_years?: number | null
          breed?: string | null
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
          species: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_months?: number | null
          age_years?: number | null
          breed?: string | null
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          species?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_age_ranges: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          name_vi: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          name_vi: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_vi?: string
          updated_at?: string | null
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
      product_health_condition_links: {
        Row: {
          created_at: string | null
          health_condition_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          health_condition_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          health_condition_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_health_condition_links_health_condition_id_fkey"
            columns: ["health_condition_id"]
            isOneToOne: false
            referencedRelation: "product_health_conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_health_condition_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_health_conditions: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          name_vi: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          name_vi: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_vi?: string
          updated_at?: string | null
        }
        Relationships: []
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
          source_image_id: string | null
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
          source_image_id?: string | null
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
          source_image_id?: string | null
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
      product_option_template_values: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          template_id: string
          value: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          template_id: string
          value: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          template_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_template_values_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "product_option_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_templates: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_origins: {
        Row: {
          country_code: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          name_vi: string
          updated_at: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          name_vi: string
          updated_at?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_vi?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_sizes: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          name_vi: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          name_vi: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_vi?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          barcode: string | null
          compare_at_price: number | null
          created_at: string
          id: string
          input_vat_rate: number | null
          name: string
          option1: string | null
          option2: string | null
          option3: string | null
          output_vat_rate: number | null
          price: number
          product_id: string
          sku: string | null
          source_variant_id: string | null
          stock_quantity: number | null
          taxable: boolean | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          barcode?: string | null
          compare_at_price?: number | null
          created_at?: string
          id?: string
          input_vat_rate?: number | null
          name: string
          option1?: string | null
          option2?: string | null
          option3?: string | null
          output_vat_rate?: number | null
          price: number
          product_id: string
          sku?: string | null
          source_variant_id?: string | null
          stock_quantity?: number | null
          taxable?: boolean | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          barcode?: string | null
          compare_at_price?: number | null
          created_at?: string
          id?: string
          input_vat_rate?: number | null
          name?: string
          option1?: string | null
          option2?: string | null
          option3?: string | null
          output_vat_rate?: number | null
          price?: number
          product_id?: string
          sku?: string | null
          source_variant_id?: string | null
          stock_quantity?: number | null
          taxable?: boolean | null
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
          brand: string | null
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
          origin_id: string | null
          pet_type: string | null
          product_type: string | null
          published_at: string | null
          rating: number | null
          rating_count: number | null
          short_description: string | null
          slug: string
          source_created_at: string | null
          source_id: string | null
          source_updated_at: string | null
          tags: string | null
          target_age_id: string | null
          target_size_id: string | null
          updated_at: string
        }
        Insert: {
          base_price: number
          brand?: string | null
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
          origin_id?: string | null
          pet_type?: string | null
          product_type?: string | null
          published_at?: string | null
          rating?: number | null
          rating_count?: number | null
          short_description?: string | null
          slug: string
          source_created_at?: string | null
          source_id?: string | null
          source_updated_at?: string | null
          tags?: string | null
          target_age_id?: string | null
          target_size_id?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          brand?: string | null
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
          origin_id?: string | null
          pet_type?: string | null
          product_type?: string | null
          published_at?: string | null
          rating?: number | null
          rating_count?: number | null
          short_description?: string | null
          slug?: string
          source_created_at?: string | null
          source_id?: string | null
          source_updated_at?: string | null
          tags?: string | null
          target_age_id?: string | null
          target_size_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "product_origins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_target_age_id_fkey"
            columns: ["target_age_id"]
            isOneToOne: false
            referencedRelation: "product_age_ranges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_target_size_id_fkey"
            columns: ["target_size_id"]
            isOneToOne: false
            referencedRelation: "product_sizes"
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
          invited_at: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          invited_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          invited_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          created_at: string
          display_order: number | null
          end_date: string | null
          gradient_from: string | null
          gradient_to: string | null
          id: string
          is_active: boolean | null
          link_destination: string
          link_type: string
          promo_type: string | null
          start_date: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          end_date?: string | null
          gradient_from?: string | null
          gradient_to?: string | null
          id?: string
          is_active?: boolean | null
          link_destination: string
          link_type?: string
          promo_type?: string | null
          start_date?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          end_date?: string | null
          gradient_from?: string | null
          gradient_to?: string | null
          id?: string
          is_active?: boolean | null
          link_destination?: string
          link_type?: string
          promo_type?: string | null
          start_date?: string | null
          subtitle?: string | null
          title?: string
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
      role_permissions: {
        Row: {
          created_at: string
          id: string
          module_name: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_name: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_name?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      sapo_order_items: {
        Row: {
          discount_amount: number | null
          id: string
          name: string | null
          note: string | null
          order_id: string
          price: number
          product_id: number | null
          product_name: string | null
          quantity: number
          sapo_item_id: number | null
          sku: string | null
          tax_amount: number | null
          variant_id: number | null
          variant_name: string | null
          weight: number | null
        }
        Insert: {
          discount_amount?: number | null
          id?: string
          name?: string | null
          note?: string | null
          order_id: string
          price?: number
          product_id?: number | null
          product_name?: string | null
          quantity?: number
          sapo_item_id?: number | null
          sku?: string | null
          tax_amount?: number | null
          variant_id?: number | null
          variant_name?: string | null
          weight?: number | null
        }
        Update: {
          discount_amount?: number | null
          id?: string
          name?: string | null
          note?: string | null
          order_id?: string
          price?: number
          product_id?: number | null
          product_name?: string | null
          quantity?: number
          sapo_item_id?: number | null
          sku?: string | null
          tax_amount?: number | null
          variant_id?: number | null
          variant_name?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sapo_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sapo_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sapo_orders: {
        Row: {
          account_id: number | null
          assignee_id: number | null
          billing_address: Json | null
          browser_ip: string | null
          cancelled_on: string | null
          channel: string | null
          closed_on: string | null
          code: string
          confirmed_on: string | null
          contact_id: number | null
          coupon_code: string | null
          created_on: string | null
          currency: string | null
          customer_code: string | null
          customer_email: string | null
          customer_id: number | null
          customer_name: string | null
          customer_phone: string | null
          email: string | null
          financial_status: string | null
          fulfillment_status: string | null
          gateway: string | null
          id: string
          invoiced_at: string | null
          issued_on: string | null
          landing_site: string | null
          location_id: number | null
          modified_on: string | null
          note: string | null
          payment_status: string | null
          phone_number: string | null
          price_list_id: number | null
          process_status_id: number | null
          reference_number: string | null
          reference_url: string | null
          referring_site: string | null
          sapo_order_id: number
          ship_on_max: string | null
          ship_on_min: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          source_id: number | null
          source_name: string | null
          status: string | null
          synced_at: string
          tags: string | null
          tax_treatment: string | null
          total: number | null
          total_discount: number | null
          total_tax: number | null
          total_weight: number | null
        }
        Insert: {
          account_id?: number | null
          assignee_id?: number | null
          billing_address?: Json | null
          browser_ip?: string | null
          cancelled_on?: string | null
          channel?: string | null
          closed_on?: string | null
          code: string
          confirmed_on?: string | null
          contact_id?: number | null
          coupon_code?: string | null
          created_on?: string | null
          currency?: string | null
          customer_code?: string | null
          customer_email?: string | null
          customer_id?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          email?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          gateway?: string | null
          id?: string
          invoiced_at?: string | null
          issued_on?: string | null
          landing_site?: string | null
          location_id?: number | null
          modified_on?: string | null
          note?: string | null
          payment_status?: string | null
          phone_number?: string | null
          price_list_id?: number | null
          process_status_id?: number | null
          reference_number?: string | null
          reference_url?: string | null
          referring_site?: string | null
          sapo_order_id: number
          ship_on_max?: string | null
          ship_on_min?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          source_id?: number | null
          source_name?: string | null
          status?: string | null
          synced_at?: string
          tags?: string | null
          tax_treatment?: string | null
          total?: number | null
          total_discount?: number | null
          total_tax?: number | null
          total_weight?: number | null
        }
        Update: {
          account_id?: number | null
          assignee_id?: number | null
          billing_address?: Json | null
          browser_ip?: string | null
          cancelled_on?: string | null
          channel?: string | null
          closed_on?: string | null
          code?: string
          confirmed_on?: string | null
          contact_id?: number | null
          coupon_code?: string | null
          created_on?: string | null
          currency?: string | null
          customer_code?: string | null
          customer_email?: string | null
          customer_id?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          email?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          gateway?: string | null
          id?: string
          invoiced_at?: string | null
          issued_on?: string | null
          landing_site?: string | null
          location_id?: number | null
          modified_on?: string | null
          note?: string | null
          payment_status?: string | null
          phone_number?: string | null
          price_list_id?: number | null
          process_status_id?: number | null
          reference_number?: string | null
          reference_url?: string | null
          referring_site?: string | null
          sapo_order_id?: number
          ship_on_max?: string | null
          ship_on_min?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          source_id?: number | null
          source_name?: string | null
          status?: string | null
          synced_at?: string
          tags?: string | null
          tax_treatment?: string | null
          total?: number | null
          total_discount?: number | null
          total_tax?: number | null
          total_weight?: number | null
        }
        Relationships: []
      }
      sapo_product_images: {
        Row: {
          id: string
          image_url: string
          position: number | null
          sapo_image_id: number
          sapo_product_id: string
          synced_at: string
        }
        Insert: {
          id?: string
          image_url: string
          position?: number | null
          sapo_image_id: number
          sapo_product_id: string
          synced_at?: string
        }
        Update: {
          id?: string
          image_url?: string
          position?: number | null
          sapo_image_id?: number
          sapo_product_id?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sapo_product_images_sapo_product_id_fkey"
            columns: ["sapo_product_id"]
            isOneToOne: false
            referencedRelation: "sapo_products"
            referencedColumns: ["id"]
          },
        ]
      }
      sapo_product_variants: {
        Row: {
          barcode: string | null
          id: string
          import_price: number | null
          input_vat_rate: number | null
          linked_variant_id: string | null
          name: string
          note: string | null
          opt1: string | null
          opt2: string | null
          opt3: string | null
          output_vat_rate: number | null
          retail_price: number | null
          sapo_product_id: string
          sapo_variant_id: number | null
          sku: string | null
          sku_converted: string | null
          source: string | null
          stock_quantity: number | null
          synced_at: string
          taxable: boolean | null
          ten_hang: string | null
          thue_gtgt: string | null
          unit: string | null
          weight_unit: string | null
          weight_value: number | null
        }
        Insert: {
          barcode?: string | null
          id?: string
          import_price?: number | null
          input_vat_rate?: number | null
          linked_variant_id?: string | null
          name: string
          note?: string | null
          opt1?: string | null
          opt2?: string | null
          opt3?: string | null
          output_vat_rate?: number | null
          retail_price?: number | null
          sapo_product_id: string
          sapo_variant_id?: number | null
          sku?: string | null
          sku_converted?: string | null
          source?: string | null
          stock_quantity?: number | null
          synced_at?: string
          taxable?: boolean | null
          ten_hang?: string | null
          thue_gtgt?: string | null
          unit?: string | null
          weight_unit?: string | null
          weight_value?: number | null
        }
        Update: {
          barcode?: string | null
          id?: string
          import_price?: number | null
          input_vat_rate?: number | null
          linked_variant_id?: string | null
          name?: string
          note?: string | null
          opt1?: string | null
          opt2?: string | null
          opt3?: string | null
          output_vat_rate?: number | null
          retail_price?: number | null
          sapo_product_id?: string
          sapo_variant_id?: number | null
          sku?: string | null
          sku_converted?: string | null
          source?: string | null
          stock_quantity?: number | null
          synced_at?: string
          taxable?: boolean | null
          ten_hang?: string | null
          thue_gtgt?: string | null
          unit?: string | null
          weight_unit?: string | null
          weight_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sapo_product_variants_linked_variant_id_fkey"
            columns: ["linked_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sapo_product_variants_sapo_product_id_fkey"
            columns: ["sapo_product_id"]
            isOneToOne: false
            referencedRelation: "sapo_products"
            referencedColumns: ["id"]
          },
        ]
      }
      sapo_products: {
        Row: {
          brand: string | null
          category: string | null
          created_on: string | null
          description: string | null
          id: string
          linked_product_id: string | null
          modified_on: string | null
          name: string
          note: string | null
          opt1: string | null
          opt2: string | null
          opt3: string | null
          product_type: string | null
          published_on: string | null
          sapo_id: number | null
          sku_converted: string | null
          source: string | null
          synced_at: string
          tags: string | null
          ten_hang: string | null
          unit: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_on?: string | null
          description?: string | null
          id?: string
          linked_product_id?: string | null
          modified_on?: string | null
          name: string
          note?: string | null
          opt1?: string | null
          opt2?: string | null
          opt3?: string | null
          product_type?: string | null
          published_on?: string | null
          sapo_id?: number | null
          sku_converted?: string | null
          source?: string | null
          synced_at?: string
          tags?: string | null
          ten_hang?: string | null
          unit?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_on?: string | null
          description?: string | null
          id?: string
          linked_product_id?: string | null
          modified_on?: string | null
          name?: string
          note?: string | null
          opt1?: string | null
          opt2?: string | null
          opt3?: string | null
          product_type?: string | null
          published_on?: string | null
          sapo_id?: number | null
          sku_converted?: string | null
          source?: string | null
          synced_at?: string
          tags?: string | null
          ten_hang?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sapo_products_linked_product_id_fkey"
            columns: ["linked_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_custom_roles: {
        Row: {
          created_at: string
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_custom_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_access: {
        Row: {
          created_at: string
          id: string
          module_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_access_user_id_fkey"
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
      has_module_access: {
        Args: { _module_name: string; _user_id: string }
        Returns: boolean
      }
      has_module_access_via_role: {
        Args: { _module_name: string; _user_id: string }
        Returns: boolean
      }
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
