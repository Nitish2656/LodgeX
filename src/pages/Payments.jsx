import { useState, useMemo, useEffect } from 'react';
import { Search, IndianRupee, CreditCard, Banknote, Smartphone, Plus, Edit2, Trash2 } from 'lucide-react';
import { useStore } from '../data/store';
import Modal from '../components/Modal';
import './Pages.css';

const methodIcons = { Cash: Banknote, UPI: Smartphone, 'Bank Transfer': CreditCard };

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (name) => {
  if (!name) return '#2563eb';
  const colors = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function PaymentsPage() {
  const { 
    payments, activeTenants, tenants, addPayment, updatePayment, deletePayment,
    pageAction, setPageAction 
  } = useStore();

  useEffect(() => {
    if (pageAction === 'add') {
      openAdd();
      setPageAction(null);
    }
  }, [pageAction, setPageAction]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Forms
  const [formData, setFormData] = useState({});

  const tenantMap = useMemo(() => {
    const map = {};
    tenants.forEach(t => {
      map[t._id || t.id] = t;
    });
    return map;
  }, [tenants]);

  const filtered = useMemo(() => payments.filter(p => {
    if (!p.paidAmount || p.paidAmount <= 0) return false;
    const tenant = tenantMap[p.tenantId];
    const tName = p.tenantName || (tenant ? tenant.name : '');
    const tRoom = p.roomNumber || (tenant ? (tenant.roomNumber || '').toString() : '');
    const matchSearch = tName.toLowerCase().includes(search.toLowerCase()) ||
      tRoom.includes(search);
    const matchFilter = filter === 'all' || p.method === filter;
    return matchSearch && matchFilter;
  }), [payments, tenantMap, search, filter]);

  const totalCollected = useMemo(() => filtered.reduce((s, p) => s + p.paidAmount, 0), [filtered]);

  const getTenantName = (p) => p?.tenantName || tenantMap[p?.tenantId]?.name || 'Unknown';
  const getTenantRoom = (p) => p?.roomNumber || tenantMap[p?.tenantId]?.roomNumber || '-';

  const openAdd = () => {
    const firstTenant = activeTenants[0];
    const defaultAmount = firstTenant ? (firstTenant.pendingDues > 0 ? firstTenant.pendingDues : firstTenant.rent) : 0;
    
    setFormData({
        tenantId: firstTenant?._id || firstTenant?.id || '',
        tenantName: firstTenant?.name || '',
        roomId: firstTenant?.roomId || '',
        roomNumber: firstTenant?.roomNumber || '',
        totalAmount: defaultAmount,
        paidAmount: defaultAmount,
        dueAmount: 0,
        method: 'Cash',
        notes: firstTenant?.pendingDues > 0 ? 'Clearing pending dues' : 'Monthly rent payment'
    });
    setShowAddModal(true);
  };

  const openEdit = (payment) => {
    setSelectedPayment(payment);
    setFormData({ ...payment });
    setShowEditModal(true);
  };

  const openDelete = (payment) => {
    setSelectedPayment(payment);
    setShowDeleteModal(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addPayment({
        ...formData,
        status: 'completed',
        date: new Date().toISOString(),
        month: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    });
    setShowAddModal(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updatePayment(selectedPayment._id || selectedPayment.id, {
        ...formData,
        status: 'completed'
    });
    setShowEditModal(false);
  };

  const handleDelete = () => {
    deletePayment(selectedPayment._id || selectedPayment.id);
    setShowDeleteModal(false);
  };

  const parseNum = (val) => val === '' ? '' : Number(val);

  return (
    <div className="page">
      <div className="page-header animate-in">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">{payments.length} transactions recorded</p>
        </div>
        <div className="page-header-stat">
          <span className="page-header-stat-label">Total Collected</span>
          <span className="page-header-stat-value">₹{totalCollected.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="page-toolbar animate-in">
        <div className="toolbar-left">
            <div className="toolbar-search">
            <Search size={16} />
            <input type="text" placeholder="Search by tenant or room..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="toolbar-filters">
            {['all', 'Cash', 'Online'].map(f => (
                <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All Methods' : f}
                </button>
            ))}
            </div>
        </div>
        <div className="toolbar-right">
        </div>
      </div>

      <>
        <div className="desktop-only table-wrapper animate-in">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Room</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(p => {
                const MethodIcon = methodIcons[p.method] || CreditCard;
                return (
                  <tr key={p._id || p.id}>
                    <td><span className="table-cell-name">{getTenantName(p)}</span></td>
                    <td><span className="table-room-badge">{getTenantRoom(p)}</span></td>
                    <td>₹{(p.totalAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="text-bold text-success">₹{(p.paidAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="text-danger">{p.dueAmount > 0 ? `₹${p.dueAmount.toLocaleString()}` : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div className="method-badge" style={{ width: 'fit-content' }}>
                          <MethodIcon size={12} />
                          {p.method}
                        </div>
                        {p.notes && (() => {
                          let customNote = p.notes;
                          if (customNote.includes(' - ')) customNote = customNote.split(' - ').slice(1).join(' - ');
                          else if (customNote.match(/^(Partial payment|Full payment|Full dues cleared|Advance\/Deposit|Payment on update)/)) customNote = null;
                          return customNote ? (
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={customNote}>
                              {customNote}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', opacity: 0.8 }}>
                          {new Date(p.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                    </td>
                    <td><span className={`status-pill completed`}>completed</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="table-action-btn edit" onClick={() => openEdit(p)} title="Edit"><Edit2 size={14} /></button>
                          <button className="table-action-btn delete" onClick={() => openDelete(p)} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="page-empty">No payments match your search</div>}
        </div>

        <div className="mobile-only animate-in" style={{ flexDirection: 'column', padding: '0 8px', background: 'var(--bg-primary)' }}>
          {filtered.slice(0, 50).map(p => {
            const tName = getTenantName(p);
            return (
              <div key={p._id || p.id} style={{ display: 'flex', alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid var(--border-primary)' }}>
                {/* Avatar */}
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: getAvatarColor(tName), display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', flexShrink: 0, color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                  {getInitials(tName)}
                </div>
                
                {/* Middle Info */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase' }}>
                    {tName}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Room {getTenantRoom(p)} {p.notes ? `• ${p.notes.replace(/\s*\(₹[\d,]+\s*remaining\)/g, '')}` : ''}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date(p.date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </div>
                
                {/* Right Actions & Amount */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', marginLeft: '12px', flexShrink: 0 }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#10b981' }}>+₹{(p.paidAmount || 0).toLocaleString('en-IN')}</span>
                  {p.dueAmount > 0 && <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 600 }}>Due: ₹{p.dueAmount.toLocaleString('en-IN')}</span>}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: p.dueAmount > 0 ? '4px' : '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Via {p.method}</span>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <IndianRupee size={8} strokeWidth={3} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                    <button onClick={() => openEdit(p)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', padding: 0, cursor: 'pointer' }}><Edit2 size={12} /></button>
                    <button onClick={() => openDelete(p)} style={{ background: 'none', border: 'none', color: '#ef4444', padding: 0, cursor: 'pointer' }}><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="page-empty" style={{ border: 'none', background: 'transparent' }}>No payments match your search</div>}
        </div>
      </>



      {/* Edit Payment Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Payment Record">
        <form onSubmit={handleEditSubmit}>
          <div className="form-grid">
            <div className="form-group full">
                <label className="form-label">Tenant</label>
                <input type="text" className="form-input" value={`${getTenantName(formData)} (Room ${getTenantRoom(formData)})`} disabled style={{ opacity: 0.7 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Total Amount (₹)</label>
              <input type="number" className="form-input" value={formData.totalAmount ?? ''} onChange={e => {
                  const val = parseNum(e.target.value);
                  const paid = formData.paidAmount || 0;
                  setFormData({...formData, totalAmount: val, dueAmount: Math.max(0, val - paid)});
              }} required />
            </div>
            <div className="form-group">
              <label className="form-label">Paid Amount (₹)</label>
              <input type="number" className="form-input" value={formData.paidAmount ?? ''} onChange={e => {
                  const val = parseNum(e.target.value);
                  const total = formData.totalAmount || 0;
                  setFormData({...formData, paidAmount: val, dueAmount: Math.max(0, total - val)});
              }} required />
            </div>
            <div className="form-group">
              <label className="form-label">Due Amount (₹)</label>
              <input type="number" className="form-input" value={formData.dueAmount ?? ''} onChange={e => setFormData({...formData, dueAmount: parseNum(e.target.value)})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={formData.method || 'Cash'} onChange={e => setFormData({...formData, method: e.target.value})}>
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={formData.date ? formData.date.split('T')[0] : ''} onChange={e => setFormData({...formData, date: new Date(e.target.value).toISOString()})} />
            </div>
            <div className="form-group full">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" placeholder="Optional notes" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Delete Payment Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Payment" maxWidth="400px">
        <div style={{color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5'}}>
          Are you sure you want to delete this payment of <strong>₹{selectedPayment?.paidAmount?.toLocaleString()}</strong> from {selectedPayment ? getTenantName(selectedPayment) : 'this tenant'}? This action cannot be undone.
        </div>
        <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete Payment</button>
        </div>
      </Modal>

    </div>
  );
}
