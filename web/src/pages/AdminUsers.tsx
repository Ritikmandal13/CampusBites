import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AdminGate } from '../ui/components/AdminGate'

type User = { id: string; email: string | null; full_name: string | null; role: string; canteen_id: number | null; created_at: string | null }

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string>('')
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      setUsers((data ?? []) as User[])
      setLoading(false)
    }
    load()
  }, [])
  const updateRole = async (id: string, role: string, email: string | null) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) {
      setToast(`Error: ${error.message}`)
    } else {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
      setToast(`Role updated to ${role} for ${email ?? 'user'}`)
      setTimeout(() => setToast(''), 3000)
    }
  }
  return (
    <AdminGate>
      <div className="container-app py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">User Management</h1>
          <p className="text-muted text-sm">Manage user roles and permissions</p>
        </div>
        {toast && (
          <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 text-sm animate-fade-in">
            {toast}
          </div>
        )}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-muted">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Role</th>
                    <th className="text-left p-4 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t border-neutral-100 hover:bg-neutral-50 transition">
                      <td className="p-4">{u.email ?? <span className="text-muted">—</span>}</td>
                      <td className="p-4">{u.full_name ?? <span className="text-muted">—</span>}</td>
                      <td className="p-4">
                        <select 
                          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" 
                          value={u.role} 
                          onChange={e => updateRole(u.id, e.target.value, u.email)}
                        >
                          <option value="student">Student</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4 text-muted text-xs">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminGate>
  )
}

