import { useState, useRef, useEffect } from 'react';
import { BedDouble, Search, Wrench, Users, DoorOpen, CalendarClock, MoreVertical, Edit2, Trash2, LogOut, IndianRupee, UserPlus, UploadCloud, Plus, CalendarPlus, ArrowRightLeft } from 'lucide-react';
import { useStore } from '../data/store';
import Modal from '../components/Modal';
import './Pages.css';

const statusConfig = {
  occupied: { label: 'Occupied', color: 'var(--success)', bg: 'var(--success-bg)' },
  available: { label: 'Vacant', color: 'var(--success)', bg: 'var(--success-bg)' },
  reserved: { label: 'Reserved', color: 'var(--warning)', bg: 'var(--warning-bg)' },
  maintenance: { label: 'Maintenance', color: 'var(--danger)', bg: 'var(--danger-bg)' },
};

export default function RoomsPage() {
  const { rooms, tenants, updateTenant, deleteTenant, vacateRoom, addPayment, addTenant, addRoom, updateRoom, deleteRoom, toggleRoomMaintenance, navigateWithAction } = useStore();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showVacateModal, setShowVacateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showDeleteRoomModal, setShowDeleteRoomModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [isEditingRoom, setIsEditingRoom] = useState(false);

  // Forms
  const [editData, setEditData] = useState({});
  const [paymentData, setPaymentData] = useState({});
  const [assignData, setAssignData] = useState({});
  const [newRoomData, setNewRoomData] = useState({ number: '', floor: '', type: 'Single', rent: '' });
  const [rentData, setRentData] = useState({ tenantId: '', roomId: '', rentAmount: 0, month: '', paidAmount: '', dueAmount: '', method: 'Cash' });
  const [shiftData, setShiftData] = useState({ tenantId: '', oldRoomId: '', newRoomId: '', tenantName: '' });

  const filtered = rooms.filter(r => {
    const status = r.status;
    const matchFilter = filter === 'all' || status === filter;
    const roomNumber = r.number || '';
    const roomType = r.type || '';
    const matchSearch = roomNumber.toString().includes(search) || roomType.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  }).sort((a, b) => {
    if (a.status === 'available' && b.status !== 'available') return -1;
    if (a.status !== 'available' && b.status === 'available') return 1;
    return 0;
  });

  const getTenant = (tenantId) => tenants.find(t => t.id === tenantId || t._id === tenantId);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const openModal = (room, modalType) => {
    setSelectedRoom(room);
    setActiveMenuId(null);
    if (modalType === 'edit') {
      const tenant = getTenant(room.tenantId);
      if (tenant) {
        setEditData({ ...tenant });
        setShowEditModal(true);
      }
    } else if (modalType === 'delete') {
      setShowDeleteModal(true);
    } else if (modalType === 'vacate') {
      setShowVacateModal(true);
    } else if (modalType === 'payment') {
      const tenant = getTenant(room.tenantId);
      if(tenant) {
        setPaymentData({
            tenantId: tenant._id || tenant.id,
            tenantName: tenant.name,
            roomId: room._id || room.id,
            roomNumber: room.number,
            totalAmount: room.rent,
            paidAmount: room.rent,
            dueAmount: 0,
            method: 'Cash',
            notes: ''
        });
        setShowPaymentModal(true);
      }
    } else if (modalType === 'assign') {
      navigateWithAction('tenants', { type: 'add', roomId: room._id || room.id });
    } else if (modalType === 'deleteRoom') {
      setShowDeleteRoomModal(true);
    } else if (modalType === 'rentcharge') {
      const tenant = getTenant(room.tenantId);
      if (tenant) {
        const now = new Date();
        const monthLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        setRentData({
          tenantId: tenant._id || tenant.id,
          tenantName: tenant.name,
          roomId: room._id || room.id,
          roomNumber: room.number,
          rentAmount: room.rent,
          month: monthLabel,
          paidAmount: '',
          dueAmount: room.rent,
          method: 'Cash',
          date: now.toISOString().split('T')[0],
          paymentFor: 'current'
        });
        setShowRentModal(true);
      }
    } else if (modalType === 'shift') {
      const tenant = getTenant(room.tenantId);
      if (tenant) {
        setShiftData({
          tenantId: tenant._id || tenant.id,
          tenantName: tenant.name,
          oldRoomId: room._id || room.id,
          oldRoomNumber: room.number,
          newRoomId: '',
          rent: room.rent
        });
        setShowShiftModal(true);
      }
    } else if (modalType === 'editRoom') {
      setNewRoomData({
        id: room._id || room.id,
        number: room.number,
        floor: room.floor,
        type: room.type,
        rent: room.rent
      });
      setIsEditingRoom(true);
      setShowAddRoomModal(true);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateTenant(editData.id, editData);
    setShowEditModal(false);
  };

  const handleDeleteTenant = () => {
    deleteTenant(selectedRoom.tenantId);
    setShowDeleteModal(false);
  };

  const handleVacateRoom = () => {
    vacateRoom(selectedRoom._id || selectedRoom.id);
    setShowVacateModal(false);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    addPayment({
        ...paymentData,
        status: paymentData.dueAmount > 0 ? 'pending' : 'completed',
        month: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    });
    setShowPaymentModal(false);
  };

  const handleChargeRent = (e) => {
    e.preventDefault();
    const paid = Number(rentData.paidAmount) || 0;
    const due = Number(rentData.dueAmount) || 0;
    const label = rentData.paymentFor === 'previous' ? 'Previous Dues Payment' : `Monthly Rent - ${rentData.month}`;

    addPayment({
      tenantId: rentData.tenantId,
      tenantName: rentData.tenantName,
      roomId: rentData.roomId,
      roomNumber: rentData.roomNumber,
      totalAmount: rentData.rentAmount,
      paidAmount: paid,
      dueAmount: due,
      method: rentData.method,
      status: due > 0 ? 'pending' : 'completed',
      month: rentData.month,
      date: new Date(rentData.date).toISOString(),
      notes: label
    });

    const tenant = getTenant(rentData.tenantId);
    if (tenant) {
      if (rentData.paymentFor === 'previous') {
        updateTenant(tenant.id, {
          ...tenant,
          pendingDues: Math.max(0, (tenant.pendingDues || 0) - paid)
        });
      } else {
        updateTenant(tenant.id, {
          ...tenant,
          pendingDues: (tenant.pendingDues || 0) + due
        });
      }
    }

    setShowRentModal(false);
  };

  const handleShiftSubmit = async (e) => {
    e.preventDefault();
    if (!shiftData.newRoomId) return alert('Please select a new room');
    
    const newRoom = rooms.find(r => (r._id || r.id) === shiftData.newRoomId);
    if (!newRoom) return;

    try {
      await updateTenant(shiftData.tenantId, {
        roomId: shiftData.newRoomId,
        roomNumber: newRoom.number,
        rent: newRoom.rent // Update rent to the new room's rent
      });
      setShowShiftModal(false);
    } catch (err) {
      alert('Error shifting room. Please try again.');
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    
    // Use uploaded photo preview as avatar if available, otherwise generate dicebear
    const avatar = assignData.photoPreview || `https://api.dicebear.com/9.x/initials/svg?seed=${assignData.name}&backgroundColor=6366f1`;

    // 1. Create Tenant
    const newTenant = await addTenant({
        name: assignData.name,
        phone: assignData.phone,
        email: assignData.email,
        address: assignData.address,
        parentName: assignData.parentName,
        parentPhone: assignData.parentPhone,
        roomId: assignData.roomId,
        roomNumber: assignData.roomNumber,
        rent: assignData.rent,
        deposit: assignData.deposit,
        pendingDues: assignData.dueAmount,
        avatar: avatar
    });

    // 2. Record Initial Payment (Deposit/Advance)
    if (newTenant && (assignData.paidAmount > 0 || assignData.dueAmount > 0)) {
        await addPayment({
            tenantId: newTenant._id || newTenant.id,
            tenantName: newTenant.name,
            roomId: newTenant.roomId,
            roomNumber: newTenant.roomNumber,
            totalAmount: assignData.deposit,
            paidAmount: assignData.paidAmount,
            dueAmount: assignData.dueAmount,
            method: assignData.method,
            status: assignData.dueAmount > 0 ? 'pending' : 'completed',
            month: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
            notes: 'Advance/Deposit payment on allocation'
        });
    }

    setShowAssignModal(false);
  };

  const handleAddRoomSubmit = (e) => {
    e.preventDefault();
    const roomPayload = {
        number: newRoomData.number,
        floor: Number(newRoomData.floor),
        type: newRoomData.type,
        rent: Number(newRoomData.rent)
    };

    if (isEditingRoom) {
        updateRoom(newRoomData.id, roomPayload);
    } else {
        addRoom(roomPayload);
    }
    
    setShowAddRoomModal(false);
    setNewRoomData({ number: '', floor: '', type: 'Single', rent: '' });
    setIsEditingRoom(false);
  };

  const handleDeleteRoom = () => {
    deleteRoom(selectedRoom._id || selectedRoom.id);
    setShowDeleteRoomModal(false);
  };

  const handleToggleMaintenance = (room) => {
    const tenant = room.tenantId ? getTenant(room.tenantId) : null;
    if (tenant && tenant.pendingDues > 0) {
      alert(`Cannot put Room ${room.number} under maintenance. Tenant has pending dues of ₹${tenant.pendingDues.toLocaleString('en-IN')}. Please collect full payment first.`);
      return;
    }
    toggleRoomMaintenance(room._id || room.id);
    setActiveMenuId(null);
  };

  const parseNum = (val) => val === '' ? '' : Number(val);

  const handlePhotoUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
          const previewUrl = URL.createObjectURL(file);
          setAssignData({...assignData, photoFile: file, photoPreview: previewUrl});
      }
  };

  return (
    <div className="page">
      <div className="page-header animate-in">
        <div>
          <h1 className="page-title">Rooms</h1>
          <p className="page-subtitle">Manage all {rooms.length} rooms and tenants</p>
        </div>
      </div>


      <div className="page-toolbar animate-in">
        <div className="toolbar-left">
          <div className="toolbar-search">
            <Search size={16} />
            <input type="text" placeholder="Search room number or type..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="toolbar-filters">
            {['all', 'occupied', 'available', 'reserved', 'maintenance'].map(f => (
              <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : statusConfig[f].label}
              </button>
            ))}
          </div>
        </div>
        <div className="toolbar-right">
            <button className="page-header-btn primary" onClick={() => {
                setIsEditingRoom(false);
                setNewRoomData({ number: '', floor: '', type: 'Single', rent: '' });
                setShowAddRoomModal(true);
            }}>
                <Plus size={16} /> Add Room
            </button>
        </div>
      </div>

      <div className="rooms-grid">
        {filtered.map((room, idx) => {
          const status = statusConfig[room.status];
          const tenant = room.tenantId ? getTenant(room.tenantId) : null;
          return (
            <div key={room._id || room.id} className={`room-card animate-in stagger-${(idx % 8) + 1}`}>
              <div className="room-card-top">
                <div className="room-number">
                  <BedDouble size={16} />
                  <span>{room.number}</span>
                </div>
                <div className="toolbar-right">
                  <span className="room-status-badge" style={{ 
                    background: status.bg, 
                    color: status.color,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {room.status === 'available' && (
                      <>
                        <style>{`
                          @keyframes blink-dot {
                            0% { opacity: 0.4; }
                            50% { opacity: 1; }
                            100% { opacity: 0.4; }
                          }
                        `}</style>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: 'var(--success)',
                          borderRadius: '50%',
                          animation: 'blink-dot 1.2s infinite ease-in-out',
                          boxShadow: '0 0 6px var(--success)'
                        }} />
                      </>
                    )}
                    {status.label}
                  </span>
                  
                  <div className="action-menu-container">
                    <button className="action-menu-btn" onClick={(e) => { e.stopPropagation(); const rid = room._id || room.id; setActiveMenuId(activeMenuId === rid ? null : rid); }}>
                      <MoreVertical size={16} />
                    </button>
                    {activeMenuId === (room._id || room.id) && (
                      <div className="action-menu" onClick={(e) => e.stopPropagation()}>
                        {tenant ? (
                          <>
                            <button className="action-menu-item" onClick={() => openModal(room, 'edit')}><Edit2 size={14} /> Edit Tenant</button>
                            <button className="action-menu-item" onClick={() => openModal(room, 'shift')}><ArrowRightLeft size={14} /> Shift Room</button>
                            <button className="action-menu-item" onClick={() => openModal(room, 'editRoom')}><Edit2 size={14} /> Edit Room Details</button>
                            <button className="action-menu-item" onClick={() => handleToggleMaintenance(room)}><Wrench size={14} /> Toggle Maintenance</button>
                            <button className="action-menu-item" onClick={() => openModal(room, 'vacate')}><LogOut size={14} /> Vacate Room</button>
                            <button className="action-menu-item danger" onClick={() => openModal(room, 'delete')}><Trash2 size={14} /> Delete Tenant</button>
                          </>
                        ) : (
                          <>
                            {room.status !== 'maintenance' && <button className="action-menu-item" onClick={() => openModal(room, 'assign')}><UserPlus size={14} /> Assign Tenant</button>}
                            <button className="action-menu-item" onClick={() => openModal(room, 'editRoom')}><Edit2 size={14} /> Edit Room Details</button>
                            <button className="action-menu-item" onClick={() => handleToggleMaintenance(room)}><Wrench size={14} /> Toggle Maintenance</button>
                            <button className="action-menu-item danger" onClick={() => openModal(room, 'deleteRoom')}><Trash2 size={14} /> Delete Room</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>
              <div className="room-card-body">
                <div className="room-detail">
                  <span className="room-detail-label">Type</span>
                  <span className="room-detail-value">{room.type}</span>
                </div>
                <div className="room-detail">
                  <span className="room-detail-label">Floor</span>
                  <span className="room-detail-value">{room.floor}</span>
                </div>
                <div className="room-detail">
                  <span className="room-detail-label">Rent</span>
                  <span className="room-detail-value">₹{room.rent.toLocaleString('en-IN')}</span>
                </div>
                {tenant && (
                  <div className="room-tenant">
                    <img src={tenant.avatar} alt="" className="room-tenant-avatar" />
                    <div className="room-tenant-info">
                      <div className="room-tenant-name">{tenant.name}</div>
                      <div className="room-tenant-phone">{tenant.phone}</div>
                      {tenant.parentName && <div className="room-tenant-phone" style={{fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px'}}>Guardian: {tenant.parentName}</div>}
                    </div>
                    {tenant.pendingDues > 0 && (
                        <div className="room-tenant-dues">
                            ₹{tenant.pendingDues.toLocaleString()} Due
                        </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="page-empty">No rooms match your filters</div>}

      {/* Edit Tenant Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Tenant Details">
        <form onSubmit={handleEditSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input type="text" className="form-input" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="tel" className="form-input" value={editData.phone || ''} onChange={e => setEditData({...editData, phone: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={editData.email || ''} onChange={e => setEditData({...editData, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Room Number</label>
              <select className="form-select" value={editData.roomId || ''} onChange={e => {
                  const r = rooms.find(room => (room._id || room.id).toString() === e.target.value.toString());
                  setEditData({...editData, roomId: r._id || r.id, roomNumber: r.number});
              }}>
                <option value={editData.roomId}>{editData.roomNumber} (Current)</option>
                {rooms.filter(r => r.status === 'available').map(r => (
                  <option key={r._id || r.id} value={r._id || r.id}>{r.number} ({r.type})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Rent (₹)</label>
              <input type="number" className="form-input" value={editData.rent ?? ''} onChange={e => setEditData({...editData, rent: parseNum(e.target.value)})} />
            </div>
            <div className="form-group">
              <label className="form-label">Pending Dues (₹)</label>
              <input type="number" className="form-input" value={editData.pendingDues ?? ''} onChange={e => setEditData({...editData, pendingDues: parseNum(e.target.value)})} />
            </div>
            <div className="form-group full">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={editData.notes || ''} onChange={e => setEditData({...editData, notes: e.target.value})}></textarea>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Delete Tenant Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Tenant" maxWidth="400px">
        <div style={{color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5'}}>
          Are you sure you want to permanently delete <strong>{selectedRoom?.tenantId ? getTenant(selectedRoom.tenantId)?.name : ''}</strong>? 
          This action cannot be undone. All payment records will remain for accounting, but the tenant profile will be removed and Room {selectedRoom?.number} will become available.
        </div>
        <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDeleteTenant}>Delete Tenant</button>
        </div>
      </Modal>

      {/* Delete Room Modal */}
      <Modal isOpen={showDeleteRoomModal} onClose={() => setShowDeleteRoomModal(false)} title="Delete Room" maxWidth="400px">
        <div style={{color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5'}}>
          Are you sure you want to permanently delete Room <strong>{selectedRoom?.number}</strong>? 
          This action cannot be undone.
        </div>
        <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShowDeleteRoomModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDeleteRoom}>Delete Room</button>
        </div>
      </Modal>

      {/* Vacate Room Modal */}
      <Modal isOpen={showVacateModal} onClose={() => setShowVacateModal(false)} title="Vacate Room" maxWidth="400px">
        <div style={{color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5'}}>
          Are you sure you want to vacate Room {selectedRoom?.number}? The tenant will be marked as archived and the room will be made Available.
        </div>
        <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShowVacateModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleVacateRoom}>Vacate Room</button>
        </div>
      </Modal>

      {/* Charge Monthly Rent Modal */}
      <Modal isOpen={showRentModal} onClose={() => setShowRentModal(false)} title={`Charge Monthly Rent - Room ${selectedRoom?.number}`}>
        <form onSubmit={handleChargeRent}>
          {/* Payment For selector */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Payment For</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className={`filter-btn ${rentData.paymentFor === 'current' ? 'active' : ''}`} onClick={() => setRentData({...rentData, paymentFor: 'current'})}>
                Current Month Rent
              </button>
              <button type="button" className={`filter-btn ${rentData.paymentFor === 'previous' ? 'active' : ''}`} onClick={() => setRentData({...rentData, paymentFor: 'previous'})}>
                Previous Dues Payment
              </button>
            </div>
          </div>

          <div style={{padding: '12px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', marginBottom: '20px', border: '1px solid var(--border-primary)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
              <span style={{color: 'var(--text-secondary)', fontSize: '13px'}}>Month</span>
              <span style={{fontWeight: 600, fontSize: '14px'}}>{rentData.month}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <span style={{color: 'var(--text-secondary)', fontSize: '13px'}}>Rent Amount</span>
              <span style={{fontWeight: 700, fontSize: '16px', color: 'var(--accent-primary)'}}>₹{(rentData.rentAmount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Payment Date</label>
              <input type="date" className="form-input" value={rentData.date || ''} onChange={e => setRentData({...rentData, date: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Paid Now (₹)</label>
              <input type="number" className="form-input" placeholder="0" value={rentData.paidAmount ?? ''} onChange={e => {
                const val = parseNum(e.target.value);
                setRentData({...rentData, paidAmount: val, dueAmount: Math.max(0, rentData.rentAmount - (Number(val) || 0))});
              }} />
            </div>
            <div className="form-group">
              <label className="form-label">Due Amount (₹)</label>
              <input type="number" className="form-input" value={rentData.dueAmount ?? ''} readOnly style={{opacity: 0.7}} />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={rentData.method} onChange={e => setRentData({...rentData, method: e.target.value})}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Google Pay">Google Pay</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Paytm">Paytm</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowRentModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary"><CalendarPlus size={16}/> {rentData.paymentFor === 'previous' ? 'Record Payment' : 'Charge Rent'}</button>
          </div>
        </form>
      </Modal>

      {/* Add Payment Modal */}


      {/* Assign Tenant Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title={`Assign Tenant - Room ${selectedRoom?.number}`} maxWidth="700px">
        <form onSubmit={handleAssignSubmit}>
          <h3 className="profile-section-title" style={{ marginTop: 0 }}>Tenant Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Tenant Name</label>
              <input type="text" className="form-input" value={assignData.name || ''} onChange={e => setAssignData({...assignData, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Tenant Contact</label>
              <input type="tel" className="form-input" value={assignData.phone || ''} onChange={e => setAssignData({...assignData, phone: e.target.value})} required />
            </div>
            <div className="form-group full">
              <label className="form-label">Address</label>
              <input type="text" className="form-input" value={assignData.address || ''} onChange={e => setAssignData({...assignData, address: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Tenant Photo</label>
              <div className={`file-upload-box ${assignData.photoFile ? 'uploaded' : ''}`}>
                <UploadCloud size={20} style={{color: assignData.photoFile ? 'var(--success)' : 'inherit'}}/>
                <span style={{color: assignData.photoFile ? 'var(--success)' : 'inherit', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                    {assignData.photoFile ? assignData.photoFile.name : 'Upload Photo'}
                </span>
                {assignData.photoPreview && <img src={assignData.photoPreview} alt="preview" style={{width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', marginLeft: 'auto'}}/>}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tenant Aadhaar Card</label>
              <div className={`file-upload-box ${assignData.tenantAadhaar ? 'uploaded' : ''}`}>
                <UploadCloud size={20} style={{color: assignData.tenantAadhaar ? 'var(--success)' : 'inherit'}} />
                <span style={{color: assignData.tenantAadhaar ? 'var(--success)' : 'inherit', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                    {assignData.tenantAadhaar ? assignData.tenantAadhaar.name : 'Upload Aadhaar'}
                </span>
                <input type="file" accept="image/*,.pdf" onChange={e => setAssignData({...assignData, tenantAadhaar: e.target.files[0]})} />
              </div>
            </div>
          </div>

          <h3 className="profile-section-title" style={{ marginTop: '24px' }}>Parent/Guardian Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Parent's Name</label>
              <input type="text" className="form-input" value={assignData.parentName || ''} onChange={e => setAssignData({...assignData, parentName: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Parent's Contact</label>
              <input type="tel" className="form-input" value={assignData.parentPhone || ''} onChange={e => setAssignData({...assignData, parentPhone: e.target.value})} required />
            </div>
            <div className="form-group full">
              <label className="form-label">Parent's Aadhaar Card</label>
              <div className={`file-upload-box ${assignData.parentAadhaar ? 'uploaded' : ''}`}>
                <UploadCloud size={20} style={{color: assignData.parentAadhaar ? 'var(--success)' : 'inherit'}} />
                <span style={{color: assignData.parentAadhaar ? 'var(--success)' : 'inherit', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                    {assignData.parentAadhaar ? assignData.parentAadhaar.name : 'Upload Parent Aadhaar'}
                </span>
                <input type="file" accept="image/*,.pdf" onChange={e => setAssignData({...assignData, parentAadhaar: e.target.files[0]})} />
              </div>
            </div>
          </div>

          <h3 className="profile-section-title" style={{ marginTop: '24px' }}>Advance & Rent Payment</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Deposit/Advance Total (₹)</label>
              <input type="number" className="form-input" value={assignData.deposit ?? ''} onChange={e => {
                  const val = parseNum(e.target.value);
                  const paid = assignData.paidAmount || 0;
                  setAssignData({...assignData, deposit: val, dueAmount: Math.max(0, val - paid)});
              }} required />
            </div>
            <div className="form-group">
              <label className="form-label">Paid Amount (₹)</label>
              <input type="number" className="form-input" value={assignData.paidAmount ?? ''} onChange={e => {
                  const val = parseNum(e.target.value);
                  const deposit = assignData.deposit || 0;
                  setAssignData({...assignData, paidAmount: val, dueAmount: Math.max(0, deposit - val)});
              }} required />
            </div>
            <div className="form-group">
              <label className="form-label">Due Amount (₹)</label>
              <input type="number" className="form-input" value={assignData.dueAmount ?? ''} onChange={e => setAssignData({...assignData, dueAmount: parseNum(e.target.value)})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={assignData.method || 'Cash'} onChange={e => setAssignData({...assignData, method: e.target.value})}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowAssignModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary"><UserPlus size={16}/> Allocate Room & Save</button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Room Modal */}
      <Modal isOpen={showAddRoomModal} onClose={() => setShowAddRoomModal(false)} title={isEditingRoom ? "Edit Room Details" : "Add New Room"} maxWidth="500px">
        <form onSubmit={handleAddRoomSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Room Number</label>
              <input type="text" className="form-input" value={newRoomData.number} onChange={e => setNewRoomData({...newRoomData, number: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Floor</label>
              <input type="number" className="form-input" value={newRoomData.floor} onChange={e => setNewRoomData({...newRoomData, floor: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Room Type</label>
              <select className="form-select" value={newRoomData.type} onChange={e => setNewRoomData({...newRoomData, type: e.target.value})}>
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Flat">Flat</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Rent (₹)</label>
              <input type="number" className="form-input" value={newRoomData.rent} onChange={e => setNewRoomData({...newRoomData, rent: e.target.value})} required />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowAddRoomModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {isEditingRoom ? <><Edit2 size={16}/> Save Changes</> : <><BedDouble size={16}/> Add Room</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Shift Room Modal */}
      <Modal isOpen={showShiftModal} onClose={() => setShowShiftModal(false)} title="Shift Tenant to Another Room">
        <form onSubmit={handleShiftSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <div className="info-banner" style={{ background: 'var(--bg-glass)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                Shifting <strong>{shiftData.tenantName}</strong> from <strong>Room {shiftData.oldRoomNumber}</strong>
              </p>
            </div>
            
            <div className="form-group">
              <label className="form-label">Select Vacant Room *</label>
              <select 
                className="form-select" 
                value={shiftData.newRoomId} 
                onChange={e => setShiftData({...shiftData, newRoomId: e.target.value})}
                required
              >
                <option value="">— Select a Vacant Room —</option>
                {rooms.filter(r => r.status === 'available').map(r => (
                  <option key={r._id || r.id} value={r._id || r.id}>
                    Room {r.number} — {r.type} (Rent: ₹{r.rent.toLocaleString()})
                  </option>
                ))}
              </select>
              {rooms.filter(r => r.status === 'available').length === 0 && (
                <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '8px' }}>
                  ⚠️ No vacant rooms available for shifting.
                </p>
              )}
            </div>
            
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '16px', lineHeight: '1.5' }}>
              Note: Shifting will update the tenant's current room assignment and monthly rent to the new room's rates. All payment history will remain intact.
            </p>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowShiftModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!shiftData.newRoomId}>
              <ArrowRightLeft size={16} /> Confirm Shift
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
