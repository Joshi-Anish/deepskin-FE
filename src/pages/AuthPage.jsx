import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, Upload, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Brand, SecureNote } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { registerPatient, registerDoctor } from '../api/auth';

function destinationFor(account) {
  if (account.role === 'patient') return '/patient/dashboard';
  if (account.role === 'doctor') return '/doctor/queue';
  return '/admin/dashboard';
}

function extractError(err, fallback) {
  const data = err.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.non_field_errors?.[0]) return data.non_field_errors[0];
  if (data.detail) return data.detail;
  // DRF field errors come back as { field_name: ["message"] } -- surface the first one
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey])) return `${firstKey}: ${data[firstKey][0]}`;
  return fallback;
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState('login');
  const [accountType, setAccountType] = useState('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [licenseFile, setLicenseFile] = useState(null);
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    phone_number: '', specialty: '', license_number: '',
  });

  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  async function handleLogin(event) {
    event.preventDefault();
    setError(''); setBusy(true);
    try {
      const account = await login(form.username, form.password);
      navigate(destinationFor(account));
    } catch (err) {
      setError(extractError(err, 'Invalid username or password.'));
    } finally { setBusy(false); }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setError('');
    if (!form.username.trim() || !form.password) return setError('Please complete all required fields.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (accountType === 'doctor' && !licenseFile) return setError('Please attach your license document.');

    setBusy(true);
    try {
      if (accountType === 'patient') {
        await registerPatient({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          phone_number: form.phone_number.trim(),
        });
      } else {
        await registerDoctor({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          phone_number: form.phone_number.trim(),
          specialty: form.specialty.trim(),
          license_number: form.license_number.trim(),
          license_document: licenseFile,
        });
      }

      if (accountType === 'doctor') {
        setMode('login');
        setError('');
        alert('Application submitted. You can log in once an administrator approves your account.');
      } else {
        // Patients can log in immediately -- account is active right away.
        const account = await login(form.username.trim(), form.password);
        navigate(destinationFor(account));
      }
    } catch (err) {
      setError(extractError(err, 'Registration failed. Please check your details and try again.'));
    } finally {
      setBusy(false);
    }
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
            <label>Username<div className="input-with-icon"><UserIcon size={17} /><input type="text" value={form.username} onChange={(e) => set('username', e.target.value)} placeholder="your username" required /></div></label>
            <label>Password<div className="input-with-icon"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" required /><button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            {error && <div className="alert error">{error}</div>}
            <button className="primary-button full" disabled={busy}>{busy ? 'Signing in…' : 'Secure Login'}</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="segmented">
              <button type="button" className={accountType === 'patient' ? 'active' : ''} onClick={() => setAccountType('patient')}>Patient</button>
              <button type="button" className={accountType === 'doctor' ? 'active' : ''} onClick={() => setAccountType('doctor')}>Doctor Application</button>
            </div>
            <label>Username<input value={form.username} onChange={(e) => set('username', e.target.value)} placeholder="Choose a username" required /></label>
            <label>Email Address<div className="input-with-icon"><Mail size={17} /><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" /></div></label>
            <label>Phone<input value={form.phone_number} onChange={(e) => set('phone_number', e.target.value)} placeholder="Phone number" /></label>

            {accountType === 'doctor' && <>
              <div className="form-grid two">
                <label>Specialty<input value={form.specialty} onChange={(e) => set('specialty', e.target.value)} placeholder="Dermatology" required /></label>
                <label>License Number<input value={form.license_number} onChange={(e) => set('license_number', e.target.value)} placeholder="License number" required /></label>
              </div>
              <label>License Document
                <label className="file-control" style={{ cursor: 'pointer' }}>
                  <Upload size={17} /> {licenseFile ? licenseFile.name : 'Select file'}
                  <input type="file" accept="image/*" hidden onChange={(e) => setLicenseFile(e.target.files?.[0] || null)} required />
                </label>
              </label>
              <div className="alert info">Doctor registration creates a pending application. You cannot log in until an administrator approves it.</div>
            </>}

            <div className="form-grid two">
              <label>Password<input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required /></label>
              <label>Confirm Password<input type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} required /></label>
            </div>
            <label className="check-row"><input type="checkbox" required /> I agree to the privacy and medical data consent.</label>
            {error && <div className="alert error">{error}</div>}
            <button className="primary-button full" disabled={busy}>{busy ? 'Submitting…' : accountType === 'doctor' ? 'Submit Doctor Application' : 'Create Patient Account'}</button>
          </form>
        )}

        <SecureNote><span>Secure medical portal. <a href="#">Terms of Service</a> · <a href="#">Privacy Policy</a></span></SecureNote>
      </div>
    </div>
  );
}