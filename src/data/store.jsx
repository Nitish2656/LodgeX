import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const globalFetch = globalThis.fetch;

export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('lodgex_token');
  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }
  return globalFetch(url, { ...options, headers });
};

// ===== Mock Data =====
const generateRooms = () => {
  const statuses = ['occupied', 'available', 'reserved', 'maintenance'];
  const types = ['Single', 'Double', 'Flat'];
  const rents = { Single: 3500, Double: 5000, Flat: 7500 };
  const rooms = [];
  for (let i = 1; i <= 30; i++) {
    const status = statuses[Math.floor(Math.random() * 3)];
    const type = types[i % 3];
    rooms.push({
      id: i,
      number: `${100 + i}`,
      floor: Math.ceil(i / 10),
      type,
      status: i === 5 || i === 22 ? 'maintenance' : status,
      rent: rents[type],
      tenantId: status === 'occupied' ? `tenant-${i}` : null,
    });
  }
  return rooms;
};

const generateTenants = (rooms) => {
  const firstNames = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rohit', 'Kavita', 'Suresh', 'Meera', 'Karan', 'Pooja', 'Nikhil', 'Divya', 'Arjun', 'Neha'];
  const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Verma', 'Jain', 'Reddy', 'Mishra', 'Chopra'];
  const tenants = [];
  rooms.filter(r => r.status === 'occupied').forEach((room, idx) => {
    const fn = firstNames[idx % firstNames.length];
    const ln = lastNames[idx % lastNames.length];
    tenants.push({
      id: `tenant-${room.id}`,
      name: `${fn} ${ln}`,
      phone: `98${String(Math.floor(10000000 + Math.random() * 90000000))}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@email.com`,
      address: '123 Main St, City',
      roomId: room.id,
      roomNumber: room.number,
      joinDate: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      idProof: 'Aadhaar Card',
      deposit: room.rent * 2,
      avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${fn}%20${ln}&backgroundColor=6366f1`,
      pendingDues: Math.random() > 0.6 ? Math.floor(Math.random() * 3) * room.rent : 0,
      notes: 'No specific notes.',
      status: 'active'
    });
  });
  return tenants;
};

const generatePayments = (tenants) => {
  const payments = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
  let id = 1;
  tenants.forEach(t => {
    months.forEach((m, mi) => {
      if (Math.random() > 0.15) {
        const amount = 3500 + Math.floor(Math.random() * 6500);
        payments.push({
          id: id++,
          tenantId: t.id,
          roomId: t.roomId,
          totalAmount: amount,
          paidAmount: amount,
          dueAmount: 0,
          date: new Date(2026, mi, Math.floor(Math.random() * 28) + 1).toISOString(),
          month: `${m} 2026`,
          method: ['Cash', 'UPI', 'Bank Transfer', 'Google Pay', 'PhonePe', 'Paytm'][Math.floor(Math.random() * 6)],
          status: 'completed',
          notes: 'Rent payment'
        });
      }
    });
  });
  return payments.sort((a, b) => new Date(b.date) - new Date(a.date));
};


const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [electricity, setElectricity] = useState([]);
  const [settings, setSettings] = useState(null);

  const [readNotifications, setReadNotifications] = useState(() => {
    const saved = localStorage.getItem('lodgex_read_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('lodgex_read_notifications', JSON.stringify(readNotifications));
  }, [readNotifications]);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('lodgex_token') !== null;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const user = localStorage.getItem('lodgex_user');
    return user ? JSON.parse(user) : null;
  });

  const [theme, setTheme] = useState(() => localStorage.getItem('lodgex_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lodgex_theme', theme);
  }, [theme]);

  const fetchRooms = useCallback(async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/rooms`);
      const data = await response.json();
      if (response.ok) {
        setRooms(data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  }, []);

  const fetchTenants = useCallback(async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/tenants`);
      const data = await response.json();
      if (response.ok) {
        setTenants(data);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  }, []);

  const fetchTenantById = useCallback(async (id) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/tenants/${id}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching single tenant:', error);
    }
    return null;
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/payments`);
      const data = await response.json();
      if (response.ok) {
        setPayments(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/expenses`);
      if (response.ok) {
        setExpenses(await response.json());
      }
    } catch (error) { console.error('Error fetching expenses:', error); }
  }, []);

  const fetchElectricity = useCallback(async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/electricity`);
      if (response.ok) {
        setElectricity(await response.json());
      }
    } catch (error) { console.error('Error fetching electricity:', error); }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/settings`);
      if (response.ok) {
        setSettings(await response.json());
      }
    } catch (error) { console.error('Error fetching settings:', error); }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRooms();
      fetchTenants();
      fetchPayments();
      fetchExpenses();
      fetchElectricity();
      fetchSettings();
    }
  }, [isAuthenticated, fetchRooms, fetchTenants, fetchPayments, fetchExpenses, fetchElectricity, fetchSettings]);

  const toggleTheme = useCallback(() => setTheme(prev => prev === 'dark' ? 'light' : 'dark'), []);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState(() => localStorage.getItem('lodgex_active_page') || 'dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageAction, setPageAction] = useState(null);

  useEffect(() => {
    localStorage.setItem('lodgex_active_page', activePage);
  }, [activePage]);

  const navigateWithAction = useCallback((page, action) => {
    setPageAction(action);
    setActivePage(page);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        localStorage.setItem('lodgex_token', data.token);
        localStorage.setItem('lodgex_user', JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const token = localStorage.getItem('lodgex_token');
      const response = await authFetch(`${API_BASE_URL}/auth/update-password`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword, email: currentUser?.email })
      });
      return response.ok;
    } catch (error) {
      console.error('Update password error:', error);
      return false;
    }
  };

  const signup = useCallback(async (name, email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      if (response.ok) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('lodgex_token');
    localStorage.removeItem('lodgex_user');
    setActivePage('dashboard');
  }, []);

  // File Upload
  const uploadFile = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await authFetch(`${API_BASE_URL}/files/upload`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        // Return absolute URL so frontend can load it from Render, not Vercel
        const baseUrl = API_BASE_URL.replace(/\/api$/, '');
        return `${baseUrl}${data.url}`;
      }
    } catch (error) {
      console.error('File upload error:', error);
    }
    return null;
  };

  // CRUD Actions

  const addPayment = async (paymentData) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      if (response.ok) {
        // Find all pending payments for this tenant and deduct the paidAmount
        const tenantId = paymentData.tenantId;
        const pendingPayments = payments
          .filter(p => (p.tenantId === tenantId || p._id === tenantId) && p.status === 'pending')
          .sort((a, b) => new Date(a.date) - new Date(b.date)); // oldest first

        let amountLeft = paymentData.paidAmount || 0;
        
        for (const p of pendingPayments) {
          if (amountLeft <= 0) break;
          // Use dueAmount if defined, otherwise totalAmount
          const currentDue = p.dueAmount !== undefined ? p.dueAmount : p.totalAmount;
          if (currentDue <= amountLeft) {
            // This pending payment is fully cleared!
            amountLeft -= currentDue;
            await authFetch(`${API_BASE_URL}/payments/${p._id || p.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dueAmount: 0, status: 'completed' })
            });
          } else {
            // Partially clear this pending payment
            const remainingDue = currentDue - amountLeft;
            amountLeft = 0;
            await authFetch(`${API_BASE_URL}/payments/${p._id || p.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dueAmount: remainingDue })
            });
          }
        }

        // 1. Optimistic update — show correct amount instantly in UI
        setTenants(prev => prev.map(t =>
          (t._id || t.id).toString() === paymentData.tenantId?.toString()
            ? { ...t, pendingDues: paymentData.dueAmount }
            : t
        ));
        // 2. Persist to DB
        await authFetch(`${API_BASE_URL}/tenants/${paymentData.tenantId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pendingDues: paymentData.dueAmount })
        });
        // 3. Refresh data from DB to confirm
        await fetchPayments();
        await fetchTenants();
      }
    } catch (error) {
      console.error('Error adding payment:', error);
    }
  };

  const addTenant = async (tenantData) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tenantData,
          joinDate: tenantData.joinDate || new Date().toISOString(),
          status: 'active'
        })
      });
      const newTenant = await response.json();
      if (response.ok) {
        // Update room status
        await authFetch(`${API_BASE_URL}/rooms/${tenantData.roomId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'occupied', tenantId: newTenant._id || newTenant.id })
        });
        await fetchTenants();
        await fetchRooms();
        return newTenant;
      } else {
        alert(`Failed to add tenant: ${newTenant.message || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      console.error('Error adding tenant:', error);
    }
  };

  const updatePayment = async (id, paymentData) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      if (response.ok) {
        // Update tenant dues
        await authFetch(`${API_BASE_URL}/tenants/${paymentData.tenantId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pendingDues: paymentData.dueAmount })
        });
        fetchPayments();
        fetchTenants();
      }
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const deletePayment = async (id) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/payments/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchPayments();
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const updateTenant = async (id, data) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        // Handle room reassignment if roomId changed
        const oldTenant = tenants.find(t => (t._id || t.id)?.toString() === id?.toString());
        if (oldTenant && oldTenant.roomId?.toString() !== data.roomId?.toString()) {
          // Free old room
          if (oldTenant.roomId) {
            await authFetch(`${API_BASE_URL}/rooms/${oldTenant.roomId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'available', tenantId: null })
            });
          }
          // Occupy new room
          if (data.roomId) {
            await authFetch(`${API_BASE_URL}/rooms/${data.roomId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'occupied', tenantId: id })
            });
          }
          await fetchRooms();
        }
        await fetchTenants();
      } else {
        const err = await response.json();
        alert(`Failed to update tenant: ${err.message}`);
      }
    } catch (error) {
      console.error('Error updating tenant:', error);
    }
  };

  const deleteTenant = async (id) => {
    const tenant = tenants.find(t => (t._id || t.id)?.toString() === id?.toString());
    if (!tenant) return;

    try {
      const response = await authFetch(`${API_BASE_URL}/tenants/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        // Free the room
        if (tenant.roomId) {
          await authFetch(`${API_BASE_URL}/rooms/${tenant.roomId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'available', tenantId: null })
          });
        }
        await fetchTenants();
        await fetchRooms();
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
    }
  };

  const vacateRoom = async (roomId) => {
    const room = rooms.find(r => (r._id || r.id) === roomId);
    if (!room || !room.tenantId) return;

    try {
      // Mark tenant as archived
      await authFetch(`${API_BASE_URL}/tenants/${room.tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'archived',
          roomId: null,
          vacateDate: new Date().toISOString()
        })
      });
      // Free room
      await authFetch(`${API_BASE_URL}/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'available', tenantId: null })
      });
      await fetchTenants();
      await fetchRooms();
    } catch (error) {
      console.error('Error vacating room:', error);
    }
  };

  const checkMonthlyBills = useCallback(async () => {
    if (tenants.length === 0) return;

    const now = new Date();
    const currentMonthLabel = now.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

    let billedCount = 0;
    for (const t of tenants.filter(t => t.status === 'active')) {
      // Check if already billed for this specific month (Monthly Rent)
      const alreadyBilled = payments.some(p =>
        (p.tenantId === t._id || p.tenantId === t.id) &&
        p.month === currentMonthLabel &&
        (p.notes?.includes('Monthly Rent') || p.notes === 'Rent payment')
      );

      if (!alreadyBilled) {
        // Find if they joined before or during this month
        const joinDate = new Date(t.joinDate);
        if (joinDate > now) continue; // Future joiner

        // Skip auto-billing if this is the month they joined (initial dues are handled manually)
        const joinMonthLabel = joinDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        if (joinMonthLabel === currentMonthLabel) continue;

        await addPayment({
          tenantId: t._id || t.id,
          tenantName: t.name,
          roomId: t.roomId,
          roomNumber: t.roomNumber,
          totalAmount: t.rent,
          paidAmount: 0,
          dueAmount: t.rent,
          method: 'Cash',
          status: 'pending',
          month: currentMonthLabel,
          notes: `Monthly Rent - ${currentMonthLabel} (Auto)`
        });

        // Update tenant total dues
        await updateTenant(t._id || t.id, {
          pendingDues: (t.pendingDues || 0) + t.rent
        });
        billedCount++;
      }
    }
    if (billedCount > 0) {
      await fetchTenants();
      await fetchPayments();
    }
    return billedCount;
  }, [tenants, payments, addPayment, updateTenant, fetchTenants, fetchPayments]);

  const addRoom = async (roomData) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData)
      });
      if (response.ok) {
        fetchRooms();
      }
    } catch (error) {
      console.error('Error adding room:', error);
    }
  };

  const updateRoom = async (id, roomData) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/rooms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData)
      });
      if (response.ok) {
        fetchRooms();
      }
    } catch (error) {
      console.error('Error updating room:', error);
    }
  };

  const deleteRoom = async (id) => {
    try {
      const room = rooms.find(r => (r._id || r.id) === id);
      const response = await authFetch(`${API_BASE_URL}/rooms/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        // If room had a tenant, they are now unassigned
        if (room && room.tenantId) {
          await updateTenant(room.tenantId, { roomId: null, roomNumber: 'Unassigned' });
        }
        fetchRooms();
      }
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const toggleRoomMaintenance = async (roomId) => {
    const room = rooms.find(r => r._id === roomId || r.id === roomId);
    if (!room) return;

    const newStatus = room.status === 'maintenance'
      ? (room.tenantId ? 'occupied' : 'available')
      : 'maintenance';

    try {
      const response = await authFetch(`${API_BASE_URL}/rooms/${room._id || room.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchRooms();
      }
    } catch (error) {
      console.error('Error toggling maintenance:', error);
    }
  };

  const addExpense = async (expense) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      });
      if (response.ok) fetchExpenses();
    } catch (error) { console.error('Error adding expense:', error); }
  };

  const deleteExpense = async (id) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/expenses/${id}`, { method: 'DELETE' });
      if (response.ok) fetchExpenses();
    } catch (error) { console.error('Error deleting expense:', error); }
  };

  const addElectricity = async (record) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/electricity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      if (response.ok) fetchElectricity();
    } catch (error) { console.error('Error adding electricity:', error); }
  };

  const updateElectricity = async (id, data) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/electricity/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) fetchElectricity();
    } catch (error) { console.error('Error updating electricity:', error); }
  };

  const deleteElectricity = async (id) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/electricity/${id}`, { method: 'DELETE' });
      if (response.ok) fetchElectricity();
    } catch (error) { console.error('Error deleting electricity:', error); }
  };

  const updateSettings = async (newSettings) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (response.ok) fetchSettings();
    } catch (error) { console.error('Error updating settings:', error); }
  };

  // Computed values (memoized for performance)
  const occupiedRooms = useMemo(() => rooms.filter(r => r.status === 'occupied').length, [rooms]);
  const availableRooms = useMemo(() => rooms.filter(r => r.status === 'available').length, [rooms]);
  const reservedRooms = useMemo(() => rooms.filter(r => r.status === 'reserved').length, [rooms]);
  const maintenanceRooms = useMemo(() => rooms.filter(r => r.status === 'maintenance').length, [rooms]);
  const activeTenants = useMemo(() => tenants.filter(t => t.status === 'active'), [tenants]);
  const totalPendingDues = useMemo(() => activeTenants.reduce((sum, t) => sum + (t.pendingDues || 0), 0), [activeTenants]);

  const notifications = useMemo(() => activeTenants.filter(t => t.pendingDues > 0).map((t) => {
    const notifId = `due-${t._id || t.id}`;
    // Find the latest pending payment to get the month
    const pendingPayment = payments.find(p => (p.tenantId === (t._id || t.id)) && p.status === 'pending');
    const dueMonth = pendingPayment ? pendingPayment.month : new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

    return {
      id: notifId,
      type: 'alert',
      title: 'Due Alert',
      message: `${t.name} (Room ${t.roomNumber}) has pending dues of ₹${t.pendingDues.toLocaleString('en-IN')} for ${dueMonth}`,
      time: 'Action Required',
      read: readNotifications.includes(notifId),
      phone: t.phone,
      amount: t.pendingDues,
      tenantName: t.name,
      roomNumber: t.roomNumber,
      month: dueMonth
    };
  }), [activeTenants, readNotifications, payments]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyRevenueTotal = useMemo(() => payments.filter(p => {
    const d = new Date(p.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((sum, p) => sum + p.paidAmount, 0), [payments, currentMonth, currentYear]);

  const monthlyExpenseTotal = useMemo(() => expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((sum, e) => sum + e.amount, 0), [expenses, currentMonth, currentYear]);

  const monthlyProfit = useMemo(() => monthlyRevenueTotal - monthlyExpenseTotal, [monthlyRevenueTotal, monthlyExpenseTotal]);

  const totalDepositsCollected = useMemo(() => payments.filter(p => {
    const d = new Date(p.date);
    const isCurrentMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    const isDeposit = (p.notes || '').toLowerCase().includes('deposit') || (p.notes || '').toLowerCase().includes('advance');
    return isCurrentMonth && isDeposit;
  }).reduce((sum, p) => sum + p.paidAmount, 0), [payments, currentMonth, currentYear]);

  const totalMonthlyIncome = useMemo(() => monthlyRevenueTotal + totalDepositsCollected, [monthlyRevenueTotal, totalDepositsCollected]);

  const pendingElectricity = useMemo(() => electricity.filter(e => e.status === 'pending').reduce((sum, e) => sum + (e.totalAmount || 0), 0), [electricity]);

  const expenseBreakdown = useMemo(() => expenses.reduce((acc, exp) => {
    const existing = acc.find(item => item.name === exp.category);
    if (existing) {
      existing.value += exp.amount;
    } else {
      const colors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c084fc', '#f472b6', '#34d399'];
      acc.push({ name: exp.category, value: exp.amount, color: colors[acc.length % colors.length] });
    }
    return acc;
  }, []), [expenses]);

  const monthlyRevenue = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleString('en-IN', { month: 'short' });
      const targetMonth = d.getMonth();
      const targetYear = d.getFullYear();

      const rev = payments.filter(p => {
        const pd = new Date(p.date);
        return pd.getMonth() === targetMonth && pd.getFullYear() === targetYear;
      }).reduce((sum, p) => sum + p.paidAmount, 0);

      const exp = expenses.filter(e => {
        const ed = new Date(e.date);
        return ed.getMonth() === targetMonth && ed.getFullYear() === targetYear;
      }).reduce((sum, e) => sum + e.amount, 0);

      data.push({
        month: monthStr,
        revenue: rev,
        expenses: exp,
        profit: rev - exp
      });
    }
    return data;
  }, [payments, expenses]);

  const yearlyProfit = useMemo(() => monthlyRevenue.reduce((sum, m) => sum + m.profit, 0), [monthlyRevenue]);

  const occupancyData = useMemo(() => {
    const data = [];
    // Calculate history for the last 5 months
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const targetMonth = d.getMonth();
      const targetYear = d.getFullYear();

      const count = tenants.filter(t => {
        const jd = new Date(t.joinDate);
        // Was the tenant present in this month?
        const hasJoined = jd.getFullYear() < targetYear || (jd.getFullYear() === targetYear && jd.getMonth() <= targetMonth);

        let stillActive = true;
        if (t.status === 'archived' && t.vacateDate) {
          const vd = new Date(t.vacateDate);
          stillActive = vd.getFullYear() > targetYear || (vd.getFullYear() === targetYear && vd.getMonth() >= targetMonth);
        }

        return hasJoined && stillActive;
      }).length;

      data.push({
        month: d.toLocaleString('en-IN', { month: 'short' }),
        rate: rooms.length ? Math.min(100, Math.round((count / rooms.length) * 100)) : 0
      });
    }
    return data;
  }, [tenants, rooms]);
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const searchResults = useMemo(() => searchQuery.length >= 1 ? [
    ...activeTenants.map(t => {
      const actualRoom = rooms.find(r => (r._id || r.id)?.toString() === t.roomId?.toString());
      return { ...t, type: 'tenant', computedRoomNumber: actualRoom ? actualRoom.number : 'Unassigned' };
    }).filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.includes(searchQuery) ||
      t.computedRoomNumber.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    ...rooms.filter(r =>
      r.status !== 'occupied' &&
      (r.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
       r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
       r.status.toLowerCase().includes(searchQuery.toLowerCase()))
    ).map(r => ({ ...r, resultType: 'room', type: 'room' })),
  ] : [], [searchQuery, activeTenants, rooms]);

  const markNotificationRead = useCallback((id) => {
    setReadNotifications(prev => [...new Set([...prev, id])]);
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setReadNotifications(prev => [...new Set([...prev, ...notifications.map(n => n.id)])]);
  }, [notifications]);

  const restoreStore = useCallback((data) => {
    if (!data) return;
    if (data.rooms) setRooms(data.rooms);
    if (data.tenants) setTenants(data.tenants);
    if (data.payments) setPayments(data.payments);
    if (data.expenses) setExpenses(data.expenses);
    if (data.electricity) setElectricity(data.electricity);
    if (data.settings) setSettings(data.settings);
  }, []);

  const value = {
    rooms, setRooms, fetchRooms,
    tenants, activeTenants, setTenants, fetchTenants, fetchTenantById,
    payments, setPayments, fetchPayments,
    expenses, setExpenses, fetchExpenses,
    electricity, setElectricity, fetchElectricity,
    notifications,
    settings, fetchSettings, updateSettings,

    addPayment, updatePayment, deletePayment,
    addTenant,
    updateTenant,
    deleteTenant,
    vacateRoom,
    checkMonthlyBills,
    addRoom,
    updateRoom,
    deleteRoom,
    toggleRoomMaintenance,
    addExpense, deleteExpense,
    addElectricity, updateElectricity, deleteElectricity,
    uploadFile,

    isAuthenticated, currentUser, login, signup, logout, updatePassword,
    theme, toggleTheme,
    sidebarOpen, setSidebarOpen, activePage, setActivePage,
    searchQuery, setSearchQuery, searchResults,
    pageAction, setPageAction, navigateWithAction,

    occupiedRooms, availableRooms, reservedRooms, maintenanceRooms,
    totalPendingDues, monthlyRevenueTotal, monthlyExpenseTotal, monthlyProfit, yearlyProfit,
    totalDepositsCollected, totalMonthlyIncome, pendingElectricity,
    unreadNotifications, markNotificationRead, markAllNotificationsRead,

    monthlyRevenue, occupancyData, expenseBreakdown,
    restoreStore
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};
