# Daman Underwriting Platform V2 — Technical Plan (Simplified)

**Version:** 3.0  
**Date:** 2026-06-24  
**Status:** Draft  
**Backup of previous plan:** `TECHNICAL_PLAN_v1_backup.md`

---

## 1. Philosophy

Simple stack. No build tools. No frameworks. No ORMs. No cloud services.  
Ship fast, look great, change anything easily.

| Principle | Decision |
|-----------|----------|
| Frontend | Vanilla HTML + CSS + JavaScript (no framework) |
| Backend | Node.js with Express (plain JS) |
| Database | In-memory (JavaScript objects / arrays, reset on server restart) |
| Styling | Custom CSS — clean B2B SaaS aesthetic (no CSS framework) |
| Auth | Simple JWT stored in localStorage |
| File "upload" | Base64 encode in-memory (no S3, no disk writes) |
| Deployment | Single `node server.js` command |

---

## 2. System Overview

```
Browser
  │
  ├── /customer/*   → customer-portal/   (static HTML + CSS + JS files)
  │
  └── /admin/*      → admin-portal/      (static HTML + CSS + JS files)
          │
          └── fetch() calls → Express API (server.js)
                                    │
                                    └── In-Memory Store (store.js)
```

Everything lives in one folder. One server serves HTML files and the API.

---

## 3. Folder Structure

```
daman-uw-platform/
│
├── server.js                  # Express server — serves static files + all API routes
├── store.js                   # In-memory data store (all runtime data lives here)
├── routes/
│   ├── auth.js
│   ├── applications.js
│   ├── diseases.js
│   ├── questionnaire.js
│   ├── risk-factors.js
│   ├── rules.js
│   ├── decision-matrix.js
│   ├── workbench.js
│   └── audit.js
│
├── customer-portal/
│   ├── index.html             # Landing / start application
│   ├── apply.html             # Multi-step application wizard
│   ├── confirmation.html      # Submission confirmation
│   ├── css/
│   │   └── style.css          # Shared stylesheet
│   └── js/
│       ├── api.js             # fetch() wrapper
│       ├── wizard.js          # Step navigation logic
│       ├── questionnaire.js   # Dynamic question renderer
│       └── upload.js          # File → base64 handler
│
└── admin-portal/
    ├── login.html
    ├── dashboard.html
    ├── disease-master.html
    ├── questionnaire-builder.html
    ├── risk-factors.html
    ├── rules-engine.html
    ├── decision-matrix.html
    ├── applications.html
    ├── workbench.html
    ├── audit-trail.html
    ├── css/
    │   └── style.css          # Admin stylesheet
    └── js/
        ├── api.js             # fetch() wrapper + auth header injection
        ├── dashboard.js
        ├── disease-master.js
        ├── questionnaire-builder.js
        ├── risk-factors.js
        ├── rules-engine.js
        ├── decision-matrix.js
        ├── applications.js
        ├── workbench.js
        └── audit-trail.js
```

---

## 4. Tech Stack

### 4.1 Backend

| Item | Choice |
|------|--------|
| Runtime | Node.js 20 (no install beyond `node`) |
| Server | Express 4 |
| Auth | `jsonwebtoken` (JWT, HS256) |
| Body parsing | `express.json()` (built-in) |
| Static files | `express.static()` (built-in) |
| Database | Plain JS objects in `store.js` (in-memory) |
| CORS | `cors` package |

**Dependencies (package.json) — that's it:**
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0",
    "cors": "^2.8.5",
    "uuid": "^9.0.0"
  }
}
```

### 4.2 Frontend

| Item | Choice |
|------|--------|
| HTML | Semantic HTML5 |
| CSS | Custom — one `style.css` per portal |
| JavaScript | Vanilla ES6+ (fetch, async/await, DOM API) |
| No bundler | Files served directly — no Webpack, Vite, or build step |
| No framework | No React, Vue, Angular |
| Icons | Inline SVG or a single CDN icon font (Lucide via CDN) |

---

## 5. In-Memory Data Store (`store.js`)

```js
// store.js — all runtime data, resets on server restart

const { v4: uuid } = require('uuid');

const store = {

  users: [
    { id: '1', name: 'Admin User',       email: 'admin@daman.ae',  password: 'admin123',  role: 'UW_ADMIN' },
    { id: '2', name: 'John Underwriter', email: 'uw@daman.ae',     password: 'uw123',     role: 'UNDERWRITER' },
  ],

  applications: [],   // { id, referenceNumber, status, riskScore, decision, personalDetails,
                      //   lifestyle, familyHistory, claimsHistory, disclosures,
                      //   answers, documents[], createdAt }

  diseases: [
    { id: 'd1', name: 'Diabetes & Metabolic',  cohort: 'Metabolic',      riskWeight: 20, severityLevels: ['Mild','Moderate','Severe'], isActive: true },
    { id: 'd2', name: 'Heart & Blood Pressure', cohort: 'Cardiovascular', riskWeight: 25, severityLevels: ['Mild','Moderate','Severe'], isActive: true },
    { id: 'd3', name: 'Respiratory',            cohort: 'Pulmonary',      riskWeight: 15, severityLevels: ['Mild','Moderate','Severe'], isActive: true },
    { id: 'd4', name: 'Cancer & Oncology',      cohort: 'Oncology',       riskWeight: 40, severityLevels: ['Stage 1','Stage 2','Stage 3','Stage 4'], isActive: true },
    { id: 'd5', name: 'Kidney & Urinary',       cohort: 'Renal',          riskWeight: 18, severityLevels: ['Mild','Moderate','Severe'], isActive: true },
    { id: 'd6', name: 'Mental Health',          cohort: 'Psychiatric',    riskWeight: 12, severityLevels: ['Mild','Moderate','Severe'], isActive: true },
    { id: 'd7', name: 'Musculoskeletal',        cohort: 'Orthopedic',     riskWeight: 10, severityLevels: ['Mild','Moderate','Severe'], isActive: true },
    { id: 'd8', name: 'Neurological',           cohort: 'Neuro',          riskWeight: 22, severityLevels: ['Mild','Moderate','Severe'], isActive: true },
    { id: 'd9', name: 'Autoimmune',             cohort: 'Immunology',     riskWeight: 20, severityLevels: ['Mild','Moderate','Severe'], isActive: true },
    { id: 'd10', name: "Women's Health",        cohort: 'Gynecology',     riskWeight: 10, severityLevels: ['Mild','Moderate','Severe'], isActive: true },
    { id: 'd11', name: 'Other Conditions',      cohort: 'General',        riskWeight: 8,  severityLevels: ['Mild','Moderate','Severe'], isActive: true },
  ],

  questions: [],      // { id, diseaseId, text, answerType, options[], orderIndex, isActive, conditions[] }
                      // answerType: TEXT | NUMBER | DROPDOWN | MULTI_SELECT | YES_NO | DATE

  riskFactors: [
    { id: 'rf1', name: 'Smoking',         type: 'LIFESTYLE', weightage: 10, thresholds: [{ label: 'Never', loadingPct: 0 }, { label: 'Ex-smoker', loadingPct: 5 }, { label: 'Current', loadingPct: 15 }], isActive: true },
    { id: 'rf2', name: 'BMI',             type: 'LIFESTYLE', weightage: 15, thresholds: [{ label: 'Normal (18.5–24.9)', loadingPct: 0 }, { label: 'Overweight (25–29.9)', loadingPct: 10 }, { label: 'Obese (30+)', loadingPct: 20 }], isActive: true },
    { id: 'rf3', name: 'Claims History',  type: 'CLAIMS',    weightage: 20, thresholds: [{ label: 'No claims', loadingPct: 0 }, { label: 'Claims < 50k', loadingPct: 10 }, { label: 'Claims > 50k', loadingPct: 25 }], isActive: true },
    { id: 'rf4', name: 'Family History',  type: 'FAMILY',    weightage: 10, thresholds: [{ label: 'None', loadingPct: 0 }, { label: '1 condition', loadingPct: 5 }, { label: '2+ conditions', loadingPct: 12 }], isActive: true },
    { id: 'rf5', name: 'Alcohol',         type: 'LIFESTYLE', weightage: 8,  thresholds: [{ label: 'None', loadingPct: 0 }, { label: 'Occasional', loadingPct: 3 }, { label: 'Regular', loadingPct: 10 }], isActive: true },
  ],

  rules: [],          // { id, name, conditions (JSON), action, priority, isActive, status, createdBy, createdAt }

  decisionMatrix: {
    id: 'dm1',
    bands: [
      { minScore: 0,  maxScore: 20, decision: 'ACCEPT' },
      { minScore: 21, maxScore: 40, decision: 'ACCEPT_WITH_LOADING' },
      { minScore: 41, maxScore: 70, decision: 'REFER' },
      { minScore: 71, maxScore: 999, decision: 'DECLINE' },
    ],
    isActive: true,
  },

  workbenchNotes: [], // { id, applicationId, decision, notes, decidedBy, decidedAt }

  auditLogs: [],      // { id, userId, action, resourceType, resourceId, before, after, timestamp }
};

module.exports = store;
```

---

## 6. API Routes

All routes return `{ success, data }` or `{ success, error }`.

### Auth
```
POST   /api/auth/login              body: { email, password } → { token, user }
```

### Customer — Applications
```
POST   /api/applications                          Create draft application
GET    /api/applications/:id                      Get application
PUT    /api/applications/:id/personal-details
PUT    /api/applications/:id/lifestyle
PUT    /api/applications/:id/family-history
PUT    /api/applications/:id/claims-history
PUT    /api/applications/:id/disclosures          Save selected disease IDs
GET    /api/applications/:id/questionnaire        Returns questions for selected diseases
PUT    /api/applications/:id/answers
POST   /api/applications/:id/documents            body: { fileName, type, base64 }
POST   /api/applications/:id/submit               Runs rules engine → sets decision
```

### Customer — Reference Data
```
GET    /api/diseases/active                       Disease list for bucket selection
```

### Admin — Disease Master
```
GET    /api/admin/diseases
POST   /api/admin/diseases
PUT    /api/admin/diseases/:id
DELETE /api/admin/diseases/:id
```

### Admin — Questionnaire Builder
```
GET    /api/admin/diseases/:id/questions
POST   /api/admin/diseases/:id/questions
PUT    /api/admin/questions/:id
DELETE /api/admin/questions/:id
PUT    /api/admin/diseases/:id/questions/reorder  body: [{ id, orderIndex }]
```

### Admin — Risk Factors
```
GET    /api/admin/risk-factors
POST   /api/admin/risk-factors
PUT    /api/admin/risk-factors/:id
```

### Admin — Rules Engine
```
GET    /api/admin/rules
POST   /api/admin/rules
PUT    /api/admin/rules/:id
DELETE /api/admin/rules/:id
PATCH  /api/admin/rules/:id/status               body: { isActive }
POST   /api/admin/rules/test                      body: { profile } → { triggered, score, decision }
```

### Admin — Decision Matrix
```
GET    /api/admin/decision-matrix
PUT    /api/admin/decision-matrix                 Replace active bands
```

### Admin — Applications
```
GET    /api/admin/applications                    Query: status, dateFrom, dateTo
GET    /api/admin/applications/:id
```

### Admin — Workbench
```
GET    /api/admin/workbench                       Referred cases only
GET    /api/admin/workbench/:id
POST   /api/admin/workbench/:id/decision          body: { decision, notes }
```

### Admin — Audit
```
GET    /api/admin/audit                           Query: action, userId, dateFrom, dateTo
```

---

## 7. Rules Engine (in `routes/applications.js`)

Simple sequential evaluator — runs on submission:

```js
function evaluateRules(applicationData, store) {
  const { rules, decisionMatrix, riskFactors, diseases } = store;

  // 1. Compute disease risk score
  let diseaseScore = 0;
  for (const diseaseId of applicationData.disclosures) {
    const disease = diseases.find(d => d.id === diseaseId);
    if (disease) diseaseScore += disease.riskWeight;
  }

  // 2. Compute risk factor score (simplified: use submitted lifestyle values)
  let factorScore = 0;
  // (map lifestyle answers to risk factor thresholds → sum loading %)

  const totalScore = diseaseScore + factorScore;

  // 3. Evaluate rules (priority order)
  const activeRules = rules
    .filter(r => r.isActive && r.status === 'ACTIVE')
    .sort((a, b) => a.priority - b.priority);

  for (const rule of activeRules) {
    if (matchesConditions(rule.conditions, applicationData, totalScore)) {
      return { decision: rule.action, riskScore: totalScore, triggeredRule: rule.id };
    }
  }

  // 4. Fallback to decision matrix
  const band = decisionMatrix.bands.find(
    b => totalScore >= b.minScore && totalScore <= b.maxScore
  );
  return { decision: band?.decision ?? 'REFER', riskScore: totalScore, triggeredRule: null };
}
```

---

## 8. UI Design — B2B SaaS Aesthetic

### 8.1 Design Tokens (CSS Variables)

```css
:root {
  /* Brand */
  --color-primary:       #1B4FD8;   /* strong blue — CTAs, active states */
  --color-primary-light: #EEF2FF;   /* tinted backgrounds */
  --color-accent:        #0EA5E9;   /* highlights, badges */

  /* Neutrals */
  --color-bg:            #F8F9FC;   /* page background */
  --color-surface:       #FFFFFF;   /* cards, panels */
  --color-border:        #E2E8F0;   /* dividers, input borders */
  --color-text:          #0F172A;   /* primary text */
  --color-text-muted:    #64748B;   /* labels, helper text */

  /* Status */
  --color-success:       #16A34A;
  --color-warning:       #D97706;
  --color-danger:        #DC2626;
  --color-info:          #0284C7;

  /* Spacing */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  40px;

  /* Type */
  --font-sans: 'Inter', system-ui, sans-serif;
  --text-xs:   11px;
  --text-sm:   13px;
  --text-base: 14px;
  --text-lg:   16px;
  --text-xl:   20px;
  --text-2xl:  24px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
}
```

### 8.2 Admin Layout

```
┌─────────────────────────────────────────────────────────────┐
│  TOPBAR: Daman logo    breadcrumb         avatar + name      │  48px, white, border-bottom
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  SIDEBAR     │   MAIN CONTENT AREA                          │
│  240px       │                                              │
│  bg: white   │   Page title                                 │
│  border-r    │   ─────────────────────────────────────      │
│              │   Content cards / tables / forms             │
│  Nav items:  │                                              │
│  • icon      │                                              │
│  • label     │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### 8.3 Component Patterns

**Stat Card (Dashboard)**
```
┌────────────────────────┐
│  Total Applications    │
│                        │
│  247          ↑ 12%    │
│  [icon]   vs last week │
└────────────────────────┘
bg: white, border, radius-lg, padding: 20px
Number: text-2xl, font-weight: 700, color-text
Label: text-sm, color-text-muted
```

**Table (Applications list)**
```
┌─────┬──────────┬────────┬──────────┬──────────┬──────────┐
│ Ref │ Applicant│  Date  │ Score    │ Status   │ Action   │
├─────┼──────────┼────────┼──────────┼──────────┼──────────┤
│     │          │        │          │ [badge]  │ [button] │
└─────┴──────────┴────────┴──────────┴──────────┴──────────┘
thead: text-xs, uppercase, color-text-muted, border-bottom
rows: text-sm, border-bottom on hover: bg-primary-light
```

**Status Badge**
```css
.badge { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.badge--accepted  { background: #DCFCE7; color: #16A34A; }
.badge--referred  { background: #FEF9C3; color: #CA8A04; }
.badge--declined  { background: #FEE2E2; color: #DC2626; }
.badge--pending   { background: #E0F2FE; color: #0284C7; }
```

**Form Input**
```css
.input {
  width: 100%; padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  color: var(--color-text);
  outline: none;
  transition: border-color 0.15s;
}
.input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(27,79,216,0.1); }
```

**Primary Button**
```css
.btn-primary {
  background: var(--color-primary); color: #fff;
  padding: 8px 16px; border: none; border-radius: var(--radius-sm);
  font-size: var(--text-sm); font-weight: 600; cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover { background: #1740B0; }
```

### 8.4 Customer Portal

- Full-width centered wizard (max-width: 680px)
- Step progress bar at top (numbered circles + connector line)
- Disease bucket selection: 3-column card grid, card toggles on click (border: 2px solid primary when selected)
- Clean, single-column form fields with generous spacing
- No sidebar — distraction-free

### 8.5 Typography

- Font: `Inter` loaded from Google Fonts (one CDN link, no local install)
- Page titles: 20px, weight 700
- Section headings: 16px, weight 600
- Body: 14px, weight 400
- Labels: 13px, weight 500, color-text-muted

---

## 9. Startup

```bash
npm install
node server.js
# Customer portal → http://localhost:3000/customer/
# Admin portal    → http://localhost:3000/admin/
# API             → http://localhost:3000/api/
```

---

## 10. Seeded Test Credentials

| Role | Email | Password |
|------|-------|----------|
| UW Admin | admin@daman.ae | admin123 |
| Underwriter | uw@daman.ae | uw123 |

---

## 11. Limitations (Accepted for This Phase)

| Limitation | Note |
|------------|------|
| Data resets on server restart | In-memory store — acceptable for prototype / dev |
| No file storage | Documents stored as base64 strings in memory |
| No email / SMS | Notifications are in-portal only (status visible in admin) |
| No HTTPS | Run behind a reverse proxy (nginx) for production if needed |
| Single server process | No clustering or load balancing |
