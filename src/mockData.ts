/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WhitelistUser, Patient, LabTest, LabCatalogItem, MedicationDispense, PharmacyItem, DutyAllocation, LeaveRequest, Message, Appointment, Expense } from './types';
import { fullPharmacyStock } from './fullPharmacyStock';

// Helper to load or seed localStorage
const getStored = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const isProd = localStorage.getItem('hosp_is_production_live') === 'true';
  const item = localStorage.getItem(key);
  if (item) {
    try {
      const parsed = JSON.parse(item);
      if (!isProd && key === 'hosp_patients' && Array.isArray(parsed) && parsed.length < 15) {
        console.log("Upgraded patient seed dataset detected (< 15 patients). Upgrading local storage to 30 patients...");
        localStorage.removeItem('hosp_patients');
        localStorage.removeItem('hosp_lab_tests');
        localStorage.removeItem('hosp_dispenses');
        localStorage.removeItem('hosp_appointments');
        return defaultValue;
      }
      return parsed as T;
    } catch (e) {
      console.error("Error parsing key: ", key, e);
    }
  }
  if (isProd) {
    if (key === 'hosp_whitelist') return defaultWhitelist as unknown as T;
    if (key === 'hosp_pharmacy_stock' || key === 'hosp_lab_catalog') return defaultValue;
    return [] as unknown as T;
  }
  return defaultValue;
};

const saveStored = <T>(key: string, data: T) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// Seeding Default Whitelist
export const defaultWhitelist: WhitelistUser[] = [
  { email: 'gmaurice101@gmail.com', name: 'Dr. Maurice G. (Admin)', role: 'Admin' },
  { email: 'admin@tumutumu.org', name: 'Dr. Beatrice Wanjiku', role: 'Admin' },
  { email: 'reception@tumutumu.org', name: 'Mary Wangari (Records)', role: 'Reception' },
  { email: 'doctor@tumutumu.org', name: 'Dr. James Kinyua', role: 'Doctor' },
  { email: 'lab@tumutumu.org', name: 'Peter Kagiri (Lab Tech)', role: 'Lab' },
  { email: 'pharmacy@tumutumu.org', name: 'Susan Muthoni (Pharmacist)', role: 'Pharmacy' }
];

// Seeding Default Patients
export const defaultPatients: Patient[] = [
  {
    id: 'PT-1001',
    name: 'John Maina',
    age: 34,
    gender: 'Male',
    phone: '0722111222',
    category: 'General Consultation',
    registeredAt: '2026-06-01T09:00:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-1',
        date: '2026-06-01',
        symptoms: 'Mild fever, headache and fatigue for 3 days.',
        diagnoses: 'Uncomplicated Malaria',
        notes: 'Advised on insecticide-treated nets and hydration.',
        prescriptions: 'Artemether-Lumefantrine (Coartem) 20/120mg x 24 tabs, Paracetamol 500mg TDS for 3 days.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1002',
    name: 'Grace Wambui',
    age: 28,
    gender: 'Female',
    phone: '0733444555',
    category: 'General Consultation',
    registeredAt: '2026-06-02T10:30:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-2',
        date: '2026-06-02',
        symptoms: 'Sore throat, pain on swallowing, dry cough.',
        diagnoses: 'Acute Pharyngitis',
        notes: 'Warm saline gargles, plenty of fluids.',
        prescriptions: 'Amoxicillin 500mg TDS for 5 days, cetirizine 10mg OD for 5 days.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1003',
    name: 'David Kamau',
    age: 45,
    gender: 'Male',
    phone: '0711222333',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Surgical',
    registeredAt: '2026-06-02T08:15:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-3',
        date: '2026-06-02',
        symptoms: 'Swelling and pain around right groin region.',
        diagnoses: 'Right Inguinal Hernia - Scheduled for Herniorrhaphy',
        notes: 'Pre-op physical completed. Checked vital stats and lab reports.',
        prescriptions: 'Pre-op fasting instructions given. Pain management with Tramadol 50mg PRN.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1004',
    name: 'Baby Ethan Mwangi',
    age: 3,
    gender: 'Male',
    phone: '0755666777',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Pediatrics',
    registeredAt: '2026-06-03T11:00:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-4',
        date: '2026-06-03',
        symptoms: 'High fever, irritability, poor feeding and vomiting.',
        diagnoses: 'Pediatric Acute Gastroenteritis with Mild Dehydration',
        notes: 'Admitted to day-care ward for 4 hours for ORS monitoring.',
        prescriptions: 'Oral Rehydration Salts (ORS) 1 Litre packet TDS, Zinc DT (dispersible) 20mg OD x 10 days, Paracetamol syrup (120mg/5ml) 5ml TDS x 3 days.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1005',
    name: 'Elizabeth Nyambura',
    age: 62,
    gender: 'Female',
    phone: '0788999000',
    category: 'Consultant Clinic',
    consultantSubCategory: 'MOPC',
    registeredAt: '2026-06-01T14:20:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-5',
        date: '2026-06-01',
        symptoms: 'Regular monthly follow-up for high blood pressure. Joint pains.',
        diagnoses: 'Essential Hypertension & Mild Osteoarthritis',
        notes: 'BP: 145/92 mmHg (slightly elevated from previous 138/84). Low sodium diet re-emphasized.',
        prescriptions: 'Enalapril 5mg OD x 30 days, Paracetamol 1g TDS x 5 days, Calcium/Vit D supplements OD.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1006',
    name: 'Ruth Njeri',
    age: 29,
    gender: 'Female',
    phone: '0700111222',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Obs/Gyn',
    registeredAt: '2026-06-03T09:45:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-6',
        date: '2026-06-03',
        symptoms: 'Ante-natal care visit, 24 weeks gestation. Heartburn.',
        diagnoses: 'Normal Singleton Pregnancy - Second Trimester',
        notes: 'BP: 110/70. Fetal heart rate heard (142 bpm). Urine dipstick: negative for protein/sugar.',
        prescriptions: 'Ferosil (Iron/Folic Acid) OD x 30 days, Magnesium Trisilicate suspension 10ml TDS x 7 days.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1007',
    name: 'Joseph Kinyua',
    age: 41,
    gender: 'Male',
    phone: '0712345678',
    category: 'General Consultation',
    registeredAt: '2026-05-28T08:30:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-7',
        date: '2026-05-28',
        symptoms: 'Lower back painradiating down the right leg, aggravated by heavy lifting.',
        diagnoses: 'Lumbago with Sciatica',
        notes: 'Referred to physiotherapy for lumbar traction and core strengthening.',
        prescriptions: 'Diclofenac 50mg BD x 7 days, Omeprazole 20mg OD x 7 days.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1008',
    name: 'Mary Atieno',
    age: 32,
    gender: 'Female',
    phone: '0723456789',
    category: 'General Consultation',
    registeredAt: '2026-05-29T11:15:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-8',
        date: '2026-05-29',
        symptoms: 'Dysuria, increased urinary frequency, nocturia and mild suprapubic pain.',
        diagnoses: 'Acute Cystitis (Uncomplicated Urinary Tract Infection)',
        notes: 'Encouraged to increase water intake to >3 liters daily and maintain local hygiene.',
        prescriptions: 'Nitrofurantoin (Macrobid) 100mg BD x 5 days, Phenazopyridine 200mg TDS x 3 days.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1009',
    name: 'Peter Ndwiga',
    age: 52,
    gender: 'Male',
    phone: '0734567890',
    category: 'General Consultation',
    registeredAt: '2026-05-30T10:45:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-9',
        date: '2026-05-30',
        symptoms: 'Productive cough with yellow sputum, chest tightness, low-grade fever.',
        diagnoses: 'Acute Bronchitis',
        notes: 'No abnormal breath sounds. Mild wheezing noted. Non-smoker.',
        prescriptions: 'Azithromycin 500mg OD x 3 days, Salbutamol inhaler 100mcg - 2 puffs PRN.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1010',
    name: 'Sarah Cherotich',
    age: 26,
    gender: 'Female',
    phone: '0745678901',
    category: 'General Consultation',
    registeredAt: '2026-05-31T14:30:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-10',
        date: '2026-05-31',
        symptoms: 'Nausea, watery diarrhea (3 episodes), hyperactive bowel sounds after eating street food.',
        diagnoses: 'Mild Gastroenteritis, likely toxic food contamination',
        notes: 'Hemodynamically stable. Checked turgor, patient is well hydrated.',
        prescriptions: 'Oral Rehydration Salts (ORS) packs x 5, Loperamide 2mg caps PRN.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1011',
    name: 'Samuel Karanja',
    age: 60,
    gender: 'Male',
    phone: '0756789012',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Surgical',
    registeredAt: '2026-05-24T09:15:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-11',
        date: '2026-05-24',
        symptoms: 'Recurrent right upper quadrant abdominal colic, radiating to the back.',
        diagnoses: 'Chonicholecystitis with Cholelithiasis',
        notes: 'USG abdomen shows multiple gallstones. Scheduled for elective open cholecystectomy.',
        prescriptions: 'Hyoscine butylbromide 10mg TDS x 5 days, Paracetamol 1g TDS PRN pain.',
        doctorName: 'Dr. Beatrice Wanjiku',
        doctorEmail: 'admin@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1012',
    name: 'Benson Kimathi',
    age: 22,
    gender: 'Male',
    phone: '0767890123',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Surgical',
    registeredAt: '2026-05-25T13:00:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-12',
        date: '2026-05-25',
        symptoms: 'Deep cuts/laceration on left forearm sustained from farm tools 2 hours ago.',
        diagnoses: 'Clean laceration of left forearm, no tendon or neuro-vascular compromised.',
        notes: 'Debridement and primary suturing done under Local Anesthesia (0.5% Lidocaine). Tetanus toxoid given.',
        prescriptions: 'Amoxiclav (Co-Amoxiclav) 625mg BD x 7 days, Ibuprofen 400mg TDS x 5 days.',
        doctorName: 'Dr. Beatrice Wanjiku',
        doctorEmail: 'admin@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1013',
    name: 'Margaret Wangari',
    age: 51,
    gender: 'Female',
    phone: '0778901234',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Surgical',
    registeredAt: '2026-05-26T10:15:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-13',
        date: '2026-05-26',
        symptoms: 'Painless palpable discrete lump in the upper outer quadrant of left breast.',
        diagnoses: 'Left Breast Solid Mass, BIRADS-3 features.',
        notes: 'Completed Core Needle Biopsy. Histopathology requested on priority.',
        prescriptions: 'Paracetamol 500mg tabs TDS x 3 days, wound care guidelines provided.',
        doctorName: 'Dr. Beatrice Wanjiku',
        doctorEmail: 'admin@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1014',
    name: 'Paul Kiprotich',
    age: 38,
    gender: 'Male',
    phone: '0789012345',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Surgical',
    registeredAt: '2026-05-27T08:00:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-14',
        date: '2026-05-27',
        symptoms: 'Post-hemorrhoidectomy follow-up (Day 10). Complains of mild throbbing pain and minimal spotting.',
        diagnoses: 'Healing Post-operative Hemorrhoidectomy Wound',
        notes: 'Wound looks clean. No discharge. Encouraged high residual-fiber diet and sitz bath (warm water).',
        prescriptions: 'Syr. Lactulose 15ml Nocte x 10 days, Tramadol 50mg tabs BID x 3 days.',
        doctorName: 'Dr. Beatrice Wanjiku',
        doctorEmail: 'admin@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1015',
    name: 'Charles Musembi',
    age: 49,
    gender: 'Male',
    phone: '0790123456',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Surgical',
    registeredAt: '2026-05-28T15:20:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-15',
        date: '2026-05-28',
        symptoms: 'Right foot diabetic ulcer with localized slough for 2 weeks.',
        diagnoses: 'Diabetic Foot Ulcer (Wagner Grade 2)',
        notes: 'Surgical debridement of ulcer completed. Instructed on non-weight bearing and daily dressing.',
        prescriptions: 'Ciprofloxacin 500mg BD x 7 days, Metronidazole 400mg TDS x 7 days, Daily saline cleanses.',
        doctorName: 'Dr. Beatrice Wanjiku',
        doctorEmail: 'admin@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1016',
    name: 'Chloe Nyambura',
    age: 5,
    gender: 'Female',
    phone: '0711122233',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Pediatrics',
    registeredAt: '2026-05-29T09:30:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-16',
        date: '2026-05-29',
        symptoms: 'Sore throat, refusal to feed, dynamic snoring and high fever for 48 hours.',
        diagnoses: 'Acute Exudative Tonsillitis',
        notes: 'Bilateral hyperemic tonsils with white follicles. Temperature 38.6C.',
        prescriptions: 'Amoxicillin-Clavulanic Acid suspension 5ml BD x 7 days, Paracetamol syrup 5ml TDS x 4 days.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1017',
    name: 'Baby Liam Kael',
    age: 1,
    gender: 'Male',
    phone: '0712233445',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Pediatrics',
    registeredAt: '2026-05-30T14:15:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-17',
        date: '2026-05-30',
        symptoms: 'Incessant dry cough, chest retractions, runny nose, and sleep distress.',
        diagnoses: 'Acute Bronchiolitis',
        notes: 'Bilateral expiratory wheeze. Triage SpO2: 95% on room air. Nebulized with Salbutamol x 1.',
        prescriptions: 'Salbutamol syrup 2.5ml TDS x 5 days, Normal saline nasal drops 1 drop per nostril TDS.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1018',
    name: 'Angel Mutheu',
    age: 7,
    gender: 'Female',
    phone: '0713344556',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Pediatrics',
    registeredAt: '2026-05-31T11:00:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-18',
        date: '2026-05-31',
        symptoms: 'Scaly circular patches with hair loss on the crown scalp, severe itching.',
        diagnoses: 'Tinea Capitis (Scalp Ringworm)',
        notes: 'Wash scalp with Ketoconazole shampoo twice weekly. Avoid sharing caps/combs.',
        prescriptions: 'Griseofulvin 250mg OD x 4 weeks, Miconazole skin ointment BD x 14 days.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1019',
    name: 'Baby Ryan Kipkoech',
    age: 2,
    gender: 'Male',
    phone: '0714455667',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Pediatrics',
    registeredAt: '2026-06-01T15:40:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-19',
        date: '2026-06-01',
        symptoms: 'Ear tugging on the left side, persistent dynamic crying, and fever for 24 hours.',
        diagnoses: 'Acute Otitis Media (Left)',
        notes: 'Tympanic membrane is hyperemic and bulging. Guarded respiratory exam is clear.',
        prescriptions: 'Amoxicillin syrup (250mg/5ml) 5ml TDS x 5 days, Paracetamol syrup (120mg/5ml) 5ml TDS.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1020',
    name: 'Princess Nicole',
    age: 4,
    gender: 'Female',
    phone: '0715566778',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Pediatrics',
    registeredAt: '2026-06-02T13:10:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-20',
        date: '2026-06-02',
        symptoms: 'Dry itchy erythematous rashes in flexural folds of elbows & knees.',
        diagnoses: 'Atopic Dermatitis (Infantile/Childhood Eczema)',
        notes: 'Apply abundant emollient. Avoid perfumed soaps and synthetic fabric.',
        prescriptions: 'Hydrocortisone 1% cream BD x 7 days, Syr. Cetirizine 2.5ml OD x 10 days.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1021',
    name: 'Charles Njuguna',
    age: 68,
    gender: 'Male',
    phone: '0722334455',
    category: 'Consultant Clinic',
    consultantSubCategory: 'MOPC',
    registeredAt: '2026-05-24T10:00:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-21',
        date: '2026-05-24',
        symptoms: 'Diabetes Mellitus routine monthly clinic review. Extremity tingling.',
        diagnoses: 'Type 2 Diabetes Mellitus & Mild Peripheral Neuropathy',
        notes: 'Fasting Blood Sugar today is 8.5 mmol/L. Encouraged tight glycemic control and daily foot checks.',
        prescriptions: 'Metformin 850mg BD x 30 days, Glibenclamide 5mg OD x 30 days, Gabapentin 100mg Nocte.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1022',
    name: 'Esther Wanjiku',
    age: 55,
    gender: 'Female',
    phone: '0723445566',
    category: 'Consultant Clinic',
    consultantSubCategory: 'MOPC',
    registeredAt: '2026-05-25T11:30:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-22',
        date: '2026-05-25',
        symptoms: 'Chest tight and breathlesness mainly at night, worsened by cold triggers.',
        diagnoses: 'Moderately Controlled Bronchial Asthma',
        notes: 'Slightly reduced chest expansions. Advised on triggers avoidance.',
        prescriptions: 'Salbutamol Rotacaps 200mcg - 1 cap BD, Beclomethasone inhaler x 30 days.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1023',
    name: 'Daniel Ndambiri',
    age: 71,
    gender: 'Male',
    phone: '0724556677',
    category: 'Consultant Clinic',
    consultantSubCategory: 'MOPC',
    registeredAt: '2026-05-26T14:50:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-23',
        date: '2026-05-26',
        symptoms: 'Known heart failure patient. Exertional dyspnea, mild bilateral ankles edema.',
        diagnoses: 'Congestive Heart Failure (NYHA Class II)',
        notes: 'BP: 130/78. Lungs: Clear. Pitting pedal edema (+). Restricted daily salt intake.',
        prescriptions: 'Furosemide 40mg OD Sub-mane x 30 days, Spironolactone 25mg OD x 30 days, Carvedilol 6.25mg.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1024',
    name: 'Rose Nekesa',
    age: 59,
    gender: 'Female',
    phone: '0725667788',
    category: 'Consultant Clinic',
    consultantSubCategory: 'MOPC',
    registeredAt: '2026-05-27T11:15:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-24',
        date: '2026-05-27',
        symptoms: 'Symmetrical morning stiffness of fingers, pain on both wrists and knees.',
        diagnoses: 'Rheumatoid Arthritis - Chronic maintenance',
        notes: 'Complains of mild epigastric discomfort. Scleroderma ruled out.',
        prescriptions: 'Methotrexate 7.5mg Weekly x 4 weeks, Folic acid 5mg Weekly, Meloxicam 7.5mg OD.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1025',
    name: 'Stephen Mworia',
    age: 64,
    gender: 'Male',
    phone: '0726778899',
    category: 'Consultant Clinic',
    consultantSubCategory: 'MOPC',
    registeredAt: '2026-05-28T09:10:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-25',
        date: '2026-05-28',
        symptoms: 'Monthly follow-up for ischemic heart disease. Chest feels pain-free.',
        diagnoses: 'Ischemic Heart Disease (Post-MI maintenance)',
        notes: 'Pulse 64/min, regular rhythms. Excellent compliance to medical regimen.',
        prescriptions: 'Aspirin (Cardiprin) 100mg OD x 30 days, Atorvastatin 20mg Nocte x 30 days.',
        doctorName: 'Dr. James Kinyua',
        doctorEmail: 'doctor@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1026',
    name: 'Jane Wanjiru',
    age: 31,
    gender: 'Female',
    phone: '0733111222',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Obs/Gyn',
    registeredAt: '2026-05-29T10:00:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-26',
        date: '2026-05-29',
        symptoms: 'Severe nausea, throwing up everything (6-7 times daily), weight loss and dehydration.',
        diagnoses: 'Hyperemesis Gravidarum (14 weeks Gestation)',
        notes: 'Ketonuria noted (+++). Hospitalized for IV rehydration and antiemetics infusion.',
        prescriptions: 'IV Normal Saline 1L + 5% Dextrose 8 hourly, Inj. Metoclopramide 10mg IV TDS.',
        doctorName: 'Dr. Beatrice Wanjiku',
        doctorEmail: 'admin@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1027',
    name: 'Tabitha Moraa',
    age: 35,
    gender: 'Female',
    phone: '0734222333',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Obs/Gyn',
    registeredAt: '2026-05-30T11:45:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-27',
        date: '2026-05-30',
        symptoms: 'Bilateral deep pelvic aching, abnormal foul vaginal odor, and fever x 5 days.',
        diagnoses: 'Pelvic Inflammatory Disease (PID)',
        notes: 'Cervical motion tenderness positive (+). Partners tracing strongly urged.',
        prescriptions: 'Ceftriaxone 250mg IM single dose, Doxycycline 100mg BD x 14 days, Metronidazole 400mg.',
        doctorName: 'Dr. Beatrice Wanjiku',
        doctorEmail: 'admin@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1028',
    name: 'Linet Ochieng',
    age: 27,
    gender: 'Female',
    phone: '0735333444',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Obs/Gyn',
    registeredAt: '2026-05-31T09:12:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-28',
        date: '2026-05-31',
        symptoms: 'Routine antenatal checkup. Gestation by scan is 32 weeks.',
        diagnoses: 'Third Trimester Normal Singleton Pregnancy',
        notes: 'BP: 124/80. Fetal movements active. Presentation: Cephalic.',
        prescriptions: 'Ferosil (Iron/Folic Combo) x 30 days, Calcium tablets OD x 30 days.',
        doctorName: 'Dr. Beatrice Wanjiku',
        doctorEmail: 'admin@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1029',
    name: 'Beatrice Muthoni',
    age: 42,
    gender: 'Female',
    phone: '0736444555',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Obs/Gyn',
    registeredAt: '2026-06-01T15:20:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-29',
        date: '2026-06-01',
        symptoms: 'Vaginal dryness, severe hot flashes keeping her awake at night, emotional swings.',
        diagnoses: 'Perimenopausal Syndrome with Sleep Interruption',
        notes: 'Detailed counseling on lifestyle adjustments, stress-control and nutrition done.',
        prescriptions: 'Syr. Isoflavones (Estroplus) 10ml BID x 30 days, Vitamin E supplements.',
        doctorName: 'Dr. Beatrice Wanjiku',
        doctorEmail: 'admin@tumutumu.org'
      }
    ]
  },
  {
    id: 'PT-1030',
    name: 'Mercy Gacheri',
    age: 24,
    gender: 'Female',
    phone: '0737555666',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Obs/Gyn',
    registeredAt: '2026-06-02T10:50:00Z',
    registeredBy: 'reception@tumutumu.org',
    medicalHistory: [
      {
        id: 'MR-30',
        date: '2026-06-02',
        symptoms: 'Primary infertility review. Trying to conceive for 2 years with no prior conceptions.',
        diagnoses: 'Primary Infertility Investigations Pathway',
        notes: 'Husband requested Semen Analysis. HSG scan booked for Day 7 of next cycle.',
        prescriptions: 'Tab. Folic Acid 5mg OD x 30 days. Reassurance regarding pathway outcomes.',
        doctorName: 'Dr. Beatrice Wanjiku',
        doctorEmail: 'admin@tumutumu.org'
      }
    ]
  }
];

// Seeding Default Lab Tests (Records of tests per day)
export const defaultLabTests: LabTest[] = [
  {
    id: 'LAB-101',
    testName: 'Malaria Slide Test',
    patientName: 'John Maina',
    patientId: 'PT-1001',
    testDate: '2026-06-01',
    performedBy: 'Peter Kagiri (Lab Tech)',
    performedByEmail: 'lab@tumutumu.org',
    result: 'Positive for P. falciparum (+)',
    fee: 350
  },
  {
    id: 'LAB-102',
    testName: 'Complete Blood Count (CBC)',
    patientName: 'Grace Wambui',
    patientId: 'PT-1002',
    testDate: '2026-06-02',
    performedBy: 'Peter Kagiri (Lab Tech)',
    performedByEmail: 'lab@tumutumu.org',
    result: 'WBC: 6.2 x10^9/L (Normal), Hb: 12.1 g/dL (Normal), Platelets: 240 x10^9/L',
    fee: 1200
  },
  {
    id: 'LAB-103',
    testName: 'Urinalysis',
    patientName: 'Ruth Njeri',
    patientId: 'PT-1006',
    testDate: '2026-06-03',
    performedBy: 'Peter Kagiri (Lab Tech)',
    performedByEmail: 'lab@tumutumu.org',
    result: 'Leukocytes: Nil, Nitrite: Negative, Protein: Negative, Glucose: Normal',
    fee: 400
  },
  {
    id: 'LAB-104',
    testName: 'Random/Fasting Blood Sugar (RBS/FBG)',
    patientName: 'Elizabeth Nyambura',
    patientId: 'PT-1005',
    testDate: '2026-06-04',
    performedBy: 'Peter Kagiri (Lab Tech)',
    performedByEmail: 'lab@tumutumu.org',
    result: 'RBS: 6.8 mmol/L (Post-prandial, acceptable)',
    fee: 300
  },
  {
    id: 'LAB-105',
    testName: 'Typhoid Widal test',
    patientName: 'John Maina',
    patientId: 'PT-1001',
    testDate: '2026-06-04',
    performedBy: 'Peter Kagiri (Lab Tech)',
    performedByEmail: 'lab@tumutumu.org',
    result: 'TO: 1:80 (Negative), TH: 1:80 (Negative)',
    fee: 600
  },
  {
    id: 'LAB-106',
    testName: 'Routine Urine Dipstick',
    patientName: 'Mary Atieno',
    patientId: 'PT-1008',
    testDate: '2026-05-29',
    performedBy: 'Peter Kagiri (Lab Tech)',
    performedByEmail: 'lab@tumutumu.org',
    result: 'Leukocytes (+++), Under microscope: bacteria noted',
    fee: 350
  },
  {
    id: 'LAB-107',
    testName: 'Erythrocyte Sedimentation Rate (ESR)',
    patientName: 'Rose Nekesa',
    patientId: 'PT-1024',
    testDate: '2026-05-27',
    performedBy: 'Peter Kagiri (Lab Tech)',
    performedByEmail: 'lab@tumutumu.org',
    result: 'ESR: 42 mm/hr (Elevated active rheumatoid state)',
    fee: 500
  },
  {
    id: 'LAB-108',
    testName: 'Complete Blood Count (CBC)',
    patientName: 'Samuel Karanja',
    patientId: 'PT-1011',
    testDate: '2026-05-24',
    performedBy: 'Peter Kagiri (Lab Tech)',
    performedByEmail: 'lab@tumutumu.org',
    result: 'WBC: 10.5 x10^9/L (Mild leukocytosis), Hb: 13.8 g/dL',
    fee: 1200
  },
  {
    id: 'LAB-109',
    testName: 'Urine Pregnancy Test & Dipstick',
    patientName: 'Jane Wanjiru',
    patientId: 'PT-1026',
    testDate: '2026-05-29',
    performedBy: 'Peter Kagiri (Lab Tech)',
    performedByEmail: 'lab@tumutumu.org',
    result: 'hCG: Positive, Urine Ketones (+++) due to prolonged emesis',
    fee: 550
  },
  {
    id: 'LAB-110',
    testName: 'Vaginal Swab Gram Stain',
    patientName: 'Tabitha Moraa',
    patientId: 'PT-1027',
    testDate: '2026-05-30',
    performedBy: 'Peter Kagiri (Lab Tech)',
    performedByEmail: 'lab@tumutumu.org',
    result: 'Abundant Gram-negative intracellular diplococci',
    fee: 450
  }
];

// Seeding Default Pharmacy Inventory ITEMS
export const defaultPharmacyStock: PharmacyItem[] = fullPharmacyStock;

// Seeding Default Medication Dispense Reports
export const defaultDispenses: MedicationDispense[] = [
  {
    id: 'DSP-101',
    medicationName: 'Artemether-Lumefantrine (Coartem)',
    patientName: 'John Maina',
    patientId: 'PT-1001',
    dispenseDate: '2026-06-01',
    dispensedBy: 'Susan Muthoni',
    quantity: 1,
    pricePerUnit: 450,
    totalCost: 450
  },
  {
    id: 'DSP-102',
    medicationName: 'Paracetamol 500mg tabs',
    patientName: 'John Maina',
    patientId: 'PT-1001',
    dispenseDate: '2026-06-01',
    dispensedBy: 'Susan Muthoni',
    quantity: 12,
    pricePerUnit: 2,
    totalCost: 24
  },
  {
    id: 'DSP-103',
    medicationName: 'Amoxicillin 500mg caps',
    patientName: 'Grace Wambui',
    patientId: 'PT-1002',
    dispenseDate: '2026-06-02',
    dispensedBy: 'Susan Muthoni',
    quantity: 15,
    pricePerUnit: 10,
    totalCost: 150
  },
  {
    id: 'DSP-104',
    medicationName: 'Cetirizine 10mg tabs',
    patientName: 'Grace Wambui',
    patientId: 'PT-1002',
    dispenseDate: '2026-06-02',
    dispensedBy: 'Susan Muthoni',
    quantity: 5,
    pricePerUnit: 5,
    totalCost: 25
  },
  {
    id: 'DSP-105',
    medicationName: 'Enalapril 5mg tabs',
    patientName: 'Elizabeth Nyambura',
    patientId: 'PT-1005',
    dispenseDate: '2026-06-03',
    dispensedBy: 'Susan Muthoni',
    quantity: 30,
    pricePerUnit: 12,
    totalCost: 360
  },
  {
    id: 'DSP-106',
    medicationName: 'Zinc DT (dispersible) 20mg',
    patientName: 'Baby Ethan Mwangi',
    patientId: 'PT-1004',
    dispenseDate: '2026-06-03',
    dispensedBy: 'Susan Muthoni',
    quantity: 10,
    pricePerUnit: 15,
    totalCost: 150
  },
  {
    id: 'DSP-107',
    medicationName: 'Oral Rehydration Salts (ORS)',
    patientName: 'Baby Ethan Mwangi',
    patientId: 'PT-1004',
    dispenseDate: '2026-06-03',
    dispensedBy: 'Susan Muthoni',
    quantity: 5,
    pricePerUnit: 60,
    totalCost: 300
  },
  {
    id: 'DSP-108',
    medicationName: 'Amoxicillin-Clavulanic Acid suspension',
    patientName: 'Chloe Nyambura',
    patientId: 'PT-1016',
    dispenseDate: '2026-05-29',
    dispensedBy: 'Susan Muthoni',
    quantity: 1,
    pricePerUnit: 480,
    totalCost: 480
  },
  {
    id: 'DSP-109',
    medicationName: 'Ferosil (Iron/Folic Acid Combo)',
    patientName: 'Ruth Njeri',
    patientId: 'PT-1006',
    dispenseDate: '2026-06-03',
    dispensedBy: 'Susan Muthoni',
    quantity: 30,
    pricePerUnit: 15,
    totalCost: 450
  },
  {
    id: 'DSP-110',
    medicationName: 'Tramadol 50mg caps',
    patientName: 'Paul Kiprotich',
    patientId: 'PT-1014',
    dispenseDate: '2026-05-27',
    dispensedBy: 'Susan Muthoni',
    quantity: 6,
    pricePerUnit: 25,
    totalCost: 150
  },
  {
    id: 'DSP-111',
    medicationName: 'Surgical Gloves (Box of 100)',
    patientName: 'David Kamau',
    patientId: 'PT-1003',
    dispenseDate: '2026-06-05',
    dispensedBy: 'Susan Muthoni',
    quantity: 1,
    pricePerUnit: 650,
    totalCost: 650
  },
  {
    id: 'DSP-112',
    medicationName: 'Crepe Bandage (7.5cm x 4.5m)',
    patientName: 'John Maina',
    patientId: 'PT-1001',
    dispenseDate: '2026-06-06',
    dispensedBy: 'Susan Muthoni',
    quantity: 2,
    pricePerUnit: 80,
    totalCost: 160
  }
];

// Seeding Duty Allocations
export const defaultDutyAllocations: DutyAllocation[] = [
  { id: 'DUTY-1', staffEmail: 'reception@tumutumu.org', staffName: 'Mary Wangari', role: 'Reception', shift: 'Day Shift', department: 'Reception', date: '2026-06-04' },
  { id: 'DUTY-2', staffEmail: 'doctor@tumutumu.org', staffName: 'Dr. James Kinyua', role: 'Doctor', shift: 'Day Shift', department: 'Clinical', date: '2026-06-04' },
  { id: 'DUTY-3', staffEmail: 'lab@tumutumu.org', staffName: 'Peter Kagiri', role: 'Lab', shift: 'Day Shift', department: 'Lab', date: '2026-06-04' },
  { id: 'DUTY-4', staffEmail: 'pharmacy@tumutumu.org', staffName: 'Susan Muthoni', role: 'Pharmacy', shift: 'Day Shift', department: 'Pharmacy', date: '2026-06-04' },
  { id: 'DUTY-5', staffEmail: 'admin@tumutumu.org', staffName: 'Dr. Beatrice Wanjiku', role: 'Admin', shift: 'On Call', department: 'Admin', date: '2026-06-04' },
  { id: 'DUTY-6', staffEmail: 'gmaurice101@gmail.com', staffName: 'Dr. Maurice G.', role: 'Admin', shift: 'Day Shift', department: 'Admin', date: '2026-06-04' }
];

// Seeding Leave Requests
export const defaultLeaveRequests: LeaveRequest[] = [
  {
    id: 'LEAVE-1',
    staffEmail: 'reception@tumutumu.org',
    staffName: 'Mary Wangari',
    startDate: '2026-06-15',
    endDate: '2026-06-20',
    reason: 'Family event and rest.',
    status: 'Pending',
    requestedAt: '2026-06-03T14:30:00Z'
  },
  {
    id: 'LEAVE-2',
    staffEmail: 'lab@tumutumu.org',
    staffName: 'Peter Kagiri',
    startDate: '2026-06-10',
    endDate: '2026-06-12',
    reason: 'Medical checkup.',
    status: 'Approved',
    requestedAt: '2026-06-01T08:00:00Z'
  }
];

// Seeding Messages
export const defaultMessages: Message[] = [
  {
    id: 'MSG-1',
    senderEmail: 'admin@tumutumu.org',
    senderName: 'Dr. Beatrice Wanjiku',
    senderRole: 'Admin',
    recipientEmail: 'all-staff',
    subject: 'Karatina Satellite Streamlining Standards',
    content: 'Dear staff, we are digitizing our entire medical records workflow starting this week. Please make sure all patients are registered with correct category (General vs Consultant Clinics) immediately upon entry. Quality reports are generated for the Board of Management weekly. Keep up the high standard of service!',
    timestamp: '2026-06-03T08:00:00Z'
  },
  {
    id: 'MSG-2',
    senderEmail: 'doctor@tumutumu.org',
    senderName: 'Dr. James Kinyua',
    senderRole: 'Doctor',
    recipientEmail: 'admin@tumutumu.org',
    subject: 'Obs/Gyn Clinic Staffing Support',
    content: 'The antenatal bookings are significantly up this month for Obs/Gyn. Requesting we allocate an extra clinical officer for Wednesday mornings if possible to assist with pre-consult triage.',
    timestamp: '2026-06-04T07:00:00Z'
  }
];

// Seeding Appointments
export const defaultAppointments: Appointment[] = [
  {
    id: 'APT-1',
    patientId: 'PT-1003',
    patientName: 'David Kamau',
    patientPhone: '0711222333',
    date: '2026-06-05',
    time: '09:00',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Surgical',
    doctorEmail: 'doctor@tumutumu.org',
    status: 'Scheduled',
    billingStatus: 'Paid',
    billingAmount: 1500
  },
  {
    id: 'APT-2',
    patientId: 'PT-1004',
    patientName: 'Baby Ethan Mwangi',
    patientPhone: '0755666777',
    date: '2026-06-05',
    time: '11:30',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Pediatrics',
    doctorEmail: 'doctor@tumutumu.org',
    status: 'Scheduled',
    billingStatus: 'Unpaid',
    billingAmount: 1000
  },
  {
    id: 'APT-3',
    patientId: 'PT-1001',
    patientName: 'John Maina',
    patientPhone: '0722111222',
    date: '2026-06-04',
    time: '10:00',
    category: 'General Consultation',
    doctorEmail: 'doctor@tumutumu.org',
    status: 'Completed',
    billingStatus: 'Paid',
    billingAmount: 300
  },
  {
    id: 'APT-4',
    patientId: 'PT-1011',
    patientName: 'Samuel Karanja',
    patientPhone: '0756789012',
    date: '2026-06-06',
    time: '09:30',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Surgical',
    doctorEmail: 'doctor@tumutumu.org',
    status: 'Scheduled',
    billingStatus: 'Paid',
    billingAmount: 1500
  },
  {
    id: 'APT-5',
    patientId: 'PT-1016',
    patientName: 'Chloe Nyambura',
    patientPhone: '0711122233',
    date: '2026-06-06',
    time: '10:30',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Pediatrics',
    doctorEmail: 'doctor@tumutumu.org',
    status: 'Scheduled',
    billingStatus: 'Paid',
    billingAmount: 1000
  },
  {
    id: 'APT-6',
    patientId: 'PT-1021',
    patientName: 'Charles Njuguna',
    patientPhone: '0722334455',
    date: '2026-06-07',
    time: '11:00',
    category: 'Consultant Clinic',
    consultantSubCategory: 'MOPC',
    doctorEmail: 'doctor@tumutumu.org',
    status: 'Scheduled',
    billingStatus: 'Paid',
    billingAmount: 1000
  },
  {
    id: 'APT-7',
    patientId: 'PT-1026',
    patientName: 'Jane Wanjiru',
    patientPhone: '0733111222',
    date: '2026-06-08',
    time: '08:30',
    category: 'Consultant Clinic',
    consultantSubCategory: 'Obs/Gyn',
    doctorEmail: 'doctor@tumutumu.org',
    status: 'Scheduled',
    billingStatus: 'Paid',
    billingAmount: 1500
  }
];

// LocalStorage Persistence Class / Mock DB
export class HospitalDB {
  static getWhitelist(): WhitelistUser[] {
    return getStored<WhitelistUser[]>('hosp_whitelist', defaultWhitelist);
  }

  static saveWhitelist(whitelist: WhitelistUser[]) {
    saveStored('hosp_whitelist', whitelist);
  }

  static getPatients(): Patient[] {
    return getStored<Patient[]>('hosp_patients', defaultPatients);
  }

  static savePatients(patients: Patient[]) {
    saveStored('hosp_patients', patients);
  }

  static getLabTests(): LabTest[] {
    return getStored<LabTest[]>('hosp_lab_tests', defaultLabTests);
  }

  static saveLabTests(tests: LabTest[]) {
    saveStored('hosp_lab_tests', tests);
  }

  static getPharmacyStock(): PharmacyItem[] {
    const stock = getStored<PharmacyItem[]>('hosp_pharmacy_stock', defaultPharmacyStock);
    if (!Array.isArray(stock) || stock.length === 0) {
      console.log('Seeding complete P.C.E.A TumuTumu Hospital drug store list...');
      saveStored('hosp_pharmacy_stock', defaultPharmacyStock);
      return defaultPharmacyStock;
    }
    return stock;
  }

  static savePharmacyStock(stock: PharmacyItem[]) {
    saveStored('hosp_pharmacy_stock', stock);
  }

  static getDispenses(): MedicationDispense[] {
    return getStored<MedicationDispense[]>('hosp_dispenses', defaultDispenses);
  }

  static saveDispenses(dispenses: MedicationDispense[]) {
    saveStored('hosp_dispenses', dispenses);
  }

  static getDutyAllocations(): DutyAllocation[] {
    return getStored<DutyAllocation[]>('hosp_duty_allocations', defaultDutyAllocations);
  }

  static saveDutyAllocations(dues: DutyAllocation[]) {
    saveStored('hosp_duty_allocations', dues);
  }

  static getLeaveRequests(): LeaveRequest[] {
    return getStored<LeaveRequest[]>('hosp_leave_requests', defaultLeaveRequests);
  }

  static saveLeaveRequests(leaves: LeaveRequest[]) {
    saveStored('hosp_leave_requests', leaves);
  }

  static getMessages(): Message[] {
    return getStored<Message[]>('hosp_messages', defaultMessages);
  }

  static saveMessages(messages: Message[]) {
    saveStored('hosp_messages', messages);
  }

  static getAppointments(): Appointment[] {
    return getStored<Appointment[]>('hosp_appointments', defaultAppointments);
  }

  static saveAppointments(appts: Appointment[]) {
    saveStored('hosp_appointments', appts);
  }

  static getExpenses(): Expense[] {
    return getStored<Expense[]>('hosp_expenses', defaultExpenses);
  }

  static saveExpenses(expenses: Expense[]) {
    saveStored('hosp_expenses', expenses);
  }

  static getLabCatalog(): LabCatalogItem[] {
    return getStored<LabCatalogItem[]>('hosp_lab_catalog', defaultLabCatalog);
  }

  static saveLabCatalog(catalog: LabCatalogItem[]) {
    saveStored('hosp_lab_catalog', catalog);
  }

  static resetAll() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hosp_is_production_live');
      localStorage.removeItem('hosp_whitelist');
      localStorage.removeItem('hosp_patients');
      localStorage.removeItem('hosp_lab_tests');
      localStorage.removeItem('hosp_pharmacy_stock');
      localStorage.removeItem('hosp_dispenses');
      localStorage.removeItem('hosp_duty_allocations');
      localStorage.removeItem('hosp_leave_requests');
      localStorage.removeItem('hosp_messages');
      localStorage.removeItem('hosp_appointments');
      localStorage.removeItem('hosp_expenses');
      window.location.reload();
    }
  }

  static clearAllTestDataToGoLive() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hosp_is_production_live', 'true');
      localStorage.setItem('hosp_whitelist', JSON.stringify(defaultWhitelist));
      localStorage.setItem('hosp_patients', JSON.stringify([]));
      localStorage.setItem('hosp_lab_tests', JSON.stringify([]));
      localStorage.setItem('hosp_pharmacy_stock', JSON.stringify(defaultPharmacyStock));
      localStorage.setItem('hosp_dispenses', JSON.stringify([]));
      localStorage.setItem('hosp_duty_allocations', JSON.stringify([]));
      localStorage.setItem('hosp_leave_requests', JSON.stringify([]));
      localStorage.setItem('hosp_messages', JSON.stringify([]));
      localStorage.setItem('hosp_appointments', JSON.stringify([]));
      localStorage.setItem('hosp_expenses', JSON.stringify([]));
    }
  }
}

export const defaultExpenses: Expense[] = [
  {
    id: 'EXP-1001',
    category: 'Electricity',
    amount: 12500,
    date: '2026-06-01',
    description: 'KPLC Power token recharge for satellite branch main grids',
    recordedBy: 'admin@tumutumu.org',
    recordedAt: '2026-06-01T08:00:00Z'
  },
  {
    id: 'EXP-1002',
    category: 'Water',
    amount: 4500,
    date: '2026-06-02',
    description: 'Nyeri County Water & Sanitation company monthly bill',
    recordedBy: 'admin@tumutumu.org',
    recordedAt: '2026-06-02T10:00:00Z'
  },
  {
    id: 'EXP-1003',
    category: 'Security',
    amount: 25000,
    date: '2026-06-03',
    description: 'Daily security guard services payments (Security Group Ltd)',
    recordedBy: 'admin@tumutumu.org',
    recordedAt: '2026-06-03T09:00:00Z'
  },
  {
    id: 'EXP-1004',
    category: 'Electricity',
    amount: 8000,
    date: '2026-06-04',
    description: 'Clinical laboratory backup generator fuel purchase',
    recordedBy: 'admin@tumutumu.org',
    recordedAt: '2026-06-04T14:30:00Z'
  },
  {
    id: 'EXP-1005',
    category: 'Other',
    amount: 15000,
    date: '2026-06-05',
    description: 'Emergency repair of pharmaceutical air conditioning component',
    recordedBy: 'admin@tumutumu.org',
    recordedAt: '2026-06-05T11:20:00Z'
  },
  {
    id: 'EXP-1006',
    category: 'Security',
    amount: 25000,
    date: '2026-06-07',
    description: 'Second week secure guards patrol and surveillance services',
    recordedBy: 'admin@tumutumu.org',
    recordedAt: '2026-06-07T08:15:00Z'
  }
];

export const defaultLabCatalog: LabCatalogItem[] = [
  { id: 'LC-1', name: 'Malaria Slide/RDT test', fee: 350 },
  { id: 'LC-2', name: 'Complete Blood Count (CBC)', fee: 1200 },
  { id: 'LC-3', name: 'Urinalysis Dipstick', fee: 400 },
  { id: 'LC-4', name: 'Blood Sugar (FBG/RBS)', fee: 300 },
  { id: 'LC-5', name: 'Typhoid Widal test', fee: 600 },
  { id: 'LC-6', name: 'Stool O&P Microscopy', fee: 450 },
  { id: 'LC-7', name: 'COVID-19 Antigen Rapid', fee: 1500 },
  { id: 'LC-8', name: 'Liver Function Tests (LFT)', fee: 2500 }
];

