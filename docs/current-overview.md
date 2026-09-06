# Current Overview

This document describes the current implemented state of MySeizures, including completed work,
available mobile and API routes, validation evidence, known gaps, and possible improvements.

MySeizures is a substantial academic prototype built around four principal journeys: offline
clinical recording, treatment and adherence tracking, patient-controlled professional access, and
local structured report export. It is not a medical device, emergency service, production clinical
record, or clinically validated decision-support system.

## Stage 1 — Frontend/mobile application

### Implemented architecture

The frontend is an Expo SDK 54 and React Native 0.81.5 application using Expo Router. It follows a
Clean Architecture-style separation:

- **Presentation** contains screens, reusable form controls, navigation guards, and visible
  loading, error, empty, success, and denied states.
- **Application** contains use cases for authentication, clinical records, treatments, sharing,
  reports, notifications, and export, along with ports for external dependencies.
- **Domain** contains entities, value validation, reminder scheduling, adherence calculations,
  report-period selection, and versioned informational alert rules.
- **Infrastructure** contains SQLite repositories, REST clients, secure session storage, Expo local
  notifications, filesystem export, and native sharing adapters.
- **Composition** assembles the concrete adapters and injects them into application use cases.

At startup, the application initializes SQLite and attempts to restore a token from secure device
storage. Authenticated users are redirected according to their role. Patient, professional, and
shared route groups are protected independently so anonymous users and users with the wrong role
cannot open restricted screens.

### Mobile routes

The route names below use Expo Router identifiers. Parenthesized route groups organize and protect
screens without becoming ordinary visible URL segments.

| Route                                 | Role                    | Purpose                                                                                                    |
| ------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `/(auth)`                             | Public                  | Email/password login with input validation and visible authentication or network failures.                 |
| `/(patient)`                          | Patient                 | Patient landing screen and sign-out action.                                                                |
| `/(patient)/seizures/new`             | Patient                 | Records a seizure timestamp and occurrence type.                                                           |
| `/(patient)/triggers/new`             | Patient                 | Records a possible cause, timestamp, sleep quality, mood, and optional other-cause description.            |
| `/(patient)/calendar`                 | Patient                 | Displays locally stored seizures and triggers within an inclusive selected period.                         |
| `/(patient)/treatments`               | Patient                 | Lists locally stored treatments.                                                                           |
| `/(patient)/treatments/new`           | Patient                 | Creates a treatment and its daily base times.                                                              |
| `/(patient)/treatments/[id]`          | Patient                 | Loads and edits an existing treatment.                                                                     |
| `/(patient)/reminders`                | Patient                 | Lists doses requiring action and records each as taken or missed. Notification taps may select a reminder. |
| `/(patient)/sharing`                  | Patient                 | Grants, lists, and revokes professional access through the API.                                            |
| `/(professional)`                     | Professional            | Professional landing screen and sign-out action.                                                           |
| `/(professional)/patients`            | Professional            | Checks access to a numeric patient identifier.                                                             |
| `/(professional)/reports/[patientId]` | Professional            | Displays an authorized weekly, monthly, or annual patient report.                                          |
| `/(shared)/report-export`             | Patient or professional | Creates an authorized local JSON report and opens native sharing when available.                           |

### Offline clinical persistence

SQLite on the mobile device is the source of truth for clinical data. Ordered migrations define
users, patients, professionals, access grants, seizure records, possible-trigger records,
treatments, treatment times, reminders, and adherence confirmations.

The persistence layer uses foreign keys, uniqueness constraints, indexes, parameterized queries,
transactions, and mandatory patient identifiers. Patient-scoped repository guards reject queries
that do not bind `patient_id`, reducing the risk of accidental cross-patient reads. Clinical data is
not sent to or stored by the API.

### Clinical recording and calendar

Patients can record seizures as focal, generalized, unknown, or other. Possible-trigger records can
identify sleep, stress, medication, alcohol, illness, routine changes, or another cause, together
with sleep-quality and mood ratings. Domain validation rejects malformed data, unsupported values,
future timestamps, and incomplete `OTHER` trigger records.

The calendar accepts an inclusive custom period, loads patient-scoped seizure and trigger records,
and orders them chronologically. It includes accessible list semantics and explicit loading, error,
empty, and retry states.

### Treatments, reminders, and adherence

Treatment creation and editing support medication, therapy, and other treatment types; a name;
daily frequency; and one or more `HH:MM` base times. Treatment, time, and future-reminder changes are
stored transactionally.

The current use case generates seven days of future reminders. When notification permission is
available, future reminders are scheduled as local device notifications. Denied permission,
overdue reminders, and native scheduling failures fall back to the in-app reminder list.

Notification payloads identify the reminder and treatment. Tapping a recognized medication
notification routes to the reminder screen and highlights the matching entry. A reminder can reach
one final `TAKEN` or `MISSED` state; conflicting later changes are rejected. Adherence calculations
use final confirmations only.

### Reports and informational alerts

Reports are derived on demand from current local records rather than stored as snapshots. Supported
periods are:

- **Weekly:** the selected end day and preceding six days.
- **Monthly:** the first day of the selected month through the selected end.
- **Annual:** January 1 of the selected year through the selected end.

An authorized report contains seizures, possible triggers, trigger-frequency trends, final-dose
adherence totals and percentage, a textual summary, and an accessible bar chart. The interface also
provides explicit loading, empty, access-denied, and retryable failure states.

The current versioned ruleset is `prototype-1.0`:

- Three or more recorded seizures in the selected period produce a `HIGH`
  `SEIZURE_FREQUENCY` informational indicator.
- A defined final-dose adherence rate below 80% produces a `MEDIUM` `LOW_ADHERENCE`
  informational indicator.
- Exactly 80% does not trigger the adherence indicator.
- No final confirmations produce no adherence percentage or low-adherence indicator.

Severity and reason are always conveyed in text rather than through colour alone. The interface
states that these indicators are not diagnoses, predictions, emergency guidance, or clinical
protocols.

### Local structured export

Authorized patients and professionals can export a selected report. Authorization is checked
before any patient-profile read or file creation. After authorization, the application generates
the report, loads the local patient profile, maps it to export format version `1.0`, validates the
document, writes a safely named JSON file, and opens the native share sheet when available.

The mapper uses an explicit allow-list and excludes passwords, password hashes, session tokens,
email addresses, internal timestamps, diagnosis date, unrelated patients, and other internal
fields. The RNDS/e-SUS wording describes only a documented compatibility-oriented data shape. The
application contains no direct submission to RNDS, e-SUS, an EHR, or any other external service.

### Android local-development configuration

The mobile workspace includes `expo-build-properties` with Android
`usesCleartextTraffic: true`. Expo configuration introspection confirms that Prebuild will generate
the equivalent of `android:usesCleartextTraffic="true"` in the application manifest. This allows a
development build to call the local HTTP API at the configured LAN address.

Because this setting changes native Android configuration, a newly generated development build
must be installed before it takes effect. The cleartext setting currently applies to all Android
build variants and should be limited to development if production distribution is introduced.

### Frontend pending work and possible improvements

1. **Connect the primary navigation.** The patient and professional landing screens currently show
   welcome text and sign-out only. They do not link to most implemented feature routes. The
   treatment list links to treatment creation/editing, and the professional access screen links to
   a report, but there is no complete home, tab, drawer, or menu journey. The export route is also
   not linked from the report screen.
2. **Complete the chronological-history requirement.** The chronological use case combines only
   seizures and triggers. Reminders and adherence confirmations appear in a separate workflow, so
   FR-006 remains partial.
3. **Support full offline process restart.** SQLite records survive provider reinitialization, but
   application startup revalidates the stored token through `GET /users/me`. Protected routes
   cannot reopen after a full offline restart. A minimal cached identity, expiry policy, and safe
   revalidation strategy are needed to complete FR-013.
4. **Define offline report authorization by role.** Patient self-access can be resolved locally,
   while professional authorization depends on the access API. The supported offline guarantees
   should be explicit for each role.
5. **Extend reminder scheduling beyond seven days.** There is no demonstrated rolling job that
   replenishes the schedule after the initial window.
6. **Reconcile edited native notifications.** Future database reminder rows are replaced, but
   scheduled native notification identifiers are not persisted with them. Editing a treatment
   needs an explicit cancellation and rescheduling strategy to avoid obsolete notifications.
7. **Improve form usability.** Date/time values currently use typed ISO 8601 strings and treatment
   times use comma-separated text. Native pickers, structured time rows, localization, and clearer
   field-level feedback would reduce input errors.
8. **Add correction and lifecycle workflows.** Clinical-record editing/deletion, final-dose
   correction, and an explicit treatment deactivate/reactivate workflow are absent or out of scope.
9. **Modernize safe-area handling.** Several screens use React Native's deprecated `SafeAreaView`
   instead of `react-native-safe-area-context`.
10. **Clarify the local identity/access schema.** SQLite contains identity and access-grant tables,
    while runtime sharing uses the REST API. Their local purpose should be made explicit or unused
    structures should be removed to prevent competing sources of truth.
11. **Stop relying on matching demo identifiers.** Public authentication responses contain
    `id`, `name`, and `role`, and patient screens fall back to treating the user ID as the patient
    ID. That works for the seeded data but is not a scalable identity model.
12. **Harden device privacy if the scope grows.** Production use would require encrypted clinical
    storage, backup/recovery, retention rules, privacy controls, and a formal threat model.
13. **Finish native validation.** A new Android development build must be installed and the login,
    notification, sharing, accessibility, and offline flows must be exercised on a target device.

## Stage 2 — Backend/API

### Implemented scope

The backend is a small Express 5 service limited to simulated authentication, bearer-token
verification, patient-controlled professional access grants, and health status. It deliberately has
no clinical-record, treatment, adherence, report, synchronization, or export endpoints.

The implementation is divided into route handlers, services, an in-memory access-grant repository,
authentication middleware, configuration validation, and centralized error handling.

### API endpoints

| Method and endpoint                           | Authentication       | Behavior                                                                                                                              |
| --------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /health`                                 | None                 | Returns `200` with `{ "status": "ok" }`.                                                                                              |
| `POST /auth/login`                            | None                 | Accepts `email` and `password`; returns a signed token and `user: { id, name, role }`.                                                |
| `GET /users/me`                               | Bearer token         | Verifies the token and returns the safe current-user shape.                                                                           |
| `GET /patients/:patientId/grants`             | Patient bearer token | Lists grant history for the owning patient. Other actors receive `403`.                                                               |
| `POST /patients/:patientId/grants`            | Patient bearer token | Creates access for `medicCaretakerId`; a duplicate active grant returns `409`.                                                        |
| `DELETE /patients/:patientId/grants/:grantId` | Patient bearer token | Revokes an active grant; a missing or already revoked grant returns `404`.                                                            |
| `GET /patients/:patientId/access`             | Bearer token         | Returns `{ allowed: boolean }`; patients receive self-access and professionals require an active grant. No clinical data is returned. |

Contract errors use this form:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access is not permitted."
  }
}
```

Supported codes include `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
`VALIDATION_ERROR`, and `INTERNAL_ERROR`.

### Authentication and authorization

The API contains one seeded patient and one seeded professional for academic demonstrations.
Passwords are represented as scrypt hashes rather than plaintext. Invalid-account attempts use a
dummy password comparison, reducing obvious user-enumeration timing differences.

Successful login creates an HMAC-SHA256-signed token containing the user identifier, role,
issued-at timestamp, and expiry. The default lifetime is one hour. Signature comparison is
timing-safe, and malformed, expired, or tampered tokens are rejected. Responses never include a
password or password hash.

Patients may list, create, and revoke grants only for their own patient identifier. The access
service validates identifiers, verifies that the professional exists, prevents duplicate active
grants, and records revocation timestamps. Professionals cannot manage grants; they can only check
whether an active grant permits access to a patient.

### API safeguards

The API currently:

- requires a backend-only token secret of at least 32 bytes;
- keeps that secret outside Expo public environment variables;
- disables the `X-Powered-By` response header;
- limits JSON bodies to 32 KB;
- handles malformed JSON through the documented validation-error shape;
- redacts unexpected exceptions behind a generic `500` response;
- uses non-disclosing authentication and access-denial messages;
- returns JSON for unknown routes; and
- handles `SIGINT` and `SIGTERM` with graceful server shutdown.

### Backend pending work and possible improvements

The backend meets the intentionally narrow academic scope. A production-oriented evolution would
need to:

1. Persist users and grants in a database instead of resetting grants on every process restart.
2. Add an account lifecycle: invitation or registration, password changes and recovery, account
   disabling, and professional identity verification.
3. Adopt a mature session design with short-lived access tokens, refresh or reauthentication,
   server-side revocation, key rotation, and meaningful logout invalidation.
4. Return stable role-linked patient/professional identifiers instead of relying on the seeded
   relationship between account IDs and domain IDs.
5. Add login rate limiting, lockout/backoff, and brute-force monitoring.
6. Use structured request schemas and reusable validation rather than route-specific manual checks.
7. Add production HTTPS enforcement, security headers, deployment configuration, and secret
   rotation.
8. Add privacy-safe structured logging, request correlation, monitoring, and an audit trail for
   grant creation and revocation.
9. Define database concurrency and uniqueness behavior so duplicate grants remain safe across
   multiple server processes.
10. Version the API before expanding its public contract.
11. Preserve the current privacy boundary. Any future clinical synchronization would require an
    explicit consent, encryption, audit, conflict-resolution, retention, and recovery design rather
    than simply adding clinical endpoints.

## Stage 3 — Testing and validation

### Automated coverage accomplished

The current repository quality baseline passes:

- `npm run lint`: pass with zero ESLint errors.
- `npm run format:check`: pass.
- Mobile Jest: 36 suites and 219 tests passed.
- API Node tests: 4 suites and 17 tests passed.
- Combined automated result: 40 suites and 236 tests passed.
- Expo Doctor: 18 of 18 checks passed after the Android cleartext configuration change.
- Expo public configuration and Android manifest introspection passed, including generation of
  `android:usesCleartextTraffic="true"`.

The mobile suite contains unit, integration, presentation, accessibility, privacy, and composed
user-story coverage. It verifies:

- clinical entity validation, supported values, ownership, and non-future timestamps;
- treatment scheduling, final dose transitions, and adherence calculations;
- weekly, monthly, and annual report periods and exact alert thresholds;
- SQLite migrations, constraints, transactions, persistence, and patient isolation;
- authentication adapters, secure session cleanup, and role guards;
- offline seizure and trigger entry;
- notification permission denial, overdue reminders, and scheduling-failure fallbacks;
- access grant, report authorization, revocation, and denial-before-clinical-read behavior;
- local JSON mapping, redaction, safe filenames, and absence of HTTP export transmission; and
- accessible labels, touch targets, source order, status text, and non-colour alert cues.

The API suite verifies health responses, malformed JSON, unknown routes, internal-error redaction,
both seeded roles, invalid credentials, safe login responses, bearer restoration, missing/tampered/
expired tokens, role middleware, grant ownership, duplicate rejection, revocation, and denial after
revocation.

### Requirements status

The traceability review records:

- **10 fully passing requirements:** FR-001, FR-002, FR-003, FR-005, and FR-007 through FR-012.
- **1 automated pass awaiting native confirmation:** FR-004, medication notification delivery.
- **2 partial requirements:** FR-006 and FR-013.

FR-006 is partial because the chronological calendar excludes reminders and adherence events.
FR-013 is partial because locally persisted data survives, but a full offline application restart
cannot restore protected routes without API token revalidation. Connected professional report
authorization may also require the API.

### Manual validation still pending

The automated suite does not replace these physical-device checks:

- Install a current Android/iOS development build and inspect notification permission states.
- Confirm a future medication notification appears at the expected time.
- Tap the notification and verify that the matching reminder action opens.
- Exercise the complete patient and professional flows with the seeded accounts.
- Verify screen-reader announcements, focus order, large-font layouts, and physical touch targets.
- Open the native share sheet and inspect the redacted exported file.
- Kill and reopen the application while offline and document the session-restoration limitation.
- Install a new Android build containing the cleartext manifest setting and retry login against the
  local HTTP API.

The project success criteria based on representative-user completion times have not been measured:

- recording a seizure within 60 seconds;
- creating a treatment and confirming a dose within two minutes; and
- finding professional report alerts and adherence information within one minute.

### Testing improvements

1. Add native end-to-end testing, such as Maestro or Detox, for login, real navigation, SQLite
   persistence, notification taps, access changes, and export.
2. Add continuous-integration workflows for linting, formatting, mobile tests, API tests, and Expo
   configuration validation. The repository currently has no GitHub Actions workflow.
3. Enable code-coverage reports and meaningful thresholds; no coverage policy is configured.
4. Begin end-to-end UI tests at each role's landing screen. This would detect the current missing
   navigation between home screens and implemented features.
5. Add a supported Android/iOS device and OS-version regression matrix.
6. Test actual process termination and offline relaunch rather than only reinitializing the SQLite
   provider.
7. Test treatments beyond the seven-day scheduling window and edits made after native
   notifications have already been scheduled.
8. Add performance tests for the documented target of up to 1,000 local events.
9. Add API security, persistence, and concurrency tests when those production-oriented features are
   introduced.
10. Remove or isolate known test warnings, particularly the deprecated `SafeAreaView` warning, so
    new warnings remain visible.
11. Move the feature specification from `Draft` only after the partial requirements and manual
    acceptance evidence are resolved or deliberately descoped.

## Overall status

The application has strong domain, persistence, privacy-boundary, and automated-test foundations
for an academic prototype. The implemented feature modules are broader than the currently connected
navigation experience. The highest-priority completion work is therefore to expose all features
through normal navigation, rebuild and validate Android HTTP access on a physical device, complete
the calendar and offline-restart requirements, and record native accessibility, notification, and
sharing evidence.
