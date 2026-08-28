# MySeizures Architecture

## Purpose and scope

MySeizures is an academic mobile prototype for demonstrating offline epilepsy-care tracking. It is
not a medical device, diagnostic system, emergency service, or production clinical record. The
prototype deliberately separates locally stored clinical information from a small simulated REST
API that handles demonstration accounts and access grants only.

The implementation follows the project Constitution and the feature plan for
`001-manage-epilepsy-care`.

## System boundaries

| Boundary              | Responsibility                                                                                                   | Must not do                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Mobile presentation   | Expo Router screens, accessible controls, navigation guards, and visible loading/error/empty states              | Contain clinical rules or query SQLite directly                                   |
| Mobile application    | Use cases and ports for authentication, clinical records, treatments, access, reports, notifications, and export | Import Expo, SQLite, or HTTP implementations                                      |
| Mobile domain         | Entities, value validation, schedule rules, adherence aggregation, report periods, and prototype alert rules     | Depend on React Native, Expo, SQLite, or Express                                  |
| Mobile infrastructure | SQLite repositories, REST clients, secure session storage, local notifications, and local JSON files             | Decide business authorization or clinical thresholds                              |
| Mobile composition    | Creates adapters and injects them into use cases                                                                 | Implement business rules                                                          |
| Simulated API         | Demonstration authentication and patient-controlled professional access grants                                   | Receive or persist seizures, triggers, treatments, adherence, reports, or exports |

Dependencies point inward: presentation and infrastructure depend on application/domain contracts;
the domain has no framework dependency. The composition root at
`mobile/src/composition/container.js` is the only place that assembles the concrete mobile adapters.

## Runtime view

```text
Expo Router screens
        |
        v
Application use cases <---- application ports ---- infrastructure adapters
        |                                            |       |       |
        v                                            v       v       v
Domain entities and rules                         SQLite  Secure  Expo APIs
                                                           Store

Mobile REST client -------- HTTPS/JSON -------- Simulated Express API
        authentication and access grants only
```

The API and mobile app are separate deployable processes. SQLite on the mobile device is the source
of truth for clinical information. The API is not a synchronization service and never becomes a
clinical-data source.

## Data ownership and storage

| Data                                        | Source of truth           | Protection and access boundary                                               |
| ------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------- |
| Seizures and possible triggers              | Mobile SQLite             | Every repository query binds a required `patient_id`                         |
| Treatments, times, reminders, and adherence | Mobile SQLite             | Foreign keys, transactions, patient scoping, and one final dose confirmation |
| Patient profile used for local export       | Mobile SQLite             | Read only after report authorization succeeds                                |
| Reports, trends, and alerts                 | Derived in memory         | Recomputed from authorized, selected-period local data; no report table      |
| Export document                             | Local JSON file           | Versioned allow-list mapping; excludes credentials and unrelated fields      |
| Session token                               | Device secure storage     | Only the token is persisted; rejected tokens are cleared                     |
| Demo users and access grants                | Simulated REST API memory | Bearer authentication, role checks, ownership checks, and revocation         |

No background synchronization queue exists. Uninstalling the app or clearing its storage can remove
the local prototype data, and there is no cloud recovery mechanism.

## Principal data flows

### Authentication and sharing

1. The sign-in screen sends demo credentials to the API.
2. The API validates the seeded user and returns a signed token plus a minimal public user shape.
3. The mobile app stores only the token in secure device storage and validates it through
   `GET /users/me` when restoring a session.
4. Patient grant/list/revoke actions and professional access checks use the token and the simulated
   access-grant endpoints.
5. API responses contain no clinical records. Revoked or unauthorized access returns a safe denial.

This flow requires the simulated API. It is distinct from the offline clinical flows below.

### Local clinical records and treatment

1. A patient screen calls a patient-scoped application use case.
2. Domain entities validate identifiers, enumerations, required values, and timestamps.
3. A repository performs parameterized SQLite work with a mandatory `patient_id` binding.
4. Multi-record treatment/reminder changes run transactionally.
5. The UI reports success only after the local write succeeds.

Seizure/trigger entry, calendar history, treatments, adherence, and in-app reminder fallback do not
send clinical data to the API.

### Medication reminders

Treatment scheduling generates future reminder rows locally. The notification adapter requests
device permission and schedules local notifications for future reminders. Permission denial,
overdue reminders, or native scheduling failure leaves the reminders actionable in the in-app list.
A reminder may reach one final state, `TAKEN` or `MISSED`; correction after final confirmation is out
of scope.

Notifications are medication prompts only. They are never clinical-risk or emergency alerts.

### Reports and prototype alerts

`GenerateReport` verifies that the actor is the patient or has an active access grant before any
clinical repository query. It selects an inclusive weekly, monthly, or annual period, loads scoped
records, derives trigger counts, and calculates adherence from final dose confirmations only.

Reports and charts are transient views. They are not stored snapshots, so the current local records
remain the source of truth.

### Local export

`ExportReport` first invokes the authorized report use case. Only after authorization succeeds does
it read the local patient profile, map the report to export contract version `1.0`, validate the
document, and create a local JSON file. Device sharing may be opened for the user, but the adapter
contains no RNDS, e-SUS, electronic-record, or other network submission path.

The mapper uses an explicit allow-list and omits passwords, password hashes, session tokens, email,
internal timestamps, diagnosis date, rule version, and data belonging to other patients.

## Prototype alert rules and limitations

The current immutable rule set is `prototype-1.0`:

| Rule                | Condition within the selected report period | Output                           |
| ------------------- | ------------------------------------------- | -------------------------------- |
| `SEIZURE_FREQUENCY` | At least 3 recorded seizures                | `HIGH` informational indicator   |
| `LOW_ADHERENCE`     | Defined adherence rate below 80%            | `MEDIUM` informational indicator |

Adherence is `taken final confirmations / all final confirmations × 100`. When no dose has a final
confirmation, the rate is undefined and the low-adherence rule does not run. Exactly 80% does not
match the low-adherence rule; exactly three seizures does match the seizure-frequency rule.

These thresholds are test fixtures chosen for an academic prototype. They:

- are not validated clinical protocols or individualized medical advice;
- do not diagnose epilepsy, predict a seizure, assess immediate danger, or determine treatment;
- depend on the completeness and accuracy of user-entered local records;
- do not contact a professional, caregiver, emergency service, or notification channel;
- must not be interpreted as absence of risk when no rule matches; and
- require a new documented version and boundary tests before any change.

The UI must always show the severity, reason, and informational disclaimer in text, rather than
communicating status through colour alone.

## Security, privacy, accessibility, and resilience

- Route guards enforce patient and professional areas, while use cases and API services enforce the
  corresponding data authorization again.
- Patient-scoped repository helpers reject SQL that lacks both `patient_id` and its bound parameter.
- Denied report/export paths stop before clinical reads or file creation and use non-disclosing
  messages.
- The export allow-list minimizes disclosed fields; it does not serialize domain objects wholesale.
- Screens use accessible labels, hints, status announcements, large touch targets, readable
  contrast, predictable source order, and textual status cues.
- Record entry, calendar, treatment, adherence, and in-app reminder workflows remain local after the
  app and session have been initialized. Authentication, grant changes, professional grant
  verification, and current connected report authorization require the API.

LGPD-aligned safeguards here are prototype design measures, not a legal or production-security
certification. Development and demonstrations must use synthetic data only.

## Testing boundaries

- Domain/unit tests cover validations, schedules, adherence, alert boundaries, and export mapping.
- SQLite integration tests cover migrations, transactions, persistence, and patient isolation.
- Presentation tests cover accessible controls, screen flows, role guards, and non-disclosing states.
- API integration tests cover authentication, ownership, grants, revocation, and safe errors.
- User-story integration tests exercise offline records, treatment/reminders, sharing/report denial,
  and local-only export.

Manual device acceptance remains necessary for native notification delivery, assistive technology,
dynamic font behavior, and the complete quickstart demonstration.

## Known implementation constraints

- A full mobile-process restart revalidates the securely stored token with the API before protected
  routes reopen. SQLite records survive offline, but session restoration currently needs the API.
- Report aggregation and export operate on local data; the connected authorization path may still
  call the access API, so they are not guaranteed after an offline process restart.
- Access grants are held in API memory and reset when that process restarts.
- A professional demonstration uses the clinical SQLite database on the demonstration device; the
  API does not transfer clinical information between devices.

These constraints are intentionally visible for validation and must not be described as production
offline continuity, multi-device sharing, backup, or recovery.

## Related decisions and specifications

- [ADR 0001: Keep clinical data local](adr/0001-local-clinical-source-of-truth.md)
- [ADR 0002: Derive reports and keep alerts/export non-clinical](adr/0002-derived-reports-alerts-and-local-export.md)
- [Feature specification](../specs/001-manage-epilepsy-care/spec.md)
- [Implementation plan](../specs/001-manage-epilepsy-care/plan.md)
- [Data model](../specs/001-manage-epilepsy-care/data-model.md)
- [REST API contract](../specs/001-manage-epilepsy-care/contracts/rest-api.md)
- [JSON export contract](../specs/001-manage-epilepsy-care/contracts/export-json.md)
