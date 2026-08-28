# ADR 0002: Derive reports, version prototype alerts, and export locally

- **Status**: Accepted
- **Date**: 2026-08-27
- **Decision owners**: MySeizures academic prototype team

## Context

The prototype must summarize selected periods, show transparent informational indicators, and
produce a structured file compatible with the documented RNDS/e-SUS-oriented mapping. It must not
misrepresent those capabilities as clinical decision support, certified interoperability, or direct
government/electronic-record integration.

Persisted summaries can become stale, opaque alert logic is difficult to review, and automatic
submission would exceed the academic scope and increase disclosure risk.

## Decision

Weekly, monthly, and annual reports are derived on demand from authorized, patient-scoped SQLite
queries. Adherence uses final `TAKEN`/`MISSED` confirmations only, and reports are never stored as a
source of truth.

Alert rules are pure, versioned domain rules. Version `prototype-1.0` produces:

- `SEIZURE_FREQUENCY`, severity `HIGH`, at three or more recorded seizures in the selected period;
- `LOW_ADHERENCE`, severity `MEDIUM`, when a defined final-confirmation adherence rate is below 80%.

The rules always return a severity, textual reason, and rule version. The interface describes them
as informational and provides a non-colour cue. No alert triggers a notification, diagnosis,
treatment action, professional contact, or emergency escalation.

Authorized reports are mapped through an explicit allow-list to local JSON contract version `1.0`.
The document is validated before save/share and excludes credentials and unrelated/internal fields.
The export adapter may create and share a local file but performs no HTTP request or RNDS/e-SUS
submission.

## Consequences

### Positive

- Reports always reflect the current selected-period local records.
- Alert thresholds and edge conditions are visible, reviewable, and unit tested.
- Authorization occurs before repository reads or export file creation.
- A stable export version enables reproducible contract tests and redacted academic evidence.
- The implementation cannot silently claim direct interoperability or external transmission.

### Trade-offs and risks

- Report generation repeats aggregation work rather than reading a cached snapshot.
- Prototype thresholds have no clinical validation and may be inappropriate for any individual.
- Missing or inaccurate self-entered data directly affects reports and indicators.
- A locally shared file leaves application control after the user chooses a destination.
- Compatibility is documented structurally; it is not certification by RNDS, e-SUS, or another
  health-information system.

## Alternatives considered

- **Persist report snapshots**: rejected because stale duplicated data would need lifecycle and
  reconciliation rules.
- **Opaque or adaptive risk scoring**: rejected because it would be harder to explain, test, and
  constrain as non-diagnostic.
- **Automatic API or government-system submission**: rejected because it violates the explicit
  local-only export scope and increases privacy/regulatory obligations.
- **Serialize full domain entities**: rejected because an allow-list is safer and keeps the external
  contract independent of internal fields.
