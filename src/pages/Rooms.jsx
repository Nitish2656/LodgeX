import { useState, useRef, useEffect } from 'react';
import { BedDouble, Search, Wrench, Users, DoorOpen, CalendarClock, MoreVertical, Edit2, Trash2, LogOut, IndianRupee, UserPlus, UploadCloud, Plus, CalendarPlus, ArrowRightLeft, Phone, MapPin, ShieldCheck, FileText, Download, History, Image, Camera } from 'lucide-react';
import { useStore } from '../data/store';
import Modal from '../components/Modal';
import './Pages.css';

const statusConfig = {
  occupied: { label: 'Occupied', color: 'var(--danger)', bg: 'var(--danger-bg)' },
  available: { label: 'Vacant', color: 'var(--success)', bg: 'var(--success-bg)' },
  reserved: { label: 'Reserved', color: 'var(--warning)', bg: 'var(--warning-bg)' },
  maintenance: { label: 'Maintenance', color: 'var(--danger)', bg: 'var(--danger-bg)' },
};

export default function RoomsPage() {
  const { rooms, tenants, payments, updateTenant, deleteTenant, vacateRoom, addPayment, addTenant, addRoom, updateRoom, deleteRoom, toggleRoomMaintenance, navigateWithAction, fetchTenantById, fetchPayments, uploadFile, searchQuery, pageAction, setPageAction } = useStore();
  const [filter, setFilter] = useState('all');

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

  // Tenant Detail Popup
  const [showTenantDetail, setShowTenantDetail] = useState(false);
  const [detailTenant, setDetailTenant] = useState(null);
  const [showPayDuesModal, setShowPayDuesModal] = useState(false);
  const [payDuesTenantObj, setPayDuesTenantObj] = useState(null);
  const [payDuesData, setPayDuesData] = useState({ amount: '', method: 'Cash' });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Forms
  const [editData, setEditData] = useState({});
  const [paymentData, setPaymentData] = useState({});
  const [assignData, setAssignData] = useState({ name: '', phone: '', address: '', parentName: '', parentPhone: '', joinDate: new Date().toISOString().split('T')[0], coTenants: [], roomId: '', roomNumber: '', rent: '', deposit: '', paidAmount: '', dueAmount: 0, method: 'Cash', photoFile: null, photoPreview: null, tenantAadhaar: null, parentAadhaar: null });
  const [addStep, setAddStep] = useState(1);
  const [isEditingTenant, setIsEditingTenant] = useState(false);
  const [editTenantId, setEditTenantId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [photoSourceTarget, setPhotoSourceTarget] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState({ isCoTenant: false, index: 0 });
  const [viewDocUrl, setViewDocUrl] = useState(null);
  const videoRef = useRef(null);
  const wizardProgressRef = useRef(null);
  const [stream, setStream] = useState(null);

  const [newRoomData, setNewRoomData] = useState({ number: '', floor: '', type: 'Single', rent: '' });
  const [rentData, setRentData] = useState({ tenantId: '', roomId: '', rentAmount: 0, month: '', paidAmount: '', dueAmount: '', method: 'Cash' });
  const [shiftData, setShiftData] = useState({ tenantId: '', oldRoomId: '', newRoomId: '', tenantName: '' });

  const filtered = rooms.filter(r => {
    const status = r.status;
    const matchFilter = filter === 'all' || status === filter;
    const roomNumber = r.number || '';
    const roomType = r.type || '';
    const matchSearch = searchQuery ? (roomNumber.toString().includes(searchQuery) || roomType.toLowerCase().includes(searchQuery.toLowerCase())) : true;
    return matchFilter && matchSearch;
  }).sort((a, b) => {
    if (a.status === 'available' && b.status !== 'available') return -1;
    if (a.status !== 'available' && b.status === 'available') return 1;
    return 0;
  });

  const getTenant = (tenantId) => tenants.find(t => t.id === tenantId || t._id === tenantId);
  const getTenantPayments = (tenantId) => payments.filter(p => (p.tenantId === tenantId || p._id === tenantId)).sort((a, b) => new Date(b.date) - new Date(a.date));
  const getPendingMonths = (tenantId) => {
    const pending = payments.filter(p => (p.tenantId === tenantId || p._id === tenantId) && p.status === 'pending' && p.month);
    return [...new Set(pending.map(p => p.month))].join(', ');
  };
  const getPendingMonthsLabel = (tenantId) => {
    const pending = payments.filter(p => (p.tenantId === tenantId || p._id === tenantId) && p.status === 'pending' && p.month);
    if (pending.length > 0) {
      return [...new Set(pending.map(p => p.month.split(' ')[0]))].join(', ') + ' Pending';
    }
    return new Date().toLocaleDateString('en-IN', { month: 'short' }) + ' Pending';
  };

  const getPaidDateLabel = (tenantId) => {
    const currentMonthLabel = new Date().toLocaleDateString('en-IN', { month: 'short' }).toLowerCase();
    const completedPayments = payments.filter(p => 
      (p.tenantId === tenantId || (p.tenantId && (p.tenantId._id === tenantId || p.tenantId.id === tenantId)) || p._id === tenantId) && 
      p.status === 'completed' &&
      p.month &&
      p.month.toLowerCase().includes(currentMonthLabel)
    );
    if (completedPayments.length > 0) {
      const sorted = [...completedPayments].sort((a, b) => new Date(b.date) - new Date(a.date));
      const latest = sorted[0];
      if (latest && latest.date) {
        const d = new Date(latest.date);
        return ` (${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;
      }
    }
    return '';
  };

  // Sync detailTenant with global tenants state
  useEffect(() => {
    if (detailTenant) {
      const updated = tenants.find(t => (t._id || t.id) === (detailTenant._id || detailTenant.id));
      if (updated && updated.pendingDues !== detailTenant.pendingDues) setDetailTenant(prev => ({ ...prev, ...updated }));
    }
  }, [tenants]);

  const handleRoomCardClick = async (room) => {
    const tenant = room.tenantId ? getTenant(room.tenantId) : null;
    if (tenant) {
      setDetailTenant(tenant);
      setShowTenantDetail(true);
      await fetchPayments();
    } else {
      openModal(room, 'assign');
    }
  };

  useEffect(() => {
    if (pageAction?.type === 'OPEN_ROOM' && pageAction?.id) {
      const room = rooms.find(r => r._id === pageAction.id || r.id === pageAction.id);
      if (room) {
        handleRoomCardClick(room);
        setPageAction(null);
      }
    }
  }, [pageAction, rooms, setPageAction]);

  const openPayDues = async (tenant) => {
    const tenantId = tenant._id || tenant.id;
    setPayDuesTenantObj(tenant);
    setPayDuesData({ amount: tenant.pendingDues, method: 'Cash' });
    setShowPayDuesModal(true);
    const tenantPendingPayments = payments.filter(p => (p.tenantId === tenantId || p._id === tenantId) && p.status === 'pending');
    if (tenantPendingPayments.length === 1) {
      const singleP = tenantPendingPayments[0];
      const currentDue = singleP.dueAmount !== undefined ? singleP.dueAmount : singleP.totalAmount;
      if (currentDue !== tenant.pendingDues) {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'https://lodgex-backend.onrender.com/api';
          await fetch(`${API_URL}/payments/${singleP._id || singleP.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dueAmount: tenant.pendingDues }) });
          await fetchPayments();
        } catch(e) { console.error('Failed to reconcile:', e); }
      }
    }
  };

  const handlePayDuesSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingPayment) return;
    const amountPaid = Number(payDuesData.amount);
    if (!amountPaid || amountPaid <= 0) return alert('Enter a valid amount');
    if (amountPaid > payDuesTenantObj.pendingDues) return alert('Amount cannot exceed pending dues');
    setIsSubmittingPayment(true);
    const newDues = payDuesTenantObj.pendingDues - amountPaid;
    try {
      await addPayment({ tenantId: payDuesTenantObj._id || payDuesTenantObj.id, tenantName: payDuesTenantObj.name, roomId: payDuesTenantObj.roomId, roomNumber: payDuesTenantObj.roomNumber, totalAmount: payDuesTenantObj.pendingDues, paidAmount: amountPaid, dueAmount: newDues, method: payDuesData.method, status: 'completed', month: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }), notes: newDues > 0 ? `Partial payment (₹${newDues.toLocaleString('en-IN')} remaining)` : 'Full dues cleared' });
      setPayDuesTenantObj(prev => prev ? { ...prev, pendingDues: newDues } : prev);
      setShowPayDuesModal(false);
    } catch(err) { alert('Payment failed.'); } finally { setIsSubmittingPayment(false); }
  };

  const handleViewDoc = (url, label) => {
    if (!url || url.includes('dicebear') || url === 'Aadhaar Card') return alert(`No ${label} document uploaded yet.`);
    if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('/api/files')) {
      setViewDocUrl({ url, title: label });
    } else {
      window.open(url, '_blank');
    }
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
          if (width > maxWidth) { height = (maxWidth / width) * height; width = maxWidth; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handlePhotoUpload = async (e, isCoTenant = false, index = 0) => {
    let file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) file = await compressImage(file);
      const preview = URL.createObjectURL(file);
      if (isCoTenant) {
        setAssignData(prev => { const newCo = [...prev.coTenants]; newCo[index] = { ...newCo[index], photoFile: file, photoPreview: preview }; return { ...prev, coTenants: newCo }; });
      } else {
        setAssignData(prev => ({...prev, photoFile: file, photoPreview: preview}));
      }
    }
  };

  const handleDocumentUpload = async (file, field, isCoTenant = false, index = 0) => {
    if (!file) return;
    let finalFile = file;
    if (file.type.startsWith('image/')) finalFile = await compressImage(file, 1000); 
    if (isCoTenant) {
        setAssignData(prev => { const newCo = [...prev.coTenants]; newCo[index] = { ...newCo[index], [field]: finalFile }; return { ...prev, coTenants: newCo }; });
    } else {
        setAssignData(prev => ({ ...prev, [field]: finalFile }));
    }
  };

  const openCamera = (isCoTenant = false, index = 0) => {
    setCameraTarget({ isCoTenant, index });
    setShowCamera(true);
    navigator.mediaDevices.getUserMedia({ video: true }).then(s => { setStream(s); if (videoRef.current) videoRef.current.srcObject = s; }).catch(err => {
        setShowCamera(false); alert('Could not access camera. Please use "Upload from Device" as an alternative.');
    });
  };

  const closeCamera = () => { if (stream) stream.getTracks().forEach(t => t.stop()); setStream(null); setShowCamera(false); };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async (blob) => {
      let file = await compressImage(new File([blob], 'live_capture.jpg', { type: 'image/jpeg' }));
      const preview = URL.createObjectURL(file);
      if (cameraTarget.isCoTenant) {
        const newCo = [...assignData.coTenants];
        newCo[cameraTarget.index].photoFile = file; newCo[cameraTarget.index].photoPreview = preview;
        setAssignData({ ...assignData, coTenants: newCo });
      } else {
        setAssignData(prev => ({...prev, photoFile: file, photoPreview: preview}));
      }
      closeCamera();
    }, 'image/jpeg', 0.7);
  };

  const validateStep = () => {
    if (addStep === 1) { if (!assignData.roomId) { alert('Please select a room'); return false; } }
    else if (addStep === 2) {
      if (!assignData.name || !assignData.phone || !assignData.address || !assignData.parentName || !assignData.parentPhone) {
        alert('Please fill all required fields for the primary tenant (*)'); return false;
      }
    }
    return true;
  };

  const handleNextStep = () => { if (validateStep()) setAddStep(s => s + 1); };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (showAssignModal && wizardProgressRef.current) {
      const activeStep = wizardProgressRef.current.querySelector('.wizard-step.active');
      if (activeStep) {
        activeStep.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [addStep, showAssignModal]);

  const openModal = (room, modalType) => {
    setSelectedRoom(room);
    setActiveMenuId(null);
    if (modalType === 'edit') {
      const tenant = getTenant(room.tenantId);
      if (tenant) {
        setIsEditingTenant(true);
        setEditTenantId(tenant._id || tenant.id);
        const tenantRent = tenant.rent || room.rent || '';
        setAssignData({
          ...tenant,
          joinDate: tenant.joinDate ? tenant.joinDate.split('T')[0] : new Date().toISOString().split('T')[0],
          roomId: room._id || room.id,
          roomNumber: room.number,
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
        setShowAssignModal(true);
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
      setIsEditingTenant(false);
      setEditTenantId(null);
      setAssignData({ name: '', phone: '', address: '', parentName: '', parentPhone: '', joinDate: new Date().toISOString().split('T')[0], coTenants: [], roomId: room._id || room.id, roomNumber: room.number, rent: room.rent, deposit: '', paidAmount: '', dueAmount: 0, method: 'Cash', photoFile: null, photoPreview: null, tenantAadhaar: null, parentAadhaar: null });
      setAddStep(1);
      setShowAssignModal(true);
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

  const selectedRoomObj = rooms.find(r => (r._id || r.id)?.toString() === assignData.roomId?.toString());
  const maxOccupancy = selectedRoomObj?.type === 'Single' ? 3 : selectedRoomObj?.type === 'Double' ? 5 : 6;
  const canAddRoommate = assignData.coTenants.length < (maxOccupancy - 1);
  const isLastStep = addStep === 3;

  const handleAddSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isLastStep) { handleNextStep(); return; }
    if (!validateStep()) return;
    if (!assignData.roomId) return alert('Please select a room');
    
    setIsSaving(true);
    try {
      const room = rooms.find(r => (r._id || r.id).toString() === assignData.roomId.toString());
      const [tenantPhotoUrl, tenantAadhaarUrl, parentAadhaarUrl] = await Promise.all([ uploadFile(assignData.photoFile), uploadFile(assignData.tenantAadhaar), uploadFile(assignData.parentAadhaar) ]);
      const avatar = tenantPhotoUrl || (assignData.avatar && !assignData.avatar.startsWith('blob:') ? assignData.avatar : `https://api.dicebear.com/9.x/initials/svg?seed=${assignData.name}&backgroundColor=6366f1`);

      const mappedCoTenants = await Promise.all(assignData.coTenants.map(async (ct) => {
         const [ctPhotoUrl, ctAadhaarUrl, ctParentAadhaarUrl] = await Promise.all([ uploadFile(ct.photoFile), uploadFile(ct.tenantAadhaar), uploadFile(ct.parentAadhaar) ]);
         return { name: ct.name, phone: ct.phone, parentName: ct.parentName, parentPhone: ct.parentPhone, avatar: ctPhotoUrl || (ct.avatar && !ct.avatar.startsWith('blob:') ? ct.avatar : `https://api.dicebear.com/9.x/initials/svg?seed=${ct.name}&backgroundColor=6366f1`), idProof: ctAadhaarUrl || ct.idProof, parentIdProof: ctParentAadhaarUrl || ct.parentIdProof };
      }));

      const tenantData = { name: assignData.name, phone: assignData.phone, address: assignData.address, parentName: assignData.parentName, parentPhone: assignData.parentPhone, idProof: tenantAadhaarUrl || assignData.idProof, parentIdProof: parentAadhaarUrl || assignData.parentIdProof, coTenants: mappedCoTenants, roomId: assignData.roomId, roomNumber: room.number, rent: Number(assignData.rent) || room.rent, deposit: Number(assignData.deposit) || 0, pendingDues: Number(assignData.dueAmount) || 0, avatar: avatar, joinDate: new Date(assignData.joinDate).toISOString(), status: 'active', vacateDate: null };

      if (isEditingTenant) {
        await updateTenant(editTenantId, tenantData);
        if ((Number(assignData.paidAmount) || 0) > 0) {
          addPayment({ tenantId: editTenantId, tenantName: tenantData.name, roomId: tenantData.roomId, roomNumber: tenantData.roomNumber, totalAmount: 0, paidAmount: Number(assignData.paidAmount) || 0, dueAmount: tenantData.pendingDues, method: assignData.method, status: 'completed', month: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }), notes: 'Payment on update' });
        }
      } else {
        const newTenant = await addTenant(tenantData);
        if (newTenant && ((Number(assignData.paidAmount) || 0) > 0 || (Number(assignData.dueAmount) || 0) > 0)) {
          addPayment({ tenantId: newTenant._id || newTenant.id, tenantName: newTenant.name, roomId: newTenant.roomId, roomNumber: newTenant.roomNumber, totalAmount: Number(assignData.deposit) || 0, paidAmount: Number(assignData.paidAmount) || 0, dueAmount: Number(assignData.dueAmount) || 0, method: assignData.method, status: (Number(assignData.dueAmount) || 0) > 0 ? 'pending' : 'completed', month: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }), notes: 'Advance/Deposit on allocation' });
        }
      }
    } catch (error) { console.error("Error saving tenant:", error); alert("Failed to save tenant. Please try again."); } finally { setIsSaving(false); }
    setShowAssignModal(false);
  };

  const handleAddRoomSubmit = (e) => {
    e.preventDefault();
    const roomPayload = {
        number: newRoomData.number,
        floor: newRoomData.floor, // Keep as string (e.g. "Ground Floor")
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
          <div className="page-title" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BedDouble size={20} />
            <span className="mobile-title">Rooms</span>
          </div>
        </div>
        <div className="toolbar-right">
          <div className="toolbar-filters">
            {['all', 'occupied', 'available'].map(f => (
              <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : statusConfig[f].label}
              </button>
            ))}
          </div>
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
            <div key={room._id || room.id} className={`room-card animate-in stagger-${(idx % 8) + 1}`} onClick={() => handleRoomCardClick(room)} style={{ cursor: 'pointer', zIndex: activeMenuId === (room._id || room.id) ? 999 : 1 }}>
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
                            <button className="action-menu-item danger" onClick={() => openModal(room, 'delete')}><Trash2 size={14} /> Delete Tenant</button>
                          </>
                        ) : (
                          <>
                            <button className="action-menu-item" onClick={() => openModal(room, 'assign')}><UserPlus size={14} /> Assign Tenant</button>
                            <button className="action-menu-item" onClick={() => openModal(room, 'editRoom')}><Edit2 size={14} /> Edit Room Details</button>
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
                    {tenant.pendingDues > 0 ? (
                      <div className="room-tenant-dues" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.3)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'right' }}>
                        <div>{getPendingMonthsLabel(tenant._id || tenant.id)}</div>
                        <div style={{ fontSize: '12px', marginTop: '1px' }}>₹{tenant.pendingDues.toLocaleString('en-IN')}</div>
                      </div>
                    ) : (
                      <div className="room-tenant-dues" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'right', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{new Date().toLocaleDateString('en-IN', { month: 'short' })} Paid {getPaidDateLabel(tenant._id || tenant.id)}</span>
                        <span style={{ fontSize: '12px' }}>✓</span>
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


      {/* Assign Tenant Modal (Multi-step) */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title={isEditingTenant ? "Edit Tenant Details" : "Assign Tenant to Room"} maxWidth="850px">
        <div className="wizard-progress" ref={wizardProgressRef}>
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

        <div className="form-container" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubmit(); } }}>
          {/* STEP 1: ROOM SELECTION */}
          <div style={{ display: addStep === 1 ? 'block' : 'none', animation: 'fadeIn 0.3s ease' }}>
            <h3 className="profile-section-title" style={{ marginTop: 0 }}>Room & Payment Details</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Assign Room *</label>
                <select className="form-select" value={assignData.roomId} disabled required={addStep === 1}>
                  <option value={assignData.roomId}>Room {assignData.roomNumber}</option>
                </select>
              </div>
              <div className="form-group full">
                <label className="form-label">Date of Joining</label>
                <input type="date" className="form-input" value={assignData.joinDate} onChange={e => setAssignData({...assignData, joinDate: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Rent (₹)</label>
                <input type="number" className="form-input" value={assignData.rent} onWheel={(e) => e.target.blur()} onChange={e => {
                    const monthly = Number(e.target.value);
                    const booked = Number(assignData.paidAmount) || 0;
                    setAssignData({...assignData, rent: monthly, dueAmount: Math.max(0, (monthly || 0) - booked)});
                }} />
              </div>
              <div className="form-group">
                <label className="form-label">Amount Paid Upfront (₹)</label>
                <input type="number" className="form-input" value={assignData.paidAmount} onWheel={(e) => e.target.blur()} onChange={e => {
                    const booked = Number(e.target.value);
                    const monthly = Number(assignData.rent) || 0;
                    setAssignData({...assignData, paidAmount: booked, deposit: booked, dueAmount: Math.max(0, monthly - (booked || 0))});
                }} />
              </div>
              <div className="form-group full">
                <label className="form-label">Pending Amount (₹) <span style={{fontWeight: 'normal', opacity: 0.7}}>= Monthly − Paid</span></label>
                <input type="number" className="form-input" value={assignData.dueAmount} readOnly style={{ background: assignData.dueAmount > 0 ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)', borderColor: assignData.dueAmount > 0 ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)', color: assignData.dueAmount > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }} />
              </div>
            </div>
          </div>

          {/* STEP 2: PRIMARY TENANT */}
          <div style={{ display: addStep === 2 ? 'block' : 'none', animation: 'fadeIn 0.3s ease' }}>
            <h3 className="profile-section-title" style={{ marginTop: 0 }}>Primary Tenant Information</h3>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Full Name *</label><input type="text" className="form-input" value={assignData.name} onChange={e => setAssignData({...assignData, name: e.target.value})} required={addStep === 2} /></div>
              <div className="form-group"><label className="form-label">Contact Number *</label><input type="tel" className="form-input" value={assignData.phone} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10); setAssignData({...assignData, phone: val}); }} required={addStep === 2} placeholder="10-digit number" /></div>
              <div className="form-group full"><label className="form-label">Permanent Address *</label><input type="text" className="form-input" value={assignData.address} onChange={e => setAssignData({...assignData, address: e.target.value})} required={addStep === 2} /></div>
              <div className="form-group"><label className="form-label">Guardian's Name *</label><input type="text" className="form-input" value={assignData.parentName} onChange={e => setAssignData({...assignData, parentName: e.target.value})} required={addStep === 2} /></div>
              <div className="form-group"><label className="form-label">Guardian's Contact *</label><input type="tel" className="form-input" value={assignData.parentPhone} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10); setAssignData({...assignData, parentPhone: val}); }} required={addStep === 2} placeholder="10-digit number" /></div>
            </div>
            <h3 className="profile-section-title" style={{ marginTop: '24px' }}>Documents</h3>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Tenant Photo</label>
                <div className={`file-upload-box ${assignData.photoFile ? 'uploaded' : ''}`} style={{cursor: 'pointer', position: 'relative'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', flex: 1}} onClick={() => setPhotoSourceTarget({ isCoTenant: false, index: 0 })}>
                    <UploadCloud size={20} style={{color: assignData.photoFile ? 'var(--success)' : 'inherit'}}/>
                    <span style={{fontSize: '12px'}}>{assignData.photoFile ? 'Uploaded' : 'Add Photo'}</span>
                    {assignData.photoPreview && <img src={assignData.photoPreview} alt="" style={{width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover'}}/>}
                  </div>
                  {assignData.photoFile && ( <button type="button" className="btn-icon-sm" style={{ zIndex: 10, background: 'rgba(99,102,241,0.1)', padding: '4px', borderRadius: '4px' }} onClick={(e) => { e.stopPropagation(); handleViewDoc(assignData.photoPreview, 'Tenant Photo'); }}><Download size={12}/></button> )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tenant Aadhaar</label>
                <div className={`file-upload-box ${assignData.tenantAadhaar ? 'uploaded' : ''}`} style={{ position: 'relative' }}>
                  <UploadCloud size={20} style={{color: assignData.tenantAadhaar ? 'var(--success)' : 'inherit'}} />
                  <span style={{fontSize: '12px'}}>{assignData.tenantAadhaar ? 'Uploaded' : 'Upload ID'}</span>
                  {assignData.tenantAadhaar && ( <button type="button" className="btn-icon-sm" style={{ marginLeft: 'auto', zIndex: 10, background: 'rgba(99,102,241,0.1)', padding: '4px', borderRadius: '4px' }} onClick={(e) => { e.stopPropagation(); handleViewDoc(URL.createObjectURL(assignData.tenantAadhaar), 'Tenant Aadhaar'); }}><Download size={12}/></button> )}
                  <input type="file" accept="image/*" onChange={e => handleDocumentUpload(e.target.files[0], 'tenantAadhaar')} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 1 }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Guardian Aadhaar</label>
                <div className={`file-upload-box ${assignData.parentAadhaar ? 'uploaded' : ''}`} style={{ position: 'relative' }}>
                  <UploadCloud size={20} style={{color: assignData.parentAadhaar ? 'var(--success)' : 'inherit'}} />
                  <span style={{fontSize: '12px'}}>{assignData.parentAadhaar ? 'Uploaded' : 'Upload ID'}</span>
                  {assignData.parentAadhaar && ( <button type="button" className="btn-icon-sm" style={{ marginLeft: 'auto', zIndex: 10, background: 'rgba(99,102,241,0.1)', padding: '4px', borderRadius: '4px' }} onClick={(e) => { e.stopPropagation(); handleViewDoc(URL.createObjectURL(assignData.parentAadhaar), 'Guardian Aadhaar'); }}><Download size={12}/></button> )}
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
                    <p style={{fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px'}}>Add up to {maxOccupancy - 1} roommates for this {selectedRoomObj?.type || 'selected'} room.</p>
                </div>
                {canAddRoommate && ( <button type="button" className="btn btn-ghost" onClick={() => { setAssignData({...assignData, coTenants: [...assignData.coTenants, { name: '', phone: '', parentName: '', parentPhone: '', photoFile: null, photoPreview: null, tenantAadhaar: null, parentAadhaar: null }]}); }}><Plus size={14}/> Add Roommate</button> )}
              </div>
              {assignData.coTenants.length === 0 && ( <div className="page-empty" style={{padding: '24px'}}>No roommates added. Click the button above to add one.</div> )}
              {assignData.coTenants.map((ct, i) => (
                <div key={i} className="cotenant-card">
                  <div className="cotenant-card-header"><h4>Roommate #{i + 1}</h4><button type="button" onClick={() => setAssignData({...assignData, coTenants: assignData.coTenants.filter((_, idx) => idx !== i)})} className="btn-remove"><Trash2 size={14}/> Remove</button></div>
                  <div className="form-grid">
                    <div className="form-group"><label className="form-label">Full Name *</label><input type="text" className="form-input" value={ct.name} onChange={e => {const n=[...assignData.coTenants]; n[i].name=e.target.value; setAssignData({...assignData, coTenants: n})}} required={addStep === 3} /></div>
                    <div className="form-group"><label className="form-label">Contact *</label><input type="tel" className="form-input" value={ct.phone} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10); const n=[...assignData.coTenants]; n[i].phone=val; setAssignData({...assignData, coTenants: n}) }} required={addStep === 3} placeholder="10-digit number" /></div>
                    <div className="form-group"><label className="form-label">Guardian Name *</label><input type="text" className="form-input" value={ct.parentName} onChange={e => {const n=[...assignData.coTenants]; n[i].parentName=e.target.value; setAssignData({...assignData, coTenants: n})}} required={addStep === 3} /></div>
                    <div className="form-group"><label className="form-label">Guardian Contact *</label><input type="tel" className="form-input" value={ct.parentPhone} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10); const n=[...assignData.coTenants]; n[i].parentPhone=val; setAssignData({...assignData, coTenants: n}) }} required={addStep === 3} placeholder="10-digit number" /></div>
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: '16px' }}>
                    <div className="form-group">
                        <label className="form-label">Photo</label>
                        <div className={`file-upload-box ${ct.photoFile ? 'uploaded' : ''}`} style={{cursor: 'pointer', position: 'relative'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px', flex: 1}} onClick={() => setPhotoSourceTarget({ isCoTenant: true, index: i })}><UploadCloud size={20} style={{color: ct.photoFile ? 'var(--success)' : 'inherit'}}/><span style={{fontSize: '12px'}}>{ct.photoFile ? 'Uploaded' : 'Add Photo'}</span>{ct.photoPreview && <img src={ct.photoPreview} alt="" style={{width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover'}}/>}</div>
                            {ct.photoFile && ( <button type="button" className="btn-icon-sm" style={{ zIndex: 10, background: 'rgba(99,102,241,0.1)', padding: '4px', borderRadius: '4px' }} onClick={(e) => { e.stopPropagation(); handleViewDoc(ct.photoPreview, `${ct.name} - Photo`); }}><Download size={12}/></button> )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Aadhaar</label>
                        <div className={`file-upload-box ${ct.tenantAadhaar ? 'uploaded' : ''}`} style={{ position: 'relative' }}>
                            <UploadCloud size={20} style={{color: ct.tenantAadhaar ? 'var(--success)' : 'inherit'}}/><span style={{fontSize: '12px'}}>{ct.tenantAadhaar ? 'Uploaded' : 'Upload'}</span>
                            {ct.tenantAadhaar && ( <button type="button" className="btn-icon-sm" style={{ marginLeft: 'auto', zIndex: 10, background: 'rgba(99,102,241,0.1)', padding: '4px', borderRadius: '4px' }} onClick={(e) => { e.stopPropagation(); handleViewDoc(URL.createObjectURL(ct.tenantAadhaar), 'Tenant Aadhaar'); }}><Download size={12}/></button> )}
                            <input type="file" accept="image/*" onChange={e => handleDocumentUpload(e.target.files[0], 'tenantAadhaar', true, i)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 1 }} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Parent Aadhaar</label>
                        <div className={`file-upload-box ${ct.parentAadhaar ? 'uploaded' : ''}`} style={{ position: 'relative' }}>
                            <UploadCloud size={20} style={{color: ct.parentAadhaar ? 'var(--success)' : 'inherit'}}/><span style={{fontSize: '12px'}}>{ct.parentAadhaar ? 'Uploaded' : 'Upload'}</span>
                            {ct.parentAadhaar && ( <button type="button" className="btn-icon-sm" style={{ marginLeft: 'auto', zIndex: 10, background: 'rgba(99,102,241,0.1)', padding: '4px', borderRadius: '4px' }} onClick={(e) => { e.stopPropagation(); handleViewDoc(URL.createObjectURL(ct.parentAadhaar), 'Parent Aadhaar'); }}><Download size={12}/></button> )}
                            <input type="file" accept="image/*" onChange={e => handleDocumentUpload(e.target.files[0], 'parentAadhaar', true, i)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 1 }} />
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="form-actions" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--border-primary)', paddingTop: '20px', marginTop: '24px' }}>
            {addStep > 1 ? ( <button type="button" className="btn btn-ghost" onClick={() => setAddStep(s => s - 1)}>Back</button> ) : ( <button type="button" className="btn btn-ghost" onClick={() => setShowAssignModal(false)}>Cancel</button> )}
            {(addStep < 3) ? ( <button type="button" className="btn btn-primary" onClick={handleNextStep}>Next Step</button> ) : (
              <button type="button" className={`btn btn-primary ${isSaving ? 'loading' : ''}`} onClick={async () => { await handleAddSubmit(); }} disabled={isSaving}>
                {isSaving ? ( <><div className="btn-spinner" style={{ marginRight: '8px' }}></div>Saving...</> ) : ( <><UserPlus size={14} style={{marginRight: '8px'}}/>{isEditingTenant ? 'Save Changes' : 'Allocate Room & Save'}</> )}
              </button>
            )}
          </div>
        </div>
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
              <input type="text" className="form-input" placeholder="e.g. Ground, 1st Floor" value={newRoomData.floor} onChange={e => setNewRoomData({...newRoomData, floor: e.target.value})} required />
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

      {/* Tenant Detail Popup */}
      {detailTenant && (
        <Modal isOpen={showTenantDetail} onClose={() => setShowTenantDetail(false)} title="" maxWidth="850px">
          <div style={{ height: '120px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.02))', margin: '-24px -24px 0', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost" style={{ background: 'var(--bg-card)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} onClick={() => { setShowTenantDetail(false); const r = rooms.find(rm => (rm._id || rm.id).toString() === detailTenant.roomId?.toString()); if(r) openModal(r, 'edit'); }}>
                <Edit2 size={14}/> Edit
              </button>
              <button className="btn btn-ghost" style={{ background: 'var(--bg-card)', color: 'var(--danger)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} onClick={() => { setShowTenantDetail(false); const r = rooms.find(rm => (rm._id || rm.id).toString() === detailTenant.roomId?.toString()); if(r) openModal(r, 'vacate'); }}>
                <LogOut size={14}/> Vacate
              </button>
            </div>
          </div>
          <div style={{ padding: '0', marginTop: '-40px', marginBottom: '32px', display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
            <img src={detailTenant.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${detailTenant.name}&backgroundColor=6366f1`} alt="" style={{ width: '100px', height: '100px', borderRadius: '24px', border: '4px solid var(--bg-card)', objectFit: 'cover', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)', background: 'var(--bg-card)' }} />
            <div style={{ paddingBottom: '4px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em', textTransform: 'capitalize' }}>{detailTenant.name}</h3>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 600, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} style={{ color: 'var(--accent-primary)' }}/> Room {detailTenant.roomNumber}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CalendarClock size={14} style={{ color: 'var(--accent-primary)' }}/> Joined {new Date(detailTenant.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px' }}><Phone size={18} style={{ color: 'var(--accent-primary)' }} /> Personal Details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Phone</span><span style={{ fontSize: '14px', fontWeight: 600 }}>{detailTenant.phone}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Address</span><span style={{ fontSize: '14px', fontWeight: 600, textAlign: 'right', maxWidth: '180px' }}>{detailTenant.address || '-'}</span></div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px' }}><ShieldCheck size={18} style={{ color: 'var(--success)' }} /> Guardian Details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Name</span><span style={{ fontSize: '14px', fontWeight: 600 }}>{detailTenant.parentName || '-'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Contact</span><span style={{ fontSize: '14px', fontWeight: 600 }}>{detailTenant.parentPhone || '-'}</span></div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-primary)', gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Monthly Rent</span>
                <span style={{ fontSize: '20px', fontWeight: 800 }}>₹{detailTenant.rent?.toLocaleString('en-IN') || '-'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Deposit</span>
                <span style={{ fontSize: '20px', fontWeight: 800 }}>₹{detailTenant.deposit?.toLocaleString('en-IN') || '-'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: detailTenant.pendingDues > 0 ? 'rgba(239,68,68,0.05)' : 'rgba(52,211,153,0.05)', padding: '16px', borderRadius: '20px', margin: '-12px', border: detailTenant.pendingDues > 0 ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(52,211,153,0.15)' }}>
                <div style={{ fontSize: '12px', color: detailTenant.pendingDues > 0 ? 'rgba(239,68,68,0.8)' : 'rgba(52,211,153,0.8)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{detailTenant.pendingDues > 0 ? getPendingMonthsLabel(detailTenant._id || detailTenant.id) : `${new Date().toLocaleDateString('en-IN', { month: 'short' })} Rent: Paid ✓${getPaidDateLabel(detailTenant._id || detailTenant.id)}`}</span>
                  {detailTenant.pendingDues > 0 && <button style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.2)' }} onClick={() => openPayDues(detailTenant)}>Pay Now</button>}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: detailTenant.pendingDues > 0 ? '#ef4444' : '#34d399' }}>
                  {detailTenant.pendingDues > 0 ? `₹${detailTenant.pendingDues.toLocaleString('en-IN')} Due` : 'No Pending Dues'}
                </div>
                {detailTenant.pendingDues > 0 && payments.filter(p => (p.tenantId === (detailTenant._id || detailTenant.id) || p._id === (detailTenant._id || detailTenant.id)) && p.status === 'pending').length > 0 && (
                  <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid rgba(239,68,68,0.15)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(239,68,68,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dues Breakdown</div>
                    {payments.filter(p => (p.tenantId === (detailTenant._id || detailTenant.id) || p._id === (detailTenant._id || detailTenant.id)) && p.status === 'pending').map((p) => (
                      <div key={p._id || p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', background: 'rgba(255,255,255,0.5)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.1)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📅 {p.month || 'Advance/Other'}</span>
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>₹{(p.dueAmount !== undefined ? p.dueAmount : p.totalAmount).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-primary)', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px' }}><FileText size={18} style={{ color: 'var(--warning)' }} /> Documents</div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: '1 1 200px' }} onClick={() => handleViewDoc(detailTenant.idProof, 'Tenant Aadhaar')}><FileText size={20} style={{ color: 'var(--accent-primary)' }} /><span style={{ fontSize: '13px', fontWeight: 600, flex: 1 }}>Tenant Aadhaar</span><Download size={14} style={{ color: 'var(--text-tertiary)' }} /></div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: '1 1 200px' }} onClick={() => handleViewDoc(detailTenant.parentIdProof, 'Parent Aadhaar')}><FileText size={20} style={{ color: 'var(--accent-primary)' }} /><span style={{ fontSize: '13px', fontWeight: 600, flex: 1 }}>Parent Aadhaar</span><Download size={14} style={{ color: 'var(--text-tertiary)' }} /></div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: '1 1 200px' }} onClick={() => handleViewDoc(detailTenant.avatar, 'Tenant Photo')}><Image size={20} style={{ color: 'var(--accent-primary)' }} /><span style={{ fontSize: '13px', fontWeight: 600, flex: 1 }}>Tenant Photo</span><Download size={14} style={{ color: 'var(--text-tertiary)' }} /></div>
              </div>
            </div>
          </div>

          {detailTenant.coTenants && detailTenant.coTenants.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px' }}>
                      <Users size={18} style={{ color: 'var(--accent-primary)' }} /> Roommates ({detailTenant.coTenants.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                      {detailTenant.coTenants.map((ct, idx) => (
                          <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                  <img src={ct.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${ct.name}&backgroundColor=6366f1`} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bg-card)' }} />
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
                                  <div style={{ background: 'var(--bg-card)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, cursor: 'pointer', border: '1px solid var(--border-primary)' }} onClick={() => handleViewDoc(ct.idProof, `${ct.name} - Aadhaar`)}>
                                      <span>Aadhaar</span><Download size={12} style={{color: 'var(--accent-primary)'}}/>
                                  </div>
                                  <div style={{ background: 'var(--bg-card)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, cursor: 'pointer', border: '1px solid var(--border-primary)' }} onClick={() => handleViewDoc(ct.parentIdProof, `${ct.name} - Parent ID`)}>
                                      <span>Parent ID</span><Download size={12} style={{color: 'var(--accent-primary)'}}/>
                                  </div>
                                  <div style={{ background: 'var(--bg-card)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, cursor: 'pointer', border: '1px solid var(--border-primary)' }} onClick={() => handleViewDoc(ct.avatar, `${ct.name} - Photo`)}>
                                      <span>Photo</span><Download size={12} style={{color: 'var(--accent-primary)'}}/>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px' }}><History size={18} style={{ color: 'var(--accent-primary)' }} /> Payment History</div>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '20px', overflow: 'hidden' }}>
            <table className="data-table" style={{ border: 'none', margin: 0, width: '100%' }}>
              <thead style={{ background: 'transparent' }}><tr><th style={{ paddingLeft: '24px', borderBottom: '1px solid var(--border-primary)' }}>Date</th><th style={{ borderBottom: '1px solid var(--border-primary)' }}>Amount Paid</th><th style={{ borderBottom: '1px solid var(--border-primary)' }}>Method</th><th style={{ paddingRight: '24px', borderBottom: '1px solid var(--border-primary)' }}>Status</th></tr></thead>
              <tbody>
                {getTenantPayments(detailTenant._id || detailTenant.id).length > 0 ? (
                  getTenantPayments(detailTenant._id || detailTenant.id).map((p, idx, arr) => (
                    <tr key={p._id || p.id}>
                      <td style={{ paddingLeft: '24px', borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--border-primary)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '500' }}>{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', opacity: 0.8 }}>
                            {new Date(p.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} {p.month ? `• ${p.month}` : ''}
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

      {/* Pay Dues Modal */}
      <Modal isOpen={showPayDuesModal} onClose={() => setShowPayDuesModal(false)} title={`Collect Payment - ${payDuesTenantObj?.name || ''}`} maxWidth="500px">
        <form onSubmit={handlePayDuesSubmit}>
          <div style={{ textAlign: 'center', padding: '20px', background: 'linear-gradient(135deg, rgba(239,68,68,0.05), rgba(239,68,68,0.02))', borderRadius: '20px', marginBottom: '20px', border: '1px solid rgba(239,68,68,0.08)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(239,68,68,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>Total Outstanding</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#ef4444' }}>₹{payDuesTenantObj?.pendingDues?.toLocaleString('en-IN') || 0}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Amount to Pay (₹)</label>
              <input type="number" className="form-input" style={{ fontSize: '20px', fontWeight: 700, borderRadius: '12px', height: '52px' }} value={payDuesData.amount} onChange={e => setPayDuesData({...payDuesData, amount: e.target.value})} onWheel={(e) => e.target.blur()} required max={payDuesTenantObj?.pendingDues} min="1" />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Payment Method</label>
              <select className="form-select" style={{ height: '48px', borderRadius: '12px', fontWeight: 600 }} value={payDuesData.method} onChange={e => setPayDuesData({...payDuesData, method: e.target.value})} required>
                <option value="Cash">💵 Cash</option><option value="Google Pay">📱 Google Pay</option><option value="PhonePe">📱 PhonePe</option><option value="Paytm">📱 Paytm</option><option value="UPI">📱 Other UPI</option><option value="CRED">💳 CRED</option><option value="Bank Transfer">🏦 Bank Transfer</option>
              </select>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowPayDuesModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmittingPayment}>{isSubmittingPayment ? 'Processing...' : '💰 Collect Payment'}</button>
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
          <label className="btn btn-outline" style={{display: 'flex', justifyContent: 'center', cursor: 'pointer', margin: 0}}><UploadCloud size={16}/> Upload from Device<input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => { handlePhotoUpload(e, photoSourceTarget?.isCoTenant, photoSourceTarget?.index); setPhotoSourceTarget(null); }} /></label>
          <div style={{textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', fontWeight: 600}}>OR</div>
          {/Mobi|Android|iPad|iPhone|iPod/i.test(navigator.userAgent) ? ( <label className="btn btn-primary" style={{display: 'flex', justifyContent: 'center', cursor: 'pointer', margin: 0}}><Camera size={16}/> Take Live Photo<input type="file" accept="image/*" capture="user" style={{display: 'none'}} onChange={(e) => { handlePhotoUpload(e, photoSourceTarget?.isCoTenant, photoSourceTarget?.index); setPhotoSourceTarget(null); }} /></label> ) : ( <button type="button" className="btn btn-primary" style={{display: 'flex', justifyContent: 'center', cursor: 'pointer', margin: 0}} onClick={() => { const target = photoSourceTarget; setPhotoSourceTarget(null); openCamera(target?.isCoTenant ?? false, target?.index ?? 0); }}><Camera size={16}/> Take Live Photo (Webcam)</button> )}
        </div>
      </Modal>
      {/* Document Viewer Modal */}
      <Modal isOpen={!!viewDocUrl} onClose={() => setViewDocUrl(null)} title={viewDocUrl?.title || "View Document"} maxWidth="800px">
         <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%'}}>
            {viewDocUrl?.url?.startsWith('data:application/pdf') ? ( <iframe src={viewDocUrl.url} style={{width: '100%', height: '60vh', border: 'none', borderRadius: 'var(--radius-md)'}} /> ) : ( <img src={viewDocUrl?.url} alt="Document" style={{maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 'var(--radius-md)'}} /> )}
            <div style={{display: 'flex', gap: '12px'}}><button className="btn btn-ghost" onClick={() => setViewDocUrl(null)}>Close</button><a className="btn btn-primary" href={viewDocUrl?.url} download={viewDocUrl?.title || 'document'} style={{textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px'}}><Download size={16}/> Download File</a></div>
         </div>
      </Modal>

    </div>
  );
}
