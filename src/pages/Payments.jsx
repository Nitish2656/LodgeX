import { useState, useMemo, useEffect } from 'react';
import { Search, IndianRupee, CreditCard, Banknote, Smartphone, Plus, Edit2, Trash2 } from 'lucide-react';
import { useStore } from '../data/store';
import Modal from '../components/Modal';
import './Pages.css';

const methodIcons = { Cash: Banknote, UPI: Smartphone, 'Bank Transfer': CreditCard };

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
            {['all', 'Cash', 'UPI', 'Bank Transfer', 'Google Pay', 'PhonePe', 'Paytm', 'Card'].map(f => (
                <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All Methods' : f}
                </button>
            ))}
            </div>
        </div>
        <div className="toolbar-right">
        </div>
      </div>

      <div className="table-wrapper animate-in">
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
                    <div className="method-badge">
                      <MethodIcon size={12} />
                      {p.method}
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
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Google Pay">Google Pay</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Paytm">Paytm</option>
                <option value="Other">Other</option>
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
