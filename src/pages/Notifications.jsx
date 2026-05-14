import { Bell, CheckCircle, AlertTriangle, Calendar, Wrench, RefreshCw, Check, MessageCircle } from 'lucide-react';
import { useStore } from '../data/store';
import './Pages.css';

const typeConfig = {
  payment: { icon: '💰', color: '#34d399', label: 'Payment' },
  alert: { icon: '⚠️', color: '#f87171', label: 'Alert' },
  booking: { icon: '📅', color: '#60a5fa', label: 'Booking' },
  maintenance: { icon: '🔧', color: '#fbbf24', label: 'Maintenance' },
  system: { icon: '🔄', color: '#8b5cf6', label: 'System' },
};

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadNotifications } = useStore();
  
  const sendWhatsApp = (e, n) => {
    e.stopPropagation(); // Don't trigger "mark read" when clicking WhatsApp
    const text = `Hello ${n.tenantName},\n\nThis is a reminder from Lodge Management regarding your pending dues for Room ${n.roomNumber}.\n\n*Month: ${n.month}*\n*Pending Amount: ₹${n.amount.toLocaleString('en-IN')}*\n\nPlease clear the dues at your earliest convenience.\n\nThank you!`;
    const url = `https://wa.me/91${n.phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="page">
      <div className="page-header animate-in">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unreadNotifications} unread notification{unreadNotifications !== 1 ? 's' : ''}</p>
        </div>
        {unreadNotifications > 0 && (
          <button className="page-header-btn" onClick={markAllNotificationsRead}>
            <Check size={16} /> Mark All Read
          </button>
        )}
      </div>

      <div className="notifications-list animate-in">
        {notifications.map((n, idx) => {
          const config = typeConfig[n.type] || typeConfig.system;
          return (
            <div
              key={n.id}
              className={`notification-card ${!n.read ? 'unread' : ''} animate-in stagger-${(idx % 8) + 1}`}
              onClick={() => markNotificationRead(n.id)}
            >
              <div className="notification-icon-wrap">
                <span className="notification-emoji">{config.icon}</span>
              </div>
              <div className="notification-content">
                <div className="notification-top">
                  <h4 className="notification-title">{n.title}</h4>
                  <span className="notification-type-badge" style={{ background: `${config.color}15`, color: config.color }}>
                    {config.label}
                  </span>
                </div>
                <p className="notification-message">{n.message}</p>
                <div className="notification-footer">
                  <span className="notification-time">{n.time}</span>
                  {n.type === 'alert' && n.phone && (
                    <button 
                      className="notification-action-btn wa-btn"
                      onClick={(e) => sendWhatsApp(e, n)}
                    >
                      <MessageCircle size={14} /> Send WhatsApp
                    </button>
                  )}
                </div>
              </div>
              {!n.read && <div className="notification-unread-indicator" />}
            </div>
          );
        })}
        {notifications.length === 0 && (
          <div className="page-empty">No notifications yet</div>
        )}
      </div>
    </div>
  );
}
