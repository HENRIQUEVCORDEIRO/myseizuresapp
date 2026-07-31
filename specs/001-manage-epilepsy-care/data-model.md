# Data Model: Manage Epilepsy Care

## Conventions

Use integer primary keys, ISO 8601 timestamps in UTC, and foreign keys. `patient_id` scopes every
clinical query. Enumerations are validated in the domain layer and persisted as stable strings.

## Entities

| Entity | Core fields | Relationships and rules |
| --- | --- | --- |
| User | id, name, email, password hash, role | Role is `PATIENT` or `MEDIC_CARETAKER`; email is unique. |
| Patient | id, user_id, birth_date, diagnosis_date | Owns clinical records, treatment, and access grants. |
| MedicCaretaker | id, user_id, professional_register, professional_link | May view a patient only through an active grant. |
| AccessGrant | id, patient_id, medic_caretaker_id, granted_at, revoked_at | Unique active grant per pair; active when not revoked. |
| SeizureRecord | id, patient_id, occurred_at, occurrence_type, created_at | Timestamp and occurrence type required. |
| TriggerRecord | id, patient_id, recorded_at, common_cause, other_description, sleep_quality, mood | Other description required only for `OTHER`. |
| Treatment | id, patient_id, type, name, daily_frequency, active | Name, frequency >= 1, and one or more base times required. |
| TreatmentTime | id, treatment_id, scheduled_time | Unique valid local time per treatment. |
| Reminder | id, treatment_id, scheduled_at, status | `SCHEDULED`, `TAKEN`, or `MISSED`; unique treatment/time. |
| Adherence | id, reminder_id, confirmed_at, consumption_status | At most one final confirmation per reminder. |
| Report | transient period_start, period_end, adherence_rate, records, trends, alerts | Derived on demand; no source-of-truth report table. |
| ClinicAlert | transient id, severity, reason, rule_version | Derived when a documented prototype rule matches. |
| Export | format_version, generated_at, report_period, patient, records, adherence, alerts | Derived local file; never transmitted. |

## State Transitions

```text
Treatment: active → edited (replace future reminders) | inactive
Reminder: SCHEDULED → TAKEN | MISSED
Access grant: active → revoked (terminal for that grant)
```

No confirmation may change after it reaches `TAKEN` or `MISSED`; a correction is out of scope.

## Integrity and Validation Rules

- An actor may query a patient's data only when they are that patient or have an active grant.
- Seizures and triggers require valid non-future timestamps.
- Creating/editing a treatment schedules future reminder rows atomically.
- A report includes only records within its inclusive requested period.
- `adherence_rate = taken final confirmations / all final confirmations × 100`; it is undefined
  when no final confirmations exist.
- Alert thresholds are versioned and tested with boundary conditions.
