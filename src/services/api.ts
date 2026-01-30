import { supabase } from '../lib/supabase'

export interface Order {
  id: string
  customer_id: string
  amount: number
  status: 'pending' | 'completed' | 'cancelled'
  description: string
  created_at: string
  customer?: {
    name: string
    phone: string
  }
}

export interface Customer {
  id: string
  name: string
  phone: string
  created_at: string
}

export interface Stats {
  totalOrders: number
  totalCustomers: number
  pendingOrders: number
  completedOrders: number
}

export async function getStats(): Promise<Stats> {
  const [ordersRes, customersRes, pendingRes, completedRes] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
  ])

  return {
    totalOrders: ordersRes.count || 0,
    totalCustomers: customersRes.count || 0,
    pendingOrders: pendingRes.count || 0,
    completedOrders: completedRes.count || 0,
  }
}

export async function getRecentOrders(limit: number = 10): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      customer_id,
      amount,
      status,
      description,
      created_at,
      customers (
        name,
        phone
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  return (data || []).map(order => ({
    ...order,
    customer: order.customers as any,
  }))
}

export function subscribeToOrders(callback: (order: Order) => void) {
  const subscription = supabase
    .channel('orders-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        const newOrder = payload.new as Order
        callback(newOrder)
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}
