export const DEMO_CREDENTIALS = [
  { label: 'Patient', email: 'patient@deepskin.demo', password: 'Demo123!' },
  { label: 'Approved doctor', email: 'doctor@deepskin.demo', password: 'Demo123!' },
  { label: 'Pending doctor', email: 'pending@deepskin.demo', password: 'Demo123!' },
  { label: 'Admin', email: 'admin@deepskin.demo', password: 'Demo123!' },
];

export const seedUsers = [
  {
    id: 'u-patient-1', role: 'patient', fullName: 'Alex Johnson', email: 'patient@deepskin.demo',
    password: 'Demo123!', phone: '+1 555 0142', dateOfBirth: '1994-06-14', status: 'active',
  },
  {
    id: 'u-doctor-1', role: 'doctor', fullName: 'Dr. Sarah Chen', email: 'doctor@deepskin.demo',
    password: 'Demo123!', phone: '+1 555 0119', specialization: 'Dermatology', medicalLicense: 'MED-884291',
    hospital: 'City Dermatology Centre', yearsExperience: 9, verificationStatus: 'approved', status: 'active',
  },
  {
    id: 'u-doctor-2', role: 'doctor', fullName: 'Dr. Ethan Brooks', email: 'ethan@deepskin.demo',
    password: 'Demo123!', phone: '+1 555 0138', specialization: 'Dermatology', medicalLicense: 'MED-220318',
    hospital: 'Northside Medical', yearsExperience: 6, verificationStatus: 'approved', status: 'active',
  },
  {
    id: 'u-doctor-pending', role: 'doctor', fullName: 'Dr. Priya Sharma', email: 'pending@deepskin.demo',
    password: 'Demo123!', phone: '+977 9800000000', specialization: 'Dermatology', medicalLicense: 'NMC-2026-0934',
    hospital: 'Kathmandu Skin Clinic', yearsExperience: 4, verificationStatus: 'pending', status: 'active',
    documents: ['medical-license.pdf', 'qualification.pdf'], applicationNote: 'Submitted for verification.',
  },
  {
    id: 'u-admin-1', role: 'admin', fullName: 'System Administrator', email: 'admin@deepskin.demo',
    password: 'Demo123!', status: 'active',
  },
];

export const seedCases = [
  {
    id: 'DS-88219', patientId: 'u-patient-1', image: '/assets/lesion-1.svg', note: 'It has been itchy for about two weeks.',
    submittedAt: '2026-07-25T08:45:00Z', status: 'inReview', assignedDoctorId: 'u-doctor-1', assignedAt: '2026-07-25T09:10:00Z',
    aiPrediction: 'malignant', confidence: 0.91, priority: 'high', attentionAvailable: true,
    verdict: null, recommendation: '', monitoringPeriod: '', clinicalNotes: '',
    messages: [
      { id: 'm1', senderId: 'u-doctor-1', text: 'Hello Alex. I am reviewing the image you submitted and will update you shortly.', createdAt: '2026-07-25T09:14:00Z' },
    ],
  },
  {
    id: 'DS-87552', patientId: 'u-patient-1', image: '/assets/lesion-2.svg', note: 'Small spot on forearm. No pain.',
    submittedAt: '2026-07-22T07:20:00Z', status: 'pending', assignedDoctorId: null,
    aiPrediction: 'benign', confidence: 0.62, priority: 'medium', attentionAvailable: true,
    verdict: null, recommendation: '', monitoringPeriod: '', clinicalNotes: '', messages: [],
  },
  {
    id: 'DS-86110', patientId: 'u-patient-1', image: '/assets/lesion-3.svg', note: 'Colour changed slightly during the last month.',
    submittedAt: '2026-07-15T10:00:00Z', status: 'reviewed', assignedDoctorId: 'u-doctor-1', assignedAt: '2026-07-15T10:24:00Z',
    reviewedAt: '2026-07-15T11:02:00Z', aiPrediction: 'malignant', confidence: 0.86, priority: 'high', attentionAvailable: true,
    verdict: 'recommendBiopsy', recommendation: 'The lesion shows asymmetrical borders and multiple colour variations. Please arrange an in-person dermatology review and biopsy within the next two weeks.',
    monitoringPeriod: '', clinicalNotes: 'Escalated because of ABCDE findings and recent change.',
    messages: [
      { id: 'm2', senderId: 'u-doctor-1', text: 'I recommend arranging an in-person dermatology appointment for further assessment.', createdAt: '2026-07-15T11:02:00Z' },
      { id: 'm3', senderId: 'u-patient-1', text: 'Understood. I will arrange the appointment. Thank you.', createdAt: '2026-07-15T11:18:00Z' },
    ],
  },
  {
    id: 'DS-84340', patientId: 'u-patient-1', image: '/assets/lesion-4.svg', note: 'Raised spot, unchanged.',
    submittedAt: '2026-06-10T09:10:00Z', status: 'reviewed', assignedDoctorId: 'u-doctor-2', assignedAt: '2026-06-10T09:35:00Z',
    reviewedAt: '2026-06-10T10:05:00Z', aiPrediction: 'benign', confidence: 0.81, priority: 'low', attentionAvailable: true,
    verdict: 'monitor', recommendation: 'The lesion appears non-urgent. Photograph it again in eight weeks and seek care sooner if it changes, bleeds, or becomes painful.',
    monitoringPeriod: '8 weeks', clinicalNotes: 'Low concern. Review if evolving.', messages: [],
  },
  {
    id: 'DS-83302', patientId: 'u-patient-1', image: '/assets/lesion-1.svg', note: 'Long-standing mole.',
    submittedAt: '2026-05-02T06:30:00Z', status: 'reviewed', assignedDoctorId: 'u-doctor-1', assignedAt: '2026-05-02T06:50:00Z',
    reviewedAt: '2026-05-02T07:18:00Z', aiPrediction: 'benign', confidence: 0.93, priority: 'low', attentionAvailable: true,
    verdict: 'reassure', recommendation: 'No concerning visual features were identified during this review. Continue routine self-checks and contact a doctor if it changes.',
    monitoringPeriod: '', clinicalNotes: 'Stable lesion by history.', messages: [],
  },
  {
    id: 'DS-90101', patientId: 'u-patient-1', image: '/assets/lesion-2.svg', note: 'New dark patch, noticed five days ago.',
    submittedAt: '2026-07-25T10:20:00Z', status: 'pending', assignedDoctorId: null,
    aiPrediction: 'malignant', confidence: 0.96, priority: 'high', attentionAvailable: true,
    verdict: null, recommendation: '', monitoringPeriod: '', clinicalNotes: '', messages: [],
  },
  {
    id: 'DS-90102', patientId: 'u-patient-1', image: '/assets/lesion-4.svg', note: 'Small spot, unchanged for months.',
    submittedAt: '2026-07-25T09:52:00Z', status: 'pending', assignedDoctorId: null,
    aiPrediction: 'benign', confidence: 0.89, priority: 'low', attentionAvailable: true,
    verdict: null, recommendation: '', monitoringPeriod: '', clinicalNotes: '', messages: [],
  },
];

export const seedAudit = [
  { id: 'a1', at: '2026-07-25T10:20:03Z', caseId: 'DS-90101', actor: 'System', action: 'AI processing completed', from: 'processing', to: 'pending' },
  { id: 'a2', at: '2026-07-25T09:10:00Z', caseId: 'DS-88219', actor: 'Dr. Sarah Chen', action: 'Doctor picked up case', from: 'pending', to: 'inReview' },
  { id: 'a3', at: '2026-07-15T11:02:00Z', caseId: 'DS-86110', actor: 'Dr. Sarah Chen', action: 'Verdict submitted', from: 'inReview', to: 'reviewed', verdict: 'recommendBiopsy' },
];
