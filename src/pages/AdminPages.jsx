import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, RefreshCw, Search, ShieldAlert, UserCheck, Users } from 'lucide-react';
import { AppShell, Modal, PageHeader, StatusBadge, VerdictBadge } from '../components/ui';
import * as casesApi from '../api/cases';
import { formatDateTime, verdictLabel } from '../utils/format';

function AdminShell({ children }) { return <AppShell role="admin">{children}</AppShell>; }

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    casesApi.getAdminStats().then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return <AdminShell><p className="muted">Loading…</p></AdminShell>;

  const avgMinutes = stats.avg_time_to_review_seconds ? Math.round(stats.avg_time_to_review_seconds / 60) : 0;

  return (
    <AdminShell>
      <PageHeader title="Admin Dashboard" subtitle="Operational oversight for DeepSkin queues, doctors, and audit activity." />
      <div className="stats-grid admin-stats">
        <div><Users /><span>Total cases</span><strong>{stats.total_cases}</strong></div>
        <div><UserCheck /><span>Active doctors</span><strong>{stats.active_doctor_count}</strong></div>
        <div><Activity /><span>Queue length</span><strong>{stats.queue_length}</strong></div>
        <div><RefreshCw /><span>In review</span><strong>{stats.in_review_count}</strong></div>
        <div><CheckCircle2 /><span>Reviewed</span><strong>{stats.reviewed_count}</strong></div>
        <div><ShieldAlert /><span>Avg. time to review</span><strong>{avgMinutes}m</strong></div>
      </div>
      <div className="admin-grid">
        <section className="detail-card">
          <div className="section-head"><h2>Queue Status</h2><span>Current</span></div>
          <div className="donut-placeholder"><div><strong>{stats.total_cases}</strong><span>Total cases</span></div></div>
          <div className="legend">
            <span><i className="pending" />Pending {stats.queue_length}</span>
            <span><i className="inReview" />In Review {stats.in_review_count}</span>
            <span><i className="reviewed" />Reviewed {stats.reviewed_count}</span>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

export function DoctorManagement() {
  const [pending, setPending] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  function refresh() {
    setLoading(true);
    Promise.all([casesApi.listPendingDoctorApplications(), casesApi.listDoctors()])
      .then(([pendingRes, doctorsRes]) => {
        setPending(pendingRes.data);
        setDoctors(doctorsRes.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  const filteredPending = pending.filter((d) =>
    (d.username + d.email + d.license_number).toLowerCase().includes(query.toLowerCase())
  );

  async function review(decision) {
    setBusy(true);
    try {
      await casesApi.reviewDoctorApplication(selected.id, decision, reason);
      setSelected(null);
      setReason('');
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deactivate(doctorId) {
    await casesApi.deactivateDoctor(doctorId);
    refresh();
  }

  return (
    <AdminShell>
      <PageHeader title="Doctor Management" subtitle="Review self-submitted doctor applications and manage approved accounts." />
      <div className="toolbar">
        <div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search doctor, email, license" /></div>
      </div>

      <section className="detail-card" style={{ marginBottom: '1rem' }}>
        <h2>Pending Applications ({filteredPending.length})</h2>
        {loading ? <p className="muted">Loading…</p>
          : filteredPending.length ? (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>Doctor</th><th>Specialty</th><th>License</th><th>Applied</th><th></th></tr></thead>
                <tbody>
                  {filteredPending.map((doctor) => (
                    <tr key={doctor.id}>
                      <td><strong>{doctor.username}</strong><small>{doctor.email}</small></td>
                      <td>{doctor.specialty || '—'}</td>
                      <td>{doctor.license_number || '—'}</td>
                      <td>{formatDateTime(doctor.date_joined)}</td>
                      <td><button className="secondary-button small" onClick={() => setSelected(doctor)}>Review</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="muted">No pending applications.</p>}
      </section>

      <section className="detail-card">
        <h2>Active Doctors ({doctors.length})</h2>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Doctor</th><th>Specialty</th><th></th></tr></thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td><strong>{doctor.username}</strong></td>
                  <td>{doctor.specialty || '—'}</td>
                  <td><button className="danger-button small" onClick={() => deactivate(doctor.id)}>Deactivate</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <Modal
          title="Doctor application review"
          onClose={() => { setSelected(null); setReason(''); }}
          actions={<>
            <button className="danger-button" disabled={busy} onClick={() => review('reject')}>Reject</button>
            <button className="primary-button" disabled={busy} onClick={() => review('approve')}>Approve</button>
          </>}
        >
          <div className="doctor-application">
            <dl>
              <div><dt>Username</dt><dd>{selected.username}</dd></div>
              <div><dt>Email</dt><dd>{selected.email}</dd></div>
              <div><dt>Specialty</dt><dd>{selected.specialty}</dd></div>
              <div><dt>License number</dt><dd>{selected.license_number}</dd></div>
              <div><dt>Phone</dt><dd>{selected.phone_number || '—'}</dd></div>
            </dl>
            {selected.license_document && (
              <div className="document-list"><a href={selected.license_document} target="_blank" rel="noreferrer">📄 View license document</a></div>
            )}
            <label>Reason / reviewer note<textarea rows="3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Required when rejecting." /></label>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}

export function AuditLog() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    casesApi.getAdminAuditLog().then(({ data }) => setCases(data)).finally(() => setLoading(false));
  }, []);

  const rows = cases
    .filter((c) => status === 'all' || c.status === status)
    .filter((c) => JSON.stringify(c).toLowerCase().includes(query.toLowerCase()));

  return (
    <AdminShell>
      <PageHeader title="Audit Log" subtitle="Every case, doctor assignment, and verdict in the system." />
      <div className="toolbar">
        <div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search case, patient, doctor" /></div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="reviewed">Reviewed</option>
        </select>
      </div>
      {loading ? <p className="muted">Loading…</p>
        : rows.length ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Case</th><th>Patient</th><th>Doctor</th><th>Status</th><th>Priority</th><th>Verdict</th><th>Created</th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id.slice(0, 8)}</td>
                    <td>{row.patient?.username}</td>
                    <td>{row.assigned_doctor?.username || '—'}</td>
                    <td><StatusBadge status={row.status} /></td>
                    <td>{row.ai_priority || '—'}</td>
                    <td>{row.verdict ? <VerdictBadge verdict={row.verdict.decision} /> : '—'}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="muted">No matching cases.</p>}
    </AdminShell>
  );
}