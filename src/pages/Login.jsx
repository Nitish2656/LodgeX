import { useState } from 'react';
import { Lock, User, Mail, Eye, EyeOff, ArrowRight, UserPlus } from 'lucide-react';
import { useStore } from '../data/store';
import './Login.css';

export default function Login() {
  const { login, signup } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Ambient background */}
      <div className="login-ambient">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      <div className="login-container">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <span>L</span>
            <div className="login-logo-glow" />
          </div>
          <h1>LodgeX</h1>
          <p>Owner Management Dashboard</p>
        </div>

        {/* Form Card */}
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card-header">
            <h2>Admin Login</h2>
            <p>Sign in to your management dashboard</p>
          </div>

          <div className="login-fields">
            <div className={`login-field ${email ? 'has-value' : ''}`}>
              <Mail size={18} className="login-field-icon" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Admin Email"
                autoComplete="email"
                required
              />
            </div>

            <div className={`login-field ${password ? 'has-value' : ''}`}>
              <Lock size={18} className="login-field-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-field-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`login-submit ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <div className="login-spinner" />
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
        <div className="login-footer">
          <p>© 2026 LodgeX — Lodge Management System</p>
        </div>
      </div>
    </div>
  );
}
