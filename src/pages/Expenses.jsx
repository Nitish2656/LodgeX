import { useState } from 'react';
import { Search, Receipt, TrendingUp, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useStore } from '../data/store';
import Modal from '../components/Modal';
import './Pages.css';

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
};

export default function ExpensesPage() {
  const { expenses, expenseBreakdown, addExpense } = useStore();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ category: 'Electric Repair', description: '', amount: '', date: new Date().toISOString().split('T')[0] });

  const categories = ['Electric Repair', 'Painting', 'Tank Cleaning', 'Bathroom Cleaning'];

  const filtered = expenses.filter(e => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || e.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalExpenses = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="page">
      <div className="page-header animate-in">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Track and manage all lodge expenses</p>
        </div>
        <div className="page-header-stat" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>
            <span className="page-header-stat-label">Total Expenses</span>
            <span className="page-header-stat-value text-danger">₹{totalExpenses.toLocaleString('en-IN')}</span>
          </div>
          <button className="page-header-btn primary" style={{ marginLeft: 'auto' }} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Expense">
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Category</label>
          <select className="form-select" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Description</label>
          <input className="form-input" placeholder="E.g., Rewiring in Room 102" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input className="form-input" type="number" placeholder="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            if(!formData.amount || !formData.description) return alert("Please fill all fields");
            addExpense({
              category: formData.category,
              description: formData.description,
              amount: Number(formData.amount),
              date: new Date(formData.date).toISOString(),
              month: new Date(formData.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
            });
            setShowModal(false);
            setFormData({ category: 'Electric Repair', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
          }}>Save Expense</button>
        </div>
      </Modal>

      {/* Expense Chart */}
      <div className="expense-overview animate-in">
        <div className="expense-chart-card">
          <h3>Category Breakdown</h3>
          <div className="expense-chart-body">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                  {expenseBreakdown.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipStyle} formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, undefined]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend compact">
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
      </div>

      <div className="page-toolbar animate-in">
        <div className="toolbar-left">
          <div className="toolbar-search">
            <Search size={16} />
            <input type="text" placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="toolbar-filters">
            <button className={`filter-btn ${catFilter === 'all' ? 'active' : ''}`} onClick={() => setCatFilter('all')}>All</button>
            {categories.map(c => (
              <button key={c} className={`filter-btn ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="table-wrapper animate-in">
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Month</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e._id || e.id}>
                <td><span className="category-badge">{e.category}</span></td>
                <td>{e.description}</td>
                <td className="text-bold text-danger">₹{e.amount.toLocaleString('en-IN')}</td>
                <td>{e.month}</td>
                <td>{new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="page-empty">No expenses match your filter</div>}
      </div>
    </div>
  );
}
