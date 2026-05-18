import { useState, useEffect, useRef } from 'react';
import { Database, Download, Upload, CheckCircle, Clock, HardDrive, Shield } from 'lucide-react';
import { useStore } from '../data/store';
import './Pages.css';

// Simulated history, but we'll make it persistent for this session
const INITIAL_HISTORY = [
  { id: 1, date: '2026-05-09 14:30', size: '12.4 MB', type: 'Automatic', status: 'completed' },
  { id: 2, date: '2026-05-08 14:30', size: '12.2 MB', type: 'Automatic', status: 'completed' },
  { id: 3, date: '2026-05-07 14:30', size: '12.1 MB', type: 'Automatic', status: 'completed' },
];

export default function BackupPage() {
  const { 
    rooms, tenants, payments, expenses, electricity, settings, 
    restoreStore, pageAction, setPageAction 
  } = useStore();
  const fileInputRef = useRef(null);
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('lodgex_backup_history');
    return saved ? JSON.parse(saved) : INITIAL_HISTORY;
  });

  useEffect(() => {
    localStorage.setItem('lodgex_backup_history', JSON.stringify(history));
  }, [history]);

  const handleBackup = async () => {
    setBacking(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${baseUrl}/backup/export`);
      if (!response.ok) throw new Error('Backup failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lodge_db_backup_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      const newEntry = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        size: (blob.size / 1024).toFixed(1) + ' KB',
        type: 'Manual',
        status: 'completed'
      };
      setHistory(prev => [newEntry, ...prev]);
      alert('Database backup created successfully!');
    } catch (err) {
      alert('Error creating backup: ' + err.message);
    } finally {
      setBacking(false);
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileContent = JSON.parse(event.target.result);
        const actualData = fileContent.data || fileContent; // Support both flat and nested export format
        if (!actualData.rooms || !actualData.tenants) {
          throw new Error('Invalid backup file format');
        }

        if (window.confirm('Restoring will overwrite current data. Are you sure?')) {
          setRestoring(true);
          try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
            const response = await fetch(`${baseUrl}/backup/import`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(actualData)
            });

            if (!response.ok) throw new Error('Backend restoration failed');

            restoreStore(actualData);
            alert('Data restored successfully!');
          } catch (err) {
            alert('Restore failed: ' + err.message);
          } finally {
            setRestoring(false);
          }
        }
      } catch (err) {
        alert('Failed to restore: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="page">
      <div className="page-header animate-in">
        <div>
          <h1 className="page-title">Backup & Restore</h1>
          <p className="page-subtitle">Protect your data with regular backups</p>
        </div>
      </div>

      <div className="backup-actions animate-in">
        <div className="backup-action-card">
          <div className="backup-action-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
            <Download size={28} />
          </div>
          <h3>Create Backup</h3>
          <p>Export a complete backup of all lodge data including tenants, payments, and settings.</p>
          <button className={`backup-btn primary ${backing ? 'loading' : ''}`} onClick={handleBackup} disabled={backing}>
            {backing ? (
              <><div className="btn-spinner" /> Creating Backup...</>
            ) : (
              <><Database size={16} /> Backup Now</>
            )}
          </button>
        </div>

        <div className="backup-action-card">
          <div className="backup-action-icon" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
            <Upload size={28} />
          </div>
          <h3>Restore Data</h3>
          <p>Restore lodge data from a previously created backup file.</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept=".json"
          />
          <button 
            className={`backup-btn secondary ${restoring ? 'loading' : ''}`} 
            onClick={handleRestoreClick}
            disabled={restoring}
          >
            {restoring ? 'Restoring...' : <><Upload size={16} /> Select Backup File</>}
          </button>
        </div>

        <div className="backup-action-card">
          <div className="backup-action-icon" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
            <Shield size={28} />
          </div>
          <h3>Auto Backup</h3>
          <p>Automatic daily backups are enabled. Last backup was today at 14:30.</p>
          <div className="backup-status-indicator">
            <CheckCircle size={16} style={{ color: 'var(--success)' }} />
            <span>Active — Daily at 2:30 PM</span>
          </div>
        </div>
      </div>

      <div className="backup-history animate-in">
        <h3 className="section-title">Backup History</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Size</th>
                <th>Type</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map(b => (
                <tr key={b.id}>
                  <td className="text-bold">{b.date}</td>
                  <td>{b.size}</td>
                  <td><span className="category-badge">{b.type}</span></td>
                  <td>
                    <span className="status-pill completed">
                      <CheckCircle size={12} /> {b.status}
                    </span>
                  </td>
                  <td>
                    <button className="table-action-btn">
                      <Download size={14} /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
