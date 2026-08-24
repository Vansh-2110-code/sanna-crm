import { REAL_CRM_DATA } from './src/data/realCrmData.js';

console.log('REAL_CRM_DATA keys:', Object.keys(REAL_CRM_DATA));
for (const k of Object.keys(REAL_CRM_DATA)) {
  const v = REAL_CRM_DATA[k];
  console.log(`  ${k}: ${Array.isArray(v) ? `${v.length} items` : typeof v}`);
  if (Array.isArray(v) && v.length > 0 && (k.toLowerCase().includes('inv') || k.toLowerCase().includes('order') || k.toLowerCase().includes('bill') || k.toLowerCase().includes('fin'))) {
    console.log(`    Sample ${k}[0]:`, v[0]);
  }
}
