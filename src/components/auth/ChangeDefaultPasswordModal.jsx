import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { ShieldCheck, Lock, Key, CheckCircle2, AlertTriangle, Eye, EyeOff, ArrowRight, X } from 'lucide-react';

const ChangeDefaultPasswordModal = ({ isOpen, onClose, onPasswordChanged }) => {
  const { currentUser, changeUserPassword } = useCRM();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Password strength calculation
  const hasMinLength = newPassword.length >= 6;
  const hasNumber = /\d/.test(newPassword);
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const isStrong = hasMinLength && hasNumber && hasLetter;
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Please enter your current default password.');
      return;
    }

    if (!hasMinLength) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (!passwordsMatch) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from your current default password.');
      return;
    }

    setLoading(true);
    try {
      if (changeUserPassword) {
        await changeUserPassword(currentPassword, newPassword);
      }
      setSuccess(true);
      setTimeout(() => {
        if (onPasswordChanged) onPasswordChanged();
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #131b2e 0%, #0f172a 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.2)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '460px',
        overflow: 'hidden',
        position: 'relative',
        animation: 'modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Top Glowing Header Accent */}
        <div style={{
          height: '4px',
          background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #38bdf8 100%)'
        }} />

        <div style={{ padding: '28px 32px 32px 32px' }}>
          {/* Header Icon & Title */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              flexShrink: 0
            }}>
              <ShieldCheck style={{ width: '26px', height: '26px' }} />
            </div>
            <div>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '800',
                color: '#fff',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                Update Default Password
              </h2>
              <p style={{
                fontSize: '0.82rem',
                color: '#94a3b8',
                margin: '4px 0 0 0',
                lineHeight: 1.4
              }}>
                Welcome, <strong style={{ color: '#e2e8f0' }}>{currentUser?.name || currentUser?.username}</strong>! Please change your initial default password for account security.
              </p>
            </div>
          </div>

          {/* Success Message View */}
          {success ? (
            <div style={{
              padding: '24px 16px',
              textAlign: 'center',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              margin: '20px 0'
            }}>
              <CheckCircle2 style={{ width: '40px', height: '40px', color: '#10b981', margin: '0 auto 12px auto' }} />
              <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: '700', margin: '0 0 6px 0' }}>Password Successfully Updated!</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>Entering your SANNA CRM workspace...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Current Default Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                  Current / Default Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b' }} />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 38px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                  New Personal Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Key style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b' }} />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters (e.g. Sanna@2026)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 38px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Badges */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', color: hasMinLength ? '#10b981' : '#64748b' }}>
                    {hasMinLength ? '✓' : '○'} 6+ characters
                  </span>
                  <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', color: hasNumber ? '#10b981' : '#64748b' }}>
                    {hasNumber ? '✓' : '○'} Number
                  </span>
                  <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', color: hasLetter ? '#10b981' : '#64748b' }}>
                    {hasLetter ? '✓' : '○'} Letter
                  </span>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b' }} />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 38px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${passwordsMatch ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px 18px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  <span>{loading ? 'Saving...' : 'Save & Continue'}</span>
                  <ArrowRight size={16} />
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#94a3b8',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Skip
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangeDefaultPasswordModal;
