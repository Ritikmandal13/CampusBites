export type MenuItem = {
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

export type Order = {
  id: number
  order_number?: string | null
  token?: string | null
  user_id?: string | null
  total_amount: number
  payment_status?: 'PENDING'|'SUCCESS'|'FAILED'|'REFUNDED' | null
  payment_method?: string | null
  order_status?: 'NEW'|'ACCEPTED'|'PREPARING'|'READY'|'COMPLETED'|'CANCELLED' | null
  source_qr_id?: string | null
  table_no?: string | null
  created_at?: string | null
  updated_at?: string | null
}


