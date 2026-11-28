const LeadRepository = require('../repositories/LeadRepository');

class LeadService {
  async getLeadsByTenant(tenantId) {
    return LeadRepository.findByTenant(tenantId);
  }

  async createLead(tenantId, leadData) {
    const { name, company, email, phone, source, referredBy, assignedTo, notes, tags, status, score, potentialValue, projectCategory, projectType } = leadData;

    // Check duplicate email warning within the same tenant partition
    if (email) {
      const existing = await LeadRepository.findOne({
        where: { clientId: tenantId, email }
      });
      if (existing) {
        console.warn(`[Duplicate Match Warning] Lead with email ${email} already exists for tenant ${tenantId}.`);
      }
    }

    // Auto scoring logic: Base 50
    let computedScore = score || 50;
    const val = parseFloat(potentialValue) || 0;
    if (val > 100000) {
      computedScore += 25;
    }
    if (source === 'Website Forms' || source === 'Referral') {
      computedScore += 15;
    }
    if (email && (email.endsWith('.org') || email.endsWith('.edu') || email.endsWith('.com'))) {
      computedScore += 10;
    }

    const lead = await LeadRepository.create({
      id: `lead-${Date.now()}`,
      clientId: tenantId,
      name,
      company,
      email,
      phone,
      source: source || 'Website Forms',
      referredBy: referredBy || '',
      assignedTo,
      notes,
      tags: tags || [],
      status: status || 'Lead',
      score: Math.min(100, computedScore),
      potentialValue: val,
      projectCategory: projectCategory || (projectType && projectType !== 'One Time' && projectType !== 'Recurring' ? projectType : 'Software Development'),
      projectType: (projectType === 'One Time' || projectType === 'Recurring') ? projectType : 'One Time'
    });

    return lead;
  }

  async updateLead(tenantId, id, updateData) {
    const { status, name, company, email, phone, source, referredBy, assignedTo, notes, tags, potentialValue, projectCategory, projectType } = updateData;

    let lead = await LeadRepository.findOne({ where: { id, clientId: tenantId } });
    if (!lead) {
      // Try matching by id strip lead- prefix or email
      const cleanId = id.replace(/^lead-/, '');
      lead = await LeadRepository.findOne({ where: { id: cleanId, clientId: tenantId } }) ||
        await LeadRepository.findOne({ where: { email: cleanId, clientId: tenantId } });
    }

    if (!lead) {
      throw new Error("Lead not found.");
    }

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (name !== undefined) updates.name = name;
    if (company !== undefined) updates.company = company;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (source !== undefined) updates.source = source;
    if (referredBy !== undefined) updates.referredBy = referredBy;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (notes !== undefined) updates.notes = notes;
    if (tags !== undefined) updates.tags = tags;
    if (potentialValue !== undefined) updates.potentialValue = parseFloat(potentialValue);
    if (projectCategory !== undefined) updates.projectCategory = projectCategory;
    if (projectType !== undefined) updates.projectType = projectType;

    await lead.update(updates);
    return lead;
  }

  async deleteLead(tenantId, id) {
    let lead = await LeadRepository.findOne({ where: { id, clientId: tenantId } });
    if (!lead) {
      const cleanId = id.replace(/^lead-/, '');
      lead = await LeadRepository.findOne({ where: { id: cleanId, clientId: tenantId } }) ||
        await LeadRepository.findOne({ where: { email: cleanId, clientId: tenantId } });
    }

    if (!lead) {
      // If not found in DB, return true gracefully
      return true;
    }

    await lead.destroy();
    return true;
  }

  async batchCreateOrUpdate(tenantId, leadsList) {
    if (!Array.isArray(leadsList) || leadsList.length === 0) return { success: true, count: 0 };
    const now = new Date();
    const effectiveTenantId = tenantId || 'client-sanna';
    let processedCount = 0;

    for (let i = 0; i < leadsList.length; i++) {
      const l = leadsList[i];
      if (!l.name && !l.company) continue;

      const leadId = l.id || `lead-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`;
      const name = l.name || l.company || `Lead #${i + 1}`;
      const company = l.company || l.name || 'Enterprise Client';
      const email = l.email ? String(l.email).trim() : '';
      const phone = l.phone ? String(l.phone).trim() : '';
      const source = l.source || 'Excel Import';
      const referredBy = l.referredBy || l.referred_by || '';
      const assignedTo = l.assignedTo || 'Srinivas (Admin)';
      const notes = l.notes || '';
      const tags = Array.isArray(l.tags) ? l.tags : (l.tags ? [l.tags] : ['Imported']);
      const status = l.status || 'Lead Intake';
      const score = parseInt(l.score, 10) || 50;
      const potentialValue = parseFloat(l.potentialValue || l.value || 0) || 0;
      const projectCategory = l.projectCategory || 'Software Development';
      const projectType = l.projectType || 'One Time';

      try {
        const existing = await LeadRepository.findOne({
          where: { id: leadId }
        }) || (email ? await LeadRepository.findOne({ where: { clientId: effectiveTenantId, email } }) : null);

        if (existing) {
          await existing.update({
            name,
            company,
            email,
            phone,
            source,
            referredBy,
            assignedTo,
            notes,
            tags,
            status,
            score,
            potentialValue,
            projectCategory,
            projectType,
            updatedAt: now
          });
        } else {
          await LeadRepository.create({
            id: leadId,
            clientId: effectiveTenantId,
            name,
            company,
            email,
            phone,
            source,
            referredBy,
            assignedTo,
            notes,
            tags,
            status,
            score,
            potentialValue,
            projectCategory,
            projectType,
            createdAt: now,
            updatedAt: now
          });
        }
        processedCount++;
      } catch (err) {
        console.warn(`[Lead batch item warning] ${name} (${company}):`, err.message);
      }
    }

    return { success: true, count: processedCount };
  }
}

module.exports = new LeadService();
