import { useCart } from '../store/CartContext'
import { Link, useNavigate } from 'react-router-dom'
import { QuantitySelector } from '../ui/components/QuantitySelector'

export function CartPage() {
  const { items, setQty, remove, subtotal, clear } = useCart()
  const navigate = useNavigate()
  
  if (items.length === 0) {
    return (
      <div className="container-app py-16">
        <h1 className="text-2xl font-semibold mb-4">Your Cart</h1>
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🛒</div>
          <div className="text-lg font-medium mb-2">Your cart is empty</div>
          <div className="text-muted mb-6">Add some delicious items to get started!</div>
          <Link to="/menu" className="btn-primary">Browse Menu</Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container-app py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Your Cart</h1>
        <button onClick={clear} className="text-sm text-red-600 hover:text-red-700">
          Clear Cart
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card divide-y divide-neutral-100">
            {items.map(item => (
              <div key={item.id} className="p-6 flex items-start gap-4">
                {item.imageUrl && (
                  <img 
                    src={item.imageUrl} 
                    alt={item.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <div className="font-medium text-lg mb-1">{item.title}</div>
                  <div className="text-muted mb-4">₹{item.price.toFixed(0)} each</div>
                  <div className="flex items-center justify-between">
                    <QuantitySelector value={item.qty} onChange={(q) => setQty(item.id, q)} />
                    <button 
                      onClick={() => remove(item.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg">₹{(item.qty * item.price).toFixed(0)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-4">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted">{item.title} × {item.qty}</span>
                  <span>₹{(item.qty * item.price).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-neutral-200 pt-4 mb-4">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{subtotal.toFixed(0)}</span>
              </div>
            </div>
            <button 
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full h-12"
            >
              Proceed to Checkout
            </button>
            <Link to="/menu" className="btn-ghost w-full h-11 mt-3 block text-center">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CheckoutPage() {
  return (
    <div className="container-app py-16">
      <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
      <div className="card p-6">Checkout flow coming soon</div>
    </div>
  )
}


