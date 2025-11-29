import React, { createContext, useContext, useMemo, useReducer } from 'react'

export type CartItem = {
  id: string
  title: string
  price: number
  qty: number
  imageUrl?: string
}

type State = {
  items: CartItem[]
  canteenId?: number | null
  qrId?: string | null
  tableNo?: string | null
}

type Action =
  | { type: 'ADD'; item: Omit<CartItem, 'qty'>; qty?: number }
  | { type: 'REMOVE'; id: string }
  | { type: 'SET_QTY'; id: string; qty: number }
  | { type: 'CLEAR' }
  | { type: 'SET_CANTEEN'; canteenId: number | null; qrId?: string | null; tableNo?: string | null }

function cartReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find(i => i.id === action.item.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map(i => i.id === action.item.id ? { ...i, qty: i.qty + (action.qty ?? 1) } : i),
        }
      }
      return { ...state, items: [...state.items, { ...action.item, qty: action.qty ?? 1 }] }
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i.id !== action.id) }
    case 'SET_QTY':
      return { ...state, items: state.items.map(i => i.id === action.id ? { ...i, qty: Math.max(0, action.qty) } : i).filter(i => i.qty > 0) }
    case 'CLEAR':
      return { items: [], canteenId: null, qrId: null, tableNo: null }
    case 'SET_CANTEEN':
      return { ...state, canteenId: action.canteenId, qrId: action.qrId ?? null, tableNo: action.tableNo ?? null }
    default:
      return state
  }
}

type CartContextValue = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  remove: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
  setCanteen: (canteenId: number | null, qrId?: string | null, tableNo?: string | null) => void
  count: number
  subtotal: number
  canteenId?: number | null
  qrId?: string | null
  tableNo?: string | null
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((n, i) => n + i.qty, 0)
    const subtotal = state.items.reduce((n, i) => n + i.qty * i.price, 0)
    return {
      items: state.items,
      add: (item, qty) => dispatch({ type: 'ADD', item, qty }),
      remove: (id) => dispatch({ type: 'REMOVE', id }),
      setQty: (id, qty) => dispatch({ type: 'SET_QTY', id, qty }),
      clear: () => dispatch({ type: 'CLEAR' }),
      setCanteen: (canteenId, qrId, tableNo) => dispatch({ type: 'SET_CANTEEN', canteenId, qrId, tableNo }),
      count,
      subtotal,
      canteenId: state.canteenId,
      qrId: state.qrId,
      tableNo: state.tableNo,
    }
  }, [state.items, state.canteenId, state.qrId, state.tableNo])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}


