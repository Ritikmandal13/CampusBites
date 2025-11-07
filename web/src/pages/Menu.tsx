import { useEffect, useMemo, useState } from 'react'
import { MenuCard } from '../ui/components/MenuCard'
import { useMenu } from '../lib/hooks'
import { supabase } from '../lib/supabaseClient'
import { useCart } from '../store/CartContext'
import { MENU_CATEGORY_OPTIONS } from '../lib/constants'

export function MenuPage() {
  const [active, setActive] = useState('All Items')
  const { data, isLoading, isError, error } = useMenu()
  const { add } = useCart()
  
  const items = useMemo(() => {
    if (!data) return []
    return data.map(i => {
      // Ensure price is a number
      const price = typeof i.price === 'string' ? parseFloat(i.price) : i.price
      return {
        id: String(i.id),
        title: i.name,
        price: price,
        category: i.category ? String(i.category) : null,
        img: i.image_path 
          ? supabase.storage.from('menu-images').getPublicUrl(i.image_path).data.publicUrl
          : undefined,
      }
    })
  }, [data])

  const categories = useMemo(() => {
    const unique = new Set<string>()
    items.forEach(item => {
      if (item.category) {
        unique.add(item.category)
      }
    })
    const categoryArray = Array.from(MENU_CATEGORY_OPTIONS) as string[]
    const sorted = Array.from(unique).sort((a, b) => {
      const idxA = categoryArray.indexOf(a)
      const idxB = categoryArray.indexOf(b)
      const normalizedIdxA = idxA === -1 ? categoryArray.length : idxA
      const normalizedIdxB = idxB === -1 ? categoryArray.length : idxB
      if (normalizedIdxA !== normalizedIdxB) {
        return normalizedIdxA - normalizedIdxB
      }
      return a.localeCompare(b)
    })
    return ['All Items', ...sorted]
  }, [items])

  useEffect(() => {
    if (!categories.includes(active)) {
      setActive('All Items')
    }
  }, [categories, active])
  
  const filtered = useMemo(() => {
    if (active === 'All Items') return items
    const target = active.toLowerCase()
    return items.filter(i => (i.category ?? '').toLowerCase() === target)
  }, [active, items])
  return (
    <div className="container-app py-12">
      <h1 className="text-4xl font-extrabold text-center">Our Menu</h1>
      <p className="text-center text-muted mt-2">Fresh, delicious meals prepared daily</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`inline-flex items-center px-4 py-2 rounded-full border transition-all text-sm font-medium ${
              active === c
                ? 'bg-orange-500 text-white border-orange-500 shadow-lg'
                : 'bg-white text-neutral-700 border-neutral-200 hover:border-orange-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      {isLoading && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse card overflow-hidden">
              <div className="aspect-[16/9] bg-neutral-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-2/3" />
                <div className="h-3 bg-neutral-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}
      {isError && (
        <div className="mt-10 text-center">
          <div className="text-sm text-red-600 mb-2">Failed to load menu.</div>
          {error && (
            <div className="text-xs text-red-500 mt-1">
              {error instanceof Error ? error.message : String(error)}
            </div>
          )}
        </div>
      )}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(item => (
          <MenuCard 
            key={item.id} 
            title={item.title} 
            price={`₹${item.price.toFixed(0)}`} 
            category={item.category ?? 'Uncategorized'} 
            imageUrl={item.img}
            onAdd={() => {
              add({
                id: item.id,
                title: item.title,
                price: item.price,
                imageUrl: item.img,
              })
              // Show a brief toast or notification (optional)
            }}
          />
        ))}
      </div>
      {(!isLoading && filtered.length === 0) && <div className="mt-10 text-center text-sm text-muted">No items yet.</div>}
    </div>
  )
}


