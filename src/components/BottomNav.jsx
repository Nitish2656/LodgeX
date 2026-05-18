import { useStore } from '../data/store';
import { Home, BedDouble, User, CreditCard, Menu } from 'lucide-react';
import './BottomNav.css';

export default function BottomNav() {
  const { activePage, setActivePage, setSidebarOpen } = useStore();

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'rooms', icon: BedDouble, label: 'Rooms' },
    { id: 'payments', icon: CreditCard, label: 'Payments' },
    { id: 'settings', icon: User, label: 'Profile' }
  ];

  const handleMenuClick = () => {
    // Open the sidebar in mobile view
    setSidebarOpen(true);
    // Alternatively, we could trigger the mobile menu overlay here
    document.querySelector('.sidebar-mobile-toggle')?.click();
  };

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activePage === item.id;
        
        return (
          <button 
            key={item.id} 
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <div className="bottom-nav-icon">
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
