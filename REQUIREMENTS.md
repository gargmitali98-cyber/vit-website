# Daman Underwriting Platform V2 — Product Requirements Document

**Version:** 2.0  
**Date:** 2026-06-24  
**Status:** Draft  
**Source:** Statement of Work (SOW) + Customer & Admin Portal Scope  

---

## 1. Overview

### 1.1 Product Summary

Daman Underwriting Platform V2 is a digital end-to-end medical underwriting solution for Daman's health insurance products. It replaces paper-based application intake with a fully digital workflow covering pre-policy application, dynamic disclosure questionnaires, automated underwriting decisions, manual review workflows, and a full audit trail.

The platform consists of two portals:
- **Customer Portal** — Self-service application intake for individual applicants
- **Admin Portal (Underwriting Control Center)** — Configuration and decision management for underwriters and administrators

### 1.2 Goals (from SOW)

- Digitalize the individual underwriting journey — no paper applications
- Enable dynamic, adaptive medical questionnaires (reflexive logic)
- Automate underwriting decisions (Accept / Refer / Decline) via a configurable rules engine
- Support manual review workflows for referred cases
- Maintain full audit trails for all decisions, rule changes, and disclosures
- Be self-sufficient for underwriters — rule changes without IT involvement

### 1.3 Non-Goals (Out of Scope for Phase 1)

- Claims adjudication processing (ISG / mSME) — integration point only, not built here
- ML/predictive model integration — rules engine must be ML-ready but ML is not in Phase 1
- Life and Banca product lines — platform must be extensible but only health is in scope
- Mobile native apps (iOS/Android) — web-responsive only in Phase 1
- Interactive chatbot — noted in SOW as future requirement
- AI image reader for paper documents — noted in SOW, not in Phase 1
- Reports & Analytics — optional for Phase 1 per scope

---

## 2. User Personas

| Persona | Description |
|---------|-------------|
| **Applicant (Customer)** | Individual applying for health insurance; completes the digital disclosure and questionnaire |
| **Underwriter** | Insurance staff who reviews referred cases in the Underwriter Workbench |
| **UW Admin** | Senior underwriter or admin who configures rules, disease master, risk factors, and decision matrix |
| **Super Admin** | System administrator who manages user accounts and access levels |

---

## 3. Customer Portal — Functional Requirements

The customer portal is underwriting-focused and collects structured medical disclosure from the applicant. It is a linear, step-by-step form flow.

### 3.1 Step 1 — Personal Details

| ID | Field | Requirement |
|----|-------|-------------|
| CP-PD-01 | Full Name | Required text field |
| CP-PD-02 | Date of Birth / Age | Required; age auto-calculated from DOB |
| CP-PD-03 | Gender | Required; options: Male, Female, Other |
| CP-PD-04 | Nationality | Required dropdown |
| CP-PD-05 | Contact Details | Required: mobile number + email address |

### 3.2 Step 2 — Lifestyle Factors

| ID | Field | Requirement |
|----|-------|-------------|
| CP-LF-01 | Smoking Status | Options: Never / Ex-smoker / Current smoker (with frequency if current) |
| CP-LF-02 | Alcohol Consumption | Options: None / Occasional / Regular (with frequency if regular) |
| CP-LF-03 | Occupation | Free text or searchable dropdown |
| CP-LF-04 | Physical Activity | Options: Sedentary / Light / Moderate / Active |
| CP-LF-05 | Height & Weight | Required; BMI auto-calculated and displayed |

### 3.3 Step 3 — Family Medical History

Customer declares whether immediate family (parents, siblings) has a history of:

| ID | Condition |
|----|-----------|
| CP-FH-01 | Diabetes |
| CP-FH-02 | Hypertension |
| CP-FH-03 | Heart Disease |
| CP-FH-04 | Cancer |
| CP-FH-05 | Stroke |
| CP-FH-06 | Other hereditary conditions (free text) |

Each condition is a Yes / No toggle. "Yes" prompts: relationship to applicant.

### 3.4 Step 4 — Insurance & Claims History

| ID | Field | Requirement |
|----|-------|-------------|
| CP-IH-01 | Existing Insurance | Yes / No |
| CP-IH-02 | Previous Insurer | Text field (shown if existing insurance = Yes) |
| CP-IH-03 | Claims in last 3–5 years | Yes / No |
| CP-IH-04 | Claim Amount | Numeric field (shown if claims = Yes) |
| CP-IH-05 | Previous Loading / Exclusions / Rejections | Yes / No; free text for details |

### 3.5 Step 5 — Disclosure of Good Health (Disease Bucket Selection)

The most critical step. Customer is shown disease category cards and selects only those that apply to them.

| ID | Disease Bucket |
|----|----------------|
| CP-DH-01 | Heart & Blood Pressure |
| CP-DH-02 | Diabetes & Metabolic |
| CP-DH-03 | Respiratory |
| CP-DH-04 | Cancer & Oncology |
| CP-DH-05 | Kidney & Urinary |
| CP-DH-06 | Mental Health |
| CP-DH-07 | Musculoskeletal |
| CP-DH-08 | Neurological |
| CP-DH-09 | Autoimmune |
| CP-DH-10 | Women's Health |
| CP-DH-11 | Other Conditions |

- Disease buckets are driven by the Admin Disease Master — additions/removals in admin reflect here without code changes.
- Customer can select zero buckets (declaring good health).

### 3.6 Step 6 — Dynamic Medical Questionnaire

Triggered only for each disease bucket selected in Step 5. Questions are configured in the Admin Questionnaire Builder. Examples:

**Diabetes selected:**
- Year diagnosed
- Latest HbA1c value
- Current medication
- Insulin usage (Yes/No)
- Complications (neuropathy, retinopathy, nephropathy — multi-select)
- Hospitalization in last 2 years (Yes/No)

**Heart Disease selected:**
- Condition type (e.g., Angina, Heart Attack, Heart Failure — dropdown)
- Procedure history (Angioplasty, Bypass, Stent — multi-select)
- Current medication
- Current status (Stable / Under Treatment / Surgery planned)

Requirements:
| ID | Requirement |
|----|-------------|
| CP-MQ-01 | Only questions for selected disease buckets are shown (reflexive logic). |
| CP-MQ-02 | Within a disease, conditional sub-questions are shown based on prior answers. |
| CP-MQ-03 | All question text, answer options, and conditional logic are configured in the Admin Questionnaire Builder — no hardcoding. |
| CP-MQ-04 | Progress indicator must show the customer how many disease sections remain. |

### 3.7 Step 7 — Document Upload

| ID | Document Type | Requirement |
|----|---------------|-------------|
| CP-DU-01 | Medical Reports | PDF, JPG, PNG; max 10 MB per file |
| CP-DU-02 | Lab Reports | Same |
| CP-DU-03 | Prescriptions | Same |
| CP-DU-04 | Discharge Summaries | Same |
| CP-DU-05 | Investigation Reports | Same |

- Multiple files per document type allowed.
- Upload is optional but prompted if a disease was disclosed.

### 3.8 Step 8 — Review & Submit

| ID | Requirement |
|----|-------------|
| CP-RS-01 | Application summary page shows all answered sections in read-only view. |
| CP-RS-02 | Customer can navigate back to any section to edit before submitting. |
| CP-RS-03 | Declaration statement must be displayed and accepted (checkbox) before submission. |
| CP-RS-04 | Consent to data processing must be accepted (checkbox) before submission. |
| CP-RS-05 | On submission, customer receives a unique Application Reference Number. |
| CP-RS-06 | Confirmation screen shows reference number and expected turnaround time. |
| CP-RS-07 | On submission, underwriting rules engine is triggered automatically. |

---

## 4. Admin Portal — Functional Requirements

The Admin Portal is the Underwriting Control Center. All modules below are in scope for Phase 1.

### 4.1 Dashboard

| ID | Requirement |
|----|-------------|
| AP-DB-01 | Show total application counts: Total / Pending Review / Accepted / Referred / Declined. |
| AP-DB-02 | Show recent activity feed: latest application submissions and status changes. |
| AP-DB-03 | Counts must be real-time (or near real-time, refreshed on page load). |

### 4.2 Disease Master

Manages the disease categories and their underwriting properties.

| ID | Requirement |
|----|-------------|
| AP-DM-01 | Create a new disease with: Name, Cohort/Category, Severity Level, Risk Weight (%). |
| AP-DM-02 | Edit any field on an existing disease. |
| AP-DM-03 | Delete a disease (soft delete; cannot delete if active questionnaires reference it). |
| AP-DM-04 | Assign disease to a cohort (e.g., Diabetes → Metabolic; Hypertension → Cardiovascular). |
| AP-DM-05 | Configure severity levels per disease (e.g., Mild / Moderate / Severe). |
| AP-DM-06 | Configure risk weight % per disease (e.g., Diabetes → 20%, Hypertension → 15%). |
| AP-DM-07 | Changes to disease master are reflected on the Customer Portal disease bucket list. |
| AP-DM-08 | All create/edit/delete actions written to Audit Trail. |

### 4.3 Questionnaire Builder

Manages questions shown in the dynamic medical questionnaire (Step 6 of Customer Portal).

| ID | Requirement |
|----|-------------|
| AP-QB-01 | Create a new question linked to a disease: question text, answer type (text / number / dropdown / multi-select / yes-no / date). |
| AP-QB-02 | Edit question text, answer type, and answer options. |
| AP-QB-03 | Delete a question (soft delete). |
| AP-QB-04 | Reorder questions within a disease via drag-and-drop or manual ordering. |
| AP-QB-05 | Configure conditional logic: IF [question] = [answer] THEN show [next question(s)]. |
| AP-QB-06 | Preview the questionnaire for a disease before publishing. |
| AP-QB-07 | Publish / Unpublish a questionnaire (draft state before it goes live to customers). |
| AP-QB-08 | All changes written to Audit Trail. |

### 4.4 Risk Factor Configuration

Manages non-medical and medical risk factors that contribute to the overall risk score.

| ID | Requirement |
|----|-------------|
| AP-RF-01 | View all configured risk factors (Smoking, Alcohol, BMI, Occupation, Claims History, Family History, etc.). |
| AP-RF-02 | Create a new risk factor with: Name, Type (lifestyle / claims / family history), Thresholds, Weightage (%), Premium Loading %. |
| AP-RF-03 | Edit thresholds, weightage, and loading % on any risk factor. |
| AP-RF-04 | Define threshold bands per factor. Example — BMI: <18.5 = Underweight (5% loading), 18.5–24.9 = Normal (0%), 25–29.9 = Overweight (10%), 30+ = Obese (20%). |
| AP-RF-05 | All changes written to Audit Trail. |

### 4.5 Underwriting Rules Engine

Business rule management for automated decision generation.

| ID | Requirement |
|----|-------------|
| AP-RE-01 | Create a rule with: Name, Conditions (IF clauses), Action (THEN: Accept / Refer / Decline). |
| AP-RE-02 | Conditions support AND / OR logic across: Age, Gender, Disease flags, Questionnaire answers, Risk factor scores, Claims history flags. |
| AP-RE-03 | Edit rule conditions and actions. |
| AP-RE-04 | Delete a rule (soft delete). |
| AP-RE-05 | Rules have priority ordering — higher priority rules evaluated first. |
| AP-RE-06 | Rules can be activated / deactivated without deletion. |
| AP-RE-07 | Testing environment: ability to run a simulated applicant profile through the rule set and see which rules trigger and what decision results. |
| AP-RE-08 | Authority layers: rule publishing requires approval by a senior UW Admin (configurable). |
| AP-RE-09 | All rule changes (create, edit, activate, deactivate, delete) written to Audit Trail. |

### 4.6 Decision Matrix

Configures the score-to-decision mapping.

| ID | Requirement |
|----|-------------|
| AP-DC-01 | Define risk score bands mapped to underwriting outcomes. |
| AP-DC-02 | Supported outcomes: Accept / Accept with Loading / Refer / Decline. |
| AP-DC-03 | Default matrix example: 0–20 = Accept, 21–40 = Accept with Loading, 41–70 = Refer, 71+ = Decline. |
| AP-DC-04 | Admin can edit band ranges and outcome mapping. |
| AP-DC-05 | Only one active decision matrix at a time; changes require approval before activation. |
| AP-DC-06 | All changes written to Audit Trail. |

### 4.7 Application Management

| ID | Requirement |
|----|-------------|
| AP-AM-01 | View all applications in a paginated, searchable list. |
| AP-AM-02 | Filter applications by: status, date range, decision type, assigned underwriter. |
| AP-AM-03 | View full customer response for any application (read-only). |
| AP-AM-04 | View all uploaded documents for an application with download option. |
| AP-AM-05 | Track application status: Submitted → Rules Evaluated → Accepted / Referred / Declined. |
| AP-AM-06 | Search by applicant name, reference number, or contact details. |

### 4.8 Underwriter Workbench

For manual review of referred cases only.

| ID | Requirement |
|----|-------------|
| AP-UW-01 | Show all referred applications in a queue, sorted by submission date. |
| AP-UW-02 | Each case shows: Customer Summary, Disclosed Medical Conditions, Risk Factors Triggered, Rules Triggered, Uploaded Documents. |
| AP-UW-03 | Underwriter can take one of four actions: Accept / Accept with Loading / Refer (to senior) / Decline. |
| AP-UW-04 | Underwriter must enter a mandatory written justification/notes before recording a decision. |
| AP-UW-05 | Decision and notes are locked after submission (immutable for audit). |
| AP-UW-06 | Underwriter can request additional information from the customer (triggers a notification). |
| AP-UW-07 | Cases can be assigned to a specific underwriter by a UW Admin. |
| AP-UW-08 | All decisions written to Audit Trail. |

### 4.9 Audit Trail

| ID | Requirement |
|----|-------------|
| AP-AT-01 | Capture all configuration changes: Disease Master, Questionnaire, Risk Factors, Rules Engine, Decision Matrix. |
| AP-AT-02 | Capture all user activities: login, logout, page access, record views. |
| AP-AT-03 | Capture all rule changes: who changed, what changed (before/after values), when. |
| AP-AT-04 | Capture all underwriting decisions: application ID, decision, notes, decided by, timestamp. |
| AP-AT-05 | Capture all application history: status transitions and timestamps. |
| AP-AT-06 | Audit trail is read-only — no record can be edited or deleted. |
| AP-AT-07 | Audit trail is searchable and filterable by: date range, user, action type, record type. |
| AP-AT-08 | Audit trail entries must be exportable to CSV. |

---

## 5. Non-Functional Requirements (from SOW)

### 5.1 Security & Data Privacy

| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | Member data confidentiality — PII and medical data must be encrypted at rest and in transit. |
| NFR-SEC-02 | Daman data must be protected from external market access — no public-facing data exposure. |
| NFR-SEC-03 | Full audit trail for all decisions, rules, and disclosures (see Section 4.9). |
| NFR-SEC-04 | Role-based access control — UW Admins cannot access Underwriter Workbench queues of other regions without permission. |
| NFR-SEC-05 | All data in transit via TLS 1.2+. |

### 5.2 Integration

| ID | Requirement |
|----|-------------|
| NFR-INT-01 | Integration with Daman core systems and HIP (Health Insurance Platform). |
| NFR-INT-02 | Rules engine must expose hooks for future ML/predictive model integration without architectural change. |
| NFR-INT-03 | Claims system integration point: expose disclosure data to allow claims adjudication of ISG and mSME claims based on disclosures. |
| NFR-INT-04 | Renewal integration: LFR (Last Few Renewals) rejection data must be pulled from Daman database at renewal time to control underpricing. |

### 5.3 Self-Sufficiency

| ID | Requirement |
|----|-------------|
| NFR-SS-01 | Underwriters must be able to build and manage rules without IT involvement. |
| NFR-SS-02 | All configuration (disease master, questionnaire, risk factors, rules, decision matrix) must be manageable via the Admin Portal UI. |
| NFR-SS-03 | Authority layers must ensure changes go through approval before going live. |

### 5.4 Digitalization

| ID | Requirement |
|----|-------------|
| NFR-DIG-01 | Individual journey fully digital — no paper application acceptance in Phase 1. |
| NFR-DIG-02 | Front-end salespeople readiness — portal must be usable by sales staff on behalf of customers. |
| NFR-DIG-03 | Technology-ready architecture to support mobile apps and iPad in future phases. |

---

## 6. Acceptance Criteria Samples

**CP-DH (Disease Bucket Selection)**
- Given a customer on Step 5, when they select "Diabetes & Metabolic", then Step 6 shows only the Diabetes questionnaire section; no questions from other disease buckets appear.

**AP-RE-07 (Rules Engine Test Environment)**
- Given a UW Admin on the Rules Engine page, when they enter a simulated applicant profile (age 62, Diabetes = Yes) and run the test, then the system shows which rules matched, the computed risk score, and the resulting decision — without creating a real application.

**AP-AT-03 (Rule Change Audit)**
- Given a UW Admin who edits a rule's condition, when the edit is saved, then the audit trail records: admin user ID, timestamp, rule ID, previous condition value, and new condition value — and this record cannot be edited or deleted.

---

## 7. Glossary

| Term | Definition |
|------|------------|
| UW | Underwriting / Underwriter |
| LFR | Last Few Renewals — historical rejection data used at renewal |
| HIP | Health Insurance Platform — Daman's core insurance system |
| ISG | Individual Small Group insurance product |
| mSME | Micro Small & Medium Enterprise insurance product |
| Reflexive Logic | Question logic where subsequent questions are shown or hidden based on prior answers |
| Risk Weight | Percentage contribution of a disease or factor to the overall risk score |
| Referred Case | Application that cannot be auto-decided and requires manual underwriter review |
| Decision Matrix | Score-band-to-outcome mapping table used by the rules engine |
| Audit Trail | Immutable log of all system actions, changes, and decisions |
