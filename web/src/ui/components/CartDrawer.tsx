import { useCart } from '../../store/CartContext'
import { QuantitySelector } from './QuantitySelector'
import { useNavigate } from 'react-router-dom'

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, setQty, remove, subtotal } = useCart()
  const navigate = useNavigate()
  
  const handleCheckout = () => {
    if (items.length === 0) return
    onClose()
    navigate('/checkout')
  }
  
  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none opacity-0'} transition-opacity duration-300`}> 
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white text-neutral-900 border-l border-neutral-200 shadow-xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Your Cart</h3>
              <button 
                onClick={onClose}
                className="text-muted hover:text-neutral-900"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted mb-2">Your cart is empty</div>
                <button onClick={onClose} className="btn-primary mt-4">Browse Menu</button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-start gap-4 border-b border-neutral-100 pb-4">
                    {item.imageUrl && (
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-sm text-muted mb-2">₹{item.price.toFixed(0)} each</div>
                      <div className="flex items-center justify-between">
                        <QuantitySelector value={item.qty} onChange={(q) => setQty(item.id, q)} />
                        <button 
                          onClick={() => remove(item.id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{(item.qty * item.price).toFixed(0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {items.length > 0 && (
            <div className="p-6 border-t border-neutral-200 bg-neutral-50">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted">Subtotal</div>
                <div className="text-xl font-bold">₹{subtotal.toFixed(0)}</div>
              </div>
              <button 
                onClick={handleCheckout}
                className="btn-primary w-full h-12"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


