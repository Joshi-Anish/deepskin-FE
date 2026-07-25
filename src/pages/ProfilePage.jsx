import { useState } from 'react';
import { AppShell, PageHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const { updateUser, resetDemo } = useAppData();
  const [form, setForm] = useState({ fullName: user.fullName || '', phone: user.phone || '', hospital: user.hospital || '' });
  const [saved, setSaved] = useState(false);
  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const save = () => { updateUser(user.id, form); setSaved(true); setTimeout(() => setSaved(false), 1800); };
  return (
    <AppShell role={user.role}>
      <PageHeader title="Profile & Account" subtitle="Manage your demo profile and local prototype data." />
      <div className="profile-grid">
        <section className="detail-card profile-card">
          <div className="avatar xlarge">{user.fullName?.[0]}</div>
          <h2>{user.fullName}</h2>
          <span className="role-label">{user.role}</span>
          {user.role === 'doctor' && <span className={`application-status ${user.verificationStatus}`}>{user.verificationStatus}</span>}
        </section>
        <section className="detail-card profile-form">
          <label>Full name<input value={form.fullName} onChange={(e)=>set('fullName',e.target.value)} /></label>
          <label>Email<input value={user.email} disabled /></label>
          <label>Phone<input value={form.phone} onChange={(e)=>set('phone',e.target.value)} /></label>
          {user.role === 'doctor' && <label>Hospital / Clinic<input value={form.hospital} onChange={(e)=>set('hospital',e.target.value)} /></label>}
          {saved && <div className="alert success">Profile saved.</div>}
          <button className="primary-button" onClick={save}>Save Changes</button>
        </section>
        <section className="detail-card danger-zone"><h2>Prototype controls</h2><p>Reset all users, cases, messages, doctor approvals, and audit events to the original dummy dataset.</p><button className="danger-button" onClick={resetDemo}>Reset Demo Data</button></section>
      </div>
    </AppShell>
  );
}
