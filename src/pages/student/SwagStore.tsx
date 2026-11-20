import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Sparkles,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  MapPin,
  Phone
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { SwagProductItem, SwagRedemptionItem } from '../../types';

export const SwagStore: React.FC = () => {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<SwagProductItem[]>([]);
  const [redemptions, setRedemptions] = useState<SwagRedemptionItem[]>([]);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'store' | 'my_orders'>('store');

  // Redemption Modal State
  const [redeemModalProduct, setRedeemModalProduct] = useState<SwagProductItem | null>(null);
  const [shippingAddress, setShippingAddress] = useState(
    'NIAT Campus Collection Desk, Academic Block A, Hyderabad'
  );
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [sizePreference, setSizePreference] = useState('L');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchStoreData();
    fetchRedemptions();
  }, [token]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/student/swag/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        if (data.balance) {
          setAvailablePoints(data.balance.available_points || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load store:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRedemptions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/swag/my-redemptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRedemptions(data.redemptions || []);
      }
    } catch (err) {
      console.error('Failed to load redemptions:', err);
    }
  };

  const handleOpenRedeemModal = (product: SwagProductItem) => {
    setActionError(null);
    setActionSuccess(null);
    setRedeemModalProduct(product);
  };

  const handleConfirmRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemModalProduct) return;

    try {
      setIsSubmitting(true);
      setActionError(null);

      const res = await fetch(`${API_BASE_URL}/student/swag/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: redeemModalProduct.id,
          shippingAddress,
          contactPhone,
          sizePreference: redeemModalProduct.category === 'Apparel' ? sizePreference : null
        })
      });

      const data = await res.json();

      if (res.ok) {
        setActionSuccess(data.message);
        setAvailablePoints(data.available_points);
        fetchStoreData();
        fetchRedemptions();
        setTimeout(() => {
          setRedeemModalProduct(null);
          setActionSuccess(null);
          setActiveTab('my_orders');
        }, 1800);
      } else {
        setActionError(data.error || 'Failed to complete redemption.');
      }
    } catch (err: any) {
      setActionError('Network or server error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['All', 'Apparel', 'Accessories', 'Bags'];
  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading merchandise collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header & Balance Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-2">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
            <span>Official Institutional Rewards Store</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            NIAT Swag Store
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Redeem official NIAT & NxtWave branded merchandise using your student referral points.
          </p>
        </div>

        {/* Live Balance Pill */}
        <div className="flex items-center gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-5 py-3.5 rounded-2xl shadow-lg border border-slate-700">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-200 block">
              Available Reward Points
            </span>
            <div className="text-2xl font-black text-amber-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>{availablePoints} pts</span>
            </div>
          </div>
          <Link
            to="/student/referrals"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/20 transition-all"
          >
            + Earn Points
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('store')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'store'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Merchandise Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('my_orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'my_orders'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>My Redemptions</span>
            {redemptions.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900">
                {redemptions.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'store' && (
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab 1: Merchandise Catalog */}
      {activeTab === 'store' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => {
            const canAfford = availablePoints >= product.points_required;
            const inStock = product.stock > 0;

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                {/* Product Image */}
                <div className="relative h-56 bg-slate-100 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                      {product.category}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    {inStock ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold">
                        {product.stock} in stock
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/90 backdrop-blur-md text-white text-[10px] font-bold">
                        Out of stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Reward Price
                      </span>
                      <div className="text-lg font-black text-blue-600 flex items-center gap-1">
                        <span>{product.points_required} Points</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenRedeemModal(product)}
                      disabled={!inStock || !canAfford}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        !inStock
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : canAfford
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {!inStock ? 'Out of Stock' : canAfford ? 'Redeem Now' : 'Need More Points'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: My Redemptions History */}
      {activeTab === 'my_orders' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
          {redemptions.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No Redemptions Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You haven't redeemed any merchandise items yet. Choose an item from the catalog to place an order!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {redemptions.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.product_image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200'}
                      alt={item.product_name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-400">#ORD-{item.id}</span>
                        <h4 className="text-sm font-bold text-slate-900">{item.product_name}</h4>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Points Deducted: <span className="font-bold text-blue-600">{item.points_spent} pts</span>
                        {item.size_preference && <span> • Size: {item.size_preference}</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.shipping_address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-col md:items-end gap-1.5">
                    {item.status === 'Pending' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        Pending Review
                      </span>
                    )}
                    {item.status === 'Approved' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Order Approved
                      </span>
                    )}
                    {item.status === 'Processing' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Package className="w-3.5 h-3.5" />
                        Processing & Packaging
                      </span>
                    )}
                    {item.status === 'Ready for Collection' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        <MapPin className="w-3.5 h-3.5" />
                        Ready for Collection Desk
                      </span>
                    )}
                    {item.status === 'Delivered' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Truck className="w-3.5 h-3.5" />
                        Delivered
                      </span>
                    )}
                    {item.status === 'Rejected' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelled (Points Refunded)
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400">
                      Ordered: {item.created_at ? item.created_at.split(' ')[0] : 'Today'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Redemption Confirmation Modal */}
      {redeemModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                  Redemption Confirmation
                </span>
                <h3 className="text-xl font-bold text-slate-900">{redeemModalProduct.name}</h3>
              </div>
              <button
                onClick={() => setRedeemModalProduct(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {actionSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {actionError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmRedeem} className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Points to be deducted:</span>
                <span className="font-extrabold text-blue-700 text-sm">{redeemModalProduct.points_required} Points</span>
              </div>

              {redeemModalProduct.category === 'Apparel' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Select Size
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['S', 'M', 'L', 'XL'].map(size => (
                      <button
                        type="button"
                        key={size}
                        onClick={() => setSizePreference(size)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          sizePreference === size
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Delivery / Collection Destination
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Campus Desk or Home Address"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Contact Phone Number for Handover
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRedeemModalProduct(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Processing Order...</span>
                  ) : (
                    <>
                      <span>Confirm Redemption</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
