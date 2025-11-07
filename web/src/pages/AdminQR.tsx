import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AdminGate } from '../ui/components/AdminGate'

type QR = { id: number; qr_id: string; canteen_id: number | null; table_no: string | null; created_at: string | null }

function genId() {
  // short, non-guessable id
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
}

export function AdminQRPage() {
  const [rows, setRows] = useState<QR[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<{ canteen_id?: string; table_no?: string; qr_id?: string }>({})

  const baseUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const origin = window.location.origin
    return origin
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('qr_codes').select('*').order('created_at', { ascending: false })
      setRows((data ?? []) as QR[])
      setLoading(false)
    }
    load()
  }, [])

  const createQR = async () => {
    const qr_id = form.qr_id && form.qr_id.trim() !== '' ? form.qr_id : genId()
    const payload = {
      qr_id,
      canteen_id: form.canteen_id ? Number(form.canteen_id) : null,
      table_no: form.table_no ?? null,
    }
    const { error } = await supabase.from('qr_codes').insert(payload)
    if (error) { alert(error.message); return }
    const { data } = await supabase.from('qr_codes').select('*').order('created_at', { ascending: false })
    setRows((data ?? []) as QR[])
    setForm({})
  }

  return (
    <AdminGate>
      <div className="container-app py-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h1 className="text-2xl font-semibold mb-4">QR Codes</h1>
          {loading && <div className="text-sm text-muted">Loading…</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.map(r => {
              const url = `${baseUrl}/order/${r.qr_id}`
              const img = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}`
              return (
                <div key={r.id} className="border border-neutral-200 rounded-xl overflow-hidden p-3">
                  <img src={img} alt={r.qr_id} className="w-full h-40 object-contain bg-white" />
                  <div className="mt-2 text-sm break-all">{url}</div>
                  <div className="text-xs text-muted">Canteen: {r.canteen_id ?? '—'} · Table: {r.table_no ?? '—'}</div>
                </div>
              )
            })}
          </div>
        </div>
        <aside className="card p-6">
          <h2 className="font-medium mb-3">Create QR</h2>
          <div className="space-y-3">
            <input className="w-full rounded-xl border border-neutral-300 p-2" placeholder="Canteen ID (optional)" value={form.canteen_id ?? ''} onChange={e=>setForm(f=>({...f, canteen_id: e.target.value}))} />
            <input className="w-full rounded-xl border border-neutral-300 p-2" placeholder="Table No (optional)" value={form.table_no ?? ''} onChange={e=>setForm(f=>({...f, table_no: e.target.value}))} />
            <input className="w-full rounded-xl border border-neutral-300 p-2" placeholder="Custom QR ID (optional)" value={form.qr_id ?? ''} onChange={e=>setForm(f=>({...f, qr_id: e.target.value}))} />
            <button className="btn-primary h-11 w-full" onClick={createQR}>Create QR</button>
          </div>
        </aside>
      </div>
    </AdminGate>
  )
}


