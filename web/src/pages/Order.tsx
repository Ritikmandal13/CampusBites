import { useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useCart } from '../store/CartContext'
import { CartDrawer } from '../ui/components/CartDrawer'
import { MenuCard } from '../ui/components/MenuCard'
import { useMenu } from '../lib/hooks'
import { supabase } from '../lib/supabaseClient'

export function OrderPage() {
  const { qrId } = useParams()
  const { add, setCanteen } = useCart()
  const [open, setOpen] = useState(false)
  const [canteenId, setCanteenId] = useState<number | undefined>(undefined)
  const [tableNo, setTableNo] = useState<string | null>(null)
  const { data, isLoading } = useMenu(canteenId)
  
  useEffect(() => {
    const load = async () => {
      if (!qrId) return
      
      // Use direct fetch to avoid hanging
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      try {
        const url = `${supabaseUrl}/rest/v1/qr_codes?qr_id=eq.${qrId}&select=canteen_id,table_no`
        const response = await fetch(url, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const qrData = await response.json()
          if (qrData && qrData.length > 0) {
            const canteen = qrData[0].canteen_id
            const table = qrData[0].table_no
            setCanteenId(canteen)
            setTableNo(table)
            setCanteen(canteen, qrId, table) // Store in cart context including table number
          }
        }
      } catch (err) {
        console.error('Failed to load QR code:', err)
      }
    }
    load()
  }, [qrId, setCanteen])
  
  const items = useMemo(() => (data ?? []).map(i => {
    const img = i.image_path
      ? supabase.storage.from('menu-images').getPublicUrl(i.image_path).data.publicUrl
      : undefined
    const price = typeof i.price === 'string' ? parseFloat(i.price) : i.price
    return {
      id: String(i.id),
      title: i.name,
      price: price,
      category: i.category ?? 'All Items',
      img,
    }
  }), [data])
  
  return (
    <div className="container-app py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Order</h1>
          <p className="text-sm text-muted">
            QR: {qrId}
            {tableNo && <span className="ml-2">• Table: {tableNo}</span>}
          </p>
        </div>
        <button className="btn-ghost" onClick={() => setOpen(true)}>View Cart</button>
      </div>
      {isLoading && <div className="text-sm text-muted">Loading…</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((m) => {
          const priceNum = typeof m.price === 'number' ? m.price : parseFloat(String(m.price)) || 0
          return (
            <MenuCard 
              key={m.id}
              title={m.title} 
              price={`₹${priceNum.toFixed(0)}`} 
              category={m.category} 
              imageUrl={m.img}
              onAdd={() => {
                add({ 
                  id: m.id, 
                  title: m.title, 
                  price: priceNum, 
                  imageUrl: m.img 
                })
              }}
            />
          )
        })}
      </div>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  )
}


