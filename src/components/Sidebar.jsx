import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, BedDouble, Users, CalendarCheck, CreditCard,
  Zap, Receipt, TrendingUp, FileText, Database, Bell, Settings,
  LogOut, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { useStore } from '../data/store';
import './Sidebar.css';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'rooms', label: 'Rooms', icon: BedDouble },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'electricity', label: 'Electricity', icon: Zap },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'backup', label: 'Backup & Restore', icon: Database },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, activePage, setActivePage, logout, unreadNotifications } = useStore();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarRef = useRef(null);

  // Close mobile sidebar on page change
  useEffect(() => { setMobileOpen(false); }, [activePage]);

  // Close mobile sidebar on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (mobileOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileOpen]);

  const handleNavigate = (id) => {
    setActivePage(id);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Hidden trigger for Navbar */}
      <button className="sidebar-mobile-toggle" style={{ display: 'none' }} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
        <span />
      </button>

      <aside
        ref={sidebarRef}
        className={`sidebar ${sidebarOpen ? 'expanded' : 'collapsed'} ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <span className="logo-letter">L</span>
            <div className="logo-glow" />
          </div>
          <div className="sidebar-logo-text">
            <h1>LodgeX</h1>
            <span>Owner Panel</span>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <ChevronLeft size={16} className={`toggle-icon ${sidebarOpen ? '' : 'rotated'}`} />
        </button>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-section">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavigate(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  {isActive && <div className="sidebar-item-indicator" />}
                  <div className="sidebar-item-icon">
                    <Icon size={20} />
                    {item.id === 'notifications' && unreadNotifications > 0 && (
                      <span className="sidebar-badge">{unreadNotifications}</span>
                    )}
                  </div>
                  <span className="sidebar-item-label">{item.label}</span>
                  {!sidebarOpen && hoveredItem === item.id && (
                    <div className="sidebar-tooltip">{item.label}</div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="sidebar-item logout-item" onClick={logout}>
            <div className="sidebar-item-icon">
              <LogOut size={20} />
            </div>
            <span className="sidebar-item-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
