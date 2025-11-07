import { Link } from 'react-router-dom'
import { AdminGate } from '../ui/components/AdminGate'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useMyProfile } from '../lib/hooks'

export function StudentDashboard() {
  return (
    <div className="container-app py-12">
      <h1 className="text-2xl font-semibold mb-4">Student Dashboard</h1>
      <div className="card p-6">Order history will appear here</div>
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


