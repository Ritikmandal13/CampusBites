import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabaseClient'
import type { MenuItem, Order } from './types'

export function useMenu(canteenId?: number, showUnavailable = false) {
  return useQuery({
    queryKey: ['menu', canteenId, showUnavailable],
    queryFn: async (): Promise<MenuItem[]> => {
      console.log('🔍 useMenu queryFn called', { canteenId, showUnavailable })
      
      // Use direct fetch as workaround since Supabase client isn't making HTTP requests
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration is missing')
      }
      
      // Build query URL
      let url = `${supabaseUrl}/rest/v1/menu_items?select=*&order=name.asc`
      if (canteenId) {
        url += `&canteen_id=eq.${canteenId}`
      }
      if (!showUnavailable) {
        url += `&is_available=eq.true`
      }
      
      console.log('🔍 Fetching menu from:', url)
      console.log('🔍 Making HTTP request at', new Date().toISOString())
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        console.log('✅ HTTP request completed:', response.status, response.statusText)
        console.log('✅ Response headers:', Object.fromEntries(response.headers.entries()))
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ HTTP error:', response.status, errorText)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('✅ Menu data received:', Array.isArray(data) ? `${data.length} items` : 'not an array', data)
        
        if (!Array.isArray(data)) {
          console.error('❌ Expected array but got:', typeof data, data)
          return []
        }
        
        if (data.length === 0) {
          console.warn('⚠️ Query returned empty array')
          return []
        }
        
        console.log('✅✅✅ Successfully loaded', data.length, 'menu items!')
        return data as MenuItem[]
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.error('❌ Request aborted (timeout)')
          throw new Error('Request timed out - check network connectivity')
        }
        console.error('❌ Fetch error:', err)
        throw err
      }
    },
    enabled: true,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    retry: 1,
  })
}

export function useOrdersAdmin(canteenId?: number) {
  return useQuery({
    queryKey: ['admin-orders', canteenId],
    queryFn: async (): Promise<Order[]> => {
      // Get admin session for authentication
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session
      
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }
      
      const userToken = session.access_token
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      // Build query URL
      let url = `${supabaseUrl}/rest/v1/orders?select=*&order=created_at.desc`
      if (canteenId) {
        url += `&canteen_id=eq.${canteenId}`
      }
      
      const response = await fetch(url, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${userToken}`, // Use admin's JWT token for RLS
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch orders: ${errorText}`)
      }
      
      const data = await response.json()
      return data as Order[]
    },
    enabled: !!supabase,
    staleTime: 10000, // 10 seconds
  })
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      // Fast timeout - don't block page rendering
      const fastTimeout = 3000 // 3 seconds max
      
      try {
        console.log('🔍 useMyProfile: Starting (fast mode)...')
        
        // Try to get session quickly
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), fastTimeout)
        )
        
        const sessionData = await Promise.race([sessionPromise, timeoutPromise]) as any
        
        if (sessionData.error) {
          console.log('🔍 useMyProfile: No session')
          return null
        }
        
        const session = sessionData?.data?.session
        if (!session?.user) {
          console.log('🔍 useMyProfile: No user in session')
          return null
        }
        
        const uid = session.user.id
        console.log('🔍 useMyProfile: User found:', uid)
        
        // Use direct fetch with short timeout
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseKey) {
          console.error('❌ useMyProfile: Missing env vars')
          return null
        }
        
        const profileUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${uid}&select=*`
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), fastTimeout)
        
        try {
          const profileResponse = await fetch(profileUrl, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          })
          
          clearTimeout(timeoutId)
          
          if (!profileResponse.ok) {
            console.log('🔍 useMyProfile: Profile not found or error')
            return null
          }
          
          const profileData = await profileResponse.json()
          const profile = Array.isArray(profileData) && profileData.length > 0 ? profileData[0] : null
          
          if (profile) {
            console.log('✅ useMyProfile: Profile loaded:', profile.role)
          }
          
          return profile
        } catch (fetchErr: any) {
          clearTimeout(timeoutId)
          if (fetchErr.name === 'AbortError') {
            console.log('🔍 useMyProfile: Timeout (non-blocking)')
          } else {
            console.log('🔍 useMyProfile: Fetch error (non-blocking):', fetchErr.message)
          }
          return null // Return null instead of throwing - don't block page
        }
      } catch (err: any) {
        console.log('🔍 useMyProfile: Error (non-blocking):', err.message)
        return null // Always return null to not block page rendering
      }
    },
    retry: false, // Don't retry - just return null quickly
    staleTime: 60000,
    gcTime: 300000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    // Don't throw errors - just return null
    throwOnError: false,
  })
}


