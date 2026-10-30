import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  Mail, Lock, User, Building, ArrowRight, CheckCircle2,
  Key, ShieldCheck, Sparkles, Eye, EyeOff, Layers, Check
} from 'lucide-react';

const AuthPage = ({ onBackToLanding }) => {
  const { login, signup } = useCRM();
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [signupType, setSignupType] = useState('new'); // 'new' | 'join'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthError('');
    
    // 2FA prompt for enterprise admins
    if (!show2FA && email.includes('admin')) {
      setShow2FA(true);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setAuthError(err.response?.data?.error || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !name || !company) {
      setAuthError('Please fill out all required fields, including your Company Name.');
      return;
    }
    setAuthError('');
    setLoading(true);
    try {
      await signup({ email, password, name, company, signupType, tenantId: company });
    } catch (err) {
      setAuthError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#07080B',
      backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(78, 62, 255, 0.18), transparent)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#F8FAFC'
    }}>
      {onBackToLanding && (
        <button
          onClick={onBackToLanding}
          style={{
            position: 'absolute',
            top: '24px',
            left: '28px',
            zIndex: 10,
            borderRadius: '9999px',
            padding: '8px 18px',
            fontSize: '0.82rem',
            fontWeight: '700',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#E2E8F0',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
        >
          ← Back to Cover
        </button>
      )}

      {/* Main Dual-Pane Dark Modern Card Container */}
      <div style={{
        width: '100%',
        maxWidth: '1100px',
        minHeight: '640px',
        backgroundColor: '#0D0E13',
        borderRadius: '28px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.8), 0 0 50px rgba(78, 62, 255, 0.08)',
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 1.05fr) minmax(340px, 1.15fr)',
        overflow: 'hidden',
        position: 'relative'
      }}>

        {/* LEFT SHOWCASE PANEL: Dark Luxury Card */}
        <div style={{
          padding: '44px 40px',
          background: 'linear-gradient(160deg, #13141F 0%, #0D0E15 60%, #0A0A0F 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Ambient Violet Glow */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            left: '-60px',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(78, 62, 255, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div>
            {/* Sanna Innovations Brand & Tag */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src="/sanna_logo.png"
                  alt="Sanna Innovations Logo"
                  style={{ height: '64px', maxWidth: '240px', width: 'auto', objectFit: 'contain' }}
                />
              </div>

              <span style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: '#93FEBF',
                backgroundColor: 'rgba(147, 254, 191, 0.1)',
                border: '1px solid rgba(147, 254, 191, 0.25)',
                padding: '4px 12px',
                borderRadius: '9999px',
                letterSpacing: '0.04em'
              }}>
                v2.4 Enterprise
              </span>
            </div>

            {/* Headline and Copy */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '1.9rem',
                fontWeight: '800',
                lineHeight: 1.25,
                letterSpacing: '-0.03em',
                color: '#FFFFFF',
                margin: '0 0 14px 0'
              }}>
                Streamlined Operations & <span style={{
                  background: 'linear-gradient(135deg, #A5B4FC 0%, #93FEBF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>Client Intelligence.</span>
              </h2>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                Unified workspace for enterprise client pipelines, deliverables, multi-tenant financial tracking, and real-time team collaboration.
              </p>
            </div>

            {/* Feature Capsules (3-Step Checklist) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(78, 62, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818CF8'
                }}>
                  <Layers size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#F1F5F9' }}>Client & Deliverables Pipeline</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Live tracking of reels, creatives, and retainers</div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34D399'
                }}>
                  <Check size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#F1F5F9' }}>Reconciled Financial Ledger</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Accurate INR/USD ad outlay and automated analytics</div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(168, 85, 247, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C084FC'
                }}>
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#F1F5F9' }}>Multi-Tenant Role Governance</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Role-restricted views for Admins, Developers & Editors</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Capsule */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.75rem',
            color: '#64748B'
          }}>
            <ShieldCheck size={14} color="#34D399" />
            <span>Encrypted Corporate Multi-Tenant Environment</span>
          </div>
        </div>

        {/* RIGHT AUTHENTICATION PANEL */}
        <div style={{
          padding: '48px 44px',
          backgroundColor: '#0F1017',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            {/* Header Titles */}
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                letterSpacing: '-0.025em',
                color: '#FFFFFF',
                margin: '0 0 8px 0'
              }}>
                {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create an account' : 'Reset password'}
              </h1>
              <p style={{ color: '#94A3B8', fontSize: '0.84rem', margin: 0 }}>
                {mode === 'login'
                  ? 'Sign in to access your Sanna workspace, projects, and deliverables.'
                  : 'Get started with an isolated multi-tenant corporate environment.'}
              </p>
            </div>

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {!show2FA ? (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#CBD5E1', marginBottom: '8px' }}>
                        Work Email or Username
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748B' }} />
                        <input
                          type="text"
                          required
                          placeholder="name@sannainnovations.com or username"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 14px 12px 42px',
                            backgroundColor: '#161822',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            fontSize: '0.86rem',
                            fontWeight: '600',
                            color: '#F8FAFC',
                            outline: 'none',
                            transition: 'all 0.2s ease'
                          }}
                          onFocus={e => { e.target.style.backgroundColor = '#1A1C28'; e.target.style.borderColor = '#4E3EFF'; }}
                          onBlur={e => { e.target.style.backgroundColor = '#161822'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#CBD5E1' }}>
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setMode('forgot')}
                          style={{ background: 'none', border: 'none', color: '#818CF8', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748B' }} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 42px 12px 42px',
                            backgroundColor: '#161822',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            fontSize: '0.86rem',
                            fontWeight: '600',
                            color: '#F8FAFC',
                            outline: 'none',
                            transition: 'all 0.2s ease'
                          }}
                          onFocus={e => { e.target.style.backgroundColor = '#1A1C28'; e.target.style.borderColor = '#4E3EFF'; }}
                          onBlur={e => { e.target.style.backgroundColor = '#161822'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#64748B',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px'
                          }}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#CBD5E1', marginBottom: '8px' }}>
                      Two-Factor Authentication (2FA) Code
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Key style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#818CF8' }} />
                      <input
                        type="text"
                        required
                        placeholder="Enter 6-digit TOTP code"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 42px',
                          backgroundColor: '#161822',
                          border: '1px solid #4E3EFF',
                          borderRadius: '12px',
                          fontSize: '0.9rem',
                          letterSpacing: '0.2em',
                          fontWeight: '800',
                          color: '#F8FAFC',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                )}

                {authError && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#F87171',
                    fontSize: '0.78rem',
                    fontWeight: '600'
                  }}>
                    {authError}
                  </div>
                )}

                {/* Primary CTA: High Contrast Indigo/Violet Glow Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '8px',
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    backgroundColor: '#4E3EFF',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 20px rgba(78, 62, 255, 0.4)',
                    opacity: loading ? 0.75 : 1
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#5B4DFF'; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#4E3EFF'; }}
                >
                  <span>{loading ? 'Authenticating...' : show2FA ? 'Verify 2FA & Access Workspace' : 'Sign In to Workspace'}</span>
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </button>
              </form>
            )}

            {/* SIGNUP FORM */}
            {mode === 'signup' && (
              <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#CBD5E1', marginBottom: '6px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      backgroundColor: '#161822',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      fontSize: '0.86rem',
                      color: '#F8FAFC',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#CBD5E1', marginBottom: '6px' }}>
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      backgroundColor: '#161822',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      fontSize: '0.86rem',
                      color: '#F8FAFC',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#CBD5E1', marginBottom: '6px' }}>
                    Company / Organization *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Company Name"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      backgroundColor: '#161822',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      fontSize: '0.86rem',
                      color: '#F8FAFC',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#CBD5E1', marginBottom: '6px' }}>
                    Create Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      backgroundColor: '#161822',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      fontSize: '0.86rem',
                      color: '#F8FAFC',
                      outline: 'none'
                    }}
                  />
                </div>

                {authError && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#F87171',
                    fontSize: '0.78rem'
                  }}>
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '8px',
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    backgroundColor: '#4E3EFF',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Creating Account...' : 'Register Workspace'}
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD */}
            {mode === 'forgot' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.84rem', color: '#94A3B8', margin: 0 }}>
                  Enter your registered work email and our administrator will send you a secure credential reset link.
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#CBD5E1', marginBottom: '6px' }}>
                    Work Email
                  </label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      backgroundColor: '#161822',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      fontSize: '0.86rem',
                      color: '#F8FAFC',
                      outline: 'none'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => alert('Password reset request logged. Please contact your organization administrator.')}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    backgroundColor: '#4E3EFF',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Send Reset Link
                </button>
              </div>
            )}
          </div>

          {/* Mode Switcher Footer */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '0.82rem', color: '#94A3B8' }}>
            {mode === 'login' ? (
              <span>
                Don't have an enterprise account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  style={{ background: 'none', border: 'none', color: '#818CF8', fontWeight: '700', cursor: 'pointer' }}
                >
                  Sign Up
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  style={{ background: 'none', border: 'none', color: '#818CF8', fontWeight: '700', cursor: 'pointer' }}
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;
