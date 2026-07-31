# Implementation Plan: Manage Epilepsy Care

**Branch**: `001-manage-epilepsy-care` | **Date**: 2026-07-31 | **Spec**: [spec.md](spec.md)

## Summary

Build an Android/iOS academic prototype for adult epilepsy monitoring. A React Native mobile client
uses offline-first local storage for all core care workflows; a small JavaScript REST API simulates
accounts and authorized professional sharing. Clean Architecture separates presentation,
application, domain, and infrastructure. The scope excludes production synchronization and all
direct government or electronic-record integration.

## Technical Context

**Language/Version**: Modern JavaScript (ES2022+); Node.js active LTS for the simulated API

**Primary Dependencies**: Expo/React Native, Expo Router, Expo SQLite, Expo Notifications, React
Hook Form with Zod, Zustand, React Native Testing Library, Jest, Supertest, Express, Chart Kit

**Storage**: SQLite on device for clinical data; REST API in-memory or local development database
for simulated accounts and access grants; secure device storage for the active session token

**Testing**: Jest for domain and application rules; React Native Testing Library for screens; API
integration tests with Supertest; manual device validation for scheduled notifications and offline
flows

**Target Platform**: Android and iOS mobile; desktop and web are out of scope

**Project Type**: Mobile application plus simulated REST API

**Performance Goals**: Create a seizure record in under 60 seconds; open a selected report in under
1 minute; render a calendar/report period with up to 1,000 local events in under 2 seconds on a
representative device

**Constraints**: Offline core workflows; clinical data minimized and access-controlled; accessible,
low-cognitive-load UI; no direct RNDS/e-SUS transmission; alerts are informational only

**Scale/Scope**: Academic prototype; two roles, up to 10 demo users, one patient's local history
per device, and weekly/monthly/annual reports

## Constitution Check

| Gate | Status | Evidence |
| --- | --- | --- |
| Clean Architecture and dependency direction | PASS | `src/domain` has no framework/storage imports; interfaces are owned by the application layer. |
| SOLID and single-purpose UI | PASS | Features use focused screens, hooks, use cases, and repositories. |
| Specification and acceptance evidence | PASS | Each FR is traceable to contract, test, and quickstart scenario. |
| Critical-rule automated tests | PASS | Alert evaluation, access grants, schedule generation, and adherence rate are unit tested. |
| Privacy, accessibility, offline resilience | PASS | Local-first writes, minimum data, role checks, accessible labels, and resilient empty/error states are planned. |

Post-design re-check: PASS. No unjustified constitutional exception or added architectural layer is
required.

## Project Structure

### Documentation (this feature)

```text
specs/001-manage-epilepsy-care/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── rest-api.md
│   └── export-json.md
└── tasks.md                 # Created by speckit-tasks
```

### Source Code (repository root)

```text
mobile/
├── app/                     # Route entry points only
├── src/
│   ├── presentation/{features,components,navigation,state}
│   ├── application/{use-cases,ports,dto}
│   ├── domain/{entities,value-objects,rules}
│   ├── infrastructure/{persistence,notifications,api,export,security}
│   └── composition/
└── tests/{unit,integration,presentation}

api/
├── src/{routes,services,repositories,middleware}
└── tests/integration/
```

**Structure Decision**: The mobile client and simulated API are separate deployable boundaries. The
mobile `domain` and `application` layers remain independent of Expo, SQLite, and HTTP. The API does
not become the source of truth for clinical history and is limited to simulated account/access data.

## Architecture and Module Strategy

- **Presentation**: accessible screens and view models call use cases only. Use large touch targets,
  clear labels, predictable navigation, readable contrast, and no critical information conveyed by
  colour alone.
- **Application**: use cases coordinate validations, repositories, notifications, reporting,
  authorization, and export. Ports make framework dependencies replaceable in tests.
- **Domain**: entities and pure rules enforce ownership, access grants, schedule generation,
  adherence rates, and informational alert conditions.
- **Infrastructure**: SQLite repositories and migrations provide local persistence; notification,
  REST, secure-session, and JSON export adapters implement application ports.
- **Composition**: a single composition root instantiates adapters and injects them into use cases.

### Persistence and Offline Strategy

SQLite is the source of truth for seizure, trigger, treatment, reminder, adherence, report-input,
and local patient-profile data. Apply ordered migrations, indexes for patient/date queries,
parameterized statements, and transactions for multi-record changes. Every core write commits
locally before the UI reports success. The API is not used for core records, so connection loss never
blocks entry, calendar, report, or export. No background sync queue is created because cloud
synchronization is out of scope.

### Notification Strategy

When a treatment is created or edited, `ScheduleTreatmentReminders` validates base times, replaces
future scheduled reminders for that treatment, and schedules local device notifications. Each
notification opens a confirm-dose screen; confirmation is idempotent. Permission denial, overdue
reminders, and schedule changes have an understandable in-app fallback. Notifications are medication
reminders only, never clinical-emergency alerts.

### Reports, Alerts, and Export Strategy

`GenerateReport` queries a selected period and calculates adherence only from final taken/missed
confirmations. Chart view models are derived from report data, never stored as truth.
`EvaluateClinicalAlerts` applies documented prototype thresholds and returns severity/reason; it
never diagnoses or dispatches emergencies. `ExportReport` maps the authorized report to the versioned
JSON contract, validates it, stores/shares the file locally, and never sends it to RNDS/e-SUS.

### Suggested Libraries

| Need | Library | Reason |
| --- | --- | --- |
| Mobile foundation/routing | Expo + Expo Router | Supported React Native framework and file-based routing. |
| Local database | `expo-sqlite` | Persistent SQLite API with migration and parameterized-query support. |
| Local reminders | `expo-notifications` | Device notification scheduling and response handling. |
| Forms/validation | `react-hook-form` + `zod` | Small, explicit forms with reusable validation schemas. |
| UI state | `zustand` | Minimal state container; domain state remains in repositories/use cases. |
| Charts | `react-native-chart-kit` + `react-native-svg` | Simple visual summaries for the prototype. |
| Tests | `jest`, React Native Testing Library, `supertest` | Unit, UI, and REST contract coverage. |

## Implementation Schedule

| Sprint | Goal | Deliverables |
| --- | --- | --- |
| 1 | Foundation and identity | Workspace, navigation, SQLite migrations, simulated sign-in, role guards, accessibility baseline. |
| 2 | Daily clinical tracking | Seizure/trigger forms, validation, offline history, calendar, record tests. |
| 3 | Treatment and adherence | Schedules, local reminders, dose confirmation, adherence calculation, notification validation. |
| 4 | Professional review | Access grant/revocation, authorization, period reports, charts, informational alerts. |
| 5 | Export and quality | JSON export, offline/error validation, privacy/access tests, accessibility pass, demo script. |

## Complexity Tracking

No constitutional violations require justification.
