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

// ─── DEMO SEED DATA ──────────────────────────────────────────

const FIRST_NAMES = ['Ahmed','Mohammed','Fatima','Sara','Ali','Omar','Layla','Aisha','Hassan','Zainab','Khaled','Mariam','Yusuf','Noor','Tariq','Hana','Bilal','Rania','Samir','Dina','James','Emily','Michael','Sarah','David','Jessica','Robert','Jennifer','William','Lisa','Abdullah','Noura','Faisal','Maryam','Waleed','Hessa','Rashid','Sheikha','Majid','Amna'];
const LAST_NAMES  = ['Al-Rashidi','Al-Mansoori','Al-Hashimi','Al-Farsi','Al-Mazrouei','Al-Shamsi','Al-Ketbi','Al-Nuaimi','Smith','Johnson','Williams','Brown','Jones','Garcia','Martinez','Anderson','Taylor','Thomas','Lee','Patel','Sharma','Singh','Kumar','Gupta','Al-Balushi','Al-Harthi','Al-Zaabi','Al-Kindi','Nair','Menon'];
const NATIONALITIES = ['Emirati','Indian','Pakistani','British','Egyptian','Filipino','American','Jordanian','Lebanese','Bangladeshi','Omani','Saudi','Kenyan','Sri Lankan','German'];
const GENDERS = ['Male','Female','Male','Male','Female'];

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Disease pools by severity for realistic risk assignment
const LOW_RISK_DISEASES    = ['cv_01','cv_11','cv_12','cv_13','me_03','me_04','me_05','me_06','me_08','re_01','re_06','re_10','re_11','gr_01','gr_02','gr_05','gr_09','gr_11','gr_12','gr_14','gr_17','gr_18','ms_02','ms_05','ms_06','ms_07','ms_09','ms_12','ms_13','np_05','np_06','np_11','np_12','np_15','np_16','on_09'];
const MED_RISK_DISEASES    = ['cv_02','cv_05','cv_07','cv_08','cv_14','me_01','me_02','me_07','me_09','me_10','re_02','re_03','re_04','re_08','re_09','gr_03','gr_04','gr_06','gr_07','gr_10','gr_13','gr_15','gr_20','ms_01','ms_03','ms_04','ms_08','ms_14','np_01','np_07','np_09','np_13','np_17','np_18','np_19','on_10','on_11','on_12','on_13','on_14','on_15','in_02','in_03','in_04','in_05','in_06','in_07','in_08','in_09'];
const HIGH_RISK_DISEASES   = ['cv_03','cv_04','cv_06','cv_09','cv_10','re_05','re_07','gr_08','gr_16','gr_19','np_02','np_03','np_04','np_08','np_10','np_14','ms_10','ms_11','on_01','on_02','on_03','on_04','on_05','on_06','on_07','on_08','in_01'];

const TRIGGERED_RULES_BANK = [
  'Age > 60 → Mandatory Review',
  'Diabetes + HbA1c > 9',
  'Heart Disease + Surgery History',
  'Multiple Chronic Conditions (3+)',
  'BMI > 40 → Refer',
  'Cancer History < 5 Years',
  'HIV/AIDS Disclosure → Decline',
  'Renal Failure → Decline',
  'Pulmonary Fibrosis → Decline',
  'High Risk Score (>70)',
  'Smoker + Cardiovascular Disease',
  'Alzheimer\'s / Dementia → Decline',
  'Liver Cirrhosis → Decline',
];

function seedApplications() {
  const apps = [];
  const baseDate = new Date('2025-01-01');

  // Distribution: 230 apps — Accepted 38%, Referred 28%, Declined 18%, Submitted/Pending 16%
  const statusPool = [
    ...Array(88).fill('ACCEPTED'),
    ...Array(64).fill('REFERRED'),
    ...Array(42).fill('DECLINED'),
    ...Array(36).fill('SUBMITTED'),
  ];

  const decisionMap = { ACCEPTED: 'ACCEPT', DECLINED: 'DECLINE', REFERRED: null };
  const uwNames = ['John Underwriter','Sarah Al-Mansoori','Khalid Rashidi'];

  for (let i = 0; i < 230; i++) {
    const status = statusPool[i];
    const firstName = rnd(FIRST_NAMES);
    const lastName  = rnd(LAST_NAMES);
    const fullName  = `${firstName} ${lastName}`;
    const gender    = rnd(GENDERS);
    const age       = rndInt(22, 72);
    const nationality = rnd(NATIONALITIES);
    const dob = `${String(rndInt(1,28)).padStart(2,'0')}/${String(rndInt(1,12)).padStart(2,'0')}/${2025-age}`;

    // Risk score drives disease selection and status coherence
    let riskScore, diseases;
    if (status === 'ACCEPTED') {
      riskScore = rndInt(5, 38);
      const cnt = rndInt(0, 2);
      diseases = cnt === 0 ? [] : Array.from({length:cnt}, () => rnd(LOW_RISK_DISEASES));
    } else if (status === 'REFERRED') {
      riskScore = rndInt(41, 68);
      const cnt = rndInt(1, 3);
      diseases = Array.from({length:cnt}, () => rnd([...MED_RISK_DISEASES,...LOW_RISK_DISEASES]));
    } else if (status === 'DECLINED') {
      riskScore = rndInt(71, 95);
      const cnt = rndInt(1, 2);
      diseases = Array.from({length:cnt}, () => rnd(HIGH_RISK_DISEASES));
    } else { // SUBMITTED
      riskScore = rndInt(15, 75);
      const cnt = rndInt(0, 3);
      diseases = Array.from({length:cnt}, () => rnd([...LOW_RISK_DISEASES,...MED_RISK_DISEASES]));
    }
    diseases = [...new Set(diseases)]; // dedupe

    // Submission date spread across last 18 months
    const subDate = new Date(baseDate.getTime() + rndInt(0, 540) * 86400000);
    const submittedAt = subDate.toISOString();
    const refNum = `DUW-${String(2025001 + i).replace('2025','25')}`;

    const bmi = parseFloat((rndInt(18,42) + Math.random()).toFixed(1));
    const smoking = rnd(['Never','Ex-smoker','Current','Never','Never','Never']);
    const alcohol  = rnd(['None','Occasional','None','None','Regular']);

    // Triggered rules for referred/declined
    const triggeredRules = (status === 'REFERRED' || status === 'DECLINED')
      ? Array.from({length: rndInt(1,3)}, () => rnd(TRIGGERED_RULES_BANK)).filter((v,i,a) => a.indexOf(v)===i)
      : [];

    const app = {
      id: uuid(),
      referenceNumber: refNum,
      status,
      decision: status === 'ACCEPTED' ? 'ACCEPT' : status === 'DECLINED' ? 'DECLINE' : status === 'REFERRED' ? 'REFER' : null,
      riskScore,
      submittedAt,
      createdAt: submittedAt,
      disclosures: diseases,
      triggeredRules,
      personalDetails: {
        fullName, firstName, lastName, gender, age, dob, nationality,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g,'')}@email.com`,
        mobile: `+971 5${rndInt(0,9)} ${rndInt(1000000,9999999)}`,
        occupation: rnd(['Engineer','Manager','Teacher','Nurse','Accountant','Driver','Technician','Analyst','Doctor','Officer','Consultant','Executive']),
        employer: rnd(['Emirates NBD','Etisalat','ADNOC','Dubai Municipality','Abu Dhabi Health Services','Majid Al Futtaim','Emaar','DP World','RTA','DEWA','ENOC','Emirates Airline']),
        nationality,
        city: rnd(['Dubai','Abu Dhabi','Sharjah','Ajman','Ras Al Khaimah','Fujairah']),
        country: 'UAE',
      },
      lifestyle: {
        smoking, alcohol, bmi,
        activity: rnd(['Sedentary','Light','Moderate','Active']),
        occupation: rnd(['Office','Field','Medical','Transport','Education']),
      },
      familyHistory: {
        heartDisease: rnd([true,false,false,false]),
        diabetes: rnd([true,false,false]),
        cancer: rnd([true,false,false,false,false]),
      },
      claimsHistory: {
        existingInsurance: rnd(['Yes','No','Yes','No','No']),
        hasClaims: rnd(['No','No','Yes','No']),
        claimAmount: rnd([null,null,rndInt(5000,80000),null]),
      },
      documents: rndInt(0,1) === 1 ? [{ fileName: 'Medical_Report.pdf', docType: 'Medical Report' }] : [],
      workbenchDecision: null,
    };

    // For REFERRED: some have already been decided by UW (show as resolved in workbench)
    if (status === 'REFERRED' && rndInt(0,2) === 0) {
      app.workbenchDecision = {
        decision: rnd(['ACCEPT','ACCEPT_WITH_LOADING','DECLINE']),
        notes: rnd([
          'After clinical review, risk is acceptable with standard terms.',
          'Condition well-controlled. Accept with 25% loading on hospital benefit.',
          'Multiple uncontrolled conditions. Risk too high for coverage.',
          'Specialist report reviewed. Refer for further investigation.',
          'BMI and lifestyle factors noted. Accept with premium loading.',
        ]),
        decidedBy: rnd(uwNames),
        decidedAt: new Date(subDate.getTime() + rndInt(1,14) * 86400000).toISOString(),
      };
    }

    apps.push(app);
  }
  return apps;
}

function seedRules() {
  const now = new Date('2025-03-15').toISOString();
  return [
    { id: uuid(), name: 'Age > 60 — Mandatory Review', priority: 10, conditions: { combinator: 'and', rules: [{ field: 'age', op: 'GT', value: 60 }] }, action: 'REFER', isActive: true, createdBy: 'Admin User', createdAt: now },
    { id: uuid(), name: 'High Risk Score — Decline', priority: 20, conditions: { combinator: 'and', rules: [{ field: 'score', op: 'GTE', value: 75 }] }, action: 'DECLINE', isActive: true, createdBy: 'Admin User', createdAt: now },
    { id: uuid(), name: 'Elevated Risk Score — Refer', priority: 30, conditions: { combinator: 'and', rules: [{ field: 'score', op: 'GTE', value: 50 }] }, action: 'REFER', isActive: true, createdBy: 'Admin User', createdAt: now },
    { id: uuid(), name: 'Elderly Applicant with Disease', priority: 40, conditions: { combinator: 'and', rules: [{ field: 'age', op: 'GT', value: 55 }, { field: 'disease', op: 'EQ', value: true }] }, action: 'REFER', isActive: true, createdBy: 'Admin User', createdAt: now },
    { id: uuid(), name: 'Young Healthy — Fast Accept', priority: 50, conditions: { combinator: 'and', rules: [{ field: 'age', op: 'LT', value: 35 }, { field: 'score', op: 'LT', value: 20 }, { field: 'disease', op: 'EQ', value: false }] }, action: 'ACCEPT', isActive: true, createdBy: 'John Underwriter', createdAt: now },
    { id: uuid(), name: 'BMI > 40 — Refer', priority: 60, conditions: { combinator: 'and', rules: [{ field: 'score', op: 'GT', value: 35 }, { field: 'disease', op: 'EQ', value: true }] }, action: 'REFER', isActive: true, createdBy: 'Admin User', createdAt: now },
    { id: uuid(), name: 'Cancer History — Decline', priority: 70, conditions: { combinator: 'and', rules: [{ field: 'score', op: 'GTE', value: 70 }, { field: 'disease', op: 'EQ', value: true }] }, action: 'DECLINE', isActive: true, createdBy: 'Admin User', createdAt: now },
    { id: uuid(), name: 'Diabetes + High Score', priority: 80, conditions: { combinator: 'and', rules: [{ field: 'score', op: 'GT', value: 40 }, { field: 'disease', op: 'EQ', value: true }] }, action: 'REFER', isActive: true, createdBy: 'John Underwriter', createdAt: now },
    { id: uuid(), name: 'Multiple Chronic Conditions', priority: 90, conditions: { combinator: 'and', rules: [{ field: 'score', op: 'GT', value: 45 }, { field: 'disease', op: 'EQ', value: true }] }, action: 'REFER', isActive: true, createdBy: 'Admin User', createdAt: now },
    { id: uuid(), name: 'Heart Disease + Surgery History', priority: 100, conditions: { combinator: 'and', rules: [{ field: 'score', op: 'GT', value: 55 }, { field: 'disease', op: 'EQ', value: true }] }, action: 'REFER', isActive: true, createdBy: 'John Underwriter', createdAt: now },
    { id: uuid(), name: 'HIV / AIDS Disclosure', priority: 15, conditions: { combinator: 'and', rules: [{ field: 'score', op: 'GTE', value: 80 }] }, action: 'DECLINE', isActive: true, createdBy: 'Admin User', createdAt: now },
    { id: uuid(), name: 'Renal Failure — Decline', priority: 18, conditions: { combinator: 'and', rules: [{ field: 'score', op: 'GTE', value: 72 }] }, action: 'DECLINE', isActive: false, createdBy: 'Admin User', createdAt: now },
    { id: uuid(), name: 'Low Risk Accept with Loading', priority: 110, conditions: { combinator: 'and', rules: [{ field: 'score', op: 'GTE', value: 21 }, { field: 'score', op: 'LT', value: 40 }] }, action: 'ACCEPT_WITH_LOADING', isActive: true, createdBy: 'John Underwriter', createdAt: now },
  ];
}

const store = {
  users: [
    { id: 'u1', name: 'Admin User',       email: 'admin@daman.ae', password: 'admin123', role: 'UW_ADMIN' },
    { id: 'u2', name: 'John Underwriter', email: 'uw@daman.ae',    password: 'uw123',    role: 'UNDERWRITER' },
  ],

  applications: seedApplications(),

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

  rules: seedRules(),

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
