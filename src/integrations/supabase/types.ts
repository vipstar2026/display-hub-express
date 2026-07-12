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
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_total: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_total?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_total?: number | null
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
    }
    Views: {
      payment_methods_public: {
        Row: {
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
    }
    Functions: {
      validate_coupon: {
        Args: { _code: string }
        Returns: {
          code: string
          discount_type: string
          discount_value: number
          id: string
          min_total: number
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
