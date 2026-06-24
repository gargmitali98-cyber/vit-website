const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const path = require('path');
const store = require('../store');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'daman-uw-secret-2024';

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Static files bundled via vercel.json includeFiles
app.use('/customer', express.static(path.join(__dirname, '..', 'customer')));
app.use('/public',   express.static(path.join(__dirname, '..', 'public')));
app.get('/daman-logo.png', (req, res) => {
  res.setHeader('Content-Type', 'image/webp');
  res.sendFile(path.join(__dirname, '..', 'public', 'daman-logo.webp'));
});
app.get('/', (req, res) => res.redirect('/customer/index.html'));

// ── DISEASES (public) ─────────────────────────────────────────
app.get('/api/diseases', (req, res) => {
  res.json({ success: true, data: store.diseases.filter(d => d.isActive) });
});
app.get('/api/diseases/active', (req, res) => {
  res.json({ success: true, data: store.diseases.filter(d => d.isActive) });
});
app.get('/api/diseases/:id/questions', (req, res) => {
  const qs = store.questions
    .filter(q => q.diseaseId === req.params.id && q.isActive)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(q => ({ id: q.id, diseaseId: q.diseaseId, text: q.text, answerType: q.answerType || 'TEXT', type: q.answerType || 'TEXT', options: q.options || [], isMandatory: q.isMandatory || false }));
  res.json({ success: true, data: qs });
});

// ── COHORTS (public) ──────────────────────────────────────────
app.get('/api/cohorts', (req, res) => {
  res.json({ success: true, data: store.cohorts.filter(c => c.isActive).sort((a,b) => a.orderIndex - b.orderIndex) });
});

// ── QUESTIONS (public) ────────────────────────────────────────
app.get('/api/questions', (req, res) => {
  const { diseaseId } = req.query;
  let qs = store.questions.filter(q => q.isActive);
  if (diseaseId) qs = qs.filter(q => q.diseaseId === diseaseId);
  qs = qs.sort((a, b) => a.orderIndex - b.orderIndex);
  const mapped = qs.map(q => ({ id: q.id, diseaseId: q.diseaseId, text: q.text, type: q.answerType || q.type || 'select', options: q.options || [], answerType: q.answerType || q.type || 'TEXT' }));
  res.json({ success: true, data: mapped });
});

// ── SECTION QUESTIONS (public) ────────────────────────────────
app.get('/api/section-questions', (req, res) => {
  const { section } = req.query;
  let qs = store.sectionQuestions.filter(q => q.isActive);
  if (section) qs = qs.filter(q => q.section === section);
  qs = qs.sort((a, b) => a.orderIndex - b.orderIndex);
  res.json({ success: true, data: qs });
});

// ── APPLICATIONS ──────────────────────────────────────────────
app.post('/api/applications', (req, res) => {
  const app_ = {
    id: uuid(),
    referenceNumber: 'DUW-' + Date.now().toString().slice(-6),
    status: 'DRAFT',
    riskScore: null,
    decision: null,
    personalDetails: {},
    lifestyle: {},
    familyHistory: {},
    claimsHistory: {},
    disclosures: [],
    answers: {},
    documents: [],
    createdAt: new Date().toISOString(),
    submittedAt: null,
  };
  store.applications.push(app_);
  res.json({ success: true, data: app_ });
});

app.get('/api/applications/:id', (req, res) => {
  const app_ = store.applications.find(a => a.id === req.params.id);
  if (!app_) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: app_ });
});

['personal-details','lifestyle','family-history','claims-history','disclosures','answers'].forEach(step => {
  const key = step.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  app.put(`/api/applications/:id/${step}`, (req, res) => {
    const app_ = store.applications.find(a => a.id === req.params.id);
    if (!app_) return res.status(404).json({ success: false, error: 'Not found' });
    app_[key] = req.body;
    res.json({ success: true, data: app_ });
  });
});

const saveDocuments = (req, res) => {
  const app_ = store.applications.find(a => a.id === req.params.id);
  if (!app_) return res.status(404).json({ success: false, error: 'Not found' });
  const docs = req.body.documents || [];
  app_.documents = docs.map(d => ({ id: uuid(), ...d, uploadedAt: new Date().toISOString() }));
  res.json({ success: true, data: app_ });
};
app.put('/api/applications/:id/documents', saveDocuments);
app.post('/api/applications/:id/documents-upload', saveDocuments);

app.get('/api/applications/:id/questionnaire', (req, res) => {
  const app_ = store.applications.find(a => a.id === req.params.id);
  if (!app_) return res.status(404).json({ success: false, error: 'Not found' });
  const dIds = Array.isArray(app_.disclosures) ? app_.disclosures : [];
  const questions = store.questions.filter(q => dIds.includes(q.diseaseId) && q.isActive).sort((a, b) => a.orderIndex - b.orderIndex);
  const diseases = store.diseases.filter(d => dIds.includes(d.id));
  res.json({ success: true, data: { diseases, questions } });
});

app.post('/api/applications/:id/documents', (req, res) => {
  const app_ = store.applications.find(a => a.id === req.params.id);
  if (!app_) return res.status(404).json({ success: false, error: 'Not found' });
  const doc = { id: uuid(), ...req.body, uploadedAt: new Date().toISOString() };
  app_.documents.push(doc);
  res.json({ success: true, data: doc });
});

app.post('/api/applications/:id/submit', (req, res) => {
  const app_ = store.applications.find(a => a.id === req.params.id);
  if (!app_) return res.status(404).json({ success: false, error: 'Not found' });

  const diseaseIds = (() => {
    const ans = app_.answers;
    if (Array.isArray(ans) && ans.length) return [...new Set(ans.map(a => a.diseaseId))];
    if (ans && Array.isArray(ans.answers)) return [...new Set(ans.answers.map(a => a.diseaseId))];
    if (Array.isArray(app_.disclosures)) return app_.disclosures;
    if (app_.disclosures && app_.disclosures.diseases) return app_.disclosures.diseases.map(d => d.id);
    return [];
  })();

  let score = diseaseIds.reduce((sum, id) => {
    const d = store.diseases.find(x => x.id === id);
    return sum + (d ? (d.riskWeight || 0) : 0);
  }, 0);

  const ls = app_.lifestyle || {};
  const smoking = (ls.smokingStatus || '').toLowerCase();
  const alcohol = (ls.alcoholConsumption || '').toLowerCase();
  if (smoking.includes('current')) score += 15;
  else if (smoking.includes('ex')) score += 5;
  if (alcohol.includes('heavy')) score += 15;
  else if (alcohol.includes('moderate')) score += 8;
  else if (alcohol.includes('occasional')) score += 3;
  const bmi = parseFloat(ls.bmi) || 0;
  if (bmi >= 30) score += 20;
  else if (bmi >= 25) score += 10;

  let decision = null;
  const triggered = [];
  for (const rule of store.rules.filter(r => r.isActive).sort((a, b) => (a.priority || 99) - (b.priority || 99))) {
    if (matchRule(rule.conditions, app_, score)) {
      decision = rule.action;
      triggered.push(rule.id);
      break;
    }
  }

  if (!decision) {
    const band = store.decisionMatrix.bands.find(b => score >= b.minScore && score <= b.maxScore);
    decision = band ? band.decision : 'REFER';
  }

  app_.status = decision === 'REFER' ? 'REFERRED' : decision === 'ACCEPT' || decision === 'ACCEPT_WITH_LOADING' ? 'ACCEPTED' : 'DECLINED';
  app_.riskScore = score;
  app_.decision = decision;
  app_.submittedAt = new Date().toISOString();
  app_.triggeredRules = triggered;

  store.addAudit('system', 'APPLICATION_SUBMITTED', 'Application', app_.id, null, { decision, score });
  res.json({ success: true, data: app_ });
});

function matchRule(conditions, app_, score) {
  if (!conditions || !conditions.rules) return false;
  const check = (rule) => {
    const { field, op, value } = rule;
    let actual;
    if (field === 'age') actual = app_.personalDetails?.age;
    else if (field === 'score') actual = score;
    else if (field === 'disease') actual = (Array.isArray(app_.disclosures) ? app_.disclosures.length : 0) > 0;
    else return false;
    if (op === 'GT') return actual > value;
    if (op === 'GTE') return actual >= value;
    if (op === 'LT') return actual < value;
    if (op === 'LTE') return actual <= value;
    if (op === 'EQ') return actual == value;
    return false;
  };
  if (conditions.combinator === 'and') return conditions.rules.every(check);
  if (conditions.combinator === 'or') return conditions.rules.some(check);
  return false;
}

// ── Serverless export (Vercel) / local server ─────────────────
if (require.main === module) {
  app.listen(3000, () => console.log('Daman Customer Portal → http://localhost:3000'));
}
module.exports = app;
