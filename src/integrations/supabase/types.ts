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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          code: string
          created_at: string
          id: string
          name_ar: string
          name_en: string
          type: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
          type: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          type?: string
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          action: string
          actor_email: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      addresses: {
        Row: {
          address_line: string
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          phone: string
          postal_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line: string
          city: string
          country: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          phone: string
          postal_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line?: string
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          phone?: string
          postal_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content_ar: string | null
          content_en: string | null
          content_ur: string | null
          cover_url: string | null
          created_at: string
          excerpt_ar: string | null
          excerpt_en: string | null
          excerpt_ur: string | null
          id: string
          published_at: string | null
          slug: string
          status: string
          tags: string[]
          title_ar: string | null
          title_en: string | null
          title_ur: string | null
          updated_at: string
          views: number
        }
        Insert: {
          author_id?: string | null
          content_ar?: string | null
          content_en?: string | null
          content_ur?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt_ar?: string | null
          excerpt_en?: string | null
          excerpt_ur?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          tags?: string[]
          title_ar?: string | null
          title_en?: string | null
          title_ur?: string | null
          updated_at?: string
          views?: number
        }
        Update: {
          author_id?: string | null
          content_ar?: string | null
          content_en?: string | null
          content_ur?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt_ar?: string | null
          excerpt_en?: string | null
          excerpt_ur?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          tags?: string[]
          title_ar?: string | null
          title_en?: string | null
          title_ur?: string | null
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          name_ur: string | null
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          name_ur?: string | null
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          name_ur?: string | null
          parent_id?: string | null
          slug?: string
          sort_order?: number
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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          handled_by: string | null
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          handled_by?: string | null
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          handled_by?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          created_at: string
          discount_amount: number
          id: string
          order_id: string | null
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount_amount?: number
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount_amount?: number
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
          is_active: boolean
          max_uses: number | null
          min_total: number | null
          starts_at: string | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_total?: number | null
          starts_at?: string | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_total?: number | null
          starts_at?: string | null
          used_count?: number
        }
        Relationships: []
      }
      digital_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_used: boolean
          notes: string | null
          order_item_id: string | null
          product_id: string
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_used?: boolean
          notes?: string | null
          order_item_id?: string | null
          product_id: string
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_used?: boolean
          notes?: string | null
          order_item_id?: string | null
          product_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_codes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          cost_per_unit: number
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          notes: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          discount: number
          id: string
          invoice_number: string
          issued_at: string
          order_id: string | null
          pdf_url: string | null
          pos_sale_id: string | null
          status: string
          subtotal: number
          tax: number
          tax_rate: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          id?: string
          invoice_number?: string
          issued_at?: string
          order_id?: string | null
          pdf_url?: string | null
          pos_sale_id?: string | null
          status?: string
          subtotal: number
          tax: number
          tax_rate?: number
          total: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          id?: string
          invoice_number?: string
          issued_at?: string
          order_id?: string | null
          pdf_url?: string | null
          pos_sale_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          tax_rate?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          entry_date: string
          entry_number: string
          id: string
          reference_id: string | null
          reference_type: string | null
          total_credit: number
          total_debit: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date?: string
          entry_number: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          total_credit?: number
          total_debit?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date?: string
          entry_number?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          total_credit?: number
          total_debit?: number
        }
        Relationships: []
      }
      journal_lines: {
        Row: {
          account_id: string
          created_at: string
          credit: number
          debit: number
          description: string | null
          entry_id: string
          id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          entry_id: string
          id?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          entry_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_points: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          order_id: string | null
          points: number
          reason: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          order_id?: string | null
          points: number
          reason: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          order_id?: string | null
          points?: number
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          lang: string | null
          source: string | null
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          lang?: string | null
          source?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          lang?: string | null
          source?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          severity: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          severity?: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          severity?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          delivered_codes: Json | null
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_type: Database["public"]["Enums"]["product_type"]
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          delivered_codes?: Json | null
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_type: Database["public"]["Enums"]["product_type"]
          quantity: number
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          delivered_codes?: Json | null
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_type?: Database["public"]["Enums"]["product_type"]
          quantity?: number
          total?: number
          unit_price?: number
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
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          buyer_email: string
          buyer_id: string | null
          buyer_name: string | null
          buyer_phone: string | null
          channel: string
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          currency: string
          customer_notes: string | null
          discount: number
          id: string
          invoice_id: string | null
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_confirmed_at: string | null
          payment_confirmed_by: string | null
          payment_method: string | null
          payment_method_id: string | null
          payment_proof_url: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping: number
          shipping_address: Json | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_session_id: string | null
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          buyer_email: string
          buyer_id?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          channel?: string
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          customer_notes?: string | null
          discount?: number
          id?: string
          invoice_id?: string | null
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_confirmed_at?: string | null
          payment_confirmed_by?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping?: number
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          buyer_email?: string
          buyer_id?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          channel?: string
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          customer_notes?: string | null
          discount?: number
          id?: string
          invoice_id?: string | null
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_confirmed_at?: string | null
          payment_confirmed_by?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping?: number
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods_public"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_details: Json | null
          code: string
          config: Json
          created_at: string
          credentials: Json
          fee_amount: number | null
          fee_percent: number | null
          gateway_provider: string | null
          icon: string | null
          id: string
          instructions_ar: string | null
          instructions_en: string | null
          instructions_ur: string | null
          is_active: boolean | null
          is_gateway: boolean
          logo_url: string | null
          max_amount: number | null
          min_amount: number | null
          name_ar: string
          name_en: string
          name_ur: string | null
          requires_proof: boolean | null
          sort_order: number | null
          supported_currencies: string[]
          test_mode: boolean
          type: string
          updated_at: string
        }
        Insert: {
          account_details?: Json | null
          code: string
          config?: Json
          created_at?: string
          credentials?: Json
          fee_amount?: number | null
          fee_percent?: number | null
          gateway_provider?: string | null
          icon?: string | null
          id?: string
          instructions_ar?: string | null
          instructions_en?: string | null
          instructions_ur?: string | null
          is_active?: boolean | null
          is_gateway?: boolean
          logo_url?: string | null
          max_amount?: number | null
          min_amount?: number | null
          name_ar: string
          name_en: string
          name_ur?: string | null
          requires_proof?: boolean | null
          sort_order?: number | null
          supported_currencies?: string[]
          test_mode?: boolean
          type: string
          updated_at?: string
        }
        Update: {
          account_details?: Json | null
          code?: string
          config?: Json
          created_at?: string
          credentials?: Json
          fee_amount?: number | null
          fee_percent?: number | null
          gateway_provider?: string | null
          icon?: string | null
          id?: string
          instructions_ar?: string | null
          instructions_en?: string | null
          instructions_ur?: string | null
          is_active?: boolean | null
          is_gateway?: boolean
          logo_url?: string | null
          max_amount?: number | null
          min_amount?: number | null
          name_ar?: string
          name_en?: string
          name_ur?: string | null
          requires_proof?: boolean | null
          sort_order?: number | null
          supported_currencies?: string[]
          test_mode?: boolean
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          order_id: string | null
          paid_at: string | null
          payment_method: string | null
          provider: string
          provider_charge_id: string | null
          raw_response: Json | null
          redirect_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          order_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          provider?: string
          provider_charge_id?: string | null
          raw_response?: Json | null
          redirect_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          order_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          provider?: string
          provider_charge_id?: string | null
          raw_response?: Json | null
          redirect_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sale_items: {
        Row: {
          cost_per_unit: number
          discount: number
          id: string
          product_id: string | null
          product_name: string
          quantity: number
          sale_id: string
          sku: string | null
          total: number
          unit_price: number
        }
        Insert: {
          cost_per_unit?: number
          discount?: number
          id?: string
          product_id?: string | null
          product_name: string
          quantity: number
          sale_id: string
          sku?: string | null
          total: number
          unit_price: number
        }
        Update: {
          cost_per_unit?: number
          discount?: number
          id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sale_id?: string
          sku?: string | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pos_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sales: {
        Row: {
          cashier_id: string
          change_amount: number | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          discount: number
          id: string
          invoice_id: string | null
          paid_amount: number | null
          payment_method: string
          payment_reference: string | null
          sale_number: string
          session_id: string | null
          status: string
          subtotal: number
          tax: number
          total: number
        }
        Insert: {
          cashier_id: string
          change_amount?: number | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          id?: string
          invoice_id?: string | null
          paid_amount?: number | null
          payment_method: string
          payment_reference?: string | null
          sale_number?: string
          session_id?: string | null
          status?: string
          subtotal: number
          tax?: number
          total: number
        }
        Update: {
          cashier_id?: string
          change_amount?: number | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          id?: string
          invoice_id?: string | null
          paid_amount?: number | null
          payment_method?: string
          payment_reference?: string | null
          sale_number?: string
          session_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_sales_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sales_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pos_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sessions: {
        Row: {
          cashier_id: string
          closed_at: string | null
          closing_cash: number | null
          created_at: string
          difference: number | null
          expected_cash: number | null
          id: string
          notes: string | null
          opened_at: string
          opening_cash: number
          status: string
        }
        Insert: {
          cashier_id: string
          closed_at?: string | null
          closing_cash?: number | null
          created_at?: string
          difference?: number | null
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_cash?: number
          status?: string
        }
        Update: {
          cashier_id?: string
          closed_at?: string | null
          closing_cash?: number | null
          created_at?: string
          difference?: number | null
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_cash?: number
          status?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          compare_price: number | null
          cost_price: number
          created_at: string
          currency: string
          description_ar: string | null
          description_en: string | null
          description_ur: string | null
          features: Json
          id: string
          images: Json
          is_featured: boolean
          name_ar: string
          name_en: string
          name_ur: string | null
          price: number
          sku: string | null
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          track_stock: boolean
          type: Database["public"]["Enums"]["product_type"]
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          compare_price?: number | null
          cost_price?: number
          created_at?: string
          currency?: string
          description_ar?: string | null
          description_en?: string | null
          description_ur?: string | null
          features?: Json
          id?: string
          images?: Json
          is_featured?: boolean
          name_ar: string
          name_en: string
          name_ur?: string | null
          price: number
          sku?: string | null
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          track_stock?: boolean
          type?: Database["public"]["Enums"]["product_type"]
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          compare_price?: number | null
          cost_price?: number
          created_at?: string
          currency?: string
          description_ar?: string | null
          description_en?: string | null
          description_ur?: string | null
          features?: Json
          id?: string
          images?: Json
          is_featured?: boolean
          name_ar?: string
          name_en?: string
          name_ur?: string | null
          price?: number
          sku?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          track_stock?: boolean
          type?: Database["public"]["Enums"]["product_type"]
          updated_at?: string
          weight_grams?: number | null
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
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          cost_per_unit: number
          created_at: string
          id: string
          product_id: string | null
          product_name: string
          purchase_order_id: string
          quantity: number
          total: number
        }
        Insert: {
          cost_per_unit: number
          created_at?: string
          id?: string
          product_id?: string | null
          product_name: string
          purchase_order_id: string
          quantity: number
          total: number
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          product_id?: string | null
          product_name?: string
          purchase_order_id?: string
          quantity?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          id: string
          notes: string | null
          po_number: string
          received_at: string | null
          status: string
          subtotal: number
          supplier_id: string
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          po_number: string
          received_at?: string | null
          status?: string
          subtotal?: number
          supplier_id: string
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          po_number?: string
          received_at?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_approved: boolean
          product_id: string
          rating: number
          title: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id: string
          rating: number
          title?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id?: string
          rating?: number
          title?: string | null
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
        ]
      }
      site_settings: {
        Row: {
          accent_color: string | null
          allow_guest_checkout: boolean
          allow_signups: boolean
          announcement_bar_enabled: boolean
          announcement_bar_text: string | null
          business_hours: string | null
          company_address: string | null
          company_cr: string | null
          company_vat_no: string | null
          contact_email: string | null
          contact_phone: string | null
          custom_head_html: string | null
          default_currency: string
          default_language: string
          facebook_url: string | null
          favicon_url: string | null
          free_shipping_threshold: number | null
          google_analytics_id: string | null
          hero_badge_text: string | null
          hero_cta_ar: string | null
          hero_cta_en: string | null
          hero_cta_ur: string | null
          hero_subtitle_ar: string | null
          hero_subtitle_en: string | null
          hero_subtitle_ur: string | null
          hero_title_ar: string | null
          hero_title_en: string | null
          hero_title_ur: string | null
          id: number
          instagram_url: string | null
          logo_url: string | null
          low_stock_threshold: number
          maintenance_message: string | null
          maintenance_mode: boolean
          meta_description_ar: string | null
          meta_description_en: string | null
          meta_description_ur: string | null
          meta_keywords: string | null
          meta_pixel_id: string | null
          notify_email_low_stock: boolean
          notify_email_new_order: boolean
          og_image_url: string | null
          prices_include_vat: boolean
          primary_color: string | null
          require_email_verification: boolean
          shipping_flat: number
          site_name: string
          snapchat_url: string | null
          social_links: Json
          tagline_ar: string | null
          tagline_en: string | null
          tagline_ur: string | null
          telegram_url: string | null
          theme_preset: string
          tiktok_pixel_id: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          vat_percent: number
          whatsapp: string | null
          youtube_url: string | null
        }
        Insert: {
          accent_color?: string | null
          allow_guest_checkout?: boolean
          allow_signups?: boolean
          announcement_bar_enabled?: boolean
          announcement_bar_text?: string | null
          business_hours?: string | null
          company_address?: string | null
          company_cr?: string | null
          company_vat_no?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          custom_head_html?: string | null
          default_currency?: string
          default_language?: string
          facebook_url?: string | null
          favicon_url?: string | null
          free_shipping_threshold?: number | null
          google_analytics_id?: string | null
          hero_badge_text?: string | null
          hero_cta_ar?: string | null
          hero_cta_en?: string | null
          hero_cta_ur?: string | null
          hero_subtitle_ar?: string | null
          hero_subtitle_en?: string | null
          hero_subtitle_ur?: string | null
          hero_title_ar?: string | null
          hero_title_en?: string | null
          hero_title_ur?: string | null
          id?: number
          instagram_url?: string | null
          logo_url?: string | null
          low_stock_threshold?: number
          maintenance_message?: string | null
          maintenance_mode?: boolean
          meta_description_ar?: string | null
          meta_description_en?: string | null
          meta_description_ur?: string | null
          meta_keywords?: string | null
          meta_pixel_id?: string | null
          notify_email_low_stock?: boolean
          notify_email_new_order?: boolean
          og_image_url?: string | null
          prices_include_vat?: boolean
          primary_color?: string | null
          require_email_verification?: boolean
          shipping_flat?: number
          site_name?: string
          snapchat_url?: string | null
          social_links?: Json
          tagline_ar?: string | null
          tagline_en?: string | null
          tagline_ur?: string | null
          telegram_url?: string | null
          theme_preset?: string
          tiktok_pixel_id?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          vat_percent?: number
          whatsapp?: string | null
          youtube_url?: string | null
        }
        Update: {
          accent_color?: string | null
          allow_guest_checkout?: boolean
          allow_signups?: boolean
          announcement_bar_enabled?: boolean
          announcement_bar_text?: string | null
          business_hours?: string | null
          company_address?: string | null
          company_cr?: string | null
          company_vat_no?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          custom_head_html?: string | null
          default_currency?: string
          default_language?: string
          facebook_url?: string | null
          favicon_url?: string | null
          free_shipping_threshold?: number | null
          google_analytics_id?: string | null
          hero_badge_text?: string | null
          hero_cta_ar?: string | null
          hero_cta_en?: string | null
          hero_cta_ur?: string | null
          hero_subtitle_ar?: string | null
          hero_subtitle_en?: string | null
          hero_subtitle_ur?: string | null
          hero_title_ar?: string | null
          hero_title_en?: string | null
          hero_title_ur?: string | null
          id?: number
          instagram_url?: string | null
          logo_url?: string | null
          low_stock_threshold?: number
          maintenance_message?: string | null
          maintenance_mode?: boolean
          meta_description_ar?: string | null
          meta_description_en?: string | null
          meta_description_ur?: string | null
          meta_keywords?: string | null
          meta_pixel_id?: string | null
          notify_email_low_stock?: boolean
          notify_email_new_order?: boolean
          og_image_url?: string | null
          prices_include_vat?: boolean
          primary_color?: string | null
          require_email_verification?: boolean
          shipping_flat?: number
          site_name?: string
          snapchat_url?: string | null
          social_links?: Json
          tagline_ar?: string | null
          tagline_en?: string | null
          tagline_ur?: string | null
          telegram_url?: string | null
          theme_preset?: string
          tiktok_pixel_id?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          vat_percent?: number
          whatsapp?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          balance: number
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          balance?: number
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          balance?: number
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
      wishlist: {
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
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      loyalty_balance: {
        Row: {
          balance: number | null
          buyer_id: string | null
        }
        Relationships: []
      }
      payment_methods_public: {
        Row: {
          account_details: Json | null
          code: string | null
          created_at: string | null
          fee_amount: number | null
          fee_percent: number | null
          gateway_provider: string | null
          icon: string | null
          id: string | null
          instructions_ar: string | null
          instructions_en: string | null
          instructions_ur: string | null
          is_active: boolean | null
          is_gateway: boolean | null
          logo_url: string | null
          max_amount: number | null
          min_amount: number | null
          name_ar: string | null
          name_en: string | null
          name_ur: string | null
          requires_proof: boolean | null
          sort_order: number | null
          supported_currencies: string[] | null
          test_mode: boolean | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          account_details?: Json | null
          code?: string | null
          created_at?: string | null
          fee_amount?: number | null
          fee_percent?: number | null
          gateway_provider?: string | null
          icon?: string | null
          id?: string | null
          instructions_ar?: string | null
          instructions_en?: string | null
          instructions_ur?: string | null
          is_active?: boolean | null
          is_gateway?: boolean | null
          logo_url?: string | null
          max_amount?: number | null
          min_amount?: number | null
          name_ar?: string | null
          name_en?: string | null
          name_ur?: string | null
          requires_proof?: boolean | null
          sort_order?: number | null
          supported_currencies?: string[] | null
          test_mode?: boolean | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          account_details?: Json | null
          code?: string | null
          created_at?: string | null
          fee_amount?: number | null
          fee_percent?: number | null
          gateway_provider?: string | null
          icon?: string | null
          id?: string | null
          instructions_ar?: string | null
          instructions_en?: string | null
          instructions_ur?: string | null
          is_active?: boolean | null
          is_gateway?: boolean | null
          logo_url?: string | null
          max_amount?: number | null
          min_amount?: number | null
          name_ar?: string | null
          name_en?: string | null
          name_ur?: string | null
          requires_proof?: boolean | null
          sort_order?: number | null
          supported_currencies?: string[] | null
          test_mode?: boolean | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews_public: {
        Row: {
          author_avatar: string | null
          author_name: string | null
          body: string | null
          created_at: string | null
          id: string | null
          product_id: string | null
          rating: number | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_broadcast_notification: {
        Args: {
          _link?: string
          _message: string
          _severity?: string
          _target?: string
          _title: string
        }
        Returns: number
      }
      admin_customer_analytics: {
        Args: never
        Returns: {
          buyer_email: string
          buyer_name: string
          first_order_at: string
          last_order_at: string
          orders_count: number
          total_spent: number
        }[]
      }
      admin_delete_coupon: { Args: { _id: string }; Returns: undefined }
      admin_list_coupons: {
        Args: never
        Returns: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_total: number | null
          starts_at: string | null
          used_count: number
        }[]
        SetofOptions: {
          from: "*"
          to: "coupons"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_upsert_coupon: {
        Args: { _data: Json }
        Returns: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_total: number | null
          starts_at: string | null
          used_count: number
        }
        SetofOptions: {
          from: "*"
          to: "coupons"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      assign_digital_codes: { Args: { _order_id: string }; Returns: undefined }
      finalize_coupon_use: {
        Args: { _coupon_id: string; _discount: number; _order_id: string }
        Returns: undefined
      }
      get_site_settings_admin: {
        Args: never
        Returns: {
          accent_color: string | null
          allow_guest_checkout: boolean
          allow_signups: boolean
          announcement_bar_enabled: boolean
          announcement_bar_text: string | null
          business_hours: string | null
          company_address: string | null
          company_cr: string | null
          company_vat_no: string | null
          contact_email: string | null
          contact_phone: string | null
          custom_head_html: string | null
          default_currency: string
          default_language: string
          facebook_url: string | null
          favicon_url: string | null
          free_shipping_threshold: number | null
          google_analytics_id: string | null
          hero_badge_text: string | null
          hero_cta_ar: string | null
          hero_cta_en: string | null
          hero_cta_ur: string | null
          hero_subtitle_ar: string | null
          hero_subtitle_en: string | null
          hero_subtitle_ur: string | null
          hero_title_ar: string | null
          hero_title_en: string | null
          hero_title_ur: string | null
          id: number
          instagram_url: string | null
          logo_url: string | null
          low_stock_threshold: number
          maintenance_message: string | null
          maintenance_mode: boolean
          meta_description_ar: string | null
          meta_description_en: string | null
          meta_description_ur: string | null
          meta_keywords: string | null
          meta_pixel_id: string | null
          notify_email_low_stock: boolean
          notify_email_new_order: boolean
          og_image_url: string | null
          prices_include_vat: boolean
          primary_color: string | null
          require_email_verification: boolean
          shipping_flat: number
          site_name: string
          snapchat_url: string | null
          social_links: Json
          tagline_ar: string | null
          tagline_en: string | null
          tagline_ur: string | null
          telegram_url: string | null
          theme_preset: string
          tiktok_pixel_id: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          vat_percent: number
          whatsapp: string | null
          youtube_url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "site_settings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      increment_blog_views: { Args: { _slug: string }; Returns: undefined }
      redeem_coupon: {
        Args: { _code: string; _subtotal: number }
        Returns: {
          code: string
          coupon_id: string
          discount: number
        }[]
      }
      track_order: {
        Args: { _email: string; _order_number: string }
        Returns: {
          created_at: string
          currency: string
          items: Json
          order_number: string
          payment_status: string
          status: string
          total: number
          updated_at: string
        }[]
      }
      update_site_settings_admin: {
        Args: { payload: Json }
        Returns: {
          accent_color: string | null
          allow_guest_checkout: boolean
          allow_signups: boolean
          announcement_bar_enabled: boolean
          announcement_bar_text: string | null
          business_hours: string | null
          company_address: string | null
          company_cr: string | null
          company_vat_no: string | null
          contact_email: string | null
          contact_phone: string | null
          custom_head_html: string | null
          default_currency: string
          default_language: string
          facebook_url: string | null
          favicon_url: string | null
          free_shipping_threshold: number | null
          google_analytics_id: string | null
          hero_badge_text: string | null
          hero_cta_ar: string | null
          hero_cta_en: string | null
          hero_cta_ur: string | null
          hero_subtitle_ar: string | null
          hero_subtitle_en: string | null
          hero_subtitle_ur: string | null
          hero_title_ar: string | null
          hero_title_en: string | null
          hero_title_ur: string | null
          id: number
          instagram_url: string | null
          logo_url: string | null
          low_stock_threshold: number
          maintenance_message: string | null
          maintenance_mode: boolean
          meta_description_ar: string | null
          meta_description_en: string | null
          meta_description_ur: string | null
          meta_keywords: string | null
          meta_pixel_id: string | null
          notify_email_low_stock: boolean
          notify_email_new_order: boolean
          og_image_url: string | null
          prices_include_vat: boolean
          primary_color: string | null
          require_email_verification: boolean
          shipping_flat: number
          site_name: string
          snapchat_url: string | null
          social_links: Json
          tagline_ar: string | null
          tagline_en: string | null
          tagline_ur: string | null
          telegram_url: string | null
          theme_preset: string
          tiktok_pixel_id: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          vat_percent: number
          whatsapp: string | null
          youtube_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "site_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      validate_coupon:
        | {
            Args: { _code: string }
            Returns: {
              code: string
              discount_type: string
              discount_value: number
              id: string
              min_total: number
            }[]
          }
        | {
            Args: { _code: string; _subtotal: number }
            Returns: {
              coupon_id: string
              discount_amount: number
              discount_type: string
              discount_value: number
              message: string
              valid: boolean
            }[]
          }
    }
    Enums: {
      app_role: "admin" | "customer"
      order_item_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      order_status:
        | "pending"
        | "paid"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      product_status: "draft" | "active" | "archived"
      product_type: "physical" | "digital" | "subscription"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
      vendor_status: "pending" | "approved" | "suspended"
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
      order_item_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      order_status: [
        "pending",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      product_status: ["draft", "active", "archived"],
      product_type: ["physical", "digital", "subscription"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      vendor_status: ["pending", "approved", "suspended"],
    },
  },
} as const
