type Props = {
  value: number
  onChange: (qty: number) => void
}

export function QuantitySelector({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-2">
      <button className="btn-ghost h-8 w-8" onClick={() => onChange(Math.max(0, value - 1))}>-</button>
      <span className="w-6 text-center text-sm">{value}</span>
      <button className="btn-ghost h-8 w-8" onClick={() => onChange(value + 1)}>+</button>
    </div>
  )
}


