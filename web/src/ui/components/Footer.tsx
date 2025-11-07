import { Facebook, Instagram, Twitter, Phone, Mail, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-24">
      {/* Full-width orange CTA */}
      <div className="bg-orange-600 text-white">
        <div className="container-app py-8 text-center">
          <h3 className="text-4xl font-extrabold mb-3">Ready to Order?</h3>
          <p className="text-white/90 mb-6">Join thousands of students who have already discovered the convenience of QR-based ordering.</p>
          <div className="flex justify-center gap-3">
            <a href="/menu" className="btn-ghost bg-white text-neutral-900 border-0 hover:bg-neutral-100">Browse Menu</a>
            <a href="/register" className="btn-ghost bg-white/10 text-white border-0 hover:bg-white/20">Create Account</a>
          </div>
        </div>
      </div>

      {/* Dark professional footer */}
      <div className="bg-[#0f1a24] text-white">
        <div className="container-app py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Campus Bites" className="max-h-9 w-auto object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              <span className="text-2xl font-semibold tracking-tight">CampusBites</span>
            </div>
            <p className="text-sm text-white/70 max-w-md">Your campus dining solution. Order fresh, delicious meals with just a QR code scan. Fast, convenient, and always fresh.</p>
            <div className="mt-6 flex items-center gap-4 text-white/80">
              <a aria-label="Facebook" className="hover:text-white" href="#"><Facebook className="h-5 w-5" /></a>
              <a aria-label="Twitter" className="hover:text-white" href="#"><Twitter className="h-5 w-5" /></a>
              <a aria-label="Instagram" className="hover:text-white" href="#"><Instagram className="h-5 w-5" /></a>
            </div>
          </div>
          <div>
            <h4 className="text-xl font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3 text-white/80">
              <li><a href="/menu" className="hover:text-orange-400">Menu</a></li>
              <li><a href="/student/dashboard" className="hover:text-orange-400">My Orders</a></li>
              <li><a href="/about" className="hover:text-orange-400">About Us</a></li>
              <li><a href="/contact" className="hover:text-orange-400">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xl font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-white/80">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +1 (555) 123-4567</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@campuseats.com</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Campus Center, Building A</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-6 text-center text-xs text-white/70">© {new Date().getFullYear()} CampusBites. All rights reserved.</div>
      </div>
    </footer>
  )
}


