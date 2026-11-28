const LeadService = require('../services/LeadService');
const { invalidateCache } = require('../middleware/cacheMiddleware');
const { emitToTenant } = require('../config/socket');

exports.getLeads = async (req, res) => {
  try {
    const tenantId = req.tenant?.id || 'client-sanna';
    let leads = await LeadService.getLeadsByTenant(tenantId);
    if ((!leads || leads.length === 0) && tenantId !== 'client-astra') {
      leads = await LeadService.getLeadsByTenant('client-sanna');
    }
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.batchLeads = async (req, res) => {
  try {
    const tenantId = req.tenant?.id || req.body.clientId || 'client-sanna';
    const leadsList = Array.isArray(req.body.leads) ? req.body.leads : (Array.isArray(req.body) ? req.body : []);
    const result = await LeadService.batchCreateOrUpdate(tenantId, leadsList);

    // Invalidate Redis Query Cache
    await invalidateCache(tenantId, 'leads').catch(() => {});

    // Emit live real-time event to all connected sockets in this tenant room
    emitToTenant(tenantId, 'leads_batch_updated', result);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createLead = async (req, res) => {
  try {
    const tenantId = req.tenant?.id || req.body.clientId || 'client-sanna';
    const lead = await LeadService.createLead(tenantId, req.body);
    
    // Invalidate Redis Query Cache
    await invalidateCache(tenantId, 'leads').catch(() => {});

    // Emit live real-time event to all connected sockets in this tenant room
    emitToTenant(tenantId, 'lead_created', lead);

    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const tenantId = req.tenant?.id || req.body.clientId || 'client-sanna';
    const { id } = req.params;
    const lead = await LeadService.updateLead(tenantId, id, req.body);

    // Invalidate Redis Query Cache
    await invalidateCache(tenantId, 'leads').catch(() => {});

    // Emit live real-time event to all connected sockets in this tenant room
    emitToTenant(tenantId, 'lead_updated', lead);

    res.json(lead);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const tenantId = req.tenant?.id || req.body.clientId || 'client-sanna';
    const { id } = req.params;
    await LeadService.deleteLead(tenantId, id);

    // Invalidate Redis Query Cache
    await invalidateCache(tenantId, 'leads').catch(() => {});

    // Emit live real-time event to all connected sockets in this tenant room
    emitToTenant(tenantId, 'lead_deleted', { id });

    res.json({ message: "Lead profile deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
