import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AdminGate } from '../ui/components/AdminGate'

type Payment = {
  id: number
  order_id: number
  gateway: string | null
  gateway_payment_id: string | null
  amount: number | null
  status: string | null
  created_at: string | null
  order?: {
    order_number: string | null
    total_amount: number
    user_id: string
  }
}

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('payments')
        .select(`
          *,
          orders (
            order_number,
            total_amount,
            user_id
          )
        `)
        .order('created_at', { ascending: false })
      setPayments((data ?? []) as Payment[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = payments.filter(p => {
    if (!filter) return true
    const f = filter.toLowerCase()
    return (
      p.gateway?.toLowerCase().includes(f) ||
      p.gateway_payment_id?.toLowerCase().includes(f) ||
      p.status?.toLowerCase().includes(f) ||
      String(p.order_id).includes(f)
    )
  })

  const getStatusColor = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'FAILED': return 'bg-red-100 text-red-800 border-red-200'
      case 'REFUNDED': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200'
    }
  }

  return (
    <AdminGate>
      <div className="container-app py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Payments</h1>
          <p className="text-muted text-sm">View and manage all payment transactions</p>
        </div>
        <div className="card overflow-hidden">
          <div className="p-4 flex items-center gap-3">
            <input
              className="w-full md:w-80 rounded-xl border border-neutral-300 p-2"
              placeholder="Search by gateway, payment ID, or status"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            <select
              className="rounded-xl border border-neutral-300 p-2"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left p-4 font-medium">Payment ID</th>
                  <th className="text-left p-4 font-medium">Order</th>
                  <th className="text-left p-4 font-medium">Gateway</th>
                  <th className="text-left p-4 font-medium">Amount</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="p-4 text-sm text-muted" colSpan={6}>
                      Loading payments...
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td className="p-4 text-sm text-muted" colSpan={6}>
                      No payments found
                    </td>
                  </tr>
                )}
                {filtered.map(p => (
                  <tr key={p.id} className="border-t border-neutral-100 hover:bg-neutral-50 transition">
                    <td className="p-4 font-mono text-xs">
                      {p.gateway_payment_id || `#${p.id}`}
                    </td>
                    <td className="p-4">
                      {p.order?.order_number || `Order #${p.order_id}`}
                    </td>
                    <td className="p-4">
                      {p.gateway || <span className="text-muted">—</span>}
                    </td>
                    <td className="p-4 font-medium">
                      ₹{p.amount?.toFixed(2) || p.order?.total_amount.toFixed(2) || '0.00'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(p.status)}`}
                      >
                        {p.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="p-4 text-muted text-xs">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length > 0 && (
            <div className="p-4 border-t border-neutral-200 bg-neutral-50">
              <div className="text-sm text-muted">
                Showing {filtered.length} of {payments.length} payments
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminGate>
  )
}



