export function AboutPage() {
  return (
    <div className="container-app py-10 prose prose-neutral max-w-3xl">
      <h1>About CampusBites</h1>
      <p>CampusBites is a modern QR-based ordering platform built for fast, convenient campus dining. We help students skip lines and enjoy fresh food, while giving canteens a simple way to manage orders.</p>
      <h2>Why we built it</h2>
      <ul>
        <li>Save students time</li>
        <li>Improve order accuracy</li>
        <li>Enable realtime kitchen workflows</li>
      </ul>
    </div>
  )
}

export function ContactPage() {
  return (
    <div className="container-app py-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="prose prose-neutral">
        <h1>Contact</h1>
        <p>We’d love to hear from you. Reach out for support, partnerships, or feedback.</p>
        <p><strong>Email:</strong> hello@campusbites.app<br />
        <strong>Phone:</strong> +91 90000 00000</p>
      </div>
      <form className="card p-6 space-y-3">
        <input className="rounded-xl border border-neutral-300 p-2" placeholder="Your name" />
        <input className="rounded-xl border border-neutral-300 p-2" placeholder="Your email" />
        <textarea className="rounded-xl border border-neutral-300 p-2" rows={4} placeholder="Message" />
        <button className="btn-primary h-11">Send</button>
      </form>
    </div>
  )
}


