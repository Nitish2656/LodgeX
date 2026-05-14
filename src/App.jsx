import { useStore, StoreProvider } from './data/store';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Tenants from './pages/Tenants';
import Payments from './pages/Payments';
import Electricity from './pages/Electricity';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Backup from './pages/Backup';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import './App.css';

const pages = {
  dashboard: Dashboard,
  rooms: Rooms,
  tenants: Tenants,
  payments: Payments,
  electricity: Electricity,
  expenses: Expenses,
  reports: Reports,
  backup: Backup,
  notifications: Notifications,
  settings: Settings,
};

function AppContent() {
  const { isAuthenticated, activePage, sidebarOpen } = useStore();

  if (!isAuthenticated) return <Login />;

  const ActivePage = pages[activePage] || Dashboard;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className={`main-content ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        <Navbar />
        <div className="main-body">
          {/* Ambient glow */}
          <div className="main-ambient">
            <div className="main-ambient-orb orb-1" />
            <div className="main-ambient-orb orb-2" />
          </div>
          <ActivePage />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
