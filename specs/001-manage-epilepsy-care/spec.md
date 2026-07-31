# Feature Specification: Manage Epilepsy Care

**Feature Branch**: `001-manage-epilepsy-care`

**Created**: 2026-07-31

**Status**: Draft

**Input**: User description: "Mobile academic prototype for remote monitoring and clinical
management of adults with epilepsy."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record daily clinical events (Priority: P1)

As a patient, I record seizures, possible triggers, sleep, and mood so my care history is complete
and available even when I am offline.

**Why this priority**: A reliable personal record is the foundation for monitoring, reports, and
clinical discussion.

**Independent Test**: A patient records one seizure and one trigger, then finds both in the
chronological calendar without needing a network connection.

**Acceptance Scenarios**:

1. **Given** an authenticated patient, **When** the patient saves a seizure with date, time, and
   occurrence type, **Then** it appears in that patient's chronological history.
2. **Given** an authenticated patient, **When** the patient records a trigger with cause, sleep,
   and mood details, **Then** the complete trigger entry is retained in the history.

---

### User Story 2 - Follow treatment and confirm doses (Priority: P1)

As a patient, I register a treatment schedule, receive reminders, and confirm whether each planned
dose was taken so I can track medication adherence.

**Why this priority**: Adherence information is essential to the prototype's treatment-management
value.

**Independent Test**: A patient creates a daily treatment, views its planned reminders, and records
one taken and one missed dose; the resulting adherence information is visible.

**Acceptance Scenarios**:

1. **Given** a patient with no treatment, **When** the patient saves a treatment with name, type,
   daily frequency, and base times, **Then** future reminders are created for that schedule.
2. **Given** a scheduled reminder, **When** the patient records a taken or missed status, **Then**
   the confirmation is associated with that reminder and included in adherence calculations.

---

### User Story 3 - Review and share care information (Priority: P2)

As a patient, I grant a doctor or caregiver access to my information; as that professional, I review
reports, clinical alerts, and an exportable summary to support informed follow-up.

**Why this priority**: Controlled sharing turns individual records into remote care support while
preserving patient control.

**Independent Test**: A patient grants access to a professional, who views a selected-period report
and its alerts; after revocation, the professional can no longer view the patient's information.

**Acceptance Scenarios**:

1. **Given** a patient who granted access, **When** the authorized doctor/caregiver opens a report,
   **Then** the report shows records, trigger trends, adherence rate, and applicable alerts for the
   selected period.
2. **Given** an active sharing relationship, **When** the patient revokes it, **Then** the linked
   doctor/caregiver loses access to that patient's reports and records.

---

### User Story 4 - Export a care summary (Priority: P3)

As an authorized patient or professional, I export a selected report in the agreed structured
health-data format so it can be provided to the health professional for later registration in
external systems.

**Why this priority**: Export supports the academic objective without claiming direct government or
medical-record integration.

**Independent Test**: An authorized user exports a report and verifies that the resulting file
contains the selected patient's report data in the documented structured format.

**Acceptance Scenarios**:

1. **Given** an authorized user viewing a report, **When** the user requests an export, **Then** a
   structured file is generated for that report without transmitting it to an external system.

### Edge Cases

- A patient attempts to save a seizure, trigger, treatment, or dose confirmation with required
  information missing or an invalid date/time; the record is not saved and the patient receives a
  clear correction prompt.
- A reminder is overdue, duplicated, or its treatment was changed; the patient can record the dose
  once and the history preserves the applicable scheduled event.
- A professional without active patient authorization attempts to access records, reports, alerts,
  or exports; access is denied without exposing clinical data.
- A report period has no records; the report clearly presents an empty period and does not infer an
  adherence rate or clinical risk from absent data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a patient to record, view, and retain seizures with date, time,
  and occurrence type.
- **FR-002**: The system MUST allow a patient to record triggers with date/time, cause, optional
  other-cause description, sleep quality, and mood.
- **FR-003**: The system MUST allow a patient to create and manage treatments with type, name,
  daily frequency, and base times.
- **FR-004**: The system MUST create medication reminders from a patient's treatment schedule and
  present them at their scheduled time.
- **FR-005**: The system MUST allow a patient to confirm each reminder as taken or missed and retain
  the confirmation date/time.
- **FR-006**: The system MUST present chronological calendar views of recorded seizures, triggers,
  treatment reminders, and adherence confirmations.
- **FR-007**: The system MUST generate weekly, monthly, and annual reports with seizure and trigger
  records, trigger trends, and a global adherence rate when sufficient adherence data exists.
- **FR-008**: The system MUST evaluate recorded patterns against documented prototype risk rules and
  present resulting clinical alerts with a severity and reason to authorized professionals.
- **FR-009**: The system MUST authenticate users and enforce distinct patient and
  doctor/caregiver access permissions.
- **FR-010**: The system MUST allow a patient to grant and revoke a doctor/caregiver's access to
  that patient's clinical information.
- **FR-011**: The system MUST allow an authorized patient or doctor/caregiver to view only the
  clinical information covered by an active access relationship.
- **FR-012**: The system MUST export a selected report as a structured JSON file compatible with the
  documented RNDS/e-SUS data mapping; it MUST NOT transmit data directly to RNDS or e-SUS.
- **FR-013**: The system MUST retain patient-entered clinical information and make core recording,
  calendar, treatment, and report viewing tasks available without network connectivity.

### Suggested Acceptance Criteria by Functional Requirement

| Requirement | Suggested acceptance criterion |
| --- | --- |
| FR-001 | A saved seizure is shown with its exact entered date, time, and type in the patient's history. |
| FR-002 | A saved trigger retains its cause, sleep, mood, and any supplied other-cause detail. |
| FR-003 | A treatment cannot be saved without its name, frequency, and at least one base time. |
| FR-004 | Each valid treatment schedule produces the expected upcoming reminder times. |
| FR-005 | A reminder has at most one final taken/missed confirmation and it appears in adherence history. |
| FR-006 | Events for a selected date range appear in chronological order with their event type. |
| FR-007 | Each supported period produces a report whose displayed records and adherence rate match its inputs. |
| FR-008 | A documented risk pattern creates an alert with severity and reason; absence of a pattern creates none. |
| FR-009 | A patient and a doctor/caregiver see only actions permitted to their profile after sign-in. |
| FR-010 | Granting access enables the named professional; revoking it prevents subsequent access. |
| FR-011 | An unauthorized professional cannot read, report on, or export a patient's clinical data. |
| FR-012 | An export contains the selected report's mapped data and no external transmission occurs. |
| FR-013 | With connectivity unavailable, a patient can save a seizure and later find it in the calendar. |

### Business Rules

- A patient owns their clinical records and controls access by doctor/caregiver.
- A doctor/caregiver may access a patient's information only while an active grant exists.
- A treatment belongs to one patient; reminders belong to one treatment; adherence confirmations
  belong to one reminder.
- Global adherence rate is calculated only from reminders with a recorded final status in the
  selected reporting period.
- Clinical alerts are informational prototype indicators, not diagnoses, emergency services, or
  substitutes for professional clinical judgment.
- Exports are files for professional handling; direct RNDS, e-SUS, and electronic-record submission
  are out of scope.

### Key Entities *(include if feature involves data)*

- **User**: An authenticated account with a profile as patient or doctor/caregiver.
- **Patient**: The owner of clinical records, treatment plan, and access grants.
- **Doctor/Caregiver**: A professional or caregiver who may view a patient's shared information.
- **Seizure record**: A dated and typed reported seizure event.
- **Trigger record and details**: A possible trigger with cause, sleep, mood, and descriptive data.
- **Treatment, reminder, and adherence**: A treatment schedule, its planned dose event, and the
  patient's taken/missed confirmation.
- **Report and clinical alert**: A selected-period summary, calculated adherence, trends, and any
  informational risk indicator.
- **Export**: A structured representation of a selected report for delivery outside the app.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of representative adult patients can record a seizure with all required
  details in under 60 seconds on their first attempt.
- **SC-002**: At least 90% of representative patients can create a treatment schedule and confirm a
  scheduled dose in under 2 minutes without assistance.
- **SC-003**: An authorized doctor/caregiver can open a selected weekly, monthly, or annual report
  and identify its alerts and adherence summary in under 1 minute.
- **SC-004**: In acceptance testing, 100% of attempted accesses after revocation are denied, and
  100% of authorized report exports contain the selected report data without external submission.
- **SC-005**: In offline acceptance testing, 100% of core clinical entries saved without connectivity
  remain available in the patient's history after the app is reopened.

## Assumptions

- The prototype serves adults with epilepsy and uses simulated accounts and professional
  relationships suitable for an academic demonstration.
- Account sign-in uses the supplied email/password model; biometric authentication is out of scope.
- Prototype alert rules and export field mapping will be documented and validated by the academic
  project team; they do not represent certified clinical protocols or government integration.
- Notifications are limited to medication reminders on the mobile device; smartwatch notifications
  are out of scope.
- Cloud synchronization, direct RNDS or e-SUS transmission, electronic medical-record integration,
  and desktop support are out of scope.

## Dependencies

- Treatment scheduling (FR-004) depends on treatment management (FR-003).
- Adherence tracking (FR-005) and adherence reporting (FR-007) depend on reminders (FR-004).
- Reports and alerts (FR-007, FR-008) depend on clinical records (FR-001, FR-002) and adherence
  data (FR-005).
- Professional access and exports (FR-011, FR-012) depend on authentication and active access
  grants (FR-009, FR-010).
