import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { Plus, Check, X } from 'lucide-react';

const DEFAULT_PROJECT_CATEGORIES = [
  'Software Development',
  'SaaS CRM Setup',
  'Digital Marketing',
  'Hardware Edge Server',
  'Consulting & Integration',
  'Custom Project'
];

const LeadFormModal = ({ onClose }) => {
  const { addLead, employees = [], currentUser } = useCRM();

  // Get list of sales reps/employees for the active organization
  const availableReps = employees.length > 0 
    ? employees.map(e => e.name)
    : [currentUser?.name || 'Unassigned'];
    
  // Ensure currentUser is included if not already in list
  if (currentUser?.name && !availableReps.includes(currentUser.name)) {
    availableReps.unshift(currentUser.name);
  }

  // Load custom project categories from localStorage if present
  const [projectCategories, setProjectCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('astra_custom_project_categories') || localStorage.getItem('astra_custom_project_types');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return Array.from(new Set([...DEFAULT_PROJECT_CATEGORIES, ...parsed]));
        }
      }
    } catch (err) {
      console.error('Error loading custom project categories', err);
    }
    return DEFAULT_PROJECT_CATEGORIES;
  });

  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [newProjectCategoryInput, setNewProjectCategoryInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    source: 'Website Forms',
    status: 'Lead Intake',
    projectCategory: 'Software Development',
    projectType: 'One Time', // 'One Time' | 'Recurring'
    productNeeded: '',
    potentialValue: 0,
    assignedTo: availableReps[0] || '',
    notes: '',
    tagsStr: ''
  });

  const handleAddCustomProjectCategory = (e) => {
    if (e) e.preventDefault();
    const trimmed = newProjectCategoryInput.trim();
    if (!trimmed) return;

    if (!projectCategories.includes(trimmed)) {
      const updated = [...projectCategories, trimmed];
      setProjectCategories(updated);
      try {
        const customOnly = updated.filter(t => !DEFAULT_PROJECT_CATEGORIES.includes(t));
        localStorage.setItem('astra_custom_project_categories', JSON.stringify(customOnly));
      } catch (err) {
        console.error('Error saving custom project categories', err);
      }
    }

    setFormData(prev => ({ ...prev, projectCategory: trimmed }));
    setNewProjectCategoryInput('');
    setIsAddingCustomCategory(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.company) return;

    addLead({
      name: formData.name,
      company: formData.company,
      email: formData.email,
      phone: formData.phone || '',
      source: formData.source,
      status: formData.status || 'Lead Intake',
      projectCategory: formData.projectCategory || 'Software Development',
      projectType: formData.projectType || 'One Time',
      productNeeded: formData.productNeeded || '',
      potentialValue: parseFloat(formData.potentialValue) || 0,
      assignedTo: formData.assignedTo,
      notes: formData.notes || '',
      tags: formData.tagsStr ? formData.tagsStr.split(',').map(t => t.trim()).filter(Boolean) : []
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '28px', maxWidth: '650px', width: '100%' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '6px' }}>Capture / Add New Product Lead</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Lead scoring algorithm automatically calculates engagement rank based on source and potential value.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            <div className="form-group">
              <label className="form-label">Contact Person Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Eleanor Vance"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Global Tech"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business Email</label>
              <input
                type="email"
                required
                placeholder="eleanor@apex.io"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                placeholder="+1 (555) 345-6789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lead Capture Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="form-select"
              >
                <option value="Website Forms">Website Forms</option>
                <option value="Social Media">Social Media</option>
                <option value="Email Campaigns">Email Campaigns</option>
                <option value="WhatsApp Campaign">WhatsApp Campaign</option>
                <option value="Referral">Referrals</option>
                <option value="Manual Entry">Manual Entry</option>
              </select>
            </div>

            {/* NEW Field: Project Type (One Time vs Recurring) */}
            <div className="form-group">
              <label className="form-label">Project Type</label>
              <select
                value={formData.projectType}
                onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                className="form-select"
              >
                <option value="One Time">One Time</option>
                <option value="Recurring">Recurring</option>
              </select>
            </div>

            {/* Renamed Field: Project Category Selector & Builder */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Project Category</label>
                {!isAddingCustomCategory && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomCategory(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60a5fa',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                  >
                    <Plus style={{ width: '14px', height: '14px' }} />
                    <span>Add Custom Project Category</span>
                  </button>
                )}
              </div>

              {isAddingCustomCategory ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. AI & ML Solutions, Mobile App, Cloud Ops..."
                    value={newProjectCategoryInput}
                    onChange={(e) => setNewProjectCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomProjectCategory();
                      } else if (e.key === 'Escape') {
                        setIsAddingCustomCategory(false);
                      }
                    }}
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomProjectCategory}
                    className="btn gradient-btn-primary"
                    style={{ padding: '8px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Check style={{ width: '14px', height: '14px' }} />
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustomCategory(false);
                      setNewProjectCategoryInput('');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <X style={{ width: '14px', height: '14px' }} />
                    <span>Cancel</span>
                  </button>
                </div>
              ) : (
                <select
                  value={formData.projectCategory}
                  onChange={(e) => {
                    if (e.target.value === '__ADD_NEW__') {
                      setIsAddingCustomCategory(true);
                    } else {
                      setFormData({ ...formData, projectCategory: e.target.value });
                    }
                  }}
                  className="form-select"
                >
                  {projectCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__ADD_NEW__" style={{ fontWeight: 'bold', color: '#60a5fa' }}>
                    + Add Custom Project Category...
                  </option>
                </select>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Product Needed / Interested</label>
              <input
                type="text"
                placeholder="e.g. Cloud Server, POS Hardware, AI Suite..."
                value={formData.productNeeded}
                onChange={(e) => setFormData({ ...formData, productNeeded: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Deal Value ($)</label>
              <input
                type="number"
                value={formData.potentialValue}
                onChange={(e) => setFormData({ ...formData, potentialValue: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stage Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-select"
              >
                <option value="Lead Intake">Lead Intake</option>
                <option value="Qualified">Qualified</option>
                <option value="Need Analysis">Need Analysis</option>
                <option value="Proposal Sent">Proposal Sent</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Sales Executive</label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="form-select"
              >
                {availableReps.map(repName => (
                  <option key={repName} value={repName}>{repName}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Tags (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. Healthcare, Web App, Urgent"
                value={formData.tagsStr}
                onChange={(e) => setFormData({ ...formData, tagsStr: e.target.value })}
                className="form-input"
              />
            </div>

          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Requirement & Activity Notes</label>
            <textarea
              rows="3"
              placeholder="Detail products interested in, urgency, cloud requirements..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-textarea"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn gradient-btn-primary"
            >
              Save Lead & Auto Score
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadFormModal;
