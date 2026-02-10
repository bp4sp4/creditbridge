export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      certificate_applications: {
        Row: {
          id: string
          name: string
          contact: string
          birth_prefix: string
          address: string
          address_main: string
          address_detail: string | null
          certificates: string[]
          photo_url: string | null
          cash_receipt: string | null
          status: 'pending' | 'submitted' | 'approved' | 'rejected'
          order_id: string | null
          amount: number | null
          payment_status: 'pending' | 'paid' | 'failed' | 'cancelled'
          trade_id: string | null
          mul_no: string | null
          pay_method: string | null
          paid_at: string | null
          failed_at: string | null
          failed_message: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact: string
          birth_prefix: string
          address: string
          address_main: string
          address_detail?: string | null
          certificates: string[]
          photo_url?: string | null
          cash_receipt?: string | null
          status?: 'pending' | 'submitted' | 'approved' | 'rejected'
          order_id?: string | null
          amount?: number | null
          payment_status?: 'pending' | 'paid' | 'failed' | 'cancelled'
          trade_id?: string | null
          mul_no?: string | null
          pay_method?: string | null
          paid_at?: string | null
          failed_at?: string | null
          failed_message?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact?: string
          birth_prefix?: string
          address?: string
          address_main?: string
          address_detail?: string | null
          certificates?: string[]
          photo_url?: string | null
          cash_receipt?: string | null
          status?: 'pending' | 'submitted' | 'approved' | 'rejected'
          order_id?: string | null
          amount?: number | null
          payment_status?: 'pending' | 'paid' | 'failed' | 'cancelled'
          trade_id?: string | null
          mul_no?: string | null
          pay_method?: string | null
          paid_at?: string | null
          failed_at?: string | null
          failed_message?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: number
          order_id: string
          amount: number
          order_name: string
          product_type: string | null
          billing_cycle: string | null
          customer_name: string
          customer_phone: string
          status: 'pending' | 'paid' | 'failed' | 'cancelled'
          trade_id: string | null
          mul_no: string | null
          pay_method: string | null
          paid_at: string | null
          failed_at: string | null
          failed_message: string | null
          cancelled_at: string | null
          application_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          order_id: string
          amount: number
          order_name: string
          product_type?: string | null
          billing_cycle?: string | null
          customer_name: string
          customer_phone: string
          status?: 'pending' | 'paid' | 'failed' | 'cancelled'
          trade_id?: string | null
          mul_no?: string | null
          pay_method?: string | null
          paid_at?: string | null
          failed_at?: string | null
          failed_message?: string | null
          cancelled_at?: string | null
          application_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          order_id?: string
          amount?: number
          order_name?: string
          product_type?: string | null
          billing_cycle?: string | null
          customer_name?: string
          customer_phone?: string
          status?: 'pending' | 'paid' | 'failed' | 'cancelled'
          trade_id?: string | null
          mul_no?: string | null
          pay_method?: string | null
          paid_at?: string | null
          failed_at?: string | null
          failed_message?: string | null
          cancelled_at?: string | null
          application_id?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      payment_cancellations: {
        Row: {
          id: string
          app_id: string
          mul_no: string
          cancel_type: 'full' | 'partial' | 'request'
          cancel_amount: number
          cancel_reason: string | null
          status: 'pending' | 'approved' | 'rejected'
          cancelled_mul_no: string | null
          cancellation_date: string | null
          payback_amount: number | null
          payback_bank: string | null
          payback_account: string | null
          payback_account_holder: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          app_id: string
          mul_no: string
          cancel_type: 'full' | 'partial' | 'request'
          cancel_amount: number
          cancel_reason?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          cancelled_mul_no?: string | null
          cancellation_date?: string | null
          payback_amount?: number | null
          payback_bank?: string | null
          payback_account?: string | null
          payback_account_holder?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          app_id?: string
          mul_no?: string
          cancel_type?: 'full' | 'partial' | 'request'
          cancel_amount?: number
          cancel_reason?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          cancelled_mul_no?: string | null
          cancellation_date?: string | null
          payback_amount?: number | null
          payback_bank?: string | null
          payback_account?: string | null
          payback_account_holder?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recurring_payments: {
        Row: {
          id: number
          order_id: number
          rebill_no: string
          amount: number
          billing_cycle: string
          status: 'active' | 'cancelled' | 'completed'
          next_billing_date: string | null
          last_paid_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          order_id: number
          rebill_no: string
          amount: number
          billing_cycle: string
          status?: 'active' | 'cancelled' | 'completed'
          next_billing_date?: string | null
          last_paid_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          order_id?: number
          rebill_no?: string
          amount?: number
          billing_cycle?: string
          status?: 'active' | 'cancelled' | 'completed'
          next_billing_date?: string | null
          last_paid_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payment_logs: {
        Row: {
          id: string
          app_id: string
          action: string
          amount: number | null
          request_data: Json | null
          response_data: Json | null
          error_message: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          app_id: string
          action: string
          amount?: number | null
          request_data?: Json | null
          response_data?: Json | null
          error_message?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          app_id?: string
          action?: string
          amount?: number | null
          request_data?: Json | null
          response_data?: Json | null
          error_message?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Certificate_applications = Database['public']['Tables']['certificate_applications']['Row']
export type Orders = Database['public']['Tables']['orders']['Row']
export type Payment_cancellations = Database['public']['Tables']['payment_cancellations']['Row']
export type Recurring_payments = Database['public']['Tables']['recurring_payments']['Row']
export type Payment_logs = Database['public']['Tables']['payment_logs']['Row']
