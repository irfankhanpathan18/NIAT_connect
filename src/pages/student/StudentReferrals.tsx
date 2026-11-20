import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Share2,
  Copy,
  Check,
  Gift,
  Users,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { ReferralStats, StudentReferralItem, RewardTransactionItem } from '../../types';

export const StudentReferrals: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [pointsPerReferral, setPointsPerReferral] = useState(25);
  const [stats, setStats] = useState<ReferralStats>({
    total_referrals: 0,
    successful_referrals: 0,
    pending_referrals: 0,
    rejected_referrals: 0,
    total_points_earned: 0,
    available_points: 0,
    redeemed_points: 0
  });
  const [history, setHistory] = useState<StudentReferralItem[]>([]);
  const [transactions, setTransactions] = useState<RewardTransactionItem[]>([]);
  const [activeTab, setActiveTab] = useState<'referrals' | 'ledger'>('referrals');

  useEffect(() => {
    fetchReferralData();
  }, [token]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/student/referrals`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setReferralCode(data.referral_code);
        setPointsPerReferral(data.points_per_referral || 25);
        setStats(data.stats);
        setHistory(data.history || []);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! I'm inviting you to explore NIAT (NextGen Institute of Advanced Technology) for B.Tech in AI & Computer Science. Register with my link and get priority counselling: ${referralLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent('Invitation to explore NIAT B.Tech Admissions 2026');
    const body = encodeURIComponent(
      `Hi,\n\nI wanted to share NextGen Institute of Advanced Technology (NIAT) with you. It is dedicated to modern Computer Science and AI.\n\nYou can register for admissions counselling through my referral link below:\n${referralLink}\n\nReferral Code: ${referralCode}\n\nBest,\nYour Friend`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading referral & points ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-2">
            <Gift className="w-3.5 h-3.5 text-blue-600" />
            <span>Student Ambassador & Referral Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Refer & Earn Reward Points
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Empower your peers to build futuristic tech careers at NIAT and earn points redeemable in the NIAT Swag Store.
          </p>
        </div>

        <Link
          to="/student/swag-store"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-md transition-all self-start md:self-auto group"
        >
          <ShoppingBag className="w-4 h-4 text-amber-400" />
          <span>Redeem Swag ({stats.available_points} pts available)</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Referral Link Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 md:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
                +{pointsPerReferral} Points Per Successful Referral
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold leading-snug">
              Share your link with Class 12 friends interested in Computer Science & AI
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              When a prospective student signs up using your personal code, our admissions team reviews the inquiry. Once verified, +{pointsPerReferral} reward points are credited straight to your balance.
            </p>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleShareWhatsApp}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md flex items-center gap-2"
              >
                <span>Share via WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleShareEmail}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-2"
              >
                <span>Email Invitation</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Your Unique Referral Code
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 font-mono font-bold text-amber-300 text-base tracking-widest text-center shadow-inner">
                  {referralCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md flex items-center justify-center"
                  title="Copy Code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Direct Registration Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs text-slate-300 font-mono truncate focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Referrals</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.total_referrals}</div>
          <span className="text-[11px] text-slate-400">All registered links</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Successful</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.successful_referrals}</div>
          <span className="text-[11px] text-slate-400">Verified by NIAT</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.pending_referrals}</div>
          <span className="text-[11px] text-slate-400">In counselling queue</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Earned</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">{stats.total_points_earned}</div>
          <span className="text-[11px] text-slate-400">Lifetime points</span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold text-blue-800">Available Points</span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700">{stats.available_points}</div>
          <span className="text-[11px] text-blue-600 font-medium">Ready to spend</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Redeemed</span>
            <ShoppingBag className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-700">{stats.redeemed_points}</div>
          <span className="text-[11px] text-slate-400">Spent in Swag Store</span>
        </div>
      </div>

      {/* Main Content Tabs & Tables */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 px-6 pt-4 flex items-center gap-6">
          <button
            onClick={() => setActiveTab('referrals')}
            className={`pb-4 text-xs font-bold transition-all relative ${
              activeTab === 'referrals' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Referral Submissions ({history.length})</span>
            {activeTab === 'referrals' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-4 text-xs font-bold transition-all relative ${
              activeTab === 'ledger' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Points Ledger & Transactions ({transactions.length})</span>
            {activeTab === 'ledger' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: Referral History */}
        {activeTab === 'referrals' && (
          <div className="p-6">
            {history.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">No Referrals Recorded Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Share your link with your school classmates or friends to start earning points.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Referred Peer (Privacy Masked)</th>
                      <th className="py-3.5 px-4">Referral Code</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Reward Points</th>
                      <th className="py-3.5 px-4">Date Submitted</th>
                      <th className="py-3.5 px-4">Notes / Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                            {item.referred_name.slice(0, 1)}
                          </div>
                          <span>{item.referred_name}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{item.referral_code}</td>
                        <td className="py-3.5 px-4">
                          {item.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved (+{item.points_awarded} pts)
                            </span>
                          )}
                          {item.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Under Review
                            </span>
                          )}
                          {item.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {item.points_awarded > 0 ? `+${item.points_awarded}` : '0'} pts
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {item.created_at ? item.created_at.split(' ')[0] : 'Recently'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                          {item.rejection_reason || item.notes || 'Inquiry created'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Transaction Ledger */}
        {activeTab === 'ledger' && (
          <div className="p-6">
            {transactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No ledger transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Tx ID</th>
                      <th className="py-3.5 px-4">Transaction Type</th>
                      <th className="py-3.5 px-4">Description</th>
                      <th className="py-3.5 px-4">Points</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-400">#TX-{tx.id}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {tx.transaction_type}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{tx.description}</td>
                        <td className="py-3.5 px-4 font-bold">
                          {tx.points > 0 ? (
                            <span className="text-emerald-600">+{tx.points} pts</span>
                          ) : (
                            <span className="text-rose-600">{tx.points} pts</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {tx.created_at}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Institutional Guidelines / How It Works */}
      <div className="p-6 rounded-3xl bg-slate-100/70 border border-slate-200/80">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>How the NIAT Referral & Verification Engine Works</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1">
            <div className="font-bold text-blue-600 mb-1">1. Share Your Link</div>
            <p>Your friend registers through your link or inputs your referral code during Class 12 registration.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1">
            <div className="font-bold text-blue-600 mb-1">2. Admissions Verification</div>
            <p>Our admissions director reviews the lead for genuine interest and verified contact information.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1">
            <div className="font-bold text-blue-600 mb-1">3. Points Credited</div>
            <p>Once verified, +{pointsPerReferral} points are awarded immediately to redeem exclusive NIAT merchandise.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
