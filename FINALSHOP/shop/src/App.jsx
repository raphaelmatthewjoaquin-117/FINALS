import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { createOrder, getOrders, getProducts, getSalesReport } from './api'

function App() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [report, setReport] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    items: [{ productId: '', quantity: 1 }],
  })
  const [selectedOrder, setSelectedOrder] = useState(null)

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  )

  useEffect(() => {
    loadData()
  }, [search, category, showLowStock])

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [productData, orderData, reportData] = await Promise.all([
        getProducts({ search, category, lowStock: showLowStock }),
        getOrders(),
        getSalesReport(),
      ])
      setProducts(productData)
      setOrders(orderData)
      setReport(reportData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load inventory data.')
    } finally {
      setLoading(false)
    }
  }

  function updateOrderItem(index, field, value) {
    setOrderForm((current) => {
      const items = [...current.items]
      items[index] = { ...items[index], [field]: value }
      return { ...current, items }
    })
  }

  function addOrderItem() {
    setOrderForm((current) => ({
      ...current,
      items: [...current.items, { productId: '', quantity: 1 }],
    }))
  }

  function removeOrderItem(index) {
    setOrderForm((current) => ({
      ...current,
      items: current.items.filter((_, idx) => idx !== index),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      const orderPayload = {
        customerName: orderForm.customerName,
        items: orderForm.items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
        })),
      }

      await createOrder(orderPayload)
      setOrderForm({ customerName: '', items: [{ productId: '', quantity: 1 }] })
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create order.')
    }
  }

  return (
    <div className="inventory-shell">
      <header className="app-header">
        <div>
          <h1>Inventory Management</h1>
          <p>Track products, low stock alerts, sales analytics, and orders in one place.</p>
        </div>
      </header>

      <main>
        <section className="top-panel">
          <div className="filter-card">
            <h2>Inventory catalog</h2>
            <div className="filter-row">
              <label>
                Search
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Product or category" />
              </label>
              <label>
                Category
                <select className="category-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>
              <label className="low-stock-toggle">
                <input type="checkbox" checked={showLowStock} onChange={(e) => setShowLowStock(e.target.checked)} />
                Show low stock only
              </label>
            </div>
          </div>

          <div className="report-card">
            <h2>Sales snapshot</h2>
            {report ? (
              <div className="report-grid">
                <div>
                  <span>{report.productCount}</span>
                  <p>Products</p>
                </div>
                <div>
                  <span>{report.totalOrders}</span>
                  <p>Orders</p>
                </div>
                <div>
                  <span>${report.totalRevenue.toFixed(2)}</span>
                  <p>Revenue</p>
                </div>
                <div>
                  <span>{report.lowStockCount}</span>
                  <p>Low stock items</p>
                </div>
              </div>
            ) : (
              <p>Loading report...</p>
            )}
          </div>
        </section>

        {error && <div className="error-bar">{error}</div>}

        <section className="content-grid">
          <div className="product-panel">
            <div className="panel-header">
              <h2>Products</h2>
              <span>{loading ? 'Loading…' : `${products.length} items`}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className={product.stock <= 5 ? 'low-stock-row' : ''}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.stock}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>{product.stock <= 5 ? 'Low stock' : 'In stock'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="order-panel">
            <div className="panel-header">
              <h2>Place a new order</h2>
            </div>
            <form onSubmit={handleSubmit} className="order-form">
              <label>
                Customer name
                <input
                  value={orderForm.customerName}
                  onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                  placeholder="Enter customer name"
                  required
                />
              </label>

              {orderForm.items.map((item, index) => (
                <div className="order-item" key={index}>
                  <select
                    className="product-select"
                    value={item.productId}
                    onChange={(e) => updateOrderItem(index, 'productId', e.target.value)}
                    required
                  >
                    <option value="">Choose product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.stock} available)
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateOrderItem(index, 'quantity', Number(e.target.value))}
                  />
                  <button type="button" className="remove-button" onClick={() => removeOrderItem(index)}>
                    Remove
                  </button>
                </div>
              ))}

              <button type="button" className="add-button" onClick={addOrderItem}>
                + Add item
              </button>
              <button type="submit" className="primary-button">
                Submit order
              </button>
            </form>

              <div className="orders-summary">
              <h3>Latest orders</h3>
              {orders.slice(0, 5).map((order) => (
                <div
                  className="order-card"
                  key={order.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedOrder(order)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedOrder(order)}
                >
                  <div className="order-card-heading">
                    <strong>{order.customerName}</strong>
                    <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                  </div>
                  <p>{order.items.length} item(s)</p>
                  <p className="order-total">${order.totalAmount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="best-seller-panel">
          <h2>Best sellers</h2>
          {report ? (
            <div className="best-seller-grid">
              {report.bestSellers.map((item) => (
                <div key={item.name} className="best-seller-card">
                  <p>{item.name}</p>
                  <strong>{item.totalSold} sold</strong>
                </div>
              ))}
            </div>
          ) : (
            <p>Loading best sellers…</p>
          )}
        </section>
      </main>
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order #{selectedOrder.id}</h3>
              <button className="close-button" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Customer:</strong> {selectedOrder.customerName}
              </p>
              <p>
                <strong>Date:</strong> {new Date(selectedOrder.orderDate).toLocaleString()}
              </p>
              <table className="order-detail-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((it) => (
                    <tr key={it.id || `${it.productId}-${Math.random()}`}>
                      <td>{it.productName}</td>
                      <td>{it.quantity}</td>
                      <td>${it.unitPrice.toFixed(2)}</td>
                      <td>${(it.quantity * it.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="modal-footer">
                <strong>Total: ${selectedOrder.totalAmount.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
