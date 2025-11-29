import { Link, NavLink } from 'react-router-dom'
import { ShoppingCart, LogOut } from 'lucide-react'
import { useCart } from '../../store/CartContext'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export function Navbar() {
  const { count: cartCount } = useCart()
  const [email, setEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  
  useEffect(() => {
    const updateAuth = async () => {
      try {
        // Use getSession instead of getUser for faster check
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData?.session
        setEmail(session?.user?.email ?? null)
        
        if (session?.user) {
          // Use direct fetch with timeout to avoid hanging
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
          
          if (supabaseUrl && supabaseKey) {
            try {
              const profileUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${session.user.id}&select=role`
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout
              
              const profileResponse = await fetch(profileUrl, {
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                },
                signal: controller.signal,
              })
              
              clearTimeout(timeoutId)
              
              if (profileResponse.ok) {
                const profileData = await profileResponse.json()
                const profile = Array.isArray(profileData) && profileData.length > 0 ? profileData[0] : null
                setIsAdmin(profile?.role === 'admin' || false)
              } else {
                setIsAdmin(false)
              }
            } catch {
              // If profile check fails, just set to false - don't block
              setIsAdmin(false)
            }
          } else {
            setIsAdmin(false)
          }
      } else {
          setIsAdmin(false)
        }
      } catch (err) {
        // If anything fails, just show as non-admin - don't block
        console.log('Navbar: Auth check failed (non-blocking)')
        setIsAdmin(false)
      }
    }
    
    updateAuth()
    
    // Listen for auth changes
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setEmail(session?.user?.email ?? null)
      // Don't check profile on auth change to avoid blocking
        setIsAdmin(false)
    })
    
    return () => { sub.subscription.unsubscribe() }
  }, [])
  return (
    <div className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container-app h-16 md:h-18 flex items-center justify-between">
        <Link to="/" aria-label="CampusBites" className="shrink-0 flex items-center">
          {/* If you add web/public/logo.png, it will render below */}
          <img src="/logo.png" alt="Campus Bites" className="h-9 md:h-11 w-auto object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <NavLink to="/" className={({ isActive }) => isActive ? 'text-neutral-900' : 'text-muted hover:text-neutral-900'}>Home</NavLink>
          <NavLink to="/menu" className={({ isActive }) => isActive ? 'text-neutral-900' : 'text-muted hover:text-neutral-900'}>Menu</NavLink>
          {isAdmin ? (
            <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'text-neutral-900' : 'text-muted hover:text-neutral-900'}>Admin Dashboard</NavLink>
          ) : (
            <NavLink to="/student/dashboard" className={({ isActive }) => isActive ? 'text-neutral-900' : 'text-muted hover:text-neutral-900'}>My Orders</NavLink>
          )}
          <NavLink to="/about" className={({ isActive }) => isActive ? 'text-neutral-900' : 'text-muted hover:text-neutral-900'}>About</NavLink>
          <NavLink to="/contact" className={({ isActive }) => isActive ? 'text-neutral-900' : 'text-muted hover:text-neutral-900'}>Contact</NavLink>
        </nav>
        <div className="flex items-center gap-2 md:gap-3">
          <Link to="/cart" aria-label="Cart" className="relative btn-ghost h-10 px-3">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-orange-600 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          {email ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-sm text-muted">{email}</span>
              <button className="btn-ghost h-10 px-3" onClick={()=>supabase.auth.signOut()}>
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary h-10">Login</Link>
          )}
        </div>
      </div>
    </div>
  )
}


