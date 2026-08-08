import { useEffect, useRef, useState } from 'react';
import { Camera, ChevronRight, Clock, Plus, RotateCcw, Send } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppShell, EmptyState, PageHeader, StatusBadge, VerdictBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import * as casesApi from '../api/cases';
import { formatDate, formatDateTime, verdictLabel } from '../utils/format';

function PatientShell({ children }) {
  return <AppShell role="patient">{children}</AppShell>;
}

function CaseCard({ item }) {
  const thumb = item.images?.[0]?.image;
  return (
    <article className="patient-case-card">
      {thumb && <img src={thumb} alt="Submitted skin lesion" />}
      <div className="case-card-body">
        <div className="case-card-top"><strong>{item.id.slice(0, 8)}</strong><StatusBadge status={item.status} /></div>
        <p>Submitted {formatDate(item.created_at)}</p>
        <span>{item.assigned_doctor ? item.assigned_doctor.username : item.status === 'pending' ? 'Awaiting assignment' : 'Doctor assigned'}</span>
      </div>
      <Link to={`/patient/cases/${item.id}`} className="icon-link" aria-label="View case"><ChevronRight /></Link>
    </article>
  );
}

export function PatientDashboard() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    casesApi.getMyCases().then(({ data }) => setCases(data)).finally(() => setLoading(false));
  }, []);

  const counts = {
    total: cases.length,
    pending: cases.filter((c) => c.status === 'pending').length,
    inReview: cases.filter((c) => c.status === 'in_review').length,
    reviewed: cases.filter((c) => c.status === 'reviewed').length,
  };
  const recent = [...cases].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3);

  return (
    <PatientShell>
      <div className="mobile-welcome"><span>Welcome back,</span><h1>Hello, {user.fullName}</h1></div>
      <Link className="primary-button full hero-action" to="/patient/new-case"><Plus size={18} /> Create New Case</Link>
      <section className="section-block">
        <div className="section-label">Overview</div>
        <div className="stats-grid patient-stats">
          <div><span>Total Cases</span><strong>{counts.total}</strong></div>
          <div><span>Pending</span><strong>{counts.pending}</strong></div>
          <div><span>In Review</span><strong>{counts.inReview}</strong></div>
          <div><span>Reviewed</span><strong>{counts.reviewed}</strong></div>
        </div>
      </section>
      <section className="section-block">
        <div className="section-head"><h2>Your Cases</h2><Link to="/patient/cases">View All</Link></div>
        {loading ? <p className="muted">Loading…</p> : (
          <div className="case-list">{recent.map((item) => <CaseCard key={item.id} item={item} />)}</div>
        )}
      </section>
    </PatientShell>
  );
}

export function PatientCases({ reviewedOnly = false }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    casesApi.getMyCases().then(({ data }) => setCases(data)).finally(() => setLoading(false));
  }, []);

  const items = cases
    .filter((item) => (reviewedOnly ? item.status === 'reviewed' : true))
    .filter((item) => filter === 'all' || (reviewedOnly ? item.verdict?.decision === filter : item.status === filter))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <PatientShell>
      <PageHeader
        title={reviewedOnly ? 'My Case History' : 'My Cases'}
        subtitle={reviewedOnly ? 'Review your past doctor assessments and recommendations.' : 'Track every lesion you have submitted.'}
        actions={reviewedOnly ? <Link className="secondary-button small" to="/patient/cases">All Cases</Link> : <Link className="secondary-button small" to="/patient/history">Reviewed History</Link>}
      />
      <div className="filter-chips">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
        {reviewedOnly
          ? ['reassure', 'monitor', 'biopsy', 'refer'].map((value) => (
              <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{verdictLabel[value]}</button>
            ))
          : ['pending', 'in_review', 'reviewed'].map((value) => (
              <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value === 'in_review' ? 'In Review' : value[0].toUpperCase() + value.slice(1)}</button>
            ))}
      </div>
      {loading ? <p className="muted">Loading…</p>
        : items.length ? <div className="case-list roomy">{items.map((item) => <CaseCard key={item.id} item={item} />)}</div>
        : <EmptyState title="No cases found" text="Cases matching this filter will appear here." />}
    </PatientShell>
  );
}

export function NewCasePage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function addFiles(fileList) {
    const files = Array.from(fileList || []);
    const valid = files.filter((f) => ['image/jpeg', 'image/png', 'image/jpg'].includes(f.type));
    if (!valid.length) return setError('Please upload a JPG or PNG image.');
    if (images.length + valid.length > 10) return setError('You can attach up to 10 images per case.');
    setImages((current) => [...current, ...valid]);
    setPreviews((current) => [...current, ...valid.map((f) => URL.createObjectURL(f))]);
    setError('');
  }

  function removeImage(index) {
    setImages((current) => current.filter((_, i) => i !== index));
    setPreviews((current) => current.filter((_, i) => i !== index));
  }

  async function submit() {
    if (!images.length) return setError('Please add at least one clear image before submitting.');
    setBusy(true);
    setError('');
    try {
      const { data } = await casesApi.createCase(note, images);
      navigate(`/patient/cases/${data.id}`, { state: { submitted: true } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not submit case. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PatientShell>
      <div className="stepper">
        <div className={step >= 1 ? 'active' : ''}><span>1</span><small>Photo</small></div><i />
        <div className={step >= 2 ? 'active' : ''}><span>2</span><small>Details</small></div><i />
        <div className={step >= 3 ? 'active' : ''}><span>3</span><small>Review</small></div>
      </div>
      {step === 1 && <>
        <PageHeader title="Capture the lesion" subtitle="You can attach up to 10 photos of the same lesion." />
        <div className="instruction-card">
          <strong>Photo instructions</strong>
          <ul><li>Use bright, natural lighting.</li><li>Keep the lesion in clear focus.</li><li>Avoid filters or editing.</li><li>Up to 10 images per case.</li></ul>
        </div>
        {previews.length === 0 ? (
          <button className="upload-zone" onClick={() => inputRef.current?.click()}>
            <span><Camera /></span><strong>Upload Photo</strong><small>Camera or Gallery</small>
          </button>
        ) : (
          <div className="additional-image-list">
            {previews.map((src, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={src} alt={`Lesion ${i + 1}`} />
                <button type="button" className="link-button danger" onClick={() => removeImage(i)}>Remove</button>
              </div>
            ))}
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png" multiple hidden onChange={(e) => addFiles(e.target.files)} />
        {previews.length > 0 && <div className="form-row"><button className="secondary-button" onClick={() => inputRef.current?.click()}><RotateCcw size={17} /> Add More</button></div>}
        {error && <div className="alert error">{error}</div>}
        <button className="primary-button full sticky-action" disabled={!images.length} onClick={() => setStep(2)}>Continue</button>
      </>}
      {step === 2 && <>
        <PageHeader title="Add a note" subtitle="Tell the doctor what you noticed. This step is optional." />
        <div className="form-card"><label>Describe anything you noticed<textarea maxLength="500" rows="7" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Example: It has been itchy for two weeks and recently changed colour." /></label><div className="char-count">{note.length}/500</div></div>
        <div className="form-row sticky-action"><button className="secondary-button" onClick={() => setStep(1)}>Back</button><button className="primary-button" onClick={() => setStep(3)}>Review Case</button></div>
      </>}
      {step === 3 && <>
        <PageHeader title="Review your case" subtitle={`Check your ${images.length} image(s) and note before sending to a doctor.`} />
        <div className="additional-image-list">{previews.map((src, i) => <img key={i} src={src} alt={`Lesion ${i + 1}`} />)}</div>
        <div className="review-card"><div><span>Optional note</span><p>{note || 'No note provided.'}</p></div></div>
        <label className="check-row consent"><input type="checkbox" defaultChecked /> I consent to secure image processing and doctor review.</label>
        {error && <div className="alert error">{error}</div>}
        <div className="form-row sticky-action"><button className="secondary-button" onClick={() => setStep(2)}>Back</button><button className="primary-button" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit Case'}</button></div>
      </>}
    </PatientShell>
  );
}

export function PatientCaseDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    casesApi.getMyCaseDetail(id)
      .then(({ data }) => { setItem(data); return casesApi.getMessages(id); })
      .then(({ data }) => setMessages(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function send() {
    if (!text.trim()) return;
    const { data } = await casesApi.sendMessage(id, text.trim());
    setMessages((current) => [...current, data]);
    setText('');
  }

  if (notFound) return <Navigate to="/patient/cases" replace />;
  if (loading || !item) return <PatientShell><p className="muted">Loading…</p></PatientShell>;

  const verdict = item.verdict;
  const doctor = item.assigned_doctor;

  return (
    <PatientShell>
      <PageHeader title="Case Detail" subtitle={`Submitted ${formatDate(item.created_at)}`} back="/patient/cases" />
      <div className="patient-detail-grid">
        <section className="case-image-panel">
          {item.images?.[0] && <img src={item.images[0].image} alt="Submitted lesion" />}
          <div><span>Current status</span><StatusBadge status={item.status} /></div>
        </section>
        <section className="detail-card">
          <h2>Case update</h2>
          {item.status !== 'reviewed' ? (
            <div className="waiting-state">
              <Clock />
              <strong>{item.status === 'pending' ? 'Waiting for a doctor' : 'A doctor is reviewing your photo'}</strong>
              <p>You will receive a notification when the review is complete.</p>
            </div>
          ) : (
            <>
              <div className="doctor-verdict-card">
                <span>Doctor's Verdict</span>
                <VerdictBadge verdict={verdict?.decision} />
                <h3>{verdictLabel[verdict?.decision]}</h3>
                <p>{verdict?.notes}</p>
              </div>
              {doctor && <div className="reviewing-practitioner"><div className="avatar">{doctor.username?.[0]}</div><div><strong>{doctor.username}</strong><span>{doctor.specialty}</span></div></div>}
            </>
          )}
        </section>
      </div>
      <section className="detail-card"><h2>Your note</h2><p>{item.patient_note || 'No note was provided.'}</p></section>
      {item.images?.length > 1 && (
        <section className="detail-card">
          <h2>All images ({item.images.length})</h2>
          <div className="additional-image-list">{item.images.map((img) => <img key={img.id} src={img.image} alt="Lesion" />)}</div>
        </section>
      )}
      {doctor && (
        <section className="detail-card message-panel">
          <div className="section-head"><h2>Messages</h2><span>{doctor.username}</span></div>
          <div className="message-thread">
            {messages.length ? messages.map((message) => (
              <div key={message.id} className={`message ${message.sender.role === 'patient' ? 'mine' : ''}`}>
                <p>{message.body}</p><time>{formatDateTime(message.created_at)}</time>
              </div>
            )) : <p className="muted">No messages yet.</p>}
          </div>
          <div className="message-composer">
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Write a message…" />
            <button onClick={send}><Send size={18} /></button>
          </div>
          <small className="medical-warning">This messaging feature is not an emergency service.</small>
        </section>
      )}
    </PatientShell>
  );
}

export function PatientMessages() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    casesApi.getMyCases().then(({ data }) => setCases(data.filter((c) => c.assigned_doctor))).finally(() => setLoading(false));
  }, []);

  return (
    <PatientShell>
      <PageHeader title="Messages" subtitle="Open a case to continue the conversation with its assigned doctor." />
      {loading ? <p className="muted">Loading…</p>
        : cases.length ? (
          <div className="message-inbox">
            {cases.map((item) => (
              <Link key={item.id} to={`/patient/cases/${item.id}`}>
                <div className="avatar">{item.assigned_doctor.username?.[0]}</div>
                <div><strong>{item.assigned_doctor.username}</strong><span>{item.id.slice(0, 8)}</span></div>
                <ChevronRight />
              </Link>
            ))}
          </div>
        ) : <EmptyState title="No conversations" text="A conversation will appear after a doctor picks up your case." />}
    </PatientShell>
  );
}