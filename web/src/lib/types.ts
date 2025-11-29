export interface MenuItem {
  id: number
  name: string
  price: number | string // Can be number or string from database
  category: string | null
  image_path?: string | null
  description?: string | null
  is_available?: boolean
  canteen_id?: number | null
  prep_time_minutes?: number
}

export interface OrderItem {
  id: number
  order_id: number
  menu_item_id?: number | null
  name: string
  qty: number
  unit_price: number
  subtotal: number
}

export interface Order {
  id: number
  order_number?: string | null
  token?: string | null
  user_id?: string | null
  canteen_id?: number | null
  total_amount: number
  tax?: number
  payment_status?: 'PENDING'|'SUCCESS'|'FAILED'|'REFUNDED' | null
  payment_method?: 'UPI'|'COD' | null
  order_status?: 'NEW'|'ACCEPTED'|'PREPARING'|'READY'|'COMPLETED'|'CANCELLED' | null
  source_qr_id?: string | null
  table_no?: string | null
  notes?: string | null
  cancel_reason?: string | null
  estimated_ready_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  order_items?: OrderItem[]
}


