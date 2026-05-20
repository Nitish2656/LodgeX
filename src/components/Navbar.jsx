import { useState, useRef, useEffect } from 'react';
import { Search, Bell, X, User, ChevronDown, Moon, Sun, LogOut } from 'lucide-react';
import { useStore } from '../data/store';
import './Navbar.css';

export default function Navbar() {
  const {
    searchQuery, setSearchQuery, searchResults, setActivePage,
    notifications, unreadNotifications, markNotificationRead, markAllNotificationsRead,
    theme, toggleTheme, logout, navigateWithAction
  } = useStore();
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handle = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifPanel(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleResultClick = (result) => {
    if (result.type === 'tenant') {
      navigateWithAction('rooms', { type: 'OPEN_TENANT', id: result._id || result.id });
    } else if (result.type === 'room') {
      navigateWithAction('rooms', { type: 'OPEN_ROOM', id: result._id || result.id });
    }
    setSearchQuery('');
    setSearchFocused(false);
  };

  const notifIcon = (type) => {
    const map = { payment: '💰', alert: '⚠️', booking: '📅', maintenance: '🔧', system: '🔄' };
    return map[type] || '📌';
  };

  return (
    <header className="navbar">
      {/* Mobile Menu Toggle */}
      <button 
        className="navbar-mobile-toggle" 
        onClick={() => {
          // Find the hidden sidebar toggle and click it, or we could handle state here.
          // Since Sidebar.jsx handles its own mobile state, let's trigger it.
          document.querySelector('.sidebar-mobile-toggle')?.click();
        }}
        aria-label="Open Menu"
      >
        <span />
        <span />
        <span />
      </button>

      {/* Search */}
      <div className="navbar-search-wrapper" ref={searchRef}>
        <div className={`navbar-search ${searchFocused ? 'focused' : ''}`}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search rooms, tenants, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => { setSearchQuery(''); }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchFocused && searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.slice(0, 8).map((r, i) => (
              <button key={i} className="search-result-item" onClick={() => handleResultClick(r)}>
                {r.type === 'tenant' ? (
                  <>
                    <img src={r.avatar} alt="" className="search-result-avatar" />
                    <div className="search-result-info">
                      <span className="search-result-name">{r.name}</span>
                      <span className="search-result-meta">{r.computedRoomNumber === 'Unassigned' ? 'Unassigned Room' : `Room ${r.computedRoomNumber}`} &bull; {r.phone}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {r.pendingDues > 0 && (
                        <span className="search-result-badge danger" title="Pending Dues">₹{r.pendingDues.toLocaleString()}</span>
                      )}
                      {r.computedRoomNumber !== 'Unassigned' && (
                        <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '12px' }}>Occupied</span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`search-result-room-icon ${r.status}`}>
                      {r.number}
                    </div>
                    <div className="search-result-info">
                      <span className="search-result-name">Room {r.number}</span>
                      <span className="search-result-meta">{r.roomType || r.type}</span>
                    </div>
                    {r.status === 'occupied' || r.tenantId ? (
                      <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '12px' }}>Occupied</span>
                    ) : (
                      <span style={{ color: '#10b981', fontWeight: 700, fontSize: '12px' }}>Vacant</span>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        )}

        {searchFocused && searchQuery.length >= 1 && searchResults.length === 0 && (
          <div className="search-results">
            <div className="search-no-results">No results found</div>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="navbar-right">
        {/* Theme Toggle */}
        <button className="navbar-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <div className="navbar-notif-wrapper" ref={notifRef}>
          <button
            className={`navbar-icon-btn ${showNotifPanel ? 'active' : ''}`}
            onClick={() => { setShowNotifPanel(!showNotifPanel); setShowProfileMenu(false); }}
          >
            <Bell size={20} />
            {unreadNotifications > 0 && (
              <span className="navbar-notif-badge">{unreadNotifications}</span>
            )}
          </button>

          {showNotifPanel && (
            <div className="notif-panel">
              <div className="notif-panel-header">
                <h3>Notifications</h3>
                {unreadNotifications > 0 && (
                  <button className="notif-mark-all" onClick={markAllNotificationsRead}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className="notif-panel-list">
                {notifications.map(n => (
                  <button
                    key={n.id}
                    className={`notif-item ${!n.read ? 'unread' : ''}`}
                    onClick={() => markNotificationRead(n.id)}
                  >
                    <span className="notif-item-icon">{notifIcon(n.type)}</span>
                    <div className="notif-item-content">
                      <span className="notif-item-title">{n.title}</span>
                      <span className="notif-item-msg">{n.message}</span>
                      <span className="notif-item-time">{n.time}</span>
                    </div>
                    {!n.read && <div className="notif-unread-dot" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="navbar-profile-wrapper" ref={profileRef}>
          <button
            className="navbar-profile"
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifPanel(false); }}
          >
            <div className="navbar-profile-avatar">
              <User size={18} />
            </div>
            <div className="navbar-profile-info">
              <span className="navbar-profile-name">Admin</span>
              <span className="navbar-profile-role">Owner</span>
            </div>
            <ChevronDown size={14} className="navbar-profile-chevron" />
          </button>

          {showProfileMenu && (
            <div className="profile-menu">
              <button className="profile-menu-item" onClick={() => { setActivePage('settings'); setShowProfileMenu(false); }}>
                <User size={16} /> Profile Settings
              </button>
              <button className="profile-menu-item logout" onClick={() => logout()}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
