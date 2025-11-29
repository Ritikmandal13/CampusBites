type OrderStatus = 'NEW'|'ACCEPTED'|'PREPARING'|'READY'|'COMPLETED'|'CANCELLED'
type PaymentStatus = 'PENDING'|'SUCCESS'|'FAILED'|'REFUNDED'

type Props = { 
  status: OrderStatus | PaymentStatus
  type?: 'order' | 'payment'
}

export function StatusBadge({ status, type = 'order' }: Props) {
  const orderStyles: Record<OrderStatus, string> = {
    NEW: 'bg-orange-50 text-orange-700 border-orange-200',
    ACCEPTED: 'bg-amber-50 text-amber-700 border-amber-200',
    PREPARING: 'bg-blue-50 text-blue-700 border-blue-200',
    READY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    COMPLETED: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  }

  const paymentStyles: Record<PaymentStatus, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    SUCCESS: 'bg-green-50 text-green-700 border-green-200',
    FAILED: 'bg-red-50 text-red-700 border-red-200',
    REFUNDED: 'bg-purple-50 text-purple-700 border-purple-200',
  }

  const styles = type === 'payment' ? paymentStyles : orderStyles
  const style = styles[status as keyof typeof styles] || 'bg-neutral-100 text-neutral-700 border-neutral-200'
  
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}>
      {status}
    </span>
  )
}


