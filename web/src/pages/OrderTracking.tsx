import { StatusBadge } from '../ui/components/StatusBadge'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useParams, Link } from 'react-router-dom'

export function OrderTrackingPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<any>(null)
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!id) return
    
    let userToken: string | null = null
    
    const loadOrder = async () => {
      try {
        // Get user session for authentication
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData?.session
        
        if (!session?.access_token) {
          console.error('No session found')
          setLoading(false)
          return
        }
        
        userToken = session.access_token
        
        // Use direct fetch for reliability
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        
        // Load order with user's JWT token for RLS
        const orderUrl = `${supabaseUrl}/rest/v1/orders?id=eq.${id}&select=*`
        const orderResponse = await fetch(orderUrl, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${userToken}`, // Use user's JWT token for RLS
            'Content-Type': 'application/json',
          },
        })
        
        if (orderResponse.ok) {
          const orderData = await orderResponse.json()
          if (orderData && orderData.length > 0) {
            setOrder(orderData[0])
          }
        } else {
          console.error('Failed to load order:', orderResponse.status, await orderResponse.text())
        }
        
        // Load order items with user's JWT token for RLS
        const itemsUrl = `${supabaseUrl}/rest/v1/order_items?order_id=eq.${id}&select=*`
        const itemsResponse = await fetch(itemsUrl, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${userToken}`, // Use user's JWT token for RLS
            'Content-Type': 'application/json',
          },
        })
        
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json()
          setOrderItems(itemsData || [])
        } else {
          console.error('Failed to load order items:', itemsResponse.status)
        }
      } catch (err) {
        console.error('Failed to load order:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadOrder()
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders', 
          filter: `id=eq.${id}` 
        }, 
        (payload) => {
          console.log('Order status updated via realtime:', payload.new)
          setOrder(payload.new as any)
          // Also reload order items in case they changed
          if (userToken) {
            const itemsUrl = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/order_items?order_id=eq.${id}&select=*`
            fetch(itemsUrl, {
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json',
              },
            })
              .then(res => res.json())
              .then(data => setOrderItems(data || []))
              .catch(err => console.error('Failed to reload order items:', err))
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
      })
    
    return () => { 
      supabase.removeChannel(channel) 
    }
  }, [id])
  
  if (loading) {
    return (
      <div className="container-app py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <div className="text-sm text-muted">Loading order details…</div>
        </div>
      </div>
    )
  }
  
  if (!order) {
    return (
      <div className="container-app py-10">
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">📦</div>
          <div className="text-lg font-medium mb-2">Order not found</div>
          <div className="text-muted mb-6">The order you're looking for doesn't exist.</div>
          <Link to="/" className="btn-primary">Go to Home</Link>
        </div>
      </div>
    )
  }
  
  const statusSteps = ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED']
  const progressIdx = statusSteps.indexOf(order.order_status) >= 0 
    ? statusSteps.indexOf(order.order_status) 
    : -1
  
  return (
    <div className="container-app py-10">
      <div className="mb-6">
        <Link to="/student/dashboard" className="text-sm text-muted hover:text-neutral-900 mb-4 inline-block">
          ← Back to Orders
        </Link>
        <h1 className="text-2xl font-semibold">Order #{order.order_number ?? order.id}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm text-muted mb-2">Token Number</div>
                <div className="text-5xl font-extrabold text-orange-600">
                  {order.token || 'Pending...'}
                </div>
              </div>
              <StatusBadge status={order.order_status} />
            </div>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2 text-xs text-muted">
                <span>Order Progress</span>
                <span>{Math.max(0, progressIdx + 1)} of {statusSteps.length}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {statusSteps.map((step, i) => (
                  <div key={step} className="text-center">
                    <div className={`h-2 rounded mb-2 ${i <= progressIdx ? 'bg-orange-600' : 'bg-neutral-200'}`} />
                    <div className={`text-xs ${i <= progressIdx ? 'font-medium text-neutral-900' : 'text-muted'}`}>
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Estimated Time */}
            {order.estimated_ready_at && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-sm font-medium text-orange-900 mb-1">Estimated Ready Time</div>
                <div className="text-lg font-semibold text-orange-700">
                  {new Date(order.estimated_ready_at).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Order Items */}
          {orderItems.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold text-lg mb-4">Order Items</h2>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between pb-4 border-b border-neutral-100 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted">Qty: {item.qty} × ₹{Number(item.unit_price).toFixed(0)}</div>
                    </div>
                    <div className="font-semibold">₹{Number(item.subtotal).toFixed(0)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Order Notes */}
          {order.notes && (
            <div className="card p-6">
              <h2 className="font-semibold text-lg mb-2">Special Instructions</h2>
              <p className="text-muted">{order.notes}</p>
            </div>
          )}
        </div>
        
        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-4">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Order Number</span>
                <span className="font-medium">#{order.order_number ?? order.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Payment Method</span>
                <span className="font-medium">{order.payment_method || 'COD'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Payment Status</span>
                <span className={`font-medium ${
                  order.payment_status === 'SUCCESS' ? 'text-green-600' :
                  order.payment_status === 'PENDING' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {order.payment_status || 'PENDING'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Order Date</span>
                <span className="font-medium">
                  {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>
            <div className="border-t border-neutral-200 pt-4">
              <div className="flex justify-between font-semibold text-lg mb-4">
                <span>Total</span>
                <span>₹{Number(order.total_amount).toFixed(0)}</span>
              </div>
              <Link to="/menu" className="btn-primary w-full block text-center">
                Order Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


