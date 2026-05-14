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
      if (isLogin) {
        const success = await login(email, password);
        if (!success) {
          setError('Invalid credentials. Please try again.');
        }
      } else {
        const success = await signup(name, email, password);
        if (success) {
          setIsLogin(true);
          setError('Signup successful! Please login.');
        } else {
          setError('Signup failed. Email might already be in use.');
        }
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
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p>{isLogin ? 'Sign in to your admin dashboard' : 'Join LodgeX management system'}</p>
          </div>

          <div className="login-fields">
            {!isLogin && (
              <div className={`login-field ${name ? 'has-value' : ''}`}>
                <User size={18} className="login-field-icon" />
                <input
                  id="login-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  required
                />
              </div>
            )}

            <div className={`login-field ${email ? 'has-value' : ''}`}>
              <Mail size={18} className="login-field-icon" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
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
                autoComplete={isLogin ? 'current-password' : 'new-password'}
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
            <div className={`login-error ${error.includes('successful') ? 'success' : ''}`}>
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
                {isLogin ? 'Sign In' : 'Create Account'}
                {isLogin ? <ArrowRight size={18} /> : <UserPlus size={18} />}
              </>
            )}
          </button>

          <div className="login-toggle">
            <button 
              type="button" 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </form>

        <div className="login-footer">
          <p>© 2026 LodgeX — Lodge Management System</p>
        </div>
      </div>
    </div>
  );
}
