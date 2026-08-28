import { MedicalDocument } from '../types';

export const SAMPLE_DOCUMENTS: MedicalDocument[] = [
  {
    id: 'doc-rx-001',
    title: 'Cardiology & Blood Pressure Prescription',
    type: 'prescription',
    uploadedAt: 'Today at 10:24 AM',
    doctorName: 'Dr. Sarah Jenkins, MD (Cardiology)',
    clinicName: 'St. Luke Heart & Vascular Institute',
    patientName: 'Robert Vance (62 y/o)',
    status: 'needs_review',
    overallConfidence: 81,
    hasUncertainties: true,
    documentImageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
    medicines: [
      {
        id: 'med-01',
        name: 'Atorvastatin',
        genericName: 'Lipitor',
        strength: '40 mg',
        dosageForm: 'Oral Tablet',
        instructions: 'Take 1 tablet by mouth daily in the evening after dinner with water.',
        frequency: 'Once daily (Evening)',
        purpose: 'Helps lower LDL ("bad") cholesterol to protect your blood vessels and heart.',
        ocrConfidence: 94,
        rawOcrText: 'Atorvastatin 40mg Tab #30 - Sig: 1 tab PO QHS w/ water',
        isLowConfidence: false,
        interactions: ['med-03'],
        interactionNotes: 'Possible muscle soreness if combined with high-dose grapefruit or certain blood pressure medications.',
        boundingBox: { x: 8, y: 32, width: 84, height: 12 },
        withFood: 'with_food'
      },
      {
        id: 'med-02',
        name: 'Lisinopril',
        genericName: 'Prinivil / Zestril',
        strength: '10 mg (?)',
        dosageForm: 'Oral Tablet',
        instructions: 'Take 1 tablet every morning. Maintain hydration and stand up slowly.',
        frequency: 'Once daily (Morning)',
        purpose: 'Relaxes blood vessels to keep your daily blood pressure within healthy targets.',
        ocrConfidence: 64, // LOW CONFIDENCE - visibly disclosed!
        rawOcrText: 'Lisinopril 10? mg - 1 tab PO QAM (Digit "10" cursive swirl ambiguous with "20")',
        uncertaintyReason: 'Handwritten dose numeral has an ambiguous cursive tail. Could read as 10 mg or 20 mg. Please confirm exact dosage with your pharmacist before dispensing.',
        isLowConfidence: true,
        interactions: [],
        boundingBox: { x: 8, y: 46, width: 84, height: 13 },
        withFood: 'either'
      },
      {
        id: 'med-03',
        name: 'Aspirin (Cardio-protective)',
        genericName: 'Acetylsalicylic acid (Enteric Coated)',
        strength: '81 mg (Low-Dose)',
        dosageForm: 'Delayed-Release Tablet',
        instructions: 'Take 1 low-dose tablet daily with breakfast. Do not crush.',
        frequency: 'Once daily (Morning)',
        purpose: 'Helps keep blood flowing smoothly through arteries by reducing clot risk.',
        ocrConfidence: 91,
        rawOcrText: 'Aspirin EC 81mg - 1 tab daily with food',
        isLowConfidence: false,
        interactions: ['med-01'],
        interactionNotes: 'Avoid taking standard over-the-counter NSAIDs (like Ibuprofen or Aleve) at the same time without consulting your doctor.',
        boundingBox: { x: 8, y: 61, width: 84, height: 12 },
        withFood: 'with_food'
      },
      {
        id: 'med-04',
        name: 'Metformin',
        genericName: 'Glucophage',
        strength: '500 mg',
        dosageForm: 'Extended-Release Tablet',
        instructions: 'Take 1 tablet daily with the evening meal.',
        frequency: 'Once daily (Dinner)',
        purpose: 'Helps your body handle natural insulin and steady your blood sugar levels.',
        ocrConfidence: 88,
        rawOcrText: 'Metformin ER 500mg - 1 tab PO with dinner',
        isLowConfidence: false,
        interactions: [],
        boundingBox: { x: 8, y: 75, width: 84, height: 12 },
        withFood: 'with_food'
      }
    ],
    labs: [],
    interactions: [
      {
        id: 'int-01',
        entityIds: ['med-02', 'med-03'],
        entityNames: ['Lisinopril (Dose Unclear)', 'Aspirin Low-Dose'],
        severity: 'caution',
        title: 'Lisinopril Handwriting Uncertainty & Blood Pressure Synergy',
        plainSummary: 'Because Lisinopril relaxes blood vessels and the extracted dose is uncertain (10mg vs 20mg), having the pharmacist verify the script prevents accidental over-dosing.',
        rationale: 'High doses of ACE inhibitors combined with NSAIDs or antiplatelets need physician dosage confirmation.',
        doctorQuestionPrompt: '"Could you confirm if Dr. Jenkins prescribed 10mg or 20mg of Lisinopril on this Rx?"'
      },
      {
        id: 'int-02',
        entityIds: ['med-01', 'med-03'],
        entityNames: ['Atorvastatin', 'Aspirin'],
        severity: 'notable',
        title: 'Routine Heart Protection Pair',
        plainSummary: 'This is a standard combination for cardiovascular prevention. However, avoid taking OTC pain relievers (Ibuprofen / Naproxen) without discussing with your clinician.',
        rationale: 'Combined use is common, but patient education regarding stomach lining protection is advised.',
        doctorQuestionPrompt: '"What over-the-counter pain relievers are safest for me while on daily low-dose Aspirin and Atorvastatin?"'
      }
    ],
    plainSummary: {
      overview: 'This prescription contains 4 daily medications aimed at supporting your cardiovascular health, maintaining healthy cholesterol, and managing blood sugar. One medication (Lisinopril) has handwriting that is difficult to read and requires pharmacist confirmation.',
      keyTakeaways: [
        'Morning: Take Lisinopril and Low-Dose Aspirin with breakfast.',
        'Evening: Take Atorvastatin (cholesterol) and Metformin with dinner.',
        'Attention needed: Lisinopril strength looks like 10mg, but the handwriting has a swirl that could be 20mg. Show this to your pharmacist.'
      ],
      actionItems: [
        'Ask the pharmacist to double-check the Lisinopril strength against the clinic record.',
        'Take your Aspirin and Metformin with meals to protect your stomach.',
        'Check your home blood pressure readings twice weekly and log them.'
      ],
      disclaimer: 'Medora AI translates what is written on this prescription for educational purposes. Always follow direct instructions from your prescribing doctor and pharmacist.'
    },
    audioText: 'Hello Robert. Here is a plain summary of your cardiology prescription. You have four daily medications. In the morning with breakfast, you will take Aspirin 81 milligrams and Lisinopril. Please note, our AI detected low confidence on the Lisinopril dose because of a handwriting swirl — please ask your pharmacist to confirm whether it is 10 or 20 milligrams. In the evening with dinner, you will take Atorvastatin 40 milligrams for cholesterol and Metformin 500 milligrams for blood sugar. Remember to take these with food to avoid stomach upset.',
    suggestedQuestions: [
      'Why is the Lisinopril dose flagged with a caution note?',
      'Can I take Metformin and Atorvastatin at the same time?',
      'What foods should I avoid with Atorvastatin?',
      'What should I say to the pharmacist when dropping this off?'
    ]
  },
  {
    id: 'doc-lab-002',
    title: 'Comprehensive Metabolic Panel & Lipid Profile',
    type: 'lab_report',
    uploadedAt: 'Yesterday at 3:15 PM',
    doctorName: 'Dr. Michael Chang, MD (Internal Medicine)',
    clinicName: 'Metro Health Diagnostics & Pathology Lab',
    patientName: 'Elena Rostova (48 y/o)',
    status: 'explained',
    overallConfidence: 96,
    hasUncertainties: false,
    documentImageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&auto=format&fit=crop&q=80',
    medicines: [],
    labs: [
      {
        id: 'lab-01',
        name: 'Fasting Blood Glucose',
        code: 'GLUC-F',
        value: 138,
        unit: 'mg/dL',
        referenceRange: '70 - 99 mg/dL',
        status: 'high',
        confidence: 98,
        category: 'Metabolic',
        plainExplanation: 'Your fasting sugar reading is higher than standard fasting levels. This indicates your cells may need extra support clearing sugar from your bloodstream.',
        clinicalContext: 'Elevated fasting glucose is a common early indicator that doctors monitor alongside HbA1c to assess glucose metabolism.',
        boundingBox: { x: 10, y: 28, width: 80, height: 10 }
      },
      {
        id: 'lab-02',
        name: 'Hemoglobin A1c (HbA1c)',
        code: 'A1C',
        value: 6.7,
        unit: '%',
        referenceRange: '< 5.7 %',
        status: 'high',
        confidence: 96,
        category: 'Metabolic',
        plainExplanation: 'HbA1c shows your average blood sugar over the past 2 to 3 months. A reading of 6.7% is slightly above normal and falls into the pre-diabetes / early metabolic management range.',
        clinicalContext: 'Provides a 90-day glycemic picture rather than a single day spike.',
        boundingBox: { x: 10, y: 40, width: 80, height: 10 }
      },
      {
        id: 'lab-03',
        name: 'Estimated GFR (Kidney Function)',
        code: 'eGFR',
        value: 94,
        unit: 'mL/min/1.73m²',
        referenceRange: '> 60 mL/min',
        status: 'normal',
        confidence: 99,
        category: 'Kidney',
        plainExplanation: 'Your kidneys are filtering waste efficiently and functioning well within healthy parameters.',
        clinicalContext: 'Normal filtration rate indicating intact renal health.',
        boundingBox: { x: 10, y: 52, width: 80, height: 10 }
      },
      {
        id: 'lab-04',
        name: 'Total Cholesterol',
        code: 'CHOL-TOT',
        value: 218,
        unit: 'mg/dL',
        referenceRange: '< 200 mg/dL',
        status: 'high',
        confidence: 95,
        category: 'Lipid',
        plainExplanation: 'Total cholesterol is slightly above the recommended ceiling of 200 mg/dL. Your doctor will likely look at your HDL and LDL breakdown.',
        clinicalContext: 'Borderline elevated lipid profile; lifestyle and dietary adjustments are frequently discussed.',
        boundingBox: { x: 10, y: 64, width: 80, height: 10 }
      },
      {
        id: 'lab-05',
        name: 'HDL ("Good" Cholesterol)',
        code: 'HDL',
        value: 58,
        unit: 'mg/dL',
        referenceRange: '> 50 mg/dL',
        status: 'normal',
        confidence: 97,
        category: 'Lipid',
        plainExplanation: 'Your protective HDL cholesterol is in a healthy range, which helps transport excess cholesterol away from your arteries.',
        clinicalContext: 'Optimal protective lipoprotein concentration.',
        boundingBox: { x: 10, y: 76, width: 80, height: 10 }
      }
    ],
    interactions: [
      {
        id: 'int-lab-01',
        entityIds: ['lab-01', 'lab-02'],
        entityNames: ['Fasting Glucose (138)', 'HbA1c (6.7%)'],
        severity: 'caution',
        title: 'Combined Blood Sugar Elevation',
        plainSummary: 'Both your instantaneous fasting glucose and your 3-month average A1c are mildly elevated. Your doctor will likely discuss diet, activity, or metabolic support.',
        rationale: 'Concurrent elevation across fasting and glycated hemoglobin supports reviewing metabolic health.',
        doctorQuestionPrompt: '"Dr. Chang, what lifestyle modifications or follow-up tests do you recommend based on my 6.7% A1c reading?"'
      }
    ],
    plainSummary: {
      overview: 'Your lab report shows strong kidney health (eGFR 94), with mild elevations in both your blood sugar markers (Fasting Glucose 138 mg/dL and HbA1c 6.7%) and total cholesterol (218 mg/dL).',
      keyTakeaways: [
        'Kidney filtration is healthy and optimal.',
        'Blood sugar markers suggest your doctor will want to discuss metabolic wellness and dietary steps.',
        'Total cholesterol is mildly borderline, though protective HDL is strong (58 mg/dL).'
      ],
      actionItems: [
        'Schedule a follow-up consultation with Dr. Chang to review these results.',
        'Keep a light log of daily meals and physical activity before your appointment.',
        'Ask whether a repeat fasting lipid panel is recommended in 3 to 6 months.'
      ],
      disclaimer: 'Medora AI translates lab ranges for patient understanding. These values do not constitute a formal diagnosis. Your physician evaluates these findings in the context of your complete health history.'
    },
    audioText: 'Hello Elena. Here is your lab report summary. The positive news is that your kidney function is great, with an eGFR of 94. Your fasting blood glucose came in at 138, and your 3-month HbA1c is 6.7%, which is slightly above normal. Your total cholesterol is mildly elevated at 218, but your protective good HDL cholesterol is strong at 58. We recommend bringing this report to Dr. Chang to discuss tailored diet and activity steps.',
    suggestedQuestions: [
      'What does an HbA1c of 6.7% mean for my daily life?',
      'Is an eGFR of 94 normal for a 48-year-old?',
      'What questions should I ask Dr. Chang at my next visit?',
      'Does high total cholesterol matter if my HDL is high?'
    ]
  },
  {
    id: 'doc-disch-003',
    title: 'Post-Surgical Knee Arthroscopy Discharge Summary',
    type: 'discharge_summary',
    uploadedAt: '3 days ago',
    doctorName: 'Dr. Marcus Thorne, MD (Orthopedic Surgery)',
    clinicName: 'St. Jude Specialty Surgical Pavilion',
    patientName: 'David K. Miller (54 y/o)',
    status: 'explained',
    overallConfidence: 89,
    hasUncertainties: false,
    documentImageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
    medicines: [
      {
        id: 'med-disch-01',
        name: 'Cephalexin (Keflex)',
        genericName: 'Cephalexin Monohydrate',
        strength: '500 mg',
        dosageForm: 'Oral Capsule',
        instructions: 'Take 1 capsule every 6 hours for 7 full days. Finish the entire course even if feeling better.',
        frequency: 'Every 6 hours (4 times daily)',
        purpose: 'Preventative antibiotic to safeguard your surgical incisions against bacterial infection.',
        ocrConfidence: 93,
        rawOcrText: 'Cephalexin 500mg PO Q6H x 7 days - complete full course',
        isLowConfidence: false,
        interactions: [],
        boundingBox: { x: 10, y: 35, width: 80, height: 12 },
        withFood: 'either'
      },
      {
        id: 'med-disch-02',
        name: 'Acetaminophen (Tylenol Extra Strength)',
        genericName: 'Paracetamol',
        strength: '500 mg',
        dosageForm: 'Oral Caplet',
        instructions: 'Take 1 to 2 caplets every 6 to 8 hours as needed for mild-to-moderate knee discomfort. Maximum 3,000 mg in 24 hours.',
        frequency: 'As needed for pain',
        purpose: 'Non-opioid pain relief to help manage post-operative swelling and joint soreness.',
        ocrConfidence: 90,
        rawOcrText: 'Acetaminophen 500mg 1-2 tabs Q6-8H PRN pain (Max 3g/24hr)',
        isLowConfidence: false,
        interactions: [],
        boundingBox: { x: 10, y: 50, width: 80, height: 12 },
        withFood: 'either'
      }
    ],
    labs: [],
    interactions: [],
    plainSummary: {
      overview: 'You have been discharged following a successful right knee arthroscopy. Your recovery instructions focus on incision care, taking your preventative antibiotic on time, managing discomfort, and keeping the knee elevated.',
      keyTakeaways: [
        'Take Cephalexin every 6 hours for 7 full days to prevent surgical site infection.',
        'Keep your right leg elevated above heart level when resting to reduce swelling.',
        'Keep incisions clean and dry for the first 48 hours; do not submerge in a bath or pool.'
      ],
      actionItems: [
        'Set phone alarms for your 4 daily antibiotic doses so you do not miss any.',
        'Call the surgical clinic if you notice fever over 101°F, increased redness, or severe calf pain.',
        'Attend your post-operative suture check on Friday at 9:30 AM.'
      ],
      disclaimer: 'This summary outlines your post-operative discharge care plan. Contact your surgical team immediately if you experience unexpected symptoms or severe pain.'
    },
    audioText: 'Hello David. Congratulations on completing your knee procedure. Your discharge plan has three main priorities: First, take your antibiotic, Cephalexin 500 milligrams, every 6 hours for a full seven days. Second, use extra strength Acetaminophen as needed for pain, never exceeding 3,000 milligrams in a day. Third, keep your leg elevated and keep the dressing dry. Call Dr. Thorne’s clinic if you develop a fever or unusual redness.',
    suggestedQuestions: [
      'What should I do if I accidentally miss a Cephalexin dose?',
      'When can I safely shower after this knee arthroscopy?',
      'What warning signs mean I should call the clinic immediately?',
      'How much walking is recommended during the first 3 days?'
    ]
  }
];
