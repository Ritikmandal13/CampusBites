import { Link } from 'react-router-dom'
import { AdminGate } from '../ui/components/AdminGate'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useMyProfile, useMyOrders } from '../lib/hooks'
import { StatusBadge } from '../ui/components/StatusBadge'
import type { Order } from '../lib/types'
import { Clock, Package, MapPin, Receipt, ChevronDown, ChevronUp } from 'lucide-react'

export function StudentDashboard() {
  const { data: orders, isLoading, error, refetch } = useMyOrders()
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set())
  const [realtimeEnabled, setRealtimeEnabled] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Set up real-time subscriptions for order updates
  useEffect(() => {
    if (realtimeEnabled) return

    console.log('🔔 Setting up real-time subscriptions for student orders...')
    
    const channel = supabase
      .channel('student-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('🔔 Order update received:', payload)
          refetch() // Refetch orders when any order changes
          setRefreshKey(prev => prev + 1) // Force re-render
        }
      )
      .subscribe((status) => {
        console.log('🔔 Student orders realtime subscription status:', status)
        if (status === 'SUBSCRIBED') {
          setRealtimeEnabled(true)
        }
      })

    return () => {
      console.log('🔔 Cleaning up real-time subscriptions')
      supabase.removeChannel(channel)
      setRealtimeEnabled(false)
    }
  }, [refetch])

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatAmount = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return `₹${num.toFixed(2)}`
  }

  // Filter and search orders
  const filteredOrders = orders?.filter(o => {
    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'active' && !['NEW', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.order_status || '')) {
        return false
      }
      if (filterStatus === 'completed' && o.order_status !== 'COMPLETED') {
        return false
      }
      if (filterStatus === 'cancelled' && o.order_status !== 'CANCELLED') {
        return false
      }
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return (
        o.token?.toLowerCase().includes(query) ||
        o.order_number?.toLowerCase().includes(query) ||
        o.table_no?.toLowerCase().includes(query) ||
        o.order_items?.some(item => item.name.toLowerCase().includes(query))
      )
    }
    
    return true
  }) || []
  
  // Group orders by status
  const activeOrders = filteredOrders.filter(o => 
    ['NEW', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.order_status || '')
  )
  
  const completedOrders = filteredOrders.filter(o => 
    ['COMPLETED', 'CANCELLED'].includes(o.order_status || '')
  )

  return (
    <div className="container-app py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-neutral-900 mb-2">My Orders</h1>
            <p className="text-muted">Track your orders and view order history</p>
          </div>
          {realtimeEnabled && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
              <span className="font-medium">Live Updates Active</span>
            </div>
          )}
        </div>

        {/* Search and Filter Bar */}
        {orders && orders.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 bg-neutral-50 p-4 rounded-lg">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by token, order number, table, or item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'all' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'active' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'completed' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilterStatus('cancelled')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'cancelled' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-red-600 font-semibold">⚠️</div>
            <div className="flex-1">
              <p className="font-medium text-red-900">Error loading orders</p>
              <p className="text-sm text-red-700 mt-1">{error.message || 'Unable to fetch orders. Please try again.'}</p>
              <button 
                onClick={() => refetch()} 
                className="mt-3 text-sm font-medium text-red-700 hover:text-red-900 underline"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-neutral-200 rounded w-1/3" />
                  <div className="h-4 bg-neutral-200 rounded w-1/2" />
                </div>
                <div className="h-8 w-24 bg-neutral-200 rounded" />
              </div>
              <div className="h-10 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
      ) : orders && orders.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-neutral-100 p-6">
              <Package className="h-16 w-16 text-neutral-400" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">No orders yet</h2>
          <p className="text-muted mb-6 max-w-md mx-auto">
            Start ordering from our delicious menu to see your orders here. Track your orders in real-time!
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/menu" className="btn-primary">
              🍽️ Browse Menu
            </Link>
            <button onClick={() => refetch()} className="btn-ghost">
              Refresh
            </button>
          </div>
        </div>
      ) : filteredOrders.length === 0 && (searchQuery || filterStatus !== 'all') ? (
        /* No Results State */
        <div className="text-center py-16">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-neutral-100 p-6">
              <svg className="h-16 w-16 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">No orders found</h2>
          <p className="text-muted mb-6 max-w-md mx-auto">
            Try adjusting your search or filter to find what you're looking for.
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => {
                setSearchQuery('')
                setFilterStatus('all')
              }} 
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        /* Orders Display */
        <div className="space-y-8" key={refreshKey}>
          {/* Active Orders Section */}
          {activeOrders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-neutral-900">
                  Active Orders
                  <span className="ml-3 text-base font-normal text-neutral-500">
                    ({activeOrders.length})
                  </span>
                </h2>
                <button 
                  onClick={() => refetch()} 
                  className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isExpanded={expandedOrders.has(order.id)}
                    onToggle={() => toggleOrderExpand(order.id)}
                    formatDate={formatDate}
                    formatAmount={formatAmount}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Order History Section */}
          {completedOrders.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-neutral-900">
                Order History
                <span className="ml-3 text-base font-normal text-neutral-500">
                  ({completedOrders.length})
                </span>
              </h2>
              <div className="space-y-4">
                {completedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isExpanded={expandedOrders.has(order.id)}
                    onToggle={() => toggleOrderExpand(order.id)}
                    formatDate={formatDate}
                    formatAmount={formatAmount}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OrderCard({ 
  order, 
  isExpanded, 
  onToggle, 
  formatDate, 
  formatAmount 
}: { 
  order: Order
  isExpanded: boolean
  onToggle: () => void
  formatDate: (date?: string | null) => string
  formatAmount: (amount: number | string) => string
}) {
  const isActive = ['NEW', 'ACCEPTED', 'PREPARING', 'READY'].includes(order.order_status || '')
  const isCompleted = order.order_status === 'COMPLETED'
  const isCancelled = order.order_status === 'CANCELLED'
  
  return (
    <div className={`card overflow-hidden transition-all duration-200 hover:shadow-lg ${
      isActive ? 'border-2 border-orange-500 shadow-orange-100' : 
      isCompleted ? 'border border-emerald-200' :
      isCancelled ? 'border border-red-200 bg-red-50/30' : ''
    }`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="text-lg font-semibold text-neutral-900">
                {order.token ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="text-sm font-normal text-neutral-500">Token:</span>
                    <span className="text-2xl font-bold text-orange-600">{order.token}</span>
                  </span>
                ) : (
                  `Order #${order.order_number || order.id}`
                )}
              </h3>
              <StatusBadge status={order.order_status || 'NEW'} type="order" />
              <StatusBadge status={order.payment_status || 'PENDING'} type="payment" />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatDate(order.created_at)}</span>
              </div>
              {order.table_no && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>Table {order.table_no}</span>
                </div>
              )}
              {order.payment_method && (
                <div className="flex items-center gap-1">
                  <Receipt className="h-4 w-4" />
                  <span>{order.payment_method}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-neutral-900">
              {formatAmount(order.total_amount)}
            </div>
            {order.tax && Number(order.tax) > 0 && (
              <div className="text-xs text-muted">
                (incl. tax: {formatAmount(order.tax)})
              </div>
            )}
          </div>
        </div>

        {/* Order Progress for Active Orders */}
        {isActive && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-neutral-700">Order Progress</span>
              <span className="text-xs text-neutral-500">
                {order.order_status === 'NEW' ? 'Waiting for confirmation' :
                 order.order_status === 'ACCEPTED' ? 'Confirmed, preparing soon' :
                 order.order_status === 'PREPARING' ? 'Your order is being prepared' :
                 order.order_status === 'READY' ? 'Ready for pickup!' : ''}
              </span>
            </div>
            <div className="relative">
              <div className="flex justify-between mb-1">
                {['NEW', 'ACCEPTED', 'PREPARING', 'READY'].map((status, idx) => {
                  const statusOrder = ['NEW', 'ACCEPTED', 'PREPARING', 'READY']
                  const currentIdx = statusOrder.indexOf(order.order_status || 'NEW')
                  const isComplete = idx <= currentIdx
                  
                  return (
                    <div key={status} className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                        isComplete ? 'bg-orange-500 text-white' : 'bg-neutral-200 text-neutral-500'
                      }`}>
                        {isComplete ? '✓' : idx + 1}
                      </div>
                      <span className="text-xs mt-1 text-neutral-600">{status}</span>
                    </div>
                  )
                })}
              </div>
              <div className="absolute top-4 left-0 right-0 h-1 bg-neutral-200 -z-10">
                <div 
                  className="h-full bg-orange-500 transition-all duration-500"
                  style={{ 
                    width: `${(['NEW', 'ACCEPTED', 'PREPARING', 'READY'].indexOf(order.order_status || 'NEW') / 3) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Order Items Toggle */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between py-3 px-4 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <span className="text-sm font-medium text-neutral-700">
            {order.order_items?.length || 0} item(s)
          </span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-neutral-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-neutral-600" />
          )}
        </button>

        {/* Expanded Order Items */}
        {isExpanded && order.order_items && order.order_items.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <div className="space-y-3">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-neutral-900">{item.name}</div>
                    <div className="text-sm text-muted">
                      {formatAmount(item.unit_price)} × {item.qty}
                    </div>
                  </div>
                  <div className="font-semibold text-neutral-900">
                    {formatAmount(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Order Notes */}
            {order.notes && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-xs font-medium text-amber-900 mb-1">Special Instructions</div>
                <div className="text-sm text-amber-800">{order.notes}</div>
              </div>
            )}

            {/* Cancel Reason */}
            {order.order_status === 'CANCELLED' && order.cancel_reason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-xs font-medium text-red-900 mb-1">Cancellation Reason</div>
                <div className="text-sm text-red-800">{order.cancel_reason}</div>
              </div>
            )}

            {/* Estimated Ready Time */}
            {order.estimated_ready_at && isActive && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-xs font-medium text-blue-900 mb-1">Estimated Ready Time</div>
                <div className="text-sm text-blue-800">{formatDate(order.estimated_ready_at)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function DashboardStats() {
  const { data: me } = useMyProfile()
  const canteenId = me?.canteen_id ?? undefined
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    menuItems: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Total orders
      let ordersQuery = supabase.from('orders').select('id, total_amount, order_status, created_at', { count: 'exact' })
      if (canteenId) ordersQuery = ordersQuery.eq('canteen_id', canteenId)
      const { data: orders, count: totalOrders } = await ordersQuery

      // Today's orders
      let todayQuery = supabase.from('orders').select('total_amount').gte('created_at', today.toISOString())
      if (canteenId) todayQuery = todayQuery.eq('canteen_id', canteenId)
      const { data: todayOrdersData } = await todayQuery

      // Menu items
      let menuQuery = supabase.from('menu_items').select('id', { count: 'exact' })
      if (canteenId) menuQuery = menuQuery.eq('canteen_id', canteenId)
      const { count: menuItems } = await menuQuery

      const totalRevenue = orders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0
      const todayRevenue = todayOrdersData?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0
      const pendingOrders = orders?.filter(o => ['NEW', 'ACCEPTED', 'PREPARING'].includes(o.order_status)).length || 0

      setStats({
        totalOrders: totalOrders || 0,
        todayOrders: todayOrdersData?.length || 0,
        totalRevenue,
        todayRevenue,
        pendingOrders,
        menuItems: menuItems || 0,
      })
      setLoading(false)
    }
    load()
  }, [canteenId])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-4 bg-neutral-200 rounded w-2/3 mb-2" />
            <div className="h-8 bg-neutral-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-orange-100">Total Orders</div>
            <div className="text-2xl">📦</div>
          </div>
          <div className="text-4xl font-bold mb-1">{stats.totalOrders}</div>
          <div className="text-sm text-orange-100">{stats.todayOrders} today</div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      </div>
      
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-emerald-100">Total Revenue</div>
            <div className="text-2xl">💰</div>
          </div>
          <div className="text-4xl font-bold mb-1">₹{stats.totalRevenue.toFixed(0)}</div>
          <div className="text-sm text-emerald-100">₹{stats.todayRevenue.toFixed(0)} today</div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      </div>
      
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-amber-100">Pending Orders</div>
            <div className="text-2xl">⏳</div>
          </div>
          <div className="text-4xl font-bold mb-1">{stats.pendingOrders}</div>
          <div className="text-sm text-amber-100">Need attention</div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      </div>
      
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-blue-100">Menu Items</div>
            <div className="text-2xl">🍽️</div>
          </div>
          <div className="text-4xl font-bold mb-1">{stats.menuItems}</div>
          <div className="text-sm text-blue-100">Active items</div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      </div>
      
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-purple-100">Today's Orders</div>
            <div className="text-2xl">📊</div>
          </div>
          <div className="text-4xl font-bold mb-1">{stats.todayOrders}</div>
          <div className="text-sm text-purple-100">New orders today</div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      </div>
      
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-pink-100">Today's Revenue</div>
            <div className="text-2xl">💵</div>
          </div>
          <div className="text-4xl font-bold mb-1">₹{stats.todayRevenue.toFixed(0)}</div>
          <div className="text-sm text-pink-100">Revenue today</div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const quickActions = [
    { to: "/admin/orders", icon: "📦", title: "Orders", description: "Manage and update order status", color: "from-orange-500 to-orange-600" },
    { to: "/admin/menu", icon: "🍽️", title: "Menu Management", description: "Add, edit, or remove menu items", color: "from-blue-500 to-blue-600" },
    { to: "/admin/qrs", icon: "📱", title: "QR Codes", description: "Create and manage QR codes", color: "from-purple-500 to-purple-600" },
    { to: "/admin/users", icon: "👥", title: "Users", description: "Manage user roles and permissions", color: "from-emerald-500 to-emerald-600" },
    { to: "/admin/payments", icon: "💳", title: "Payments", description: "View and manage payment transactions", color: "from-pink-500 to-pink-600" },
    { to: "/kitchen/now", icon: "🔥", title: "Kitchen View", description: "Live order preparation screen", color: "from-amber-500 to-amber-600" },
  ]
  
  return (
    <AdminGate>
      <div className="container-app py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">Admin Dashboard</h1>
          <p className="text-muted">Welcome back! Here's what's happening with your canteen today.</p>
        </div>
        
        <DashboardStats />
        
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group relative overflow-hidden rounded-xl bg-white border border-neutral-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${action.color} opacity-10 rounded-full -mr-10 -mt-10 group-hover:opacity-20 transition-opacity`}></div>
              <div className="relative z-10">
                <div className="text-4xl mb-4">{action.icon}</div>
                <h3 className="font-semibold text-lg mb-2 text-neutral-900 group-hover:text-orange-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-muted">{action.description}</p>
                <div className="mt-4 text-sm font-medium text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Go to {action.title} →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AdminGate>
  )
}


