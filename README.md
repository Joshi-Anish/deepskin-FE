# DeepSkin Medical 

A complete frontend-only implementation of the DeepSkin doctor-mediated skin lesion screening workflow. It uses dummy data and `localStorage`, with API-shaped state functions that can later be replaced by Django REST Framework endpoints.

## Included workflows

### Patient
- Patient self-registration and shared login
- Mobile-first dashboard and case statuses
- One lesion image per case
- Optional patient note
- Image preview, replace, and upload progress states
- Pending → In Review → Reviewed lifecycle
- Doctor verdict and recommendation only
- Async case messaging
- Doctor-requested additional image upload
- Reviewed case history

**Safety constraint:** patient components never render the AI prediction, confidence, priority, or attention map.

### Doctor
- Doctor self-registration/application
- Pending approval status screen
- Shared unassigned queue with High / Medium / Low priority only
- One-click self-assignment
- Active cases
- Full post-assignment AI prediction and confidence
- EfficientNetB2 + CBAM label
- Attention-map overlay toggle, opacity control, and side-by-side mode
- Patient note and previous case history
- Structured verdict: Reassure / Monitor / Recommend Biopsy / Refer to Specialist
- Private clinical notes
- Request another image
- Async patient messaging

### Admin
- Operational dashboard
- Queue, review-time, case, and verdict summaries
- Doctor application approval/rejection/deactivation/reactivation
- Searchable audit log
- Model retraining status simulation

## Demo accounts

All demo passwords are: `Demo123!`

| Role | Email |
|---|---|
| Patient | `patient@deepskin.demo` |
| Approved doctor | `doctor@deepskin.demo` |
| Pending doctor | `pending@deepskin.demo` |
| Admin | `admin@deepskin.demo` |

The login screen also includes one-click demo account buttons.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown by Vite, usually `http://localhost:5173`.

## Production build

```bash
npm run build
npm run preview
```

## Main source structure

```text
src/
  api/mockApi.js              # async mock API boundary
  components/ui.jsx           # shared shell, badges, modal, navigation
  context/AppDataContext.jsx  # dummy database and domain actions
  context/AuthContext.jsx     # mock authentication/session
  data/seed.js                # users, cases, messages, audit records
  pages/AuthPage.jsx
  pages/PatientPages.jsx
  pages/DoctorPages.jsx
  pages/AdminPages.jsx
  pages/ProfilePage.jsx
  utils/format.js
  App.jsx
  main.jsx
  styles.css
```

## Suggested Django REST integration

Replace the local actions in `AppDataContext.jsx` with calls to endpoints such as:

```text
POST   /api/auth/login/
POST   /api/auth/patient-register/
POST   /api/auth/doctor-application/
GET    /api/patient/cases/
POST   /api/patient/cases/
GET    /api/cases/:id/
POST   /api/cases/:id/messages/
GET    /api/doctor/queue/
POST   /api/doctor/cases/:id/pick-up/
POST   /api/doctor/cases/:id/request-image/
POST   /api/doctor/cases/:id/verdict/
GET    /api/admin/doctor-applications/
PATCH  /api/admin/doctors/:id/verification/
GET    /api/admin/audit-log/
POST   /api/admin/model/retrain/
```

Keep role authorization and the patient AI-output restriction enforced on the backend as well as the frontend.

## Notes

- Uploaded images are stored as data URLs in `localStorage` for the prototype only.
- The AI output is simulated when a patient submits a case.
- The model retraining progress is a UI simulation.
- The included SVG lesion images are synthetic placeholders, not medical training data.
- `reference/` contains the UI screenshots supplied for the implementation.
