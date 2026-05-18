import { useState, useEffect, useRef } from 'react';
import { Database, Download, Upload, CheckCircle, Clock, HardDrive, Shield, Trash2, RotateCcw } from 'lucide-react';
import { useStore } from '../data/store';
import './Pages.css';

export default function BackupPage() {
  const { restoreStore } = useStore();
  const fileInputRef = useRef(null);
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${baseUrl}/backup/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch backup history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleBackup = async () => {
    setBacking(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      
      // 1. Save backup to DB history
      await fetch(`${baseUrl}/backup/save-backup`, { method: 'POST' });
      
      // 2. Export/Download a local JSON copy for the user
      const response = await fetch(`${baseUrl}/backup/export`);
      if (!response.ok) throw new Error('Backup export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lodge_db_backup_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert('Database backup created successfully & saved to cloud history!');
      fetchHistory();
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
        const actualData = fileContent.data || fileContent; // Support both flat and nested formats
        if (!actualData.rooms || !actualData.tenants) {
          throw new Error('Invalid backup file format');
        }

        if (window.confirm('Restoring will overwrite current database. Are you sure?')) {
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
            window.location.reload();
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

  const handleDownloadBackup = async (id, type) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${baseUrl}/backup/download/${id}`);
      if (!response.ok) throw new Error('Failed to download backup');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lodge_backup_${type.toLowerCase()}_${id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading backup: ' + err.message);
    }
  };

  const handleRestoreFromHistory = async (id) => {
    if (window.confirm('Restoring will overwrite all current live data. Are you sure?')) {
      setRestoring(true);
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${baseUrl}/backup/restore/${id}`, {
          method: 'POST'
        });

        if (!response.ok) throw new Error('Restoration failed');

        alert('Data restored successfully!');
        window.location.reload(); // Reload to sync state cleanly
      } catch (err) {
        alert('Restore failed: ' + err.message);
      } finally {
        setRestoring(false);
      }
    }
  };

  const handleDeleteBackup = async (id) => {
    if (window.confirm('Are you sure you want to delete this backup from cloud history?')) {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${baseUrl}/backup/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchHistory();
        }
      } catch (error) {
        alert('Failed to delete backup: ' + error.message);
      }
    }
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
          <h3>Weekly Auto Backup</h3>
          <p>Automatic weekly cloud backups are enabled. Your data is backed up every Sunday at 12:00 AM.</p>
          <div className="backup-status-indicator">
            <CheckCircle size={16} style={{ color: 'var(--success)' }} />
            <span>Active — Sundays at 12:00 AM</span>
          </div>
        </div>
      </div>

      <div className="backup-history animate-in">
        <h3 className="section-title">Cloud Backup History</h3>
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
              {loadingHistory ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Loading backup history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No automated weekly backups taken yet.
                  </td>
                </tr>
              ) : (
                history.map(b => (
                  <tr key={b._id}>
                    <td className="text-bold">{new Date(b.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td>{b.size}</td>
                    <td>
                      <span className={`category-badge ${b.type.toLowerCase() === 'automatic' ? 'info' : 'warning'}`}>
                        {b.type}
                      </span>
                    </td>
                    <td>
                      <span className="status-pill completed">
                        <CheckCircle size={12} /> Completed
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="table-action-btn" onClick={() => handleDownloadBackup(b._id, b.type)} title="Download JSON file">
                          <Download size={14} /> Download
                        </button>
                        <button className="table-action-btn success" style={{ color: 'var(--success)' }} onClick={() => handleRestoreFromHistory(b._id)} title="Restore database to this point">
                          <RotateCcw size={14} /> Restore
                        </button>
                        <button className="table-action-btn danger" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteBackup(b._id)} title="Delete from cloud">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
