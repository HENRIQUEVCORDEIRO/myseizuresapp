# MySeizures Frontend Completion & Integration Tasks

This document contains actionable, technical task descriptions formatted for AI-driven implementation. The goals focus on connecting navigation, refining core user flows, upgrading form controls, ensuring robust offline/session persistence, and finalizing report exports within the Expo Router application.

---

### Task 1: Auth Session Persistence & Offline Fallback Handling (`E1`)

**Goal:** Allow authenticated users to launch and use protected application routes seamlessly without requiring an immediate, blocking network check on every cold start.

**Technical Context & Implementation Steps:**
- **Problem:** `GET /users/me` is called upon startup. If the device is offline or the backend API is unreachable, session restoration fails and protected routes remain inaccessible (`/(patient)` or `/(professional)`).
- **Requirements:**
  1. Update the authentication use case / state provider to store a minimal cached user identity (ID, role, name, token expiration) in `SecureStore` along with the JWT.
  2. Implement an offline fallback strategy: if a local token is present and not expired, restore the session state locally even if `GET /users/me` fails due to network unavailability.
  3. Decouple hardcoded demo user ID dependencies from `patientId` lookups. Ensure `patientId` mapping handles both offline cached state and online responses cleanly.

---

### Task 2: Patient Navigation Architecture & Profile Switcher (`E2`)

**Goal:** Transform the static `/(patient)` landing screen into a functional navigation hub that connects all implemented patient workflows and enables role/profile switching.

**Technical Context & Implementation Steps:**
- **Problem:** Currently, `/(patient)` only displays welcome text and a sign-out button, rendering lower-level routes (`/seizures/new`, `/triggers/new`, `/calendar`, `/treatments`, `/reminders`, `/sharing`) reachable only via direct URL manipulation.
- **Requirements:**
  1. Refactor `app/(patient)/index.tsx` (or primary layout/tab structure) to include clear navigation entry points (cards, list buttons, or tab bar) pointing to:
     - Record Seizure (`/(patient)/seizures/new`)
     - Record Triggers (`/(patient)/triggers/new`)
     - Calendar & History (`/(patient)/calendar`)
     - Treatments List (`/(patient)/treatments`)
     - Reminders & Adherence (`/(patient)/reminders`)
     - Professional Access Sharing (`/(patient)/sharing`)
  2. Implement a profile switching / role sign-out mechanism that clears current active tokens/cache and redirects safely to `/(auth)`.

---

### Task 3: Seizure & Trigger Form Usability Upgrades (`E3` & `E4`)

**Goal:** Modernize data input methods on clinical entry forms to reduce user input errors and ensure robust offline SQLite persistence.

**Technical Context & Implementation Steps:**
- **Problem:** Timestamp entries currently rely on manual ISO 8601 string typing, which is error-prone on mobile devices.
- **Requirements:**
  1. In `app/(patient)/seizures/new.tsx`:
     - Replace manual string inputs with native Date/Time pickers (e.g., `@react-native-community/datetimepicker` or equivalent modal picker).
     - Validate seizure occurrence type before submission.
  2. In `app/(patient)/triggers/new.tsx`:
     - Integrate native Date/Time pickers for trigger occurrence timestamp.
     - Add structured input controls (sliders or segmented buttons) for sleep quality and mood ratings.
     - Enforce conditional domain validation: when `OTHER` trigger cause is selected, mandate a non-empty description before enabling submission.
  3. Verify that submitted entries save transactionally to the local SQLite database and update reactive lists.

---

### Task 4: Calendar Sync & Unified Event Display (`E5`)

**Goal:** Ensure the calendar view accurate filters, chronologically orders, and renders all recorded seizures and trigger events across custom selected time windows.

**Technical Context & Implementation Steps:**
- **Problem:** FR-006 calls for a comprehensive timeline, but current implementation details need verification to ensure queries execute correctly against SQLite bounds.
- **Requirements:**
  1. Inspect `app/(patient)/calendar/index.tsx` and its underlying repository queries.
  2. Ensure inclusive date-range filter logic correctly captures all events from `00:00:00` on the start date to `23:59:59` on the end date.
  3. Merge seizure records and trigger records into a single chronologically sorted timeline feed.
  4. Implement explicit UI feedback states for: Loading, Empty Period, Error, and Retry action.

---

### Task 5: Treatment Lifecycle & Base-Time Management (`E6`, `E7`, & `E8`)

**Goal:** Build a complete treatment management flow allowing patients to create, view, and edit treatment details with structured time pickers.

**Technical Context & Implementation Steps:**
- **Problem:** Treatment base times are currently parsed from comma-separated text strings, leading to formatting bugs.
- **Requirements:**
  1. Update `app/(patient)/treatments/new.tsx` and `app/(patient)/treatments/[id].tsx`:
     - Replace comma-separated text input for `HH:MM` base times with a dynamic list component allowing users to add/remove specific time rows using native time pickers.
  2. Ensure updating an existing treatment replaces or updates corresponding base time rows transactionally in SQLite.
  3. Verify that `app/(patient)/treatments/index.tsx` correctly lists all active treatments with their configured daily frequencies and dosages.

---

### Task 6: Native Notification Cancellation & Reminder Scheduling (`E9`)

**Goal:** Guarantee reliable local medication reminder delivery, interactive notification handling, and stale notification cleanup upon treatment modification.

**Technical Context & Implementation Steps:**
- **Problem:** Modifying or deleting a treatment replaces SQLite database reminder rows, but existing scheduled Expo native device notifications remain active, resulting in obsolete alerts.
- **Requirements:**
  1. Persist Expo notification identifiers alongside scheduled reminder items in SQLite.
  2. When editing/updating a treatment in `/(patient)/treatments/[id]`, explicitly execute `Expo.Notifications.cancelScheduledNotificationAsync()` for all associated pending alerts before generating new 7-day reminder notifications.
  3. Ensure tapping a received medication notification opens `app/(patient)/reminders` and highlights the corresponding pending dose item.
  4. Enforce state transitions: once marked `TAKEN` or `MISSED`, lock the record against conflicting changes.

---

### Task 7: Professional Dashboard & Patient Lookup (`E10` & `E11`)

**Goal:** Establish the professional entry screen, patient lookup mechanism, and access grant validation workflow.

**Technical Context & Implementation Steps:**
- **Problem:** `app/(professional)/index.tsx` is an empty landing screen without navigation links to patient search or report viewing.
- **Requirements:**
  1. Connect `app/(professional)/index.tsx` to `app/(professional)/patients/index.tsx`.
  2. On the patient lookup screen, implement input validation for the numeric `patientId`.
  3. Integrate the backend access check call (`GET /patients/:patientId/access`).
  4. If access is granted, navigate to `/(professional)/reports/[patientId]`. If access is denied or grant is revoked, display an accessible error state explaining lack of authorization.

---

### Task 8: Report Generation & Local JSON Export Flow (`E12`)

**Goal:** Render patient summary reports with periodic filtering (weekly, monthly, annual) and connect the native JSON file export sharing workflow.

**Technical Context & Implementation Steps:**
- **Problem:** The report export route `/(shared)/report-export` exists in isolation and is not reachable from the report screen.
- **Requirements:**
  1. On `app/(professional)/reports/[patientId].tsx` (and equivalent patient report view):
     - Provide interactive period selectors for Weekly (past 7 days), Monthly (current month to date), and Annual (year to date).
     - Render seizure counts, trigger frequency trends, adherence percentages, and informational alert badges (`HIGH` frequency, `MEDIUM` low adherence).
  2. Add an "Export Report" action button that routes directly to `/(shared)/report-export` passing required report context (`patientId`, selected period).
  3. Verify that `report-export` generates the version `1.0` redacted JSON file locally and opens the native OS share sheet (`Sharing.shareAsync`).

---

### Task 9: Android Native Validation & Cleartext Verification

**Goal:** Execute physical/emulator device testing for Android cleartext API traffic, native notifications, and layout responsiveness.

**Technical Context & Implementation Steps:**
- **Requirements:**
  1. Run `npx expo prebuild` to ensure `android:usesCleartextTraffic="true"` is injected into `AndroidManifest.xml`.
  2. Compile and install a fresh development build (`npx expo run:android`).
  3. Validate end-to-end HTTP login against the local LAN server address.
  4. Verify screen reader (TalkBack/VoiceOver) accessibility labels, touch targets (minimum 44x44dp), and non-color-dependent alert indicators.