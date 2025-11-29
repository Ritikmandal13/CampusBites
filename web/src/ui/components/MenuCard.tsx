import { Badge } from './Badge'

type Props = {
  title: string
  price: string
  category: string
  imageUrl?: string
  onAdd?: () => void
}

export function MenuCard({ title, price, category, imageUrl, onAdd }: Props) {
  return (
    <div className="card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <div className="aspect-[16/9] w-full bg-white/5">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-neutral-100" />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-medium text-base leading-tight">{title}</div>
            <Badge className="mt-2">{category}</Badge>
          </div>
          <div className="text-primary font-semibold">{price}</div>
        </div>
        <div className="mt-4 flex justify-end">
          <button 
            className="btn-primary"
            onClick={(e) => {
              e.stopPropagation()
              onAdd?.()
            }}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  )
}


