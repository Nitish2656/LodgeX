import { useState, useRef, useEffect } from 'react';
import { Search, Phone, Mail, MapPin, IndianRupee, FileText, Download, Edit2, Trash2, CalendarClock, ShieldCheck, Plus, UploadCloud, UserX, Camera, Users, History, Image } from 'lucide-react';
import { useStore } from '../data/store';
import Modal from '../components/Modal';
import './Pages.css';

export default function TenantsPage() {
  const { 
    tenants, rooms, payments, updateTenant, deleteTenant, 
    addTenant, addPayment, fetchTenants, fetchRooms, fetchTenantById, fetchPayments,
    pageAction, setPageAction, uploadFile, settings 
  } = useStore();

  useEffect(() => {
    if (pageAction) {
      if (pageAction === 'add') {
        openAddModal();
      } else if (typeof pageAction === 'object' && pageAction.type === 'add') {
        openAddModal(pageAction.roomId);
      } else if (typeof pageAction === 'object' && pageAction.type === 'profile') {
        const target = tenants.find(t => (t._id || t.id) === pageAction.tenantId);
        if (target) openProfile(target);
      }
      setPageAction(null); // Clear action
    }
  }, [pageAction, setPageAction, rooms, tenants]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [selectedTenant, setSelectedTenant] = useState(null);
  
  // Sync selectedTenant with global tenants state to ensure fresh data (like pendingDues)
  useEffect(() => {
    if (selectedTenant) {
        const updated = tenants.find(t => (t._id || t.id) === (selectedTenant._id || selectedTenant.id));
        if (updated && updated.pendingDues !== selectedTenant.pendingDues) {
            setSelectedTenant(prev => ({ ...prev, ...updated }));
        }
    }
  }, [tenants]);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayDuesModal, setShowPayDuesModal] = useState(false);
  const [photoSourceTarget, setPhotoSourceTarget] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState({ isCoTenant: false, index: 0 });
  const [viewDocUrl, setViewDocUrl] = useState(null);
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  const [payDuesTenantObj, setPayDuesTenantObj] = useState(null);
  const [payDuesData, setPayDuesData] = useState({ amount: '', method: 'Cash' });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState(null);
  const [addStep, setAddStep] = useState(1);
  const [addData, setAddData] = useState({
    name: '', phone: '', address: '',
    parentName: '', parentPhone: '', joinDate: '',
    coTenants: [],
    roomId: '', rent: '', deposit: '', paidAmount: '', dueAmount: 0,
    method: 'Cash',
    photoFile: null, photoPreview: null,
    tenantAadhaar: null, parentAadhaar: null
  });

  const activeTenants = tenants.filter(t => t.status === 'active');
  const filtered = activeTenants.filter(t => {
    const matchFilter = filter === 'all' || 
                        (filter === 'dues' && t.pendingDues > 0) ||
                        (filter === 'nodues' && t.pendingDues === 0);
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                        t.roomNumber.toString().includes(search) ||
                        t.phone.includes(search);
    return matchFilter && matchSearch;
  }).sort((a, b) => {
    const aHasDues = (a.pendingDues || 0) > 0;
    const bHasDues = (b.pendingDues || 0) > 0;
    if (aHasDues && !bHasDues) return -1;
    if (!aHasDues && bHasDues) return 1;
    return new Date(b.joinDate) - new Date(a.joinDate);
  });

  const archivedTenants = tenants.filter(t => t.status === 'archived');
  const availableRooms = rooms.filter(r => r.status === 'available' || (isEditing && (r._id || r.id).toString() === addData.roomId?.toString()));

  const getTenantPayments = (tenantId) => {
    return payments.filter(p => (p.tenantId === tenantId || p._id === tenantId)).sort((a, b) => new Date(b.date) - new Date(a.date));
  };
  const getPendingMonths = (tenantId) => {
    const pending = payments.filter(p => (p.tenantId === tenantId || p._id === tenantId) && p.status === 'pending' && p.month);
    if (pending.length === 0) return '';
    const uniqueMonths = [...new Set(pending.map(p => p.month))];
    return uniqueMonths.join(', ');
  };

  const openProfile = async (tenant) => {
    setSelectedTenant(tenant);
    setShowProfileModal(true);
    // Fetch full data in background (with documents)
    const fullTenant = await fetchTenantById(tenant._id || tenant.id);
    if (fullTenant) setSelectedTenant(fullTenant);
  };

  const openEdit = async (e, tenant) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingId(tenant._id || tenant.id);
    
    const assignedRoom = rooms.find(r => (r._id || r.id).toString() === tenant.roomId?.toString());
    const tenantRent = tenant.rent || assignedRoom?.rent || '';

    setAddData({
      ...tenant,
      joinDate: tenant.joinDate ? tenant.joinDate.split('T')[0] : new Date().toISOString().split('T')[0],
      roomId: assignedRoom ? tenant.roomId : '',
      roomNumber: assignedRoom ? assignedRoom.number : 'Unassigned',
      rent: tenantRent,
      deposit: tenant.deposit || '',
      paidAmount: 0,
      dueAmount: tenant.pendingDues || 0,
      photoPreview: tenant.avatar,
      coTenants: (tenant.coTenants || []).map(ct => ({
        ...ct,
        photoPreview: ct.avatar
      }))
    });
    setAddStep(1);
    setShowAddModal(true);
    if (showProfileModal) setShowProfileModal(false);

    // Background fetch
    fetchTenantById(tenant._id || tenant.id).then(full => {
        if (full) {
            setAddData(prev => ({
                ...prev,
                ...full,
                photoPreview: full.avatar,
                coTenants: (full.coTenants || []).map(ct => ({ ...ct, photoPreview: ct.avatar }))
            }));
        }
    }).catch(err => console.error("BG Fetch error", err));
  };

  const openPayDues = async (tenant) => {
      const tenantId = tenant._id || tenant.id;
      setPayDuesTenantObj(tenant);
      setPayDuesData({ amount: tenant.pendingDues, method: 'Cash' });
      setShowPayDuesModal(true);

      // Reconcile outstanding dues to pending payments in the DB automatically
      const tenantPendingPayments = payments.filter(p => 
        (p.tenantId === tenantId || p._id === tenantId) && p.status === 'pending'
      );
      if (tenantPendingPayments.length === 1) {
        const singleP = tenantPendingPayments[0];
        const currentDue = singleP.dueAmount !== undefined ? singleP.dueAmount : singleP.totalAmount;
        if (currentDue !== tenant.pendingDues) {
          try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://lodgex-backend.onrender.com/api';
            await fetch(`${API_URL}/payments/${singleP._id || singleP.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dueAmount: tenant.pendingDues })
            });
            await fetchPayments();
          } catch(e) {
            console.error('Failed to reconcile pending payment:', e);
          }
        }
      }
  };

  const handlePayDuesSubmit = async (e) => {
      e.preventDefault();
      if (isSubmittingPayment) return; // Prevent double submission
      const amountPaid = Number(payDuesData.amount);
      if (!amountPaid || amountPaid <= 0) return alert('Enter a valid amount');
      if (amountPaid > payDuesTenantObj.pendingDues) return alert('Amount cannot exceed pending dues');
      
      setIsSubmittingPayment(true);
      const newDues = payDuesTenantObj.pendingDues - amountPaid;
      
      try {
        await addPayment({
            tenantId: payDuesTenantObj._id || payDuesTenantObj.id,
            tenantName: payDuesTenantObj.name,
            roomId: payDuesTenantObj.roomId,
            roomNumber: payDuesTenantObj.roomNumber,
            totalAmount: payDuesTenantObj.pendingDues,
            paidAmount: amountPaid,
            dueAmount: newDues,
            method: payDuesData.method,
            status: 'completed',
            month: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
            notes: newDues > 0 ? `Partial payment (₹${newDues.toLocaleString('en-IN')} remaining)` : 'Full dues cleared'
        });
        
        // Update local state immediately so UI reflects the change if modal reopened
        setPayDuesTenantObj(prev => prev ? { ...prev, pendingDues: newDues } : prev);
        setShowPayDuesModal(false);
      } catch(err) {
        console.error('Payment submission error:', err);
        alert('Payment failed. Please try again.');
      } finally {
        setIsSubmittingPayment(false);
      }
  };

  const confirmDelete = (e, tenant) => {
    e.stopPropagation();
    setTenantToDelete(tenant);
    setShowDeleteConfirm(true);
  };

  const handleDeleteTenant = async () => {
    if (tenantToDelete) {
      await deleteTenant(tenantToDelete._id || tenantToDelete.id);
      setShowDeleteConfirm(false);
      setTenantToDelete(null);
      if (selectedTenant && (selectedTenant._id || selectedTenant.id) === (tenantToDelete._id || tenantToDelete.id)) {
        setShowProfileModal(false);
      }
    }
  };

  const parseNum = (val) => val === '' ? '' : Number(val);

  const openAddModal = (initialRoomId) => {
    setIsEditing(false);
    setEditingId(null);
    const preSelectedRoom = initialRoomId ? rooms.find(r => (r._id || r.id).toString() === initialRoomId.toString()) : null;
    const firstRoom = preSelectedRoom || availableRooms[0];
    setAddData({
      name: '', phone: '', address: '',
      parentName: '', parentPhone: '',
      joinDate: new Date().toISOString().split('T')[0],
      coTenants: [],
      roomId: firstRoom?._id || firstRoom?.id || '', rent: firstRoom?.rent || '', deposit: '', paidAmount: '', dueAmount: 0,
      method: 'Cash',
      photoFile: null, photoPreview: null,
      tenantAadhaar: null, parentAadhaar: null
    });
    setAddStep(1);
    setShowAddModal(true);
  };

  const compressImage = (file, maxWidth = 800) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) return resolve(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handlePhotoUpload = async (e, isCoTenant = false, index = 0) => {
    let file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        file = await compressImage(file);
      }
      const preview = URL.createObjectURL(file);
      if (isCoTenant) {
        setAddData(prev => {
          const newCo = [...prev.coTenants];
          newCo[index] = { ...newCo[index], photoFile: file, photoPreview: preview };
          return { ...prev, coTenants: newCo };
        });
      } else {
        setAddData(prev => ({...prev, photoFile: file, photoPreview: preview}));
      }
    }
  };

  const handleDocumentUpload = async (file, field, isCoTenant = false, index = 0) => {
    if (!file) return;
    let finalFile = file;
    if (file.type.startsWith('image/')) {
        finalFile = await compressImage(file, 1000); 
    }
    
    if (isCoTenant) {
        setAddData(prev => {
          const newCo = [...prev.coTenants];
          newCo[index] = { ...newCo[index], [field]: finalFile };
          return { ...prev, coTenants: newCo };
        });
    } else {
        setAddData(prev => ({ ...prev, [field]: finalFile }));
    }
  };

  const handleViewDoc = (docStr, title = 'Document') => {
    if (!docStr || docStr === 'Aadhaar Card' || (!docStr.startsWith('data:') && !docStr.startsWith('http') && !docStr.startsWith('/api/files'))) {
       alert('No valid document uploaded for this record.');
       return;
    }
    setViewDocUrl({ url: docStr, title });
  };

  const openCamera = (isCoTenant = false, index = 0) => {
    setCameraTarget({ isCoTenant, index });
    setShowCamera(true);
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => {
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(err => {
        console.error('Camera error', err);
        setShowCamera(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          alert('📷 Camera permission denied!\n\nTo fix this:\n1. Click the camera/lock icon in your browser address bar\n2. Select "Allow" for camera\n3. Refresh the page and try again\n\nOr: Use "Upload from Device" to upload a photo from your files instead.');
        } else if (err.name === 'NotFoundError') {
          alert('No camera found on this device. Please use "Upload from Device" instead.');
        } else {
          alert('Could not access camera. Please use "Upload from Device" as an alternative.');
        }
      });
  };

  const closeCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async (blob) => {
      let file = new File([blob], 'live_capture.jpg', { type: 'image/jpeg' });
      file = await compressImage(file);
      const preview = URL.createObjectURL(file);
      if (cameraTarget.isCoTenant) {
        const newCo = [...addData.coTenants];
        newCo[cameraTarget.index].photoFile = file;
        newCo[cameraTarget.index].photoPreview = preview;
        setAddData({ ...addData, coTenants: newCo });
      } else {
        setAddData(prev => ({...prev, photoFile: file, photoPreview: preview}));
      }
      closeCamera();
    }, 'image/jpeg', 0.7);
  };

  const validateStep = () => {
    if (addStep === 1) {
      if (!addData.roomId) { alert('Please select a room'); return false; }
    } else if (addStep === 2) {
      if (!addData.name || !addData.phone || !addData.address || !addData.parentName || !addData.parentPhone) {
        alert('Please fill all required fields for the primary tenant (*)');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep()) setAddStep(s => s + 1);
  };

  const selectedRoomObj = rooms.find(r => (r._id || r.id)?.toString() === addData.roomId?.toString());
  const maxOccupancy = selectedRoomObj?.type === 'Single' ? 3 : selectedRoomObj?.type === 'Double' ? 5 : 6; // Allow more roommates for flexibility
  const canAddRoommate = addData.coTenants.length < (maxOccupancy - 1);
  const isLastStep = addStep === 3;



  const handleAddSubmit = async (e) => {
    if (e) e.preventDefault();

    // If not on the last step, treat form submit (e.g. Enter key) as "Next Step"
    if (!isLastStep) {
      handleNextStep();
      return;
    }

    if (!validateStep()) return;
    if (!addData.roomId) return alert('Please select a room');
    
    setIsSaving(true);
    try {
      const room = rooms.find(r => (r._id || r.id).toString() === addData.roomId.toString());
    
    // Parallelize all file conversions for primary tenant
    const [tenantPhotoUrl, tenantAadhaarUrl, parentAadhaarUrl] = await Promise.all([
      uploadFile(addData.photoFile),
      uploadFile(addData.tenantAadhaar),
      uploadFile(addData.parentAadhaar)
    ]);

    const avatar = tenantPhotoUrl || (addData.avatar && !addData.avatar.startsWith('blob:') ? addData.avatar : `https://api.dicebear.com/9.x/initials/svg?seed=${addData.name}&backgroundColor=6366f1`);

    const mappedCoTenants = await Promise.all(addData.coTenants.map(async (ct) => {
       const [ctPhotoUrl, ctAadhaarUrl, ctParentAadhaarUrl] = await Promise.all([
         uploadFile(ct.photoFile),
         uploadFile(ct.tenantAadhaar),
         uploadFile(ct.parentAadhaar)
       ]);
       
       return {
         name: ct.name,
         phone: ct.phone,
         parentName: ct.parentName,
         parentPhone: ct.parentPhone,
         avatar: ctPhotoUrl || (ct.avatar && !ct.avatar.startsWith('blob:') ? ct.avatar : `https://api.dicebear.com/9.x/initials/svg?seed=${ct.name}&backgroundColor=6366f1`),
         idProof: ctAadhaarUrl || ct.idProof,
         parentIdProof: ctParentAadhaarUrl || ct.parentIdProof,
       };
    }));

    const tenantData = {
      name: addData.name,
      phone: addData.phone,
      address: addData.address,
      parentName: addData.parentName,
      parentPhone: addData.parentPhone,
      idProof: tenantAadhaarUrl || addData.idProof,
      parentIdProof: parentAadhaarUrl || addData.parentIdProof,
      coTenants: mappedCoTenants,
      roomId: addData.roomId,
      roomNumber: room.number,
      rent: Number(addData.rent) || room.rent,
      deposit: Number(addData.deposit) || 0,
      pendingDues: Number(addData.dueAmount) || 0,
      avatar: avatar,
      joinDate: new Date(addData.joinDate).toISOString(),
      status: 'active',
      vacateDate: null
    };

    if (isEditing) {
      await updateTenant(editingId, tenantData);
      setFilter('all'); 
      if (selectedTenant && (selectedTenant._id || selectedTenant.id)?.toString() === editingId?.toString()) {
          setSelectedTenant(prev => ({ ...prev, ...tenantData }));
      }
      // Force a second fetch just to be absolutely sure the UI refreshes with the latest DB state
      setTimeout(() => {
          setFilter('all');
      }, 500);
    } else {
      const newTenant = await addTenant(tenantData);
      if (newTenant && ((Number(addData.paidAmount) || 0) > 0 || (Number(addData.dueAmount) || 0) > 0)) {
        addPayment({
          tenantId: newTenant._id || newTenant.id,
          tenantName: newTenant.name,
          roomId: newTenant.roomId,
          roomNumber: newTenant.roomNumber,
          totalAmount: Number(addData.deposit) || 0,
          paidAmount: Number(addData.paidAmount) || 0,
          dueAmount: Number(addData.dueAmount) || 0,
          method: addData.method,
          status: (Number(addData.dueAmount) || 0) > 0 ? 'pending' : 'completed',
          month: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
          notes: 'Advance/Deposit on allocation'
        });
      }
    }
    } catch (error) {
      console.error("Error saving tenant:", error);
      alert("Failed to save tenant. Please try again.");
    } finally {
      setIsSaving(false);
    }
    setShowAddModal(false);
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchTenants(), fetchRooms()]);
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header animate-in">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-subtitle">Managing {activeTenants.length} active tenants</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="page-header-btn" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            style={{ 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-primary)', 
              color: 'var(--text-secondary)',
              opacity: isRefreshing ? 0.7 : 1,
              cursor: isRefreshing ? 'not-allowed' : 'pointer'
            }}
          >
            <History size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="page-header-btn primary" onClick={openAddModal}>
            <Plus size={16} /> Add Tenant
          </button>
        </div>
      </div>

      <div className="page-toolbar animate-in">
        <div className="toolbar-search">
          <Search size={16} />
          <input type="text" placeholder="Search by name, phone, room..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="toolbar-filters">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`filter-btn ${filter === 'dues' ? 'active' : ''}`} onClick={() => setFilter('dues')}>With Dues</button>
          <button className={`filter-btn ${filter === 'nodues' ? 'active' : ''}`} onClick={() => setFilter('nodues')}>No Dues</button>
          <button className={`filter-btn ${filter === 'past' ? 'active' : ''}`} onClick={() => setFilter('past')} style={{borderLeft: '2px solid var(--border-primary)', marginLeft: '6px', paddingLeft: '16px'}}>
            <UserX size={13} style={{marginRight: '4px', verticalAlign: '-2px'}}/> Past Tenants ({archivedTenants.length})
          </button>
        </div>
      </div>

      {filter === 'past' ? (
        /* Past Tenants Table */
        <div className="animate-in">
          {archivedTenants.length > 0 ? (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Room</th>
                    <th>Phone</th>
                    <th>Guardian</th>
                    <th>Rent</th>
                    <th>Pending Dues</th>
                    <th>Joined</th>
                    <th>Vacated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedTenants.map(t => (
                    <tr key={t._id || t.id} style={{cursor: 'pointer'}} onClick={() => openProfile(t)}>
                      <td>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                          <img src={t.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${t.name}&backgroundColor=6366f1`} alt="" style={{width: '32px', height: '32px', borderRadius: '50%'}} />
                          <span className="table-cell-name">{t.name}</span>
                        </div>
                      </td>
                      <td><span className="table-room-badge">{t.roomNumber}</span></td>
                      <td>{t.phone}</td>
                      <td>{t.parentName || '-'}</td>
                      <td className="text-bold">₹{t.rent?.toLocaleString('en-IN') || '-'}</td>
                      <td className={t.pendingDues > 0 ? 'text-bold text-danger' : 'text-bold text-success'}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{t.pendingDues > 0 ? `₹${t.pendingDues.toLocaleString('en-IN')}` : 'Clear'}</span>
                          {t.pendingDues > 0 && (
                            <span style={{ fontSize: '10px', fontWeight: 500, opacity: 0.7, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }} title={getPendingMonths(t._id || t.id)}>
                              {getPendingMonths(t._id || t.id)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{new Date(t.joinDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}</td>
                      <td>{t.vacateDate ? new Date(t.vacateDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'}) : '-'}</td>
                      <td>
                        <div style={{display: 'flex', gap: '8px'}}>
                          <button 
                            className="table-action-btn edit" 
                            onClick={(e) => openEdit(e, t)} 
                            title="Assign Room"
                            style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Plus size={16} />
                          </button>
                          <button 
                            className="table-action-btn delete" 
                            onClick={(e) => confirmDelete(e, t)} 
                            title="Delete Permanently"
                            style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="page-empty">No past tenants yet. When you vacate a room, the tenant record will appear here.</div>
          )}
        </div>
      ) : (
        /* Active Tenants Grid */
        <>

      <div className="tenants-grid">
        {filtered.map((tenant, idx) => (
          <div key={tenant._id || tenant.id} className={`tenant-card animate-in stagger-${(idx % 8) + 1}`} onClick={() => openProfile(tenant)}>
            <div className="tenant-card-header" style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center', gap: '16px', background: 'transparent' }}>
              <div className="tenant-avatar-wrapper" style={{ position: 'relative', flexShrink: 0 }}>
                <img 
                  src={tenant.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${tenant.name}&backgroundColor=6366f1`} 
                  alt="" 
                  style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '16px', 
                    objectFit: 'cover',
                    border: '2px solid var(--border-primary)',
                    boxShadow: tenant.pendingDues > 0 ? '0 0 15px rgba(16, 185, 129, 0.25)' : 'none'
                  }} 
                />
                {tenant.pendingDues > 0 && (
                  <div 
                    className="green-blinking-dot"
                    style={{ 
                      position: 'absolute', 
                      top: '-4px', 
                      right: '-4px', 
                      width: '14px', 
                      height: '14px', 
                      background: '#10b981', 
                      borderRadius: '50%', 
                      border: '2.5px solid var(--bg-card)', 
                      boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' 
                    }} 
                  />
                )}
              </div>
              
              <div className="tenant-main-info" style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tenant.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  {(() => {
                    const actualRoom = rooms.find(r => (r._id || r.id).toString() === tenant.roomId?.toString());
                    return (
                      <>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: actualRoom ? 'var(--text-tertiary)' : 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {actualRoom ? `Room ${actualRoom.number}` : 'Unassigned Room'}
                        </div>
                        {!actualRoom && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEdit(e, tenant); }}
                            style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}
                          >
                            Assign Room
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button 
                  className="table-action-btn edit" 
                  onClick={(e) => openEdit(e, tenant)} 
                  title="Edit Tenant"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', width: '40px', height: '40px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  className="table-action-btn delete" 
                  onClick={(e) => confirmDelete(e, tenant)} 
                  title="Delete Tenant"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', width: '40px', height: '40px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="tenant-card-body">
              <div className="tenant-info-group">
                <div className="tenant-info-row">
                  <div className="tenant-info-label">Name</div>
                  <div className="tenant-info-value">{tenant.name}</div>
                </div>
                <div className="tenant-info-row">
                  <div className="tenant-info-label">Contact</div>
                  <div className="tenant-info-value">{tenant.phone}</div>
                </div>
                {tenant.address && (
                  <div className="tenant-info-row">
                    <div className="tenant-info-label">Address</div>
                    <div className="tenant-info-value">{tenant.address}</div>
                  </div>
                )}
                <div className="tenant-info-row">
                  <div className="tenant-info-label">Guardian</div>
                  <div className="tenant-info-value">{tenant.parentName || '-'} {tenant.parentPhone ? `(${tenant.parentPhone})` : ''}</div>
                </div>
              </div>

               {tenant.coTenants && tenant.coTenants.length > 0 && (
                  <div style={{ marginTop: '4px', borderTop: '1px solid var(--border-primary)', paddingTop: '10px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-tertiary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Users size={12} /> Roommates
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                      {tenant.coTenants.map((ct, i) => (
                        <div key={i} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          background: 'var(--bg-glass)', 
                          padding: '8px 12px', 
                          borderRadius: 'var(--radius-md)', 
                          border: '1px solid var(--border-primary)',
                        }}>
                          <img 
                            src={ct.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${ct.name}&backgroundColor=6366f1`} 
                            alt="" 
                            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{ct.name}</span>
                            <div style={{ display: 'flex', fontSize: '10px', color: 'var(--text-tertiary)', gap: '4px' }}>
                              <span style={{ fontWeight: 600 }}>Guardian:</span>
                              <span>{ct.parentName || '-'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              <div className="tenant-stats-grid" style={{ 
                display: 'grid', 
                gap: '8px', 
                marginTop: '12px', 
                borderTop: '1px solid var(--border-primary)', 
                paddingTop: '12px' 
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Rent</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>₹{tenant.rent?.toLocaleString() || '-'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Deposit</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>₹{tenant.deposit?.toLocaleString() || '-'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Joined</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '11px', marginTop: '3px' }}>
                      {tenant.joinDate ? new Date(tenant.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </span>
                </div>
              </div>

              {/* Billing Action Row Moved to Bottom */}
              {tenant.pendingDues > 0 ? (
                <div style={{ marginTop: '20px', padding: '14px 16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(239, 68, 68, 0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Outstanding Balance</span>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>₹{tenant.pendingDues.toLocaleString('en-IN')}</span>
                    {tenant.pendingDues > 0 && (
                      <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(239, 68, 68, 0.7)', marginTop: '4px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={getPendingMonths(tenant._id || tenant.id)}>
                        Months: {getPendingMonths(tenant._id || tenant.id)}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); openPayDues(tenant); }}
                    style={{ 
                      background: '#ef4444', 
                      color: 'white', 
                      padding: '10px 24px', 
                      borderRadius: '12px', 
                      border: 'none', 
                      fontSize: '13px', 
                      fontWeight: 800, 
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    Pay Now
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(52, 211, 153, 0.04)', borderRadius: '14px', border: '1px solid rgba(52, 211, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%' }} />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payment Cleared</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="page-empty">No tenants match your search</div>}
        </>
      )}

      {/* Tenant Profile Modal */}
      {selectedTenant && (
        <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="" maxWidth="850px">
          {/* Cover Photo Area */}
          <div style={{ height: '120px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.02))', margin: '-24px -24px 0', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost" style={{ background: 'var(--bg-card)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} onClick={(e) => { setShowProfileModal(false); openEdit(e, selectedTenant); }}>
                <Edit2 size={14}/> Edit Profile
              </button>
              <button className="btn btn-ghost" style={{ background: 'var(--bg-card)', color: 'var(--danger)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} onClick={(e) => confirmDelete(e, selectedTenant)}>
                <Trash2 size={14}/> Delete
              </button>
            </div>
          </div>
          
          <div className="profile-header" style={{ padding: '0', marginTop: '-40px', marginBottom: '32px', display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
            <img src={selectedTenant.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${selectedTenant.name}&backgroundColor=6366f1`} alt="" style={{ width: '100px', height: '100px', borderRadius: '24px', border: '4px solid var(--bg-card)', objectFit: 'cover', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)', background: 'var(--bg-card)' }} />
            <div className="profile-info" style={{ paddingBottom: '4px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em', textTransform: 'capitalize' }}>{selectedTenant.name}</h3>
              <div className="profile-meta" style={{ display: 'flex', gap: '16px', color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} style={{ color: 'var(--accent-primary)' }}/> Room {selectedTenant.roomNumber}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CalendarClock size={14} style={{ color: 'var(--accent-primary)' }}/> Joined {new Date(selectedTenant.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {/* Personal Details */}
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px' }}>
                    <User size={18} style={{ color: 'var(--accent-primary)' }} /> Personal Details
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Phone</span><span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedTenant.phone}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Address</span><span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '180px' }}>{selectedTenant.address || '-'}</span></div>
                </div>
            </div>

            {/* Guardian Details */}
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px' }}>
                    <ShieldCheck size={18} style={{ color: 'var(--success)' }} /> Guardian Details
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Name</span><span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedTenant.parentName || '-'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Contact</span><span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedTenant.parentPhone || '-'}</span></div>
                </div>
            </div>

            {/* Financials */}
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-primary)', gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}><IndianRupee size={14} style={{ color: 'var(--accent-primary)' }}/> Monthly Rent</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>₹{selectedTenant.rent?.toLocaleString('en-IN') || '-'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}><IndianRupee size={14} style={{ color: 'var(--info)' }}/> Deposit</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>₹{selectedTenant.deposit?.toLocaleString('en-IN') || '-'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: selectedTenant.pendingDues > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(52, 211, 153, 0.05)', padding: '12px', borderRadius: '16px', margin: '-12px', border: selectedTenant.pendingDues > 0 ? '1px solid rgba(239, 68, 68, 0.1)' : '1px solid rgba(52, 211, 153, 0.1)' }}>
                    <span style={{ fontSize: '12px', color: selectedTenant.pendingDues > 0 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(52, 211, 153, 0.8)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      Outstanding Dues
                      {selectedTenant.pendingDues > 0 && (
                          <button style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); openPayDues(selectedTenant); }}>Pay Now</button>
                      )}
                    </span>
                    <span style={{ fontSize: '24px', fontWeight: 800, color: selectedTenant.pendingDues > 0 ? '#ef4444' : '#34d399' }}>₹{selectedTenant.pendingDues?.toLocaleString('en-IN') || 0}</span>
                </div>
            </div>

            {/* Documents */}
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-primary)', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px' }}>
                    <FileText size={18} style={{ color: 'var(--warning)' }} /> Documents
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: '1 1 200px', transition: 'all 0.2s' }} onClick={() => handleViewDoc(selectedTenant.idProof, 'Tenant Aadhaar')} className="doc-tile">
                        <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, flex: 1, color: 'var(--text-primary)' }}>Tenant Aadhaar</span>
                        <Download size={14} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: '1 1 200px', transition: 'all 0.2s' }} onClick={() => handleViewDoc(selectedTenant.parentIdProof, 'Parent Aadhaar')} className="doc-tile">
                        <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, flex: 1, color: 'var(--text-primary)' }}>Parent Aadhaar</span>
                        <Download size={14} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: '1 1 200px', transition: 'all 0.2s' }} onClick={() => handleViewDoc(selectedTenant.avatar, 'Tenant Photo')} className="doc-tile">
                        <Image size={20} style={{ color: 'var(--accent-primary)' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, flex: 1, color: 'var(--text-primary)' }}>Tenant Photo</span>
                        <Download size={14} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                </div>
            </div>

            {selectedTenant.coTenants && selectedTenant.coTenants.length > 0 && (
              <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-primary)', gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px' }}>
                      <Users size={18} style={{ color: 'var(--info)' }} /> Roommates / Co-Tenants
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                      {selectedTenant.coTenants.map((ct, idx) => (
                          <div key={idx} style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                  <img src={ct.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${ct.name}&backgroundColor=6366f1`} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                  <div>
                                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{ct.name}</div>
                                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{ct.phone}</div>
                                  </div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Guardian</span>
                                    <span style={{ color: 'var(--text-primary)' }}>{ct.parentName || '-'} {ct.parentPhone ? `(${ct.parentPhone})` : ''}</span>
                                  </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                  <div style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, cursor: 'pointer' }} onClick={() => handleViewDoc(ct.idProof, `${ct.name} - Aadhaar`)}>
                                      <span>Aadhaar</span><Download size={12} style={{color: 'var(--accent-primary)'}}/>
                                  </div>
                                  <div style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, cursor: 'pointer' }} onClick={() => handleViewDoc(ct.parentIdProof, `${ct.name} - Parent ID`)}>
                                      <span>Parent ID</span><Download size={12} style={{color: 'var(--accent-primary)'}}/>
                                  </div>
                                  <div style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, cursor: 'pointer' }} onClick={() => handleViewDoc(ct.avatar, `${ct.name} - Photo`)}>
                                      <span>Photo</span><Download size={12} style={{color: 'var(--accent-primary)'}}/>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px' }}>
              <History size={18} style={{ color: 'var(--accent-primary)' }} /> Payment History
          </div>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '20px', overflow: 'hidden' }}>
            <table className="data-table" style={{ border: 'none', margin: 0, width: '100%' }}>
              <thead style={{ background: 'transparent' }}>
                <tr>
                  <th style={{ paddingLeft: '24px', borderBottom: '1px solid var(--border-primary)' }}>Date</th>
                  <th style={{ borderBottom: '1px solid var(--border-primary)' }}>Amount Paid</th>
                  <th style={{ borderBottom: '1px solid var(--border-primary)' }}>Method</th>
                  <th style={{ paddingRight: '24px', borderBottom: '1px solid var(--border-primary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {getTenantPayments(selectedTenant._id || selectedTenant.id).length > 0 ? (
                    getTenantPayments(selectedTenant._id || selectedTenant.id).map((p, idx, arr) => (
                    <tr key={p._id || p.id}>
                        <td style={{ paddingLeft: '24px', borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--border-primary)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '500' }}>{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', opacity: 0.8 }}>
                              {new Date(p.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                          </div>
                        </td>
                        <td style={{ borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--border-primary)' }} className="text-bold text-success">+₹{p.paidAmount.toLocaleString('en-IN')}</td>
                        <td style={{ borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--border-primary)' }}><span style={{ background: 'var(--bg-card)', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>{p.method}</span></td>
                        <td style={{ paddingRight: '24px', borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--border-primary)' }}><span className={`status-pill ${p.status}`}>{p.status}</span></td>
                    </tr>
                    ))
                ) : (
                    <tr><td colSpan="4" style={{textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)', fontWeight: 600, borderBottom: 'none'}}>No payments recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {/* Add/Edit Tenant Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={isEditing ? "Edit Tenant Details" : "Add New Tenant"} maxWidth="850px">
        <div className="wizard-progress">
          <div className={`wizard-step ${addStep === 1 ? 'active' : ''} ${addStep > 1 ? 'completed' : ''}`} data-step="1">Room Selection</div>
          <div className="wizard-line" />
          <div className={`wizard-step ${addStep === 2 ? 'active' : ''} ${addStep > 2 ? 'completed' : ''}`} data-step="2">Primary Tenant</div>
          {maxOccupancy > 1 && (
            <>
              <div className="wizard-line" />
              <div className={`wizard-step ${addStep === 3 ? 'active' : ''}`} data-step="3">Roommates</div>
            </>
          )}
        </div>

        <div className="form-container" onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSubmit();
          }
        }}>
          {/* STEP 1: ROOM SELECTION */}
          <div style={{ display: addStep === 1 ? 'block' : 'none', animation: 'fadeIn 0.3s ease' }}>
            <h3 className="profile-section-title" style={{ marginTop: 0 }}>Room & Payment Details</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Assign Room *</label>
                {availableRooms.length === 0 ? (
                  <div className="error-box">⚠️ No vacant rooms available.</div>
                ) : (
                  <select className="form-select" value={addData.roomId} onChange={e => {
                    const r = rooms.find(room => (room._id || room.id).toString() === e.target.value.toString());
                    if (r) setAddData({...addData, roomId: r._id || r.id, rent: r.rent});
                  }} required={addStep === 1}>
                    <option value="">— Select Vacant Room —</option>
                    {availableRooms.map(r => (
                      <option key={r._id || r.id} value={r._id || r.id}>
                        Room {r.number} — {r.type} (Rent: ₹{r.rent})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="form-group full">
                <label className="form-label">Date of Joining</label>
                <input type="date" className="form-input" value={addData.joinDate} onChange={e => setAddData({...addData, joinDate: e.target.value})} required />
              </div>
              
              <div className="form-group">
                <label className="form-label">Monthly Rent (₹)</label>
                <input type="number" className="form-input" value={addData.rent} onWheel={(e) => e.target.blur()} onChange={e => {
                    const monthly = parseNum(e.target.value);
                    const booked = Number(addData.paidAmount) || 0;
                    setAddData({...addData, rent: monthly, dueAmount: Math.max(0, (Number(monthly) || 0) - booked)});
                }} />
              </div>

              <div className="form-group">
                <label className="form-label">Amount Paid Upfront (₹)</label>
                <input type="number" className="form-input" value={addData.paidAmount} onWheel={(e) => e.target.blur()} onChange={e => {
                    const booked = parseNum(e.target.value);
                    const monthly = Number(addData.rent) || 0;
                    setAddData({...addData, paidAmount: booked, deposit: booked, dueAmount: Math.max(0, monthly - (Number(booked) || 0))});
                }} />
              </div>

              <div className="form-group full">
                <label className="form-label">Pending Amount (₹) <span style={{fontWeight: 'normal', opacity: 0.7}}>= Monthly − Paid</span></label>
                <input type="number" className="form-input" value={addData.dueAmount} readOnly style={{
                    background: addData.dueAmount > 0 ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)',
                    borderColor: addData.dueAmount > 0 ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)',
                    color: addData.dueAmount > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700
                }} />
              </div>
            </div>
          </div>

          {/* STEP 2: PRIMARY TENANT */}
          <div style={{ display: addStep === 2 ? 'block' : 'none', animation: 'fadeIn 0.3s ease' }}>
            <h3 className="profile-section-title" style={{ marginTop: 0 }}>Primary Tenant Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-input" value={addData.name} onChange={e => setAddData({...addData, name: e.target.value})} required={addStep === 2} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Number *</label>
                <input type="tel" className="form-input" value={addData.phone} onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setAddData({...addData, phone: val});
                }} required={addStep === 2} placeholder="10-digit number" />
              </div>
              <div className="form-group full">
                <label className="form-label">Permanent Address *</label>
                <input type="text" className="form-input" value={addData.address} onChange={e => setAddData({...addData, address: e.target.value})} required={addStep === 2} />
              </div>
              <div className="form-group">
                <label className="form-label">Guardian's Name *</label>
                <input type="text" className="form-input" value={addData.parentName} onChange={e => setAddData({...addData, parentName: e.target.value})} required={addStep === 2} />
              </div>
              <div className="form-group">
                <label className="form-label">Guardian's Contact *</label>
                <input type="tel" className="form-input" value={addData.parentPhone} onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setAddData({...addData, parentPhone: val});
                }} required={addStep === 2} placeholder="10-digit number" />
              </div>
            </div>

            <h3 className="profile-section-title" style={{ marginTop: '24px' }}>Documents</h3>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Tenant Photo</label>
                <div className={`file-upload-box ${addData.photoFile ? 'uploaded' : ''}`} style={{cursor: 'pointer', position: 'relative'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', flex: 1}} onClick={() => setPhotoSourceTarget({ isCoTenant: false, index: 0 })}>
                    <UploadCloud size={20} style={{color: addData.photoFile ? 'var(--success)' : 'inherit'}}/>
                    <span style={{fontSize: '12px'}}>{addData.photoFile ? 'Uploaded' : 'Add Photo'}</span>
                    {addData.photoPreview && <img src={addData.photoPreview} alt="" style={{width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover'}}/>}
                  </div>
                  {addData.photoFile && (
                    <button type="button" className="btn-icon-sm" style={{ zIndex: 10, background: 'rgba(99,102,241,0.1)', padding: '4px', borderRadius: '4px' }} 
                      onClick={(e) => { e.stopPropagation(); handleViewDoc(addData.photoPreview, 'Tenant Photo'); }}>
                      <Download size={12}/>
                    </button>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tenant Aadhaar</label>
                <div className={`file-upload-box ${addData.tenantAadhaar ? 'uploaded' : ''}`} style={{ position: 'relative' }}>
                  <UploadCloud size={20} style={{color: addData.tenantAadhaar ? 'var(--success)' : 'inherit'}} />
                  <span style={{fontSize: '12px'}}>{addData.tenantAadhaar ? 'Uploaded' : 'Upload ID'}</span>
                  {addData.tenantAadhaar && (
                      <button type="button" className="btn-icon-sm" style={{ marginLeft: 'auto', zIndex: 10, background: 'rgba(99,102,241,0.1)', padding: '4px', borderRadius: '4px' }} 
                          onClick={(e) => { e.stopPropagation(); handleViewDoc(URL.createObjectURL(addData.tenantAadhaar), 'Tenant Aadhaar'); }}>
                          <Download size={12}/>
                      </button>
                  )}
                  <input type="file" accept="image/*" onChange={e => handleDocumentUpload(e.target.files[0], 'tenantAadhaar')} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 1 }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Guardian Aadhaar</label>
                <div className={`file-upload-box ${addData.parentAadhaar ? 'uploaded' : ''}`} style={{ position: 'relative' }}>
                  <UploadCloud size={20} style={{color: addData.parentAadhaar ? 'var(--success)' : 'inherit'}} />
                  <span style={{fontSize: '12px'}}>{addData.parentAadhaar ? 'Uploaded' : 'Upload ID'}</span>
                  {addData.parentAadhaar && (
                      <button type="button" className="btn-icon-sm" style={{ marginLeft: 'auto', zIndex: 10, background: 'rgba(99,102,241,0.1)', padding: '4px', borderRadius: '4px' }} 
                          onClick={(e) => { e.stopPropagation(); handleViewDoc(URL.createObjectURL(addData.parentAadhaar), 'Guardian Aadhaar'); }}>
                          <Download size={12}/>
                      </button>
                  )}
                  <input type="file" accept="image/*" onChange={e => handleDocumentUpload(e.target.files[0], 'parentAadhaar')} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 1 }} />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: CO-TENANTS */}
          {maxOccupancy > 1 && (
            <div style={{ display: addStep === 3 ? 'block' : 'none', animation: 'fadeIn 0.3s ease' }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                <div>
                    <h3 className="profile-section-title" style={{ margin: 0 }}>Roommates Information (Optional)</h3>
                    <p style={{fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px'}}>
                        Add up to {maxOccupancy - 1} roommates for this {selectedRoomObj?.type || 'selected'} room.
                    </p>
                </div>
                {canAddRoommate && (
                  <button type="button" className="btn btn-ghost" onClick={() => {
                    setAddData({...addData, coTenants: [...addData.coTenants, {
                        name: '', phone: '', parentName: '', parentPhone: '',
                        photoFile: null, photoPreview: null, tenantAadhaar: null, parentAadhaar: null
                    }]});
                  }}>
                    <Plus size={14}/> Add Roommate
                  </button>
                )}
              </div>

              {addData.coTenants.length === 0 && (
                  <div className="page-empty" style={{padding: '24px'}}>No roommates added. Click the button above to add one.</div>
              )}

              {addData.coTenants.map((ct, i) => (
                <div key={i} className="cotenant-card">
                  <div className="cotenant-card-header">
                      <h4>Roommate #{i + 1}</h4>
                      <button type="button" onClick={() => setAddData({...addData, coTenants: addData.coTenants.filter((_, idx) => idx !== i)})} className="btn-remove"><Trash2 size={14}/> Remove</button>
                  </div>
                  <div className="form-grid">
                    <div className="form-group"><label className="form-label">Full Name *</label><input type="text" className="form-input" value={ct.name} onChange={e => {const n=[...addData.coTenants]; n[i].name=e.target.value; setAddData({...addData, coTenants: n})}} required={addStep === 3} /></div>
                    <div className="form-group"><label className="form-label">Contact *</label><input type="tel" className="form-input" value={ct.phone} onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      const n=[...addData.coTenants]; n[i].phone=val; setAddData({...addData, coTenants: n})
                    }} required={addStep === 3} placeholder="10-digit number" /></div>
                    <div className="form-group"><label className="form-label">Guardian Name *</label><input type="text" className="form-input" value={ct.parentName} onChange={e => {const n=[...addData.coTenants]; n[i].parentName=e.target.value; setAddData({...addData, coTenants: n})}} required={addStep === 3} /></div>
                    <div className="form-group"><label className="form-label">Guardian Contact *</label><input type="tel" className="form-input" value={ct.parentPhone} onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      const n=[...addData.coTenants]; n[i].parentPhone=val; setAddData({...addData, coTenants: n})
                    }} required={addStep === 3} placeholder="10-digit number" /></div>
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: '16px' }}>
                    <div className="form-group">
                        <label className="form-label">Photo</label>
                        <div className={`file-upload-box ${ct.photoFile ? 'uploaded' : ''}`} style={{cursor: 'pointer', position: 'relative'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px', flex: 1}} onClick={() => setPhotoSourceTarget({ isCoTenant: true, index: i })}>
                                <UploadCloud size={20} style={{color: ct.photoFile ? 'var(--success)' : 'inherit'}}/>
                                <span style={{fontSize: '12px'}}>{ct.photoFile ? 'Uploaded' : 'Add Photo'}</span>
                                {ct.photoPreview && <img src={ct.photoPreview} alt="" style={{width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover'}}/>}
                            </div>
                            {ct.photoFile && (
                                <button type="button" className="btn-icon-sm" style={{ zIndex: 10, background: 'rgba(99,102,241,0.1)', padding: '4px', borderRadius: '4px' }} 
                                    onClick={(e) => { e.stopPropagation(); handleViewDoc(ct.photoPreview, `${ct.name} - Photo`); }}>
                                    <Download size={12}/>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Aadhaar</label>
                        <div className={`file-upload-box ${ct.tenantAadhaar ? 'uploaded' : ''}`} style={{ position: 'relative' }}>
                            <UploadCloud size={20} style={{color: ct.tenantAadhaar ? 'var(--success)' : 'inherit'}}/>
                            <span style={{fontSize: '12px'}}>{ct.tenantAadhaar ? 'Uploaded' : 'Upload'}</span>
                            {ct.tenantAadhaar && (
                                <button type="button" className="btn-icon-sm" style={{ marginLeft: 'auto', zIndex: 10, background: 'rgba(99,102,241,0.1)', padding: '4px', borderRadius: '4px' }} 
                                    onClick={(e) => { e.stopPropagation(); handleViewDoc(URL.createObjectURL(ct.tenantAadhaar), 'Tenant Aadhaar'); }}>
                                    <Download size={12}/>
                                </button>
                            )}
                            <input type="file" accept="image/*" onChange={e => handleDocumentUpload(e.target.files[0], 'tenantAadhaar', true, i)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 1 }} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Parent Aadhaar</label>
                        <div className={`file-upload-box ${ct.parentAadhaar ? 'uploaded' : ''}`} style={{ position: 'relative' }}>
                            <UploadCloud size={20} style={{color: ct.parentAadhaar ? 'var(--success)' : 'inherit'}}/>
                            <span style={{fontSize: '12px'}}>{ct.parentAadhaar ? 'Uploaded' : 'Upload'}</span>
                            {ct.parentAadhaar && (
                                <button type="button" className="btn-icon-sm" style={{ marginLeft: 'auto', zIndex: 10, background: 'rgba(99,102,241,0.1)', padding: '4px', borderRadius: '4px' }} 
                                    onClick={(e) => { e.stopPropagation(); handleViewDoc(URL.createObjectURL(ct.parentAadhaar), 'Parent Aadhaar'); }}>
                                    <Download size={12}/>
                                </button>
                            )}
                            <input type="file" accept="image/*" onChange={e => handleDocumentUpload(e.target.files[0], 'parentAadhaar', true, i)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 1 }} />
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="form-actions" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--border-primary)', paddingTop: '20px', marginTop: '24px' }}>
            {addStep > 1 ? (
              <button type="button" className="btn btn-ghost" onClick={() => setAddStep(s => s - 1)}>Back</button>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
            )}
            
            {(addStep < 3) ? (
              <button type="button" className="btn btn-primary" onClick={handleNextStep}>Next Step</button>
            ) : (
              <button type="button" className={`btn btn-primary ${isSaving ? 'loading' : ''}`} onClick={async () => {
                setIsSaving(true);
                await handleAddSubmit();
                setIsSaving(false);
              }} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="btn-spinner" style={{ marginRight: '8px' }}></div>
                    Saving...
                  </>
                ) : (
                  <>
                    {isEditing ? <Edit2 size={14} style={{marginRight: '8px'}}/> : <Plus size={14} style={{marginRight: '8px'}}/>}
                    {isEditing ? ' Save Changes' : ' Complete Registration'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={showPayDuesModal} onClose={() => setShowPayDuesModal(false)} title={`Collect Payment - ${payDuesTenantObj?.name}`} maxWidth="420px">
        <form onSubmit={handlePayDuesSubmit}>
          <div className="payment-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Outstanding Summary */}
            <div className="payment-summary-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)', borderRadius: '20px', padding: '24px', border: '1px solid rgba(99, 102, 241, 0.2)', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Total Outstanding</span>
                <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--danger)', marginTop: '4px' }}>₹{(payDuesTenantObj?.pendingDues || 0).toLocaleString('en-IN')}</div>
            </div>

            {/* Breakdown */}
            <div className="payment-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '4px', height: '16px', background: 'var(--accent-primary)', borderRadius: '4px' }}></div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Dues Breakdown</h4>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--border-primary)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {(() => {
                        const tenantId = payDuesTenantObj?._id || payDuesTenantObj?.id;
                        const pendingPayments = payments.filter(p => 
                          (p.tenantId === tenantId || p._id === tenantId) && 
                          p.status === 'pending' && 
                          p.month
                        );
                        
                        if (pendingPayments.length > 0) {
                            return pendingPayments.map((p, idx) => (
                                <div key={p._id || p.id} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    padding: '14px 16px', 
                                    borderBottom: idx < pendingPayments.length - 1 ? '1px solid var(--border-primary)' : 'none' 
                                }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {p.month}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                            {p.notes || 'Pending dues'}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 800, color: 'var(--danger)', fontSize: '14px' }}>
                                        ₹{(p.dueAmount !== undefined ? p.dueAmount : p.totalAmount).toLocaleString('en-IN')}
                                    </div>
                                </div>
                            ));
                        }
                        
                        if (payDuesTenantObj?.pendingDues > 0) {
                            return (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Current outstanding</div>
                                    </div>
                                    <div style={{ fontWeight: 800, color: 'var(--danger)', fontSize: '14px' }}>
                                        ₹{payDuesTenantObj.pendingDues.toLocaleString('en-IN')}
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                                No pending dues found.
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Input Section */}
            <div className="payment-form-stack" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Amount to Pay (₹)</label>
                    <input type="number" className="form-input" style={{ fontSize: '20px', fontWeight: 700, borderRadius: '12px', height: '52px' }} value={payDuesData.amount} onChange={e => setPayDuesData({...payDuesData, amount: e.target.value})} onWheel={(e) => e.target.blur()} autoFocus required max={payDuesTenantObj?.pendingDues} min="1" />
                </div>
                <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Payment Method</label>
                    <select className="form-select" style={{ height: '48px', borderRadius: '12px', fontWeight: 600 }} value={payDuesData.method} onChange={e => setPayDuesData({...payDuesData, method: e.target.value})} required>
                        <option value="Cash">💵 Cash</option>
                        <option value="Google Pay">📱 Google Pay</option>
                        <option value="PhonePe">📱 PhonePe</option>
                        <option value="Paytm">📱 Paytm</option>
                        <option value="UPI">📱 Other UPI</option>
                        <option value="CRED">💳 CRED</option>
                        <option value="Amazon Pay">🛒 Amazon Pay</option>
                        <option value="Bank Transfer">🏦 Bank Transfer</option>
                        <option value="Card">💳 Debit/Credit Card</option>
                    </select>
                </div>
            </div>

          </div>
          <div className="form-actions" style={{ marginTop: '24px', borderTop: '1px solid var(--border-primary)', paddingTop: '24px' }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1, height: '48px' }} onClick={() => setShowPayDuesModal(false)} disabled={isSubmittingPayment}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmittingPayment} style={{ flex: 2, height: '48px', fontWeight: 700, borderRadius: '12px', opacity: isSubmittingPayment ? 0.7 : 1, cursor: isSubmittingPayment ? 'not-allowed' : 'pointer' }}>
              {isSubmittingPayment ? 'Processing...' : `Pay ₹${(Number(payDuesData.amount) || 0).toLocaleString('en-IN')}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Camera Capture Modal */}
      <Modal isOpen={showCamera} onClose={closeCamera} title="Take Live Photo" maxWidth="500px">
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{width: '100%', backgroundColor: '#000', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '4/3', position: 'relative'}}>
                <video ref={videoRef} autoPlay playsInline muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </div>
            <div style={{marginTop: '20px', display: 'flex', gap: '12px'}}>
                <button className="btn btn-ghost" onClick={closeCamera}>Cancel</button>
                <button className="btn btn-primary" onClick={capturePhoto}><Camera size={16}/> Capture Photo</button>
            </div>
        </div>
      </Modal>
      {/* Photo Source Modal */}
      <Modal isOpen={!!photoSourceTarget} onClose={() => setPhotoSourceTarget(null)} title="Add Photo" maxWidth="320px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          <label className="btn btn-outline" style={{display: 'flex', justifyContent: 'center', cursor: 'pointer', margin: 0}}>
            <UploadCloud size={16}/> Upload from Device
            <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => {
              handlePhotoUpload(e, photoSourceTarget?.isCoTenant, photoSourceTarget?.index);
              setPhotoSourceTarget(null);
            }} />
          </label>
          <div style={{textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', fontWeight: 600}}>OR</div>
          {/* On mobile: open native camera. On desktop: open webcam modal */}
          {/Mobi|Android|iPad|iPhone|iPod/i.test(navigator.userAgent) ? (
            <label className="btn btn-primary" style={{display: 'flex', justifyContent: 'center', cursor: 'pointer', margin: 0}}>
              <Camera size={16}/> Take Live Photo
              <input type="file" accept="image/*" capture="user" style={{display: 'none'}} onChange={(e) => {
                handlePhotoUpload(e, photoSourceTarget?.isCoTenant, photoSourceTarget?.index);
                setPhotoSourceTarget(null);
              }} />
            </label>
          ) : (
            <button type="button" className="btn btn-primary" style={{display: 'flex', justifyContent: 'center', cursor: 'pointer', margin: 0}} onClick={() => {
              const target = photoSourceTarget;
              setPhotoSourceTarget(null);
              openCamera(target?.isCoTenant ?? false, target?.index ?? 0);
            }}>
              <Camera size={16}/> Take Live Photo (Webcam)
            </button>
          )}
        </div>
      </Modal>

      {/* Document Viewer Modal */}
      <Modal isOpen={!!viewDocUrl} onClose={() => setViewDocUrl(null)} title={viewDocUrl?.title || "View Document"} maxWidth="800px">
         <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%'}}>
            {viewDocUrl?.url?.startsWith('data:application/pdf') ? (
                <iframe src={viewDocUrl.url} style={{width: '100%', height: '60vh', border: 'none', borderRadius: 'var(--radius-md)'}} />
            ) : (
                <img src={viewDocUrl?.url} alt="Document" style={{maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 'var(--radius-md)'}} />
            )}
            <div style={{display: 'flex', gap: '12px'}}>
                <button className="btn btn-ghost" onClick={() => setViewDocUrl(null)}>Close</button>
                <a className="btn btn-primary" href={viewDocUrl?.url} download={viewDocUrl?.title || 'document'} style={{textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <Download size={16}/> Download File
                </a>
            </div>
         </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Tenant" maxWidth="400px">
        <div style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
          Are you sure you want to permanently delete <strong>{tenantToDelete?.name}</strong>? This action cannot be undone and will remove all records of this tenant.
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDeleteTenant}>Delete Permanently</button>
        </div>
      </Modal>

    </div>
  );
}

function User(props) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
}
