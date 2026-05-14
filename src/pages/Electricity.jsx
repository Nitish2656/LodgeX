import { useState } from 'react';
import { Zap, Search, CheckCircle, Clock } from 'lucide-react';
import { useStore } from '../data/store';
import './Pages.css';

export default function ElectricityPage() {
  const { electricity } = useStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = electricity.filter(e => {
    const matchSearch = e.tenantName.toLowerCase().includes(search.toLowerCase()) || e.room.includes(search);
    const matchFilter = filter === 'all' || e.status === filter;
    return matchSearch && matchFilter;
  });

  const totalCollection = electricity.filter(e => e.status === 'paid').reduce((s, e) => s + e.totalAmount, 0);
  const totalPending = electricity.filter(e => e.status === 'pending').reduce((s, e) => s + e.totalAmount, 0);

  return (
    <div className="page">
      <div className="page-header animate-in">
        <div>
          <h1 className="page-title">Electricity</h1>
          <p className="page-subtitle">Meter readings and billing management</p>
        </div>
      </div>

      <div className="mini-stats animate-in">
        <div className="mini-stat-card" style={{ '--accent': '#fbbf24' }}>
          <Zap size={18} style={{ color: '#fbbf24' }} />
          <div>
            <div className="mini-stat-value">{electricity.length}</div>
            <div className="mini-stat-label">Total Records</div>
          </div>
        </div>
        <div className="mini-stat-card" style={{ '--accent': '#34d399' }}>
          <CheckCircle size={18} style={{ color: '#34d399' }} />
          <div>
            <div className="mini-stat-value">₹{totalCollection.toLocaleString('en-IN')}</div>
            <div className="mini-stat-label">Collected</div>
          </div>
        </div>
        <div className="mini-stat-card" style={{ '--accent': '#f87171' }}>
          <Clock size={18} style={{ color: '#f87171' }} />
          <div>
            <div className="mini-stat-value">₹{totalPending.toLocaleString('en-IN')}</div>
            <div className="mini-stat-label">Pending</div>
          </div>
        </div>
      </div>

      <div className="page-toolbar animate-in">
        <div className="toolbar-left">
          <div className="toolbar-search">
            <Search size={16} />
            <input type="text" placeholder="Search tenant or room..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="toolbar-filters">
            {['all', 'paid', 'pending'].map(f => (
              <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="table-wrapper animate-in">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Room</th>
              <th>Prev. Reading</th>
              <th>Curr. Reading</th>
              <th>Units</th>
              <th>Rate</th>
              <th>Total</th>
              <th>Month</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e._id || e.id}>
                <td><span className="table-cell-name">{e.tenantName}</span></td>
                <td><span className="table-room-badge">{e.room}</span></td>
                <td>{e.previousReading}</td>
                <td>{e.currentReading}</td>
                <td className="text-bold">{e.unitsConsumed}</td>
                <td>₹{e.ratePerUnit}/unit</td>
                <td className="text-bold">₹{e.totalAmount.toLocaleString('en-IN')}</td>
                <td>{e.month}</td>
                <td>
                  <span className={`status-pill ${e.status}`}>
                    {e.status === 'paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="page-empty">No records found</div>}
      </div>
    </div>
  );
}
