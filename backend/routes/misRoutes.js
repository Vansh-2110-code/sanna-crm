const express = require('express');
const router = express.Router();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'unified_sanna_crm.db');
const db = new sqlite3.Database(dbPath);

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

// 1. Projects & Clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await query('SELECT * FROM clients_projects ORDER BY id ASC');
    res.json(clients);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. Ad Spend Overview
router.get('/adspent/overview', async (req, res) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear(), 10);
    const month = parseInt(req.query.month || (new Date().getMonth() + 1), 10);

    const clients = await query('SELECT id, name, status FROM clients_projects ORDER BY id ASC');
    const reports = await query('SELECT * FROM ad_spent_reports WHERE year = ? AND month = ?', [year, month]);
    const reportMap = {};
    reports.forEach(r => { reportMap[r.project_id] = r; });

    const result = clients.map(c => {
      const r = reportMap[c.id] || {};
      return {
        id: r.id || `virtual-${c.id}`,
        project_id: c.id,
        project_name: c.name,
        date: r.date || '',
        amount_allotted: r.amount_allotted || 0,
        meta_ads_spent: r.meta_ads_spent || 0,
        insta_boosting_spent: r.insta_boosting_spent || 0,
        google_ads_spent: r.google_ads_spent || 0,
        linkedin_ads_spent: r.linkedin_ads_spent || 0,
        total_spent: r.total_spent || (parseFloat(r.meta_ads_spent || 0) + parseFloat(r.insta_boosting_spent || 0) + parseFloat(r.google_ads_spent || 0) + parseFloat(r.linkedin_ads_spent || 0)),
        mode_of_payment: r.mode_of_payment || '',
        remark: r.remark || '',
        month,
        year
      };
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. Save / Update Ad Spend Report
router.post('/adspent', async (req, res) => {
  try {
    const { project_id, month, year, date, amount_allotted, meta_ads_spent, insta_boosting_spent, google_ads_spent, linkedin_ads_spent, total_spent, mode_of_payment, remark } = req.body;
    const existing = await query('SELECT id FROM ad_spent_reports WHERE project_id = ? AND month = ? AND year = ?', [project_id, month, year]);

    if (existing.length > 0) {
      await run(
        `UPDATE ad_spent_reports SET date = ?, amount_allotted = ?, meta_ads_spent = ?, insta_boosting_spent = ?, google_ads_spent = ?, linkedin_ads_spent = ?, total_spent = ?, mode_of_payment = ?, remark = ? WHERE id = ?`,
        [date, amount_allotted, meta_ads_spent, insta_boosting_spent, google_ads_spent, linkedin_ads_spent, total_spent, mode_of_payment, remark, existing[0].id]
      );
      res.json({ status: 'updated', id: existing[0].id });
    } else {
      const client = await query('SELECT name FROM clients_projects WHERE id = ?', [project_id]);
      const clientName = client[0]?.name || `Client #${project_id}`;
      const insert = await run(
        `INSERT INTO ad_spent_reports (project_id, client_name, month, year, date, amount_allotted, meta_ads_spent, insta_boosting_spent, google_ads_spent, linkedin_ads_spent, total_spent, mode_of_payment, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [project_id, clientName, month, year, date, amount_allotted, meta_ads_spent, insta_boosting_spent, google_ads_spent, linkedin_ads_spent, total_spent, mode_of_payment, remark]
      );
      res.json({ status: 'created', id: insert.id });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4. Ad Spend Transactions
router.get('/adspent/transactions', async (req, res) => {
  try {
    const txs = await query('SELECT * FROM ad_spent_transactions ORDER BY date DESC');
    res.json(txs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/adspent/transactions', async (req, res) => {
  try {
    const { project_id, client_name, clientName, date, amount, purpose, mode_of_payment, paymentMode, month, year } = req.body;
    const finalName = client_name || clientName || 'Client Project';
    const finalMode = mode_of_payment || paymentMode || 'UPI';
    const insert = await run(
      `INSERT INTO ad_spent_transactions (project_id, client_name, date, amount, purpose, mode_of_payment, month, year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_id || 1, finalName, date || new Date().toISOString().split('T')[0], amount || 0, purpose || 'Ad Spend', finalMode, month || 8, year || 2026]
    );
    res.json({ status: 'created', id: insert.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/adspent/transactions/:id', async (req, res) => {
  try {
    await run('DELETE FROM ad_spent_transactions WHERE id = ?', [req.params.id]);
    res.json({ status: 'deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 5. Deliverables Matrix
router.get('/deliverables', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM project_deliverables ORDER BY month ASC, id ASC');
    const mapped = rows.map(r => ({
      id: String(r.id),
      projectId: String(r.project_id || r.id),
      projectName: r.project_name || '',
      clientName: r.project_name || '',
      type: r.type || 'Non-DM',
      service: r.service || 'Social Media Management',
      month: r.month || 8,
      year: r.year || 2026,
      deliveryDate: r.delivery_date || '',
      reelsPlanned: r.reels_planned || 0,
      postsPlanned: r.posts_planned || 0,
      reelsDelivered: r.reels_delivered || 0,
      postsDelivered: r.posts_delivered || 0,
      totalFollowers: r.total_followers || '',
      followerGain: r.follower_gain || '',
      viewsReached: r.views_reached || '',
      viewGain: r.view_gain || '',
      backlinksCreated: parseInt(r.backlinks_created, 10) || 0,
      keywordsInjected: parseInt(r.keywords_injected, 10) || 0,
      gmbPosition: r.gmb_position || '',
      adsSpend: r.amount_spend_ads ? String(r.amount_spend_ads) : '',
      leads: r.total_leads_generated ? String(r.total_leads_generated) : '',
      leadTicketSize: r.lead_ticket_size ? String(r.lead_ticket_size) : '',
      achievement: r.achievement || '',
      approvalPendingRemarks: r.approval_pending_remarks || '',
      otherRemarks: r.other_remarks || '',
      remarks: r.approval_pending_remarks || r.other_remarks || '',
      createdAt: r.created_at
    }));
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/deliverables', async (req, res) => {
  try {
    const {
      projectName,
      clientName,
      type,
      service,
      month,
      year,
      deliveryDate,
      delivery_date,
      reelsPlanned,
      postsPlanned,
      reelsDelivered,
      postsDelivered,
      totalFollowers,
      followerGain,
      viewsReached,
      viewGain,
      backlinksCreated,
      keywordsInjected,
      gmbPosition,
      adsSpend,
      leads,
      leadTicketSize,
      achievement,
      approvalPendingRemarks,
      otherRemarks,
      remarks
    } = req.body;

    const pName = projectName || clientName || 'Client Project';
    const insert = await run(
      `INSERT INTO project_deliverables (
        project_id, project_name, type, service, month, year, delivery_date,
        reels_planned, posts_planned, reels_delivered, posts_delivered,
        total_followers, follower_gain, views_reached, view_gain,
        backlinks_created, keywords_injected, gmb_position, amount_spend_ads,
        total_leads_generated, lead_ticket_size, achievement,
        approval_pending_remarks, other_remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        pName,
        type || 'Non-DM',
        service || 'Social Media Management',
        parseInt(month, 10) || 8,
        parseInt(year, 10) || 2026,
        deliveryDate || delivery_date || '',
        parseInt(reelsPlanned, 10) || 0,
        parseInt(postsPlanned, 10) || 0,
        parseInt(reelsDelivered, 10) || 0,
        parseInt(postsDelivered, 10) || 0,
        totalFollowers || '',
        followerGain || '',
        viewsReached || '',
        viewGain || '',
        String(backlinksCreated || 0),
        parseInt(keywordsInjected, 10) || 0,
        gmbPosition || '',
        parseFloat(adsSpend) || 0,
        parseInt(leads, 10) || 0,
        parseFloat(leadTicketSize) || 0,
        achievement || '',
        approvalPendingRemarks || remarks || '',
        otherRemarks || ''
      ]
    );

    res.status(201).json({
      id: String(insert.id),
      projectName: pName,
      clientName: pName,
      type: type || 'Non-DM',
      service: service || 'Social Media Management',
      month: parseInt(month, 10) || 8,
      year: parseInt(year, 10) || 2026,
      deliveryDate: deliveryDate || delivery_date || '',
      reelsPlanned: parseInt(reelsPlanned, 10) || 0,
      postsPlanned: parseInt(postsPlanned, 10) || 0,
      reelsDelivered: parseInt(reelsDelivered, 10) || 0,
      postsDelivered: parseInt(postsDelivered, 10) || 0,
      totalFollowers: totalFollowers || '',
      followerGain: followerGain || '',
      viewsReached: viewsReached || '',
      viewGain: viewGain || '',
      backlinksCreated: parseInt(backlinksCreated, 10) || 0,
      keywordsInjected: parseInt(keywordsInjected, 10) || 0,
      gmbPosition: gmbPosition || '',
      adsSpend: adsSpend || '',
      leads: leads || '',
      leadTicketSize: leadTicketSize || '',
      achievement: achievement || '',
      approvalPendingRemarks: approvalPendingRemarks || remarks || '',
      otherRemarks: otherRemarks || '',
      remarks: approvalPendingRemarks || remarks || otherRemarks || ''
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/deliverables/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('deliv-', ''), 10) || req.params.id;
    let existing = await get('SELECT * FROM project_deliverables WHERE id = ?', [rawId]);

    const {
      projectName,
      clientName,
      service,
      month,
      year,
      deliveryDate,
      delivery_date,
      reelsPlanned,
      postsPlanned,
      reelsDelivered,
      postsDelivered,
      totalFollowers,
      followerGain,
      viewsReached,
      viewGain,
      backlinksCreated,
      keywordsInjected,
      gmbPosition,
      adsSpend,
      leads,
      leadTicketSize,
      achievement,
      approvalPendingRemarks,
      otherRemarks,
      remarks,
      type
    } = req.body;

    const pName = (projectName !== undefined ? projectName : (clientName !== undefined ? clientName : (existing ? existing.project_name : 'Client Project'))) || 'Client Project';
    const srv = service !== undefined ? service : (existing ? existing.service : 'Social Media Management');
    const m = month !== undefined ? (parseInt(month, 10) || (existing ? existing.month : 8)) : (existing ? existing.month : 8);
    const y = year !== undefined ? (parseInt(year, 10) || (existing ? existing.year : 2026)) : (existing ? existing.year : 2026);
    const delDate = deliveryDate !== undefined ? deliveryDate : (delivery_date !== undefined ? delivery_date : (existing ? existing.delivery_date : ''));
    const rPlanned = reelsPlanned !== undefined ? parseInt(reelsPlanned, 10) : (existing ? existing.reels_planned : 0);
    const pPlanned = postsPlanned !== undefined ? parseInt(postsPlanned, 10) : (existing ? existing.posts_planned : 0);
    const rDelivered = reelsDelivered !== undefined ? parseInt(reelsDelivered, 10) : (existing ? existing.reels_delivered : 0);
    const pDelivered = postsDelivered !== undefined ? parseInt(postsDelivered, 10) : (existing ? existing.posts_delivered : 0);
    const tFollowers = totalFollowers !== undefined ? totalFollowers : (existing ? existing.total_followers : '');
    const fGain = followerGain !== undefined ? followerGain : (existing ? existing.follower_gain : '');
    const vReached = viewsReached !== undefined ? viewsReached : (existing ? existing.views_reached : '');
    const vGain = viewGain !== undefined ? viewGain : (existing ? existing.view_gain : '');
    const bCreated = backlinksCreated !== undefined ? String(backlinksCreated) : (existing ? existing.backlinks_created : '0');
    const kInjected = keywordsInjected !== undefined ? parseInt(keywordsInjected, 10) : (existing ? existing.keywords_injected : 0);
    const gmbPos = gmbPosition !== undefined ? gmbPosition : (existing ? existing.gmb_position : '');
    const aSpend = adsSpend !== undefined ? parseFloat(adsSpend) || 0 : (existing ? existing.amount_spend_ads : 0);
    const tLeads = leads !== undefined ? parseInt(leads, 10) || 0 : (existing ? existing.total_leads_generated : 0);
    const lTicket = leadTicketSize !== undefined ? parseFloat(leadTicketSize) || 0 : (existing ? existing.lead_ticket_size : 0);
    const ach = achievement !== undefined ? achievement : (existing ? existing.achievement : '');
    const aRemarks = approvalPendingRemarks !== undefined ? approvalPendingRemarks : (remarks !== undefined ? remarks : (existing ? existing.approval_pending_remarks : ''));
    const oRemarks = otherRemarks !== undefined ? otherRemarks : (existing ? existing.other_remarks : '');
    const rType = type !== undefined ? type : (existing ? (existing.type || 'Non-DM') : 'Non-DM');

    let savedId = rawId;

    if (existing) {
      await run(
        `UPDATE project_deliverables SET
          project_name = ?, type = ?, service = ?, month = ?, year = ?, delivery_date = ?,
          reels_planned = ?, posts_planned = ?, reels_delivered = ?, posts_delivered = ?,
          total_followers = ?, follower_gain = ?, views_reached = ?, view_gain = ?,
          backlinks_created = ?, keywords_injected = ?, gmb_position = ?, amount_spend_ads = ?,
          total_leads_generated = ?, lead_ticket_size = ?, achievement = ?,
          approval_pending_remarks = ?, other_remarks = ?
         WHERE id = ?`,
        [
          pName,
          rType,
          srv || 'Social Media Management',
          parseInt(m, 10) || 8,
          parseInt(y, 10) || 2026,
          delDate || '',
          parseInt(rPlanned, 10) || 0,
          parseInt(pPlanned, 10) || 0,
          parseInt(rDelivered, 10) || 0,
          parseInt(pDelivered, 10) || 0,
          tFollowers || '',
          fGain || '',
          vReached || '',
          vGain || '',
          String(bCreated || 0),
          parseInt(kInjected, 10) || 0,
          gmbPos || '',
          aSpend || 0,
          tLeads || 0,
          lTicket || 0,
          ach || '',
          aRemarks || '',
          oRemarks || '',
          rawId
        ]
      );
    } else {
      // Upsert new entry if not existing
      const insert = await run(
        `INSERT INTO project_deliverables (
          project_id, project_name, type, service, month, year, delivery_date,
          reels_planned, posts_planned, reels_delivered, posts_delivered,
          total_followers, follower_gain, views_reached, view_gain,
          backlinks_created, keywords_injected, gmb_position, amount_spend_ads,
          total_leads_generated, lead_ticket_size, achievement,
          approval_pending_remarks, other_remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          1,
          pName,
          rType,
          srv || 'Social Media Management',
          parseInt(m, 10) || 8,
          parseInt(y, 10) || 2026,
          delDate || '',
          parseInt(rPlanned, 10) || 0,
          parseInt(pPlanned, 10) || 0,
          parseInt(rDelivered, 10) || 0,
          parseInt(pDelivered, 10) || 0,
          tFollowers || '',
          fGain || '',
          vReached || '',
          vGain || '',
          String(bCreated || 0),
          parseInt(kInjected, 10) || 0,
          gmbPos || '',
          aSpend || 0,
          tLeads || 0,
          lTicket || 0,
          ach || '',
          aRemarks || '',
          oRemarks || ''
        ]
      );
      savedId = insert.id;
    }

    res.json({
      id: String(savedId),
      projectId: String(existing ? (existing.project_id || savedId) : savedId),
      projectName: pName,
      clientName: pName,
      type: rType,
      service: srv,
      month: parseInt(m, 10),
      year: parseInt(y, 10),
      deliveryDate: delDate,
      reelsPlanned: parseInt(rPlanned, 10) || 0,
      postsPlanned: parseInt(pPlanned, 10) || 0,
      reelsDelivered: parseInt(rDelivered, 10) || 0,
      postsDelivered: parseInt(pDelivered, 10) || 0,
      totalFollowers: tFollowers,
      followerGain: fGain,
      viewsReached: vReached,
      viewGain: vGain,
      backlinksCreated: parseInt(bCreated, 10) || 0,
      keywordsInjected: parseInt(kInjected, 10) || 0,
      gmbPosition: gmbPos,
      adsSpend: aSpend ? String(aSpend) : '',
      leads: tLeads ? String(tLeads) : '',
      leadTicketSize: lTicket ? String(lTicket) : '',
      achievement: ach,
      approvalPendingRemarks: aRemarks,
      otherRemarks: oRemarks,
      remarks: aRemarks || oRemarks
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/deliverables/:id', async (req, res) => {
  try {
    const rawId = parseInt(req.params.id.replace('deliv-', ''), 10) || req.params.id;
    await run('DELETE FROM project_deliverables WHERE id = ?', [rawId]);
    res.json({ status: 'deleted', id: req.params.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 6. Holiday Posts
router.get('/holidays', async (req, res) => {
  try {
    const holidays = await query('SELECT * FROM holiday_posts ORDER BY id ASC');
    res.json(holidays);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/holidays', async (req, res) => {
  try {
    const { holidayName, date, clientProject, creativeStatus, captionStatus, approvalStatus, scheduledPosted } = req.body;
    const insert = await run(
      `INSERT INTO holiday_posts (holiday_name, date, client_project, creative_status, caption_status, approval_status, scheduled_posted)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [holidayName, date, clientProject, creativeStatus || 'In Progress', captionStatus || 'Draft', approvalStatus || 'Pending', scheduledPosted || '']
    );
    res.status(201).json({ id: String(insert.id), ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/holidays/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('hol-', ''), 10) || req.params.id;
    const { holidayName, date, clientProject, creativeStatus, captionStatus, approvalStatus, scheduledPosted } = req.body;
    await run(
      `UPDATE holiday_posts SET
        holiday_name = COALESCE(?, holiday_name),
        date = COALESCE(?, date),
        client_project = COALESCE(?, client_project),
        creative_status = COALESCE(?, creative_status),
        caption_status = COALESCE(?, caption_status),
        approval_status = COALESCE(?, approval_status),
        scheduled_posted = COALESCE(?, scheduled_posted)
      WHERE id = ?`,
      [holidayName, date, clientProject, creativeStatus, captionStatus, approvalStatus, scheduledPosted, rawId]
    );
    res.json({ id: String(rawId), ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/holidays/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('hol-', ''), 10) || req.params.id;
    await run('DELETE FROM holiday_posts WHERE id = ?', [rawId]);
    res.json({ status: 'deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 7. Video Editor Assignments
router.get('/editors', async (req, res) => {
  try {
    const editors = await query('SELECT * FROM editor_assignments ORDER BY id ASC');
    res.json(editors);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/editors', async (req, res) => {
  try {
    const { editorName, email, clientProject, taskDescription, assignedDate, submissionDate, status, amount, paymentStatus, deliverableUrl } = req.body;
    const insert = await run(
      `INSERT INTO editor_assignments (editor_name, email, client_project, task_description, assignment_date, submission_date, status, amount, payment_status, deliverable_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [editorName, email, clientProject, taskDescription, assignedDate, submissionDate, status || 'In Progress', amount || 0, paymentStatus || 'Pending', deliverableUrl || '']
    );
    res.status(201).json({ id: String(insert.id), ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/editors/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('edit-', ''), 10) || req.params.id;
    const { editorName, email, clientProject, taskDescription, assignedDate, submissionDate, status, amount, paymentStatus, deliverableUrl } = req.body;
    await run(
      `UPDATE editor_assignments SET
        editor_name = COALESCE(?, editor_name),
        email = COALESCE(?, email),
        client_project = COALESCE(?, client_project),
        task_description = COALESCE(?, task_description),
        assignment_date = COALESCE(?, assignment_date),
        submission_date = COALESCE(?, submission_date),
        status = COALESCE(?, status),
        amount = COALESCE(?, amount),
        payment_status = COALESCE(?, payment_status),
        deliverable_url = COALESCE(?, deliverable_url)
      WHERE id = ?`,
      [editorName, email, clientProject, taskDescription, assignedDate, submissionDate, status, amount, paymentStatus, deliverableUrl, rawId]
    );
    res.json({ id: String(rawId), ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/editors/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('edit-', ''), 10) || req.params.id;
    await run('DELETE FROM editor_assignments WHERE id = ?', [rawId]);
    res.json({ status: 'deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 8. Server Details & Credentials
router.get('/servers', async (req, res) => {
  try {
    const rawServers = await query('SELECT * FROM server_details ORDER BY id ASC');
    const rawCreds = await query('SELECT * FROM project_credentials ORDER BY id ASC');

    const servers = rawServers.map(s => ({
      id: `srv-${s.id}`,
      rawId: s.id,
      clientProject: s.client_name || s.server_name || 'Client Server',
      clientName: s.client_name || s.server_name || 'Client Server',
      serverName: s.server_name || s.client_name || 'Production Server',
      serverProvider: s.server_provider || (s.server_name?.toLowerCase().includes('hostinger') ? 'Hostinger' : (s.server_name?.toLowerCase().includes('hostpapa') ? 'Hostpapa' : (s.server_name?.toLowerCase().includes('hapih') ? 'Hapih Host' : 'Cloud VPS'))),
      serverType: s.server_type || 'Cloud VPS Node',
      region: s.region || 'Asia Pacific (IN)',
      ipAddress: s.server_ip || '93.127.206.213',
      serverIp: s.server_ip || '93.127.206.213',
      osType: s.os_info || 'Ubuntu 22.04 LTS',
      osInfo: s.os_info || 'Ubuntu 22.04 LTS',
      username: s.ssh_username || 'root',
      sshUsername: s.ssh_username || 'root',
      password: s.ssh_password || '',
      sshPassword: s.ssh_password || '',
      sshPort: String(s.ssh_port || 22),
      sslExpiryDate: s.renewal_date || '2026-12-31',
      renewalDate: s.renewal_date || '2026-12-31',
      annualHostingCost: (parseFloat(s.monthly_cost) || 0) * 12 || (parseFloat(s.monthly_cost) || 12000),
      monthlyCost: parseFloat(s.monthly_cost) || 1000,
      status: 'Active',
      cpanelUrl: s.cpanel_url || '',
      cpanelUsername: s.cpanel_username || '',
      cpanelPassword: s.cpanel_password || '',
      domainsHosted: s.domains_hosted || s.client_name || '',
      remarks: s.remarks || 'Production Web & Database Node'
    }));

    const credentials = rawCreds.map(c => ({
      id: `cred-${c.id}`,
      rawId: c.id,
      projectId: String(c.project_id || ''),
      clientName: c.client_name || `Project #${c.project_id}`,
      platform: c.platform || 'General Access',
      username: c.username || '',
      password: c.password || '',
      loginUrl: c.link || c.login_url || 'https://mis.sannainnovations.com',
      notes: c.remarks || c.notes || ''
    }));

    res.json({ servers, credentials });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/credentials', async (req, res) => {
  try {
    const rawCreds = await query('SELECT * FROM project_credentials ORDER BY id ASC');
    const credentials = rawCreds.map(c => ({
      id: `cred-${c.id}`,
      rawId: c.id,
      projectId: String(c.project_id || ''),
      clientName: c.client_name || `Project #${c.project_id}`,
      platform: c.platform || 'General Access',
      username: c.username || '',
      password: c.password || '',
      loginUrl: c.link || c.login_url || 'https://mis.sannainnovations.com',
      notes: c.remarks || c.notes || ''
    }));
    res.json(credentials);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/servers', async (req, res) => {
  try {
    const { clientProject, clientName, serverProvider, ipAddress, serverIp, region, osType, osInfo, sshPort, username, sshUsername, password, sshPassword, monthlyCost, annualHostingCost, remarks } = req.body;
    const client = clientProject || clientName || 'New Client Server';
    const ip = ipAddress || serverIp || '127.0.0.1';
    const user = username || sshUsername || 'root';
    const pass = password || sshPassword || '';
    const os = osType || osInfo || 'Ubuntu 22.04 LTS';
    const provider = serverProvider || 'Hostinger';
    const cost = parseFloat(monthlyCost) || (parseFloat(annualHostingCost) ? parseFloat(annualHostingCost) / 12 : 0);

    const insert = await run(
      `INSERT INTO server_details (server_name, client_name, server_ip, ssh_username, ssh_password, ssh_port, server_provider, os_info, monthly_cost, renewal_date, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [provider, client, ip, user, pass, String(sshPort || 22), provider, os, cost, '2026-12-31', remarks || 'Production Node']
    );
    res.status(201).json({ id: `srv-${insert.id}`, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/servers/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('srv-', ''), 10) || req.params.id;
    const { clientProject, clientName, serverProvider, ipAddress, serverIp, osType, osInfo, sshPort, username, sshUsername, password, sshPassword, monthlyCost, annualHostingCost, remarks } = req.body;
    const client = clientProject || clientName;
    const ip = ipAddress || serverIp;
    const user = username || sshUsername;
    const pass = password || sshPassword;
    const os = osType || osInfo;
    const cost = monthlyCost !== undefined ? parseFloat(monthlyCost) : (annualHostingCost !== undefined ? parseFloat(annualHostingCost) / 12 : undefined);

    await run(
      `UPDATE server_details SET
        client_name = COALESCE(?, client_name),
        server_ip = COALESCE(?, server_ip),
        ssh_username = COALESCE(?, ssh_username),
        ssh_password = COALESCE(?, ssh_password),
        ssh_port = COALESCE(?, ssh_port),
        server_provider = COALESCE(?, server_provider),
        os_info = COALESCE(?, os_info),
        monthly_cost = COALESCE(?, monthly_cost),
        remarks = COALESCE(?, remarks)
      WHERE id = ?`,
      [client, ip, user, pass, sshPort ? String(sshPort) : null, serverProvider, os, cost, remarks, rawId]
    );
    res.json({ id: `srv-${rawId}`, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/servers/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('srv-', ''), 10) || req.params.id;
    await run('DELETE FROM server_details WHERE id = ?', [rawId]);
    res.json({ status: 'deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/credentials', async (req, res) => {
  try {
    const { clientName, platform, username, password, loginUrl, notes } = req.body;
    const insert = await run(
      `INSERT INTO project_credentials (client_name, platform, username, password, link, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [clientName || 'General Project', platform || 'General Access', username || '', password || '', loginUrl || '', notes || '']
    );
    res.status(201).json({ id: `cred-${insert.id}`, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/credentials/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('cred-', ''), 10) || req.params.id;
    const { clientName, platform, username, password, loginUrl, notes } = req.body;
    await run(
      `UPDATE project_credentials SET
        client_name = COALESCE(?, client_name),
        platform = COALESCE(?, platform),
        username = COALESCE(?, username),
        password = COALESCE(?, password),
        link = COALESCE(?, link),
        remarks = COALESCE(?, remarks)
      WHERE id = ?`,
      [clientName, platform, username, password, loginUrl, notes, rawId]
    );
    res.json({ id: `cred-${rawId}`, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/credentials/:id', async (req, res) => {
  try {
    const rawId = parseInt(String(req.params.id).replace('cred-', ''), 10) || req.params.id;
    await run('DELETE FROM project_credentials WHERE id = ?', [rawId]);
    res.json({ status: 'deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 9. Interns & Attendance
router.get('/interns', async (req, res) => {
  try {
    const users = await query('SELECT * FROM users WHERE is_intern = 1 ORDER BY username ASC');
    const logs = await query('SELECT * FROM intern_work_logs ORDER BY date DESC');
    res.json({ interns: users, logs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/sessions', async (req, res) => {
  try {
    const sessions = await query("SELECT * FROM sessions ORDER BY CASE WHEN status = 'Active' THEN 0 ELSE 1 END, datetime(login_time) DESC, id DESC LIMIT 500");
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const getISTTimeString = (date = new Date()) => {
  return date.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

router.post('/sessions/punch-in', async (req, res) => {
  try {
    const { userId, userName, userEmail, role, staffType, workMode, ipAddress, device, location } = req.body;
    const now = new Date();
    const sessionId = `SES-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const punchInTime = req.body.punchInTime || getISTTimeString(now);
    const loginTime = now.toISOString();

    // Mark previous active sessions for this user as Logged Out
    await run(
      `UPDATE sessions SET status = 'Logged Out', punch_out_time = ? WHERE (user_id = ? OR email = ?) AND status = 'Active'`,
      [punchInTime, userId, userEmail]
    );

    // Insert new active punch-in session
    await run(
      `INSERT INTO sessions (id, user_id, user_name, email, role, staff_type, login_time, punch_in_time, status, work_mode, ip_address, device, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?)`,
      [
        sessionId,
        userId || 'EMP-SANNA-001',
        userName || 'Staff Member',
        userEmail || '',
        role || 'Employee',
        staffType || (role?.includes('Intern') ? 'Intern' : 'Employee'),
        loginTime,
        punchInTime,
        workMode || 'Office Campus',
        ipAddress || '103.21.144.92 (Office Fiber)',
        device || 'Workstation Browser',
        location || 'Hyderabad, India (Asia/Kolkata)'
      ]
    );

    res.json({
      success: true,
      session: {
        id: sessionId,
        userId,
        userName,
        userEmail,
        role,
        loginTime,
        punchInTime,
        status: 'Active',
        workMode: workMode || 'Office Campus'
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/sessions/punch-out', async (req, res) => {
  try {
    const { userId, userEmail } = req.body;
    const now = new Date();
    const punchOutTime = req.body.punchOutTime || getISTTimeString(now);
    const dateStr = now.toISOString().split('T')[0];

    const result = await run(
      `UPDATE sessions SET status = 'Logged Out', punch_out_time = ? WHERE (user_id = ? OR email = ?) AND status = 'Active'`,
      [punchOutTime, userId, userEmail]
    );

    res.json({
      success: true,
      punchOutTime,
      updatedCount: result.changes
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/sessions', async (req, res) => {
  try {
    const { id, userId, userName, userEmail, role, staffType, loginTime, punchInTime, punchOutTime, ipAddress, device, location, status, workMode } = req.body;
    const now = new Date();
    const sessionId = id || `SES-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    await run(
      `INSERT INTO sessions (id, user_id, user_name, email, role, staff_type, login_time, punch_in_time, punch_out_time, ip_address, device, location, status, work_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        userId,
        userName,
        userEmail,
        role,
        staffType || 'Employee',
        loginTime || now.toISOString(),
        punchInTime || '09:00 AM',
        punchOutTime || null,
        ipAddress || '103.21.144.92',
        device || 'Desktop',
        location || 'Hyderabad, India',
        status || 'Active',
        workMode || 'Office Campus'
      ]
    );
    res.json({ success: true, id: sessionId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { punchInTime, punchOutTime, status, workMode, location, device } = req.body;
    const finalPunchOut = status === 'Active' ? null : (punchOutTime !== undefined ? punchOutTime : null);
    
    let loginTimeUpdate = null;
    if (punchInTime) {
      const existing = await query("SELECT login_time FROM sessions WHERE id = ?", [id]);
      if (existing.length > 0 && existing[0].login_time) {
        const sDate = new Date(existing[0].login_time);
        const inMins = parseTimeToMinutes(punchInTime);
        sDate.setHours(Math.floor(inMins / 60), inMins % 60, 0, 0);
        loginTimeUpdate = sDate.toISOString();
      }
    }

    await run(
      `UPDATE sessions SET
         punch_in_time = COALESCE(?, punch_in_time),
         punch_out_time = ?,
         status = COALESCE(?, status),
         work_mode = COALESCE(?, work_mode),
         location = COALESCE(?, location),
         device = COALESCE(?, device),
         login_time = COALESCE(?, login_time)
       WHERE id = ?`,
      [punchInTime, finalPunchOut, status, workMode, location, device, loginTimeUpdate, id]
    );
    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await run(`DELETE FROM sessions WHERE id = ?`, [id]);
    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Club / Merge two session logs together and add their times
router.post('/sessions/club', async (req, res) => {
  try {
    const { session1Id, session2Id, mergedSession } = req.body;
    if (!session1Id || !session2Id) {
      return res.status(400).json({ error: 'Both session1Id and session2Id are required to club logs.' });
    }

    // Delete session 2
    await run("DELETE FROM sessions WHERE id = ?", [session2Id]);

    // Update session 1 with combined details
    if (mergedSession) {
      const finalPunchOut = mergedSession.status === 'Active' ? null : (mergedSession.punchOutTime || getISTTimeString(new Date()));
      await run(`
        UPDATE sessions SET
          punch_in_time = ?,
          punch_out_time = ?,
          status = ?,
          work_mode = ?
        WHERE id = ?
      `, [
        mergedSession.punchInTime || '09:00 AM',
        finalPunchOut,
        mergedSession.status || 'Active',
        mergedSession.workMode || 'Office Campus',
        session1Id
      ]);
    }

    const updated = await query("SELECT * FROM sessions WHERE id = ?", [session1Id]);
    res.json({ success: true, message: 'Sessions successfully clubbed together.', session: updated[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/attendance', async (req, res) => {
  try {
    const attendance = await query('SELECT * FROM attendance ORDER BY date DESC');
    res.json(attendance);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 10. Content Tasks / Content Calendar
router.get('/content-tasks', async (req, res) => {
  try {
    const tasks = await query('SELECT * FROM content_tasks ORDER BY scheduled_date ASC, id ASC');
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/content-tasks', async (req, res) => {
  try {
    const { client_name, clientName, title, task_name, platform, content_type, scheduled_date, dueDate, status, assigned_to, caption, drive_link } = req.body;
    const finalClient = client_name || clientName || 'Sanna Innovations';
    const finalTitle = title || task_name || 'Brand Post';
    const finalDate = scheduled_date || dueDate || new Date().toISOString().split('T')[0];
    const insert = await run(
      `INSERT INTO content_tasks (client_name, title, platform, content_type, scheduled_date, status, assigned_to, caption, drive_link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [finalClient, finalTitle, platform || 'Instagram', content_type || 'Carousel', finalDate, status || 'Scheduled', assigned_to || 'Creative Team', caption || '', drive_link || '']
    );
    res.status(201).json({ id: insert.id, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/content-tasks/:id', async (req, res) => {
  try {
    await run('DELETE FROM content_tasks WHERE id = ?', [req.params.id]);
    res.json({ status: 'deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 11. Financial Records
router.get('/finance', async (req, res) => {
  try {
    const records = await query('SELECT * FROM financial_records ORDER BY date DESC, id DESC');
    res.json(records);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/finance', async (req, res) => {
  try {
    const { date, month, year, type, category, particulars, amount, description, payment_mode, reference_no, status, remarks } = req.body;
    const d = date || new Date().toISOString().split('T')[0];
    const insert = await run(
      `INSERT INTO financial_records (date, month, year, type, category, particulars, amount, description, payment_mode, reference_no, status, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d, month || 8, year || 2026, type || 'Income', category || 'Client Retainer', particulars || description || 'Client payment', parseFloat(amount) || 0, description || particulars || '', payment_mode || 'Bank Transfer', reference_no || `TXN-${Date.now()}`, status || 'Cleared', remarks || '']
    );
    res.status(201).json({ id: insert.id, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 12. Invoices
router.get('/invoices', async (req, res) => {
  try {
    const invoices = await query('SELECT * FROM invoices ORDER BY invoice_date DESC, id DESC');
    const items = await query('SELECT * FROM invoice_items ORDER BY invoice_id ASC');
    const itemsByInvoice = {};
    items.forEach(it => {
      if (!itemsByInvoice[it.invoice_id]) itemsByInvoice[it.invoice_id] = [];
      itemsByInvoice[it.invoice_id].push(it);
    });
    const result = invoices.map(inv => ({
      ...inv,
      items: itemsByInvoice[inv.id] || []
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 13. Quotations
router.get('/quotations', async (req, res) => {
  try {
    const quotes = await query('SELECT * FROM quotations ORDER BY quote_date DESC, id DESC');
    const items = await query('SELECT * FROM quotation_items ORDER BY quotation_id ASC');
    const itemsByQuote = {};
    items.forEach(it => {
      if (!itemsByQuote[it.quotation_id]) itemsByQuote[it.quotation_id] = [];
      itemsByQuote[it.quotation_id].push(it);
    });
    const result = quotes.map(q => ({
      ...q,
      items: itemsByQuote[q.id] || []
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 14. Employee Performances
router.get('/performances', async (req, res) => {
  try {
    const performances = await query('SELECT * FROM employee_performances ORDER BY year DESC, month DESC, id DESC');
    res.json(performances);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 15. Daily Work Logs & Standup Diary (Synced across Staff & Admin Portal)
db.run(`
  CREATE TABLE IF NOT EXISTS daily_work_logs (
    id TEXT PRIMARY KEY,
    staff_id TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    staff_email TEXT,
    staff_type TEXT DEFAULT 'Employee',
    date TEXT NOT NULL,
    work_mode TEXT DEFAULT 'Office Campus',
    hours_spent REAL DEFAULT 8.0,
    project TEXT,
    task_title TEXT NOT NULL,
    deliverable_notes TEXT,
    learnings TEXT,
    blockers TEXT,
    tomorrow_plan TEXT,
    proof_url TEXT,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Completed',
    approval_status TEXT DEFAULT 'Pending',
    manager_feedback TEXT,
    manager_rating REAL DEFAULT 5,
    reviewed_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

router.get('/daily-tasks', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM daily_work_logs ORDER BY date DESC, created_at DESC, id DESC');
    const mapped = rows.map(r => ({
      id: r.id,
      staffId: r.staff_id,
      staffName: r.staff_name,
      staffEmail: r.staff_email,
      staffType: r.staff_type || 'Employee',
      date: r.date,
      workMode: r.work_mode || 'Office Campus',
      hoursSpent: parseFloat(r.hours_spent) || 8.0,
      project: r.project || 'Astra Core CRM',
      taskTitle: r.task_title,
      deliverableNotes: r.deliverable_notes,
      learnings: r.learnings || '',
      blockers: r.blockers || '',
      tomorrowPlan: r.tomorrow_plan || '',
      proofUrl: r.proof_url || '',
      priority: r.priority || 'Medium',
      status: r.status || 'Completed',
      approvalStatus: r.approval_status || 'Pending',
      managerFeedback: r.manager_feedback || '',
      managerRating: parseFloat(r.manager_rating) || 5,
      reviewedBy: r.reviewed_by || '',
      createdAt: r.created_at
    }));
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/daily-tasks', async (req, res) => {
  try {
    const {
      id,
      staffId,
      staffName,
      staffEmail,
      staffType,
      date,
      workMode,
      hoursSpent,
      project,
      taskTitle,
      deliverableNotes,
      learnings,
      blockers,
      tomorrowPlan,
      proofUrl,
      priority,
      status,
      approvalStatus,
      managerFeedback,
      managerRating,
      reviewedBy
    } = req.body;

    const taskId = id || `DT-${new Date().getFullYear()}-${Date.now()}`;
    const taskDate = date || new Date().toISOString().split('T')[0];

    await run(
      `INSERT OR REPLACE INTO daily_work_logs (
        id, staff_id, staff_name, staff_email, staff_type, date, work_mode,
        hours_spent, project, task_title, deliverable_notes, learnings,
        blockers, tomorrow_plan, proof_url, priority, status, approval_status,
        manager_feedback, manager_rating, reviewed_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        taskId,
        staffId || 'EMP-SANNA-001',
        staffName || 'Staff Member',
        staffEmail || '',
        staffType || 'Employee',
        taskDate,
        workMode || 'Office Campus',
        parseFloat(hoursSpent) || 8.0,
        project || 'Astra Core CRM',
        taskTitle || 'Daily Activity & Task Deliverables',
        deliverableNotes || '',
        learnings || '',
        blockers || '',
        tomorrowPlan || '',
        proofUrl || '',
        priority || 'Medium',
        status || 'Completed',
        approvalStatus || 'Pending',
        managerFeedback || '',
        parseFloat(managerRating) || 5,
        reviewedBy || ''
      ]
    );

    res.status(201).json({
      success: true,
      task: {
        id: taskId,
        staffId,
        staffName,
        staffEmail,
        staffType,
        date: taskDate,
        workMode,
        hoursSpent: parseFloat(hoursSpent) || 8.0,
        project,
        taskTitle,
        deliverableNotes,
        learnings,
        blockers,
        tomorrowPlan,
        proofUrl,
        priority: priority || 'Medium',
        status: status || 'Completed',
        approvalStatus: approvalStatus || 'Pending',
        managerFeedback,
        managerRating,
        reviewedBy
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/daily-tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      approvalStatus,
      managerFeedback,
      managerRating,
      reviewedBy,
      hoursSpent,
      deliverableNotes,
      taskTitle,
      status
    } = req.body;

    const existing = await get('SELECT * FROM daily_work_logs WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Task log not found.' });
    }

    await run(
      `UPDATE daily_work_logs SET
        approval_status = COALESCE(?, approval_status),
        manager_feedback = COALESCE(?, manager_feedback),
        manager_rating = COALESCE(?, manager_rating),
        reviewed_by = COALESCE(?, reviewed_by),
        hours_spent = COALESCE(?, hours_spent),
        deliverable_notes = COALESCE(?, deliverable_notes),
        task_title = COALESCE(?, task_title),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        approvalStatus !== undefined ? approvalStatus : null,
        managerFeedback !== undefined ? managerFeedback : null,
        managerRating !== undefined ? parseFloat(managerRating) : null,
        reviewedBy !== undefined ? reviewedBy : null,
        hoursSpent !== undefined ? parseFloat(hoursSpent) : null,
        deliverableNotes !== undefined ? deliverableNotes : null,
        taskTitle !== undefined ? taskTitle : null,
        status !== undefined ? status : null,
        id
      ]
    );

    res.json({ success: true, message: 'Work log updated successfully.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/daily-tasks/:id', async (req, res) => {
  try {
    await run('DELETE FROM daily_work_logs WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Work log deleted successfully.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
