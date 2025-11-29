import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function ProfilePage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      setEmail(auth.user.email ?? '')
      const { data } = await supabase.from('profiles').select('*').eq('id', auth.user.id).single()
      if (data) {
        setFullName(data.full_name ?? '')
        setPhone(data.phone ?? '')
      }
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      await supabase.from('profiles').upsert({ id: auth.user.id, full_name: fullName, phone })
      alert('Saved')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container-app py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="card p-6 lg:col-span-2">
        <h1 className="text-2xl font-semibold mb-4">Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="rounded-xl border border-neutral-300 p-2" placeholder="Full name" value={fullName} onChange={e=>setFullName(e.target.value)} />
          <input className="rounded-xl border border-neutral-300 p-2" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
          <input className="rounded-xl border border-neutral-300 p-2 md:col-span-2" placeholder="Email (read-only)" readOnly value={email} />
        </div>
        <button className="btn-primary h-11 mt-4" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save Changes'}</button>
      </div>
      <aside className="card p-6">
        <h2 className="font-medium mb-3">Settings</h2>
        <label className="flex items-center justify-between py-2">
          <span className="text-sm">Notifications</span>
          <input type="checkbox" defaultChecked />
        </label>
        <label className="flex items-center justify-between py-2">
          <span className="text-sm">Dark Mode</span>
          <input type="checkbox" />
        </label>
      </aside>
    </div>
  )
}


