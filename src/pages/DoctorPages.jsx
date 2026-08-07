import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, ImageIcon, Layers3, Search, Send } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppShell, EmptyState, Modal, PageHeader, PriorityBadge, StatusBadge, VerdictBadge } from '../components/ui';
import * as casesApi from '../api/cases';
import { formatDate, formatDateTime, timeAgo, verdictLabel } from '../utils/format';

function DoctorShell({ children }) { return <AppShell role="doctor">{children}</AppShell>; }

export function DoctorQueue() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState('');

  function refresh() {
    setLoading(true);
    casesApi.getDoctorQueue().then(({ data }) => setQueue(data)).finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  const filtered = useMemo(() =>
    queue
      .filter((item) => filter === 'all' || item.ai_priority === filter)
      .filter((item) => item.id.toLowerCase().includes(search.toLowerCase()))
    , [queue, filter, search]);

  async function pickup() {
    try {
      await casesApi.pickUpCase(confirm.id);
      setConfirm(null);
      navigate(`/doctor/cases/${confirm.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'This case was just picked up by another doctor.');
      setConfirm(null);
      refresh();
    }
  }

  const oldest = filtered[filtered.length - 1];

  return (
    <DoctorShell>
      <PageHeader
        title="Shared Case Queue"
        subtitle="Unassigned cases are triaged by coarse priority. Full AI detail is revealed only after pickup."
        actions={<button className="secondary-button" onClick={refresh}>Refresh</button>}
      />
      <div className="stats-grid wide">
        <div><span>Waiting cases</span><strong>{queue.length}</strong></div>
        <div><span>High priority</span><strong>{queue.filter((c) => c.ai_priority === 'high').length}</strong></div>
        <div><span>Oldest wait</span><strong>{oldest ? timeAgo(oldest.created_at) : '—'}</strong></div>
      </div>
      <div className="toolbar">
        <div className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search case ID" /></div>
        <div className="filter-chips compact">{['all', 'high', 'medium', 'low'].map((v) => <button key={v} className={filter === v ? 'active' : ''} onClick={() => setFilter(v)}>{v[0].toUpperCase() + v.slice(1)}</button>)}</div>
      </div>
      {error && <div className="alert error">{error}</div>}
      {loading ? <p className="muted">Loading…</p>
        : filtered.length ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Preview</th><th>Case ID</th><th>Waiting</th><th>Priority</th><th></th></tr></thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>{item.thumbnail && <img className="table-thumb" src={item.thumbnail} alt="Lesion thumbnail" />}</td>
                    <td><strong>{item.id.slice(0, 8)}</strong><small>Unassigned</small></td>
                    <td>{timeAgo(item.created_at)}</td>
                    <td><PriorityBadge priority={item.ai_priority} /></td>
                    <td><button className="primary-button small" onClick={() => setConfirm(item)}>Pick Up Case</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Queue is clear" text="No unassigned cases match this filter." />}
      {confirm && (
        <Modal title="Pick up this case for review?" onClose={() => setConfirm(null)} actions={<><button className="secondary-button" onClick={() => setConfirm(null)}>Cancel</button><button className="primary-button" onClick={pickup}>Confirm Pickup</button></>}>
          <p>You will be assigned to <strong>{confirm.id.slice(0, 8)}</strong>. The case will disappear from every other doctor's queue.</p>
        </Modal>
      )}
    </DoctorShell>
  );
}

export function DoctorActiveCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    casesApi.getMyCasesAsDoctor().then(({ data }) => setCases(data)).finally(() => setLoading(false));
  }, []);

  const active = cases.filter((item) => item.status === 'in_review');

  return (
    <DoctorShell>
      <PageHeader title="My Active Cases" subtitle="Cases you have picked up but not yet finalized." />
      {loading ? <p className="muted">Loading…</p>
        : active.length ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Preview</th><th>Case</th><th>Patient</th><th>Picked up</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {active.map((item) => (
                  <tr key={item.id}>
                    <td>{item.images?.[0] && <img className="table-thumb" src={item.images[0].image} alt="" />}</td>
                    <td><strong>{item.id.slice(0, 8)}</strong></td>
                    <td>{item.patient.username}</td>
                    <td>{timeAgo(item.assigned_at)}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td><Link className="primary-button small" to={`/doctor/cases/${item.id}`}>Continue Review</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No active cases" text="Pick up a case from the shared queue to begin a review." action={<Link className="primary-button" to="/doctor/queue">Open Queue</Link>} />}
    </DoctorShell>
  );
}

export function DoctorCaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [compare, setCompare] = useState(false);
  const [form, setForm] = useState({ decision: '', notes: '' });
  const [confirm, setConfirm] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    casesApi.getCaseDetailForDoctor(id)
      .then(({ data }) => {
        setItem(data);
        if (data.verdict) setForm({ decision: data.verdict.decision, notes: data.verdict.notes });
        return Promise.all([
          casesApi.getPatientHistoryForDoctor(data.patient.id),
          casesApi.getMessages(id),
        ]);
      })
      .then(([historyRes, messagesRes]) => {
        setHistory(historyRes.data.filter((c) => c.id !== id));
        setMessages(messagesRes.data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (notFound) return <Navigate to="/doctor/active" replace />;
  if (loading || !item) return <DoctorShell><p className="muted">Loading…</p></DoctorShell>;

  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const activeImage = item.images[activeImageIndex];

  async function submitVerdict() {
    setSubmitting(true);
    setError('');
    try {
      await casesApi.submitVerdict(id, form.decision, form.notes);
      setConfirm(false);
      navigate('/doctor/active');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not submit verdict.');
      setConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function send() {
    if (!messageText.trim()) return;
    const { data } = await casesApi.sendMessage(id, messageText.trim());
    setMessages((current) => [...current, data]);
    setMessageText('');
  }

  const patientAge = null; // backend has no date_of_birth field -- omitted rather than faked

  return (
    <DoctorShell>
      <PageHeader title={`Review ${item.id.slice(0, 8)}`} subtitle={`Assigned ${formatDateTime(item.assigned_at)}`} back="/doctor/active" actions={<StatusBadge status={item.status} />} />
      <div className="doctor-review-grid">
        <section className="review-column image-review-column">
          <div className="panel-head">
            <div><ImageIcon size={18} /><strong>Image Review ({activeImageIndex + 1}/{item.images.length})</strong></div>
            {activeImage.ai_attention_map && <button className="secondary-button small" onClick={() => setCompare((v) => !v)}>{compare ? 'Overlay view' : 'Side-by-side'}</button>}
          </div>
          <div className={`image-comparison ${compare ? 'side-by-side' : ''}`}>
            <div className="image-stage">
              <img src={activeImage.image} alt="Lesion" />
              {showHeatmap && activeImage.ai_attention_map && (
                <img src={activeImage.ai_attention_map} alt="Attention map overlay" style={{ position: 'absolute', inset: 0, opacity: 0.55, objectFit: 'cover', width: '100%', height: '100%' }} />
              )}
              <span>{showHeatmap && activeImage.ai_attention_map ? 'With AI overlay' : 'Lesion image'}</span>
            </div>
            {compare && activeImage.ai_attention_map && <div className="image-stage"><img src={activeImage.image} alt="Raw" /><span>Raw image</span></div>}
          </div>
          {item.images.length > 1 && (
            <div className="additional-image-list" style={{ marginTop: '.7rem' }}>
              {item.images.map((img, i) => (
                <button key={img.id} type="button" onClick={() => setActiveImageIndex(i)} style={{ position: 'relative', padding: 0, border: i === activeImageIndex ? '2px solid var(--teal)' : '1px solid var(--border)', borderRadius: 9, overflow: 'hidden' }}>
                  <img src={img.image} alt={`Thumbnail ${i + 1}`} style={{ aspectRatio: 1.35, objectFit: 'cover', width: '100%' }} />
                  {img.ai_prediction === 'malignant' && <span style={{ position: 'absolute', bottom: 4, left: 4, background: '#d6455d', color: '#fff', fontSize: '.58rem', borderRadius: 4, padding: '0 4px' }}>Malignant</span>}
                </button>
              ))}
            </div>
          )}
          {activeImage.ai_attention_map && (
            <div className="heatmap-controls">
              <label className="switch-row"><input type="checkbox" checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} /> Attention map overlay</label>
            </div>
          )}
        </section>

        <section className="review-column ai-column">
          <div className="panel-head"><div><Layers3 size={18} /><strong>AI Analysis</strong></div><PriorityBadge priority={item.ai_priority} /></div>
          {item.ai_status !== 'done' ? (
            <div className="ai-result"><span>AI analysis</span><strong>Awaiting model result</strong></div>
          ) : (
            <div className={`ai-result ${activeImage.ai_prediction === 'malignant' ? 'malignant' : 'benign'}`}>
              <span>Model prediction {item.images.length > 1 ? `— image ${activeImageIndex + 1}/${item.images.length}` : ''}</span>
              <strong>{activeImage.ai_prediction === 'malignant' ? 'Malignant pattern' : 'Benign pattern'}</strong>
              <div className="confidence"><i style={{ width: `${activeImage.ai_confidence * 100}%` }} /><span>{Math.round(activeImage.ai_confidence * 100)}%</span></div>
            </div>
          )}
          <dl className="analysis-list">
            <div><dt>Model</dt><dd>EfficientNetB2 + CBAM</dd></div>
            <div><dt>Priority</dt><dd><PriorityBadge priority={item.ai_priority} /></dd></div>
          </dl>
          <div className="alert warning"><AlertTriangle size={18} /> AI output supports triage and clinical review. It is not a final diagnosis.</div>
        </section>

        <section className="review-column patient-column">
          <div className="panel-head"><div><Eye size={18} /><strong>Patient Information</strong></div></div>
          <div className="patient-summary"><div className="avatar large">{item.patient.username[0]}</div><div><strong>{item.patient.username}</strong></div></div>
          <dl className="analysis-list">
            <div><dt>Submitted</dt><dd>{formatDate(item.created_at)}</dd></div>
            <div className="full"><dt>Patient note</dt><dd>{item.patient_note || 'No note provided.'}</dd></div>
          </dl>
          <details className="history-panel">
            <summary>View Patient History ({history.length})</summary>
            {history.length ? history.map((past) => (
              <details key={past.id} className="history-item history-detail">
                <summary>
                  {past.images?.[0] && <img src={past.images[0].image} alt="" />}
                  <div><strong>{past.id.slice(0, 8)}</strong><span>{formatDate(past.reviewed_at)}</span><VerdictBadge verdict={past.verdict?.decision} /></div>
                </summary>
                <p>{past.verdict?.notes}</p>
              </details>
            )) : <p>No previous reviewed cases.</p>}
          </details>
        </section>
      </div>

      <div className="doctor-lower-grid">
        <section className="detail-card verdict-form">
          <h2>Structured Verdict</h2>
          <div className="verdict-options">
            {[['reassure', 'Reassure'], ['monitor', 'Monitor'], ['biopsy', 'Recommend Biopsy'], ['refer', 'Refer to Specialist']].map(([value, label]) => (
              <label key={value} className={form.decision === value ? 'selected' : ''}>
                <input type="radio" name="decision" value={value} checked={form.decision === value} onChange={() => set('decision', value)} disabled={item.status === 'reviewed'} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <label>Clinical notes<textarea rows="5" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Write a clear explanation and next step." disabled={item.status === 'reviewed'} /></label>
          {error && <div className="alert error">{error}</div>}
          {item.status === 'reviewed' ? (
            <div className="alert success"><CheckCircle2 size={18} /> This verdict has been finalized and is locked.</div>
          ) : (
            <div className="form-row wrap-actions">
              <button className="primary-button" disabled={!form.decision} onClick={() => setConfirm(true)}>Send Verdict</button>
            </div>
          )}
        </section>
        <section className="detail-card message-panel">
          <div className="section-head"><h2>Case Messages</h2><span>Async thread</span></div>
          <div className="message-thread doctor-thread">
            {messages.length ? messages.map((message) => (
              <div key={message.id} className={`message ${message.sender.role === 'doctor' ? 'mine' : ''}`}>
                <p>{message.body}</p><time>{formatDateTime(message.created_at)}</time>
              </div>
            )) : <p className="muted">No messages yet.</p>}
          </div>
          <div className="message-composer"><input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Message the patient…" /><button onClick={send}><Send size={18} /></button></div>
        </section>
      </div>
      {confirm && (
        <Modal title="Send this verdict to the patient?" onClose={() => setConfirm(false)} actions={<><button className="secondary-button" onClick={() => setConfirm(false)}>Cancel</button><button className="primary-button" onClick={submitVerdict} disabled={submitting}>{submitting ? 'Sending…' : 'Send Verdict'}</button></>}>
          <div className="confirmation-summary"><strong>{verdictLabel[form.decision]}</strong><p>{form.notes}</p></div>
        </Modal>
      )}
    </DoctorShell>
  );
}

export function DoctorMessages() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    casesApi.getMyCasesAsDoctor().then(({ data }) => setCases(data)).finally(() => setLoading(false));
  }, []);

  return (
    <DoctorShell>
      <PageHeader title="Messages" subtitle="Patient conversations attached to your assigned cases." />
      {loading ? <p className="muted">Loading…</p>
        : cases.length ? (
          <div className="message-inbox desktop">
            {cases.map((item) => (
              <Link key={item.id} to={`/doctor/cases/${item.id}`}>
                <div className="avatar">{item.patient.username[0]}</div>
                <div><strong>{item.patient.username}</strong><span>{item.id.slice(0, 8)}</span></div>
                <StatusBadge status={item.status} />
              </Link>
            ))}
          </div>
        ) : <EmptyState title="No conversations" text="Messages appear after you pick up a case." />}
    </DoctorShell>
  );
}