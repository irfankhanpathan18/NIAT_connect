import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Search,
  RotateCcw,
  Check,
  AlertCircle
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { SwagProductItem, SwagRedemptionItem, RedemptionStatus } from '../../types';

export const SwagStoreManagement: React.FC = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState<SwagProductItem[]>([]);
  const [redemptions, setRedemptions] = useState<SwagRedemptionItem[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('orders');

  // Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SwagProductItem | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: 'Apparel',
    points_required: 10,
    stock: 20,
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
    status: 'ACTIVE'
  });

  // Reject Order Modal
  const [rejectingOrder, setRejectingOrder] = useState<SwagRedemptionItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Out of stock or delivery location unserviceable');

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, redRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/swag/products`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/admin/swag/redemptions`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      }
      if (redRes.ok) {
        const redData = await redRes.json();
        setRedemptions(redData.redemptions || []);
        if (redData.analytics) setAnalytics(redData.analytics);
      }
    } catch (err) {
      console.error('Failed to load swag data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: 'Official NIAT Institutional Merchandise',
      category: 'Apparel',
      points_required: 10,
      stock: 20,
      image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
      status: 'ACTIVE'
    });
    setShowProductModal(true);
  };

  const handleOpenEditModal = (p: SwagProductItem) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description,
      category: p.category,
      points_required: p.points_required,
      stock: p.stock,
      image_url: p.image_url,
      status: p.status
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct
        ? `${API_BASE_URL}/admin/swag/products/${editingProduct.id}`
        : `${API_BASE_URL}/admin/swag/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(productForm)
      });

      if (res.ok) {
        setShowProductModal(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save product');
      }
    } catch (err: any) {
      alert('Error saving product: ' + err.message);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this merchandise product?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/swag/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: RedemptionStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/swag/redemptions/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleConfirmRejectOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingOrder) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/swag/redemptions/${rejectingOrder.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (res.ok) {
        setRejectingOrder(null);
        fetchData();
      }
    } catch (err) {
      console.error('Reject order failed:', err);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-2">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
            <span>Merchandise & Rewards Store Operations</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            NIAT Swag Store Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage merchandise inventory, point redemption costs, stock availability, and fulfill student orders.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Merchandise Item</span>
        </button>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Redemptions</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{analytics.total_redemptions || 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-600 block">Pending Fulfillment</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{analytics.pending_count || 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-600 block">Delivered Orders</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{analytics.delivered_count || 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-blue-600 block">Reward Points Spent</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{analytics.total_points_redeemed || 0} pts</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Redemption Orders ({redemptions.length})
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'inventory'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Merchandise Inventory ({products.length})
        </button>
      </div>

      {/* TAB 1: REDEMPTION ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          {redemptions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No merchandise redemption orders placed yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Order ID</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Item & Size</th>
                    <th className="py-3.5 px-4">Points</th>
                    <th className="py-3.5 px-4">Delivery / Desk</th>
                    <th className="py-3.5 px-4">Order Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {redemptions.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        #ORD-{order.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{order.student_name}</div>
                        <div className="text-[11px] text-slate-400">{order.student_email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {order.product_name}
                        {order.size_preference && (
                          <span className="ml-1 text-[11px] text-slate-500 font-normal">
                            ({order.size_preference})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-600">
                        {order.points_spent} pts
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate text-[11px]">
                        {order.shipping_address}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={order.status}
                          disabled={order.status === 'Rejected'}
                          onChange={e => handleUpdateOrderStatus(order.id, e.target.value as RedemptionStatus)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Processing">Processing</option>
                          <option value="Ready for Collection">Ready for Collection</option>
                          <option value="Delivered">Delivered</option>
                          {order.status === 'Rejected' && <option value="Rejected">Rejected</option>}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {order.status !== 'Rejected' && order.status !== 'Delivered' && (
                          <button
                            onClick={() => setRejectingOrder(order)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                          >
                            Reject & Refund
                          </button>
                        )}
                        {order.status === 'Rejected' && (
                          <span className="text-[11px] text-rose-600 font-medium">Refunded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVENTORY CATALOG */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div className="relative h-48 bg-slate-100">
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] font-bold">
                    {p.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/95 text-slate-900 font-bold text-xs shadow-sm">
                    Stock: {p.stock}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                  <span className="text-sm font-extrabold text-blue-600 whitespace-nowrap">
                    {p.points_required} pts
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {p.status}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <h3 className="text-lg font-bold text-slate-900">
              {editingProduct ? 'Edit Merchandise Product' : 'Add New Merchandise Product'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. NIAT Signature T-Shirt"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    <option value="Apparel">Apparel</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Bags">Bags</option>
                    <option value="Tech">Tech</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Required Points</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={productForm.points_required}
                    onChange={e => setProductForm({ ...productForm, points_required: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={productForm.status}
                    onChange={e => setProductForm({ ...productForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={e => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Order Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Cancel Order #{rejectingOrder.id} & Refund Points
            </h3>
            <p className="text-xs text-slate-500">
              Cancelling will restock the item and automatically credit <strong>{rejectingOrder.points_spent} reward points</strong> back to student ({rejectingOrder.student_name}).
            </p>

            <form onSubmit={handleConfirmRejectOrder} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Reason for cancellation</label>
                <input
                  type="text"
                  required
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm"
                >
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
