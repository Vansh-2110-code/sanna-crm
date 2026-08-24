import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  Search,
  Zap,
  LayoutDashboard,
  Users,
  Kanban,
  FileText,
  ShoppingBag,
  ShieldCheck,
  Calendar,
  Wallet,
  Building,
  BarChart3,
  LogOut,
  LogIn,
  Sun,
  Moon,
  Sparkles,
  ArrowRight,
  Command,
  Clock,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

const SpotlightCommandCenter = ({ isOpen, onClose, onNavigate }) => {
  const {
    loginSessions = [],
    punchInSession,
    punchOutSession,
    currentUser,
    theme,
    setTheme
  } = useCRM();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const currentActiveSession = (loginSessions || []).find(s => 
    (s.userId === currentUser?.id || 
     s.userEmail === currentUser?.email || 
     s.userName === currentUser?.name ||
     (currentUser?.name && s.userName && s.userName.toLowerCase().includes(currentUser.name.toLowerCase()))) && 
    s.status === 'Active'
  );

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const COMMANDS = useMemo(() => [
    // --- Quick Actions ---
    {
      id: 'punch-toggle',
      category: 'Quick Actions',
      title: currentActiveSession ? 'Punch Out Work Session' : 'Punch In / Start Work Session',
      subtitle: currentActiveSession ? `Active since ${currentActiveSession.punchInTime || 'morning'}` : 'Record timestamp & IP',
      icon: currentActiveSession ? LogOut : LogIn,
      iconColor: currentActiveSession ? '#f43f5e' : '#10b981',
      badge: 'Work Clock',
      shortcut: '⌘P',
      action: () => {
        if (currentActiveSession) punchOutSession();
        else punchInSession();
        onClose();
      }
    },
    {
      id: 'create-lead',
      category: 'Quick Actions',
      title: 'Capture & Qualify New Lead',
      subtitle: 'Add potential client opportunity to pipeline',
      icon: Users,
      iconColor: '#60a5fa',
      badge: 'Sales',
      shortcut: '⌘N',
      action: () => {
        onNavigate('leads');
        onClose();
      }
    },
    {
      id: 'new-quote',
      category: 'Quick Actions',
      title: 'Create Quotation & Proposal',
      subtitle: 'Build custom quote with items, tax & discount',
      icon: FileText,
      iconColor: '#818cf8',
      badge: 'Sales',
      shortcut: '⌘Q',
      action: () => {
        onNavigate('quotes');
        onClose();
      }
    },
    {
      id: 'theme-toggle',
      category: 'Quick Actions',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`,
      subtitle: 'Toggle global interface appearance',
      icon: theme === 'dark' ? Sun : Moon,
      iconColor: '#f59e0b',
      badge: 'Settings',
      shortcut: '⌘T',
      action: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        onClose();
      }
    },

    // --- Navigation & Core Modules ---
    {
      id: 'nav-dashboard',
      category: 'Navigation',
      title: 'Executive Performance Cockpit',
      subtitle: 'Revenue metrics, KPI telemetry & sales charts',
      icon: LayoutDashboard,
      iconColor: '#818cf8',
      badge: 'Analytics',
      shortcut: 'G then D',
      action: () => { onNavigate('dashboard'); onClose(); }
    },
    {
      id: 'nav-pipeline',
      category: 'Navigation',
      title: 'Sales Pipeline Kanban Board',
      subtitle: 'Visual drag & drop deal stages',
      icon: Kanban,
      iconColor: '#c084fc',
      badge: 'Sales',
      shortcut: 'G then P',
      action: () => { onNavigate('pipeline'); onClose(); }
    },
    {
      id: 'nav-leads',
      category: 'Navigation',
      title: 'Lead Management Directory',
      subtitle: 'Omnichannel leads scoring & tracking',
      icon: Users,
      iconColor: '#60a5fa',
      badge: 'Sales',
      shortcut: 'G then L',
      action: () => { onNavigate('leads'); onClose(); }
    },
    {
      id: 'nav-quotes',
      category: 'Navigation',
      title: 'Quotation Engine & Proposals',
      subtitle: 'Proposals, rate calculations & approvals',
      icon: FileText,
      iconColor: '#a78bfa',
      badge: 'Sales',
      shortcut: 'G then Q',
      action: () => { onNavigate('quotes'); onClose(); }
    },
    {
      id: 'nav-orders',
      category: 'Navigation',
      title: 'Orders, Invoices & Revenue',
      subtitle: 'GST invoices, billing & payment receipts',
      icon: ShoppingBag,
      iconColor: '#34d399',
      badge: 'Sales',
      shortcut: 'G then O',
      action: () => { onNavigate('orders'); onClose(); }
    },
    {
      id: 'nav-deliverables',
      category: 'Navigation',
      title: 'Client Deliverables Matrix',
      subtitle: 'Ongoing projects & milestone deliverables',
      icon: Layers,
      iconColor: '#38bdf8',
      badge: 'Operations',
      shortcut: 'G then M',
      action: () => { onNavigate('deliverables'); onClose(); }
    },
    {
      id: 'nav-salary',
      category: 'Navigation',
      title: 'Attendance, Salary & Payroll',
      subtitle: 'Monthly attendance logs & employee payroll',
      icon: Wallet,
      iconColor: '#fbbf24',
      badge: 'HR',
      shortcut: 'G then S',
      action: () => { onNavigate('salary'); onClose(); }
    },
    {
      id: 'nav-kyc',
      category: 'Navigation',
      title: 'KYC & Verification Vault',
      subtitle: 'Encrypted identity docs & corporate records',
      icon: ShieldCheck,
      iconColor: '#f472b6',
      badge: 'HR',
      shortcut: 'G then K',
      action: () => { onNavigate('kyc'); onClose(); }
    },
    {
      id: 'nav-reports',
      category: 'Navigation',
      title: 'Reports & CSV Intelligence Suite',
      subtitle: 'Export datasets & intelligence analytics',
      icon: FileSpreadsheet,
      iconColor: '#60a5fa',
      badge: 'Analytics',
      shortcut: 'G then R',
      action: () => { onNavigate('reports'); onClose(); }
    },
    {
      id: 'nav-security',
      category: 'Navigation',
      title: 'Security & Audit Vault',
      subtitle: 'Active sessions, IP telemetry & zero-trust logs',
      icon: ShieldCheck,
      iconColor: '#ef4444',
      badge: 'Security',
      shortcut: 'G then Z',
      action: () => { onNavigate('security'); onClose(); }
    }
  ], [currentActiveSession, theme, onNavigate, onClose, punchInSession, punchOutSession, setTheme]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter(cmd => 
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.badge.toLowerCase().includes(q)
    );
  }, [COMMANDS, query]);

  // Handle keyboard navigation inside the command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          selected.action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group filtered commands by category
  const categories = Array.from(new Set(filteredCommands.map(c => c.category)));

  return (
    <div className="spotlight-overlay" onClick={onClose}>
      <div
        className="spotlight-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          border: '1px solid rgba(255, 255, 255, 0.12)',
          background: '#0e121d',
          maxHeight: '75vh'
        }}
      >
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <Search style={{ width: '18px', height: '18px', color: '#818cf8', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, module, or search action..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '0.98rem',
              fontWeight: '500',
              fontFamily: 'inherit'
            }}
          />
          <span style={{
            fontSize: '0.68rem',
            fontWeight: '700',
            color: 'var(--text-muted)',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '3px 7px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            ESC to close
          </span>
        </div>

        {/* Command List */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 12px'
          }}
        >
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No commands or actions found matching "<strong>{query}</strong>"
            </div>
          ) : (
            categories.map(cat => {
              const catItems = filteredCommands.filter(c => c.category === cat);
              return (
                <div key={cat} style={{ marginBottom: '10px' }}>
                  <div style={{
                    fontSize: '0.66rem',
                    fontWeight: '800',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '6px 10px 4px'
                  }}>
                    {cat}
                  </div>
                  {catItems.map((cmd) => {
                    const globalIdx = filteredCommands.indexOf(cmd);
                    const isSelected = globalIdx === selectedIndex;
                    const Icon = cmd.icon;

                    return (
                      <div
                        key={cmd.id}
                        data-index={globalIdx}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`spotlight-item ${isSelected ? 'active' : ''}`}
                        style={{
                          background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Icon style={{ width: '16px', height: '16px', color: cmd.iconColor || '#818cf8' }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontWeight: isSelected ? '700' : '600',
                              color: isSelected ? '#ffffff' : 'var(--text-primary)',
                              fontSize: '0.85rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {cmd.title}
                            </div>
                            <div style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {cmd.subtitle}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: '700',
                            color: 'var(--text-muted)',
                            background: 'rgba(255, 255, 255, 0.04)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(255, 255, 255, 0.06)'
                          }}>
                            {cmd.badge}
                          </span>
                          {cmd.shortcut && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: '700',
                              color: isSelected ? '#a5b4fc' : 'var(--text-muted)',
                              background: isSelected ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'
                            }}>
                              {cmd.shortcut}
                            </span>
                          )}
                          {isSelected && (
                            <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: '800' }}>
                              ↵
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div style={{
          padding: '10px 18px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(0, 0, 0, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.72rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            <span><kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px' }}>↑</kbd> <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px' }}>↓</kbd> Navigate</span>
            <span><kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px' }}>↵</kbd> Select</span>
          </div>
          <span>SANNA Enterprise Spotlight</span>
        </div>
      </div>
    </div>
  );
};

export default SpotlightCommandCenter;
