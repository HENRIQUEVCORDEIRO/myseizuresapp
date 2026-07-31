# Research: Manage Epilepsy Care

## Mobile Foundation

**Decision**: Use Expo as the React Native framework and Expo Router for mobile navigation.

**Rationale**: React Native recommends a framework for new applications; Expo supplies the native
module ecosystem needed by this academic prototype.

**Alternatives considered**: Bare React Native plus independently configured navigation and native
modules. Rejected because it adds setup and maintenance without advancing the prototype.

## Local Persistence

**Decision**: Use `expo-sqlite` with explicit schema migrations, parameterized queries, indexes by
patient/date, and transactions for related writes.

**Rationale**: The library persists the database across app restarts and supports asynchronous,
parameterized operations. Local SQLite makes clinical entries, reports, and export available offline.

**Alternatives considered**: Async key-value storage (insufficient relational querying/reporting) and
a remote-first database (contradicts the offline-first constitution).

## Notifications

**Decision**: Use scheduled local notifications through `expo-notifications`, plus an in-app
reminder list as the required fallback.

**Rationale**: Medication schedules are generated locally and must remain useful without an API.
The fallback makes the workflow usable when permission is denied or delivery is delayed.

**Alternatives considered**: Server push notifications (requires cloud delivery and is out of scope)
and smartwatch notifications (explicitly excluded).

## REST API Scope

**Decision**: Implement a small Express REST API solely for simulated authentication and
doctor/caregiver access-grant demonstrations; keep clinical records local.

**Rationale**: It meets the academic REST API requirement without misrepresenting the prototype as
cloud-synchronized clinical software. The API's absence cannot block core patient workflows.

**Alternatives considered**: A clinical-data API (contradicts no cloud synchronization) and no API
(does not meet the stated technical requirement).

## Reporting, Alerts, and Export

**Decision**: Derive reports and charts from local records for a selected period; express alerts as
versioned prototype rules; serialize export according to a documented JSON mapping.

**Rationale**: Derived data avoids stale summaries. Explicit alert thresholds are testable and avoid
claiming clinical certification. The mapping enables transparent RNDS/e-SUS compatibility
demonstration without direct transmission.

**Alternatives considered**: Persisted report snapshots (staleness risk), opaque alert logic
(untestable), and direct RNDS/e-SUS integration (out of scope).

## Testing and Privacy

**Decision**: Test pure clinical rules at unit level; test SQLite repositories/use-case composition
at integration level; test screens with assistive labels; verify API contracts and authorization.

**Rationale**: The Constitution mandates automated coverage of critical business rules. A layered
test pyramid keeps evidence fast and isolates framework behavior.

**Alternatives considered**: End-to-end-only testing (slow and weak at rule diagnosis) and UI-only
testing (would leave domain rules unverified).

## Sources

- [React Native: Get Started](https://reactnative.dev/docs/environment-setup)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [React Navigation: Getting Started](https://reactnavigation.org/docs/getting-started/)
