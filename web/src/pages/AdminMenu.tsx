import { useState } from 'react'
import { useMenu, useMyProfile } from '../lib/hooks'
import { supabase } from '../lib/supabaseClient'
import { AdminGate } from '../ui/components/AdminGate'
import { useQueryClient } from '@tanstack/react-query'
import { MENU_CATEGORY_OPTIONS } from '../lib/constants'

export function AdminMenuPage() {
  const { data: me } = useMyProfile()
  const canteenId = me?.canteen_id ?? undefined
  const queryClient = useQueryClient()
  // Admin can see all items including unavailable ones
  const { data, refetch, isLoading } = useMenu(canteenId, true)
  const [categorySelection, setCategorySelection] = useState<'preset' | 'custom' | ''>('')
  const [form, setForm] = useState<{
    id?: number
    name: string
    description: string
    price: string
    category: string
    is_available: boolean
    prep_time_minutes: string
    file?: File | null
    existing_image?: string | null
  }>({
    name: '',
    description: '',
    price: '',
    category: '',
    is_available: true,
    prep_time_minutes: '10',
    file: undefined,
    existing_image: null,
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const onEdit = (i: any) => {
    setForm({
      id: i.id,
      name: i.name,
      description: i.description ?? '',
      price: String(i.price),
      category: i.category ?? '',
      is_available: i.is_available ?? true,
      prep_time_minutes: String(i.prep_time_minutes ?? 10),
      file: undefined,
      existing_image: i.image_path,
    })
    if (i.category && (MENU_CATEGORY_OPTIONS as readonly string[]).includes(i.category)) {
      setCategorySelection('preset')
    } else if (i.category) {
      setCategorySelection('custom')
    } else {
      setCategorySelection('')
    }
  }
  
  const onDelete = async (id: number, image_path?: string | null) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return
    await supabase.from('menu_items').delete().eq('id', id)
    if (image_path) await supabase.storage.from('menu-images').remove([image_path])
    setToast('Menu item deleted')
    // Invalidate and refetch all menu queries
    await queryClient.invalidateQueries({ queryKey: ['menu'], exact: false })
    await queryClient.refetchQueries({ queryKey: ['menu'], exact: false })
    await refetch()
  }
  
  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      price: '',
      category: '',
      is_available: true,
      prep_time_minutes: '10',
      file: undefined,
      existing_image: null,
    })
    setCategorySelection('')
  }
  
  const onSubmit = async () => {
    if (!form.name.trim() || !form.price.trim()) {
      setToast('Please fill in name and price')
      return
    }
    setSaving(true)
    
    let image_path: string | undefined = form.existing_image || undefined
    
    // Upload image with timeout - don't block on it
    if (form.file) {
      const uploadPromise = (async () => {
        try {
          // Delete old image if updating
          if (form.id && form.existing_image) {
            await supabase.storage.from('menu-images').remove([form.existing_image])
          }
          const ext = form.file!.name.split('.').pop()
          const key = `${Date.now()}.${ext}`
          const { error: upErr } = await supabase.storage.from('menu-images').upload(key, form.file!, { upsert: false })
          if (upErr) {
            console.error('Image upload error:', upErr)
            return null
          }
          return key
        } catch (imgError: any) {
          console.error('Image upload error:', imgError)
          return null
        }
      })()
      
      // Race upload with 5 second timeout
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
      const uploadResult = await Promise.race([uploadPromise, timeoutPromise])
      
      if (uploadResult) {
        image_path = uploadResult
      } else {
        console.warn('Image upload timed out or failed, continuing without image')
      }
    }
    
    try {
      const rawCategory = form.category.trim()
      const normalizedCustomCategory = rawCategory
        .split(' ')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      const categoryValue = rawCategory
        ? categorySelection === 'preset'
          ? rawCategory
          : normalizedCustomCategory
        : null

      const payload: any = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price || 0),
        category: categoryValue,
        is_available: form.is_available,
        prep_time_minutes: Number(form.prep_time_minutes || 10),
      }
      if (canteenId) payload.canteen_id = canteenId
      if (image_path) payload.image_path = image_path
      
      // Insert or update menu item
      if (form.id) {
        const { error: updateError } = await supabase.from('menu_items').update(payload).eq('id', form.id)
        if (updateError) {
          console.error('Update error:', updateError)
          throw new Error(`Failed to update menu item: ${updateError.message}`)
        }
        setToast('Menu item updated successfully')
      } else {
        const { error: insertError, data: insertData } = await supabase.from('menu_items').insert(payload).select()
        if (insertError) {
          console.error('Insert error:', insertError)
          throw new Error(`Failed to create menu item: ${insertError.message}`)
        }
        console.log('Menu item created:', insertData)
        setToast('Menu item created successfully')
      }
      
      resetForm()
      // Invalidate and refetch menu queries to update both admin and student views
      // Use exact: false to invalidate all queries starting with 'menu'
      await queryClient.invalidateQueries({ queryKey: ['menu'], exact: false })
      // Force refetch all menu queries across the app
      await queryClient.refetchQueries({ queryKey: ['menu'], exact: false })
      await refetch()
      setTimeout(() => setToast(''), 3000)
    } catch (error: any) {
      console.error('Submit error:', error)
      setToast(`Error: ${error.message || 'Unknown error occurred'}`)
      setTimeout(() => setToast(''), 5000)
    } finally {
      setSaving(false)
    }
  }
  
  const filteredItems = (data ?? []).filter(item => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query)
    )
  })

  return (
    <AdminGate>
    <div className="container-app py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">Menu Management</h1>
        <p className="text-muted">Manage your menu items, add new dishes, and update existing ones.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menu Items Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-muted">🔍</span>
                </div>
                <input 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" 
                  placeholder="Search menu items..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="ml-4 text-sm text-muted">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isLoading && (
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-neutral-50 rounded-xl overflow-hidden border border-neutral-200">
                      <div className="h-40 bg-neutral-200" />
                      <div className="p-4 space-y-3">
                        <div className="h-5 bg-neutral-200 rounded w-3/4" />
                        <div className="h-4 bg-neutral-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </>
              )}
              {!isLoading && filteredItems.map(i => (
                <div 
                  key={i.id} 
                  className={`group relative bg-white rounded-xl overflow-hidden border-2 transition-all hover:shadow-lg ${
                    i.is_available 
                      ? 'border-neutral-200 hover:border-orange-300' 
                      : 'border-red-200 bg-red-50/50'
                  }`}
                >
                  <div className="h-40 bg-neutral-100 relative overflow-hidden">
                    {i.image_path ? (
                      <img
                        src={supabase.storage.from('menu-images').getPublicUrl(i.image_path).data.publicUrl}
                        alt={i.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-4xl text-neutral-300">
                        🍽️
                      </div>
                    )}
                    {!i.is_available && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-md">
                        Unavailable
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="p-4">
                    <div className="font-semibold text-lg text-neutral-900 mb-1">{i.name}</div>
                    {i.description && (
                      <div className="text-sm text-muted mb-3 line-clamp-2">{i.description}</div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xl font-bold text-orange-600">₹{Number(i.price).toFixed(0)}</div>
                      {i.category && (
                        <span className="px-2.5 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-full">
                          {i.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted mb-4">
                      {i.prep_time_minutes && (
                        <span className="flex items-center gap-1">
                          <span>⏱️</span> {i.prep_time_minutes} min
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="flex-1 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors" 
                        onClick={() => onEdit(i)}
                      >
                        Edit
                      </button>
                      <button 
                        className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors" 
                        onClick={() => onDelete(i.id, i.image_path)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!isLoading && filteredItems.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <div className="text-6xl mb-4">🍽️</div>
                  <div className="text-lg font-medium text-neutral-900 mb-2">
                    {searchQuery ? 'No items found' : 'No menu items yet'}
                  </div>
                  <div className="text-sm text-muted">
                    {searchQuery ? 'Try a different search term' : 'Add your first menu item using the form'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Form Sidebar */}
        <aside className="lg:sticky lg:top-4 lg:h-fit">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">
                  {form.id ? 'Edit Item' : 'Add New Item'}
                </h2>
                <p className="text-sm text-muted mt-1">
                  {form.id ? 'Update menu item details' : 'Create a new menu item'}
                </p>
              </div>
              {form.id && (
                <button
                  className="px-3 py-1.5 text-sm text-muted hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
            
            {toast && (
              <div className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium ${
                toast.includes('Error') 
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}>
                {toast}
              </div>
            )}
            
            <div className="space-y-5">
              {/* Item Name */}
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  placeholder="e.g., Chicken Biryani"
                  value={form.name}
                  onChange={e=>setForm(f=>({...f, name: e.target.value}))}
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none"
                  placeholder="Describe the item (optional)"
                  rows={3}
                  value={form.description}
                  onChange={e=>setForm(f=>({...f, description: e.target.value}))}
                />
              </div>
              
              {/* Price & Category Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                      placeholder="0.00"
                      value={form.price}
                      onChange={e=>setForm(f=>({...f, price: e.target.value}))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    Category
                  </label>
                  {(() => {
                    const selectValue = categorySelection === 'preset'
                      ? ((MENU_CATEGORY_OPTIONS as readonly string[]).includes(form.category) ? form.category : '')
                      : categorySelection === 'custom'
                        ? '__custom'
                        : ''
                    const showCustomInput = categorySelection === 'custom'
                    return (
                      <>
                        <select
                          className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                          value={selectValue}
                          onChange={e => {
                            const value = e.target.value
                            if (value === '__custom') {
                              setCategorySelection('custom')
                              setForm(f => ({ ...f, category: (MENU_CATEGORY_OPTIONS as readonly string[]).includes(f.category) ? '' : f.category }))
                            } else if (value === '') {
                              setCategorySelection('')
                              setForm(f => ({ ...f, category: '' }))
                            } else {
                              setCategorySelection('preset')
                              setForm(f => ({ ...f, category: value }))
                            }
                          }}
                        >
                          <option value="">Select category</option>
                          {MENU_CATEGORY_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                          <option value="__custom">Other (type manually)</option>
                        </select>
                        {showCustomInput && (
                          <input
                            className="mt-3 w-full px-4 py-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                            placeholder="Custom category"
                            value={form.category}
                            onChange={e=>setForm(f=>({...f, category: e.target.value }))}
                          />
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
              
              {/* Prep Time & Availability Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    Prep Time (min)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    placeholder="10"
                    value={form.prep_time_minutes}
                    onChange={e=>setForm(f=>({...f, prep_time_minutes: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    Availability
                  </label>
                  <label className="flex items-center h-[52px] px-4 rounded-xl border border-neutral-300 bg-white cursor-pointer hover:bg-neutral-50 transition">
                    <input
                      type="checkbox"
                      checked={form.is_available}
                      onChange={e=>setForm(f=>({...f, is_available: e.target.checked}))}
                      className="w-5 h-5 rounded border-neutral-300 bg-white text-orange-600 focus:ring-orange-500 focus:ring-2"
                    />
                    <span className="ml-3 text-sm font-medium text-neutral-900">
                      {form.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </label>
                </div>
              </div>
              
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Item Image
                </label>
                {form.existing_image && !form.file && (
                  <div className="mb-3 relative group">
                    <img
                      src={supabase.storage.from('menu-images').getPublicUrl(form.existing_image).data.publicUrl}
                      alt="Current"
                      className="w-full h-32 object-cover rounded-xl border-2 border-neutral-200"
                    />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, existing_image: null }))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-red-600 transition-colors shadow-lg"
                    >
                      ×
                    </button>
                  </div>
                )}
                {form.file && (
                  <div className="mb-3 relative">
                    <img
                      src={URL.createObjectURL(form.file)}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-xl border-2 border-orange-300"
                    />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, file: null }))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-red-600 transition-colors shadow-lg"
                    >
                      ×
                    </button>
                  </div>
                )}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <span className="text-3xl mb-2">📷</span>
                    <p className="text-sm font-medium text-neutral-700">
                      {form.file ? 'Change image' : form.existing_image ? 'Replace image' : 'Upload image'}
                    </p>
                    <p className="text-xs text-muted mt-1">PNG, JPG up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e=>setForm(f=>({...f, file: e.target.files?.[0] || null}))}
                  />
                </label>
              </div>
              
              {/* Submit Button */}
              <button
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={saving || !form.name.trim() || !form.price.trim()}
                onClick={onSubmit}
              >
                {saving ? (
                  <>
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    {form.id ? '✏️ Update Item' : '✨ Create Item'}
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
    </AdminGate>
  )
}


