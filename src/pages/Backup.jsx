import { useState, useEffect, useRef } from 'react';
import { Database, Download, Upload, CheckCircle, Clock, HardDrive, Shield, Trash2, RotateCcw, X, Info } from 'lucide-react';
import { useStore } from '../data/store';
import Modal from '../components/Modal';
import './Pages.css';

export default function BackupPage() {
  const { restoreStore } = useStore();
  const fileInputRef = useRef(null);
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Selective Restore States
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState(null); // null if manual file restore
  const [manualBackupData, setManualBackupData] = useState(null); // parsed manual file data
  const [restoreOptions, setRestoreOptions] = useState({
    rooms: true,
    tenants: true,
    payments: true,
    expenses: true,
    electricity: true
  });

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

        // Save file data & trigger modal
        setManualBackupData(actualData);
        setSelectedBackupId(null);
        setRestoreOptions({
          rooms: true,
          tenants: true,
          payments: true,
          expenses: true,
          electricity: true
        });
        setShowRestoreModal(true);
      } catch (err) {
        alert('Failed to restore: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleOpenCloudRestore = (id) => {
    setSelectedBackupId(id);
    setManualBackupData(null);
    setRestoreOptions({
      rooms: true,
      tenants: true,
      payments: true,
      expenses: true,
      electricity: true
    });
    setShowRestoreModal(true);
  };

  const handleConfirmRestore = async () => {
    // Check if at least one checkbox is selected
    const hasSelection = Object.values(restoreOptions).some(val => val === true);
    if (!hasSelection) {
      alert('Please select at least one data type to restore!');
      return;
    }

    if (window.confirm('Restoring will overwrite current live database for selected options. Are you sure?')) {
      setRestoring(true);
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        
        if (selectedBackupId) {
          // Cloud history restore
          const response = await fetch(`${baseUrl}/backup/restore/${selectedBackupId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ restoreOptions })
          });
          if (!response.ok) throw new Error('Cloud restore failed');
        } else {
          // Manual upload restore
          const response = await fetch(`${baseUrl}/backup/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: manualBackupData,
              restoreOptions
            })
          });
          if (!response.ok) throw new Error('File restore failed');
        }

        alert('Selected database categories restored successfully!');
        window.location.reload(); // Full sync
      } catch (err) {
        alert('Restore failed: ' + err.message);
        setRestoring(false);
      }
    }
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
      {/* Dynamic CSS styles for complete Mobile Responsiveness & Button Spacing Protection */}
      <style>{`
        .table-actions-container {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: nowrap;
        }
        .table-action-btn.flex-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 0.85rem;
          border: 1px solid var(--border-color);
          background: var(--card-bg);
          color: var(--text-color);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .table-action-btn.flex-btn:hover {
          background: var(--hover-bg);
          transform: translateY(-1px);
        }
        .table-action-btn.flex-btn.success {
          border-color: rgba(16, 185, 129, 0.2);
          background: rgba(16, 185, 129, 0.05);
          color: #10b981;
        }
        .table-action-btn.flex-btn.success:hover {
          background: rgba(16, 185, 129, 0.12);
        }
        .table-action-btn.flex-btn.danger {
          border-color: rgba(239, 68, 68, 0.2);
          background: rgba(239, 68, 68, 0.05);
          color: #ef4444;
        }
        .table-action-btn.flex-btn.danger:hover {
          background: rgba(239, 68, 68, 0.12);
        }

        /* Checkbox option lists */
        .restore-options-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 16px 0;
        }
        .restore-option-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
          transition: background 0.2s;
        }
        .restore-option-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .restore-option-item input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: var(--primary-color);
          cursor: pointer;
        }
        .restore-option-label {
          font-weight: 500;
          font-size: 0.95rem;
          color: var(--text-color);
        }

        .alert-box {
          display: flex;
          gap: 10px;
          background: rgba(251, 191, 36, 0.08);
          border: 1px solid rgba(251, 191, 36, 0.2);
          border-radius: 8px;
          padding: 12px;
          color: #fbbf24;
          font-size: 0.85rem;
          margin-top: 16px;
          line-height: 1.4;
        }

        @media (max-width: 900px) {
          .table-actions-container {
            flex-wrap: wrap;
          }
        }

        @media (max-width: 768px) {
          .data-table, .data-table thead, .data-table tbody, .data-table th, .data-table td, .data-table tr {
            display: block !important;
          }
          .data-table thead {
            display: none !important;
          }
          .data-table tr {
            margin-bottom: 16px;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            background: var(--card-bg) !important;
            padding: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          }
          .data-table td {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            padding: 10px 0 !important;
            text-align: right !important;
            font-size: 0.9rem !important;
          }
          .data-table td:last-child {
            border-bottom: none !important;
            padding-top: 14px !important;
            justify-content: flex-start !important;
            width: 100% !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
          }
          .data-table td::before {
            content: attr(data-label);
            font-weight: 600 !important;
            color: var(--text-muted) !important;
            text-align: left !important;
          }
          .table-actions-container {
            flex-direction: row !important;
            width: 100% !important;
            gap: 6px !important;
          }
          .table-action-btn.flex-btn {
            flex: 1 !important;
            justify-content: center !important;
            padding: 8px !important;
            font-size: 0.8rem !important;
          }
          .backup-actions {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>

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
                    <td data-label="Date & Time" className="text-bold">{new Date(b.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td data-label="Size">{b.size}</td>
                    <td data-label="Type">
                      <span className={`category-badge ${b.type.toLowerCase() === 'automatic' ? 'info' : 'warning'}`}>
                        {b.type}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className="status-pill completed">
                        <CheckCircle size={12} /> Completed
                      </span>
                    </td>
                    <td data-label="Action">
                      <div className="table-actions-container">
                        <button className="table-action-btn flex-btn" onClick={() => handleDownloadBackup(b._id, b.type)} title="Download JSON file">
                          <Download size={14} /> Download
                        </button>
                        <button className="table-action-btn flex-btn success" onClick={() => handleOpenCloudRestore(b._id)} title="Restore database selectively">
                          <RotateCcw size={14} /> Restore
                        </button>
                        <button className="table-action-btn flex-btn danger" onClick={() => handleDeleteBackup(b._id)} title="Delete from cloud">
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

      {/* Selective Restore Modal */}
      <Modal isOpen={showRestoreModal} onClose={() => setShowRestoreModal(false)} title="Selective Data Recovery" maxWidth="500px">
        <div style={{ padding: '4px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.4' }}>
            Aap backup me se kaun sa data wapas recover karna chahte hain? Select kijiye:
          </p>

          <div className="restore-options-list">
            <label className="restore-option-item">
              <input type="checkbox" checked={restoreOptions.rooms} onChange={e => setRestoreOptions({...restoreOptions, rooms: e.target.checked})} />
              <span className="restore-option-label">Rooms (Room Details & Statuses)</span>
            </label>

            <label className="restore-option-item">
              <input type="checkbox" checked={restoreOptions.tenants} onChange={e => setRestoreOptions({...restoreOptions, tenants: e.target.checked})} />
              <span className="restore-option-label">Tenants (Profile & Allocation Records)</span>
            </label>

            <label className="restore-option-item">
              <input type="checkbox" checked={restoreOptions.payments} onChange={e => setRestoreOptions({...restoreOptions, payments: e.target.checked})} />
              <span className="restore-option-label">Payments (Rent Invoices & Dues)</span>
            </label>

            <label className="restore-option-item">
              <input type="checkbox" checked={restoreOptions.expenses} onChange={e => setRestoreOptions({...restoreOptions, expenses: e.target.checked})} />
              <span className="restore-option-label">Expenses (Lodge Admin Expenditures)</span>
            </label>

            <label className="restore-option-item">
              <input type="checkbox" checked={restoreOptions.electricity} onChange={e => setRestoreOptions({...restoreOptions, electricity: e.target.checked})} />
              <span className="restore-option-label">Electricity (Bills & Meter Readings)</span>
            </label>
          </div>

          <div className="alert-box">
            <Info size={18} style={{ flexShrink: 0 }} />
            <span>
              <strong>Warning:</strong> selected option ka current data completely overwrite ho jayega. Deselected option ka data intact (jaisa abhi hai waisa hi) rahega.
            </span>
          </div>

          <div className="form-actions" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn btn-ghost" onClick={() => setShowRestoreModal(false)} disabled={restoring}>Cancel</button>
            <button className="btn btn-primary" style={{ background: '#10b981', borderColor: '#10b981' }} onClick={handleConfirmRestore} disabled={restoring}>
              {restoring ? 'Recovering...' : 'Start Selective Recovery'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
