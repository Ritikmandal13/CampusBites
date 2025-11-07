import { Link, useNavigate } from 'react-router-dom'
import { MenuCard } from '../ui/components/MenuCard'
import { FeatureGrid } from '../ui/components/FeatureGrid'
import { useMenu, useMyProfile } from '../lib/hooks'
import { supabase } from '../lib/supabaseClient'
import { useMemo, useEffect } from 'react'
import { useCart } from '../store/CartContext'

export function HomePage() {
  const navigate = useNavigate()
  const { add } = useCart()

  // Make profile check completely non-blocking - don't wait for it at all
  const profileQuery = useMyProfile()
  const profile = profileQuery?.data || null

  // Automatically redirect admins to admin dashboard (non-blocking)
  useEffect(() => {
    // Only redirect if we have a profile and user is admin
    // Don't wait for isLoading - just check if profile exists
    if (profile?.role === 'admin') {
      console.log('🔄 Redirecting admin to dashboard...')
      navigate('/admin/dashboard', { replace: true })
    }
  }, [profile, navigate])

  // Render page immediately - NEVER wait for profile
  // Fetch available menu items (only available ones for students)
  const { data: menuItems, isLoading: menuLoading } = useMenu()

  // Get first 6 items to display on homepage
  const popularItems = useMemo(() => {
    if (!menuItems) return []
    return menuItems.slice(0, 6).map(item => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price
      return {
        id: String(item.id),
        title: item.name,
        price: price,
        priceDisplay: `₹${price.toFixed(0)}`,
        category: item.category || 'All Items',
        imageUrl: item.image_path
          ? supabase.storage.from('menu-images').getPublicUrl(item.image_path).data.publicUrl
          : undefined,
      }
    })
  }, [menuItems])

  return (
    <>
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[600px] max-h-[800px] flex items-center overflow-hidden">
        {/* Background Image - Cropped to show area with people */}
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="/hero.webp" 
            alt="Campus canteen" 
            className="hero-image-crop absolute inset-0"
            style={{
              width: '100%',
              height: '100%',
            }}
            onError={(e) => {
              // Fallback if image doesn't load
              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541542684-4a9c4a4a9efd?q=80&w=1974&auto=format&fit=crop'
            }} 
          />
          {/* Strong dark gradient overlay from left - matching inspiration */}
          <div 
            className="absolute inset-0" 
            style={{
              background: 'linear-gradient(to right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.7) 20%, rgba(0, 0, 0, 0.5) 40%, rgba(0, 0, 0, 0.3) 60%, transparent 100%)'
            }} 
          />
          {/* Subtle vertical gradient for overall depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
        </div>
        
        {/* Content - Aligned to left like inspiration */}
        <div className="relative z-10 w-full py-20 md:py-32">
          <div className="container-app">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight text-white mb-6" style={{
                textShadow: '0 4px 16px rgba(0, 0, 0, 0.9), 0 2px 8px rgba(0, 0, 0, 0.7), 0 1px 4px rgba(0, 0, 0, 0.5)'
              }}>
                Campus Dining Made{' '}
                <span className="text-orange-500" style={{
                  textShadow: '0 4px 16px rgba(0, 0, 0, 0.9), 0 2px 8px rgba(0, 0, 0, 0.7), 0 1px 4px rgba(0, 0, 0, 0.5)'
                }}>Simple</span>
              </h1>
              <p className="text-lg md:text-xl text-white mb-8 max-w-xl leading-relaxed font-medium" style={{
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.8), 0 1px 4px rgba(0, 0, 0, 0.6)'
              }}>
                Scan, order, and enjoy fresh meals without the wait. Your favorite campus food is just a QR code away.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/menu" 
                  className="btn-primary h-12 px-8 text-base font-semibold shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 transition-all inline-flex items-center justify-center"
                >
                  🍽️ View Menu
                </Link>
                <Link 
                  to="/login" 
                  className="btn-ghost h-12 px-8 text-base font-semibold bg-white/95 hover:bg-white shadow-lg border-white/20 inline-flex items-center justify-center"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <FeatureGrid />

      {/* Popular Items */}
      {popularItems.length > 0 && (
        <section className="container-app py-10">
          <h2 className="text-3xl font-bold text-center mb-2">Popular Items</h2>
          <p className="text-center text-muted mb-8">Our most loved dishes, freshly prepared daily</p>
          {menuLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse card overflow-hidden">
                  <div className="aspect-[16/9] bg-neutral-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-neutral-200 rounded w-2/3" />
                    <div className="h-3 bg-neutral-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {popularItems.map(item => (
                      <MenuCard
                        key={item.id}
                        title={item.title}
                        price={item.priceDisplay}
                        category={item.category}
                        imageUrl={item.imageUrl}
                        onAdd={() => {
                          add({
                            id: item.id,
                            title: item.title,
                            price: item.price,
                            imageUrl: item.imageUrl,
                          })
                        }}
                      />
                    ))}
                  </div>
              <div className="text-center mt-8">
                <Link to="/menu" className="btn-ghost h-11 px-6">View Full Menu</Link>
              </div>
            </>
          )}
        </section>
      )}

      {/* compact spacing before footer */}
      <div className="h-0" />
    </>
  )
}


