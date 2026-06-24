// in-memory store — resets on restart
const { v4: uuid } = require('uuid');

// Standard 9 questions per disease (exact from Excel col headers, row 6)
function stdQs(diseaseId) {
  return [
    { id: `${diseaseId}_q1`, diseaseId, text: 'Have you EVER been diagnosed, treated, or advised about this?', answerType: 'YES_NO', options: [], orderIndex: 1, isActive: true, conditions: [] },
    { id: `${diseaseId}_q2`, diseaseId, text: 'Approximate Year First Diagnosed', answerType: 'NUMBER', options: [], orderIndex: 2, isActive: true, conditions: [] },
    { id: `${diseaseId}_q3`, diseaseId, text: 'Currently receiving treatment? (Yes/No)', answerType: 'YES_NO', options: [], orderIndex: 3, isActive: true, conditions: [] },
    { id: `${diseaseId}_q4`, diseaseId, text: 'Current Status', answerType: 'DROPDOWN', options: ['Stable', 'Under Treatment', 'Surgery Planned', 'Resolved', 'Deteriorating'], orderIndex: 4, isActive: true, conditions: [] },
    { id: `${diseaseId}_q5`, diseaseId, text: 'Name of Specialist / Doctor', answerType: 'TEXT', options: [], orderIndex: 5, isActive: true, conditions: [] },
    { id: `${diseaseId}_q6`, diseaseId, text: 'Hospital / Clinic', answerType: 'TEXT', options: [], orderIndex: 6, isActive: true, conditions: [] },
    { id: `${diseaseId}_q7`, diseaseId, text: 'Country where treated', answerType: 'TEXT', options: [], orderIndex: 7, isActive: true, conditions: [] },
    { id: `${diseaseId}_q8`, diseaseId, text: 'Any complications or related conditions?', answerType: 'TEXT', options: [], orderIndex: 8, isActive: true, conditions: [] },
    { id: `${diseaseId}_q9`, diseaseId, text: 'Medications being taken', answerType: 'TEXT', options: [], orderIndex: 9, isActive: true, conditions: [] },
  ];
}

// ─── DISEASES (exact names from Excel) ──────────────────────

// Disease helper — severity + underwriting fields seeded with sensible defaults
function d(id, name, cohortId, cohort, riskWeight, severity, loadingPct, uwImpact) {
  return { id, name, cohortId, cohort, riskWeight, severity: severity||'MODERATE', loadingPct: loadingPct||riskWeight, uwImpact: uwImpact||'REFER', isActive: true };
}

// Sheet B — Cardiovascular (14 conditions)
const cardiovascular = [
  d('cv_01','Hypertension (High Blood Pressure)',                          'coh_cv','Cardiovascular',20,'LOW',10,'LOAD'),
  d('cv_02','Coronary Artery Disease / Angina (chest pain)',               'coh_cv','Cardiovascular',30,'MODERATE',25,'REFER'),
  d('cv_03','Heart Attack (Myocardial Infarction)',                         'coh_cv','Cardiovascular',40,'HIGH',40,'REFER'),
  d('cv_04','Heart Failure / Cardiomyopathy',                              'coh_cv','Cardiovascular',40,'HIGH',40,'DECLINE'),
  d('cv_05','Arrhythmia (Irregular heartbeat / AF)',                        'coh_cv','Cardiovascular',25,'MODERATE',20,'REFER'),
  d('cv_06','Stroke or Transient Ischaemic Attack (TIA)',                   'coh_cv','Cardiovascular',40,'HIGH',40,'REFER'),
  d('cv_07','Peripheral Vascular Disease',                                  'coh_cv','Cardiovascular',25,'MODERATE',20,'REFER'),
  d('cv_08','Deep Vein Thrombosis (DVT) / Pulmonary Embolism',             'coh_cv','Cardiovascular',30,'MODERATE',25,'REFER'),
  d('cv_09','Congenital Heart Disease',                                     'coh_cv','Cardiovascular',35,'HIGH',35,'REFER'),
  d('cv_10','Pacemaker / ICD / Stent / Any cardiac device or procedure',   'coh_cv','Cardiovascular',30,'MODERATE',25,'REFER'),
  d('cv_11','Varicose Veins (severe / treated)',                            'coh_cv','Cardiovascular',8,'LOW',5,'LOAD'),
  d('cv_12','High Cholesterol / Hyperlipidaemia',                          'coh_cv','Cardiovascular',15,'LOW',10,'LOAD'),
  d('cv_13','Elevated Triglycerides',                                       'coh_cv','Cardiovascular',12,'LOW',8,'LOAD'),
  d('cv_14','Any other heart or blood vessel condition (specify)',           'coh_cv','Cardiovascular',20,'MODERATE',15,'REFER'),
];

// Sheet C — Metabolic (12 conditions)
const metabolic = [
  d('me_01','Diabetes Mellitus — Type 1',                                   'coh_me','Metabolic',30,'MODERATE',25,'REFER'),
  d('me_02','Diabetes Mellitus — Type 2',                                   'coh_me','Metabolic',25,'MODERATE',20,'REFER'),
  d('me_03','Pre-Diabetes / Impaired Fasting Glucose',                      'coh_me','Metabolic',15,'LOW',10,'LOAD'),
  d('me_04','Hypothyroidism (Underactive thyroid)',                          'coh_me','Metabolic',10,'LOW',5,'LOAD'),
  d('me_05',"Hyperthyroidism (Overactive thyroid / Graves' Disease)",       'coh_me','Metabolic',15,'LOW',10,'LOAD'),
  d('me_06','Polycystic Ovary Syndrome (PCOS)',                             'coh_me','Metabolic',10,'LOW',5,'LOAD'),
  d('me_07',"Cushing's Syndrome / Adrenal Disorders",                       'coh_me','Metabolic',25,'MODERATE',20,'REFER'),
  d('me_08','Gout / Hyperuricaemia',                                        'coh_me','Metabolic',10,'LOW',5,'LOAD'),
  d('me_09','Metabolic Syndrome',                                           'coh_me','Metabolic',20,'MODERATE',15,'REFER'),
  d('me_10','Obesity requiring medical treatment (BMI ≥ 30)',               'coh_me','Metabolic',20,'MODERATE',15,'REFER'),
  d('me_11','Growth Hormone Deficiency or Excess',                          'coh_me','Metabolic',20,'MODERATE',15,'REFER'),
  d('me_12','Any other endocrine or metabolic disorder (specify)',           'coh_me','Metabolic',15,'LOW',10,'REFER'),
];

// Sheet D — Respiratory (12 conditions)
const respiratory = [
  d('re_01','Asthma',                                                       'coh_re','Respiratory',15,'LOW',10,'LOAD'),
  d('re_02','Chronic Obstructive Pulmonary Disease (COPD) / Emphysema',     'coh_re','Respiratory',30,'HIGH',30,'REFER'),
  d('re_03','Chronic Bronchitis',                                           'coh_re','Respiratory',20,'MODERATE',15,'REFER'),
  d('re_04','Tuberculosis (TB) — Active or Past',                           'coh_re','Respiratory',25,'MODERATE',20,'REFER'),
  d('re_05','Pulmonary Fibrosis',                                           'coh_re','Respiratory',35,'HIGH',35,'DECLINE'),
  d('re_06','Sleep Apnoea (requiring CPAP or treatment)',                    'coh_re','Respiratory',15,'LOW',10,'LOAD'),
  d('re_07','Cystic Fibrosis',                                              'coh_re','Respiratory',40,'HIGH',40,'DECLINE'),
  d('re_08','Pleural Effusion / Pleurisy (past or current)',                'coh_re','Respiratory',20,'MODERATE',15,'REFER'),
  d('re_09','Pneumothorax (collapsed lung, past or current)',               'coh_re','Respiratory',20,'MODERATE',15,'REFER'),
  d('re_10','Recurrent chest infections / Pneumonia (3+ episodes)',         'coh_re','Respiratory',15,'LOW',10,'LOAD'),
  d('re_11','Sinusitis / Rhinitis (chronic, requiring medication)',          'coh_re','Respiratory',8,'LOW',5,'LOAD'),
  d('re_12','Any other respiratory or ENT condition (specify)',             'coh_re','Respiratory',15,'LOW',10,'REFER'),
];

// Sheet E — Oncology & Blood (15 conditions)
const oncology = [
  d('on_01','Any form of Cancer — please specify type, stage, and year',   'coh_on','Oncology & Blood',50,'HIGH',50,'DECLINE'),
  d('on_02','Leukemia / Lymphoma / Myeloma',                               'coh_on','Oncology & Blood',55,'HIGH',55,'DECLINE'),
  d('on_03','Breast Cancer (current or past)',                              'coh_on','Oncology & Blood',45,'HIGH',45,'DECLINE'),
  d('on_04','Prostate Cancer',                                             'coh_on','Oncology & Blood',45,'HIGH',45,'DECLINE'),
  d('on_05','Colorectal / Bowel Cancer',                                   'coh_on','Oncology & Blood',45,'HIGH',45,'DECLINE'),
  d('on_06','Lung Cancer',                                                 'coh_on','Oncology & Blood',60,'HIGH',60,'DECLINE'),
  d('on_07','Skin Cancer (Melanoma or Non-melanoma)',                      'coh_on','Oncology & Blood',35,'HIGH',35,'REFER'),
  d('on_08','Cervical / Ovarian / Uterine Cancer',                        'coh_on','Oncology & Blood',45,'HIGH',45,'DECLINE'),
  d('on_09','Any benign tumour, polyp, or cyst requiring treatment',       'coh_on','Oncology & Blood',15,'LOW',10,'LOAD'),
  d('on_10','Any abnormal biopsy or FNAC result awaiting treatment',       'coh_on','Oncology & Blood',25,'MODERATE',20,'REFER'),
  d('on_11','Sickle Cell Anaemia',                                         'coh_on','Oncology & Blood',35,'HIGH',35,'REFER'),
  d('on_12','Thalassaemia',                                                'coh_on','Oncology & Blood',30,'MODERATE',25,'REFER'),
  d('on_13','Haemophilia or bleeding disorder',                            'coh_on','Oncology & Blood',35,'HIGH',35,'REFER'),
  d('on_14','Polycythaemia / Thrombocytopenia',                            'coh_on','Oncology & Blood',30,'MODERATE',25,'REFER'),
  d('on_15','Any other blood or oncological condition (specify)',           'coh_on','Oncology & Blood',35,'MODERATE',30,'REFER'),
];

// Sheet F — Neuro & Psych (19 conditions)
const neuroPsych = [
  d('np_01','Epilepsy / Seizure Disorder',                                 'coh_np','Neuro & Psych',25,'MODERATE',20,'REFER'),
  d('np_02','Multiple Sclerosis (MS)',                                      'coh_np','Neuro & Psych',35,'HIGH',35,'DECLINE'),
  d('np_03',"Parkinson's Disease",                                         'coh_np','Neuro & Psych',35,'HIGH',35,'DECLINE'),
  d('np_04',"Alzheimer's Disease / Dementia",                              'coh_np','Neuro & Psych',40,'HIGH',40,'DECLINE'),
  d('np_05','Migraine (chronic, requiring regular medication)',             'coh_np','Neuro & Psych',10,'LOW',5,'LOAD'),
  d('np_06','Peripheral Neuropathy',                                       'coh_np','Neuro & Psych',15,'LOW',10,'LOAD'),
  d('np_07','Myasthenia Gravis',                                           'coh_np','Neuro & Psych',30,'MODERATE',25,'REFER'),
  d('np_08','Brain Tumour (benign or malignant)',                          'coh_np','Neuro & Psych',50,'HIGH',50,'DECLINE'),
  d('np_09','Meningitis / Encephalitis (past, requiring ongoing care)',     'coh_np','Neuro & Psych',25,'MODERATE',20,'REFER'),
  d('np_10','Neuromuscular disorders (e.g., ALS, Muscular Dystrophy)',     'coh_np','Neuro & Psych',30,'HIGH',30,'DECLINE'),
  d('np_11','Depression (diagnosed, on medication)',                        'coh_np','Neuro & Psych',15,'LOW',10,'LOAD'),
  d('np_12','Anxiety Disorder / Panic Disorder',                           'coh_np','Neuro & Psych',12,'LOW',8,'LOAD'),
  d('np_13','Bipolar Disorder',                                            'coh_np','Neuro & Psych',25,'MODERATE',20,'REFER'),
  d('np_14','Schizophrenia / Psychosis',                                   'coh_np','Neuro & Psych',35,'HIGH',35,'DECLINE'),
  d('np_15','Obsessive Compulsive Disorder (OCD)',                         'coh_np','Neuro & Psych',15,'LOW',10,'LOAD'),
  d('np_16','Post-Traumatic Stress Disorder (PTSD)',                       'coh_np','Neuro & Psych',18,'LOW',12,'LOAD'),
  d('np_17','Eating Disorder (Anorexia / Bulimia)',                        'coh_np','Neuro & Psych',25,'MODERATE',20,'REFER'),
  d('np_18','Substance Use Disorder (Alcohol / Drug)',                     'coh_np','Neuro & Psych',30,'MODERATE',25,'REFER'),
  d('np_19','Any other neurological or psychiatric condition (specify)',    'coh_np','Neuro & Psych',20,'MODERATE',15,'REFER'),
];

// Sheet G — GI & Renal (20 conditions)
const giRenal = [
  d('gr_01','Gastro-Oesophageal Reflux Disease (GERD / Acid Reflux)',      'coh_gr','GI & Renal',8,'LOW',5,'LOAD'),
  d('gr_02','Peptic Ulcer (Stomach / Duodenal)',                           'coh_gr','GI & Renal',12,'LOW',8,'LOAD'),
  d('gr_03',"Crohn's Disease",                                             'coh_gr','GI & Renal',25,'MODERATE',20,'REFER'),
  d('gr_04','Ulcerative Colitis',                                          'coh_gr','GI & Renal',25,'MODERATE',20,'REFER'),
  d('gr_05','Irritable Bowel Syndrome (IBS — severe, chronic)',            'coh_gr','GI & Renal',10,'LOW',5,'LOAD'),
  d('gr_06','Hepatitis B (Chronic)',                                        'coh_gr','GI & Renal',30,'MODERATE',25,'REFER'),
  d('gr_07','Hepatitis C (Chronic)',                                        'coh_gr','GI & Renal',30,'MODERATE',25,'REFER'),
  d('gr_08','Liver Cirrhosis / Chronic Liver Disease',                     'coh_gr','GI & Renal',45,'HIGH',45,'DECLINE'),
  d('gr_09','Gallstones / Cholecystitis (treated or pending surgery)',     'coh_gr','GI & Renal',12,'LOW',8,'LOAD'),
  d('gr_10','Pancreatitis (Acute or Chronic)',                             'coh_gr','GI & Renal',25,'MODERATE',20,'REFER'),
  d('gr_11','Coeliac Disease',                                             'coh_gr','GI & Renal',12,'LOW',8,'LOAD'),
  d('gr_12','Haemorrhoids requiring surgery or recurrent',                 'coh_gr','GI & Renal',5,'LOW',3,'LOAD'),
  d('gr_13','Chronic Kidney Disease (CKD) — any stage',                   'coh_gr','GI & Renal',35,'HIGH',35,'REFER'),
  d('gr_14','Kidney Stones (recurrent or requiring treatment)',             'coh_gr','GI & Renal',12,'LOW',8,'LOAD'),
  d('gr_15','Polycystic Kidney Disease',                                   'coh_gr','GI & Renal',30,'MODERATE',25,'REFER'),
  d('gr_16','Renal Failure requiring Dialysis',                            'coh_gr','GI & Renal',50,'HIGH',50,'DECLINE'),
  d('gr_17','Urinary Tract Infections (recurrent, ≥3 per year)',           'coh_gr','GI & Renal',10,'LOW',5,'LOAD'),
  d('gr_18','Prostate Enlargement (BPH) requiring medication',             'coh_gr','GI & Renal',12,'LOW',8,'LOAD'),
  d('gr_19','Kidney / Renal Transplant',                                   'coh_gr','GI & Renal',50,'HIGH',50,'DECLINE'),
  d('gr_20','Any other GI, liver, or kidney condition (specify)',          'coh_gr','GI & Renal',15,'LOW',10,'REFER'),
];

// Sheet H — MSK & Other (14 conditions)
const msk = [
  d('ms_01','Rheumatoid Arthritis',                                        'coh_ms','MSK & Other',25,'MODERATE',20,'REFER'),
  d('ms_02','Osteoarthritis (severe, affecting daily function)',            'coh_ms','MSK & Other',15,'LOW',10,'LOAD'),
  d('ms_03','Ankylosing Spondylitis / Psoriatic Arthritis',                'coh_ms','MSK & Other',20,'MODERATE',15,'REFER'),
  d('ms_04','Systemic Lupus Erythematosus (SLE / Lupus)',                  'coh_ms','MSK & Other',30,'HIGH',30,'REFER'),
  d('ms_05','Osteoporosis / Osteopenia (on treatment)',                    'coh_ms','MSK & Other',15,'LOW',10,'LOAD'),
  d('ms_06','Spondylosis / Disc Herniation / Sciatica',                   'coh_ms','MSK & Other',15,'LOW',10,'LOAD'),
  d('ms_07','Chronic Back or Neck Pain (requiring regular medication)',     'coh_ms','MSK & Other',12,'LOW',8,'LOAD'),
  d('ms_08','Knee / Hip Replacement (past or planned)',                    'coh_ms','MSK & Other',20,'MODERATE',15,'REFER'),
  d('ms_09','Fibromyalgia',                                                'coh_ms','MSK & Other',15,'LOW',10,'LOAD'),
  d('ms_10','Scleroderma / CREST Syndrome',                               'coh_ms','MSK & Other',30,'HIGH',30,'DECLINE'),
  d('ms_11','Vasculitis',                                                  'coh_ms','MSK & Other',30,'HIGH',30,'DECLINE'),
  d('ms_12','Psoriasis (moderate to severe, on systemic treatment)',       'coh_ms','MSK & Other',12,'LOW',8,'LOAD'),
  d('ms_13','Eczema / Dermatitis (severe, on systemic treatment)',         'coh_ms','MSK & Other',8,'LOW',5,'LOAD'),
  d('ms_14','Any other musculoskeletal, autoimmune, or skin condition (specify)', 'coh_ms','MSK & Other',12,'LOW',8,'REFER'),
];

// Sheet I — Infectious (9 conditions)
const infectious = [
  d('in_01','HIV / AIDS',                                                  'coh_in','Infectious',50,'HIGH',50,'DECLINE'),
  d('in_02','Hepatitis B — Chronic (if not declared in GI section)',       'coh_in','Infectious',30,'MODERATE',25,'REFER'),
  d('in_03','Hepatitis C — Chronic (if not declared in GI section)',       'coh_in','Infectious',30,'MODERATE',25,'REFER'),
  d('in_04','Tuberculosis — Active or Past (if not declared in Respiratory section)', 'coh_in','Infectious',25,'MODERATE',20,'REFER'),
  d('in_05','Malaria (recurrent / chronic)',                               'coh_in','Infectious',15,'LOW',10,'LOAD'),
  d('in_06','Typhoid (recurrent)',                                         'coh_in','Infectious',12,'LOW',8,'LOAD'),
  d('in_07','Leprosy (past or current)',                                   'coh_in','Infectious',20,'MODERATE',15,'REFER'),
  d('in_08','Chronic parasitic infections (e.g., Schistosomiasis, Filariasis)', 'coh_in','Infectious',15,'LOW',10,'LOAD'),
  d('in_09','Any other chronic or recurrent infectious disease (specify)', 'coh_in','Infectious',15,'LOW',10,'REFER'),
];

const allDiseases = [
  ...cardiovascular,  // 14
  ...metabolic,       // 12
  ...respiratory,     // 12
  ...oncology,        // 15
  ...neuroPsych,      // 19
  ...giRenal,         // 20
  ...msk,             // 14
  ...infectious,      // 9
]; // Total: 115

const allDiseaseQuestions = allDiseases.flatMap(d => stdQs(d.id)); // 9 per disease

// ─── SECTION QUESTIONS ────────────────────────────────────────
// Sheet A — Personal Details (exact field names from Excel)
const personalQuestions = [
  { id: 'pq_01', section: 'personal', text: 'Full Legal Name', answerType: 'TEXT', options: [], orderIndex: 1, isActive: true, isMandatory: true },
  { id: 'pq_02', section: 'personal', text: 'Date of Birth (DD/MM/YYYY)', answerType: 'DATE', options: [], orderIndex: 2, isActive: true, isMandatory: true },
  { id: 'pq_03', section: 'personal', text: 'Gender (Male / Female / Other)', answerType: 'DROPDOWN', options: ['Male', 'Female', 'Other'], orderIndex: 3, isActive: true, isMandatory: true },
  { id: 'pq_04', section: 'personal', text: 'Marital Status', answerType: 'DROPDOWN', options: ['Single', 'Married', 'Divorced', 'Widowed'], orderIndex: 4, isActive: true, isMandatory: false },
  { id: 'pq_05', section: 'personal', text: 'Nationality', answerType: 'TEXT', options: [], orderIndex: 5, isActive: true, isMandatory: true },
  { id: 'pq_06', section: 'personal', text: 'Passport Number', answerType: 'TEXT', options: [], orderIndex: 6, isActive: true, isMandatory: false },
  { id: 'pq_07', section: 'personal', text: 'National ID / Emirates ID', answerType: 'TEXT', options: [], orderIndex: 7, isActive: true, isMandatory: false },
  { id: 'pq_08', section: 'personal', text: 'Visa / Iqama / Residency No.', answerType: 'TEXT', options: [], orderIndex: 8, isActive: true, isMandatory: false },
  { id: 'pq_09', section: 'personal', text: 'Occupation / Job Title', answerType: 'TEXT', options: [], orderIndex: 9, isActive: true, isMandatory: false },
  { id: 'pq_10', section: 'personal', text: 'Employer / Company Name', answerType: 'TEXT', options: [], orderIndex: 10, isActive: true, isMandatory: false },
  { id: 'pq_11', section: 'personal', text: 'Email Address', answerType: 'TEXT', options: [], orderIndex: 11, isActive: true, isMandatory: true },
  { id: 'pq_12', section: 'personal', text: 'Mobile Number', answerType: 'TEXT', options: [], orderIndex: 12, isActive: true, isMandatory: true },
  { id: 'pq_13', section: 'personal', text: 'Residential Address', answerType: 'TEXT', options: [], orderIndex: 13, isActive: true, isMandatory: false },
  { id: 'pq_14', section: 'personal', text: 'Country of Residence', answerType: 'TEXT', options: [], orderIndex: 14, isActive: true, isMandatory: false },
  { id: 'pq_15', section: 'personal', text: 'City', answerType: 'TEXT', options: [], orderIndex: 15, isActive: true, isMandatory: false },
  { id: 'pq_16', section: 'personal', text: 'Postal / PO Box', answerType: 'TEXT', options: [], orderIndex: 16, isActive: true, isMandatory: false },
];

// Sheet J — J1 Lifestyle & Habits (exact from Excel rows 5-19)
const lifestyleQuestions = [
  { id: 'lq_01', section: 'lifestyle', text: 'Do you currently smoke or use tobacco products (cigarettes, bidi, shisha, chewing tobacco)?', answerType: 'YES_NO', options: [], orderIndex: 1, isActive: true, isMandatory: true },
  { id: 'lq_02', section: 'lifestyle', text: 'If Yes — Type of tobacco:', answerType: 'DROPDOWN', options: ['Cigarettes', 'Bidi', 'Shisha / Hookah', 'Chewing Tobacco', 'E-Cigarette / Vape', 'Pipe', 'Other'], orderIndex: 2, isActive: true, isMandatory: false },
  { id: 'lq_03', section: 'lifestyle', text: 'If Yes — Duration of smoking (years):', answerType: 'NUMBER', options: [], orderIndex: 3, isActive: true, isMandatory: false },
  { id: 'lq_04', section: 'lifestyle', text: 'If Yes — Quantity per day:', answerType: 'NUMBER', options: [], orderIndex: 4, isActive: true, isMandatory: false },
  { id: 'lq_05', section: 'lifestyle', text: 'Have you smoked in the past but quit? If Yes — when did you quit?', answerType: 'TEXT', options: [], orderIndex: 5, isActive: true, isMandatory: false },
  { id: 'lq_06', section: 'lifestyle', text: 'Do you consume alcohol?', answerType: 'YES_NO', options: [], orderIndex: 6, isActive: true, isMandatory: true },
  { id: 'lq_07', section: 'lifestyle', text: 'If Yes — Number of drinks per week:', answerType: 'NUMBER', options: [], orderIndex: 7, isActive: true, isMandatory: false },
  { id: 'lq_08', section: 'lifestyle', text: 'If Yes — Type of alcohol:', answerType: 'DROPDOWN', options: ['Beer', 'Wine', 'Spirits / Liquor', 'Mixed / Other'], orderIndex: 8, isActive: true, isMandatory: false },
  { id: 'lq_09', section: 'lifestyle', text: 'Do you use any recreational drugs or narcotics?', answerType: 'YES_NO', options: [], orderIndex: 9, isActive: true, isMandatory: true },
  { id: 'lq_10', section: 'lifestyle', text: 'Do you participate in high-risk activities? (Extreme sports, diving, motor racing, aviation)', answerType: 'YES_NO', options: [], orderIndex: 10, isActive: true, isMandatory: false },
  { id: 'lq_11', section: 'lifestyle', text: 'If Yes — describe the high-risk activity:', answerType: 'TEXT', options: [], orderIndex: 11, isActive: true, isMandatory: false },
  { id: 'lq_12', section: 'lifestyle', text: 'What is your height (cm)?', answerType: 'NUMBER', options: [], orderIndex: 12, isActive: true, isMandatory: true },
  { id: 'lq_13', section: 'lifestyle', text: 'What is your weight (kg)?', answerType: 'NUMBER', options: [], orderIndex: 13, isActive: true, isMandatory: true },
  { id: 'lq_14', section: 'lifestyle', text: 'Do you follow a special diet or have any nutritional deficiencies?', answerType: 'YES_NO', options: [], orderIndex: 14, isActive: true, isMandatory: false },
];

// Sheet J — J2 Family Medical History (exact from Excel rows 23-33)
const familyQuestions = [
  { id: 'fq_01', section: 'family', text: 'Heart Attack / Coronary Disease', answerType: 'MULTI_SELECT', options: ['Mother', 'Father', 'Sibling(s)', 'Unknown', 'None'], orderIndex: 1, isActive: true, isMandatory: false },
  { id: 'fq_02', section: 'family', text: 'Hypertension (High Blood Pressure)', answerType: 'MULTI_SELECT', options: ['Mother', 'Father', 'Sibling(s)', 'Unknown', 'None'], orderIndex: 2, isActive: true, isMandatory: false },
  { id: 'fq_03', section: 'family', text: 'Stroke', answerType: 'MULTI_SELECT', options: ['Mother', 'Father', 'Sibling(s)', 'Unknown', 'None'], orderIndex: 3, isActive: true, isMandatory: false },
  { id: 'fq_04', section: 'family', text: 'Diabetes (Type 1 or Type 2)', answerType: 'MULTI_SELECT', options: ['Mother', 'Father', 'Sibling(s)', 'Unknown', 'None'], orderIndex: 4, isActive: true, isMandatory: false },
  { id: 'fq_05', section: 'family', text: 'Cancer (specify type if known)', answerType: 'MULTI_SELECT', options: ['Mother', 'Father', 'Sibling(s)', 'Unknown', 'None'], orderIndex: 5, isActive: true, isMandatory: false },
  { id: 'fq_06', section: 'family', text: 'Kidney Disease / Renal Failure', answerType: 'MULTI_SELECT', options: ['Mother', 'Father', 'Sibling(s)', 'Unknown', 'None'], orderIndex: 6, isActive: true, isMandatory: false },
  { id: 'fq_07', section: 'family', text: 'Multiple Sclerosis', answerType: 'MULTI_SELECT', options: ['Mother', 'Father', 'Sibling(s)', 'Unknown', 'None'], orderIndex: 7, isActive: true, isMandatory: false },
  { id: 'fq_08', section: 'family', text: "Alzheimer's / Dementia", answerType: 'MULTI_SELECT', options: ['Mother', 'Father', 'Sibling(s)', 'Unknown', 'None'], orderIndex: 8, isActive: true, isMandatory: false },
  { id: 'fq_09', section: 'family', text: 'Hereditary / Genetic Disorder (specify)', answerType: 'TEXT', options: [], orderIndex: 9, isActive: true, isMandatory: false },
  { id: 'fq_10', section: 'family', text: 'Any other significant hereditary illness', answerType: 'TEXT', options: [], orderIndex: 10, isActive: true, isMandatory: false },
];

// Sheet A — A3 Existing Insurance + A4 Declinations
const claimsQuestions = [
  { id: 'cq_01', section: 'claims', text: 'Do you have any existing health insurance coverage?', answerType: 'YES_NO', options: [], orderIndex: 1, isActive: true, isMandatory: true },
  { id: 'cq_02', section: 'claims', text: 'Insurer Name', answerType: 'TEXT', options: [], orderIndex: 2, isActive: true, isMandatory: false },
  { id: 'cq_03', section: 'claims', text: 'Policy Number', answerType: 'TEXT', options: [], orderIndex: 3, isActive: true, isMandatory: false },
  { id: 'cq_04', section: 'claims', text: 'Type of Coverage', answerType: 'DROPDOWN', options: ['Individual', 'Group / Corporate', 'Family'], orderIndex: 4, isActive: true, isMandatory: false },
  { id: 'cq_05', section: 'claims', text: 'Sum Insured (Currency + Amount)', answerType: 'TEXT', options: [], orderIndex: 5, isActive: true, isMandatory: false },
  { id: 'cq_06', section: 'claims', text: 'Policy Expiry Date', answerType: 'DATE', options: [], orderIndex: 6, isActive: true, isMandatory: false },
  { id: 'cq_07', section: 'claims', text: 'Any claims in last 3 years? (Yes / No — if Yes, describe)', answerType: 'YES_NO', options: [], orderIndex: 7, isActive: true, isMandatory: false },
  { id: 'cq_08', section: 'claims', text: 'Has any insurer previously declined, cancelled, or refused to renew your health insurance policy?', answerType: 'YES_NO', options: [], orderIndex: 8, isActive: true, isMandatory: true },
  { id: 'cq_09', section: 'claims', text: 'Has any insurer ever offered you cover on special terms (e.g., exclusion, higher premium, waiting period)?', answerType: 'YES_NO', options: [], orderIndex: 9, isActive: true, isMandatory: true },
  { id: 'cq_10', section: 'claims', text: 'Are you currently awaiting any pending medical tests, results, surgery, or specialist referral?', answerType: 'YES_NO', options: [], orderIndex: 10, isActive: true, isMandatory: true },
  { id: 'cq_11', section: 'claims', text: 'Have you ever received treatment for or been diagnosed with any condition NOT disclosed in this form?', answerType: 'YES_NO', options: [], orderIndex: 11, isActive: true, isMandatory: true },
  { id: 'cq_12', section: 'claims', text: 'Please provide details (if Yes to any above)', answerType: 'TEXT', options: [], orderIndex: 12, isActive: true, isMandatory: false },
];

const store = {
  users: [
    { id: 'u1', name: 'Admin User',       email: 'admin@daman.ae', password: 'admin123', role: 'UW_ADMIN' },
    { id: 'u2', name: 'John Underwriter', email: 'uw@daman.ae',    password: 'uw123',    role: 'UNDERWRITER' },
  ],

  applications: [],

  // Cohorts — top level of Disease Master hierarchy
  cohorts: [
    { id: 'coh_cv', name: 'Cardiovascular',   description: 'Heart and blood vessel conditions', orderIndex: 1, isActive: true },
    { id: 'coh_me', name: 'Metabolic',         description: 'Endocrine, metabolic and hormonal disorders', orderIndex: 2, isActive: true },
    { id: 'coh_re', name: 'Respiratory',       description: 'Lung, airway and ENT conditions', orderIndex: 3, isActive: true },
    { id: 'coh_on', name: 'Oncology & Blood',  description: 'Cancer and haematological conditions', orderIndex: 4, isActive: true },
    { id: 'coh_np', name: 'Neuro & Psych',     description: 'Neurological and psychiatric conditions', orderIndex: 5, isActive: true },
    { id: 'coh_gr', name: 'GI & Renal',        description: 'Gastrointestinal, liver and kidney conditions', orderIndex: 6, isActive: true },
    { id: 'coh_ms', name: 'MSK & Other',       description: 'Musculoskeletal, autoimmune and skin conditions', orderIndex: 7, isActive: true },
    { id: 'coh_in', name: 'Infectious',        description: 'Chronic and recurrent infectious diseases', orderIndex: 8, isActive: true },
  ],

  diseases: allDiseases,

  questions: allDiseaseQuestions,

  sectionQuestions: [
    ...personalQuestions,
    ...lifestyleQuestions,
    ...familyQuestions,
    ...claimsQuestions,
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
