# Tasks: Manage Epilepsy Care

**Input**: Design documents in `specs/001-manage-epilepsy-care/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [data-model.md](data-model.md),
[REST contract](contracts/rest-api.md), and [export contract](contracts/export-json.md)

**Tests**: Automated tests are required for critical business rules by the Constitution.

**Organization**: Tasks are grouped by setup/foundation and independently testable user stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can proceed in parallel after its listed prerequisites are complete.
- **[US#]**: Maps to the corresponding user story in the specification.

## Phase 1: Setup — Configuration Module (Complexity: Medium)

**Purpose**: Create the minimal mobile/API workspace and shared quality tooling.

- [X] T001 Create npm workspace, `mobile/` Expo app, and `api/` JavaScript service structure in `package.json`, `mobile/package.json`, and `api/package.json`; completion: both workspaces install successfully.
- [X] T002 [P] Configure Expo Router entry points and route groups in `mobile/app/_layout.js` and `mobile/app/(auth)/`; completion: the app opens a placeholder authentication route.
- [X] T003 [P] Configure ESLint, Prettier, Jest, and shared test commands in `eslint.config.js`, `prettier.config.js`, and `package.json`; completion: lint and empty test suites run successfully.
- [X] T004 [P] Add environment templates and runtime configuration boundaries in `.env.example`, `mobile/src/composition/config.js`, and `api/src/config.js`; completion: no secret is committed and missing required configuration fails clearly.
- [X] T005 [P] Add the initial project overview and local setup instructions in `README.md`; completion: a new contributor can identify both workspaces and the run commands.

---

## Phase 2: Foundational Modules — Database, Domain, Persistence, API, and Interface (Complexity: High)

**Purpose**: Build prerequisites shared by every functional increment. No user-story work begins until this phase is complete.

- [X] T006 Define the SQLite migration runner and create user, patient, professional, and access-grant tables in `mobile/src/infrastructure/persistence/migrations/001_identity.js`; completion: migrations create foreign keys and uniqueness constraints from `data-model.md`.
- [X] T007 Create clinical SQLite tables, indexes, and migration versioning for records, treatments, reminders, and adherence in `mobile/src/infrastructure/persistence/migrations/002_clinical.js`; completion: patient/date queries are indexed and all relationships are enforced.
- [X] T008 [P] Define shared domain entities, enumerations, and value validations in `mobile/src/domain/entities/` and `mobile/src/domain/value-objects/`; completion: invalid role, timestamp, frequency, and enum values are rejected without framework imports.
- [X] T009 [P] Define repository, notification, export, and authentication ports in `mobile/src/application/ports/`; completion: application use cases have no SQLite, Expo, or HTTP imports.
- [X] T010 Implement the SQLite database provider, transaction helper, and migration bootstrap in `mobile/src/infrastructure/persistence/sqlite/DatabaseProvider.js`; completion: the app initializes an up-to-date database once per launch.
- [X] T011 Implement base SQLite repositories and patient-scoped query guard in `mobile/src/infrastructure/persistence/repositories/`; completion: every clinical query requires a patient identifier and uses parameter binding.
- [X] T012 [P] Implement the simulated REST API application, error middleware, and health route in `api/src/app.js`, `api/src/middleware/errorHandler.js`, and `api/src/routes/healthRoutes.js`; completion: malformed requests receive the contract error shape.
- [X] T013 Implement login, token verification, seed users, and role middleware in `api/src/routes/authRoutes.js`, `api/src/services/AuthService.js`, and `api/src/middleware/authenticate.js`; completion: valid demo accounts receive a token and invalid credentials return 401.
- [X] T014 Implement the mobile REST client, secure session storage, and authentication use case in `mobile/src/infrastructure/api/RestClient.js`, `mobile/src/infrastructure/security/SessionStore.js`, and `mobile/src/application/use-cases/SignIn.js`; completion: a session restores only for a valid token.
- [X] T015 Implement dependency composition, role-aware navigation guards, accessible base components, and application error states in `mobile/src/composition/container.js`, `mobile/src/presentation/navigation/`, and `mobile/src/presentation/components/`; completion: unauthenticated users cannot reach protected routes and controls expose labels/hints.
- [X] T016 Create unit and API integration test fixtures for identity, authorization, and database startup in `mobile/tests/unit/factories/`, `mobile/tests/integration/databaseBootstrap.test.js`, and `api/tests/integration/auth.test.js`; completion: migrations and login contract pass automatically.

**Checkpoint**: Foundation ready — the mobile client starts, authenticates seeded roles, and owns an initialized offline database.

---

## Phase 3: User Story 1 — Record Daily Clinical Events (Priority: P1) 🎯 MVP (Complexity: Medium)

**Goal**: A patient records seizures and triggers offline and finds them in chronological history.

**Independent Test**: Disable connectivity, save one seizure and one trigger, restart the app, and verify both in the calendar/history.

### Tests for User Story 1

- [ ] T017 [P] [US1] Add unit tests for seizure/trigger validation, non-future timestamps, and patient ownership in `mobile/tests/unit/domain/clinicalRecords.test.js`; completion: valid and invalid boundaries are covered.
- [ ] T018 [P] [US1] Add repository integration tests for offline create/read and chronological filtering in `mobile/tests/integration/clinicalRecordRepository.test.js`; completion: persisted records survive provider reinitialization.
- [ ] T019 [P] [US1] Add screen-flow tests for patient seizure and trigger entry in `mobile/tests/presentation/clinicalRecords.test.js`; completion: required-field errors and successful saves are observable.

### Implementation for User Story 1

- [ ] T020 [P] [US1] Implement seizure and trigger SQLite repositories in `mobile/src/infrastructure/persistence/repositories/SeizureRepository.js` and `mobile/src/infrastructure/persistence/repositories/TriggerRepository.js`; completion: CRUD operations retain all required fields.
- [ ] T021 [US1] Implement `RecordSeizure`, `RecordTrigger`, and `ListChronologicalEvents` use cases in `mobile/src/application/use-cases/clinical/`; completion: each validates input and scopes results to the active patient.
- [ ] T022 [P] [US1] Create reusable accessible date/time, select, and form-feedback controls in `mobile/src/presentation/components/forms/`; completion: controls have labels, validation messages, and keyboard-friendly focus order.
- [ ] T023 [US1] Build seizure and trigger entry screens in `mobile/app/(patient)/seizures/new.js` and `mobile/app/(patient)/triggers/new.js`; completion: valid records save locally and show a clear confirmation.
- [ ] T024 [US1] Build the chronological calendar/history screen in `mobile/app/(patient)/calendar.js` and `mobile/src/presentation/features/calendar/`; completion: selected-period events are ordered and distinguish seizure from trigger.
- [ ] T025 [US1] Validate the complete offline records journey and capture MVP evidence in `mobile/tests/integration/us1-offline-flow.test.js`; completion: the independent test passes with network access disabled.

**Checkpoint**: The MVP supports offline patient seizure/trigger tracking and calendar review.

---

## Phase 4: User Story 2 — Follow Treatment and Confirm Doses (Priority: P1) (Complexity: High)

**Goal**: A patient manages treatment schedules, receives local reminders, and records adherence.

**Independent Test**: Create a treatment with two times, verify reminders, confirm one taken and one missed, then verify adherence history.

### Tests for User Story 2

- [ ] T026 [P] [US2] Add unit tests for treatment validation, reminder generation, idempotent confirmation, and adherence rate in `mobile/tests/unit/domain/treatmentRules.test.js`; completion: scheduling and boundary cases pass.
- [ ] T027 [P] [US2] Add integration tests for atomic treatment/reminder persistence in `mobile/tests/integration/treatmentRepository.test.js`; completion: edits replace only future reminders and preserve confirmations.
- [ ] T028 [P] [US2] Add notification-adapter tests with a fake scheduler in `mobile/tests/integration/reminderNotification.test.js`; completion: created/edited treatments schedule the expected local reminders.

### Implementation for User Story 2

- [ ] T029 [P] [US2] Implement treatment, reminder, and adherence repositories in `mobile/src/infrastructure/persistence/repositories/`; completion: each enforces the relationships and one-final-confirmation rule.
- [ ] T030 [US2] Implement treatment management, reminder generation, and adherence use cases in `mobile/src/application/use-cases/treatment/`; completion: treatment changes atomically replace only future reminder rows.
- [ ] T031 [US2] Implement the local-notification adapter and permission/overdue fallback in `mobile/src/infrastructure/notifications/ExpoNotificationService.js`; completion: a denied permission leaves an actionable in-app reminder list.
- [ ] T032 [US2] Build treatment form, reminder list, and dose-confirmation screens in `mobile/app/(patient)/treatments/` and `mobile/app/(patient)/reminders.js`; completion: patient can create/edit treatment and make one final confirmation per reminder.
- [ ] T033 [US2] Connect notification responses to the confirmation route in `mobile/src/presentation/navigation/notificationDeepLink.js`; completion: tapping a reminder opens its matching dose action.
- [ ] T034 [US2] Validate the treatment/adherence journey on a device or simulator in `mobile/tests/integration/us2-treatment-flow.test.js`; completion: the independent test and notification fallback scenario pass.

**Checkpoint**: Patient medication planning, local reminders, and adherence tracking are demonstrable.

---

## Phase 5: User Story 3 — Review and Share Care Information (Priority: P2) (Complexity: High)

**Goal**: A patient controls professional access, and an authorized doctor/caregiver reviews reports and informational alerts.

**Independent Test**: Grant a seeded professional access, view a report and alert, revoke access, then verify subsequent access is denied.

### Tests for User Story 3

- [ ] T035 [P] [US3] Add REST contract tests for grant creation, duplicate grant, revocation, and post-revocation access in `api/tests/integration/accessGrants.test.js`; completion: all outcomes match `contracts/rest-api.md`.
- [ ] T036 [P] [US3] Add unit tests for report period selection, adherence aggregation, and alert threshold boundaries in `mobile/tests/unit/domain/reportingRules.test.js`; completion: empty periods and boundary patterns are covered.
- [ ] T037 [P] [US3] Add presentation tests for role-based access and denied-state messaging in `mobile/tests/presentation/professionalAccess.test.js`; completion: unauthorized data is never rendered.

### Implementation for User Story 3

- [ ] T038 [US3] Implement API access-grant repository, service, routes, and ownership checks in `api/src/repositories/AccessGrantRepository.js`, `api/src/services/AccessGrantService.js`, and `api/src/routes/accessGrantRoutes.js`; completion: grant endpoints enforce the REST contract.
- [ ] T039 [US3] Implement mobile access-grant client and grant/revoke/authorize use cases in `mobile/src/infrastructure/api/AccessGrantClient.js` and `mobile/src/application/use-cases/access/`; completion: client maps API errors to safe application results.
- [ ] T040 [P] [US3] Implement report aggregation and informational alert-rule services in `mobile/src/domain/rules/` and `mobile/src/application/use-cases/reporting/`; completion: reports derive records/trends and alert severity/reason without storing snapshots.
- [ ] T041 [US3] Build patient sharing-management and professional patient-access screens in `mobile/app/(patient)/sharing.js` and `mobile/app/(professional)/patients/`; completion: grants can be created/revoked and active access is visible.
- [ ] T042 [US3] Build professional report, chart, alert, and empty-period screens in `mobile/app/(professional)/reports/[patientId].js` and `mobile/src/presentation/features/reports/`; completion: only authorized users see selected-period summaries.
- [ ] T043 [US3] Validate the grant-report-revoke journey in `mobile/tests/integration/us3-sharing-report-flow.test.js`; completion: revoked users cannot access report, alerts, or clinical details.

**Checkpoint**: Controlled sharing, professional review, reports, and non-diagnostic alerts are demonstrable.

---

## Phase 6: User Story 4 — Export a Care Summary (Priority: P3) (Complexity: Medium)

**Goal**: An authorized user exports a selected report as a local structured JSON file without external transmission.

**Independent Test**: Export an authorized report, validate its fields against the contract, and verify no network request occurs.

### Tests for User Story 4

- [ ] T044 [P] [US4] Add unit tests for RNDS/e-SUS mapping, format version, and field omission in `mobile/tests/unit/domain/exportMapping.test.js`; completion: every required contract field is validated.
- [ ] T045 [P] [US4] Add integration tests for authorization and local-only export behavior in `mobile/tests/integration/exportReport.test.js`; completion: unauthorized export fails and no HTTP call is made.

### Implementation for User Story 4

- [ ] T046 [US4] Implement the versioned report-to-JSON mapper and contract validation in `mobile/src/infrastructure/export/RndsExportMapper.js`; completion: output conforms to `contracts/export-json.md` and excludes secrets.
- [ ] T047 [US4] Implement local file generation and share/save adapter in `mobile/src/infrastructure/export/ReportFileExporter.js`; completion: a valid report creates a local shareable JSON file with no transmission logic.
- [ ] T048 [US4] Implement `ExportReport` authorization use case and export action in `mobile/src/application/use-cases/export/ExportReport.js` and `mobile/app/(shared)/report-export.js`; completion: patient/professional exports require authorized report access.
- [ ] T049 [US4] Validate an authorized export and a denied export in `mobile/tests/integration/us4-export-flow.test.js`; completion: the independent test passes and the generated sample is redacted for TCC evidence.

**Checkpoint**: The prototype demonstrates structured local report export without government-system integration.

---

## Phase 7: Polish and Cross-Cutting Modules — Tests and Documentation (Complexity: Medium)

**Purpose**: Verify the assembled prototype against its specification and prepare the academic handoff.

- [ ] T050 [P] Add accessibility regression tests for labels, touch targets, contrast tokens, focus order, and non-colour status cues in `mobile/tests/presentation/accessibility.test.js`; completion: critical patient/professional screens pass defined assertions.
- [ ] T051 [P] Add privacy/security regression tests for session handling, role checks, patient scoping, and JSON exclusion of secrets in `mobile/tests/integration/privacyAccess.test.js`; completion: denied paths expose no clinical data.
- [ ] T052 [P] Update architecture, alert-rule limitations, data-flow, and decision records in `docs/architecture.md` and `docs/adr/`; completion: Clean Architecture boundaries and prototype constraints are documented.
- [ ] T053 [P] Update installation, scripts, demo accounts, offline validation, and limitations in `README.md`; completion: it matches `quickstart.md` and contains no production-care claims.
- [ ] T054 Run the complete quality suite and quickstart acceptance scenarios, recording results in `specs/001-manage-epilepsy-care/validation.md`; completion: unit, API, UI, offline, notification, sharing, and export evidence is linked.
- [ ] T055 Conduct final requirements traceability review in `specs/001-manage-epilepsy-care/traceability.md`; completion: FR-001 through FR-013 each map to implementation, automated evidence, and an acceptance result.

## Dependencies & Recommended Module Order

```text
Configuration → Database + Domain + Persistence + API + Interface foundation
             → US1 Patient records/calendar (MVP)
             → US2 Treatment/adherence/notifications
             → US3 Sharing/reports/alerts
             → US4 JSON export
             → Cross-cutting tests and documentation
```

| Module | Depends on | Complexity | Suggested milestone |
| --- | --- | --- | --- |
| 1. Configuration | None | Medium | M1: Workspace running |
| 2. Database | Configuration | Medium | M2: Offline schema ready |
| 3. Domain | Configuration | Medium | M2: Core rules defined |
| 4. Persistence | Database, Domain | Medium | M2: Offline repositories ready |
| 5. API | Configuration | Medium | M2: Simulated identity/access API ready |
| 6. Interface | Configuration, Domain | Medium | M2: Accessible shell ready |
| 7. Patient features | Persistence, Interface | Medium | M3: Offline records MVP |
| 9. Notifications | Treatment/adherence | Medium | M4: Adherence workflow ready |
| 8. Professional features | API, patient data | High | M5: Shared review ready |
| 10. Reports | Patient data, adherence | High | M5: Period reports ready |
| 11. Clinical alerts | Reports | Medium | M5: Informational alerts ready |
| 12. RNDS export | Reports, authorization | Medium | M6: Local export ready |
| 13. Tests | All modules | Medium | M7: Acceptance evidence complete |
| 14. Documentation | All modules | Low | M7: TCC handoff complete |

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 2 and is the recommended MVP.
- **US2 (P1)**: Depends on Phase 2; its adherence reports feed US3 but its core flow is independently testable.
- **US3 (P2)**: Depends on Phase 2 and benefits from US1/US2 data for meaningful reports; access control is independently testable with seeded data.
- **US4 (P3)**: Depends on US3 report generation and authorization.

### Parallel Opportunities

- In Phase 1: T002–T005 can run after T001.
- In Phase 2: T008, T009, and T012 can proceed alongside schema work; T016 follows their relevant foundations.
- Per story: all tasks marked `[P]` can be split across contributors after their prerequisites complete.
- In final polish: T050–T053 can proceed in parallel before T054–T055.

## Implementation Strategy

### MVP First

1. Complete T001–T016.
2. Complete T017–T025 and validate the offline records journey.
3. Demonstrate this as the smallest valuable prototype increment.

### Incremental Delivery

1. Add treatment/adherence and notifications (T026–T034).
2. Add controlled professional access, reports, and alerts (T035–T043).
3. Add local structured export (T044–T049).
4. Complete evidence, documentation, and traceability (T050–T055).
