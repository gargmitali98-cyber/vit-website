// ponytail: in-memory store, resets on restart — swap module.exports for a DB adapter when needed
const { v4: uuid } = require('uuid');

const store = {
  users: [
    { id: 'u1', name: 'Admin User',       email: 'admin@daman.ae', password: 'admin123', role: 'UW_ADMIN' },
    { id: 'u2', name: 'John Underwriter', email: 'uw@daman.ae',    password: 'uw123',    role: 'UNDERWRITER' },
  ],

  applications: [],

  diseases: [
    { id: 'd1',  name: 'Diabetes & Metabolic',   cohort: 'Metabolic',      riskWeight: 20, isActive: true },
    { id: 'd2',  name: 'Heart & Blood Pressure',  cohort: 'Cardiovascular', riskWeight: 25, isActive: true },
    { id: 'd3',  name: 'Respiratory',             cohort: 'Pulmonary',      riskWeight: 15, isActive: true },
    { id: 'd4',  name: 'Cancer & Oncology',       cohort: 'Oncology',       riskWeight: 40, isActive: true },
    { id: 'd5',  name: 'Kidney & Urinary',        cohort: 'Renal',          riskWeight: 18, isActive: true },
    { id: 'd6',  name: 'Mental Health',           cohort: 'Psychiatric',    riskWeight: 12, isActive: true },
    { id: 'd7',  name: 'Musculoskeletal',         cohort: 'Orthopedic',     riskWeight: 10, isActive: true },
    { id: 'd8',  name: 'Neurological',            cohort: 'Neuro',          riskWeight: 22, isActive: true },
    { id: 'd9',  name: 'Autoimmune',              cohort: 'Immunology',     riskWeight: 20, isActive: true },
    { id: 'd10', name: "Women's Health",          cohort: 'Gynecology',     riskWeight: 10, isActive: true },
    { id: 'd11', name: 'Other Conditions',        cohort: 'General',        riskWeight: 8,  isActive: true },
  ],

  questions: [
    { id: 'q1', diseaseId: 'd1', text: 'Year diagnosed', answerType: 'NUMBER', options: [], orderIndex: 1, isActive: true, conditions: [] },
    { id: 'q2', diseaseId: 'd1', text: 'Latest HbA1c value (%)', answerType: 'NUMBER', options: [], orderIndex: 2, isActive: true, conditions: [] },
    { id: 'q3', diseaseId: 'd1', text: 'Current medication', answerType: 'TEXT', options: [], orderIndex: 3, isActive: true, conditions: [] },
    { id: 'q4', diseaseId: 'd1', text: 'Do you use Insulin?', answerType: 'YES_NO', options: [], orderIndex: 4, isActive: true, conditions: [] },
    { id: 'q5', diseaseId: 'd1', text: 'Complications (select all that apply)', answerType: 'MULTI_SELECT', options: ['Neuropathy','Retinopathy','Nephropathy','None'], orderIndex: 5, isActive: true, conditions: [] },
    { id: 'q6', diseaseId: 'd2', text: 'Condition type', answerType: 'DROPDOWN', options: ['Angina','Heart Attack','Heart Failure','Arrhythmia','Other'], orderIndex: 1, isActive: true, conditions: [] },
    { id: 'q7', diseaseId: 'd2', text: 'Procedure history (select all that apply)', answerType: 'MULTI_SELECT', options: ['Angioplasty','Bypass Surgery','Stent','Pacemaker','None'], orderIndex: 2, isActive: true, conditions: [] },
    { id: 'q8', diseaseId: 'd2', text: 'Current medication', answerType: 'TEXT', options: [], orderIndex: 3, isActive: true, conditions: [] },
    { id: 'q9', diseaseId: 'd2', text: 'Current status', answerType: 'DROPDOWN', options: ['Stable','Under Treatment','Surgery Planned'], orderIndex: 4, isActive: true, conditions: [] },
  ],

  riskFactors: [
    { id: 'rf1', name: 'Smoking',        type: 'LIFESTYLE', weightage: 10, thresholds: [{ label: 'Never', loadingPct: 0 },{ label: 'Ex-smoker', loadingPct: 5 },{ label: 'Current', loadingPct: 15 }], isActive: true },
    { id: 'rf2', name: 'BMI',            type: 'LIFESTYLE', weightage: 15, thresholds: [{ label: 'Normal (18.5–24.9)', loadingPct: 0 },{ label: 'Overweight (25–29.9)', loadingPct: 10 },{ label: 'Obese (30+)', loadingPct: 20 }], isActive: true },
    { id: 'rf3', name: 'Claims History', type: 'CLAIMS',    weightage: 20, thresholds: [{ label: 'No claims', loadingPct: 0 },{ label: 'Claims < AED 50k', loadingPct: 10 },{ label: 'Claims > AED 50k', loadingPct: 25 }], isActive: true },
    { id: 'rf4', name: 'Family History', type: 'FAMILY',    weightage: 10, thresholds: [{ label: 'None', loadingPct: 0 },{ label: '1 condition', loadingPct: 5 },{ label: '2+ conditions', loadingPct: 12 }], isActive: true },
    { id: 'rf5', name: 'Alcohol',        type: 'LIFESTYLE', weightage: 8,  thresholds: [{ label: 'None', loadingPct: 0 },{ label: 'Occasional', loadingPct: 3 },{ label: 'Regular', loadingPct: 10 }], isActive: true },
  ],

  rules: [],

  decisionMatrix: {
    bands: [
      { minScore: 0,  maxScore: 20,  decision: 'ACCEPT' },
      { minScore: 21, maxScore: 40,  decision: 'ACCEPT_WITH_LOADING' },
      { minScore: 41, maxScore: 70,  decision: 'REFER' },
      { minScore: 71, maxScore: 999, decision: 'DECLINE' },
    ],
  },

  auditLogs: [],
};

store.addAudit = function(userId, action, resourceType, resourceId, before, after) {
  this.auditLogs.push({ id: uuid(), userId, action, resourceType, resourceId, before: before || null, after: after || null, timestamp: new Date().toISOString() });
};

module.exports = store;
