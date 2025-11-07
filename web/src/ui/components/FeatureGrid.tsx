import { QrCode, Timer, ShieldCheck, Leaf } from 'lucide-react'
import type { ReactElement } from 'react'

type Feature = {
  title: string
  desc: string
  icon: ReactElement
}

const features: Feature[] = [
  {
    title: 'Scan & Order',
    desc: 'QR code at your table to access menu and order instantly.',
    icon: <QrCode className="h-5 w-5 text-orange-600" />,
  },
  {
    title: 'Quick Service',
    desc: 'Realtime updates on your order status and prep time.',
    icon: <Timer className="h-5 w-5 text-orange-600" />,
  },
  {
    title: 'Secure Payment',
    desc: 'Pay online securely or choose cash on pickup.',
    icon: <ShieldCheck className="h-5 w-5 text-orange-600" />,
  },
  {
    title: 'Fresh Food',
    desc: 'Prepared daily with quality ingredients from local suppliers.',
    icon: <Leaf className="h-5 w-5 text-orange-600" />,
  },
]

export function FeatureGrid() {
  return (
    <section className="container-app py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {features.map((f) => (
          <article
            key={f.title}
            className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-50 blur-2xl" />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              {f.icon}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900">{f.title}</h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">{f.desc}</p>
          </article>
        ))}
      </div>
    </section>
  )
}


