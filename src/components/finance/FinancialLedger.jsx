import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import { BookOpen, Plus, Edit2, Trash2, X, Download, TrendingUp, TrendingDown, DollarSign, Search, Calendar } from 'lucide-react';
import { exportToCSV } from '../../utils/csvExporter';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const INFLOW_CATEGORIES = ['Client Retainer', 'Client Payment', 'Bank Balance', 'Project Milestone', 'Bonus / Incentive', 'Miscellaneous Income'];
const OUTFLOW_CATEGORIES = ['Salary & Wages', 'Ad Spend', 'Software / Tools', 'Rent & Utilities', 'Freelancer / Vendor', 'Travel & Logistics', 'Equipment', 'Taxes & Compliance', 'Miscellaneous Expense'];
const YEARS = ['ALL', 2024, 2025, 2026, 2027];

const isIncome = (t) => {
  const str = (t || '').toLowerCase();
  return str === 'inflow' || str === 'income' || str === 'balance' || str === 'expected_collection';
};

const isExpense = (t) => {
  const str = (t || '').toLowerCase();
  return str === 'outflow' || str === 'expense';
};

const formatCategory = (cat) => {
  if (!cat) return 'General';
  if (cat === 'expected_collection') return 'Client Retainer';
  if (cat === 'balance') return 'Bank Balance';
  return cat;
};

const FinancialLedger = () => {
  const { financialLedger = [], addFinancialEntry, updateFinancialEntry, deleteFinancialEntry } = useCRM();

  const nowMonth = new Date().getMonth() + 1;
  const nowYear = new Date().getFullYear();

  // Default to 'ALL' so user immediately sees all 155 entries, or allow filtering by specific month
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterYear, setFilterYear] = useState(nowYear);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQ, setSearchQ] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const emptyForm = { month: nowMonth, year: nowYear, type: 'Inflow', category: 'Client Retainer', particulars: '', amount: '', remarks: '' };
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => { setEditingEntry(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (entry) => { 
    setEditingEntry(entry); 
    setForm({ 
      ...entry,
      type: isIncome(entry.type) ? 'Inflow' : 'Outflow',
      category: formatCategory(entry.category)
    }); 
    setShowModal(true); 
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { 
      ...form, 
      type: form.type === 'Inflow' ? 'Income' : 'Expense',
      amount: parseFloat(form.amount) || 0 
    };
    if (editingEntry) updateFinancialEntry(editingEntry.id, payload);
    else addFinancialEntry(payload);
    setShowModal(false);
  };

  const filtered = useMemo(() => {
    return financialLedger.filter(e => {
      const matchMonth = filterMonth === 'ALL' || parseInt(e.month) === parseInt(filterMonth);
      const matchYear = filterYear === 'ALL' || parseInt(e.year) === parseInt(filterYear);
      
      const matchType = filterType === 'ALL' ||
        (filterType === 'Inflow' && isIncome(e.type)) ||
        (filterType === 'Outflow' && isExpense(e.type));

      const q = searchQ.toLowerCase();
      const matchSearch = !q || 
        (e.particulars || '').toLowerCase().includes(q) || 
        (e.category || '').toLowerCase().includes(q) ||
        (e.remarks || '').toLowerCase().includes(q) ||
        (e.paymentMode || '').toLowerCase().includes(q);

      return matchMonth && matchYear && matchType && matchSearch;
    });
  }, [financialLedger, filterMonth, filterYear, filterType, searchQ]);

  const totalInflow = filtered.filter(e => isIncome(e.type)).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const totalOutflow = filtered.filter(e => isExpense(e.type)).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const netBalance = totalInflow - totalOutflow;

  const categories = form.type === 'Inflow' ? INFLOW_CATEGORIES : OUTFLOW_CATEGORIES;

  const filterMonthLabel = filterMonth === 'ALL' ? 'All Months' : MONTHS[parseInt(filterMonth) - 1];
  const filterYearLabel = filterYear === 'ALL' ? 'All Years' : filterYear;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen style={{ width: '15px', height: '15px' }} /> Agency Finance & P&L
          </div>
          <h2 style={{ fontSize: '1.55rem', fontWeight: '900', margin: '4px 0 6px', background: 'linear-gradient(135deg, #fff 0%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Financial Ledger
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Track all agency income, client retainers, and expenses. Showing <strong>{filtered.length}</strong> of <strong>{financialLedger.length}</strong> total records.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => exportToCSV(financialLedger.map(e => ({ Month: e.month ? MONTHS[parseInt(e.month)-1] : '', Year: e.year, Type: isIncome(e.type) ? 'Inflow' : 'Outflow', Category: formatCategory(e.category), Particulars: e.particulars, Amount: e.amount, Remarks: e.remarks })), 'Financial_Ledger.csv')} className="btn btn-secondary" style={{ padding: '9px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download style={{ width: '14px', height: '14px' }} /> Export CSV
          </button>
          <button onClick={openAdd} className="btn gradient-btn-primary" style={{ padding: '9px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus style={{ width: '14px', height: '14px' }} /> Add Entry
          </button>
        </div>
      </div>

      {/* Month/Year Filter Controls */}
      <div className="glass-card" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar style={{ width: '15px', height: '15px', color: 'var(--text-muted)' }} />
            <select 
              className="form-input" 
              value={filterMonth} 
              onChange={e => setFilterMonth(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))} 
              style={{ width: '160px', fontWeight: '700' }}
            >
              <option value="ALL">📅 All Months ({financialLedger.length})</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          <select 
            className="form-input" 
            value={filterYear} 
            onChange={e => setFilterYear(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))} 
            style={{ width: '120px', fontWeight: '700' }}
          >
            <option value="ALL">All Years</option>
            {[2026, 2025, 2024, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {['ALL', 'Inflow', 'Outflow'].map(t => (
            <button 
              key={t} 
              onClick={() => setFilterType(t)} 
              style={{ 
                padding: '7px 14px', 
                borderRadius: '8px', 
                fontSize: '0.78rem', 
                fontWeight: filterType === t ? '700' : '500', 
                border: filterType === t ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent', 
                background: filterType === t ? 'rgba(99,102,241,0.2)' : 'transparent', 
                color: filterType === t ? '#818cf8' : 'var(--text-secondary)', 
                cursor: 'pointer' 
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search client, category, particulars..." 
            value={searchQ} 
            onChange={e => setSearchQ(e.target.value)} 
            className="form-input" 
            style={{ paddingLeft: '32px', width: '260px', fontSize: '0.8rem' }} 
          />
        </div>
      </div>

      {/* P&L Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #34d399' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp style={{ width: '20px', height: '20px', color: '#34d399' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>TOTAL INFLOW</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#34d399' }}>₹{totalInflow.toLocaleString()}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{filterMonthLabel} {filterYearLabel}</div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown style={{ width: '20px', height: '20px', color: '#f43f5e' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>TOTAL OUTFLOW</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#f43f5e' }}>₹{totalOutflow.toLocaleString()}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{filterMonthLabel} {filterYearLabel}</div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: `4px solid ${netBalance >= 0 ? '#10b981' : '#f43f5e'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: netBalance >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign style={{ width: '20px', height: '20px', color: netBalance >= 0 ? '#10b981' : '#f43f5e' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>NET BALANCE (P&L)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: netBalance >= 0 ? '#10b981' : '#f43f5e' }}>{netBalance >= 0 ? '+' : ''}₹{netBalance.toLocaleString()}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{netBalance >= 0 ? 'Profitable' : 'Loss'} period</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)' }}>
              {['Date / Month', 'Type', 'Category', 'Particulars / Client', 'Amount (₹)', 'Remarks', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No entries found for {filterMonthLabel} {filterYearLabel}. Select "All Months" or click "+ Add Entry" to log income or expense.
                </td>
              </tr>
            ) : filtered.map(entry => {
              const entryIsIncome = isIncome(entry.type);
              const monthName = entry.month ? MONTHS[parseInt(entry.month) - 1] : '';
              return (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-color)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    {monthName} {entry.year || ''}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', background: entryIsIncome ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.15)', color: entryIsIncome ? '#34d399' : '#f43f5e' }}>
                      {entryIsIncome ? 'Inflow' : 'Outflow'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600' }}>
                    {formatCategory(entry.category)}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {entry.particulars}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: '900', color: entryIsIncome ? '#34d399' : '#f43f5e' }}>
                    {entryIsIncome ? '+' : '-'}₹{parseFloat(entry.amount || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {entry.remarks || '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(entry)} style={{ background: 'rgba(129,140,248,0.15)', border: 'none', color: '#818cf8', padding: '5px', borderRadius: '6px', cursor: 'pointer' }} title="Edit"><Edit2 style={{ width: '13px', height: '13px' }} /></button>
                      <button onClick={() => deleteFinancialEntry(entry.id)} style={{ background: 'rgba(244,63,94,0.15)', border: 'none', color: '#f43f5e', padding: '5px', borderRadius: '6px', cursor: 'pointer' }} title="Delete"><Trash2 style={{ width: '13px', height: '13px' }} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>{editingEntry ? 'Edit Entry' : 'Add Ledger Entry'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X style={{ width: '20px', height: '20px' }} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Month</label>
                  <select className="form-input" value={form.month} onChange={e => setForm(f => ({ ...f, month: parseInt(e.target.value) }))}>
                    {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Year</label>
                  <select className="form-input" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))}>
                    {[2026, 2025, 2024, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, category: e.target.value === 'Inflow' ? INFLOW_CATEGORIES[0] : OUTFLOW_CATEGORIES[0] }))}>
                    <option>Inflow</option><option>Outflow</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Particulars / Description *</label>
                <input className="form-input" value={form.particulars} onChange={e => setForm(f => ({ ...f, particulars: e.target.value }))} required placeholder="e.g., Monthly retainer from Acme Corp" />
              </div>
              <div>
                <label className="form-label">Amount (₹) *</label>
                <input type="number" className="form-input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required min={0} placeholder="0" />
              </div>
              <div>
                <label className="form-label">Remarks</label>
                <textarea className="form-input" rows={2} value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional notes..." />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ padding: '9px 18px' }}>Cancel</button>
                <button type="submit" className="btn gradient-btn-primary" style={{ padding: '9px 22px' }}>{editingEntry ? 'Save Changes' : 'Add Entry'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialLedger;
