import { useMyProfile } from '../../lib/hooks'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { data: profile, isLoading, isError } = useMyProfile()
  const navigate = useNavigate()
  
  useEffect(() => {
    // If profile loads and user is not admin, redirect to home
    if (profile && profile.role !== 'admin') {
      navigate('/', { replace: true })
    }
  }, [profile, navigate])
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="container-app py-10 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <div className="text-sm text-muted">Checking access…</div>
        </div>
      </div>
    )
  }
  
  // Handle error state
  if (isError || !profile) {
    return (
      <div className="container-app py-10">
        <div className="text-center">
          <div className="text-red-600 mb-2">Access denied</div>
          <div className="text-sm text-muted mb-4">You must be logged in as an admin to access this page.</div>
          <button 
            onClick={() => navigate('/')} 
            className="btn-primary"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }
  
  // Check if user is admin
  if (profile.role !== 'admin') {
    return (
      <div className="container-app py-10">
        <div className="text-center">
          <div className="text-red-600 mb-2">Access denied</div>
          <div className="text-sm text-muted mb-4">Admin access required.</div>
          <button 
            onClick={() => navigate('/')} 
            className="btn-primary"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}


