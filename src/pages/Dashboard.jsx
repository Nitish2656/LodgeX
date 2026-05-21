import { useState, useEffect, useRef } from 'react';
import {
  BedDouble, Users, DoorOpen, CalendarClock, TrendingUp, TrendingDown,
  IndianRupee, PiggyBank, AlertTriangle, Plus, CreditCard, Download,
  Database, ArrowUpRight, ArrowDownRight, Clock, Wrench, MoveRight, Zap
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend
} from 'recharts';
import { useStore } from '../data/store';
import Modal from '../components/Modal';
import './Dashboard.css';

// Animated counter hook
function useAnimatedCounter(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    let startTime = null;
    const start = 0;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(start + (target - start) * eased));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [target, duration]);

  return count;
}

function StatCard({ icon: Icon, label, value, prefix = '', suffix = '', trend, trendValue, color, delay }) {
  const numVal = typeof value === 'number' ? value : parseInt(value) || 0;
  const animated = useAnimatedCounter(numVal);
  const displayVal = prefix + animated.toLocaleString('en-IN') + suffix;

  return (
    <div className={`stat-card animate-in stagger-${delay}`} style={{ '--card-accent': color }}>
      <div className="stat-card-glow" />
      <div className="stat-card-header">
        <div className="stat-card-icon" style={{ background: `${color}15`, color }}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={`stat-card-trend ${trend === 'up' ? 'positive' : 'negative'}`}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="stat-card-value">{displayVal}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

const chartTooltipStyle = {
  contentStyle: {
    background: 'rgba(15, 15, 24, 0.95)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#f0f0f5',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  itemStyle: { color: '#f0f0f5', fontSize: '12px' },
  labelStyle: { color: '#8888a0', fontSize: '12px', marginBottom: '4px' },
};

export default function Dashboard() {
  const {
    rooms, tenants, payments, setActivePage, navigateWithAction,
    occupiedRooms, availableRooms, maintenanceRooms,
    totalPendingDues, monthlyRevenueTotal, monthlyExpenseTotal, monthlyProfit, yearlyProfit,
    totalDepositsCollected, totalMonthlyIncome, pendingElectricity,
    monthlyRevenue, occupancyData, expenseBreakdown,
    addPayment, checkMonthlyBills
  } = useStore();

  useEffect(() => {
    checkMonthlyBills();
  }, []);

  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({});

  const activeTenants = tenants.filter(t => t.status === 'active');
  const parseNum = (val) => val === '' ? '' : Number(val);

  const openAddPayment = () => {
    const firstTenant = activeTenants[0];
    const defaultAmount = firstTenant ? (firstTenant.pendingDues > 0 ? firstTenant.pendingDues : firstTenant.rent) : 0;
    
    setPaymentFormData({
        tenantId: firstTenant?._id || firstTenant?.id || '',
        tenantName: firstTenant?.name || '',
        roomId: firstTenant?.roomId || '',
        roomNumber: firstTenant?.roomNumber || '',
        pendingDues: firstTenant?.pendingDues || 0,
        rent: firstTenant?.rent || 0,
        amount: defaultAmount,
        method: 'Cash',
        notes: firstTenant?.pendingDues > 0 ? 'Clearing pending dues' : 'Monthly rent payment'
    });
    setShowAddPaymentModal(true);
  };

  const handleAddPaymentSubmit = (e) => {
    e.preventDefault();
    const amountPaid = Number(paymentFormData.amount);
    if (!amountPaid || amountPaid <= 0) return alert('Enter a valid amount');
    
    let totalAmount = paymentFormData.pendingDues > 0 ? paymentFormData.pendingDues : paymentFormData.rent;
    let dueAmount = totalAmount - amountPaid;
    if (dueAmount < 0) dueAmount = 0; // Prevent negative dues if they overpay

    addPayment({
        tenantId: paymentFormData.tenantId,
        tenantName: paymentFormData.tenantName,
        roomId: paymentFormData.roomId,
        roomNumber: paymentFormData.roomNumber,
        totalAmount: totalAmount,
        paidAmount: amountPaid,
        dueAmount: dueAmount,
        method: paymentFormData.method,
        status: 'completed',
        notes: (dueAmount > 0 ? `Partial payment (₹${dueAmount.toLocaleString('en-IN')} remaining)` : 'Full payment') + (paymentFormData.notes ? ` - ${paymentFormData.notes}` : ''),
        date: new Date().toISOString(),
        month: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    });
    setShowAddPaymentModal(false);
  };

  const recentPayments = payments.slice(0, 5);
  const dueAlerts = tenants.filter(t => t.pendingDues > 0).slice(0, 5);
  const maintenanceRoomsList = rooms.filter(r => r.status === 'maintenance');

  return (
    <div className="dashboard">
      {/* Page Header */}
      <div className="dashboard-header animate-in">
        <div className="dashboard-header-welcome">
          <div className="dashboard-badge">📊 Overview Dashboard</div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, <span className="admin-highlight">Admin</span>. Here's your lodge overview.
          </p>
        </div>
        <div className="dashboard-header-date">
          <Clock size={14} className="date-icon" />
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <StatCard icon={BedDouble} label="Total Rooms" value={rooms.length} color="#6366f1" delay={1} />
        <StatCard icon={Users} label="Occupied Rooms" value={occupiedRooms} color="#34d399" delay={2} />
        <StatCard icon={DoorOpen} label="Available Rooms" value={availableRooms} color="#60a5fa" delay={3} />
        <StatCard icon={Zap} label="Pending Electricity" value={pendingElectricity} prefix="₹" color="#eab308" delay={4} />
        <StatCard icon={TrendingDown} label="Total Expense" value={monthlyExpenseTotal} prefix="₹" color="#f59e0b" delay={5} />
        <StatCard icon={TrendingUp} label="Monthly Profit" value={monthlyProfit} prefix="₹" color="#34d399" delay={6} />
        <StatCard icon={AlertTriangle} label="Pending Dues" value={totalPendingDues} prefix="₹" color="#f87171" delay={7} />
        <StatCard icon={PiggyBank} label="Yearly Profit" value={yearlyProfit} prefix="₹" color="#a78bfa" delay={8} />
      </div>

      {/* Quick Actions */}
      <div className="quick-actions animate-in">
        <h3 className="section-title">Quick Actions</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-btn" onClick={() => navigateWithAction('tenants', 'add')}>
            <div className="quick-action-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}><Plus size={18} /></div>
            <span>Add Tenant</span>
          </button>
          <button className="quick-action-btn" onClick={openAddPayment}>
            <div className="quick-action-icon" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}><CreditCard size={18} /></div>
            <span>Pay Dues</span>
          </button>
          <button className="quick-action-btn" onClick={() => setActivePage('reports')}>
            <div className="quick-action-icon" style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}><Download size={18} /></div>
            <span>Generate Report</span>
          </button>
          <button className="quick-action-btn" onClick={() => setActivePage('backup')}>
            <div className="quick-action-icon" style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}><Database size={18} /></div>
            <span>Backup Database</span>
          </button>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-card animate-in">
          <div className="chart-card-header">
            <h3>Revenue & Profit</h3>
            <span className="chart-badge">2026</span>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyRevenue.filter(m => m.revenue > 0)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#8888a0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8888a0', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000) >= 1 ? (v/1000).toFixed(1) + 'k' : v}`} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, undefined]} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#gradRevenue)" strokeWidth={2} name="Revenue" />
                <Area type="monotone" dataKey="profit" stroke="#34d399" fill="url(#gradProfit)" strokeWidth={2} name="Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Chart */}
        <div className="chart-card animate-in">
          <div className="chart-card-header">
            <h3>Occupancy Rate</h3>
            <span className="chart-badge">{occupancyData[occupancyData.length - 1]?.rate}%</span>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={occupancyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradOcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#8888a0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8888a0', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [`${v}%`, 'Occupancy']} />
                <Bar dataKey="rate" fill="url(#gradOcc)" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-grid">
        {/* Expense Breakdown */}
        <div className="chart-card animate-in">
          <div className="chart-card-header">
            <h3>Expense Breakdown</h3>
            <span className="chart-badge">May 2026</span>
          </div>
          <div className="chart-body pie-chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {expenseBreakdown.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipStyle} formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, undefined]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {expenseBreakdown.map((e, i) => (
                <div key={i} className="pie-legend-item">
                  <span className="pie-legend-dot" style={{ background: e.color }} />
                  <span className="pie-legend-label">{e.name}</span>
                  <span className="pie-legend-value">₹{(e.value / 1000).toFixed(0)}k</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly P&L */}
        <div className="chart-card animate-in">
          <div className="chart-card-header">
            <h3>Monthly P&L Trend</h3>
            <span className="chart-badge positive">+18%</span>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyRevenue.filter(m => m.revenue > 0)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#8888a0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8888a0', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000) >= 1 ? (v/1000).toFixed(1) + 'k' : v}`} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, undefined]} />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} name="Revenue" />
                <Line type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2} dot={{ r: 4, fill: '#f87171' }} name="Expenses" />
                <Line type="monotone" dataKey="profit" stroke="#34d399" strokeWidth={2} dot={{ r: 4, fill: '#34d399' }} name="Profit" />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#8888a0' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Insights Row */}
      <div className="insights-grid">
        {/* Recent Payments */}
        <div className="insight-card animate-in">
          <div className="insight-card-header">
            <h3>Recent Payments</h3>
            <button className="insight-view-all" onClick={() => setActivePage('payments')}>
              View All <MoveRight size={14} />
            </button>
          </div>
          <div className="insight-list">
            {recentPayments.map(p => {
              const t = tenants.find(tenant => (tenant._id || tenant.id) === p.tenantId);
              return (
              <div key={p._id || p.id} className="insight-list-item">
                <div className="insight-list-icon payment">
                  <IndianRupee size={14} />
                </div>
                <div className="insight-list-info">
                  <span className="insight-list-name">{p.tenantName || t?.name || 'Unknown'}</span>
                  <span className="insight-list-meta">Room {p.roomNumber || (t ? rooms.find(r => (r._id || r.id)?.toString() === t.roomId?.toString())?.number : null) || t?.roomNumber || '-'} • {p.method}</span>
                </div>
                <div className="insight-list-right">
                  <span className="insight-list-amount positive">+₹{p.paidAmount?.toLocaleString('en-IN')}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <span className="insight-list-date" style={{ fontSize: '12px' }}>{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{new Date(p.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* Pending Dues */}
        <div className="insight-card animate-in">
          <div className="insight-card-header">
            <h3>Pending Dues Alerts</h3>
            <span className="insight-count danger">{dueAlerts.length}</span>
          </div>
          <div className="insight-list">
            {dueAlerts.map(t => (
              <div key={t._id || t.id} className="insight-list-item">
                <img src={t.avatar} alt="" className="insight-list-avatar" />
                <div className="insight-list-info">
                  <span className="insight-list-name">{t.name}</span>
                  <span className="insight-list-meta">Room {rooms.find(r => (r._id || r.id)?.toString() === t.roomId?.toString())?.number || t.roomNumber}</span>
                </div>
                <div className="insight-list-right">
                  <span className="insight-list-amount danger">₹{t.pendingDues.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
            {dueAlerts.length === 0 && (
              <div className="insight-empty">No pending dues 🎉</div>
            )}
          </div>
        </div>

        {/* Maintenance */}
        <div className="insight-card animate-in">
          <div className="insight-card-header">
            <h3>Maintenance</h3>
            <span className="insight-count warning">{maintenanceRoomsList.length}</span>
          </div>
          <div className="insight-list">
            {maintenanceRoomsList.map(r => (
              <div key={r._id || r.id} className="insight-list-item">
                <div className="insight-list-icon maintenance">
                  <Wrench size={14} />
                </div>
                <div className="insight-list-info">
                  <span className="insight-list-name">Room {r.number}</span>
                  <span className="insight-list-meta">{r.type} • Floor {r.floor}</span>
                </div>
                <span className="insight-status-badge maintenance">Needs Repair</span>
              </div>
            ))}
            {maintenanceRoomsList.length === 0 && (
              <div className="insight-empty">All rooms operational ✅</div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showAddPaymentModal} onClose={() => setShowAddPaymentModal(false)} title={`Quick Payment - ${activeTenants.find(t => (t._id || t.id) === paymentFormData.tenantId)?.name || 'Select Tenant'}`} maxWidth="420px">
        <form onSubmit={handleAddPaymentSubmit}>
          <div className="payment-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Tenant Selection */}
            <div className="form-group full">
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Select Tenant</label>
                <select className="form-select" style={{ height: '48px', borderRadius: '12px' }} value={paymentFormData.tenantId || ''} onChange={e => {
                    const t = activeTenants.find(tenant => (tenant._id || tenant.id) === e.target.value);
                    const amount = t.pendingDues > 0 ? t.pendingDues : t.rent;
                    setPaymentFormData({
                      ...paymentFormData, 
                      tenantId: t._id || t.id, 
                      tenantName: t.name,
                      roomId: t.roomId,
                      roomNumber: t.roomNumber,
                      pendingDues: t.pendingDues || 0,
                      rent: t.rent || 0,
                      amount: amount, 
                      notes: t.pendingDues > 0 ? 'Clearing pending dues' : 'Monthly rent payment'
                    });
                }} required>
                    {activeTenants.map(t => (
                        <option key={t._id || t.id} value={t._id || t.id}>{t.name} (Room {t.roomNumber})</option>
                    ))}
                </select>
            </div>

            {/* Outstanding Summary */}
            <div className="payment-summary-card" style={{ background: 'rgba(248, 113, 113, 0.05)', borderRadius: '16px', padding: '20px', border: '1px dashed rgba(248, 113, 113, 0.3)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Current Balance</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--danger)', marginTop: '2px' }}>₹{(paymentFormData.pendingDues || 0).toLocaleString('en-IN')}</div>
            </div>

            {/* Arrears Breakdown */}
            <div className="payment-section">
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-primary)', maxHeight: '120px', overflowY: 'auto' }}>
                    {(paymentFormData.pendingDues || 0) > 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--danger)' }}>₹{paymentFormData.pendingDues.toLocaleString('en-IN')}</span>
                        </div>
                    ) : (
                        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>No pending dues.</div>
                    )}
                </div>
            </div>

            {/* Payment Fields */}
            <div className="payment-form-stack" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Amount (₹)</label>
                    <input type="number" className="form-input" style={{ height: '52px', borderRadius: '12px', fontSize: '18px', fontWeight: 700 }} value={paymentFormData.amount ?? ''} onChange={e => setPaymentFormData({...paymentFormData, amount: parseNum(e.target.value)})} required min="1" />
                </div>
                <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Method</label>
                    <select className="form-select" style={{ height: '48px', borderRadius: '12px' }} value={paymentFormData.method || 'Cash'} onChange={e => setPaymentFormData({...paymentFormData, method: e.target.value})}>
                        <option value="Cash">💵 Cash</option>
                        <option value="Online">📱 Online</option>
                    </select>
                </div>
                {paymentFormData.method === 'Online' && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Online Payment Notes / UPI Details</label>
                    <input type="text" className="form-input" style={{ height: '48px', borderRadius: '12px' }} placeholder="e.g. PhonePe - txn_id_12345" value={paymentFormData.notes || ''} onChange={e => setPaymentFormData({...paymentFormData, notes: e.target.value})} />
                  </div>
                )}
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '24px', borderTop: '1px solid var(--border-primary)', paddingTop: '20px' }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowAddPaymentModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, height: '48px', fontWeight: 700 }}>Confirm ₹{(Number(paymentFormData.amount) || 0).toLocaleString('en-IN')}</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
