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
    PostgrestVersion: "14.1"
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
      acc_expense_subtypes: {
        Row: {
          category_id: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          label_vi: string
          updated_at: string
          value: string
        }
        Insert: {
          category_id: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label_vi: string
          updated_at?: string
          value: string
        }
        Update: {
          category_id?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label_vi?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_expense_subtypes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "acc_transaction_categories"
            referencedColumns: ["id"]
          },
        ]
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
      acc_transaction_lazada: {
        Row: {
          ads: number | null
          ads_sponsored: number | null
          affiliate_commission: number | null
          balance_adjustments: number | null
          compensation: number | null
          created_at: string
          fee_campaign: number | null
          fee_fixed: number | null
          fee_flexi_combo: number | null
          fee_payment: number | null
          fee_seller_program: number | null
          fee_service: number | null
          fee_shipping: number | null
          gross_revenue: number | null
          id: string
          month: number
          notes: string | null
          other_income: number | null
          other_income_reward: number | null
          refund_to_buyer: number | null
          seller_voucher: number | null
          updated_at: string
          year: number
        }
        Insert: {
          ads?: number | null
          ads_sponsored?: number | null
          affiliate_commission?: number | null
          balance_adjustments?: number | null
          compensation?: number | null
          created_at?: string
          fee_campaign?: number | null
          fee_fixed?: number | null
          fee_flexi_combo?: number | null
          fee_payment?: number | null
          fee_seller_program?: number | null
          fee_service?: number | null
          fee_shipping?: number | null
          gross_revenue?: number | null
          id?: string
          month: number
          notes?: string | null
          other_income?: number | null
          other_income_reward?: number | null
          refund_to_buyer?: number | null
          seller_voucher?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          ads?: number | null
          ads_sponsored?: number | null
          affiliate_commission?: number | null
          balance_adjustments?: number | null
          compensation?: number | null
          created_at?: string
          fee_campaign?: number | null
          fee_fixed?: number | null
          fee_flexi_combo?: number | null
          fee_payment?: number | null
          fee_seller_program?: number | null
          fee_service?: number | null
          fee_shipping?: number | null
          gross_revenue?: number | null
          id?: string
          month?: number
          notes?: string | null
          other_income?: number | null
          other_income_reward?: number | null
          refund_to_buyer?: number | null
          seller_voucher?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      acc_transaction_shopee: {
        Row: {
          ads: number | null
          affiliate_commission: number | null
          created_at: string
          fee_fixed: number | null
          fee_payment: number | null
          fee_service: number | null
          fee_shipping: number | null
          gross_revenue: number | null
          id: string
          month: number
          notes: string | null
          other_income: number | null
          refund_to_buyer: number | null
          seller_voucher: number | null
          updated_at: string
          year: number
        }
        Insert: {
          ads?: number | null
          affiliate_commission?: number | null
          created_at?: string
          fee_fixed?: number | null
          fee_payment?: number | null
          fee_service?: number | null
          fee_shipping?: number | null
          gross_revenue?: number | null
          id?: string
          month: number
          notes?: string | null
          other_income?: number | null
          refund_to_buyer?: number | null
          seller_voucher?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          ads?: number | null
          affiliate_commission?: number | null
          created_at?: string
          fee_fixed?: number | null
          fee_payment?: number | null
          fee_service?: number | null
          fee_shipping?: number | null
          gross_revenue?: number | null
          id?: string
          month?: number
          notes?: string | null
          other_income?: number | null
          refund_to_buyer?: number | null
          seller_voucher?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      acc_transaction_tiktok: {
        Row: {
          ads: number | null
          affiliate_commission: number | null
          balance_adjustments: number | null
          created_at: string
          fee_fixed: number | null
          fee_order_processing: number | null
          fee_payment: number | null
          fee_service: number | null
          fee_shipping: number | null
          gross_revenue: number | null
          id: string
          month: number
          notes: string | null
          other_income: number | null
          refund_to_buyer: number | null
          seller_voucher: number | null
          tax_cit: number | null
          tax_vat: number | null
          updated_at: string
          year: number
        }
        Insert: {
          ads?: number | null
          affiliate_commission?: number | null
          balance_adjustments?: number | null
          created_at?: string
          fee_fixed?: number | null
          fee_order_processing?: number | null
          fee_payment?: number | null
          fee_service?: number | null
          fee_shipping?: number | null
          gross_revenue?: number | null
          id?: string
          month: number
          notes?: string | null
          other_income?: number | null
          refund_to_buyer?: number | null
          seller_voucher?: number | null
          tax_cit?: number | null
          tax_vat?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          ads?: number | null
          affiliate_commission?: number | null
          balance_adjustments?: number | null
          created_at?: string
          fee_fixed?: number | null
          fee_order_processing?: number | null
          fee_payment?: number | null
          fee_service?: number | null
          fee_shipping?: number | null
          gross_revenue?: number | null
          id?: string
          month?: number
          notes?: string | null
          other_income?: number | null
          refund_to_buyer?: number | null
          seller_voucher?: number | null
          tax_cit?: number | null
          tax_vat?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      acc_transactions: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          branch: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          credit_account: string | null
          currency: string | null
          debit_account: string | null
          description: string | null
          expense_subtype: string | null
          has_invoice: boolean | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          notes: string | null
          payee_name: string | null
          payment_method: string | null
          pic: string | null
          purchase_order_id: string | null
          reference_number: string | null
          status: string | null
          supplier_id: string | null
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
          branch?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_account?: string | null
          currency?: string | null
          debit_account?: string | null
          description?: string | null
          expense_subtype?: string | null
          has_invoice?: boolean | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          payee_name?: string | null
          payment_method?: string | null
          pic?: string | null
          purchase_order_id?: string | null
          reference_number?: string | null
          status?: string | null
          supplier_id?: string | null
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
          branch?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_account?: string | null
          currency?: string | null
          debit_account?: string | null
          description?: string | null
          expense_subtype?: string | null
          has_invoice?: boolean | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          payee_name?: string | null
          payment_method?: string | null
          pic?: string | null
          purchase_order_id?: string | null
          reference_number?: string | null
          status?: string | null
          supplier_id?: string | null
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
          {
            foreignKeyName: "acc_transactions_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "sapo_purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "sapo_suppliers"
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
      banners: {
        Row: {
          background_color: string | null
          created_at: string | null
          display_order: number | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          starts_at: string | null
          subtitle: string | null
          text_color: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          created_at?: string | null
          display_order?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          starts_at?: string | null
          subtitle?: string | null
          text_color?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          created_at?: string | null
          display_order?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          starts_at?: string | null
          subtitle?: string | null
          text_color?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          name_vi: string | null
          shopify_blog_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          name_vi?: string | null
          shopify_blog_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_vi?: string | null
          shopify_blog_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number | null
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_user_id_fkey"
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
          category_id: string | null
          created_at: string
          handle: string
          id: string
          image_url: string | null
          meta_description: string | null
          meta_title: string | null
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
          category_id?: string | null
          created_at?: string
          handle: string
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
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
          category_id?: string | null
          created_at?: string
          handle?: string
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
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
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          country_code: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          slug: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
          website_url?: string | null
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
      customer_addresses: {
        Row: {
          address1: string
          address2: string | null
          city: string
          company: string | null
          country: string
          country_code: string | null
          created_at: string
          customer_id: string
          first_name: string | null
          id: string
          is_default: boolean | null
          last_name: string | null
          phone: string | null
          postal_code: string | null
          province: string | null
          updated_at: string
        }
        Insert: {
          address1: string
          address2?: string | null
          city: string
          company?: string | null
          country?: string
          country_code?: string | null
          created_at?: string
          customer_id: string
          first_name?: string | null
          id?: string
          is_default?: boolean | null
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          updated_at?: string
        }
        Update: {
          address1?: string
          address2?: string | null
          city?: string
          company?: string | null
          country?: string
          country_code?: string | null
          created_at?: string
          customer_id?: string
          first_name?: string | null
          id?: string
          is_default?: boolean | null
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
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
          sms_marketing_consent: Json | null
          state: string | null
          tags: string | null
          tax_exempt: boolean | null
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
          sms_marketing_consent?: Json | null
          state?: string | null
          tags?: string | null
          tax_exempt?: boolean | null
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
          sms_marketing_consent?: Json | null
          state?: string | null
          tags?: string | null
          tax_exempt?: boolean | null
          total_spent?: number | null
          updated_at?: string
          verified_email?: boolean | null
        }
        Relationships: []
      }
      delivery_methods: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      finance_assets: {
        Row: {
          asset_type: string
          created_at: string
          current_value: number | null
          depreciation_rate: number | null
          description: string | null
          id: string
          is_active: boolean
          location: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number
          serial_number: string | null
          updated_at: string
        }
        Insert: {
          asset_type?: string
          created_at?: string
          current_value?: number | null
          depreciation_rate?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number
          serial_number?: string | null
          updated_at?: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          current_value?: number | null
          depreciation_rate?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number
          serial_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      finance_cashflow: {
        Row: {
          cash_balance: number | null
          cogs: number | null
          created_at: string
          created_by: string | null
          exp_accounting: number | null
          exp_ads: number | null
          exp_lazada_fee: number | null
          exp_marketing_other: number | null
          exp_other_operating: number | null
          exp_packaging: number | null
          exp_promotion: number | null
          exp_salary: number | null
          exp_shipping: number | null
          exp_shopee_fee: number | null
          exp_tiktok_fee: number | null
          exp_tools: number | null
          exp_website_fee: number | null
          gross_margin_percent: number | null
          gross_profit: number | null
          id: string
          inventory_value: number | null
          investment: number | null
          month: number
          net_income: number | null
          net_profit: number | null
          notes: string | null
          other_income: number | null
          revenue_168: number | null
          revenue_406: number | null
          revenue_412: number | null
          revenue_91b: number | null
          revenue_lazada: number | null
          revenue_other: number | null
          revenue_shopee: number | null
          revenue_tiktok: number | null
          revenue_total: number | null
          revenue_website: number | null
          updated_at: string
          year: number
        }
        Insert: {
          cash_balance?: number | null
          cogs?: number | null
          created_at?: string
          created_by?: string | null
          exp_accounting?: number | null
          exp_ads?: number | null
          exp_lazada_fee?: number | null
          exp_marketing_other?: number | null
          exp_other_operating?: number | null
          exp_packaging?: number | null
          exp_promotion?: number | null
          exp_salary?: number | null
          exp_shipping?: number | null
          exp_shopee_fee?: number | null
          exp_tiktok_fee?: number | null
          exp_tools?: number | null
          exp_website_fee?: number | null
          gross_margin_percent?: number | null
          gross_profit?: number | null
          id?: string
          inventory_value?: number | null
          investment?: number | null
          month: number
          net_income?: number | null
          net_profit?: number | null
          notes?: string | null
          other_income?: number | null
          revenue_168?: number | null
          revenue_406?: number | null
          revenue_412?: number | null
          revenue_91b?: number | null
          revenue_lazada?: number | null
          revenue_other?: number | null
          revenue_shopee?: number | null
          revenue_tiktok?: number | null
          revenue_total?: number | null
          revenue_website?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          cash_balance?: number | null
          cogs?: number | null
          created_at?: string
          created_by?: string | null
          exp_accounting?: number | null
          exp_ads?: number | null
          exp_lazada_fee?: number | null
          exp_marketing_other?: number | null
          exp_other_operating?: number | null
          exp_packaging?: number | null
          exp_promotion?: number | null
          exp_salary?: number | null
          exp_shipping?: number | null
          exp_shopee_fee?: number | null
          exp_tiktok_fee?: number | null
          exp_tools?: number | null
          exp_website_fee?: number | null
          gross_margin_percent?: number | null
          gross_profit?: number | null
          id?: string
          inventory_value?: number | null
          investment?: number | null
          month?: number
          net_income?: number | null
          net_profit?: number | null
          notes?: string | null
          other_income?: number | null
          revenue_168?: number | null
          revenue_406?: number | null
          revenue_412?: number | null
          revenue_91b?: number | null
          revenue_lazada?: number | null
          revenue_other?: number | null
          revenue_shopee?: number | null
          revenue_tiktok?: number | null
          revenue_total?: number | null
          revenue_website?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_cashflow_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_deposits: {
        Row: {
          amount: number
          created_at: string
          deposit_type: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          deposit_type?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          deposit_type?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      homepage_categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_active: boolean
          name: string
          pet_type: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          pet_type: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          pet_type?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_featured_brands: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          position: number
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          position?: number
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "homepage_featured_brands_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_featured_config: {
        Row: {
          collection_id: string | null
          id: string
          is_active: boolean
          product_count: number
          section_title: string
          updated_at: string
        }
        Insert: {
          collection_id?: string | null
          id?: string
          is_active?: boolean
          product_count?: number
          section_title?: string
          updated_at?: string
        }
        Update: {
          collection_id?: string | null
          id?: string
          is_active?: boolean
          product_count?: number
          section_title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homepage_featured_config_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_promos: {
        Row: {
          bg_color: string
          created_at: string
          cta_text: string
          eyebrow: string | null
          id: string
          image_url: string | null
          is_active: boolean
          layout_slot: string
          link_url: string | null
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          bg_color?: string
          created_at?: string
          cta_text?: string
          eyebrow?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          layout_slot: string
          link_url?: string | null
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          created_at?: string
          cta_text?: string
          eyebrow?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          layout_slot?: string
          link_url?: string | null
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hr_attendance_records: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          leave_request_id: string | null
          notes: string | null
          overtime_hours: number | null
          status: string | null
          updated_at: string
          working_hours: number | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          leave_request_id?: string | null
          notes?: string | null
          overtime_hours?: number | null
          status?: string | null
          updated_at?: string
          working_hours?: number | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          leave_request_id?: string | null
          notes?: string | null
          overtime_hours?: number | null
          status?: string | null
          updated_at?: string
          working_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_attendance_records_leave_request_id_fkey"
            columns: ["leave_request_id"]
            isOneToOne: false
            referencedRelation: "hr_leave_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          name_vi: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          name_vi?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          name_vi?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_hr_departments_manager"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employees: {
        Row: {
          address: string | null
          avatar_url: string | null
          bank_account: string | null
          bank_name: string | null
          base_salary: number | null
          created_at: string
          date_of_birth: string | null
          department_id: string | null
          email: string | null
          employee_code: string | null
          employment_type: string | null
          end_date: string | null
          full_name: string
          gender: string | null
          id: string
          manager_id: string | null
          national_id: string | null
          notes: string | null
          phone: string | null
          position_id: string | null
          social_insurance_number: string | null
          start_date: string | null
          status: string
          tax_code: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bank_account?: string | null
          bank_name?: string | null
          base_salary?: number | null
          created_at?: string
          date_of_birth?: string | null
          department_id?: string | null
          email?: string | null
          employee_code?: string | null
          employment_type?: string | null
          end_date?: string | null
          full_name: string
          gender?: string | null
          id?: string
          manager_id?: string | null
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          position_id?: string | null
          social_insurance_number?: string | null
          start_date?: string | null
          status?: string
          tax_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bank_account?: string | null
          bank_name?: string | null
          base_salary?: number | null
          created_at?: string
          date_of_birth?: string | null
          department_id?: string | null
          email?: string | null
          employee_code?: string | null
          employment_type?: string | null
          end_date?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          manager_id?: string | null
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          position_id?: string | null
          social_insurance_number?: string | null
          start_date?: string | null
          status?: string
          tax_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "hr_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_insurance_contributions: {
        Row: {
          bhtn_employee: number
          bhtn_employer: number
          bhxh_employee: number
          bhxh_employer: number
          bhyt_employee: number
          bhyt_employer: number
          created_at: string
          id: string
          insurable_salary: number
          month: number
          notes: string | null
          paid_at: string | null
          profile_id: string
          status: string
          total_employee: number
          total_employer: number
          updated_at: string
          year: number
        }
        Insert: {
          bhtn_employee?: number
          bhtn_employer?: number
          bhxh_employee?: number
          bhxh_employer?: number
          bhyt_employee?: number
          bhyt_employer?: number
          created_at?: string
          id?: string
          insurable_salary?: number
          month: number
          notes?: string | null
          paid_at?: string | null
          profile_id: string
          status?: string
          total_employee?: number
          total_employer?: number
          updated_at?: string
          year: number
        }
        Update: {
          bhtn_employee?: number
          bhtn_employer?: number
          bhxh_employee?: number
          bhxh_employer?: number
          bhyt_employee?: number
          bhyt_employer?: number
          created_at?: string
          id?: string
          insurable_salary?: number
          month?: number
          notes?: string | null
          paid_at?: string | null
          profile_id?: string
          status?: string
          total_employee?: number
          total_employer?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_insurance_contributions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "hr_insurance_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_insurance_profiles: {
        Row: {
          book_number: string | null
          created_at: string
          employee_id: string
          healthcare_facility: string | null
          healthcare_province: string | null
          id: string
          insurable_salary: number
          notes: string | null
          registration_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          book_number?: string | null
          created_at?: string
          employee_id: string
          healthcare_facility?: string | null
          healthcare_province?: string | null
          id?: string
          insurable_salary?: number
          notes?: string | null
          registration_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          book_number?: string | null
          created_at?: string
          employee_id?: string
          healthcare_facility?: string | null
          healthcare_province?: string | null
          id?: string
          insurable_salary?: number
          notes?: string | null
          registration_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_insurance_profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_leave_balances: {
        Row: {
          carried_over: number | null
          created_at: string
          employee_id: string
          entitled_days: number | null
          id: string
          leave_type_id: string
          remaining_days: number | null
          updated_at: string
          used_days: number | null
          year: number
        }
        Insert: {
          carried_over?: number | null
          created_at?: string
          employee_id: string
          entitled_days?: number | null
          id?: string
          leave_type_id: string
          remaining_days?: number | null
          updated_at?: string
          used_days?: number | null
          year: number
        }
        Update: {
          carried_over?: number | null
          created_at?: string
          employee_id?: string
          entitled_days?: number | null
          id?: string
          leave_type_id?: string
          remaining_days?: number | null
          updated_at?: string
          used_days?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "hr_leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          end_date: string
          end_half_day: boolean | null
          id: string
          leave_type_id: string
          reason: string | null
          rejection_reason: string | null
          start_date: string
          start_half_day: boolean | null
          status: string
          total_days: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          end_half_day?: boolean | null
          id?: string
          leave_type_id: string
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          start_half_day?: boolean | null
          status?: string
          total_days: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          end_half_day?: boolean | null
          id?: string
          leave_type_id?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          start_half_day?: boolean | null
          status?: string
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "hr_leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_leave_types: {
        Row: {
          color: string | null
          created_at: string
          days_per_year: number | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_paid: boolean | null
          name: string
          name_vi: string
          requires_approval: boolean | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          days_per_year?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          name: string
          name_vi: string
          requires_approval?: boolean | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          days_per_year?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          name?: string
          name_vi?: string
          requires_approval?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      hr_payroll_entries: {
        Row: {
          actual_days_worked: number | null
          allowance_housing: number | null
          allowance_meal: number | null
          allowance_other: number | null
          allowance_phone: number | null
          allowance_transport: number | null
          base_salary: number
          bhtn_employee: number | null
          bhtn_employer: number | null
          bhxh_employee: number | null
          bhxh_employer: number | null
          bhyt_employee: number | null
          bhyt_employer: number | null
          bonus: number | null
          bonus_description: string | null
          created_at: string
          deduction_description: string | null
          dependent_deduction: number | null
          employee_id: string
          gross_salary: number
          id: string
          leave_days: number | null
          net_salary: number
          notes: string | null
          num_dependents: number | null
          other_deductions: number | null
          overtime_amount: number | null
          overtime_hours: number | null
          paid_at: string | null
          period_id: string
          personal_deduction: number | null
          pit_amount: number | null
          status: string
          taxable_income: number | null
          total_deductions: number | null
          total_insurance_employee: number | null
          total_insurance_employer: number | null
          updated_at: string
          working_days: number | null
        }
        Insert: {
          actual_days_worked?: number | null
          allowance_housing?: number | null
          allowance_meal?: number | null
          allowance_other?: number | null
          allowance_phone?: number | null
          allowance_transport?: number | null
          base_salary?: number
          bhtn_employee?: number | null
          bhtn_employer?: number | null
          bhxh_employee?: number | null
          bhxh_employer?: number | null
          bhyt_employee?: number | null
          bhyt_employer?: number | null
          bonus?: number | null
          bonus_description?: string | null
          created_at?: string
          deduction_description?: string | null
          dependent_deduction?: number | null
          employee_id: string
          gross_salary?: number
          id?: string
          leave_days?: number | null
          net_salary?: number
          notes?: string | null
          num_dependents?: number | null
          other_deductions?: number | null
          overtime_amount?: number | null
          overtime_hours?: number | null
          paid_at?: string | null
          period_id: string
          personal_deduction?: number | null
          pit_amount?: number | null
          status?: string
          taxable_income?: number | null
          total_deductions?: number | null
          total_insurance_employee?: number | null
          total_insurance_employer?: number | null
          updated_at?: string
          working_days?: number | null
        }
        Update: {
          actual_days_worked?: number | null
          allowance_housing?: number | null
          allowance_meal?: number | null
          allowance_other?: number | null
          allowance_phone?: number | null
          allowance_transport?: number | null
          base_salary?: number
          bhtn_employee?: number | null
          bhtn_employer?: number | null
          bhxh_employee?: number | null
          bhxh_employer?: number | null
          bhyt_employee?: number | null
          bhyt_employer?: number | null
          bonus?: number | null
          bonus_description?: string | null
          created_at?: string
          deduction_description?: string | null
          dependent_deduction?: number | null
          employee_id?: string
          gross_salary?: number
          id?: string
          leave_days?: number | null
          net_salary?: number
          notes?: string | null
          num_dependents?: number | null
          other_deductions?: number | null
          overtime_amount?: number | null
          overtime_hours?: number | null
          paid_at?: string | null
          period_id?: string
          personal_deduction?: number | null
          pit_amount?: number | null
          status?: string
          taxable_income?: number | null
          total_deductions?: number | null
          total_insurance_employee?: number | null
          total_insurance_employer?: number | null
          updated_at?: string
          working_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_payroll_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_payroll_entries_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "hr_payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_payroll_periods: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          employee_count: number | null
          end_date: string
          id: string
          month: number
          notes: string | null
          period_name: string
          start_date: string
          status: string
          total_deductions: number | null
          total_gross: number | null
          total_net: number | null
          updated_at: string
          year: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          employee_count?: number | null
          end_date: string
          id?: string
          month: number
          notes?: string | null
          period_name: string
          start_date: string
          status?: string
          total_deductions?: number | null
          total_gross?: number | null
          total_net?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          employee_count?: number | null
          end_date?: string
          id?: string
          month?: number
          notes?: string | null
          period_name?: string
          start_date?: string
          status?: string
          total_deductions?: number | null
          total_gross?: number | null
          total_net?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      hr_positions: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          is_active: boolean
          level: number
          name: string
          name_vi: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          is_active?: boolean
          level?: number
          name: string
          name_vi?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          is_active?: boolean
          level?: number
          name?: string
          name_vi?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_salary_configs: {
        Row: {
          allowance_housing: number | null
          allowance_meal: number | null
          allowance_other: number | null
          allowance_phone: number | null
          allowance_transport: number | null
          bank_account: string | null
          bank_branch: string | null
          bank_name: string | null
          created_at: string
          employee_id: string
          id: string
          insurable_salary: number | null
          is_insurance_exempt: boolean | null
          is_tax_exempt: boolean | null
          notes: string | null
          num_dependents: number | null
          overtime_rate: number | null
          updated_at: string
        }
        Insert: {
          allowance_housing?: number | null
          allowance_meal?: number | null
          allowance_other?: number | null
          allowance_phone?: number | null
          allowance_transport?: number | null
          bank_account?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          created_at?: string
          employee_id: string
          id?: string
          insurable_salary?: number | null
          is_insurance_exempt?: boolean | null
          is_tax_exempt?: boolean | null
          notes?: string | null
          num_dependents?: number | null
          overtime_rate?: number | null
          updated_at?: string
        }
        Update: {
          allowance_housing?: number | null
          allowance_meal?: number | null
          allowance_other?: number | null
          allowance_phone?: number | null
          allowance_transport?: number | null
          bank_account?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          insurable_salary?: number | null
          is_insurance_exempt?: boolean | null
          is_tax_exempt?: boolean | null
          notes?: string | null
          num_dependents?: number | null
          overtime_rate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_salary_configs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_tax_calculations: {
        Row: {
          created_at: string
          dependent_deduction: number
          gross_income: number
          id: string
          insurance_deduction: number
          month: number
          notes: string | null
          paid_at: string | null
          personal_deduction: number
          profile_id: string
          status: string
          tax_amount: number
          tax_rate_applied: string | null
          taxable_income: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          dependent_deduction?: number
          gross_income?: number
          id?: string
          insurance_deduction?: number
          month: number
          notes?: string | null
          paid_at?: string | null
          personal_deduction?: number
          profile_id: string
          status?: string
          tax_amount?: number
          tax_rate_applied?: string | null
          taxable_income?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          dependent_deduction?: number
          gross_income?: number
          id?: string
          insurance_deduction?: number
          month?: number
          notes?: string | null
          paid_at?: string | null
          personal_deduction?: number
          profile_id?: string
          status?: string
          tax_amount?: number
          tax_rate_applied?: string | null
          taxable_income?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_tax_calculations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "hr_tax_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_tax_profiles: {
        Row: {
          created_at: string
          dependent_count: number
          dependent_deduction: number
          employee_id: string
          exemption_reason: string | null
          id: string
          notes: string | null
          personal_deduction: number
          status: string
          tax_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dependent_count?: number
          dependent_deduction?: number
          employee_id: string
          exemption_reason?: string | null
          id?: string
          notes?: string | null
          personal_deduction?: number
          status?: string
          tax_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dependent_count?: number
          dependent_deduction?: number
          employee_id?: string
          exemption_reason?: string | null
          id?: string
          notes?: string | null
          personal_deduction?: number
          status?: string
          tax_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_tax_profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          created_at: string
          external_url: string
          handle: string
          id: string
          is_active: boolean
          meta_description: string | null
          meta_title: string | null
          og_image_url: string | null
          show_footer: boolean
          show_header: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_url: string
          handle: string
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          show_footer?: boolean
          show_header?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_url?: string
          handle?: string
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          show_footer?: boolean
          show_header?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      legal_conversation_documents: {
        Row: {
          conversation_id: string
          created_at: string
          document_id: string
          id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          document_id: string
          id?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          document_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_conversation_documents_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "legal_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_conversation_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          extracted_text: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          extracted_text?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      legal_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "legal_conversations"
            referencedColumns: ["id"]
          },
        ]
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
          issued_quantity: number | null
          issued_value: number | null
          main_unit: string | null
          name: string
          opening_quantity: number | null
          opening_value: number | null
          product_group: string | null
          product_nature: string | null
          received_quantity: number | null
          received_value: number | null
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
          unit_2: string | null
          unit_3: string | null
          unit_4: string | null
          unit_5: string | null
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
          issued_quantity?: number | null
          issued_value?: number | null
          main_unit?: string | null
          name: string
          opening_quantity?: number | null
          opening_value?: number | null
          product_group?: string | null
          product_nature?: string | null
          received_quantity?: number | null
          received_value?: number | null
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
          unit_2?: string | null
          unit_3?: string | null
          unit_4?: string | null
          unit_5?: string | null
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
          issued_quantity?: number | null
          issued_value?: number | null
          main_unit?: string | null
          name?: string
          opening_quantity?: number | null
          opening_value?: number | null
          product_group?: string | null
          product_nature?: string | null
          received_quantity?: number | null
          received_value?: number | null
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
          unit_2?: string | null
          unit_3?: string | null
          unit_4?: string | null
          unit_5?: string | null
          updated_at?: string
          vat?: string | null
        }
        Relationships: []
      }
      navigation_columns: {
        Row: {
          background_color: string | null
          created_at: string | null
          display_order: number | null
          group_type: string | null
          icon_type: string | null
          id: string
          menu_id: string
          shop_all_link: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          created_at?: string | null
          display_order?: number | null
          group_type?: string | null
          icon_type?: string | null
          id?: string
          menu_id: string
          shop_all_link?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          created_at?: string | null
          display_order?: number | null
          group_type?: string | null
          icon_type?: string | null
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
      order_events: {
        Row: {
          author: string | null
          created_at: string
          event_type: string
          id: string
          message: string
          order_id: string
          shopify_event_id: string | null
        }
        Insert: {
          author?: string | null
          created_at?: string
          event_type: string
          id?: string
          message: string
          order_id: string
          shopify_event_id?: string | null
        }
        Update: {
          author?: string | null
          created_at?: string
          event_type?: string
          id?: string
          message?: string
          order_id?: string
          shopify_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_fulfillments: {
        Row: {
          created_at: string
          id: string
          location_name: string | null
          order_id: string
          shipment_status: string | null
          shopify_fulfillment_id: string | null
          status: string | null
          tracking_company: string | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_name?: string | null
          order_id: string
          shipment_status?: string | null
          shopify_fulfillment_id?: string | null
          status?: string | null
          tracking_company?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location_name?: string | null
          order_id?: string
          shipment_status?: string | null
          shopify_fulfillment_id?: string | null
          status?: string | null
          tracking_company?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_fulfillments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
          cancelled_at: string | null
          closed_at: string | null
          coupon_code: string | null
          created_at: string
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_method: string | null
          discount: number | null
          financial_status: string | null
          fulfillment_status: string | null
          id: string
          notes: string | null
          order_number: string
          payment_gateway: string | null
          processed_at: string | null
          promotion_id: string | null
          shipping_address: Json
          shipping_fee: number | null
          shopify_order_id: string | null
          source_name: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tags: string | null
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          closed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_method?: string | null
          discount?: number | null
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_gateway?: string | null
          processed_at?: string | null
          promotion_id?: string | null
          shipping_address: Json
          shipping_fee?: number | null
          shopify_order_id?: string | null
          source_name?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tags?: string | null
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          closed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_method?: string | null
          discount?: number | null
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_gateway?: string | null
          processed_at?: string | null
          promotion_id?: string | null
          shipping_address?: Json
          shipping_fee?: number | null
          shopify_order_id?: string | null
          source_name?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          tags?: string | null
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          address: string | null
          company_name: string
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          tax_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_name?: string
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          tax_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_name?: string
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          tax_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      paddy_customers_monthly_counts_cache: {
        Row: {
          count: number
          month: string
          updated_at: string
        }
        Insert: {
          count?: number
          month: string
          updated_at?: string
        }
        Update: {
          count?: number
          month?: string
          updated_at?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          author: string | null
          body_html: string | null
          created_at: string
          handle: string
          id: string
          meta_description: string | null
          meta_title: string | null
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
          meta_description?: string | null
          meta_title?: string | null
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
          meta_description?: string | null
          meta_title?: string | null
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
      pos_order_items: {
        Row: {
          created_at: string
          discount_amount: number
          id: string
          line_total: number
          order_id: string
          product_name: string
          quantity: number
          sku: string | null
          unit_price: number
          variant_id: number
          variant_name: string | null
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          id?: string
          line_total: number
          order_id: string
          product_name: string
          quantity?: number
          sku?: string | null
          unit_price: number
          variant_id: number
          variant_name?: string | null
        }
        Update: {
          created_at?: string
          discount_amount?: number
          id?: string
          line_total?: number
          order_id?: string
          product_name?: string
          quantity?: number
          sku?: string | null
          unit_price?: number
          variant_id?: number
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pos_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_orders: {
        Row: {
          amount_paid: number
          change_amount: number
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number
          discount_reason: string | null
          id: string
          location_id: number
          notes: string | null
          order_number: string
          payment_method: string
          payment_status: string
          sapo_customer_id: number | null
          session_id: string | null
          staff_id: string
          status: string
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          change_amount?: number
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          discount_reason?: string | null
          id?: string
          location_id: number
          notes?: string | null
          order_number: string
          payment_method?: string
          payment_status?: string
          sapo_customer_id?: number | null
          session_id?: string | null
          staff_id: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          change_amount?: number
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          discount_reason?: string | null
          id?: string
          location_id?: number
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_status?: string
          sapo_customer_id?: number | null
          session_id?: string | null
          staff_id?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pos_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sessions: {
        Row: {
          closed_at: string | null
          closing_cash: number | null
          created_at: string
          id: string
          location_id: number
          notes: string | null
          opened_at: string
          opening_cash: number | null
          staff_id: string
          status: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          closing_cash?: number | null
          created_at?: string
          id?: string
          location_id: number
          notes?: string | null
          opened_at?: string
          opening_cash?: number | null
          staff_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          closing_cash?: number | null
          created_at?: string
          id?: string
          location_id?: number
          notes?: string | null
          opened_at?: string
          opening_cash?: number | null
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      product_badge_links: {
        Row: {
          badge_id: string
          created_at: string | null
          id: string
          product_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string | null
          id?: string
          product_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_badge_links_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "product_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_badge_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_badges: {
        Row: {
          bg_color: string
          created_at: string | null
          display_order: number | null
          icon: string
          icon_color: string
          id: string
          is_active: boolean | null
          name: string
          name_vi: string | null
          updated_at: string | null
        }
        Insert: {
          bg_color?: string
          created_at?: string | null
          display_order?: number | null
          icon: string
          icon_color?: string
          id?: string
          is_active?: boolean | null
          name: string
          name_vi?: string | null
          updated_at?: string | null
        }
        Update: {
          bg_color?: string
          created_at?: string | null
          display_order?: number | null
          icon?: string
          icon_color?: string
          id?: string
          is_active?: boolean | null
          name?: string
          name_vi?: string | null
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
          value_vi: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          template_id: string
          value: string
          value_vi?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          template_id?: string
          value?: string
          value_vi?: string | null
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
          name_vi: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          name_vi?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_vi?: string | null
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
          brand_id: string | null
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          feeding_guidelines: string | null
          id: string
          ingredients: string | null
          is_active: boolean | null
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          nutrition_facts: Json | null
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
          show_description: boolean | null
          show_feeding_guidelines: boolean | null
          show_ingredients: boolean | null
          show_nutrition_facts: boolean | null
          slug: string
          sold_count: number | null
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
          brand_id?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          feeding_guidelines?: string | null
          id?: string
          ingredients?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          nutrition_facts?: Json | null
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
          show_description?: boolean | null
          show_feeding_guidelines?: boolean | null
          show_ingredients?: boolean | null
          show_nutrition_facts?: boolean | null
          slug: string
          sold_count?: number | null
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
          brand_id?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          feeding_guidelines?: string | null
          id?: string
          ingredients?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          nutrition_facts?: Json | null
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
          show_description?: boolean | null
          show_feeding_guidelines?: boolean | null
          show_ingredients?: boolean | null
          show_nutrition_facts?: boolean | null
          slug?: string
          sold_count?: number | null
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
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
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
      promotion_collections: {
        Row: {
          collection_id: string
          created_at: string | null
          id: string
          promotion_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          id?: string
          promotion_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          id?: string
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_collections_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_products: {
        Row: {
          created_at: string | null
          discount_type: string | null
          discount_value: number | null
          id: string
          is_enabled: boolean | null
          product_id: string
          promotion_id: string
          purchase_limit: number | null
          stock_limit: number | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_enabled?: boolean | null
          product_id: string
          promotion_id: string
          purchase_limit?: number | null
          stock_limit?: number | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_enabled?: boolean | null
          product_id?: string
          promotion_id?: string
          purchase_limit?: number | null
          stock_limit?: number | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_products_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_products_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          bg_color: string | null
          bottom_icon_url: string | null
          created_at: string
          cta_text: string | null
          custom_icons: Json | null
          discount_type: string | null
          discount_value: number | null
          display_order: number | null
          display_visibility: string | null
          end_date: string | null
          eyebrow: string | null
          gradient_from: string | null
          gradient_to: string | null
          icon_type: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          layout_slot: string | null
          link_destination: string
          link_type: string
          max_discount: number | null
          min_order_value: number | null
          program_kind: string | null
          promo_type: string | null
          rules: Json | null
          start_date: string | null
          subtitle: string | null
          title: string
          top_icon_url: string | null
          updated_at: string
          usage_limit: number | null
          usage_limit_per_customer: number | null
          used_count: number | null
          voucher_code: string | null
          voucher_type: string | null
        }
        Insert: {
          bg_color?: string | null
          bottom_icon_url?: string | null
          created_at?: string
          cta_text?: string | null
          custom_icons?: Json | null
          discount_type?: string | null
          discount_value?: number | null
          display_order?: number | null
          display_visibility?: string | null
          end_date?: string | null
          eyebrow?: string | null
          gradient_from?: string | null
          gradient_to?: string | null
          icon_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          layout_slot?: string | null
          link_destination: string
          link_type?: string
          max_discount?: number | null
          min_order_value?: number | null
          program_kind?: string | null
          promo_type?: string | null
          rules?: Json | null
          start_date?: string | null
          subtitle?: string | null
          title: string
          top_icon_url?: string | null
          updated_at?: string
          usage_limit?: number | null
          usage_limit_per_customer?: number | null
          used_count?: number | null
          voucher_code?: string | null
          voucher_type?: string | null
        }
        Update: {
          bg_color?: string | null
          bottom_icon_url?: string | null
          created_at?: string
          cta_text?: string | null
          custom_icons?: Json | null
          discount_type?: string | null
          discount_value?: number | null
          display_order?: number | null
          display_visibility?: string | null
          end_date?: string | null
          eyebrow?: string | null
          gradient_from?: string | null
          gradient_to?: string | null
          icon_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          layout_slot?: string | null
          link_destination?: string
          link_type?: string
          max_discount?: number | null
          min_order_value?: number | null
          program_kind?: string | null
          promo_type?: string | null
          rules?: Json | null
          start_date?: string | null
          subtitle?: string | null
          title?: string
          top_icon_url?: string | null
          updated_at?: string
          usage_limit?: number | null
          usage_limit_per_customer?: number | null
          used_count?: number | null
          voucher_code?: string | null
          voucher_type?: string | null
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
      sapo_branch_monthly_report: {
        Row: {
          branch: string
          created_at: string
          customer_count: number
          gross_profit: number
          id: string
          month: number
          notes: string | null
          order_count: number
          revenue: number
          updated_at: string
          year: number
        }
        Insert: {
          branch: string
          created_at?: string
          customer_count?: number
          gross_profit?: number
          id?: string
          month: number
          notes?: string | null
          order_count?: number
          revenue?: number
          updated_at?: string
          year: number
        }
        Update: {
          branch?: string
          created_at?: string
          customer_count?: number
          gross_profit?: number
          id?: string
          month?: number
          notes?: string | null
          order_count?: number
          revenue?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      sapo_categories: {
        Row: {
          code: string | null
          created_at: string | null
          created_on: string | null
          description: string | null
          id: string
          is_active: boolean | null
          modified_on: string | null
          name: string
          parent_id: number | null
          position: number | null
          sapo_category_id: number
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          created_on?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          modified_on?: string | null
          name: string
          parent_id?: number | null
          position?: number | null
          sapo_category_id: number
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          created_on?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          modified_on?: string | null
          name?: string
          parent_id?: number | null
          position?: number | null
          sapo_category_id?: number
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sapo_customers: {
        Row: {
          addresses: Json | null
          birthday: string | null
          city: string | null
          code: string | null
          country: string | null
          created_on: string | null
          customer_group_id: number | null
          debt: number | null
          district: string | null
          email: string | null
          gender: string | null
          group_name: string | null
          id: string
          last_order_on: string | null
          modified_on: string | null
          name: string | null
          note: string | null
          phone: string | null
          sapo_customer_id: number
          status: string | null
          synced_at: string | null
          tags: string | null
          tax_code: string | null
          total_orders: number | null
          total_spent: number | null
          ward: string | null
        }
        Insert: {
          addresses?: Json | null
          birthday?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_on?: string | null
          customer_group_id?: number | null
          debt?: number | null
          district?: string | null
          email?: string | null
          gender?: string | null
          group_name?: string | null
          id?: string
          last_order_on?: string | null
          modified_on?: string | null
          name?: string | null
          note?: string | null
          phone?: string | null
          sapo_customer_id: number
          status?: string | null
          synced_at?: string | null
          tags?: string | null
          tax_code?: string | null
          total_orders?: number | null
          total_spent?: number | null
          ward?: string | null
        }
        Update: {
          addresses?: Json | null
          birthday?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_on?: string | null
          customer_group_id?: number | null
          debt?: number | null
          district?: string | null
          email?: string | null
          gender?: string | null
          group_name?: string | null
          id?: string
          last_order_on?: string | null
          modified_on?: string | null
          name?: string | null
          note?: string | null
          phone?: string | null
          sapo_customer_id?: number
          status?: string | null
          synced_at?: string | null
          tags?: string | null
          tax_code?: string | null
          total_orders?: number | null
          total_spent?: number | null
          ward?: string | null
        }
        Relationships: []
      }
      sapo_inventory: {
        Row: {
          available: number | null
          barcode: string | null
          committed: number | null
          id: string
          incoming: number | null
          location_id: number
          mac: number | null
          max_value: number | null
          min_value: number | null
          on_hand: number | null
          product_id: number | null
          product_name: string | null
          sku: string | null
          synced_at: string | null
          variant_id: number
          variant_name: string | null
        }
        Insert: {
          available?: number | null
          barcode?: string | null
          committed?: number | null
          id?: string
          incoming?: number | null
          location_id: number
          mac?: number | null
          max_value?: number | null
          min_value?: number | null
          on_hand?: number | null
          product_id?: number | null
          product_name?: string | null
          sku?: string | null
          synced_at?: string | null
          variant_id: number
          variant_name?: string | null
        }
        Update: {
          available?: number | null
          barcode?: string | null
          committed?: number | null
          id?: string
          incoming?: number | null
          location_id?: number
          mac?: number | null
          max_value?: number | null
          min_value?: number | null
          on_hand?: number | null
          product_id?: number | null
          product_name?: string | null
          sku?: string | null
          synced_at?: string | null
          variant_id?: number
          variant_name?: string | null
        }
        Relationships: []
      }
      sapo_inventory_transactions: {
        Row: {
          created_at: string
          id: string
          location_id: number | null
          product_id: number | null
          product_name: string | null
          quantity_in: number | null
          quantity_out: number | null
          reference_code: string | null
          reference_id: number | null
          reference_type: string | null
          sapo_id: number | null
          sku: string | null
          transaction_date: string | null
          unit_cost: number | null
          updated_at: string
          value_in: number | null
          value_out: number | null
          variant_id: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          location_id?: number | null
          product_id?: number | null
          product_name?: string | null
          quantity_in?: number | null
          quantity_out?: number | null
          reference_code?: string | null
          reference_id?: number | null
          reference_type?: string | null
          sapo_id?: number | null
          sku?: string | null
          transaction_date?: string | null
          unit_cost?: number | null
          updated_at?: string
          value_in?: number | null
          value_out?: number | null
          variant_id?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: number | null
          product_id?: number | null
          product_name?: string | null
          quantity_in?: number | null
          quantity_out?: number | null
          reference_code?: string | null
          reference_id?: number | null
          reference_type?: string | null
          sapo_id?: number | null
          sku?: string | null
          transaction_date?: string | null
          unit_cost?: number | null
          updated_at?: string
          value_in?: number | null
          value_out?: number | null
          variant_id?: number | null
        }
        Relationships: []
      }
      sapo_locations: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          country: string | null
          country_code: string | null
          created_on: string | null
          district: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          label: string | null
          modified_on: string | null
          name: string
          phone: string | null
          sapo_location_id: number
          synced_at: string | null
          ward: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          country_code?: string | null
          created_on?: string | null
          district?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          label?: string | null
          modified_on?: string | null
          name: string
          phone?: string | null
          sapo_location_id: number
          synced_at?: string | null
          ward?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          country_code?: string | null
          created_on?: string | null
          district?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          label?: string | null
          modified_on?: string | null
          name?: string
          phone?: string | null
          sapo_location_id?: number
          synced_at?: string | null
          ward?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      sapo_order_items: {
        Row: {
          barcode: string | null
          composite_item_domains: Json | null
          discount_amount: number | null
          discount_rate: number | null
          distributed_discount_amount: number | null
          id: string
          line_amount: number | null
          name: string | null
          note: string | null
          order_id: string
          price: number
          product_id: number | null
          product_name: string | null
          product_type: string | null
          quantity: number
          requires_shipping: boolean | null
          sapo_item_id: number | null
          sku: string | null
          tax_amount: number | null
          tax_rate: number | null
          unit: string | null
          variant_id: number | null
          variant_name: string | null
          weight: number | null
        }
        Insert: {
          barcode?: string | null
          composite_item_domains?: Json | null
          discount_amount?: number | null
          discount_rate?: number | null
          distributed_discount_amount?: number | null
          id?: string
          line_amount?: number | null
          name?: string | null
          note?: string | null
          order_id: string
          price?: number
          product_id?: number | null
          product_name?: string | null
          product_type?: string | null
          quantity?: number
          requires_shipping?: boolean | null
          sapo_item_id?: number | null
          sku?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          unit?: string | null
          variant_id?: number | null
          variant_name?: string | null
          weight?: number | null
        }
        Update: {
          barcode?: string | null
          composite_item_domains?: Json | null
          discount_amount?: number | null
          discount_rate?: number | null
          distributed_discount_amount?: number | null
          id?: string
          line_amount?: number | null
          name?: string | null
          note?: string | null
          order_id?: string
          price?: number
          product_id?: number | null
          product_name?: string | null
          product_type?: string | null
          quantity?: number
          requires_shipping?: boolean | null
          sapo_item_id?: number | null
          sku?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          unit?: string | null
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
          cod_amount: number | null
          code: string
          completed_on: string | null
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
          delivery_fee: number | null
          discount_codes: Json | null
          email: string | null
          expected_delivery_on: string | null
          exported_on: string | null
          financial_status: string | null
          fulfillment_status: string | null
          fulfillments: Json | null
          gateway: string | null
          id: string
          invoiced_at: string | null
          issued_on: string | null
          landing_site: string | null
          location_id: number | null
          modified_on: string | null
          note: string | null
          order_discount_rate: number | null
          order_discount_value: number | null
          packed_status: string | null
          payment_status: string | null
          phone_number: string | null
          price_list_id: number | null
          print_status: string | null
          process_status_id: number | null
          received_on: string | null
          reference_number: string | null
          reference_url: string | null
          referring_site: string | null
          return_status: string | null
          sapo_order_id: number
          ship_on_max: string | null
          ship_on_min: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          source_id: number | null
          source_name: string | null
          status: string | null
          stock_location_id: number | null
          sub_total: number | null
          synced_at: string
          tags: string | null
          tax_treatment: string | null
          total: number | null
          total_discount: number | null
          total_tax: number | null
          total_weight: number | null
          transactions: Json | null
        }
        Insert: {
          account_id?: number | null
          assignee_id?: number | null
          billing_address?: Json | null
          browser_ip?: string | null
          cancelled_on?: string | null
          channel?: string | null
          closed_on?: string | null
          cod_amount?: number | null
          code: string
          completed_on?: string | null
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
          delivery_fee?: number | null
          discount_codes?: Json | null
          email?: string | null
          expected_delivery_on?: string | null
          exported_on?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          fulfillments?: Json | null
          gateway?: string | null
          id?: string
          invoiced_at?: string | null
          issued_on?: string | null
          landing_site?: string | null
          location_id?: number | null
          modified_on?: string | null
          note?: string | null
          order_discount_rate?: number | null
          order_discount_value?: number | null
          packed_status?: string | null
          payment_status?: string | null
          phone_number?: string | null
          price_list_id?: number | null
          print_status?: string | null
          process_status_id?: number | null
          received_on?: string | null
          reference_number?: string | null
          reference_url?: string | null
          referring_site?: string | null
          return_status?: string | null
          sapo_order_id: number
          ship_on_max?: string | null
          ship_on_min?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          source_id?: number | null
          source_name?: string | null
          status?: string | null
          stock_location_id?: number | null
          sub_total?: number | null
          synced_at?: string
          tags?: string | null
          tax_treatment?: string | null
          total?: number | null
          total_discount?: number | null
          total_tax?: number | null
          total_weight?: number | null
          transactions?: Json | null
        }
        Update: {
          account_id?: number | null
          assignee_id?: number | null
          billing_address?: Json | null
          browser_ip?: string | null
          cancelled_on?: string | null
          channel?: string | null
          closed_on?: string | null
          cod_amount?: number | null
          code?: string
          completed_on?: string | null
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
          delivery_fee?: number | null
          discount_codes?: Json | null
          email?: string | null
          expected_delivery_on?: string | null
          exported_on?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          fulfillments?: Json | null
          gateway?: string | null
          id?: string
          invoiced_at?: string | null
          issued_on?: string | null
          landing_site?: string | null
          location_id?: number | null
          modified_on?: string | null
          note?: string | null
          order_discount_rate?: number | null
          order_discount_value?: number | null
          packed_status?: string | null
          payment_status?: string | null
          phone_number?: string | null
          price_list_id?: number | null
          print_status?: string | null
          process_status_id?: number | null
          received_on?: string | null
          reference_number?: string | null
          reference_url?: string | null
          referring_site?: string | null
          return_status?: string | null
          sapo_order_id?: number
          ship_on_max?: string | null
          ship_on_min?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          source_id?: number | null
          source_name?: string | null
          status?: string | null
          stock_location_id?: number | null
          sub_total?: number | null
          synced_at?: string
          tags?: string | null
          tax_treatment?: string | null
          total?: number | null
          total_discount?: number | null
          total_tax?: number | null
          total_weight?: number | null
          transactions?: Json | null
        }
        Relationships: []
      }
      sapo_orders_branch_monthly_cache: {
        Row: {
          branch_name: string
          location_id: number | null
          month: string
          order_count: number
          total_revenue: number
          updated_at: string
        }
        Insert: {
          branch_name: string
          location_id?: number | null
          month: string
          order_count?: number
          total_revenue?: number
          updated_at?: string
        }
        Update: {
          branch_name?: string
          location_id?: number | null
          month?: string
          order_count?: number
          total_revenue?: number
          updated_at?: string
        }
        Relationships: []
      }
      sapo_orders_channel_monthly_cache: {
        Row: {
          channel_name: string
          month: string
          order_count: number
          total_revenue: number
          updated_at: string
        }
        Insert: {
          channel_name: string
          month: string
          order_count?: number
          total_revenue?: number
          updated_at?: string
        }
        Update: {
          channel_name?: string
          month?: string
          order_count?: number
          total_revenue?: number
          updated_at?: string
        }
        Relationships: []
      }
      sapo_orders_monthly_counts_cache: {
        Row: {
          count: number
          month: string
          updated_at: string
        }
        Insert: {
          count?: number
          month: string
          updated_at?: string
        }
        Update: {
          count?: number
          month?: string
          updated_at?: string
        }
        Relationships: []
      }
      sapo_price_adjustment_items: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          new_cost: number | null
          old_cost: number | null
          price_adjustment_id: string | null
          product_id: number | null
          product_name: string | null
          quantity: number | null
          sapo_adjustment_id: number
          sapo_item_id: number | null
          sku: string | null
          variant_id: number | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          new_cost?: number | null
          old_cost?: number | null
          price_adjustment_id?: string | null
          product_id?: number | null
          product_name?: string | null
          quantity?: number | null
          sapo_adjustment_id: number
          sapo_item_id?: number | null
          sku?: string | null
          variant_id?: number | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          new_cost?: number | null
          old_cost?: number | null
          price_adjustment_id?: string | null
          product_id?: number | null
          product_name?: string | null
          quantity?: number | null
          sapo_adjustment_id?: number
          sapo_item_id?: number | null
          sku?: string | null
          variant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sapo_price_adjustment_items_price_adjustment_id_fkey"
            columns: ["price_adjustment_id"]
            isOneToOne: false
            referencedRelation: "sapo_price_adjustments"
            referencedColumns: ["id"]
          },
        ]
      }
      sapo_price_adjustments: {
        Row: {
          adjusted_on: string | null
          code: string | null
          created_at: string
          created_on: string | null
          id: string
          location_id: number | null
          location_name: string | null
          modified_on: string | null
          note: string | null
          sapo_adjustment_id: number
          status: string | null
          synced_at: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          adjusted_on?: string | null
          code?: string | null
          created_at?: string
          created_on?: string | null
          id?: string
          location_id?: number | null
          location_name?: string | null
          modified_on?: string | null
          note?: string | null
          sapo_adjustment_id: number
          status?: string | null
          synced_at?: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          adjusted_on?: string | null
          code?: string | null
          created_at?: string
          created_on?: string | null
          id?: string
          location_id?: number | null
          location_name?: string | null
          modified_on?: string | null
          note?: string | null
          sapo_adjustment_id?: number
          status?: string | null
          synced_at?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      sapo_price_rules: {
        Row: {
          applies_to: string | null
          code: string | null
          created_at: string | null
          created_on: string | null
          customer_selection: string | null
          description: string | null
          ends_on: string | null
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_order_value: number | null
          modified_on: string | null
          name: string | null
          sapo_rule_id: number
          starts_on: string | null
          synced_at: string | null
          type: string | null
          updated_at: string | null
          usage_limit: number | null
          used_count: number | null
          value: number | null
          value_type: string | null
        }
        Insert: {
          applies_to?: string | null
          code?: string | null
          created_at?: string | null
          created_on?: string | null
          customer_selection?: string | null
          description?: string | null
          ends_on?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_value?: number | null
          modified_on?: string | null
          name?: string | null
          sapo_rule_id: number
          starts_on?: string | null
          synced_at?: string | null
          type?: string | null
          updated_at?: string | null
          usage_limit?: number | null
          used_count?: number | null
          value?: number | null
          value_type?: string | null
        }
        Update: {
          applies_to?: string | null
          code?: string | null
          created_at?: string | null
          created_on?: string | null
          customer_selection?: string | null
          description?: string | null
          ends_on?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_value?: number | null
          modified_on?: string | null
          name?: string | null
          sapo_rule_id?: number
          starts_on?: string | null
          synced_at?: string | null
          type?: string | null
          updated_at?: string | null
          usage_limit?: number | null
          used_count?: number | null
          value?: number | null
          value_type?: string | null
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
      sapo_product_sales_monthly_cache: {
        Row: {
          brand: string | null
          cogs: number | null
          discount_amount: number | null
          discounted_quantity: number | null
          gross_profit: number | null
          id: string
          month: string
          order_count: number | null
          product_name: string | null
          product_type: string | null
          quantity_sold: number | null
          revenue: number | null
          sku: string
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          cogs?: number | null
          discount_amount?: number | null
          discounted_quantity?: number | null
          gross_profit?: number | null
          id?: string
          month: string
          order_count?: number | null
          product_name?: string | null
          product_type?: string | null
          quantity_sold?: number | null
          revenue?: number | null
          sku: string
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          cogs?: number | null
          discount_amount?: number | null
          discounted_quantity?: number | null
          gross_profit?: number | null
          id?: string
          month?: string
          order_count?: number | null
          product_name?: string | null
          product_type?: string | null
          quantity_sold?: number | null
          revenue?: number | null
          sku?: string
          updated_at?: string | null
        }
        Relationships: []
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
      sapo_purchase_order_items: {
        Row: {
          created_at: string | null
          discount_value: number | null
          id: string
          line_amount: number | null
          price: number | null
          product_id: number | null
          product_name: string | null
          purchase_order_id: string | null
          quantity: number | null
          received_quantity: number | null
          sapo_item_id: number | null
          sapo_po_id: number | null
          sku: string | null
          tax: number | null
          variant_id: number | null
        }
        Insert: {
          created_at?: string | null
          discount_value?: number | null
          id?: string
          line_amount?: number | null
          price?: number | null
          product_id?: number | null
          product_name?: string | null
          purchase_order_id?: string | null
          quantity?: number | null
          received_quantity?: number | null
          sapo_item_id?: number | null
          sapo_po_id?: number | null
          sku?: string | null
          tax?: number | null
          variant_id?: number | null
        }
        Update: {
          created_at?: string | null
          discount_value?: number | null
          id?: string
          line_amount?: number | null
          price?: number | null
          product_id?: number | null
          product_name?: string | null
          purchase_order_id?: string | null
          quantity?: number | null
          received_quantity?: number | null
          sapo_item_id?: number | null
          sapo_po_id?: number | null
          sku?: string | null
          tax?: number | null
          variant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sapo_purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "sapo_purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sapo_purchase_orders: {
        Row: {
          backfill_synced_at: string | null
          cancelled_on: string | null
          code: string | null
          completed_on: string | null
          created_at: string | null
          created_on: string | null
          discount_value: number | null
          expected_on: string | null
          id: string
          input_status: string | null
          location_id: number | null
          modified_on: string | null
          note: string | null
          payment_status: string | null
          sapo_po_id: number
          status: string | null
          supplier_id: number | null
          synced_at: string | null
          tags: string | null
          total: number | null
          total_tax: number | null
          updated_at: string | null
        }
        Insert: {
          backfill_synced_at?: string | null
          cancelled_on?: string | null
          code?: string | null
          completed_on?: string | null
          created_at?: string | null
          created_on?: string | null
          discount_value?: number | null
          expected_on?: string | null
          id?: string
          input_status?: string | null
          location_id?: number | null
          modified_on?: string | null
          note?: string | null
          payment_status?: string | null
          sapo_po_id: number
          status?: string | null
          supplier_id?: number | null
          synced_at?: string | null
          tags?: string | null
          total?: number | null
          total_tax?: number | null
          updated_at?: string | null
        }
        Update: {
          backfill_synced_at?: string | null
          cancelled_on?: string | null
          code?: string | null
          completed_on?: string | null
          created_at?: string | null
          created_on?: string | null
          discount_value?: number | null
          expected_on?: string | null
          id?: string
          input_status?: string | null
          location_id?: number | null
          modified_on?: string | null
          note?: string | null
          payment_status?: string | null
          sapo_po_id?: number
          status?: string | null
          supplier_id?: number | null
          synced_at?: string | null
          tags?: string | null
          total?: number | null
          total_tax?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sapo_return_items: {
        Row: {
          created_at: string | null
          discount: number | null
          id: string
          line_amount: number | null
          price: number | null
          product_id: number | null
          product_name: string | null
          quantity: number | null
          return_id: string | null
          sapo_item_id: number | null
          sapo_return_id: number | null
          sku: string | null
          variant_id: number | null
        }
        Insert: {
          created_at?: string | null
          discount?: number | null
          id?: string
          line_amount?: number | null
          price?: number | null
          product_id?: number | null
          product_name?: string | null
          quantity?: number | null
          return_id?: string | null
          sapo_item_id?: number | null
          sapo_return_id?: number | null
          sku?: string | null
          variant_id?: number | null
        }
        Update: {
          created_at?: string | null
          discount?: number | null
          id?: string
          line_amount?: number | null
          price?: number | null
          product_id?: number | null
          product_name?: string | null
          quantity?: number | null
          return_id?: string | null
          sapo_item_id?: number | null
          sapo_return_id?: number | null
          sku?: string | null
          variant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sapo_return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "sapo_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      sapo_returns: {
        Row: {
          code: string | null
          created_at: string | null
          created_on: string | null
          customer_id: number | null
          customer_name: string | null
          id: string
          location_id: number | null
          modified_on: string | null
          note: string | null
          order_code: string | null
          order_id: number | null
          refund_amount: number | null
          return_reason: string | null
          sapo_return_id: number
          status: string | null
          synced_at: string | null
          tags: string | null
          total: number | null
          total_tax: number | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          created_on?: string | null
          customer_id?: number | null
          customer_name?: string | null
          id?: string
          location_id?: number | null
          modified_on?: string | null
          note?: string | null
          order_code?: string | null
          order_id?: number | null
          refund_amount?: number | null
          return_reason?: string | null
          sapo_return_id: number
          status?: string | null
          synced_at?: string | null
          tags?: string | null
          total?: number | null
          total_tax?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          created_on?: string | null
          customer_id?: number | null
          customer_name?: string | null
          id?: string
          location_id?: number | null
          modified_on?: string | null
          note?: string | null
          order_code?: string | null
          order_id?: number | null
          refund_amount?: number | null
          return_reason?: string | null
          sapo_return_id?: number
          status?: string | null
          synced_at?: string | null
          tags?: string | null
          total?: number | null
          total_tax?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sapo_stock_adjustment_items: {
        Row: {
          actual_quantity: number | null
          created_at: string | null
          id: string
          note: string | null
          on_hand_quantity: number | null
          product_id: number | null
          product_name: string | null
          sapo_adjustment_id: number
          sapo_item_id: number | null
          sku: string | null
          stock_adjustment_id: string | null
          variance: number | null
          variant_id: number | null
        }
        Insert: {
          actual_quantity?: number | null
          created_at?: string | null
          id?: string
          note?: string | null
          on_hand_quantity?: number | null
          product_id?: number | null
          product_name?: string | null
          sapo_adjustment_id: number
          sapo_item_id?: number | null
          sku?: string | null
          stock_adjustment_id?: string | null
          variance?: number | null
          variant_id?: number | null
        }
        Update: {
          actual_quantity?: number | null
          created_at?: string | null
          id?: string
          note?: string | null
          on_hand_quantity?: number | null
          product_id?: number | null
          product_name?: string | null
          sapo_adjustment_id?: number
          sapo_item_id?: number | null
          sku?: string | null
          stock_adjustment_id?: string | null
          variance?: number | null
          variant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sapo_stock_adjustment_items_stock_adjustment_id_fkey"
            columns: ["stock_adjustment_id"]
            isOneToOne: false
            referencedRelation: "sapo_stock_adjustments"
            referencedColumns: ["id"]
          },
        ]
      }
      sapo_stock_adjustments: {
        Row: {
          adjusted_by_id: number | null
          adjusted_by_name: string | null
          balanced_by_id: number | null
          balanced_by_name: string | null
          balanced_on: string | null
          code: string | null
          created_at: string | null
          created_by_id: number | null
          created_by_name: string | null
          created_on: string | null
          id: string
          location_id: number | null
          modified_on: string | null
          note: string | null
          sapo_adjustment_id: number
          status: string | null
          synced_at: string | null
          tags: string | null
          total_quantity: number | null
          total_variance: number | null
          updated_at: string | null
        }
        Insert: {
          adjusted_by_id?: number | null
          adjusted_by_name?: string | null
          balanced_by_id?: number | null
          balanced_by_name?: string | null
          balanced_on?: string | null
          code?: string | null
          created_at?: string | null
          created_by_id?: number | null
          created_by_name?: string | null
          created_on?: string | null
          id?: string
          location_id?: number | null
          modified_on?: string | null
          note?: string | null
          sapo_adjustment_id: number
          status?: string | null
          synced_at?: string | null
          tags?: string | null
          total_quantity?: number | null
          total_variance?: number | null
          updated_at?: string | null
        }
        Update: {
          adjusted_by_id?: number | null
          adjusted_by_name?: string | null
          balanced_by_id?: number | null
          balanced_by_name?: string | null
          balanced_on?: string | null
          code?: string | null
          created_at?: string | null
          created_by_id?: number | null
          created_by_name?: string | null
          created_on?: string | null
          id?: string
          location_id?: number | null
          modified_on?: string | null
          note?: string | null
          sapo_adjustment_id?: number
          status?: string | null
          synced_at?: string | null
          tags?: string | null
          total_quantity?: number | null
          total_variance?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sapo_stock_transfer_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: number | null
          product_name: string | null
          quantity: number | null
          received_quantity: number | null
          sapo_item_id: number | null
          sapo_transfer_id: number | null
          sku: string | null
          stock_transfer_id: string | null
          variant_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: number | null
          product_name?: string | null
          quantity?: number | null
          received_quantity?: number | null
          sapo_item_id?: number | null
          sapo_transfer_id?: number | null
          sku?: string | null
          stock_transfer_id?: string | null
          variant_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: number | null
          product_name?: string | null
          quantity?: number | null
          received_quantity?: number | null
          sapo_item_id?: number | null
          sapo_transfer_id?: number | null
          sku?: string | null
          stock_transfer_id?: string | null
          variant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sapo_stock_transfer_items_stock_transfer_id_fkey"
            columns: ["stock_transfer_id"]
            isOneToOne: false
            referencedRelation: "sapo_stock_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      sapo_stock_transfers: {
        Row: {
          cancelled_on: string | null
          code: string | null
          created_at: string | null
          created_on: string | null
          expected_on: string | null
          from_location_id: number | null
          id: string
          modified_on: string | null
          note: string | null
          received_on: string | null
          received_quantity: number | null
          sapo_transfer_id: number
          status: string | null
          synced_at: string | null
          tags: string | null
          to_location_id: number | null
          total_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          cancelled_on?: string | null
          code?: string | null
          created_at?: string | null
          created_on?: string | null
          expected_on?: string | null
          from_location_id?: number | null
          id?: string
          modified_on?: string | null
          note?: string | null
          received_on?: string | null
          received_quantity?: number | null
          sapo_transfer_id: number
          status?: string | null
          synced_at?: string | null
          tags?: string | null
          to_location_id?: number | null
          total_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          cancelled_on?: string | null
          code?: string | null
          created_at?: string | null
          created_on?: string | null
          expected_on?: string | null
          from_location_id?: number | null
          id?: string
          modified_on?: string | null
          note?: string | null
          received_on?: string | null
          received_quantity?: number | null
          sapo_transfer_id?: number
          status?: string | null
          synced_at?: string | null
          tags?: string | null
          to_location_id?: number | null
          total_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sapo_suppliers: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          country: string | null
          created_at: string | null
          created_on: string | null
          debt: number | null
          district: string | null
          email: string | null
          id: string
          is_active: boolean | null
          modified_on: string | null
          name: string
          note: string | null
          phone: string | null
          sapo_supplier_id: number
          synced_at: string | null
          tags: string | null
          tax_code: string | null
          updated_at: string | null
          ward: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          created_on?: string | null
          debt?: number | null
          district?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          modified_on?: string | null
          name: string
          note?: string | null
          phone?: string | null
          sapo_supplier_id: number
          synced_at?: string | null
          tags?: string | null
          tax_code?: string | null
          updated_at?: string | null
          ward?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          created_on?: string | null
          debt?: number | null
          district?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          modified_on?: string | null
          name?: string
          note?: string | null
          phone?: string | null
          sapo_supplier_id?: number
          synced_at?: string | null
          tags?: string | null
          tax_code?: string | null
          updated_at?: string | null
          ward?: string | null
        }
        Relationships: []
      }
      sapo_sync_history: {
        Row: {
          completed_at: string | null
          date_range_end: string | null
          date_range_start: string | null
          error_message: string | null
          id: string
          items_synced: number | null
          orders_synced: number | null
          started_at: string
          status: string
          sync_type: string
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          error_message?: string | null
          id?: string
          items_synced?: number | null
          orders_synced?: number | null
          started_at?: string
          status?: string
          sync_type?: string
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          error_message?: string | null
          id?: string
          items_synced?: number | null
          orders_synced?: number | null
          started_at?: string
          status?: string
          sync_type?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          map_url: string | null
          name: string
          opening_hours: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          map_url?: string | null
          name: string
          opening_hours?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          map_url?: string | null
          name?: string
          opening_hours?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_items: {
        Row: {
          created_at: string
          id: string
          price: number
          product_id: string
          quantity: number
          subscription_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          price: number
          product_id: string
          quantity?: number
          subscription_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          product_id?: string
          quantity?: number
          subscription_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_items_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          delivery_method: string | null
          discount_percent: number
          frequency: string
          id: string
          last_order_id: string | null
          next_delivery_date: string
          shipping_address: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_method?: string | null
          discount_percent?: number
          frequency?: string
          id?: string
          last_order_id?: string | null
          next_delivery_date: string
          shipping_address: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_method?: string | null
          discount_percent?: number
          frequency?: string
          id?: string
          last_order_id?: string | null
          next_delivery_date?: string
          shipping_address?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_last_order_id_fkey"
            columns: ["last_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      top_nav_items: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          link_url: string | null
          mega_menu_id: string | null
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          link_url?: string | null
          mega_menu_id?: string | null
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          link_url?: string | null
          mega_menu_id?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "top_nav_items_mega_menu_id_fkey"
            columns: ["mega_menu_id"]
            isOneToOne: false
            referencedRelation: "navigation_menus"
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
      user_saved_vouchers: {
        Row: {
          id: string
          promotion_id: string
          saved_at: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          promotion_id: string
          saved_at?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          promotion_id?: string
          saved_at?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_vouchers_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_saved_vouchers_user_id_fkey"
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
      sapo_orders_monthly_counts: {
        Row: {
          count: number | null
          month: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      backfill_sapo_customer_order_stats: {
        Args: never
        Returns: {
          updated_count: number
        }[]
      }
      decrement_comment_likes: {
        Args: { comment_id_param: string }
        Returns: undefined
      }
      generate_pos_order_number: { Args: never; Returns: string }
      get_brand_sales_from_cache: {
        Args: { p_end_month?: string; p_limit?: number; p_start_month?: string }
        Returns: {
          brand: string
          quantity_sold: number
          revenue: number
          sku_count: number
        }[]
      }
      get_channel_gross_margin: {
        Args: { p_year: number }
        Returns: {
          cogs: number
          marketplace: string
          month: number
          revenue: number
        }[]
      }
      get_inventory_health_metrics: {
        Args: { p_end_month: string; p_start_month: string }
        Returns: {
          available: number
          avg_daily_sales: number
          brand: string
          cogs: number
          committed: number
          days_of_stock: number
          gross_profit: number
          import_price: number
          incoming: number
          on_hand: number
          product_name: string
          quantity_sold: number
          retail_price: number
          revenue: number
          sku: string
          stock_value: number
        }[]
      }
      get_invoice_marketplace_items: {
        Args: {
          p_from: string
          p_limit?: number
          p_marketplace?: string
          p_offset?: number
          p_only_uninvoiced?: boolean
          p_to: string
        }
        Returns: {
          converted_name: string
          converted_price: number
          converted_unit: string
          converted_unit_2: string
          converted_unit_3: string
          converted_unit_4: string
          converted_unit_5: string
          converted_vat: string
          customer_email: string
          customer_name: string
          customer_phone: string
          discount_amount: number
          item_id: string
          name: string
          order_code: string
          order_date: string
          order_id: string
          price: number
          quantity: number
          shipping_address: Json
          sku: string
          sku_converted: string
          source_name: string
          tax_amount: number
          total_count: number
          unit: string
          vat: string
        }[]
      }
      get_non_marketplace_customer_count: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          channel_name: string
          customer_count: number
        }[]
      }
      get_paddy_customers_by_month: {
        Args: never
        Returns: {
          count: number
          month: string
        }[]
      }
      get_pos_revenue_by_location: {
        Args: { end_ts: string; start_ts: string }
        Returns: {
          location_id: number
          revenue: number
        }[]
      }
      get_product_category_sales_from_cache: {
        Args: { p_end_month?: string; p_start_month?: string }
        Returns: {
          percentage: number
          product_count: number
          product_type: string
          quantity_sold: number
          revenue: number
        }[]
      }
      get_product_sales_by_date: {
        Args: { p_end_date: string; p_limit?: number; p_start_date: string }
        Returns: {
          brand: string
          cogs: number
          discount_amount: number
          discounted_quantity: number
          gross_profit: number
          order_count: number
          product_name: string
          product_type: string
          quantity_sold: number
          revenue: number
          sku: string
        }[]
      }
      get_product_sales_daily_trend: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          date: string
          quantity: number
          revenue: number
        }[]
      }
      get_product_sales_from_cache: {
        Args: { p_end_month: string; p_limit?: number; p_start_month: string }
        Returns: {
          brand: string
          cogs: number
          discount_amount: number
          discounted_quantity: number
          gross_profit: number
          order_count: number
          product_name: string
          product_type: string
          quantity_sold: number
          revenue: number
          sku: string
        }[]
      }
      get_product_sales_totals_by_date: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          active_skus: number
          total_cogs: number
          total_discount: number
          total_discounted_quantity: number
          total_gross_profit: number
          total_quantity: number
          total_revenue: number
        }[]
      }
      get_product_sales_totals_from_cache: {
        Args: { p_end_month: string; p_start_month: string }
        Returns: {
          active_skus: number
          total_cogs: number
          total_discount: number
          total_discounted_quantity: number
          total_gross_profit: number
          total_quantity: number
          total_revenue: number
        }[]
      }
      get_recent_sapo_customers: {
        Args: { p_limit?: number }
        Returns: {
          email: string
          id: string
          modified_on: string
          name: string
          phone: string
          total_orders: number
          total_spent: number
        }[]
      }
      get_sapo_customers_by_month: {
        Args: never
        Returns: {
          count: number
          month: string
        }[]
      }
      get_sapo_order_stats: {
        Args: {
          p_channel?: string
          p_end_date?: string
          p_search?: string
          p_start_date?: string
          p_status?: string
        }
        Returns: {
          total_items: number
          total_orders: number
          total_revenue: number
          total_tax: number
        }[]
      }
      get_sapo_orders_branch_totals_from_cache: {
        Args: { p_end_month?: string; p_start_month?: string }
        Returns: {
          branch_name: string
          order_count: number
          total_revenue: number
        }[]
      }
      get_sapo_orders_by_channel: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          channel_name: string
          order_count: number
          total_revenue: number
        }[]
      }
      get_sapo_orders_by_month: {
        Args: never
        Returns: {
          count: number
          month: string
        }[]
      }
      get_sapo_orders_date_range: {
        Args: never
        Returns: {
          earliest: string
          latest: string
        }[]
      }
      get_sapo_orders_last_sync: { Args: never; Returns: string }
      get_sapo_orders_total_count: { Args: never; Returns: number }
      get_sapo_orders_totals_from_cache: {
        Args: {
          p_end_month?: string
          p_paddy_only?: boolean
          p_start_month?: string
        }
        Returns: {
          channel_name: string
          order_count: number
          total_revenue: number
        }[]
      }
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
      increment_comment_likes: {
        Args: { comment_id_param: string }
        Returns: undefined
      }
      increment_voucher_usage: {
        Args: { p_promotion_id: string }
        Returns: undefined
      }
      mark_orders_invoiced: { Args: { p_order_ids: string[] }; Returns: number }
      refresh_paddy_customers_monthly_counts_cache: {
        Args: never
        Returns: undefined
      }
      refresh_sapo_orders_channel_monthly_cache: {
        Args: never
        Returns: undefined
      }
      refresh_sapo_orders_monthly_counts: { Args: never; Returns: undefined }
      refresh_sapo_orders_monthly_counts_blocking: {
        Args: never
        Returns: undefined
      }
      refresh_sapo_orders_monthly_counts_cache: {
        Args: never
        Returns: undefined
      }
      refresh_sapo_product_sales_monthly_cache: {
        Args: never
        Returns: undefined
      }
      search_sapo_customers: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          email: string
          id: string
          name: string
          phone: string
          total_orders: number
          total_spent: number
        }[]
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
