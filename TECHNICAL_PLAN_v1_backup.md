# Daman Underwriting Platform V2 — Technical Plan

**Version:** 2.0  
**Date:** 2026-06-24  
**Status:** Draft  
**Source:** SOW + Customer Portal & Admin Portal Scope  

---

## 1. System Overview

The platform is two web portals backed by a shared API and database:

| Portal | Users | Purpose |
|--------|-------|---------|
| **Customer Portal** | Applicants, Sales Staff | Digital medical disclosure + application submission |
| **Admin Portal** | Underwriters, UW Admins, Super Admin | UW configuration, rule management, manual review, audit |

---

## 2. High-Level Architecture

```
┌─────────────────────────────┐   ┌─────────────────────────────┐
│      Customer Portal        │   │        Admin Portal          │
│  (Next.js — public-facing)  │   │  (Next.js — internal-only)  │
└──────────────┬──────────────┘   └──────────────┬──────────────┘
               │                                  │
               └──────────────┬───────────────────┘
                              │ HTTPS / REST (JWT)
                 ┌────────────▼────────────┐
                 │       API Server        │
                 │  (NestJS / Node.js)     │
                 │                         │
                 │  ┌─────────────────┐    │
                 │  │  UW Rules Engine│    │
                 │  │  (in-process)   │    │
                 │  └─────────────────┘    │
                 └────────────┬────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
   ┌──────▼──────┐   ┌────────▼──────┐   ┌───────▼──────┐
   │ PostgreSQL  │   │     Redis     │   │   AWS S3     │
   │ (primary DB)│   │ (session/cache│   │ (documents)  │
   └─────────────┘   └───────────────┘   └──────────────┘
          │
   ┌──────▼──────────────────────────────┐
   │     Daman Core Systems / HIP        │
   │  (integration via REST/API adapter) │
   └─────────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend (Both Portals)

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 14 (App Router) | SSR, file-based routing, TypeScript-first |
| Language | TypeScript 5 | Type safety across forms and API contracts |
| UI Components | shadcn/ui + Tailwind CSS | Accessible primitives, no design overhead |
| State — Server | TanStack Query (React Query) | API data fetching, caching, invalidation |
| State — Client | Zustand | Step-form state, wizard progress |
| Forms | React Hook Form + Zod | Schema-validated multi-step form |
| Drag & Drop (Questionnaire Builder) | dnd-kit | Reordering questions in admin |
| Rich Condition Builder (Rules Engine) | react-querybuilder | Visual AND/OR rule construction |
| Testing | Vitest + React Testing Library | Unit + component tests |

### 3.2 Backend

| Layer | Choice | Reason |
|-------|--------|--------|
| Runtime | Node.js 20 LTS | Stable, LTS support |
| Framework | NestJS 10 | Structured modules, DI, guards, pipes |
| Language | TypeScript 5 | Shared types with frontend possible |
| ORM | Prisma 5 | Type-safe queries, migration management |
| Auth | Passport.js (JWT strategy) | Standard, extensible to SAML for SSO later |
| Queue | BullMQ (Redis) | Async: rules evaluation, notification dispatch |
| Validation | class-validator + Zod | Runtime input validation |
| Testing | Jest + Supertest | Unit + integration tests |

### 3.3 Infrastructure

| Component | Choice |
|-----------|--------|
| Cloud | AWS |
| App Hosting | ECS Fargate (containerized) |
| Database | AWS RDS PostgreSQL 15 |
| Cache / Queue | AWS ElastiCache (Redis 7) |
| Document Storage | AWS S3 (private bucket, signed URLs) |
| CDN | AWS CloudFront (static assets) |
| Secrets | AWS Secrets Manager |
| Monitoring | AWS CloudWatch + Sentry (error tracking) |
| CI/CD | GitHub Actions |

---

## 4. Repository & Folder Structure

```
daman-uw-platform/
├── apps/
│   ├── customer-portal/          # Next.js — customer-facing
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/       # Login (if sales-staff login needed)
│   │       │   └── apply/        # Multi-step application wizard
│   │       │       ├── personal-details/
│   │       │       ├── lifestyle/
│   │       │       ├── family-history/
│   │       │       ├── claims-history/
│   │       │       ├── disclosure/        # Disease bucket selection
│   │       │       ├── questionnaire/     # Dynamic per-disease questions
│   │       │       ├── documents/
│   │       │       └── review-submit/
│   │       ├── components/
│   │       │   ├── wizard/        # Step progress, navigation
│   │       │   ├── disclosure/    # Disease card grid
│   │       │   └── questionnaire/ # Dynamic question renderer
│   │       └── lib/
│   │           ├── api/           # TanStack Query hooks
│   │           └── store/         # Zustand — wizard state
│   │
│   └── admin-portal/             # Next.js — internal only
│       └── src/
│           ├── app/
│           │   ├── (auth)/
│           │   └── (dashboard)/
│           │       ├── dashboard/
│           │       ├── disease-master/
│           │       ├── questionnaire-builder/
│           │       ├── risk-factors/
│           │       ├── rules-engine/
│           │       ├── decision-matrix/
│           │       ├── applications/
│           │       ├── workbench/
│           │       └── audit-trail/
│           ├── components/
│           │   ├── rule-builder/  # Visual condition builder
│           │   ├── workbench/     # Case review components
│           │   └── shared/
│           └── lib/
│
├── apps/api/                     # NestJS backend
│   └── src/
│       ├── auth/
│       ├── applications/         # Application lifecycle
│       ├── disclosure/           # Disease buckets + questionnaire answers
│       ├── disease-master/
│       ├── questionnaire/        # Question CRUD + conditional logic
│       ├── risk-factors/
│       ├── rules-engine/         # Rule CRUD + evaluation engine
│       ├── decision-matrix/
│       ├── workbench/            # Underwriter manual review
│       ├── documents/            # S3 upload + signed URL
│       ├── audit/                # Audit trail writes + reads
│       ├── notifications/        # Status change notifications
│       ├── integrations/         # Daman HIP adapter
│       └── common/
│           ├── guards/           # JWT + RBAC guards
│           ├── decorators/
│           └── filters/
│
├── packages/
│   └── shared-types/             # TypeScript types shared across apps
│
└── prisma/
    ├── schema.prisma
    └── migrations/
```

---

## 5. Database Schema

```prisma
// Core application

model Application {
  id              String   @id @default(uuid())
  referenceNumber String   @unique
  status          ApplicationStatus
  submittedAt     DateTime?
  decidedAt       DateTime?
  decision        Decision?
  riskScore       Float?
  // relations
  personalDetails PersonalDetails?
  lifestyleData   LifestyleData?
  familyHistory   FamilyHistory[]
  claimsHistory   ClaimsHistory?
  disclosures     Disclosure[]        // selected disease buckets
  questionAnswers QuestionAnswer[]
  documents       ApplicationDocument[]
  workbenchNotes  WorkbenchNote[]
  auditEntries    AuditLog[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum ApplicationStatus {
  DRAFT
  SUBMITTED
  RULES_EVALUATED
  ACCEPTED
  REFERRED
  DECLINED
}

enum Decision {
  ACCEPT
  ACCEPT_WITH_LOADING
  REFER
  DECLINE
}

// Disease master

model Disease {
  id             String   @id @default(uuid())
  name           String
  cohort         String               // e.g. "Metabolic", "Cardiovascular"
  riskWeight     Float                // percentage
  severityLevels Json                 // ["Mild", "Moderate", "Severe"]
  isActive       Boolean  @default(true)
  questions      Question[]
  disclosures    Disclosure[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

// Questionnaire

model Question {
  id              String       @id @default(uuid())
  diseaseId       String
  disease         Disease      @relation(fields: [diseaseId], references: [id])
  text            String
  answerType      AnswerType   // TEXT | NUMBER | DROPDOWN | MULTI_SELECT | YES_NO | DATE
  options         Json?        // for DROPDOWN / MULTI_SELECT
  orderIndex      Int
  isActive        Boolean      @default(true)
  conditions      QuestionCondition[]  // conditional display logic
  answers         QuestionAnswer[]
}

enum AnswerType {
  TEXT
  NUMBER
  DROPDOWN
  MULTI_SELECT
  YES_NO
  DATE
}

model QuestionCondition {
  id              String   @id @default(uuid())
  questionId      String   // question to show
  question        Question @relation(fields: [questionId], references: [id])
  triggerQuestionId String // IF this question...
  triggerAnswer   String   // ...equals this answer
}

// Risk factors

model RiskFactor {
  id            String   @id @default(uuid())
  name          String
  type          String   // LIFESTYLE | CLAIMS | FAMILY_HISTORY | MEDICAL
  thresholds    Json     // [{min, max, label, loadingPct}]
  weightage     Float
  isActive      Boolean  @default(true)
  updatedAt     DateTime @updatedAt
}

// UW Rules

model UWRule {
  id          String     @id @default(uuid())
  name        String
  conditions  Json       // structured condition tree (AND/OR)
  action      Decision
  priority    Int
  isActive    Boolean    @default(true)
  status      RuleStatus @default(DRAFT)
  createdBy   String
  approvedBy  String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

enum RuleStatus {
  DRAFT
  PENDING_APPROVAL
  ACTIVE
  INACTIVE
}

// Decision matrix

model DecisionMatrix {
  id        String   @id @default(uuid())
  bands     Json     // [{minScore, maxScore, decision}]
  isActive  Boolean  @default(false)
  createdAt DateTime @default(now())
}

// Audit trail

model AuditLog {
  id            String   @id @default(uuid())
  userId        String
  action        String   // RULE_CREATED | DISEASE_EDITED | DECISION_MADE | etc.
  resourceType  String
  resourceId    String
  before        Json?
  after         Json?
  applicationId String?
  ipAddress     String?
  timestamp     DateTime @default(now())
}

// Users

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      UserRole
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}

enum UserRole {
  UNDERWRITER
  UW_ADMIN
  SUPER_ADMIN
}
```

---

## 6. API Design

### 6.1 Base URL

```
/api/v1/
```

### 6.2 Customer Portal APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/applications` | Create a new application (returns application ID) |
| GET | `/applications/:id` | Get application draft state |
| PUT | `/applications/:id/personal-details` | Save personal details step |
| PUT | `/applications/:id/lifestyle` | Save lifestyle step |
| PUT | `/applications/:id/family-history` | Save family history step |
| PUT | `/applications/:id/claims-history` | Save claims history step |
| PUT | `/applications/:id/disclosures` | Save selected disease buckets |
| GET | `/applications/:id/questionnaire` | Get dynamic questions for selected diseases |
| PUT | `/applications/:id/answers` | Save questionnaire answers |
| POST | `/applications/:id/documents` | Upload document (multipart) |
| DELETE | `/applications/:id/documents/:docId` | Remove uploaded document |
| POST | `/applications/:id/submit` | Final submission → triggers rules engine |
| GET | `/diseases/active` | Get active disease buckets for customer portal |

### 6.3 Admin — Disease Master APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/diseases` | List all diseases |
| POST | `/admin/diseases` | Create disease |
| PUT | `/admin/diseases/:id` | Update disease |
| DELETE | `/admin/diseases/:id` | Soft delete disease |

### 6.4 Admin — Questionnaire APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/diseases/:id/questions` | List questions for a disease |
| POST | `/admin/diseases/:id/questions` | Create question |
| PUT | `/admin/questions/:id` | Update question |
| DELETE | `/admin/questions/:id` | Soft delete question |
| PUT | `/admin/diseases/:id/questions/reorder` | Update question order |
| POST | `/admin/questions/:id/conditions` | Add conditional logic |
| GET | `/admin/diseases/:id/preview` | Preview questionnaire |

### 6.5 Admin — Risk Factors APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/risk-factors` | List all risk factors |
| POST | `/admin/risk-factors` | Create risk factor |
| PUT | `/admin/risk-factors/:id` | Update thresholds / weightage |

### 6.6 Admin — Rules Engine APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/rules` | List all rules |
| POST | `/admin/rules` | Create rule |
| PUT | `/admin/rules/:id` | Update rule |
| DELETE | `/admin/rules/:id` | Soft delete rule |
| PATCH | `/admin/rules/:id/status` | Activate / deactivate rule |
| PUT | `/admin/rules/priority` | Reorder rule priority |
| POST | `/admin/rules/test` | Test rules against a simulated profile |
| POST | `/admin/rules/:id/approve` | UW Admin approves rule for activation |

### 6.7 Admin — Decision Matrix APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/decision-matrix` | Get active decision matrix |
| POST | `/admin/decision-matrix` | Create new matrix version |
| POST | `/admin/decision-matrix/:id/activate` | Activate a matrix version |

### 6.8 Admin — Applications APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/applications` | List all applications (filterable) |
| GET | `/admin/applications/:id` | Full application detail |
| GET | `/admin/applications/:id/documents/:docId` | Signed URL for document download |

### 6.9 Admin — Workbench APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/workbench` | List referred cases queue |
| GET | `/admin/workbench/:id` | Case detail with triggered rules and risk factors |
| POST | `/admin/workbench/:id/decision` | Record underwriter decision + notes |
| POST | `/admin/workbench/:id/assign` | Assign case to underwriter |
| POST | `/admin/workbench/:id/request-info` | Request additional info from customer |

### 6.10 Admin — Audit Trail APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/audit` | List audit entries (filterable by date, user, type) |
| GET | `/admin/audit/export` | Export audit entries as CSV |

### 6.11 Standard Response Envelope

```json
{
  "success": true,
  "data": { },
  "meta": { "page": 1, "limit": 20, "total": 80 }
}
```

```json
{
  "success": false,
  "error": {
    "code": "RULE_NOT_FOUND",
    "message": "The requested rule does not exist.",
    "statusCode": 404
  }
}
```

---

## 7. Underwriting Rules Engine — Design

The rules engine is an in-process NestJS service (not a separate microservice). This keeps Phase 1 simple while allowing extraction later.

### 7.1 Evaluation Flow

```
Application submitted
        │
        ▼
1. Compute Risk Factor Scores
   (BMI band → loading %, Smoking → loading %, Claims history → loading %)
        │
        ▼
2. Compute Disease Risk Scores
   (each disclosed disease × its risk weight from Disease Master)
        │
        ▼
3. Sum Total Risk Score
        │
        ▼
4. Evaluate UW Rules (priority order)
   IF any rule condition matches → apply rule action (Accept / Refer / Decline)
   First matching rule wins
        │
        ▼
5. If no rule matched → look up Total Risk Score in Decision Matrix
   → return Decision
        │
        ▼
6. Save Decision + triggered rules to Application record
7. Write Audit Log entry
8. Update Application status
```

### 7.2 Rule Condition Schema (stored as JSON)

```json
{
  "operator": "AND",
  "conditions": [
    { "field": "age", "op": "GT", "value": 60 },
    {
      "operator": "OR",
      "conditions": [
        { "field": "disease.DIABETES", "op": "EQ", "value": true },
        { "field": "riskFactor.BMI.band", "op": "EQ", "value": "OBESE" }
      ]
    }
  ]
}
```

Supported fields: `age`, `gender`, `disease.<diseaseId>`, `riskFactor.<factorName>.score`, `claimsHistory.hasRejection`, `claimsHistory.claimAmount`, `familyHistory.<condition>`

Supported operators: `EQ`, `NEQ`, `GT`, `GTE`, `LT`, `LTE`, `IN`, `NOT_IN`

### 7.3 ML-Readiness Hook

The rules engine calls an `evaluateML(applicationData)` stub before Step 4. In Phase 1 this returns `null` (no-op). When ML is integrated, it returns a score or decision recommendation that can be factored into Step 3 or as an additional rule condition. No architectural change required.

---

## 8. Document Upload Flow

```
Customer selects file
        │
        ▼
Frontend validates: type (PDF/JPG/PNG), size (≤ 10 MB)
        │
        ▼
POST /applications/:id/documents (multipart)
        │
        ▼
API generates a pre-signed S3 PUT URL (15-min TTL)
        │
        ▼
Frontend uploads directly to S3 using pre-signed URL
        │
        ▼
Frontend calls POST /applications/:id/documents/confirm
        │
        ▼
API records document metadata in DB (s3Key, fileName, uploadedAt)
```

- S3 bucket is private; all downloads are via pre-signed GET URLs (15-min TTL)
- Document metadata stored in `ApplicationDocument` table

---

## 9. RBAC Model

| Role | Permissions |
|------|-------------|
| `UNDERWRITER` | View workbench queue, view application detail, record decisions, request additional info |
| `UW_ADMIN` | All UNDERWRITER permissions + full CRUD on Disease Master, Questionnaire, Risk Factors, Rules (with self-approval or approval of others depending on config), Decision Matrix, Audit Trail read |
| `SUPER_ADMIN` | All UW_ADMIN permissions + user management, system configuration |

Implementation:
- NestJS `@Roles()` decorator + `RolesGuard` on every admin route
- Resource-level checks (underwriter can only action cases assigned to them, configurable)

---

## 10. Audit Trail — Implementation

Every write operation in the system calls a shared `AuditService.log()` method:

```typescript
auditService.log({
  userId: currentUser.id,
  action: 'RULE_UPDATED',
  resourceType: 'UWRule',
  resourceId: rule.id,
  before: previousRuleSnapshot,
  after: updatedRuleSnapshot,
  ipAddress: req.ip,
});
```

- Audit writes are fire-and-forget (async, queued via BullMQ) so they never block the primary operation
- `AuditLog` table has no UPDATE or DELETE permissions at DB level (enforced via Prisma middleware)

---

## 11. CI/CD Pipeline

```
On Pull Request:
  1. Lint (ESLint + Prettier)
  2. Type check (tsc --noEmit)
  3. Unit tests
  4. Build check

On Merge to main:
  5. Build Docker images (customer-portal, admin-portal, api)
  6. Push to AWS ECR
  7. Deploy to Staging (ECS rolling update)
  8. Integration test run
  9. Manual approval gate
  10. Deploy to Production
```

---

## 12. Delivery Milestones

| Milestone | Scope | Duration |
|-----------|-------|----------|
| **M0 — Foundation** | Monorepo setup, CI/CD, DB schema, auth (JWT + RBAC), shared component library baseline | Week 1–2 |
| **M1 — Customer Portal: Steps 1–4** | Personal Details, Lifestyle, Family History, Claims History form steps + draft save | Week 3–5 |
| **M2 — Customer Portal: Steps 5–8** | Disease bucket selection, dynamic questionnaire renderer, document upload, review & submit | Week 6–9 |
| **M3 — Admin: Disease Master + Questionnaire Builder** | Full CRUD on diseases, question builder with conditional logic, preview | Week 8–11 |
| **M4 — Admin: Risk Factors + Decision Matrix** | Risk factor configuration with threshold bands, decision matrix management | Week 10–12 |
| **M5 — Rules Engine** | Rule builder UI, rule evaluation engine, test environment, approval workflow | Week 11–14 |
| **M6 — Admin: Application Management + Workbench** | Application list/search/filter, case detail view, underwriter workbench with decision recording | Week 13–16 |
| **M7 — Audit Trail + Integration** | Audit trail UI and export, Daman HIP integration adapter, LFR renewal data pull | Week 15–17 |
| **M8 — Hardening + UAT** | Security review, performance testing, bug fixes, UAT with underwriting team | Week 18–20 |
| **M9 — Production Launch** | Staging sign-off, production deployment, go-live monitoring | Week 21 |

> Note: M3 and M5 overlap with M1–M2 intentionally — admin configuration must be ready before customer portal questionnaires can be fully tested end-to-end.

---

## 13. Key Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Daman HIP / Core system API not available | High — LFR data and policy data cannot be pulled | Define API contract in M0; build with mock adapter first |
| Rules engine performance on complex AND/OR trees | Medium — large rule sets could slow evaluation | Benchmark with realistic rule volumes in M5; cache evaluated profiles in Redis |
| Questionnaire conditional logic complexity | Medium — deeply nested conditions are hard to debug | Build test-preview in admin; add condition validation on save |
| Audit trail write volume at scale | Low — high application volumes generate many rows | BullMQ async writes; separate audit DB schema with partition by month if needed |

---

## 14. Local Development Setup

```bash
# Prerequisites: Node 20, Docker

git clone https://github.com/your-org/daman-uw-platform.git
cd daman-uw-platform

# Start backing services
docker compose up -d        # postgres, redis, localstack (S3)

# Install dependencies
npm install                 # (npm workspaces / turborepo)

# Run DB migrations
cd apps/api && npx prisma migrate dev

# Start all apps in dev mode
npm run dev                 # starts api + customer-portal + admin-portal concurrently
```

### Key Environment Variables

```env
# API
DATABASE_URL=postgresql://user:pass@localhost:5432/daman_uw
REDIS_URL=redis://localhost:6379
JWT_SECRET=<secret>
AWS_S3_BUCKET=daman-uw-documents
AWS_REGION=ap-south-1
AWS_ENDPOINT=http://localhost:4566   # LocalStack in dev

# Customer Portal
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Admin Portal
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```
