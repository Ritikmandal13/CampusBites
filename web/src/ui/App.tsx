import { Outlet } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { CartProvider } from '../store/CartContext'

export function App() {
  return (
    <CartProvider>
      <div className="min-h-screen">
        <Navbar />
        <main>
          <Outlet />
        </main>
        <Footer />
      </div>
    </CartProvider>
  )
}


