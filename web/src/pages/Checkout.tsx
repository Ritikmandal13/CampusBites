import { useCart } from '../store/CartContext'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'

export function CheckoutPage() {
  const { items, subtotal, clear, canteenId, qrId, tableNo } = useCart()
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'UPI'|'COD'>('COD')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const placeOrder = async () => {
    if (items.length === 0) {
      setError('Your cart is empty')
      return
    }
    
    setPlacing(true)
    setError(null)
    
    try {
      // Check authentication
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session
      
      if (!session?.user || !session.access_token) {
        setError('Please login to place an order')
        setPlacing(false)
        navigate('/login', { state: { returnTo: '/checkout' } })
        return
      }
      
      const userId = session.user.id
      const userToken = session.access_token // Use the user's JWT token, not anon key
      const orderNumber = `ORD-${Date.now()}`
      
      // Use direct fetch to create order with user's JWT token
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      // Create order
      const orderUrl = `${supabaseUrl}/rest/v1/orders`
      const orderPayload = {
        order_number: orderNumber,
        user_id: userId,
        canteen_id: canteenId || null,
        source_qr_id: qrId || null,
        table_no: tableNo || null, // Include table number from QR code
        total_amount: subtotal,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
        order_status: 'NEW',
        notes: notes.trim() || null,
      }
      
      const orderResponse = await fetch(orderUrl, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${userToken}`, // Use user's JWT token for RLS
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(orderPayload),
      })
      
      if (!orderResponse.ok) {
        const errorData = await orderResponse.text()
        throw new Error(`Failed to create order: ${errorData}`)
      }
      
      const orderData = await orderResponse.json()
      const orderId = orderData[0]?.id
      
      if (!orderId) {
        throw new Error('Order created but no ID returned')
      }
      
      // Create order items
      const itemsPayload = items.map(i => ({
        order_id: orderId,
        menu_item_id: Number(i.id) || null,
        name: i.title,
        qty: i.qty,
        unit_price: i.price,
        subtotal: i.price * i.qty,
      }))
      
      const itemsUrl = `${supabaseUrl}/rest/v1/order_items`
      const itemsResponse = await fetch(itemsUrl, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${userToken}`, // Use user's JWT token for RLS
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(itemsPayload),
      })
      
      if (!itemsResponse.ok) {
        const errorData = await itemsResponse.text()
        throw new Error(`Failed to add items: ${errorData}`)
      }
      
      // Generate token for the order
      await generateTokenForOrder(orderId, canteenId, userToken)
      
      // Clear cart and redirect
      clear()
      navigate(`/order/${orderId}/track`, { replace: true })
    } catch (e: any) {
      console.error('Order placement error:', e)
      setError(e.message ?? 'Failed to place order. Please try again.')
      setPlacing(false)
    }
  }
  
  // Generate token for order using database function
  const generateTokenForOrder = async (orderId: number, canteenId: number | null | undefined, userToken: string) => {
    if (!canteenId) return
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      // Call the database function to generate token
      const functionUrl = `${supabaseUrl}/rest/v1/rpc/generate_order_token`
      const functionResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${userToken}`, // Use user's JWT token
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_canteen_id: canteenId }),
      })
      
      if (functionResponse.ok) {
        const tokenData = await functionResponse.json()
        // Supabase RPC functions return the result directly as a scalar value
        // If it's a text/string return type, it comes back as a string
        let token: string | null = null
        
        // Handle different response formats
        if (typeof tokenData === 'string') {
          token = tokenData
        } else if (Array.isArray(tokenData)) {
          // Shouldn't happen for scalar functions, but handle it
          token = tokenData[0] || null
        } else if (tokenData && typeof tokenData === 'object') {
          // Check for common property names
          token = tokenData.value || tokenData.result || tokenData.data || null
        }
        
        if (token && typeof token === 'string' && token.trim().length > 0) {
          // Calculate estimated ready time based on max prep time
          const maxPrepTime = Math.max(...items.map(i => {
            // We don't have prep_time in cart, so use default 10 minutes per item
            // In a real app, you'd fetch menu items with prep_time
            return 10 * i.qty
          }), 10) // Default 10 minutes
          
          const estimatedReadyAt = new Date()
          estimatedReadyAt.setMinutes(estimatedReadyAt.getMinutes() + maxPrepTime)
          
          // Update order with token and estimated ready time
          const updateUrl = `${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`
          await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${userToken}`, // Use user's JWT token
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              token,
              estimated_ready_at: estimatedReadyAt.toISOString(),
            }),
          })
        }
      }
    } catch (err) {
      console.error('Failed to generate token:', err)
      // Don't fail the order if token generation fails
    }
  }
  
  if (items.length === 0) {
    return (
      <div className="container-app py-16">
        <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🛒</div>
          <div className="text-lg font-medium mb-2">Your cart is empty</div>
          <div className="text-muted mb-6">Add some items to your cart first!</div>
          <Link to="/menu" className="btn-primary">Browse Menu</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-app py-10">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>
      
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Method Selection */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-neutral-50 transition"
                style={{ borderColor: paymentMethod === 'COD' ? '#ea580c' : '#e5e7eb' }}>
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="w-4 h-4 text-orange-600"
                />
                <div className="flex-1">
                  <div className="font-medium">Cash on Delivery (COD)</div>
                  <div className="text-sm text-muted">Pay when you receive your order</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-neutral-50 transition"
                style={{ borderColor: paymentMethod === 'UPI' ? '#ea580c' : '#e5e7eb' }}>
                <input
                  type="radio"
                  name="payment"
                  value="UPI"
                  checked={paymentMethod === 'UPI'}
                  onChange={() => setPaymentMethod('UPI')}
                  className="w-4 h-4 text-orange-600"
                />
                <div className="flex-1">
                  <div className="font-medium">UPI Payment</div>
                  <div className="text-sm text-muted">Pay online via UPI (Coming soon)</div>
                </div>
              </label>
            </div>
            
            {paymentMethod === 'UPI' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                UPI payment integration is coming soon. Please use Cash on Delivery for now.
              </div>
            )}
          </div>
          
          {/* Order Notes */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-4">Order Instructions</h2>
            <textarea 
              className="w-full rounded-xl border border-neutral-300 p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
              rows={4} 
              placeholder="Any special instructions or requests? (Optional)"
              value={notes} 
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          
          {/* Place Order Button */}
          <button 
            className="btn-primary w-full h-14 text-lg font-semibold"
            disabled={placing || paymentMethod === 'UPI'}
            onClick={placeOrder}
          >
            {placing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                Placing Order...
              </span>
            ) : (
              `Place Order - ₹${subtotal.toFixed(0)}`
            )}
          </button>
        </div>
        
        {/* Order Summary Sidebar */}
        <aside>
          <div className="card p-6 sticky top-4">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
              {items.map(i => (
                <div key={i.id} className="flex items-start gap-3">
                  {i.imageUrl && (
                    <img 
                      src={i.imageUrl} 
                      alt={i.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{i.title}</div>
                    <div className="text-xs text-muted">Qty: {i.qty} × ₹{i.price.toFixed(0)}</div>
                  </div>
                  <div className="font-medium">₹{(i.qty * i.price).toFixed(0)}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-neutral-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span>₹{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Tax</span>
                <span>₹0</span>
              </div>
              <div className="border-t border-neutral-200 pt-2 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{subtotal.toFixed(0)}</span>
              </div>
            </div>
            <Link 
              to="/cart" 
              className="btn-ghost w-full mt-4 text-center"
            >
              ← Back to Cart
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}


