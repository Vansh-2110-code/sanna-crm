import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import { Package, Plus, Edit2, Trash2, X, Download, Search, Tag, Clock, DollarSign, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { exportToCSV } from '../../utils/csvExporter';

const SERVICE_CATEGORIES = ['Social Media Management', 'SEO & Content', 'Paid Media (PPC/Meta)', 'Web Design & Development', 'Video Production', 'Branding & Design', 'Email Marketing', 'Influencer Marketing', 'Analytics & Reporting', 'Other'];
const PRICE_TYPES = ['Monthly Retainer', 'Fixed Project', 'Per Post / Per Piece', 'Hourly Rate', 'Annual Contract'];
const DELIVERY_TIMEFRAMES = ['Same Day', '1-3 Days', '3-7 Days', '1-2 Weeks', '2-4 Weeks', '1-2 Months', 'Ongoing'];

const ServiceCatalogMIS = () => {
  const { serviceCatalog = [], addService, updateService, deleteService, toggleServiceStatus } = useCRM();

  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQ, setSearchQ] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const emptyForm = { serviceName: '', category: SERVICE_CATEGORIES[0], priceType: PRICE_TYPES[0], basePrice: '', deliveryTimeframe: '1-2 Weeks', description: '', status: 'Active' };
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => { setEditingService(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (svc) => { setEditingService(svc); setForm({ ...svc }); setShowModal(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, basePrice: parseFloat(form.basePrice) || 0 };
    if (editingService) updateService(editingService.id, payload);
    else addService(payload);
    setShowModal(false);
  };

  const filtered = useMemo(() => {
    return serviceCatalog.filter(svc => {
      const matchCat = filterCategory === 'ALL' || svc.category === filterCategory;
      const matchStatus = filterStatus === 'ALL' || svc.status === filterStatus;
      const q = searchQ.toLowerCase();
      const matchSearch = !q || (svc.serviceName || '').toLowerCase().includes(q) || (svc.category || '').toLowerCase().includes(q);
      return matchCat && matchStatus && matchSearch;
    });
  }, [serviceCatalog, filterCategory, filterStatus, searchQ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Package style={{ width: '14px', height: '14px' }} /> Agency Product & Service Registry
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: '900', margin: '4px 0 6px', color: 'var(--text-primary)' }}>
            Service Catalog & Rate Cards
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Standardized agency service line items, pricing tiers, delivery timeframes, and scopes for quotations & proposals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => exportToCSV(serviceCatalog, 'Service_Catalog.csv')} className="btn btn-secondary" style={{ padding: '9px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download style={{ width: '14px', height: '14px' }} /> Export CSV
          </button>
          <button onClick={openAdd} className="btn gradient-btn-primary" style={{ padding: '9px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus style={{ width: '14px', height: '14px' }} /> Add Service
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
        {[
          { label: 'Total Offerings', value: serviceCatalog.length, color: '#818cf8' },
          { label: 'Active Services', value: serviceCatalog.filter(s => s.status === 'Active').length, color: '#34d399' },
          { label: 'Inactive Services', value: serviceCatalog.filter(s => s.status === 'Inactive').length, color: '#f43f5e' },
          { label: 'Service Categories', value: new Set(serviceCatalog.map(s => s.category)).size, color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} className="saas-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</div>
            <div className="tabular-nums" style={{ fontSize: '1.6rem', fontWeight: '900', color: k.color, marginTop: '4px' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="saas-card" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'Active', 'Inactive'].map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: filterStatus === f ? '700' : '500',
                border: filterStatus === f ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                background: filterStatus === f ? 'rgba(99,102,241,0.18)' : 'transparent',
                color: filterStatus === f ? '#818cf8' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '32px', width: '220px', fontSize: '0.8rem', padding: '6px 12px 6px 32px' }}
          />
        </div>
      </div>

      {/* Services Grid with Sleek Neutral SaaS Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {filtered.length === 0 ? (
          <div className="saas-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1/-1' }}>
            No services found matching current filters. Click "+ Add Service" to add a new service.
          </div>
        ) : filtered.map(svc => (
          <div
            key={svc.id}
            className="saas-card-interactive"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
              background: 'var(--bg-card)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: '800', margin: 0, color: '#ffffff', lineHeight: 1.3 }}>{svc.serviceName}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <span className="status-pill status-pill-indigo" style={{ fontSize: '0.68rem' }}>
                      <Tag style={{ width: '10px', height: '10px' }} /> {svc.category}
                    </span>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => toggleServiceStatus(svc.id)}
                    className={`status-pill ${svc.status === 'Active' ? 'status-pill-emerald' : 'status-pill-rose'}`}
                    style={{ cursor: 'pointer' }}
                    title="Click to toggle status"
                  >
                    {svc.status === 'Active' ? '● Active' : '○ Inactive'}
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, minHeight: '36px' }}>
                {svc.description || 'Standard agency offering with SLA delivery support.'}
              </p>
            </div>

            {/* Price & Delivery Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Type', value: svc.priceType },
                { label: 'Base Rate', value: `$${parseFloat(svc.basePrice || 0).toLocaleString()}` },
                { label: 'Delivery', value: svc.deliveryTimeframe },
              ].map(d => (
                <div key={d.label} style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>{d.label}</div>
                  <div className="tabular-nums" style={{ fontSize: '0.8rem', fontWeight: '800', color: d.label === 'Base Rate' ? '#34d399' : 'var(--text-primary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.value}</div>
                </div>
              ))}
            </div>

            {/* Card Actions Footer */}
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <button
                onClick={() => openEdit(svc)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '7px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
              >
                <Edit2 style={{ width: '13px', height: '13px', color: '#818cf8' }} />
                <span>Edit Service</span>
              </button>
              <button
                onClick={() => deleteService(svc.id)}
                className="btn btn-danger"
                style={{ padding: '7px 10px' }}
                title="Delete Service"
              >
                <Trash2 style={{ width: '13px', height: '13px' }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>{editingService ? 'Edit Service Details' : 'Add New Agency Service'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X style={{ width: '20px', height: '20px' }} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Service Title *</label>
                <input className="form-input" value={form.serviceName} onChange={e => setForm(f => ({ ...f, serviceName: e.target.value }))} required placeholder="e.g., Social Media Management — 12 Reels/Month" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {SERVICE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Pricing Structure</label>
                  <select className="form-input" value={form.priceType} onChange={e => setForm(f => ({ ...f, priceType: e.target.value }))}>
                    {PRICE_TYPES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Base Rate ($ USD) *</label>
                  <input type="number" className="form-input tabular-nums" value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))} required min={0} placeholder="0" />
                </div>
                <div>
                  <label className="form-label">Delivery SLA</label>
                  <select className="form-input" value={form.deliveryTimeframe} onChange={e => setForm(f => ({ ...f, deliveryTimeframe: e.target.value }))}>
                    {DELIVERY_TIMEFRAMES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Deliverables Scope & Description</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the inclusions and deliverables for this service..." />
              </div>
              <div>
                <label className="form-label">Initial Status</label>
                <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option>Active</option><option>Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ padding: '9px 18px' }}>Cancel</button>
                <button type="submit" className="btn gradient-btn-primary" style={{ padding: '9px 22px' }}>{editingService ? 'Save Changes' : 'Add to Catalog'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceCatalogMIS;
