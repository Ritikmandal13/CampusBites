type Props = { status: 'NEW'|'ACCEPTED'|'PREPARING'|'READY'|'COMPLETED'|'CANCELLED' }

export function StatusBadge({ status }: Props) {
  const styles: Record<Props['status'], string> = {
    NEW: 'bg-orange-50 text-orange-700 border-orange-200',
    ACCEPTED: 'bg-amber-50 text-amber-700 border-amber-200',
    PREPARING: 'bg-blue-50 text-blue-700 border-blue-200',
    READY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    COMPLETED: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${styles[status]}`}>
      {status}
    </span>
  )
}


