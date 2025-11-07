import { useEffect, useState } from 'react'
import { StatusBadge } from '../ui/components/StatusBadge'
import { supabase } from '../lib/supabaseClient'

type Ticket = { id: number; token: string | null; items: string; status: 'NEW'|'ACCEPTED'|'PREPARING'|'READY'|'COMPLETED'|'CANCELLED' }

export function KitchenNowPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('orders').select('id, token, order_status').in('order_status', ['NEW','ACCEPTED','PREPARING','READY']).order('created_at', { ascending: true })
      const mapped: Ticket[] = (data ?? []).map((o:any) => ({ id: o.id, token: o.token, items: '', status: o.order_status }))
      setTickets(mapped)
    }
    load()
    const channel = supabase.channel('kitchen-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      const row:any = payload.new || payload.old
      if (payload.eventType === 'INSERT') {
        setTickets(prev => [{ id: row.id, token: row.token, items: '', status: row.order_status }, ...prev])
      } else if (payload.eventType === 'UPDATE') {
        setTickets(prev => prev.map(t => t.id === row.id ? { ...t, token: row.token, status: row.order_status } : t))
      } else if (payload.eventType === 'DELETE') {
        setTickets(prev => prev.filter(t => t.id !== row.id))
      }
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="container-app py-10">
      <h1 className="text-2xl font-semibold mb-4">Now Preparing</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tickets.map(t => (
          <div key={t.id} className="card p-6 text-center">
            <div className="text-5xl font-extrabold tracking-tight">{t.token ?? '—'}</div>
            <div className="mt-2 text-sm text-muted">{t.items}</div>
            <div className="mt-3"><StatusBadge status={t.status} /></div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">Auto-updates via Supabase Realtime. Only shows orders in NEW/ACCEPTED/PREPARING/READY.</p>
    </div>
  )
}


