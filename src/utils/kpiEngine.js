/**
 * Sanna CRM - Official KPI & Performance Scoring Engine
 * Codifies benchmarks, weightages, and scoring formulas derived from
 * the Sanna Innovations Roles & KPI Reference Guide.
 */

export const ROLE_BENCHMARKS = {
  'Boss & Main Sales Head': {
    role: 'Boss & Main Sales Head',
    department: 'Sales & Executive Leadership',
    aliases: ['boss', 'sales head', 'director', 'ceo', 'sales director', 'main sales head', 'boss n main sales head'],
    kpis: [
      { id: 'kpi_1', name: 'Monthly Revenue Goal ($)', target: 50000, unit: '$', weight: 0.35, lowerIsBetter: false },
      { id: 'kpi_2', name: 'Lead-to-Close Rate (%)', target: 25, unit: '%', weight: 0.25, lowerIsBetter: false },
      { id: 'kpi_3', name: 'Client Retention Rate (%)', target: 92, unit: '%', weight: 0.20, lowerIsBetter: false },
      { id: 'kpi_4', name: 'Avg Deal Size ($)', target: 7500, unit: '$', weight: 0.20, lowerIsBetter: false }
    ]
  },
  'Project Lead Expert': {
    role: 'Project Lead Expert',
    department: 'Engineering & Delivery',
    aliases: ['project lead', 'tech lead', 'delivery lead', 'engineering lead', 'project manager'],
    kpis: [
      { id: 'kpi_1', name: 'On-Time Delivery Rate (%)', target: 95, unit: '%', weight: 0.35, lowerIsBetter: false },
      { id: 'kpi_2', name: 'Code Quality Score (1-10)', target: 9.0, unit: '/10', weight: 0.25, lowerIsBetter: false },
      { id: 'kpi_3', name: 'Intern Productivity Lift (%)', target: 85, unit: '%', weight: 0.20, lowerIsBetter: false },
      { id: 'kpi_4', name: 'Client CSAT Rating (1-10)', target: 9.2, unit: '/10', weight: 0.20, lowerIsBetter: false }
    ]
  },
  'Software Developer Intern': {
    role: 'Software Developer Intern',
    department: 'Engineering & Development',
    aliases: ['software intern', 'developer intern', 'software developer intern / trainee', 'engineering intern', 'dev intern', 'swe intern'],
    kpis: [
      { id: 'kpi_1', name: 'PRs Merged per Month', target: 20, unit: 'PRs', weight: 0.30, lowerIsBetter: false },
      { id: 'kpi_2', name: 'Bug Fix Turnaround (hrs)', target: 12, unit: 'hrs', weight: 0.25, lowerIsBetter: true },
      { id: 'kpi_3', name: 'PR Approval First-Try (%)', target: 80, unit: '%', weight: 0.25, lowerIsBetter: false },
      { id: 'kpi_4', name: 'Task Completion Speed (%)', target: 90, unit: '%', weight: 0.20, lowerIsBetter: false }
    ]
  },
  'Web Hosting Specialist': {
    role: 'Web Hosting Specialist',
    department: 'Infrastructure & DevOps',
    aliases: ['hosting specialist', 'devops', 'cloud engineer', 'web hosting', 'sysadmin'],
    kpis: [
      { id: 'kpi_1', name: 'Server Uptime (%)', target: 99.9, unit: '%', weight: 0.40, lowerIsBetter: false },
      { id: 'kpi_2', name: 'Avg Server TTFB (ms)', target: 180, unit: 'ms', weight: 0.25, lowerIsBetter: true },
      { id: 'kpi_3', name: 'Mean Time to Repair (mins)', target: 15, unit: 'mins', weight: 0.20, lowerIsBetter: true },
      { id: 'kpi_4', name: 'Backup Verification Rate (%)', target: 100, unit: '%', weight: 0.15, lowerIsBetter: false }
    ]
  },
  'Domain Hosting Specialist': {
    role: 'Domain Hosting Specialist',
    department: 'Infrastructure & IT Services',
    aliases: ['domain hosting', 'dns specialist', 'domain specialist', 'it infrastructure'],
    kpis: [
      { id: 'kpi_1', name: 'Zero Expiration SLA (%)', target: 100, unit: '%', weight: 0.35, lowerIsBetter: false },
      { id: 'kpi_2', name: 'DNS Request SLA (hrs)', target: 2, unit: 'hrs', weight: 0.25, lowerIsBetter: true },
      { id: 'kpi_3', name: 'DMARC/SPF Pass Rate (%)', target: 99, unit: '%', weight: 0.20, lowerIsBetter: false },
      { id: 'kpi_4', name: 'SSL Certificate Validity (%)', target: 100, unit: '%', weight: 0.20, lowerIsBetter: false }
    ]
  },
  'Performance Marketer': {
    role: 'Performance Marketer',
    department: 'Digital Marketing & Growth',
    aliases: ['digital marketer', 'performance marketer', 'media buyer', 'growth marketer', 'ad specialist'],
    kpis: [
      { id: 'kpi_1', name: 'Return On Ad Spend (ROAS)', target: 4.0, unit: 'x', weight: 0.35, lowerIsBetter: false },
      { id: 'kpi_2', name: 'Cost Per Lead ($)', target: 25, unit: '$', weight: 0.25, lowerIsBetter: true },
      { id: 'kpi_3', name: 'Monthly Qualified Leads', target: 150, unit: 'leads', weight: 0.25, lowerIsBetter: false },
      { id: 'kpi_4', name: 'Avg Ad Click-Through Rate (%)', target: 3.5, unit: '%', weight: 0.15, lowerIsBetter: false }
    ]
  },
  'Graphic Designer': {
    role: 'Graphic Designer',
    department: 'Creative Design & Branding',
    aliases: ['sr. graphic designer', 'graphic designer', 'ui designer', 'brand designer', 'creative designer'],
    kpis: [
      { id: 'kpi_1', name: 'Design Assets Delivered / Month', target: 40, unit: 'assets', weight: 0.35, lowerIsBetter: false },
      { id: 'kpi_2', name: 'Avg Revision Rounds per Project', target: 2, unit: 'rounds', weight: 0.25, lowerIsBetter: true },
      { id: 'kpi_3', name: 'Client Approval Rate (%)', target: 90, unit: '%', weight: 0.25, lowerIsBetter: false },
      { id: 'kpi_4', name: 'Design Quality Score (1-10)', target: 9.0, unit: '/10', weight: 0.15, lowerIsBetter: false }
    ]
  },
  'Video Editor': {
    role: 'Video Editor',
    department: 'Creative Media & Production',
    aliases: ['video editor', 'motion designer', 'video creator', 'media editor'],
    kpis: [
      { id: 'kpi_1', name: 'Videos Delivered On-Time / Month', target: 12, unit: 'videos', weight: 0.35, lowerIsBetter: false },
      { id: 'kpi_2', name: 'Avg Edit Revision Rounds', target: 2, unit: 'rounds', weight: 0.25, lowerIsBetter: true },
      { id: 'kpi_3', name: 'Client Satisfaction Score (1-10)', target: 9.0, unit: '/10', weight: 0.25, lowerIsBetter: false },
      { id: 'kpi_4', name: 'Technical Quality Score (1-10)', target: 9.0, unit: '/10', weight: 0.15, lowerIsBetter: false }
    ]
  },
  'Digital Marketing Intern': {
    role: 'Digital Marketing Intern',
    department: 'Digital Marketing & Brand',
    aliases: ['marketing intern', 'social media intern', 'content intern', 'growth intern'],
    kpis: [
      { id: 'kpi_1', name: 'Posts Published / Month', target: 30, unit: 'posts', weight: 0.30, lowerIsBetter: false },
      { id: 'kpi_2', name: 'Avg Engagement Rate (%)', target: 6.0, unit: '%', weight: 0.25, lowerIsBetter: false },
      { id: 'kpi_3', name: 'Monthly Audience Growth', target: 500, unit: 'followers', weight: 0.25, lowerIsBetter: false },
      { id: 'kpi_4', name: 'Organic Leads Inquiries', target: 20, unit: 'leads', weight: 0.20, lowerIsBetter: false }
    ]
  },
  'Chief Creative Officer (CCO)': {
    role: 'Chief Creative Officer (CCO)',
    department: 'Creative Operations & Leadership',
    aliases: ['cco', 'chief creative officer', 'creative head', 'operations head'],
    kpis: [
      { id: 'kpi_1', name: 'Content Pipeline Completion (%)', target: 95, unit: '%', weight: 0.35, lowerIsBetter: false },
      { id: 'kpi_2', name: 'Creative Brief Turnaround (days)', target: 2, unit: 'days', weight: 0.25, lowerIsBetter: true },
      { id: 'kpi_3', name: 'Brand Consistency Score (1-10)', target: 9.0, unit: '/10', weight: 0.20, lowerIsBetter: false },
      { id: 'kpi_4', name: 'Team Collaboration Rating (1-10)', target: 9.0, unit: '/10', weight: 0.20, lowerIsBetter: false }
    ]
  },
  'Web Developer': {
    role: 'Web Developer',
    department: 'Engineering & Web Solutions',
    aliases: ['web developer', 'software developer', 'fullstack developer', 'frontend developer', 'backend developer'],
    kpis: [
      { id: 'kpi_1', name: 'Websites Delivered On-Time (%)', target: 95, unit: '%', weight: 0.35, lowerIsBetter: false },
      { id: 'kpi_2', name: 'Code Quality Score (1-10)', target: 9.0, unit: '/10', weight: 0.25, lowerIsBetter: false },
      { id: 'kpi_3', name: 'Bug-Free Delivery Rate (%)', target: 90, unit: '%', weight: 0.25, lowerIsBetter: false },
      { id: 'kpi_4', name: 'Client CSAT Rating (1-10)', target: 9.0, unit: '/10', weight: 0.15, lowerIsBetter: false }
    ]
  }
};

/**
 * Match a job title string against registered role benchmarks
 */
export function resolveRoleBenchmark(roleString) {
  if (!roleString) return ROLE_BENCHMARKS['Software Developer Intern'];
  const clean = String(roleString).trim().toLowerCase();

  // 1. Exact match on benchmark key
  for (const [key, bm] of Object.entries(ROLE_BENCHMARKS)) {
    if (clean === key.toLowerCase()) return bm;
  }

  // 2. Exact match on aliases
  for (const [key, bm] of Object.entries(ROLE_BENCHMARKS)) {
    if (bm.aliases && bm.aliases.some(alias => clean === alias.toLowerCase())) {
      return bm;
    }
  }

  // 3. Substring match on aliases
  for (const [key, bm] of Object.entries(ROLE_BENCHMARKS)) {
    if (bm.aliases && bm.aliases.some(alias => clean.includes(alias.toLowerCase()) || alias.toLowerCase().includes(clean))) {
      return bm;
    }
  }

  // 4. Fallback match on distinctive words
  for (const [key, bm] of Object.entries(ROLE_BENCHMARKS)) {
    const words = key.toLowerCase().split(/\s+/);
    if (words.some(w => w.length > 3 && clean.includes(w))) {
      return bm;
    }
  }

  return ROLE_BENCHMARKS['Software Developer Intern'];
}

/**
 * Parse any numeric input string cleanly (handles '$58,500', '2.5hrs', '98%', '2-3 rounds')
 */
export function parseCleanNumber(val, defaultVal = 0) {
  if (val === null || val === undefined || val === '') return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;

  const str = String(val).trim();

  // Handle fractions like '8/10' or '6/10' (e.g. ratings out of 10)
  const fracMatch = str.match(/^([\d.]+)\s*\/\s*([\d.]+)$/);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      return (num / den) * 10;
    }
  }

  // Handle ranges like '2-3' or '2 - 3' -> average = 2.5
  const rangeMatch = str.match(/^([\d.]+)\s*[-–—]\s*([\d.]+)$/);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    if (!isNaN(low) && !isNaN(high)) return (low + high) / 2;
  }

  // Strip currency symbols, commas, percent, letters
  const cleaned = str.replace(/[$,€£₹%a-zA-Z]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? defaultVal : num;
}

/**
 * Calculate KPI achievement percentage
 */
function calculateKpiAchievement(achieved, target, lowerIsBetter = false) {
  if (!target || target <= 0) return 100;

  // Auto-normalize Excel decimal percentages:
  // If target benchmark is >= 10 (e.g. 80%, 90%) and achieved is a decimal <= 2.0 (e.g. 0.96 or 0.88),
  // it was stored as an Excel percentage decimal; scale it up to its actual percentage (96%, 88%).
  let normAchieved = achieved;
  if (target >= 10 && achieved > 0 && achieved <= 2.0) {
    normAchieved = achieved * 100;
  }

  if (lowerIsBetter) {
    // If lower is better (e.g. 2.5hrs vs 12hrs target):
    // If achieved <= target, reward up to 150%
    if (normAchieved <= 0) return 150;
    const ratio = (target / normAchieved) * 100;
    return Math.min(150, Math.max(0, Math.round(ratio)));
  } else {
    const ratio = (normAchieved / target) * 100;
    return Math.min(150, Math.max(0, Math.round(ratio)));
  }
}

/**
 * Core Evaluation Calculator
 * Computes composite performance score (0 - 100% and 0 - 10 scale)
 */
export function calculateEmployeePerformance(record, customBenchmark = null) {
  const benchmark = customBenchmark || resolveRoleBenchmark(record.role || record.roleDesignation);
  const kpis = benchmark.kpis || [];

  // Parse up to 4 KPI values from record
  const kpiResults = kpis.map((k, idx) => {
    // Try multiple possible field names from sheet
    const rawVal = record[`kpi_${idx + 1}`] ??
                   record[`kpi${idx + 1}`] ??
                   record[`kpi${idx + 1}Value`] ??
                   record[k.name] ??
                   (record.kpis && record.kpis[idx]);

    const achieved = parseCleanNumber(rawVal, k.target);
    const achievement = calculateKpiAchievement(achieved, k.target, k.lowerIsBetter);
    return {
      ...k,
      achieved,
      achievement,
      weightedContribution: Math.round(achievement * k.weight * 10) / 10
    };
  });

  // Calculate Weighted Role KPI Achievement Score (0 - 100%)
  const weightedKpiScore = kpiResults.reduce((acc, curr) => acc + (curr.achievement * curr.weight), 0);

  // Parse Competency Sliders/Inputs (Task Velocity, Quality, Peer, Attendance)
  let rawVelocity = parseCleanNumber(record.taskCompletionRate ?? record.taskVelocity, 90);
  // Auto-normalize Excel percentage decimal: 1.18 -> 118%, 0.96 -> 96%
  if (rawVelocity > 0 && rawVelocity <= 2.0) {
    rawVelocity = Math.round(rawVelocity * 1000) / 10;
  } else if (rawVelocity > 2.0 && rawVelocity <= 10.0) {
    // If entered as 8 out of 10, scale to 80%
    rawVelocity = rawVelocity * 10;
  }
  const taskVelocity = Math.min(150, Math.max(0, rawVelocity));

  const workQuality = Math.min(10, Math.max(0, parseCleanNumber(record.qualityScore ?? record.workQuality, 9)));
  const peerReview = Math.min(10, Math.max(0, parseCleanNumber(record.peerReview ?? record.peerCollaboration, 9)));
  const attendance = Math.min(10, Math.max(0, parseCleanNumber(record.attendance ?? record.attendancePunctuality, 10)));

  // Master Composite Formula:
  // 40% Role KPIs + 25% Task Velocity + 15% Quality (10x) + 10% Peer Review (10x) + 10% Attendance (10x)
  const compositePercentage = (weightedKpiScore * 0.40) +
                              (taskVelocity * 0.25) +
                              ((workQuality * 10) * 0.15) +
                              ((peerReview * 10) * 0.10) +
                              ((attendance * 10) * 0.10);

  const finalPercentage = Math.min(115, Math.max(10, Math.round(compositePercentage * 10) / 10));
  const scoreOutOf10 = Math.min(10, Math.max(1, Math.round((finalPercentage / 10) * 10) / 10));

  // Determine Performance Tier & Badging
  let tier = 'Silver AI Tier • Meets Expectations';
  let tierGrade = 'Meets Expectations';
  let badgeColor = '#f59e0b';
  let tierIcon = '⭐';
  let ribbon = 'Consistent Contributor';

  if (finalPercentage >= 98.0) {
    tier = 'Platinum AI Tier • Outstanding Legend';
    tierGrade = 'Outstanding (Top Performer)';
    badgeColor = '#10b981';
    tierIcon = '🌟';
    ribbon = 'Top Performer • EOTM Contender';
  } else if (finalPercentage >= 90.0) {
    tier = 'Gold AI Tier • High Impact Leader';
    tierGrade = 'Exceeds Expectations';
    badgeColor = '#3b82f6';
    tierIcon = '🏆';
    ribbon = 'High Impact Leader';
  } else if (finalPercentage >= 78.0) {
    tier = 'Silver AI Tier • Meets Expectations';
    tierGrade = 'Meets Expectations';
    badgeColor = '#8b5cf6';
    tierIcon = '⭐';
    ribbon = 'Core Pillar';
  } else {
    tier = 'Bronze AI Tier • Needs Improvement';
    tierGrade = 'Needs Improvement';
    badgeColor = '#f43f5e';
    tierIcon = '⚠️';
    ribbon = 'Action Plan Required';
  }

  // Generate automated AI performance accomplishment summary
  const topKpi = [...kpiResults].sort((a, b) => b.achievement - a.achievement)[0];
  const empName = record.employeeName || record.name || 'Team Member';
  const roleName = benchmark.role;

  let aiSummary = `${empName} delivered exceptional performance in the ${roleName} role.`;
  if (topKpi) {
    aiSummary += ` Achieved ${topKpi.achieved}${topKpi.unit} in ${topKpi.name} (${topKpi.achievement}% of target benchmark).`;
  }
  aiSummary += ` Maintained ${taskVelocity}% task velocity with a ${workQuality}/10 quality score and ${attendance}/10 attendance.`;
  if (finalPercentage >= 95.0) {
    aiSummary += ` Strongly recommended for Employee of the Month honors and special corporate bonus.`;
  }

  return {
    employeeId: record.employeeId || record.id || `EMP-${Date.now()}`,
    employeeName: empName,
    workEmail: record.workEmail || record.email || '',
    role: roleName,
    department: benchmark.department,
    month: record.month || record.evaluationMonth || 'August 2026',
    year: record.year || 2026,
    kpiResults,
    weightedKpiScore: Math.round(weightedKpiScore * 10) / 10,
    taskVelocity,
    workQuality,
    peerReview,
    attendance,
    compositeScore: finalPercentage,
    scoreOutOf10,
    tier,
    tierGrade,
    badgeColor,
    tierIcon,
    ribbon,
    aiSummary,
    notes: record.notes || record.notesAndAccomplishments || record.notesRemarks || ''
  };
}

/**
 * Rank a list of employee evaluation records for Employee of the Month
 */
export function rankEmployeesForEOTM(records) {
  if (!Array.isArray(records) || records.length === 0) return [];

  // Evaluate each record
  const evaluated = records.map(r => calculateEmployeePerformance(r));

  // Sort descending by compositeScore
  const ranked = [...evaluated].sort((a, b) => b.compositeScore - a.compositeScore);

  // Add rank and podium standing
  return ranked.map((emp, idx) => ({
    ...emp,
    rank: idx + 1,
    isWinner: idx === 0,
    isRunnerUp: idx === 1 || idx === 2,
    podiumBadge: idx === 0 ? '👑 #1 EMPLOYEE OF THE MONTH' : idx === 1 ? '🥈 1st Runner Up' : idx === 2 ? '🥉 2nd Runner Up' : `#${idx + 1}`
  }));
}
