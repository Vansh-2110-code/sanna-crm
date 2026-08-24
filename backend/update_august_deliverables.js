const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'unified_sanna_crm.db');
const db = new sqlite3.Database(dbPath);

const augustDeliverables = [
  {
    id: 38,
    project_id: 57,
    project_name: 'Sampada',
    service: 'SMM & SEO',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-15',
    reels_planned: 6,
    posts_planned: 8,
    reels_delivered: 1,
    posts_delivered: 0,
    total_followers: '1.2k',
    views_reached: '8.4k',
    backlinks_created: '12',
    approval_pending_remarks: 'Creative batch in review with client.',
    other_remarks: ''
  },
  {
    id: 39,
    project_id: 9,
    project_name: 'Dr.Manjunath',
    service: 'SMM & Branding',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-10',
    reels_planned: 12,
    posts_planned: 8,
    reels_delivered: 0,
    posts_delivered: 1,
    total_followers: '2.4k',
    views_reached: '14.2k',
    backlinks_created: '8',
    approval_pending_remarks: 'Doctor video shoot scheduled.',
    other_remarks: ''
  },
  {
    id: 40,
    project_id: 58,
    project_name: 'avishkar home',
    service: 'SMM & Lead Gen',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-12',
    reels_planned: 6,
    posts_planned: 8,
    reels_delivered: 2,
    posts_delivered: 2,
    total_followers: '890',
    views_reached: '6.1k',
    backlinks_created: '5',
    approval_pending_remarks: 'Interior reels posted.',
    other_remarks: ''
  },
  {
    id: 41,
    project_id: 3,
    project_name: 'Tiffanies',
    service: 'SMM & Boosting',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-01',
    reels_planned: 6,
    posts_planned: 6,
    reels_delivered: 0,
    posts_delivered: 1,
    total_followers: '450',
    views_reached: '3.2k',
    backlinks_created: 'NA',
    approval_pending_remarks: 'New menu creatives prepared.',
    other_remarks: ''
  },
  {
    id: 42,
    project_id: 1,
    project_name: 'Nirmal',
    service: 'SMM & SEO',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-05',
    reels_planned: 8,
    posts_planned: 10,
    reels_delivered: 3,
    posts_delivered: 4,
    total_followers: '320',
    views_reached: '18.5k',
    backlinks_created: '15',
    approval_pending_remarks: 'Skin care reels in progress.',
    other_remarks: ''
  },
  {
    id: 43,
    project_id: 10,
    project_name: 'Sanna',
    service: 'Social Media Management',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-01',
    reels_planned: 4,
    posts_planned: 8,
    reels_delivered: 2,
    posts_delivered: 3,
    total_followers: '5.6k',
    views_reached: '32.1k',
    backlinks_created: '20',
    approval_pending_remarks: 'Brand revamp posts scheduled.',
    other_remarks: ''
  },
  {
    id: 44,
    project_id: 11,
    project_name: 'Diamond Pvd',
    service: 'SMM & Catalog',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-03',
    reels_planned: 2,
    posts_planned: 4,
    reels_delivered: 1,
    posts_delivered: 2,
    total_followers: '410',
    views_reached: '2.8k',
    backlinks_created: '4',
    approval_pending_remarks: 'Coating product showcase.',
    other_remarks: ''
  },
  {
    id: 45,
    project_id: 12,
    project_name: 'rainbow Pvd',
    service: 'SMM & Catalog',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-03',
    reels_planned: 2,
    posts_planned: 4,
    reels_delivered: 1,
    posts_delivered: 1,
    total_followers: '380',
    views_reached: '2.1k',
    backlinks_created: '4',
    approval_pending_remarks: 'Factory showcase reels.',
    other_remarks: ''
  },
  {
    id: 46,
    project_id: 13,
    project_name: 'galaxy PVD',
    service: 'SMM & Catalog',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-03',
    reels_planned: 2,
    posts_planned: 4,
    reels_delivered: 1,
    posts_delivered: 2,
    total_followers: '520',
    views_reached: '3.4k',
    backlinks_created: '6',
    approval_pending_remarks: 'Industrial PVD reels.',
    other_remarks: ''
  },
  {
    id: 47,
    project_id: 15,
    project_name: 'Hipapa',
    service: 'Short Video Reels',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-15',
    reels_planned: 8,
    posts_planned: 0,
    reels_delivered: 2,
    posts_delivered: 0,
    total_followers: '1.8k',
    views_reached: '12.0k',
    backlinks_created: 'NA',
    approval_pending_remarks: 'Reels editing in progress.',
    other_remarks: ''
  },
  {
    id: 48,
    project_id: 14,
    project_name: 'Alis',
    service: 'SMM & Creatives',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-15',
    reels_planned: 6,
    posts_planned: 8,
    reels_delivered: 2,
    posts_delivered: 2,
    total_followers: '760',
    views_reached: '5.2k',
    backlinks_created: '5',
    approval_pending_remarks: 'Product shoots scheduled.',
    other_remarks: ''
  },
  {
    id: 49,
    project_id: 68,
    project_name: 'Bharadwaj Enterprises',
    service: 'SMM & Meta Ads',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-07',
    reels_planned: 6,
    posts_planned: 8,
    reels_delivered: 1,
    posts_delivered: 1,
    total_followers: '620',
    views_reached: '4.8k',
    backlinks_created: '4',
    approval_pending_remarks: 'New campaign setup.',
    other_remarks: ''
  },
  {
    id: 52,
    project_id: 7,
    project_name: 'Ashirwada',
    service: 'SMM & SEO',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-10',
    reels_planned: 6,
    posts_planned: 6,
    reels_delivered: 2,
    posts_delivered: 2,
    total_followers: '420',
    views_reached: '115.0k',
    backlinks_created: '8',
    approval_pending_remarks: 'August promotional graphics live.',
    other_remarks: ''
  },
  {
    id: 53,
    project_id: 2,
    project_name: 'Jalmahal',
    service: 'SMM & Meta Ads',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-01',
    reels_planned: 6,
    posts_planned: 8,
    reels_delivered: 2,
    posts_delivered: 3,
    total_followers: '290',
    views_reached: '11.5k',
    backlinks_created: '6',
    approval_pending_remarks: 'August boosting active.',
    other_remarks: ''
  },
  {
    id: 54,
    project_id: 4,
    project_name: 'Matha',
    service: 'SMM & SEO',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-01',
    reels_planned: 10,
    posts_planned: 10,
    reels_delivered: 4,
    posts_delivered: 5,
    total_followers: '2.3k',
    views_reached: '22.0k',
    backlinks_created: '10',
    approval_pending_remarks: 'Festival campaigns in prep.',
    other_remarks: ''
  },
  {
    id: 55,
    project_id: 5,
    project_name: 'Greenpath',
    service: 'SMM & Creatives',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-15',
    reels_planned: 8,
    posts_planned: 8,
    reels_delivered: 2,
    posts_delivered: 2,
    total_followers: '7.9k',
    views_reached: '14.0k',
    backlinks_created: '12',
    approval_pending_remarks: 'Eco-stay reels in production.',
    other_remarks: ''
  },
  {
    id: 56,
    project_id: 6,
    project_name: 'Nova',
    service: 'SMM & Meta Ads',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-10',
    reels_planned: 6,
    posts_planned: 6,
    reels_delivered: 3,
    posts_delivered: 2,
    total_followers: '13.8k',
    views_reached: '190.0k',
    backlinks_created: '8',
    approval_pending_remarks: 'Shoot planned for 25th August.',
    other_remarks: ''
  },
  {
    id: 57,
    project_id: 8,
    project_name: 'Solution nest',
    service: 'SMM & Web',
    month: 8,
    year: 2026,
    delivery_date: '2026-08-10',
    reels_planned: 6,
    posts_planned: 8,
    reels_delivered: 1,
    posts_delivered: 2,
    total_followers: '510',
    views_reached: '4.2k',
    backlinks_created: '6',
    approval_pending_remarks: 'IT solutions content batch.',
    other_remarks: ''
  }
];

db.serialize(async () => {
  console.log('1. Deleting only August (month = 8) deliverables from unified_sanna_crm.db...');
  db.run('DELETE FROM project_deliverables WHERE month = 8 AND year = 2026', (err) => {
    if (err) console.error(err);

    console.log('2. Inserting updated August deliverables into unified_sanna_crm.db...');
    const stmt = db.prepare(`INSERT INTO project_deliverables (
      project_id, project_name, service, month, year, delivery_date,
      reels_planned, posts_planned, reels_delivered, posts_delivered,
      total_followers, views_reached, backlinks_created, approval_pending_remarks, other_remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    for (const d of augustDeliverables) {
      stmt.run([
        d.project_id, d.project_name, d.service, d.month, d.year, d.delivery_date,
        d.reels_planned, d.posts_planned, d.reels_delivered, d.posts_delivered,
        d.total_followers, d.views_reached, d.backlinks_created, d.approval_pending_remarks, d.other_remarks
      ]);
    }
    stmt.finalize();

    console.log('3. Updating src/data/realCrmData.js with proper August records without touching months 1-7...');
    db.all('SELECT * FROM project_deliverables ORDER BY month ASC, id ASC', (err2, allRows) => {
      if (err2) {
        console.error(err2);
        return;
      }

      const realDataPath = path.join(__dirname, '..', 'src', 'data', 'realCrmData.js');
      let content = fs.readFileSync(realDataPath, 'utf8');

      const mappedDeliverables = allRows.map(r => ({
        id: `deliv-${r.id}`,
        projectId: `deal-${r.project_id || r.id}`,
        projectName: r.project_name || '',
        clientName: r.project_name || '',
        type: ['Nirmal', 'Jalmahal', 'Tiffanies', 'Matha', 'Greenpath', 'Nova', 'Ashirwada', 'Solution nest', 'Dr.Manjunath', 'Sampada', 'avishkar home'].includes(r.project_name) ? 'DM' : 'Non-DM',
        month: r.month,
        year: r.year,
        deliveryDate: r.delivery_date || '15-08-2026',
        reelsPlanned: r.reels_planned || 0,
        reelsDelivered: r.reels_delivered || 0,
        postsPlanned: r.posts_planned || 0,
        postsDelivered: r.posts_delivered || 0,
        service: r.service || 'Social Media Management',
        totalFollowers: r.total_followers || '',
        followerGain: '',
        viewsReached: r.views_reached || '',
        viewGain: '',
        backlinksCreated: parseInt(r.backlinks_created, 10) || 0,
        keywordsInjected: 0,
        gmbPosition: '',
        adsSpend: '',
        leads: '',
        leadTicketSize: '',
        achievement: '',
        approvalPendingRemarks: r.approval_pending_remarks || '',
        otherRemarks: r.other_remarks || '',
        remarks: r.approval_pending_remarks || r.other_remarks || ''
      }));

      // Replace deliverables property in REAL_CRM_DATA
      const startIdx = content.indexOf('"deliverables": [');
      if (startIdx !== -1) {
        let endIdx = content.indexOf('],', startIdx);
        if (endIdx === -1) endIdx = content.indexOf(']', startIdx);
        const replacement = `"deliverables": ${JSON.stringify(mappedDeliverables, null, 2)}`;
        content = content.slice(0, startIdx) + replacement + content.slice(endIdx + 1);
        fs.writeFileSync(realDataPath, content, 'utf8');
        console.log(`✅ Successfully updated realCrmData.js with ${mappedDeliverables.length} total deliverables (including ${augustDeliverables.length} August records)!`);
      } else {
        console.warn('Could not find deliverables array in realCrmData.js');
      }

      db.close();
    });
  });
});
