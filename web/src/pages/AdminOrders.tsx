import { StatusBadge } from '../ui/components/StatusBadge'
import { supabase } from '../lib/supabaseClient'
import { AdminGate } from '../ui/components/AdminGate'
import { useEffect, useState } from 'react'
import { useMyProfile, useOrdersAdmin } from '../lib/hooks'

type Row = {
  id: number
  order_number: string
  user: string
  total: number
  status: 'NEW'|'ACCEPTED'|'PREPARING'|'READY'|'COMPLETED'|'CANCELLED'
}


async function generateTokenForOrder(orderId: number, canteenId: number | null | undefined, userToken: string) {
  if (!canteenId) {
    console.warn('Cannot generate token: canteenId is missing')
    return null
  }
  
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    // Call the database function to generate token
    const functionUrl = `${supabaseUrl}/rest/v1/rpc/generate_order_token`
    const functionResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_canteen_id: canteenId }),
    })
    
    if (functionResponse.ok) {
      const tokenData = await functionResponse.json()
      let token: string | null = null
      
      // Handle different response formats
      if (typeof tokenData === 'string') {
        token = tokenData
      } else if (Array.isArray(tokenData) && tokenData.length > 0) {
        token = tokenData[0] || null
      } else if (tokenData && typeof tokenData === 'object') {
        token = tokenData.value || tokenData.result || tokenData.data || null
      }
      
      if (token && typeof token === 'string' && token.trim().length > 0) {
        // Update order with token
        const updateUrl = `${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`
        const updateResponse = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })
        
        if (updateResponse.ok) {
          console.log('Token generated successfully:', token)
          return token
        } else {
          console.error('Failed to update order with token:', await updateResponse.text())
        }
      }
    } else {
      const errorText = await functionResponse.text()
      console.error('Failed to generate token:', functionResponse.status, errorText)
    }
  } catch (err) {
    console.error('Error generating token:', err)
  }
  
  return null
}

async function updateStatus(id: number, status: Row['status'], currentOrder?: any) {
  try {
    // Get admin session for authentication
    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData?.session
    
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }
    
    const userToken = session.access_token
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    // Prepare update payload
    const updatePayload: any = { order_status: status }
    
    // If completing a COD order, automatically mark payment as SUCCESS
    if (status === 'COMPLETED' && currentOrder?.payment_method === 'COD' && currentOrder?.payment_status === 'PENDING') {
      updatePayload.payment_status = 'SUCCESS'
    }
    
    // If accepting or completing an order and it doesn't have a token, try to generate one
    if ((status === 'ACCEPTED' || status === 'COMPLETED') && !currentOrder?.token) {
      // Use order's canteen_id if available, otherwise use admin's canteen_id as fallback
      const canteenIdToUse = currentOrder?.canteen_id || adminCanteenId
      if (canteenIdToUse) {
        const token = await generateTokenForOrder(id, canteenIdToUse, userToken)
        if (token) {
          updatePayload.token = token
          // Also update canteen_id if it was missing
          if (!currentOrder?.canteen_id && adminCanteenId) {
            updatePayload.canteen_id = adminCanteenId
          }
          console.log(`Generated token ${token} for order ${id} using canteen_id: ${canteenIdToUse}`)
        } else {
          console.warn(`Failed to generate token for order ${id} - canteen_id: ${canteenIdToUse}`)
        }
      } else {
        console.warn(`Cannot generate token for order ${id} - missing canteen_id (order: ${currentOrder?.canteen_id}, admin: ${adminCanteenId})`)
      }
    }
    
    // Update order status using direct fetch with admin's JWT token
    const updateUrl = `${supabaseUrl}/rest/v1/orders?id=eq.${id}`
    const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${userToken}`, // Use admin's JWT token for RLS
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(updatePayload),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to update order status:', response.status, errorText)
      throw new Error(`Failed to update order: ${errorText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error
  }
}

export function AdminOrdersPage() {
  const { data: me } = useMyProfile()
  const adminCanteenId = me?.canteen_id ?? undefined
  const { data, refetch, isLoading } = useOrdersAdmin(adminCanteenId)
  const [toast, setToast] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [paymentFilter, setPaymentFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  useEffect(() => {
    const ch = supabase
      .channel('admin-orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' }, 
        (payload) => {
          console.log('Order changed via realtime:', payload.eventType, payload.new)
          refetch()
        }
      )
      .subscribe((status) => {
        console.log('Admin orders realtime subscription status:', status)
      })
    return () => { supabase.removeChannel(ch) }
  }, [refetch])

  const getPaymentStatusColor = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'FAILED': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200'
    }
  }

  const filtered = (data ?? []).filter(order => {
    if (statusFilter && order.order_status !== statusFilter) return false
    if (paymentFilter && order.payment_status !== paymentFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        String(order.id).includes(query) ||
        order.order_number?.toLowerCase().includes(query) ||
        order.user_id?.toLowerCase().includes(query) ||
        order.token?.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <AdminGate>
    <div className="container-app py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">Order Management</h1>
        <p className="text-muted">Manage orders, update status, and track payments.</p>
      </div>
      
      {toast && (
        <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 text-sm font-medium animate-in fade-in" onAnimationEnd={()=>setToast('')}>
          {toast}
        </div>
      )}
      
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-6 bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-muted">🔍</span>
              </div>
              <input
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                placeholder="Search order, token, or user..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Order Status</option>
              <option value="NEW">NEW</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="PREPARING">PREPARING</option>
              <option value="READY">READY</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <select
              className="px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white"
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
            >
              <option value="">All Payment Status</option>
              <option value="PENDING">PENDING</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Order</th>
                <th className="text-left p-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Token</th>
                <th className="text-left p-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Customer</th>
                <th className="text-left p-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Total</th>
                <th className="text-left p-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Payment</th>
                <th className="text-left p-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Date</th>
                <th className="text-left p-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading && (
                <tr>
                  <td className="p-8 text-center text-muted" colSpan={8}>
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-2"></div>
                      Loading orders...
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td className="p-12 text-center" colSpan={8}>
                    <div className="text-5xl mb-4">📦</div>
                    <div className="text-lg font-medium text-neutral-900 mb-2">No orders found</div>
                    <div className="text-sm text-muted">Try adjusting your filters or search term</div>
                  </td>
                </tr>
              )}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-neutral-900">#{r.order_number ?? r.id}</div>
                    {r.table_no && (
                      <div className="text-xs font-medium text-orange-600 mt-1">Table: {r.table_no}</div>
                    )}
                    {r.source_qr_id && (
                      <div className="text-xs text-muted mt-1">QR: {r.source_qr_id}</div>
                    )}
                  </td>
                  <td className="p-4">
                    {r.token ? (
                      <span className="inline-flex items-center px-3 py-1.5 bg-orange-100 text-orange-700 font-bold text-sm rounded-lg font-mono">
                        {r.token}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-neutral-900">{r.user_id?.slice(0,8)}...</div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-lg text-neutral-900">₹{Number(r.total_amount).toFixed(0)}</div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getPaymentStatusColor(r.payment_status ?? null)}`}>
                        {r.payment_status || 'PENDING'}
                      </span>
                      <div className="text-xs text-muted">{r.payment_method || 'COD'}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={r.order_status || 'NEW'} />
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-neutral-900">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                    </div>
                    <div className="text-xs text-muted">
                      {r.created_at ? new Date(r.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {r.order_status === 'NEW' && (
                        <button 
                          className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors" 
                          onClick={async()=>{ 
                            try {
                              await updateStatus(r.id,'ACCEPTED', r, adminCanteenId); 
                              setToast('Order accepted'); 
                              refetch(); 
                            } catch (e: any) {
                              setToast(`Error: ${e.message || 'Failed to update order'}`);
                            }
                          }}
                        >
                          Accept
                        </button>
                      )}
                      {r.order_status && ['NEW', 'ACCEPTED'].includes(r.order_status) && (
                        <button 
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors" 
                          onClick={async()=>{ 
                            try {
                              await updateStatus(r.id,'PREPARING', r, adminCanteenId); 
                              setToast('Marked preparing'); 
                              refetch(); 
                            } catch (e: any) {
                              setToast(`Error: ${e.message || 'Failed to update order'}`);
                            }
                          }}
                        >
                          Preparing
                        </button>
                      )}
                      {r.order_status && ['ACCEPTED', 'PREPARING'].includes(r.order_status) && (
                        <button 
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors" 
                          onClick={async()=>{ 
                            try {
                              await updateStatus(r.id,'READY', r, adminCanteenId); 
                              setToast('Marked ready'); 
                              refetch(); 
                            } catch (e: any) {
                              setToast(`Error: ${e.message || 'Failed to update order'}`);
                            }
                          }}
                        >
                          Ready
                        </button>
                      )}
                      {r.order_status && ['READY', 'PREPARING'].includes(r.order_status) && (
                        <button 
                          className="px-3 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-200 transition-colors" 
                          onClick={async()=>{ 
                            try {
                              await updateStatus(r.id,'COMPLETED', r, adminCanteenId); 
                              setToast('Order completed and payment marked as successful'); 
                              refetch(); 
                            } catch (e: any) {
                              setToast(`Error: ${e.message || 'Failed to update order'}`);
                            }
                          }}
                        >
                          Complete
                        </button>
                      )}
                      {r.order_status && !['COMPLETED', 'CANCELLED'].includes(r.order_status) && (
                        <button 
                          className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors" 
                          onClick={async()=>{ 
                            if(confirm('Cancel this order?')) {
                              try {
                                await updateStatus(r.id,'CANCELLED', r, adminCanteenId); 
                                setToast('Order cancelled'); 
                                refetch(); 
                              } catch (e: any) {
                                setToast(`Error: ${e.message || 'Failed to update order'}`);
                              }
                            }
                          }}
                        >
                          Cancel
                        </button>
                      )}
                      {/* Generate token button for orders without tokens */}
                      {!r.token && r.order_status && ['COMPLETED', 'ACCEPTED', 'PREPARING', 'READY'].includes(r.order_status) && (
                        <button 
                          className="px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-semibold rounded-lg hover:bg-orange-100 transition-colors" 
                          onClick={async()=>{ 
                            try {
                              const { data: sessionData } = await supabase.auth.getSession()
                              const session = sessionData?.session
                              if (!session?.access_token) {
                                setToast('Not authenticated')
                                return
                              }
                              const canteenIdToUse = r.canteen_id || adminCanteenId
                              if (!canteenIdToUse) {
                                setToast('Cannot generate token: missing canteen_id')
                                return
                              }
                              const token = await generateTokenForOrder(r.id, canteenIdToUse, session.access_token)
                              if (token) {
                                setToast(`Token generated: ${token}`)
                                refetch()
                              } else {
                                setToast('Failed to generate token')
                              }
                            } catch (e: any) {
                              setToast(`Error: ${e.message || 'Failed to generate token'}`)
                            }
                          }}
                        >
                          Generate Token
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length > 0 && (
          <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
            <div className="text-sm font-medium text-neutral-700">
              Showing <span className="font-bold text-neutral-900">{filtered.length}</span> of <span className="font-bold text-neutral-900">{data?.length || 0}</span> orders
            </div>
          </div>
        )}
      </div>
    </div>
    </AdminGate>
  )
}


