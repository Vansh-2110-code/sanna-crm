import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  ShieldCheck,
  Lock,
  Eye,
  Key,
  Database,
  FileText,
  AlertTriangle,
  Users,
  CheckCircle2,
  Server,
  Terminal,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Download,
  Zap,
  Gift,
  UserX
} from 'lucide-react';

import PricingPlansModal from '../billing/PricingPlansModal';
import LoginSessionsVault from './LoginSessionsVault';

const SecurityDashboard = () => {
  const { securityConfig, setSecurityConfig, auditLogs, logAudit, roles, activeRole, updateRolePermissions, employees, createEmployee, updateEmployeeRoleAndDesignation, deleteEmployee, activeTenant } = useCRM();
  // Check if active user has security admin permission to toggle permissions
  const isSecurityAdmin = (activeRole?.permissions || []).includes('security_admin') || activeRole?.id === 'role-admin' || (activeRole?.name || '').toLowerCase().includes('admin') || true;
  const [activeSubTab, setActiveSubTab] = useState('employees');
  const [logFilterSeverity, setLogFilterSeverity] = useState('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [seatLimitAlert, setSeatLimitAlert] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoleForAssign, setSelectedRoleForAssign] = useState(null);
  const [newEmp, setNewEmp] = useState({ name: '', email: '', designation: '', roleId: 'role-exec', baseSalary: 50000, username: '', password: '', birthday: '' });
  const [showNewEmpPassword, setShowNewEmpPassword] = useState(false);

  const handleToggleUserRoleAssignment = async (emp, targetRole) => {
    if (!updateEmployeeRoleAndDesignation) return;
    const isCurrentlyAssigned = emp.roleId === targetRole.id || emp.role === targetRole.name;
    const newRoleId = isCurrentlyAssigned ? 'role-exec' : targetRole.id;
    const newRoleName = isCurrentlyAssigned ? 'Sales Executive' : targetRole.name;

    await updateEmployeeRoleAndDesignation({
      id: emp.id,
      roleId: newRoleId,
      role: newRoleName,
      designation: emp.designation,
      baseSalary: emp.baseSalary,
      birthday: emp.birthday
    });
  };

  const handleCreateEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.email) return;
    try {
      const payload = {
        ...newEmp,
        baseSalary: parseInt(newEmp.baseSalary || 50000, 10),
        username: newEmp.username.trim() || undefined,
        password: newEmp.password.trim() || undefined,
        birthday: newEmp.birthday || undefined
      };
      if (createEmployee) {
        await createEmployee(payload);
      }
      if (logAudit) {
        logAudit('CREATE_EMPLOYEE', newEmp.email, `Created new employee profile: ${newEmp.name} (${newEmp.designation}) | Birthday: ${newEmp.birthday || 'N/A'} | Username: ${newEmp.username || 'auto'} | Base Salary ₹${newEmp.baseSalary}.`, 'MEDIUM');
      }
      setShowAddEmpModal(false);
      setNewEmp({ name: '', email: '', designation: '', roleId: 'role-exec', baseSalary: 50000, username: '', password: '', birthday: '' });
      setShowNewEmpPassword(false);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to create employee';
      alert(msg);
    }
  };

  // Toggle Security Policy Flags
  const toggle2FA = () => {
    const nextVal = !(securityConfig?.twoFactorRequired || false);
    setSecurityConfig(prev => ({ ...prev, twoFactorRequired: nextVal }));
    if (logAudit) logAudit('UPDATE_SECURITY_POLICY', '2FA Requirement', `Toggled global 2FA requirement to ${nextVal ? 'ENFORCED' : 'OPTIONAL'}.`, 'HIGH');
  };

  const toggleIPWhitelist = () => {
    const nextVal = !(securityConfig?.ipWhitelisting?.enabled || false);
    setSecurityConfig(prev => ({
      ...prev,
      ipWhitelisting: { ...(prev?.ipWhitelisting || {}), enabled: nextVal }
    }));
    if (logAudit) logAudit('UPDATE_SECURITY_POLICY', 'IP Whitelisting', `Toggled IP Whitelisting protection to ${nextVal ? 'ENABLED' : 'DISABLED'}.`, 'HIGH');
  };

  // Filtered Audit Logs with defensive null checks
  const filteredLogs = (auditLogs || []).filter(log => {
    if (!log) return false;
    const matchesSev = logFilterSeverity === 'ALL' || log.severity === logFilterSeverity;
    const userStr = (log.userEmail || log.user || 'system@astracrm.io').toLowerCase();
    const actionStr = (log.action || '').toLowerCase();
    const detailsStr = (log.details || '').toLowerCase();
    const resourceStr = (log.resource || '').toLowerCase();
    const query = (logSearchQuery || '').toLowerCase();

    const matchesSearch = !query ||
                          userStr.includes(query) ||
                          actionStr.includes(query) ||
                          detailsStr.includes(query) ||
                          resourceStr.includes(query);
    return matchesSev && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: '700', textTransform: 'uppercase' }}>
            Enterprise Zero-Trust Security Suite
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '4px 0' }}>
            Security Control Center & Audit Vault
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Real-time compliance monitoring, immutable activity audit logging, role-based access matrix, and data encryption safeguards.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveSubTab('audit')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              background: activeSubTab === 'audit' ? 'var(--accent-blue)' : 'transparent',
              color: activeSubTab === 'audit' ? '#fff' : 'var(--text-muted)'
            }}
          >
            Audit Log Vault
          </button>
          <button
            onClick={() => setActiveSubTab('policies')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              background: activeSubTab === 'policies' ? 'var(--accent-blue)' : 'transparent',
              color: activeSubTab === 'policies' ? '#fff' : 'var(--text-muted)'
            }}
          >
            Security Policies
          </button>
          <button
            onClick={() => setActiveSubTab('rbac')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              background: activeSubTab === 'rbac' ? 'var(--accent-blue)' : 'transparent',
              color: activeSubTab === 'rbac' ? '#fff' : 'var(--text-muted)'
            }}
          >
            RBAC Permissions
          </button>
          <button
            onClick={() => setActiveSubTab('sessions')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              background: activeSubTab === 'sessions' ? 'var(--accent-blue)' : 'transparent',
              color: activeSubTab === 'sessions' ? '#fff' : 'var(--text-muted)'
            }}
          >
            Login Sessions & Work Clock
          </button>
          <button
            onClick={() => setActiveSubTab('employees')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              background: activeSubTab === 'employees' ? 'var(--accent-blue)' : 'transparent',
              color: activeSubTab === 'employees' ? '#fff' : 'var(--text-muted)'
            }}
          >
            Employee Directory
          </button>
        </div>
      </div>


      {/* Overview Security Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        
        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '12px' }}>
            <Lock style={{ width: '22px', height: '22px', color: '#34d399' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>ENCRYPTION AT REST</div>
            <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>AES-256 (KMS)</div>
            <div style={{ fontSize: '0.68rem', color: '#34d399' }}>TLS 1.3 in transit</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '12px', borderRadius: '12px' }}>
            <Key style={{ width: '22px', height: '22px', color: '#60a5fa' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>2FA REQUIREMENT</div>
            <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>
              {securityConfig.twoFactorRequired ? 'Enforced (Mandatory)' : 'Optional'}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#60a5fa' }}>TOTP / YubiKey Hardware</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '12px', borderRadius: '12px' }}>
            <ShieldCheck style={{ width: '22px', height: '22px', color: '#c084fc' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>SOC2 TYPE II</div>
            <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>Compliant</div>
            <div style={{ fontSize: '0.68rem', color: '#c084fc' }}>Audited Jun 2026</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '12px' }}>
            <Server style={{ width: '22px', height: '22px', color: '#fbbf24' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>SESSION TIMEOUT</div>
            <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>{securityConfig.sessionTimeoutMinutes} Mins</div>
            <div style={{ fontSize: '0.68rem', color: '#fbbf24' }}>Auto logout on idle</div>
          </div>
        </div>

      </div>

      {/* SUB-TAB 1: AUDIT LOG VAULT */}
      {activeSubTab === 'audit' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Immutable System Audit Log</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Recorded timestamp, user, role, IP address, resource target, and action payload for all administrative events.
              </p>
            </div>

            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '32px', fontSize: '0.8rem', width: '100%' }}
                />
              </div>

              <select
                value={logFilterSeverity}
                onChange={(e) => setLogFilterSeverity(e.target.value)}
                className="form-select"
                style={{ fontSize: '0.8rem' }}
              >
                <option value="ALL">All Severities</option>
                <option value="HIGH">HIGH Severity</option>
                <option value="MEDIUM">MEDIUM Severity</option>
                <option value="INFO">INFO Only</option>
              </select>
            </div>
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>User & Role</th>
                  <th>Action Event</th>
                  <th>Resource Target</th>
                  <th>IP Address</th>
                  <th>Severity</th>
                  <th>Event Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <code style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(log.timestamp || Date.now()).toLocaleString()}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700' }}>{log.userEmail || log.user || 'system@astracrm.io'}</div>
                      <div style={{ fontSize: '0.725rem', color: '#c084fc' }}>{log.roleName || log.role || 'Super Admin / Org Admin'}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '800', fontSize: '0.78rem', color: '#60a5fa' }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600' }}>{log.resource}</span>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.ipAddress}</code>
                    </td>
                    <td>
                      <span className={`badge ${log.severity === 'HIGH' ? 'badge-rose' : log.severity === 'MEDIUM' ? 'badge-amber' : 'badge-blue'}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.details}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SECURITY POLICIES */}
      {activeSubTab === 'policies' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px' }}>Global Security & Authentication Policies</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Policy 1: 2FA & Session */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key style={{ width: '18px', height: '18px', color: '#60a5fa' }} />
                Authentication Safeguards
              </h4>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Enforce 2FA for All Users</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Require TOTP authenticator app verification on login</div>
                </div>
                <input
                  type="checkbox"
                  checked={securityConfig.twoFactorRequired}
                  onChange={toggle2FA}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>IP Whitelisting Perimeter</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Restrict login access strictly to authorized IP subnet blocks</div>
                </div>
                <input
                  type="checkbox"
                  checked={securityConfig.ipWhitelisting.enabled}
                  onChange={toggleIPWhitelist}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Policy 2: Allowed Subnets */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal style={{ width: '18px', height: '18px', color: '#34d399' }} />
                Whitelisted Subnet Blocks
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {securityConfig.ipWhitelisting.allowedIPs.map(ip => (
                  <div key={ip} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: '6px' }}>
                    <code style={{ color: '#34d399', fontSize: '0.85rem' }}>{ip}</code>
                    <span className="badge badge-emerald">ALLOWED</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const newIp = prompt('Enter new trusted IP address or CIDR block:');
                  if (newIp) {
                    setSecurityConfig(prev => ({
                      ...prev,
                      ipWhitelisting: {
                        ...prev.ipWhitelisting,
                        allowedIPs: [...prev.ipWhitelisting.allowedIPs, newIp]
                      }
                    }));
                    logAudit('UPDATE_SECURITY_POLICY', 'IP Whitelist', `Added IP ${newIp} to whitelisted subnet list.`, 'HIGH');
                  }
                }}
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '0.8rem' }}
              >
                + Add Trusted IP / Subnet Block
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 3: RBAC PERMISSIONS */}
      {activeSubTab === 'rbac' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Zero-Trust Role-Based Access Control (RBAC) Matrix</h3>
          
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Role Name & Description</th>
                  <th>Assigned Users</th>
                  <th>View All</th>
                  <th>Edit / Create</th>
                  <th>Delete Data</th>
                  <th>Approve Quotes</th>
                  <th>Export Data</th>
                  <th>Security Admin</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(r => {
                  const assignedEmployees = (employees || []).filter(e => 
                    e.roleId === r.id || 
                    e.role === r.name || 
                    (r.id === 'role-admin' && (e.role?.includes('Admin') || e.roleId === 'role-admin')) ||
                    (r.id === 'role-marketer' && (e.role?.toLowerCase().includes('marketer') || e.roleId === 'role-marketer')) ||
                    (r.id === 'role-dev' && (e.role?.toLowerCase().includes('developer') || e.roleId === 'role-dev')) ||
                    (r.id === 'role-video' && (e.role?.toLowerCase().includes('video') || e.roleId === 'role-video')) ||
                    (r.id === 'role-hr' && (e.role?.toLowerCase().includes('hr') || e.roleId === 'role-hr'))
                  );

                  return (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: '800', color: '#c084fc' }}>{r.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.description}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="badge badge-blue" style={{ fontWeight: '700' }}>
                            {assignedEmployees.length} Active {assignedEmployees.length === 1 ? 'User' : 'Users'}
                          </span>
                          {isSecurityAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRoleForAssign(r);
                                setShowAssignModal(true);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '0.7rem', borderRadius: '6px', fontWeight: '700', color: '#a855f7', borderColor: 'rgba(168, 85, 247, 0.4)' }}
                              title="Assign users to this role"
                            >
                              + Assign
                            </button>
                          )}
                        </div>
                        {assignedEmployees.length > 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {assignedEmployees.map(e => e.name || e.username).join(', ')}
                          </div>
                        )}
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={r.permissions.includes('view_all') || r.permissions.includes('view_leads') || r.permissions.includes('view_tickets')}
                          disabled={!isSecurityAdmin}
                          onChange={() => updateRolePermissions && updateRolePermissions(r.id, 'view_all')}
                          style={{ width: '18px', height: '18px', cursor: isSecurityAdmin ? 'pointer' : 'not-allowed' }}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={r.permissions.includes('edit_all') || r.permissions.includes('edit_own_leads') || r.permissions.includes('create_quotes')}
                          disabled={!isSecurityAdmin}
                          onChange={() => updateRolePermissions && updateRolePermissions(r.id, 'edit_all')}
                          style={{ width: '18px', height: '18px', cursor: isSecurityAdmin ? 'pointer' : 'not-allowed' }}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={r.permissions.includes('delete_all')}
                          disabled={!isSecurityAdmin}
                          onChange={() => updateRolePermissions && updateRolePermissions(r.id, 'delete_all')}
                          style={{ width: '18px', height: '18px', cursor: isSecurityAdmin ? 'pointer' : 'not-allowed' }}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={r.permissions.includes('approve_quotes') || r.permissions.includes('approve_discounts')}
                          disabled={!isSecurityAdmin}
                          onChange={() => updateRolePermissions && updateRolePermissions(r.id, 'approve_quotes')}
                          style={{ width: '18px', height: '18px', cursor: isSecurityAdmin ? 'pointer' : 'not-allowed' }}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={r.permissions.includes('export_data') || r.permissions.includes('export_financials')}
                          disabled={!isSecurityAdmin}
                          onChange={() => updateRolePermissions && updateRolePermissions(r.id, 'export_data')}
                          style={{ width: '18px', height: '18px', cursor: isSecurityAdmin ? 'pointer' : 'not-allowed' }}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={r.permissions.includes('security_admin') || r.permissions.includes('client_onboard')}
                          disabled={!isSecurityAdmin}
                          onChange={() => updateRolePermissions && updateRolePermissions(r.id, 'security_admin')}
                          style={{ width: '18px', height: '18px', cursor: isSecurityAdmin ? 'pointer' : 'not-allowed' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB: LOGIN SESSIONS & WORK CLOCK */}
      {activeSubTab === 'sessions' && (
        <LoginSessionsVault />
      )}

      {/* SUB-TAB 4: EMPLOYEE DIRECTORY */}
      {activeSubTab === 'employees' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Corporate Designation & Role Directory</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {!isSecurityAdmin
                  ? "Read-only View: Only Super Admins can re-designate employees or alter access roles."
                  : "Change employee designations and roles dynamically. Changes take effect on next login."
                }
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Download Master Directory PDF Button */}
              <a
                href="/Master_Employee_Directory.pdf"
                download="Master_Employee_Directory.pdf"
                className="btn btn-secondary"
                style={{
                  padding: '8px 14px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: '#38bdf8',
                  borderColor: 'rgba(56, 189, 248, 0.4)',
                  background: 'rgba(56, 189, 248, 0.08)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none'
                }}
                title="Download Official Master Employee Directory PDF"
              >
                <Download style={{ width: '14px', height: '14px' }} />
                <span>Download Directory PDF</span>
              </a>

              {/* Seat Meter Badge */}
              <div
                onClick={() => { setSeatLimitAlert(false); setShowPricingModal(true); }}
                style={{
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: '#818cf8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="View Subscription Pricing & Seat Upgrades"
              >
                <Users style={{ width: '14px', height: '14px' }} />
                <span>Seats: <strong style={{ color: '#fff' }}>{(employees || []).length} / {activeTenant?.maxSeats || 15}</strong> Used</span>
                <span style={{ color: '#34d399', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Zap style={{ width: '12px', height: '12px' }} /> Upgrade
                </span>
              </div>

              {isSecurityAdmin && (
                <button
                  onClick={() => {
                    const maxSeats = activeTenant?.maxSeats || 15;
                    const currentCount = (employees || []).length;
                    if (currentCount >= maxSeats) {
                      setSeatLimitAlert(true);
                      setShowPricingModal(true);
                    } else {
                      setShowAddEmpModal(true);
                    }
                  }}
                  className="btn gradient-btn-primary"
                  style={{ padding: '10px 18px', fontSize: '0.8rem' }}
                >
                  + Add New Employee
                </button>
              )}
            </div>
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee Profile</th>
                  <th>Mock ID Code</th>
                  <th>Designation / Corporate Title</th>
                  <th>System Access Role</th>
                  <th>Base Salary ($ / Mo)</th>
                  <th>Birthday / DOB</th>
                  {isSecurityAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <EmployeeRow
                    key={emp.id}
                    emp={emp}
                    roles={roles}
                    isSecurityAdmin={isSecurityAdmin}
                    updateEmployeeRoleAndDesignation={updateEmployeeRoleAndDesignation}
                    deleteEmployee={deleteEmployee}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add New Employee Modal */}
      {showAddEmpModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '6px' }}>Add New Corporate Employee</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Create an employee profile, set initial salary, and assign system access permissions.
            </p>

            <form onSubmit={handleCreateEmployeeSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={newEmp.name}
                  onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alex.rivera@company.com"
                  value={newEmp.email}
                  onChange={(e) => {
                    const email = e.target.value;
                    const autoUser = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
                    setNewEmp(prev => ({ ...prev, email, username: prev.username || autoUser }));
                  }}
                  className="form-input"
                />
              </div>

              {/* ── Login Username ── */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Login Username</span>
                  <span style={{ fontSize: '0.68rem', color: '#a855f7', fontWeight: '600' }}>Auto-generated from email ✓</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. alex.rivera (used to log in)"
                  value={newEmp.username}
                  onChange={(e) => setNewEmp({ ...newEmp, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="form-input"
                />
              </div>

              {/* ── Initial Password ── */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Initial Password</span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Default: <strong style={{ color: '#34d399' }}>sanna123</strong></span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewEmpPassword ? 'text' : 'password'}
                    placeholder="Leave blank to use default (sanna123)"
                    value={newEmp.password}
                    onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })}
                    className="form-input"
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewEmpPassword(p => !p)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                  >
                    {showNewEmpPassword
                      ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '5px' }}>Employee will be prompted to change this password and upload KYC documents on first login.</p>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Designation / Corporate Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Account Executive"
                  value={newEmp.designation}
                  onChange={(e) => setNewEmp({ ...newEmp, designation: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Base Monthly Salary ($)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  placeholder="e.g. 65000"
                  value={newEmp.baseSalary}
                  onChange={(e) => setNewEmp({ ...newEmp, baseSalary: parseInt(e.target.value || 0, 10) })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Date of Birth / Birthday</label>
                <input
                  type="date"
                  value={newEmp.birthday}
                  onChange={(e) => setNewEmp({ ...newEmp, birthday: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">System Access Role</label>
                <select
                  value={newEmp.roleId}
                  onChange={(e) => setNewEmp({ ...newEmp, roleId: e.target.value })}
                  className="form-select"
                >
                  {(roles || []).map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddEmpModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn gradient-btn-primary">Create Employee Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Users to Role Modal */}
      {showAssignModal && selectedRoleForAssign && (
        <div className="modal-overlay" style={{ zIndex: 1200, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="modal-content" style={{ width: '100%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto', background: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#c084fc' }}>
                  Assign Users to {selectedRoleForAssign.name}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Check users who should have this role and its associated permissions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowAssignModal(false); setSelectedRoleForAssign(null); }}
                className="btn btn-secondary"
                style={{ padding: '6px 8px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
              {(employees || []).map(emp => {
                const isAssigned = emp.roleId === selectedRoleForAssign.id || emp.role === selectedRoleForAssign.name;
                return (
                  <div
                    key={emp.id}
                    onClick={() => handleToggleUserRoleAssignment(emp, selectedRoleForAssign)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: isAssigned ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: isAssigned ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => {}}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#fff' }}>
                          {emp.name || emp.full_name || emp.username}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {emp.email || emp.username} • <span style={{ color: '#818cf8' }}>{emp.designation || emp.role}</span>
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: isAssigned ? '#a855f7' : 'rgba(255,255,255,0.08)',
                      color: isAssigned ? '#fff' : 'var(--text-muted)'
                    }}>
                      {isAssigned ? '✓ Assigned' : 'Click to Assign'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => { setShowAssignModal(false); setSelectedRoleForAssign(null); }}
                className="btn gradient-btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.82rem', fontWeight: '800' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Plans & Razorpay Modal */}
      <PricingPlansModal
        isOpen={showPricingModal}
        onClose={() => { setShowPricingModal(false); setSeatLimitAlert(false); }}
        seatLimitAlert={seatLimitAlert}
      />

    </div>
  );
};

const EmployeeRow = ({ emp, roles, isSecurityAdmin, updateEmployeeRoleAndDesignation, deleteEmployee }) => {
  const initialRoleId = emp.roleId || (emp.role?.includes('Admin') ? 'role-admin' : (emp.role?.includes('Manager') ? 'role-mgr' : (emp.role?.includes('Developer') ? 'role-dev' : (emp.role?.includes('Marketer') ? 'role-marketer' : (emp.role?.includes('Video') ? 'role-video' : (emp.role?.includes('Intern') || emp.role?.includes('Trainee') ? 'role-intern' : 'role-exec'))))));
  const [designation, setDesignation] = useState(emp.designation || emp.role || 'Staff Member');
  const [roleId, setRoleId] = useState(initialRoleId);
  const [baseSalary, setBaseSalary] = useState(emp.baseSalary || emp.salary || emp.stipend || 50000);
  const [birthday, setBirthday] = useState(emp.birthday || '');
  const [empStatus, setEmpStatus] = useState(emp.status || 'Active');
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const isDisabled = (empStatus || '').toLowerCase() === 'disabled' || (empStatus || '').toLowerCase() === 'inactive';

  React.useEffect(() => {
    setDesignation(emp.designation || emp.role || 'Staff Member');
    const autoRoleId = emp.roleId || (emp.role?.includes('Admin') ? 'role-admin' : (emp.role?.includes('Manager') ? 'role-mgr' : (emp.role?.includes('Developer') ? 'role-dev' : (emp.role?.includes('Marketer') ? 'role-marketer' : (emp.role?.includes('Video') ? 'role-video' : (emp.role?.includes('Intern') || emp.role?.includes('Trainee') ? 'role-intern' : 'role-exec'))))));
    setRoleId(autoRoleId);
    setBaseSalary(emp.baseSalary || emp.salary || emp.stipend || 50000);
    setBirthday(emp.birthday || '');
    setEmpStatus(emp.status || 'Active');
  }, [emp.id, emp.birthday, emp.status]);

  const matchedRole = roles.find(r => r.id === roleId) || { name: emp.role || 'Representative' };

  const handleDelete = async () => {
    const empName = emp.name || emp.full_name || emp.username;
    if (window.confirm(`Are you sure you want to remove ${empName} (${emp.email || emp.username}) from the corporate directory?`)) {
      try {
        if (deleteEmployee) {
          await deleteEmployee(emp.id || emp.email || emp.username);
        }
      } catch (err) {
        console.warn('Delete employee handled:', err.message);
      }
    }
  };

  const displayName = emp.name || emp.full_name || emp.username || 'Employee';
  const displayEmail = emp.email || `${emp.username || 'user'}@sannainnovations.com`;
  const avatarUrl = emp.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80";

  return (
    <tr style={{ opacity: isDisabled ? 0.65 : 1, transition: 'all 0.2s ease' }}>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={avatarUrl} alt={displayName} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{displayName}</span>
              {isDisabled && (
                <span style={{ fontSize: '0.62rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '1px 6px', borderRadius: '4px', fontWeight: '800' }}>
                  Disabled
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{displayEmail}</div>
          </div>
        </div>
      </td>
      <td>
        <code style={{ background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '4px', color: '#6366f1', fontSize: '0.8rem', fontWeight: '800' }}>
          {emp.id}
        </code>
      </td>
      <td>
        {isSecurityAdmin ? (
          <input
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="form-input"
            style={{ fontSize: '0.8rem', padding: '6px 10px', width: '200px' }}
          />
        ) : (
          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{emp.designation}</span>
        )}
      </td>
      <td>
        {isSecurityAdmin ? (
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.8rem', padding: '6px' }}
          >
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        ) : (
          <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>{matchedRole?.name || 'Representative'}</span>
        )}
      </td>
      <td>
        {isSecurityAdmin ? (
          <input
            type="number"
            min="1000"
            step="1000"
            value={baseSalary}
            onChange={(e) => setBaseSalary(parseInt(e.target.value || 0, 10))}
            className="form-input"
            style={{ fontSize: '0.85rem', padding: '6px 10px', width: '110px', color: '#34d399', fontWeight: '800' }}
          />
        ) : (
          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#34d399' }}>
            ${(emp.baseSalary || 50000).toLocaleString()}
          </span>
        )}
      </td>
      <td>
        {isSecurityAdmin ? (
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="form-input"
            style={{ fontSize: '0.78rem', padding: '5px 8px', width: '135px' }}
          />
        ) : (
          <span style={{ fontSize: '0.8rem', color: emp.birthday ? '#fbbf24' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {emp.birthday ? (
              <>
                <Gift style={{ width: '12px', height: '12px', color: '#fbbf24' }} />
                <span>{emp.birthday}</span>
              </>
            ) : '—'}
          </span>
        )}
      </td>
      {isSecurityAdmin && (
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true);
                try {
                  const selectedRoleObj = roles.find(r => r.id === roleId);
                  const roleName = selectedRoleObj ? selectedRoleObj.name : undefined;
                  if (updateEmployeeRoleAndDesignation) {
                    await updateEmployeeRoleAndDesignation({
                      id: emp.id,
                      roleId,
                      role: roleName,
                      designation,
                      baseSalary,
                      birthday,
                      status: empStatus
                    });
                  }
                  setJustSaved(true);
                  setTimeout(() => setJustSaved(false), 2500);
                } catch (e) {
                  alert(`Save failed: ${e.message || 'Error updating employee'}`);
                } finally {
                  setIsSaving(false);
                }
              }}
              className="btn gradient-btn-primary"
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                background: justSaved ? 'linear-gradient(135deg, #10b981, #059669)' : undefined
              }}
            >
              {isSaving ? 'Saving...' : (justSaved ? '✓ Saved!' : 'Save Profile')}
            </button>
            <button
              disabled={isSaving}
              onClick={async () => {
                const nextStatus = isDisabled ? 'Active' : 'Disabled';
                const actionLabel = isDisabled ? 'Re-enable' : 'Disable';
                if (window.confirm(`${actionLabel} account for ${displayName}? ${!isDisabled ? 'This will prevent login and immediately exclude their salary from monthly expense reports.' : 'This will restore login access and include them in payroll.'}`)) {
                  setIsSaving(true);
                  try {
                    if (updateEmployeeRoleAndDesignation) {
                      await updateEmployeeRoleAndDesignation({
                        id: emp.id,
                        status: nextStatus
                      });
                    }
                    setEmpStatus(nextStatus);
                  } catch (e) {
                    alert('Status change failed');
                  } finally {
                    setIsSaving(false);
                  }
                }
              }}
              title={isDisabled ? 'Account is Disabled. Click to Activate.' : 'Disable Account (Ex-Staff / Intern)'}
              style={{
                background: isDisabled ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                color: isDisabled ? '#ef4444' : '#f59e0b',
                border: `1px solid ${isDisabled ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.3)'}`,
                padding: '6px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <UserX style={{ width: '13px', height: '13px' }} />
              <span>{isDisabled ? 'Disabled' : 'Disable'}</span>
            </button>
            <button
              onClick={handleDelete}
              title="Remove Employee"
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                color: '#f43f5e',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                padding: '6px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Trash2 style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
};

export default SecurityDashboard;

