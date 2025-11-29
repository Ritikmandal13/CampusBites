import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight, Shield, CheckCircle, X } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    
    // Check user role immediately after login to redirect appropriately
    if (authData.user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single()
        
        // Redirect based on role
        if (profile?.role === 'admin') {
          navigate('/admin/dashboard', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      } catch (profileError) {
        // If profile check fails, just go to home
        console.error('Error fetching profile:', profileError)
        navigate('/', { replace: true })
      }
    } else {
      navigate('/', { replace: true })
    }
    
    setLoading(false)
  }
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100/30">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-100/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
              <img 
                src="/logo.png" 
                alt="CampusBites" 
                className="h-16 w-auto object-contain relative z-10 drop-shadow-lg" 
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} 
              />
            </div>
          </div>
          <p className="text-neutral-600 text-lg font-medium">Welcome back!</p>
          <p className="text-neutral-500 text-sm mt-1">Sign in to continue your delicious journey</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 space-y-6 animate-slide-up">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-1">Sign In</h2>
            <div className="w-12 h-1 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full mx-auto"></div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50/80 border border-red-200/50 text-red-700 px-4 py-3 text-sm flex items-center gap-2 animate-shake">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  className="w-full rounded-xl border-2 border-neutral-200 bg-white/50 pl-12 pr-4 py-3.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-200"
                  placeholder="Email address"
                  type="email"
                  value={email}
                  onChange={e=>setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  className="w-full rounded-xl border-2 border-neutral-200 bg-white/50 pl-12 pr-4 py-3.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-200"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              className="w-full h-12 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:from-orange-500 hover:to-orange-400 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-neutral-200/50">
            <p className="text-center text-sm text-neutral-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-orange-600 hover:text-orange-500 transition-colors inline-flex items-center gap-1 group"
              >
                Create one
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-neutral-400 mt-6">
          Secure authentication powered by Supabase
        </p>
      </div>
    </div>
  )
}

export function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const navigate = useNavigate()
  const passwordRef = useRef<HTMLInputElement>(null)
  
  // Clear password field if browser autofills it unexpectedly
  const handlePasswordFocus = () => {
    // Check after a short delay (browser autofill happens after focus)
    setTimeout(() => {
      if (passwordRef.current) {
        const input = passwordRef.current
        // If React state says empty but input has value (autofilled), clear it
        if (password === '' && input.value && input.value.length > 0) {
          input.value = ''
          setPassword('')
          // Trigger React change event
          const event = new Event('input', { bubbles: true })
          input.dispatchEvent(event)
        }
      }
    }, 150)
  }
  
  // Check on mount and when password changes
  useEffect(() => {
    const checkAutofill = () => {
      if (passwordRef.current && password === '') {
        const input = passwordRef.current
        // If DOM has value but React state doesn't, clear it
        if (input.value && input.value.length > 0) {
          input.value = ''
          setPassword('')
        }
      }
    }
    
    // Check immediately and after a delay (autofill can be delayed)
    checkAutofill()
    const timer = setTimeout(checkAutofill, 300)
    return () => clearTimeout(timer)
  }, [])
  
  // Admin signup code - Set VITE_ADMIN_SIGNUP_CODE in .env.local for production
  const ADMIN_SIGNUP_CODE = import.meta.env.VITE_ADMIN_SIGNUP_CODE || 'ADMIN2024'
  
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    
    // Validate admin code if signing up as admin
    if (isAdmin && adminCode !== ADMIN_SIGNUP_CODE) {
      setError('Invalid admin code. Please enter the correct admin code to sign up as admin.')
      setLoading(false)
      return
    }
    
    const role = isAdmin ? 'admin' : 'student'
    
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    })
    if (error) { setError(error.message); setLoading(false); return }
    const uid = data.user?.id
    if (uid) {
      // Upsert profile with role (trigger will also set it from metadata)
      await supabase.from('profiles').upsert({ 
        id: uid, 
        full_name: fullName, 
        email: email,
        role: role
      })
    }
    // Show success message instead of redirecting immediately
    setUserEmail(email)
    setShowSuccess(true)
    setLoading(false)
    // Reset form
    setFullName('')
    setEmail('')
    setPassword('')
    setIsAdmin(false)
    setAdminCode('')
  }
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100/30 py-12">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-100/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
              <img 
                src="/logo.png" 
                alt="CampusBites" 
                className="h-16 w-auto object-contain relative z-10 drop-shadow-lg" 
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} 
              />
            </div>
          </div>
          <p className="text-neutral-600 text-lg font-medium">Create your account</p>
          <p className="text-neutral-500 text-sm mt-1">Join us and start ordering delicious meals</p>
        </div>

        {/* Register Form Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 space-y-6 animate-slide-up">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-1">Sign Up</h2>
            <div className="w-12 h-1 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full mx-auto"></div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50/80 border border-red-200/50 text-red-700 px-4 py-3 text-sm flex items-center gap-2 animate-shake">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  className="w-full rounded-xl border-2 border-neutral-200 bg-white/50 pl-12 pr-4 py-3.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-200"
                  placeholder="Full name"
                  value={fullName}
                  onChange={e=>setFullName(e.target.value)}
                />
              </div>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  className="w-full rounded-xl border-2 border-neutral-200 bg-white/50 pl-12 pr-4 py-3.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-200"
                  placeholder="Email address"
                  type="email"
                  value={email}
                  onChange={e=>setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  ref={passwordRef}
                  className="w-full rounded-xl border-2 border-neutral-200 bg-white/50 pl-12 pr-4 py-3.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-200"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  onFocus={handlePasswordFocus}
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* Admin Signup Toggle */}
              <div className="pt-2 pb-2">
                <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl border-2 border-neutral-200 hover:border-orange-300 bg-white/30 hover:bg-white/50 transition-all duration-200">
                  <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => {
                      setIsAdmin(e.target.checked)
                      if (!e.target.checked) setAdminCode('')
                    }}
                    className="w-5 h-5 rounded border-neutral-300 text-orange-600 focus:ring-orange-500 focus:ring-2 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <Shield className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">
                      Sign up as Admin
                    </span>
                  </div>
                </label>
              </div>

              {isAdmin && (
                <div className="relative group animate-fade-in">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    className="w-full rounded-xl border-2 border-orange-200 bg-orange-50/50 pl-12 pr-4 py-3.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-500 focus:bg-orange-50 focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-200"
                    placeholder="Admin Code"
                    type="password"
                    value={adminCode}
                    onChange={e=>setAdminCode(e.target.value)}
                    autoComplete="off"
                    required={isAdmin}
                  />
                  <p className="text-xs text-neutral-500 mt-2 ml-1 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Enter the admin code to create an admin account
                  </p>
                </div>
              )}
            </div>

            <button
              className="w-full h-12 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:from-orange-500 hover:to-orange-400 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || (isAdmin && !adminCode)}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-neutral-200/50">
            <p className="text-center text-sm text-neutral-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-orange-600 hover:text-orange-500 transition-colors inline-flex items-center gap-1 group"
              >
                Sign in
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-neutral-400 mt-6">
          Secure authentication powered by Supabase
        </p>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6 animate-slide-up relative">
            <button
              onClick={() => {
                setShowSuccess(false)
                navigate('/login')
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                Account Created Successfully!
              </h3>
              <p className="text-neutral-600 mb-4">
                We've sent a confirmation email to
              </p>
              <p className="text-orange-600 font-semibold text-lg mb-6 break-all">
                {userEmail}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Please check your email</p>
                    <p className="text-blue-700">
                      Click the confirmation link in the email to verify your account and complete the signup process.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowSuccess(false)
                    navigate('/login')
                  }}
                  className="w-full h-12 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:from-orange-500 hover:to-orange-400 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Go to Login
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


