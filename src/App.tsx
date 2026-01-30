import { useEffect, useState } from 'react'
import './App.css'
import { getStats, getRecentOrders, subscribeToOrders, type Stats, type Order } from './services/api'

function App() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const statsData = await getStats()
      const ordersData = await getRecentOrders()
      setStats(statsData)
      setOrders(ordersData)
      setLoading(false)
    }

    loadData()

    const unsubscribe = subscribeToOrders((newOrder) => {
      setOrders(prev => [newOrder, ...prev].slice(0, 10))
      setStats(prev => prev ? {
        ...prev,
        totalOrders: prev.totalOrders + 1,
        pendingOrders: newOrder.status === 'pending' ? prev.pendingOrders + 1 : prev.pendingOrders,
      } : null)
    })

    return unsubscribe
  }, [])

  if (loading) {
    return <div className="loading">Yuklanmoqda...</div>
  }

  const statusColor = {
    pending: '#fbbf24',
    completed: '#10b981',
    cancelled: '#ef4444',
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Заказы на Реал-тайм</h1>
        <p className="subtitle">Бот статистика и мониторинг</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.totalOrders || 0}</div>
          <div className="stat-label">Всего заказов</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalCustomers || 0}</div>
          <div className="stat-label">Клиентов</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-value">{stats?.pendingOrders || 0}</div>
          <div className="stat-label">В ожидании</div>
        </div>
        <div className="stat-card completed">
          <div className="stat-value">{stats?.completedOrders || 0}</div>
          <div className="stat-label">Выполнено</div>
        </div>
      </div>

      <div className="orders-section">
        <h2>Недавние заказы</h2>
        <div className="orders-list">
          {orders.length === 0 ? (
            <div className="empty-state">Заказов нет</div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-customer">
                    <strong>{order.customer?.name || 'Unknown'}</strong>
                    <span className="order-phone">{order.customer?.phone}</span>
                  </div>
                  <span className="order-status" style={{ backgroundColor: statusColor[order.status] }}>
                    {order.status}
                  </span>
                </div>
                <div className="order-details">
                  <div className="order-amount">{order.amount} сум</div>
                  <div className="order-time">
                    {new Date(order.created_at).toLocaleString('uz-UZ')}
                  </div>
                </div>
                {order.description && (
                  <div className="order-description">{order.description}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="info-box">
        <h3>Telegram бот интеграция</h3>
        <p>Отправьте ваш Telegram bot token в переменную окружения <code>TELEGRAM_BOT_TOKEN</code></p>
        <p>Бот автоматически будет отслеживать заказы и обновлять статистику в реальном времени</p>
      </div>
    </div>
  )
}

export default App
