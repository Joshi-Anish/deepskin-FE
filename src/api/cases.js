import client from './client';

// unwraps DRF's { count, next, previous, results } pagination shape into a plain array
const unwrap = (res) => ({ ...res, data: res.data.results ?? res.data });

export const getMyCases = () => client.get('/cases/mine/').then(unwrap);
export const createCase = (patientNote, images) => {
  const formData = new FormData();
  formData.append('patient_note', patientNote);
  images.forEach((img) => formData.append('images', img));
  return client.post('/cases/mine/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const getMyCaseDetail = (caseId) => client.get(`/cases/mine/${caseId}/`);

export const getDoctorQueue = () => client.get('/cases/queue/').then(unwrap);
export const getMyCasesAsDoctor = () => client.get('/cases/mine-as-doctor/').then(unwrap);
export const getCaseDetailForDoctor = (caseId) => client.get(`/cases/${caseId}/detail/`);
export const pickUpCase = (caseId) => client.post(`/cases/${caseId}/pickup/`);
export const submitVerdict = (caseId, decision, notes = '') => client.post(`/cases/${caseId}/verdict/`, { decision, notes });
export const getPatientHistoryForDoctor = (patientId) => client.get(`/cases/patient-history/${patientId}/`).then(unwrap);

export const getMessages = (caseId) => client.get(`/cases/${caseId}/messages/`).then(unwrap);
export const sendMessage = (caseId, body) => client.post(`/cases/${caseId}/messages/`, { body });

export const getAdminAuditLog = () => client.get('/cases/admin/audit/').then(unwrap);
export const getAdminStats = () => client.get('/cases/admin/stats/');

export const listPendingDoctorApplications = () => client.get('/auth/doctors/pending/').then(unwrap);
export const reviewDoctorApplication = (id, decision, notes = '') => client.post(`/auth/doctors/${id}/review/`, { decision, notes });
export const listDoctors = () => client.get('/auth/doctors/').then(unwrap);
export const deactivateDoctor = (id) => client.post(`/auth/doctors/${id}/deactivate/`);