import { useState, useEffect } from 'react';
import { Shield, Lock, Key, CheckCircle, Zap, Cloud, MessageSquare, Bell, LogOut, Eye, EyeOff } from 'lucide-react';
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
    if (e && e.preventDefault) e.preventDefault();
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
    <div className="page settings-page">
      <div className="page-header animate-in">
        <div className="settings-header-content">
          <div className="settings-title-group">
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Configure your account security and lodge preferences</p>
          </div>
        </div>
      </div>

      <div className="settings-content animate-in stagger-1">
        
        <div className="settings-section">
          <h2 className="settings-section-title">Security & Access</h2>
          <div className="settings-group">
            
            <div className="settings-row">
              <div className="settings-row-icon" style={{background: 'var(--accent-primary)'}}><Lock size={16}/></div>
              <div className="settings-row-content">
                <span className="settings-row-label">Current Password</span>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <input 
                    className="settings-row-input"
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
            </div>

            <div className="settings-row">
              <div className="settings-row-icon" style={{background: '#8b5cf6'}}><Key size={16}/></div>
              <div className="settings-row-content">
                <span className="settings-row-label">New Password</span>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <input 
                    className="settings-row-input"
                    type={showPass.new ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={passwords.new}
                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                  />
                  <button type="button" className="pass-toggle-btn" onClick={() => setShowPass({...showPass, new: !showPass.new})}>
                    {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row-icon" style={{background: '#10b981'}}><CheckCircle size={16}/></div>
              <div className="settings-row-content">
                <span className="settings-row-label">Confirm Password</span>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <input 
                    className="settings-row-input"
                    type={showPass.confirm ? "text" : "password"} 
                    placeholder="••••••••" 
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
          <button className="settings-premium-btn" onClick={handleUpdatePassword}>
            {passSaved ? <><CheckCircle size={18} /> Updated successfully</> : 'Update Password'}
          </button>
        </div>

        <div className="settings-section">
          <h2 className="settings-section-title">System Preferences</h2>
          <div className="settings-group">
            
            <div className="settings-row">
              <div className="settings-row-icon" style={{background: '#f59e0b'}}><Zap size={16}/></div>
              <div className="settings-row-content">
                <span className="settings-row-label">Electricity Rate</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{color: 'var(--text-tertiary)', marginRight: '4px'}}>₹</span>
                  <input 
                    className="settings-row-input"
                    type="number" 
                    value={electricRate}
                    onChange={(e) => setElectricRate(e.target.value)}
                    style={{ width: '60px', paddingLeft: '0' }}
                  />
                  <span style={{color: 'var(--text-tertiary)', marginLeft: '4px'}}>/ unit</span>
                </div>
              </div>
            </div>

            <div className="settings-row" onClick={() => setAutoBackup(!autoBackup)}>
              <div className="settings-row-icon" style={{background: '#3b82f6'}}><Cloud size={16}/></div>
              <div className="settings-row-content">
                <span className="settings-row-label">Weekly Cloud Backup</span>
                <div className={`ios-switch ${autoBackup ? 'active' : ''}`}>
                  <div className="ios-switch-knob" />
                </div>
              </div>
            </div>

            <div className="settings-row" onClick={() => setEmailNotifs(!emailNotifs)}>
              <div className="settings-row-icon" style={{background: '#22c55e'}}><MessageSquare size={16}/></div>
              <div className="settings-row-content">
                <span className="settings-row-label">WhatsApp Alerts</span>
                <div className={`ios-switch ${emailNotifs ? 'active' : ''}`}>
                  <div className="ios-switch-knob" />
                </div>
              </div>
            </div>

            <div className="settings-row" onClick={() => setDueReminders(!dueReminders)}>
              <div className="settings-row-icon" style={{background: '#ef4444'}}><Bell size={16}/></div>
              <div className="settings-row-content">
                <span className="settings-row-label">Smart Due Reminders</span>
                <div className={`ios-switch ${dueReminders ? 'active' : ''}`}>
                  <div className="ios-switch-knob" />
                </div>
              </div>
            </div>

          </div>
          <button className="settings-premium-btn" onClick={handleSavePreferences}>
            {saved ? <><CheckCircle size={18} /> Preferences Saved</> : 'Save Preferences'}
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-group">
            <div className="settings-row danger" onClick={logout}>
              <div className="settings-row-content center">
                <span className="settings-row-label">Logout from LodgeX</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
