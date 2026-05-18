import { useState, useEffect } from 'react';
import { User, Building, Shield, Palette, Save, Lock, Key, CheckCircle, Eye, EyeOff, LogOut } from 'lucide-react';
import { useStore } from '../data/store';
import './Pages.css';

export default function SettingsPage() {
  const { settings, updateSettings, updatePassword, logout } = useStore();
  
  const [electricRate, setElectricRate] = useState('8');
  const [autoBackup, setAutoBackup] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [dueReminders, setDueReminders] = useState(true);
  const [saved, setSaved] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [passSaved, setPassSaved] = useState(false);
  const [activePanel, setActivePanel] = useState('security');

  useEffect(() => {
    if (settings) {
      setElectricRate(settings.electricRate || '8');
      setAutoBackup(settings.autoBackup ?? true);
      setEmailNotifs(settings.emailNotifs ?? true);
      setDueReminders(settings.dueReminders ?? true);
    }
  }, [settings]);

  const handleSavePreferences = () => {
    updateSettings({
      electricRate: Number(electricRate),
      autoBackup,
      emailNotifs,
      dueReminders
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwords.current || !passwords.new) return alert('Please fill all fields');
    if (passwords.new !== passwords.confirm) return alert('Passwords do not match');
    
    const success = await updatePassword(passwords.current, passwords.new);
    if (success) {
        setPassSaved(true);
        setTimeout(() => {
          setPassSaved(false);
          setPasswords({ current: '', new: '', confirm: '' });
        }, 2000);
    } else {
        alert('Failed to update password. Please check your current password.');
    }
  };

  return (
    <div className="page">
      <div className="page-header animate-in">
        <div className="settings-header-content">
          <div className="settings-title-group">
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Configure your account security and lodge preferences</p>
          </div>
          <div className="settings-header-badges">
            <div className="status-badge-modern">
              <Shield size={14} /> <span>Encrypted</span>
            </div>
            <div className="status-badge-modern success">
              <CheckCircle size={14} /> <span>System Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-bento-grid">
        {/* Security Bento */}
        <div className="bento-item security-bento animate-in" style={{ '--card-accent': 'var(--accent-primary)' }}>
          <div className="stat-card-glow" />
          <div className="bento-header">
            <div className="bento-icon-box shield"><Shield size={20} /></div>
            <div className="bento-title">
              <h3>Security & Access</h3>
              <p>Update your login credentials</p>
            </div>
          </div>
          
          <form className="bento-content" onSubmit={handleUpdatePassword}>
            <div className="modern-input-group">
              <div className="input-field-premium">
                <label>Current Password</label>
                <div className="input-box">
                  <Lock size={16} />
                  <input 
                    type={showPass.current ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={passwords.current}
                    onChange={e => setPasswords({...passwords, current: e.target.value})}
                  />
                  <button type="button" className="pass-toggle-btn" onClick={() => setShowPass({...showPass, current: !showPass.current})}>
                    {showPass.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="input-row">
                <div className="input-field-premium">
                  <label>New Password</label>
                  <div className="input-box">
                    <Key size={16} />
                    <input 
                      type={showPass.new ? "text" : "password"} 
                      placeholder="New password" 
                      value={passwords.new}
                      onChange={e => setPasswords({...passwords, new: e.target.value})}
                    />
                    <button type="button" className="pass-toggle-btn" onClick={() => setShowPass({...showPass, new: !showPass.new})}>
                      {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="input-field-premium">
                  <label>Confirm</label>
                  <div className="input-box">
                    <CheckCircle size={16} />
                    <input 
                      type={showPass.confirm ? "text" : "password"} 
                      placeholder="Confirm" 
                      value={passwords.confirm}
                      onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                    />
                    <button type="button" className="pass-toggle-btn" onClick={() => setShowPass({...showPass, confirm: !showPass.confirm})}>
                      {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className={`btn-premium-action ${passSaved ? 'success' : ''}`}>
              {passSaved ? <><CheckCircle size={18} /> Updated</> : 'Update Password'}
            </button>
          </form>
        </div>

        {/* System Settings Bento */}
        <div className="bento-column animate-in stagger-2">
          <div className="bento-item preferences-bento" style={{ '--card-accent': '#ec4899' }}>
            <div className="stat-card-glow" />
            <div className="bento-header">
              <div className="bento-icon-box palette"><Palette size={20} /></div>
              <div className="bento-title">
                <h3>System Preferences</h3>
                <p>Manage application behavior</p>
              </div>
            </div>

            <div className="bento-content">
              <div className="input-field-premium">
                <label>Electricity Rate</label>
                <div className="input-box">
                  <span className="currency-symbol">₹</span>
                  <input type="number" value={electricRate} onChange={(e) => setElectricRate(e.target.value)} />
                  <span className="unit-label">/ unit</span>
                </div>
              </div>

              <div className="settings-toggles-bento">
                <div className="modern-toggle-tile" onClick={() => setAutoBackup(!autoBackup)}>
                  <div className="toggle-tile-info">
                    <h4>Weekly Cloud Backup</h4>
                    <p>Automatic weekly synchronization</p>
                  </div>
                  <div className={`tile-switch ${autoBackup ? 'active' : ''}`}>
                    <div className="tile-knob" />
                  </div>
                </div>

                <div className="modern-toggle-tile" onClick={() => setEmailNotifs(!emailNotifs)}>
                  <div className="toggle-tile-info">
                    <h4>WhatsApp Alerts</h4>
                    <p>Send instant payment receipts</p>
                  </div>
                  <div className={`tile-switch ${emailNotifs ? 'active' : ''}`}>
                    <div className="tile-knob" />
                  </div>
                </div>

                <div className="modern-toggle-tile" onClick={() => setDueReminders(!dueReminders)}>
                  <div className="toggle-tile-info">
                    <h4>Smart Due Reminders</h4>
                    <p>Highlight overdue payments</p>
                  </div>
                  <div className={`tile-switch ${dueReminders ? 'active' : ''}`}>
                    <div className="tile-knob" />
                  </div>
                </div>
              </div>

              <button onClick={handleSavePreferences} className={`btn-premium-action ${saved ? 'success' : ''}`} style={{ marginTop: '20px' }}>
                {saved ? <><CheckCircle size={18} /> Preferences Saved</> : 'Save Preferences'}
              </button>

              <button onClick={logout} className="btn-premium-action" style={{ marginTop: '16px', background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <LogOut size={18} /> Logout from LodgeX
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
