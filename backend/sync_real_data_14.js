const fs = require('fs');
const path = require('path');

const realDataPath = path.join(__dirname, '..', 'src', 'data', 'realCrmData.js');
let content = fs.readFileSync(realDataPath, 'utf8');

const EXACT_14 = [
  {
    "id": "EMP-SANNA-001",
    "name": "Srinivas (Admin)",
    "username": "admin",
    "email": "admin@sannainnovations.com",
    "designation": "Chief Executive Officer (CEO)",
    "role": "Super Admin / Org Admin",
    "roleId": "role-admin",
    "baseSalary": 100000,
    "salary": 100000,
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    "status": "Active"
  },
  {
    "id": "EMP-SANNA-004",
    "name": "Jyothi",
    "username": "empsi02",
    "email": "empsi02@sannainnovations.com",
    "designation": "Chief Commercial Officer (CCO)",
    "role": "Operations Head",
    "roleId": "role-ops",
    "baseSalary": 15000,
    "salary": 15000,
    "avatar": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&auto=format&fit=crop&q=80",
    "status": "Active"
  },
  {
    "id": "EMP-SANNA-005",
    "name": "Sowmya",
    "username": "empsi03",
    "email": "empsi03@sannainnovations.com",
    "designation": "Lead Frontend Engineer",
    "role": "Software Developer",
    "roleId": "role-dev",
    "baseSalary": 25000,
    "salary": 25000,
    "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
    "status": "Active"
  },
  {
    "id": "EMP-SANNA-008",
    "name": "Mavuri Anand Kumar",
    "username": "empsi06",
    "email": "empsi06@sannainnovations.com",
    "designation": "Lead Video Editor & Motion Artist",
    "role": "Video Editor",
    "roleId": "role-video",
    "baseSalary": 10000,
    "salary": 10000,
    "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
    "status": "Active"
  },
  {
    "id": "EMP-SANNA-009",
    "name": "Riya Biswas Dasgupta",
    "username": "empsi07",
    "email": "empsi07@sannainnovations.com",
    "designation": "Sr. Graphic Designer",
    "role": "Graphic Designer",
    "roleId": "role-designer",
    "baseSalary": 40000,
    "salary": 40000,
    "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    "status": "Active"
  },
  {
    "id": "EMP-SANNA-012",
    "name": "Bhuvan Sai Adithya",
    "username": "empsi10",
    "email": "btia23001@joyuniversity.edu.in",
    "designation": "Data Analyst Intern",
    "role": "Intern / Engineering Trainee",
    "roleId": "role-intern",
    "baseSalary": 12000,
    "salary": 12000,
    "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80",
    "status": "Active"
  },
  {
    "id": "EMP-SANNA-013",
    "name": "M.Shalini Sree",
    "username": "empsi11",
    "email": "shalinisree17@gmail.com",
    "designation": "Data Analyst Intern",
    "role": "Intern / Engineering Trainee",
    "roleId": "role-intern",
    "baseSalary": 12000,
    "salary": 12000,
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    "status": "Active"
  },
  {
    "id": "EMP-SANNA-014",
    "name": "Vansh Goyal",
    "username": "empsi12",
    "email": "vanshgoyal.cc12345@gmail.com",
    "designation": "Data Analyst Intern / Dev",
    "role": "Software Developer",
    "roleId": "role-dev",
    "baseSalary": 50000,
    "salary": 50000,
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    "status": "Active"
  },
  {
    "id": "EMP-SANNA-015",
    "name": "Srikakula Anirudh",
    "username": "empsi13",
    "email": "btai23026@joyuniversity.edu.in",
    "designation": "Data Analyst Intern",
    "role": "Intern / Engineering Trainee",
    "roleId": "role-intern",
    "baseSalary": 50000,
    "salary": 50000,
    "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
    "status": "Active"
  },
  {
    "id": "EMP-SANNA-021",
    "name": "YASH DESHMUKH",
    "username": "empsi19",
    "email": "yashdesh191@gmail.com",
    "designation": "Full Stack Developer",
    "role": "Software Developer",
    "roleId": "role-dev",
    "baseSalary": 1000,
    "salary": 1000,
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    "status": "Active"
  },
  {
    "id": "EMP-SANNA-022",
    "name": "Karthik",
    "username": "karthik",
    "email": "karthik@sannainnovations.com",
    "designation": "Performance Marketer",
    "role": "Digital Marketer",
    "roleId": "role-marketer",
    "baseSalary": 15000,
    "salary": 15000,
    "avatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80",
    "status": "Active"
  },
  {
    "id": "EMP-SANNA-023",
    "name": "Mohana Priya Sakthivel",
    "username": "mohana",
    "email": "Priyadigitaldm@gmail.com",
    "designation": "Performance Marketer",
    "role": "Digital Marketer",
    "roleId": "role-marketer",
    "baseSalary": 37000,
    "salary": 37000,
    "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80",
    "status": "Active"
  },
  {
    "id": "EMP-SANNA-038",
    "name": "Vidhurshan",
    "username": "vidhurshan",
    "email": "vidhurshan@sannainnovations.com",
    "designation": "Intern",
    "role": "Intern / Engineering Trainee",
    "roleId": "role-intern",
    "baseSalary": 1000,
    "salary": 1000,
    "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    "status": "Active"
  },
  {
    "id": "EMP-SANNA-039",
    "name": "Smitesh Porkhar",
    "username": "smitesh",
    "email": "smitesh@sannainnovations.com",
    "designation": "Intern",
    "role": "Intern / Engineering Trainee",
    "roleId": "role-intern",
    "baseSalary": 10000,
    "salary": 10000,
    "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
    "status": "Active"
  }
];

const startIdx = content.indexOf('"employees": [');
if (startIdx !== -1) {
  let endIdx = content.indexOf('],', startIdx);
  if (endIdx === -1) endIdx = content.indexOf(']', startIdx);
  const replacement = `"employees": ${JSON.stringify(EXACT_14, null, 2)}`;
  content = content.slice(0, startIdx) + replacement + content.slice(endIdx + 1);
  fs.writeFileSync(realDataPath, content, 'utf8');
  console.log('✅ Synced exact 14 employees with updated salaries to realCrmData.js');
}
