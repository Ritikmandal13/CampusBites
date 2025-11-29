import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { App } from './ui/App'
import { ErrorBoundary } from './ui/components/ErrorBoundary'
import { LoginPage, RegisterPage } from './pages/Auth'
import { OrderPage } from './pages/Order'
import { CartPage } from './pages/CartCheckout'
import { CheckoutPage } from './pages/Checkout'
import { AdminDashboard, StudentDashboard } from './pages/Dashboards'
import { AdminOrdersPage } from './pages/AdminOrders'
import { AdminMenuPage } from './pages/AdminMenu'
import { KitchenNowPage } from './pages/KitchenNow'
import { OrderTrackingPage } from './pages/OrderTracking'
import { ProfilePage } from './pages/Profile'
import { AboutPage, ContactPage } from './pages/Marketing'
import { AdminQRPage } from './pages/AdminQR'
import { AdminUsersPage } from './pages/AdminUsers'
import { AdminPaymentsPage } from './pages/AdminPayments'
import { HomePage } from './pages/Home'
import { MenuPage } from './pages/Menu'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Don't retry failed queries
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Don't refetch on mount
      staleTime: Infinity, // Consider data fresh forever (for now)
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    },
  },
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/menu', element: <MenuPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/order/:qrId', element: <OrderPage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/student/dashboard', element: <StudentDashboard /> },
      { path: '/admin/dashboard', element: <AdminDashboard /> },
      { path: '/admin/orders', element: <AdminOrdersPage /> },
      { path: '/admin/menu', element: <AdminMenuPage /> },
      { path: '/admin/qrs', element: <AdminQRPage /> },
      { path: '/admin/users', element: <AdminUsersPage /> },
      { path: '/admin/payments', element: <AdminPaymentsPage /> },
      { path: '/kitchen/now', element: <KitchenNowPage /> },
      { path: '/order/:id/track', element: <OrderTrackingPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/contact', element: <ContactPage /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)


