import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { seedAudit, seedCases, seedUsers } from '../data/seed';

const AppDataContext = createContext(null);
const STORE_KEY = 'deepskin-demo-state-v1';

function loadInitialState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORE_KEY));
    if (stored?.users && stored?.cases && stored?.audit) return stored;
  } catch (error) {
    console.warn('Could not load saved demo state.', error);
  }
  return { users: seedUsers, cases: seedCases, audit: seedAudit, model: { version: 'EfficientNetB2-CBAM v1.4', status: 'Not Started', progress: 0, lastRetrainedAt: '2026-07-01T04:00:00Z' } };
}

export function AppDataProvider({ children }) {
  const [state, setState] = useState(loadInitialState);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }, [state]);

  const addAudit = (entry) => {
    setState((current) => ({
      ...current,
      audit: [{ id: crypto.randomUUID(), at: new Date().toISOString(), ...entry }, ...current.audit],
    }));
  };

  const createPatient = (payload) => {
    const user = { id: `u-${crypto.randomUUID()}`, role: 'patient', status: 'active', ...payload };
    setState((current) => ({ ...current, users: [...current.users, user] }));
    return user;
  };

  const createDoctorApplication = (payload) => {
    const user = {
      id: `u-${crypto.randomUUID()}`,
      role: 'doctor',
      status: 'active',
      verificationStatus: 'pending',
      documents: payload.documents || [],
      ...payload,
    };
    setState((current) => ({ ...current, users: [...current.users, user] }));
    addAudit({ actor: user.fullName, action: 'Doctor application submitted' });
    return user;
  };

  const updateUser = (userId, patch) => setState((current) => ({
    ...current,
    users: current.users.map((user) => user.id === userId ? { ...user, ...patch } : user),
  }));

  const createCase = ({ patientId, image, note }) => {
    const confidence = 0.55 + Math.random() * 0.42;
    const prediction = confidence > 0.77 ? 'malignant' : 'benign';
    const priority = confidence > 0.88 ? 'high' : confidence > 0.7 ? 'medium' : 'low';
    const created = {
      id: `DS-${Math.floor(10000 + Math.random() * 89999)}`,
      patientId,
      image,
      note,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      assignedDoctorId: null,
      aiPrediction: prediction,
      confidence,
      priority,
      attentionAvailable: true,
      verdict: null,
      recommendation: '',
      monitoringPeriod: '',
      clinicalNotes: '',
      messages: [],
    };
    setState((current) => ({ ...current, cases: [created, ...current.cases] }));
    addAudit({ caseId: created.id, actor: 'Patient', action: 'Case submitted', from: null, to: 'pending' });
    addAudit({ caseId: created.id, actor: 'System', action: 'AI processing completed', from: 'processing', to: 'pending' });
    return created;
  };

  const updateCase = (caseId, patch, auditEntry) => {
    setState((current) => ({
      ...current,
      cases: current.cases.map((item) => item.id === caseId ? { ...item, ...patch } : item),
    }));
    if (auditEntry) addAudit({ caseId, ...auditEntry });
  };

  const pickupCase = (caseId, doctorId) => {
    const item = state.cases.find((entry) => entry.id === caseId);
    if (!item || item.assignedDoctorId) return { ok: false, message: 'This case has already been assigned to another doctor.' };
    updateCase(caseId, { status: 'inReview', assignedDoctorId: doctorId, assignedAt: new Date().toISOString() }, {
      actor: state.users.find((user) => user.id === doctorId)?.fullName || 'Doctor',
      action: 'Doctor picked up case', from: 'pending', to: 'inReview',
    });
    return { ok: true };
  };

  const submitVerdict = (caseId, doctorId, payload) => {
    const reviewedAt = new Date().toISOString();
    const message = payload.message?.trim()
      ? { id: crypto.randomUUID(), senderId: doctorId, text: payload.message.trim(), createdAt: reviewedAt }
      : null;
    setState((current) => ({
      ...current,
      cases: current.cases.map((item) => item.id === caseId ? {
        ...item,
        status: 'reviewed',
        reviewedAt,
        verdict: payload.verdict,
        recommendation: payload.recommendation,
        monitoringPeriod: payload.monitoringPeriod || '',
        clinicalNotes: payload.clinicalNotes || '',
        messages: message ? [...item.messages, message] : item.messages,
      } : item),
    }));
    addAudit({ caseId, actor: state.users.find((user) => user.id === doctorId)?.fullName || 'Doctor', action: 'Verdict submitted', from: 'inReview', to: 'reviewed', verdict: payload.verdict });
  };

  const addMessage = (caseId, senderId, text) => {
    if (!text.trim()) return;
    const message = { id: crypto.randomUUID(), senderId, text: text.trim(), createdAt: new Date().toISOString() };
    setState((current) => ({
      ...current,
      cases: current.cases.map((item) => item.id === caseId ? { ...item, messages: [...item.messages, message] } : item),
    }));
    addAudit({ caseId, actor: state.users.find((user) => user.id === senderId)?.fullName || 'User', action: senderId.includes('doctor') ? 'Doctor message sent' : 'Patient message sent' });
  };

  const reviewDoctor = (userId, decision, reason = '') => {
    updateUser(userId, { verificationStatus: decision, verificationReason: reason });
    addAudit({ actor: 'System Administrator', action: `Doctor application ${decision}` });
  };

  const toggleDoctorStatus = (userId) => {
    const user = state.users.find((item) => item.id === userId);
    if (!user) return;
    const next = user.status === 'deactivated' ? 'active' : 'deactivated';
    updateUser(userId, { status: next });
    addAudit({ actor: 'System Administrator', action: `Doctor account ${next}` });
  };

  const resetDemo = () => {
    localStorage.removeItem(STORE_KEY);
    setState({ users: seedUsers, cases: seedCases, audit: seedAudit, model: { version: 'EfficientNetB2-CBAM v1.4', status: 'Not Started', progress: 0, lastRetrainedAt: '2026-07-01T04:00:00Z' } });
  };

  const triggerRetraining = () => {
    setState((current) => ({ ...current, model: { ...current.model, status: 'Preparing Data', progress: 8 } }));
    addAudit({ actor: 'System Administrator', action: 'Model retraining triggered' });
    const stages = [
      ['Training', 42, 900],
      ['Evaluating', 78, 1800],
      ['Completed', 100, 2800],
    ];
    stages.forEach(([status, progress, delay]) => {
      setTimeout(() => {
        setState((current) => ({ ...current, model: { ...current.model, status, progress, ...(status === 'Completed' ? { lastRetrainedAt: new Date().toISOString() } : {}) } }));
        if (status === 'Completed') addAudit({ actor: 'System', action: 'Model retraining completed' });
      }, delay);
    });
  };

  const value = useMemo(() => ({
    ...state,
    createPatient,
    createDoctorApplication,
    updateUser,
    createCase,
    updateCase,
    pickupCase,
    submitVerdict,
    addMessage,
    reviewDoctor,
    toggleDoctorStatus,
    triggerRetraining,
    resetDemo,
  }), [state]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export const useAppData = () => {
  const value = useContext(AppDataContext);
  if (!value) throw new Error('useAppData must be used inside AppDataProvider');
  return value;
};
