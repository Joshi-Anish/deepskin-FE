import { useMemo, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Brand, SecureNote } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { DEMO_CREDENTIALS } from '../data/seed';

function destinationFor(account) {
  if (account.role === 'patient') return '/patient/dashboard';
  if (account.role === 'doctor' && account.verificationStatus === 'approved') return '/doctor/queue';
  if (account.role === 'doctor') return '/doctor/application-status';
  return '/admin/dashboard';
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, loginAs } = useAuth();
  const { users, createPatient, createDoctorApplication } = useAppData();
  const [mode, setMode] = useState('login');
  const [accountType, setAccountType] = useState('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '', dateOfBirth: '', specialization: '', medicalLicense: '', hospital: '', yearsExperience: '', confirmPassword: '' });

  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const existingEmails = useMemo(() => new Set(users.map((u) => u.email.toLowerCase())), [users]);

  async function handleLogin(event) {
    event.preventDefault();
    setError(''); setBusy(true);
    try {
      const account = await login(form.email, form.password);
      navigate(destinationFor(account));
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setError('');
    if (!form.fullName.trim() || !form.email.trim() || !form.password) return setError('Please complete all required fields.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (existingEmails.has(form.email.trim().toLowerCase())) return setError('An account already exists with this email.');
    setBusy(true);
    const payload = { fullName: form.fullName.trim(), email: form.email.trim(), password: form.password, phone: form.phone.trim(), dateOfBirth: form.dateOfBirth };
    try {
      const account = accountType === 'patient'
        ? createPatient(payload)
        : createDoctorApplication({ ...payload, specialization: form.specialization, medicalLicense: form.medicalLicense, hospital: form.hospital, yearsExperience: Number(form.yearsExperience || 0), documents: ['medical-license-upload.pdf'] });
      loginAs(account.id);
      navigate(destinationFor(account));
    } finally { setBusy(false); }
  }

  function demoLogin(email) {
    const account = users.find((user) => user.email === email);
    if (!account) return;
    loginAs(account.id);
    navigate(destinationFor(account));
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand"><Brand /><p>Clinical precision for dermatological care.<br />Securely access your screening workspace.</p></div>
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Login</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Create Account</button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="auth-form">
            <label>Email Address<div className="input-with-icon"><Mail size={17} /><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@hospital.com" required /></div></label>
            <label>Password<div className="input-with-icon"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" required /><button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            <div className="form-row between"><label className="check-row"><input type="checkbox" /> Remember me</label><button type="button" className="link-button">Forgot password?</button></div>
            {error && <div className="alert error">{error}</div>}
            <button className="primary-button full" disabled={busy}>{busy ? 'Signing in…' : 'Secure Login'}</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="segmented">
              <button type="button" className={accountType === 'patient' ? 'active' : ''} onClick={() => setAccountType('patient')}>Patient</button>
              <button type="button" className={accountType === 'doctor' ? 'active' : ''} onClick={() => setAccountType('doctor')}>Doctor Application</button>
            </div>
            <label>Full Name<input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder={accountType === 'doctor' ? 'Dr. Full Name' : 'Full name'} required /></label>
            <label>Email Address<input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" required /></label>
            <div className="form-grid two">
              <label>Phone<input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Phone number" /></label>
              <label>Date of Birth<input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} /></label>
            </div>
            {accountType === 'doctor' && <>
              <div className="form-grid two"><label>Specialization<input value={form.specialization} onChange={(e) => set('specialization', e.target.value)} placeholder="Dermatology" required /></label><label>Medical Licence<input value={form.medicalLicense} onChange={(e) => set('medicalLicense', e.target.value)} placeholder="Licence number" required /></label></div>
              <label>Hospital / Clinic<input value={form.hospital} onChange={(e) => set('hospital', e.target.value)} placeholder="Organisation name" /></label>
              <div className="form-grid two"><label>Years of Experience<input type="number" min="0" value={form.yearsExperience} onChange={(e) => set('yearsExperience', e.target.value)} /></label><label>Licence Document<div className="file-control"><Upload size={17} /> Select file</div></label></div>
              <div className="alert info">Doctor registration creates a restricted application. Patient cases remain blocked until admin approval.</div>
            </>}
            <div className="form-grid two"><label>Password<input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required /></label><label>Confirm Password<input type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} required /></label></div>
            <label className="check-row"><input type="checkbox" required /> I agree to the privacy and medical data consent.</label>
            {error && <div className="alert error">{error}</div>}
            <button className="primary-button full" disabled={busy}>{busy ? 'Creating account…' : accountType === 'doctor' ? 'Submit Doctor Application' : 'Create Patient Account'}</button>
          </form>
        )}

        <div className="demo-logins"><span>Demo accounts</span><div>{DEMO_CREDENTIALS.map((item) => <button key={item.email} onClick={() => demoLogin(item.email)}>{item.label}</button>)}</div></div>
        <SecureNote><span>Secure medical portal prototype. <a href="#">Terms of Service</a> · <a href="#">Privacy Policy</a></span></SecureNote>
      </div>
    </div>
  );
}
