import { LogOut, Shield, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppShell role={user.role}>
      <div className="profile-grid">
        <section className="detail-card profile-card">
          <div className="avatar xlarge">{user.fullName?.[0]?.toUpperCase()}</div>
          <h2>{user.fullName}</h2>
          <span className="role-label">{user.role}</span>
        </section>

        <section className="detail-card profile-form">
          <h2>Account Information</h2>
          <dl className="analysis-list">
            <div>
              <dt><UserIcon size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Username</dt>
              <dd>{user.fullName}</dd>
            </div>
            <div>
              <dt><Shield size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Role</dt>
              <dd style={{ textTransform: 'capitalize' }}>{user.role}</dd>
            </div>
            {user.specialty && (
              <div>
                <dt>Specialty</dt>
                <dd>{user.specialty}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="detail-card danger-zone">
          <h2>Session</h2>
          <p>Log out of your DeepSkin account on this device.</p>
          <button className="danger-button" onClick={doLogout}><LogOut size={17} /> Logout</button>
        </section>
      </div>
    </AppShell>
  );
}