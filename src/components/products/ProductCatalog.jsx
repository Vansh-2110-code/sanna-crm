import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import exportToCSV from '../../utils/csvExporter';
import {
  Package,
  Plus,
  Tag,
  DollarSign,
  Layers,
  FileText,
  AlertCircle,
  CheckCircle2,
  Boxes,
  Edit3,
  Trash2,
  X,
  FileSpreadsheet
} from 'lucide-react';

const ProductCatalog = () => {
  const { products = [], addProduct, updateProduct, deleteProduct } = useCRM();
  const [showModal, setShowModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Hardware Servers',
    unitPrice: 0,
    taxRatePercent: 0,
    stockCount: 0,
    variantsStr: '',
    description: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleExportCSV = () => {
    let csv = `SKU,Product Name,Category,Unit Price ($),Tax Rate %,Stock Count,Variants,Description\n`;
    filteredProducts.forEach(p => {
      csv += `"${p.sku}","${(p.name || '').replace(/"/g, '""')}","${p.category || ''}",${p.unitPrice || 0},${p.taxRatePercent || 0},${p.stockCount || 0},"${(p.variants || []).join('; ')}","${(p.description || '').replace(/"/g, '""')}"\n`;
    });

    exportToCSV(csv, `AstraCRM_Product_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setFormData({
      sku: '',
      name: '',
      category: 'Hardware Servers',
      unitPrice: 0,
      taxRatePercent: 0,
      stockCount: 0,
      variantsStr: '',
      description: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProductId(prod.id);
    setFormData({
      sku: prod.sku || '',
      name: prod.name || '',
      category: prod.category || 'Hardware Servers',
      unitPrice: prod.unitPrice || 0,
      taxRatePercent: prod.taxRatePercent || 0,
      stockCount: prod.stockCount || 0,
      variantsStr: (prod.variants || []).join(', '),
      description: prod.description || ''
    });
    setShowModal(true);
  };

  const handleDeleteClick = async (prod) => {
    if (window.confirm(`Are you sure you want to delete product "${prod.name}" (SKU: ${prod.sku}) from catalog?`)) {
      if (deleteProduct) {
        await deleteProduct(prod.id);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) return;

    const payload = {
      sku: formData.sku,
      name: formData.name,
      category: formData.category,
      unitPrice: parseFloat(formData.unitPrice) || 0,
      taxRatePercent: parseFloat(formData.taxRatePercent) || 0,
      stockCount: parseInt(formData.stockCount, 10) || 0,
      variants: formData.variantsStr.split(',').map(v => v.trim()).filter(Boolean),
      description: formData.description
    };

    if (editingProductId) {
      if (updateProduct) updateProduct(editingProductId, payload);
    } else {
      if (addProduct) addProduct(payload);
    }

    setShowModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '700', textTransform: 'uppercase' }}>
            Product Inventory & Pricing Matrix
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '4px 0' }}>
            Product Catalog ({products.length} SKUs)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Manage pricing tiers, variants, stock inventory alerts, tax percentages, and technical spec sheets.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ padding: '10px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet style={{ width: '16px', height: '16px' }} />
            <span>Export Catalog CSV</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="btn gradient-btn-primary"
            style={{ padding: '10px 18px', borderRadius: '10px' }}
          >
            <Plus style={{ width: '18px', height: '18px' }} />
            <span>Add Product SKU</span>
          </button>
        </div>
      </div>

      {/* Product Cards Grid */}
      {/* Search Input */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="form-input"
          style={{ width: '100%', maxWidth: '300px' }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredProducts.map(prod => (
          <div key={prod.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                  {prod.category}
                </span>
                <code style={{ background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '4px', color: '#60a5fa', fontSize: '0.75rem' }}>
                  {prod.sku}
                </code>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
                {prod.name}
              </h3>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
                {prod.description}
              </p>

              {/* Price & Tax */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: '10px', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>UNIT PRICE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#34d399' }}>
                    ${(prod.unitPrice || 0).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TAX RATE</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {prod.taxRatePercent || 18}% VAT/GST
                  </div>
                </div>
              </div>

              {/* Variants */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>VARIANTS AVAILABLE:</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {(prod.variants || ['Standard Edition']).map(v => (
                    <span key={v} className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{v}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Stock Level & Action Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                <Boxes style={{ width: '16px', height: '16px', color: (prod.stockCount || 0) < 50 ? '#fbbf24' : '#34d399' }} />
                <span style={{ fontWeight: '700', color: (prod.stockCount || 0) < 50 ? '#fbbf24' : '#34d399' }}>
                  {prod.stockCount || 0} in stock
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => handleOpenEditModal(prod)}
                  className="btn btn-secondary"
                  style={{ padding: '5px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Edit3 style={{ width: '13px', height: '13px' }} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteClick(prod)}
                  title="Delete Product"
                  style={{
                    background: 'rgba(244, 63, 94, 0.15)',
                    color: '#f43f5e',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    padding: '5px 8px',
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
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                  {editingProductId ? 'Edit Product SKU' : 'Add Product to Catalog'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Configure product SKUs, pricing matrix, default tax rates, and inventory stock counts.
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Quantum Array v5 Server"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="Hardware Servers">Hardware Servers</option>
                    <option value="SaaS Licenses">SaaS Licenses</option>
                    <option value="IoT Hardware">IoT Hardware</option>
                    <option value="Point of Sale">Point of Sale</option>
                    <option value="Software Services">Software Services</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Unit Price ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.taxRatePercent}
                    onChange={(e) => setFormData({ ...formData, taxRatePercent: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Stock Count</label>
                  <input
                    type="number"
                    value={formData.stockCount}
                    onChange={(e) => setFormData({ ...formData, stockCount: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Variants (comma separated)</label>
                <input
                  type="text"
                  value={formData.variantsStr}
                  onChange={(e) => setFormData({ ...formData, variantsStr: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn gradient-btn-primary">
                  {editingProductId ? 'Update Product SKU' : 'Save Product to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductCatalog;
