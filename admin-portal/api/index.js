const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const path = require('path');
const store = require('../store'); // ← one level up from api/

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'daman-uw-secret-2024';

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Serve static portals — __dirname is admin-portal/api/, so .. is admin-portal/
app.use('/admin',    express.static(path.join(__dirname, '..')));
app.use('/customer', express.static(path.join(__dirname, '..', 'customer-portal')));
app.use('/public',   express.static(path.join(__dirname, '..', 'public')));
// Serve logo at root so both portals can use /daman-logo.png
app.get('/daman-logo.png', (req, res) => {
  res.setHeader('Content-Type', 'image/webp');
  res.sendFile(path.join(__dirname, '..', 'public', 'daman-logo.webp'));
});
app.get('/', (req, res) => res.redirect('/admin/login.html'));

// ── Auth middleware ──────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'UW_ADMIN') return res.status(403).json({ success: false, error: 'Forbidden' });
  next();
}

// ── AUTH ─────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = store.users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, name: user.name, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
  store.addAudit(user.id, 'LOGIN', 'User', user.id, null, null);
  res.json({ success: true, data: { token, user: { id: user.id, name: user.name, role: user.role, email: user.email } } });
});

// ── DISEASES (public for customer portal) ────────────────────
app.get('/api/diseases', (req, res) => {
  res.json({ success: true, data: store.diseases.filter(d => d.isActive) });
});
app.get('/api/diseases/active', (req, res) => {
  res.json({ success: true, data: store.diseases.filter(d => d.isActive) });
});

// ── COHORTS (public for customer portal) ─────────────────────
app.get('/api/cohorts', (req, res) => {
  res.json({ success: true, data: store.cohorts.filter(c => c.isActive).sort((a,b) => a.orderIndex - b.orderIndex) });
});

// ── QUESTIONS (public for customer portal) ───────────────────
app.get('/api/questions', (req, res) => {
  const { diseaseId } = req.query;
  let qs = store.questions.filter(q => q.isActive);
  if (diseaseId) qs = qs.filter(q => q.diseaseId === diseaseId);
  qs = qs.sort((a, b) => a.orderIndex - b.orderIndex);
  const mapped = qs.map(q => ({ id: q.id, diseaseId: q.diseaseId, text: q.text, type: q.answerType || q.type || 'select', options: q.options || [], answerType: q.answerType || q.type || 'TEXT' }));
  res.json({ success: true, data: mapped });
});

// ── DISEASE QUESTIONS (public — by disease id path) ──────────
app.get('/api/diseases/:id/questions', (req, res) => {
  const qs = store.questions
    .filter(q => q.diseaseId === req.params.id && q.isActive)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(q => ({ id: q.id, diseaseId: q.diseaseId, text: q.text, answerType: q.answerType || 'TEXT', type: q.answerType || 'TEXT', options: q.options || [], isMandatory: q.isMandatory || false }));
  res.json({ success: true, data: qs });
});

// ── COHORTS ───────────────────────────────────────────────────
app.get('/api/admin/cohorts', auth, (req, res) => {
  res.json({ success: true, data: store.cohorts.sort((a,b) => a.orderIndex - b.orderIndex) });
});

app.post('/api/admin/cohorts', auth, adminOnly, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Name required' });
  const c = { id: uuid(), name, description: description||'', orderIndex: store.cohorts.length + 1, isActive: true };
  store.cohorts.push(c);
  store.addAudit(req.user.id, 'COHORT_CREATED', 'Cohort', c.id, null, c);
  res.json({ success: true, data: c });
});

app.put('/api/admin/cohorts/:id', auth, adminOnly, (req, res) => {
  const c = store.cohorts.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ success: false, error: 'Not found' });
  const before = { ...c };
  Object.assign(c, req.body);
  store.addAudit(req.user.id, 'COHORT_UPDATED', 'Cohort', c.id, before, c);
  res.json({ success: true, data: c });
});

app.patch('/api/admin/cohorts/:id/toggle', auth, adminOnly, (req, res) => {
  const c = store.cohorts.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ success: false, error: 'Not found' });
  c.isActive = !c.isActive;
  store.addAudit(req.user.id, 'COHORT_TOGGLED', 'Cohort', c.id, null, { isActive: c.isActive });
  res.json({ success: true, data: c });
});

app.delete('/api/admin/cohorts/:id', auth, adminOnly, (req, res) => {
  const c = store.cohorts.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ success: false, error: 'Not found' });
  const diseaseCount = store.diseases.filter(d => d.cohortId === c.id && d.isActive).length;
  if (diseaseCount > 0) return res.status(400).json({ success: false, error: `Cannot delete: ${diseaseCount} active disease(s) in this cohort. Disable them first.` });
  c.isActive = false;
  store.addAudit(req.user.id, 'COHORT_DELETED', 'Cohort', c.id, null, null);
  res.json({ success: true });
});

app.get('/api/admin/diseases', auth, (req, res) => res.json({ success: true, data: store.diseases }));

app.post('/api/admin/diseases', auth, adminOnly, (req, res) => {
  const { name, cohortId, riskWeight, severity, loadingPct, uwImpact } = req.body;
  const cohortObj = store.cohorts.find(c => c.id === cohortId);
  const cohort = cohortObj ? cohortObj.name : (req.body.cohort || '');
  const dis = { id: uuid(), name, cohortId: cohortId||'', cohort, riskWeight: Number(riskWeight)||0, severity: severity||'MODERATE', loadingPct: Number(loadingPct)||0, uwImpact: uwImpact||'REFER', isActive: true };
  store.diseases.push(dis);
  store.addAudit(req.user.id, 'DISEASE_CREATED', 'Disease', dis.id, null, dis);
  res.json({ success: true, data: dis });
});

app.put('/api/admin/diseases/:id', auth, adminOnly, (req, res) => {
  const d = store.diseases.find(x => x.id === req.params.id);
  if (!d) return res.status(404).json({ success: false, error: 'Not found' });
  const before = { ...d };
  Object.assign(d, req.body);
  store.addAudit(req.user.id, 'DISEASE_UPDATED', 'Disease', d.id, before, d);
  res.json({ success: true, data: d });
});

app.delete('/api/admin/diseases/:id', auth, adminOnly, (req, res) => {
  const d = store.diseases.find(x => x.id === req.params.id);
  if (!d) return res.status(404).json({ success: false, error: 'Not found' });
  d.isActive = false;
  store.addAudit(req.user.id, 'DISEASE_DELETED', 'Disease', d.id, null, null);
  res.json({ success: true });
});

// ── QUESTIONS ────────────────────────────────────────────────
app.get('/api/admin/diseases/:id/questions', auth, (req, res) => {
  res.json({ success: true, data: store.questions.filter(q => q.diseaseId === req.params.id).sort((a, b) => a.orderIndex - b.orderIndex) });
});

app.post('/api/admin/diseases/:id/questions', auth, adminOnly, (req, res) => {
  const { text, answerType, options, isMandatory, conditionalOn } = req.body;
  const existing = store.questions.filter(q => q.diseaseId === req.params.id);
  const q = { id: uuid(), diseaseId: req.params.id, text, answerType, options: options || [], isMandatory: !!isMandatory, conditionalOn: conditionalOn || null, orderIndex: existing.length + 1, isActive: true };
  store.questions.push(q);
  store.addAudit(req.user.id, 'QUESTION_CREATED', 'Question', q.id, null, q);
  res.json({ success: true, data: q });
});

app.put('/api/admin/questions/:id', auth, adminOnly, (req, res) => {
  const q = store.questions.find(x => x.id === req.params.id);
  if (!q) return res.status(404).json({ success: false, error: 'Not found' });
  const before = { ...q };
  Object.assign(q, req.body);
  store.addAudit(req.user.id, 'QUESTION_UPDATED', 'Question', q.id, before, q);
  res.json({ success: true, data: q });
});

app.delete('/api/admin/questions/:id', auth, adminOnly, (req, res) => {
  const q = store.questions.find(x => x.id === req.params.id);
  if (!q) return res.status(404).json({ success: false, error: 'Not found' });
  q.isActive = false;
  store.addAudit(req.user.id, 'QUESTION_DELETED', 'Question', q.id, null, null);
  res.json({ success: true });
});

// ── RISK FACTORS ─────────────────────────────────────────────
app.get('/api/admin/risk-factors', auth, (req, res) => res.json({ success: true, data: store.riskFactors }));

app.post('/api/admin/risk-factors', auth, adminOnly, (req, res) => {
  const rf = { id: uuid(), ...req.body, isActive: true };
  store.riskFactors.push(rf);
  store.addAudit(req.user.id, 'RISK_FACTOR_CREATED', 'RiskFactor', rf.id, null, rf);
  res.json({ success: true, data: rf });
});

app.put('/api/admin/risk-factors/:id', auth, adminOnly, (req, res) => {
  const rf = store.riskFactors.find(x => x.id === req.params.id);
  if (!rf) return res.status(404).json({ success: false, error: 'Not found' });
  const before = { ...rf };
  Object.assign(rf, req.body);
  store.addAudit(req.user.id, 'RISK_FACTOR_UPDATED', 'RiskFactor', rf.id, before, rf);
  res.json({ success: true, data: rf });
});

// ── RULES ────────────────────────────────────────────────────
app.get('/api/admin/rules', auth, (req, res) => res.json({ success: true, data: store.rules }));

app.post('/api/admin/rules', auth, adminOnly, (req, res) => {
  const rule = { id: uuid(), ...req.body, isActive: false, status: 'DRAFT', createdBy: req.user.name, createdAt: new Date().toISOString() };
  store.rules.push(rule);
  store.addAudit(req.user.id, 'RULE_CREATED', 'Rule', rule.id, null, rule);
  res.json({ success: true, data: rule });
});

app.put('/api/admin/rules/:id', auth, adminOnly, (req, res) => {
  const rule = store.rules.find(x => x.id === req.params.id);
  if (!rule) return res.status(404).json({ success: false, error: 'Not found' });
  const before = { ...rule };
  Object.assign(rule, req.body);
  store.addAudit(req.user.id, 'RULE_UPDATED', 'Rule', rule.id, before, rule);
  res.json({ success: true, data: rule });
});

app.delete('/api/admin/rules/:id', auth, adminOnly, (req, res) => {
  const idx = store.rules.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
  store.addAudit(req.user.id, 'RULE_DELETED', 'Rule', req.params.id, null, null);
  store.rules.splice(idx, 1);
  res.json({ success: true });
});

app.patch('/api/admin/rules/:id/status', auth, adminOnly, (req, res) => {
  const rule = store.rules.find(x => x.id === req.params.id);
  if (!rule) return res.status(404).json({ success: false, error: 'Not found' });
  rule.isActive = req.body.isActive;
  rule.status = req.body.isActive ? 'ACTIVE' : 'INACTIVE';
  store.addAudit(req.user.id, rule.isActive ? 'RULE_ACTIVATED' : 'RULE_DEACTIVATED', 'Rule', rule.id, null, null);
  res.json({ success: true, data: rule });
});

// ── DECISION MATRIX ──────────────────────────────────────────
app.get('/api/admin/decision-matrix', auth, (req, res) => res.json({ success: true, data: store.decisionMatrix }));

app.put('/api/admin/decision-matrix', auth, adminOnly, (req, res) => {
  const before = { ...store.decisionMatrix };
  store.decisionMatrix.bands = req.body.bands;
  store.addAudit(req.user.id, 'DECISION_MATRIX_UPDATED', 'DecisionMatrix', 'dm1', before, store.decisionMatrix);
  res.json({ success: true, data: store.decisionMatrix });
});

// ── APPLICATIONS ─────────────────────────────────────────────
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
  const dIds = Array.isArray(app_.disclosures) ? app_.disclosures : (Array.isArray(app_.answers) ? [...new Set(app_.answers.map(a => a.diseaseId))] : []);
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
    else if (field === 'disease') actual = (Array.isArray(app_.disclosures) ? app_.disclosures.length : 0) + (Array.isArray(app_.answers) ? new Set(app_.answers.map(a => a.diseaseId)).size : 0) > 0;
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

// ── SECTION QUESTIONS (public read for customer portal) ──────
app.get('/api/section-questions', (req, res) => {
  const { section } = req.query;
  let qs = store.sectionQuestions.filter(q => q.isActive);
  if (section) qs = qs.filter(q => q.section === section);
  qs = qs.sort((a, b) => a.orderIndex - b.orderIndex);
  res.json({ success: true, data: qs });
});

// ── SECTION QUESTIONS ADMIN CRUD ─────────────────────────────
app.get('/api/admin/section-questions', auth, (req, res) => {
  const { section } = req.query;
  let qs = store.sectionQuestions;
  if (section) qs = qs.filter(q => q.section === section);
  qs = qs.sort((a, b) => a.orderIndex - b.orderIndex);
  res.json({ success: true, data: qs });
});

app.post('/api/admin/section-questions', auth, adminOnly, (req, res) => {
  const { section, text, answerType, options, isMandatory } = req.body;
  const existing = store.sectionQuestions.filter(q => q.section === section);
  const q = { id: uuid(), section, text, answerType: answerType || 'TEXT', options: options || [], orderIndex: existing.length + 1, isActive: true, isMandatory: !!isMandatory };
  store.sectionQuestions.push(q);
  store.addAudit(req.user.id, 'SECTION_Q_CREATED', 'SectionQuestion', q.id, null, q);
  res.json({ success: true, data: q });
});

app.put('/api/admin/section-questions/:id', auth, adminOnly, (req, res) => {
  const q = store.sectionQuestions.find(x => x.id === req.params.id);
  if (!q) return res.status(404).json({ success: false, error: 'Not found' });
  const before = { ...q };
  Object.assign(q, req.body);
  store.addAudit(req.user.id, 'SECTION_Q_UPDATED', 'SectionQuestion', q.id, before, q);
  res.json({ success: true, data: q });
});

app.delete('/api/admin/section-questions/:id', auth, adminOnly, (req, res) => {
  const q = store.sectionQuestions.find(x => x.id === req.params.id);
  if (!q) return res.status(404).json({ success: false, error: 'Not found' });
  q.isActive = false;
  store.addAudit(req.user.id, 'SECTION_Q_DELETED', 'SectionQuestion', q.id, null, null);
  res.json({ success: true });
});

app.patch('/api/admin/section-questions/:id/toggle', auth, adminOnly, (req, res) => {
  const q = store.sectionQuestions.find(x => x.id === req.params.id);
  if (!q) return res.status(404).json({ success: false, error: 'Not found' });
  q.isActive = !q.isActive;
  store.addAudit(req.user.id, 'SECTION_Q_TOGGLED', 'SectionQuestion', q.id, null, { isActive: q.isActive });
  res.json({ success: true, data: q });
});

app.patch('/api/admin/section-questions/:id/mandatory', auth, adminOnly, (req, res) => {
  const q = store.sectionQuestions.find(x => x.id === req.params.id);
  if (!q) return res.status(404).json({ success: false, error: 'Not found' });
  q.isMandatory = !q.isMandatory;
  store.addAudit(req.user.id, 'SECTION_Q_MANDATORY_TOGGLED', 'SectionQuestion', q.id, null, { isMandatory: q.isMandatory });
  res.json({ success: true, data: q });
});

app.post('/api/admin/section-questions/reorder', auth, adminOnly, (req, res) => {
  const { section, ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ success: false, error: 'ids must be array' });
  ids.forEach((id, idx) => {
    const q = store.sectionQuestions.find(x => x.id === id && x.section === section);
    if (q) q.orderIndex = idx + 1;
  });
  res.json({ success: true });
});

// ── ADMIN APPLICATIONS ───────────────────────────────────────
app.get('/api/admin/applications', auth, (req, res) => {
  let apps = [...store.applications].filter(a => a.status !== 'DRAFT');
  if (req.query.status) apps = apps.filter(a => a.status === req.query.status);
  res.json({ success: true, data: apps, meta: { total: apps.length } });
});

app.get('/api/admin/applications/:id', auth, (req, res) => {
  const app_ = store.applications.find(a => a.id === req.params.id);
  if (!app_) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: app_ });
});

// ── WORKBENCH ────────────────────────────────────────────────
app.get('/api/admin/workbench', auth, (req, res) => {
  const referred = store.applications.filter(a => a.status === 'REFERRED');
  res.json({ success: true, data: referred });
});

app.get('/api/admin/workbench/:id', auth, (req, res) => {
  const app_ = store.applications.find(a => a.id === req.params.id);
  if (!app_) return res.status(404).json({ success: false, error: 'Not found' });
  const dIds2 = Array.isArray(app_.disclosures) ? app_.disclosures : (Array.isArray(app_.answers) ? [...new Set(app_.answers.map(a => a.diseaseId))] : []);
  const diseases = store.diseases.filter(d => dIds2.includes(d.id));
  res.json({ success: true, data: { ...app_, diseasesDetail: diseases } });
});

app.post('/api/admin/workbench/:id/decision', auth, (req, res) => {
  const app_ = store.applications.find(a => a.id === req.params.id);
  if (!app_) return res.status(404).json({ success: false, error: 'Not found' });
  const { decision, notes } = req.body;
  if (!notes || notes.trim().length < 5) return res.status(400).json({ success: false, error: 'Notes required (min 5 chars)' });
  app_.decision = decision;
  app_.status = decision === 'REFER' ? 'REFERRED' : decision === 'DECLINE' ? 'DECLINED' : 'ACCEPTED';
  app_.workbenchDecision = { decision, notes, decidedBy: req.user.name, decidedAt: new Date().toISOString() };
  store.addAudit(req.user.id, 'WORKBENCH_DECISION', 'Application', app_.id, null, { decision, notes });
  res.json({ success: true, data: app_ });
});

// ── AUDIT ────────────────────────────────────────────────────
app.get('/api/admin/audit', auth, (req, res) => {
  let logs = [...store.auditLogs].reverse();
  if (req.query.action) logs = logs.filter(l => l.action === req.query.action);
  res.json({ success: true, data: logs, meta: { total: logs.length } });
});

// ── DASHBOARD STATS ───────────────────────────────────────────
app.get('/api/admin/dashboard', auth, (req, res) => {
  const apps = store.applications.filter(a => a.status !== 'DRAFT');
  res.json({
    success: true,
    data: {
      total:    apps.length,
      referred: apps.filter(a => a.status === 'REFERRED').length,
      accepted: apps.filter(a => a.status === 'ACCEPTED').length,
      declined: apps.filter(a => a.status === 'DECLINED').length,
      pending:  apps.filter(a => a.status === 'SUBMITTED').length,
      recent:   [...apps].sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt)).slice(0, 8),
    }
  });
});

// ── Serverless export (Vercel) / local server ─────────────────
if (require.main === module) {
  app.listen(3000, () => console.log('Daman UW Platform → http://localhost:3000'));
}
module.exports = app;
