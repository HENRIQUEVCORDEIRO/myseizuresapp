# ADR 0001: Keep clinical data in local SQLite

- **Status**: Accepted
- **Date**: 2026-08-27
- **Decision owners**: MySeizures academic prototype team

## Context

The prototype must retain core care information and support recording, calendar, treatment,
adherence, reports, and export when connectivity is unavailable. It also needs a REST API
demonstration for authentication and controlled professional access, without claiming cloud clinical
synchronization.

Clinical information is sensitive. A remote-first design would expand the privacy surface, make core
workflows depend on connectivity, and introduce synchronization conflict handling that is outside
the feature specification.

## Decision

SQLite on the mobile device is the sole source of truth for patient profiles used by the prototype,
seizures, possible triggers, treatments, treatment times, reminders, and adherence confirmations.
Reports, alerts, and exports are derived from that local data.

The Express API is limited to simulated accounts, token validation, and patient-controlled access
grants. It has no clinical-record routes or storage. There is no background synchronization queue.

Mobile persistence uses ordered migrations, foreign keys, parameterized SQL, transactions for
multi-record updates, and mandatory patient scoping. The session token is held in secure device
storage rather than SQLite.

## Consequences

### Positive

- Core patient workflows remain usable when the API or network is unavailable.
- The API cannot accidentally become an undocumented clinical-data store.
- Relational constraints and patient-scoped queries provide explicit local integrity boundaries.
- The design is small enough for reproducible academic testing.

### Trade-offs and risks

- Clinical history is available only on the device/database where it was entered.
- Clearing app storage or losing the device can lose prototype data; backup and recovery are absent.
- A professional demonstration needs access to the same local clinical database after the API
  confirms an active grant.
- Grant changes and authentication still require connectivity.
- This architecture is not sufficient for production multi-device care, disaster recovery, auditing,
  or regulated retention.

## Alternatives considered

- **Remote-first clinical API**: rejected because it violates offline-first scope and materially
  expands privacy, deployment, and synchronization work.
- **Bidirectional local/cloud synchronization**: rejected because conflict resolution, encryption,
  audit, and recovery are outside the prototype.
- **Key-value device storage**: rejected because clinical period queries and entity relationships
  require relational constraints and indexed filtering.
