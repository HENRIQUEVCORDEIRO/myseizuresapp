# MySeizures

MySeizures is an academic mobile prototype for tracking epilepsy-related information. It combines
an offline-first Expo/React Native app with a small simulated REST API for demonstration
authentication and professional access grants.

> **Academic prototype only.** MySeizures is not a medical device, diagnostic tool, emergency
> service, production clinical record, or substitute for qualified care. Its alerts are transparent
> test rules, not clinically validated recommendations. Use synthetic demonstration data only.

## Implemented scope

- Offline SQLite storage for seizures, possible triggers, treatments, reminders, and adherence.
- Patient calendar/history and local medication-reminder fallback.
- Simulated patient and doctor/caregiver authentication and access grants.
- Authorized weekly, monthly, and annual reports with derived trigger/adherence summaries.
- Versioned informational prototype alerts.
- Authorized, local-only JSON report export with no direct RNDS/e-SUS submission.
- Automated domain, persistence, API, presentation, accessibility, and privacy tests.

## Repository structure

| Workspace | Directory | Responsibility                                                                                   |
| --------- | --------- | ------------------------------------------------------------------------------------------------ |
| Mobile    | `mobile/` | Expo Router app, local SQLite clinical source of truth, local notifications, reports, and export |
| API       | `api/`    | Simulated authentication and access grants only; it has no clinical-record storage               |

The repository uses npm workspaces. Unless a command says otherwise, run it from the repository
root. See [the architecture documentation](docs/architecture.md) for layer boundaries and data
flows.

## Prerequisites

- Node.js `>=20.19.0` and npm.
- Android Studio/emulator, an iOS simulator on macOS, or a compatible physical device.
- Expo development tooling available through the locally installed CLI (`npx expo`).
- A development build for reliable native notification acceptance testing.

Desktop and web are outside the target scope.

## Installation and configuration

1. Install all workspace dependencies:

   ```powershell
   npm install
   ```

2. Create local environment files:

   ```powershell
   Copy-Item .env.example .env
   Copy-Item mobile/.env.example mobile/.env
   ```

3. In the root `.env`, replace `API_TOKEN_SECRET` with a local value containing at least 32 bytes.
   Do not use a production secret.

4. In `mobile/.env`, set `EXPO_PUBLIC_API_BASE_URL` to an address the target can reach. Common
   development examples are:

   - Android emulator: `http://10.0.2.2:3000`
   - iOS simulator: `http://127.0.0.1:3000`
   - Physical device: `http://<YOUR_COMPUTER_LAN_IP>:3000`

Only `EXPO_PUBLIC_*` values belong in the mobile environment. Never copy `API_TOKEN_SECRET` into
`mobile/.env`. Both local `.env` files are ignored by Git.

## Run the prototype

Use two terminals from the repository root.

Start the simulated API:

```powershell
npm run dev:api
```

Start Expo:

```powershell
npm start
```

You can also request a platform directly:

```powershell
npm run android --workspace @myseizures/mobile
npm run ios --workspace @myseizures/mobile
```

For an Android development build on a machine with the Android SDK and `adb` configured:

```powershell
Set-Location mobile
npx expo run:android --device
npx expo start --lan
```

The prototype schedules local medication notifications. It does not use remote push notifications
or send clinical alerts as notifications. If notification permission is denied or native scheduling
fails, use the in-app reminder list.

## Seeded demonstration accounts

These credentials are hard-coded for local academic demonstrations and must not be reused elsewhere.

| Role             | Email                      | Password           | Related identifier |
| ---------------- | -------------------------- | ------------------ | ------------------ |
| Patient          | `patient@example.com`      | `Patient123!`      | Patient `1`        |
| Doctor/caregiver | `professional@example.com` | `Professional123!` | Professional `1`   |

The API stores only simulated user/access-grant state in memory. Restarting it resets access grants.

## Scripts and automated checks

| Command                                                         | Purpose                                 |
| --------------------------------------------------------------- | --------------------------------------- |
| `npm test`                                                      | Run all mobile and API tests            |
| `npm run test:mobile`                                           | Run the mobile Jest suites              |
| `npm run test:api`                                              | Run the API Node test suites            |
| `npm run lint`                                                  | Lint all JavaScript workspaces          |
| `npm run format:check`                                          | Check JavaScript/JSON formatting        |
| `npm run format`                                                | Format configured JavaScript/JSON files |
| `npm test --workspace mobile -- --runInBand tests/presentation` | Run critical presentation/UI suites     |
| `npm run test:watch --workspace @myseizures/mobile`             | Run mobile tests in watch mode          |

Run the complete automated baseline before acceptance testing:

```powershell
npm run lint
npm run format:check
npm test
```

## Manual validation walkthrough

The detailed acceptance source is
[the feature quickstart](specs/001-manage-epilepsy-care/quickstart.md). Use synthetic data and record
redacted evidence only.

### 1. Offline records and persistence

1. Start the API and mobile app, then sign in as the seeded patient.
2. Open the patient area before disconnecting the network; do not sign out or clear app storage.
3. Disable connectivity and record one seizure and one possible trigger.
4. Confirm both appear in chronological order in the calendar/history.
5. Restart/reinitialize the local data layer and confirm the records remain in SQLite.

The automated `us1-offline-flow` suite performs this journey with network access trapped and a
reinitialized database provider. A full mobile-process restart currently revalidates the stored
token against the simulated API, so keep the API reachable for session restoration before returning
offline. This is a prototype limitation, not loss of the locally persisted records.

### 2. Treatment, reminders, and adherence

1. Create a treatment with two future base times.
2. Verify local reminders or the in-app fallback.
3. Mark one dose taken and one missed; a final confirmation cannot be submitted twice.
4. Verify the report adherence result uses only final confirmations.

Native notification delivery must be checked on a simulator/device with the intended permission
state; Jest verifies scheduling and fallback behavior but cannot prove operating-system delivery.

### 3. Sharing and professional report access

1. Re-enable connectivity and sign in as the patient.
2. Grant professional identifier `1` access.
3. Sign in as the seeded professional and verify access for patient identifier `1`.
4. Open a weekly, monthly, or annual report and inspect records, trends, adherence, and any textual
   informational alert.
5. Sign back in as the patient, revoke the grant, then verify the professional receives a
   non-disclosing denial on the next access/report attempt.

### 4. Prototype alerts

For academic boundary validation only:

- three or more seizures in the selected period produces the `HIGH` seizure-frequency indicator;
- a defined final-dose adherence rate below 80% produces the `MEDIUM` low-adherence indicator;
- exactly 80% does not match, and no final confirmations produce no adherence rate or adherence
  indicator.

These indicators do not diagnose, predict emergencies, or contact anyone.

### 5. Local structured export

1. As an authorized patient or professional, choose a report period and export it.
2. Confirm a local JSON file with `formatVersion: "1.0"` is created.
3. Compare its shape with the
   [JSON export contract](specs/001-manage-epilepsy-care/contracts/export-json.md).
4. Verify the file excludes passwords, tokens, email, and unrelated patient data.
5. Verify the app opens only local save/share behavior and performs no direct RNDS/e-SUS or
   electronic-record submission.

## Known limitations

- This is a single-device academic prototype with at most a small set of demo users.
- Clinical data is local only: there is no cloud synchronization, backup, recovery, multi-device
  history, server audit trail, or regulated retention.
- Authentication and grant changes require the simulated API. Full app restart also requires the API
  to revalidate the stored token before protected routes reopen.
- Access grants are in-memory demonstration data and reset when the API restarts.
- Professional report review assumes the relevant local clinical database is available on the
  demonstration device; the API never transfers clinical data.
- Alert rules are fixed prototype thresholds, not validated clinical protocols or emergency logic.
- JSON export is a documented compatibility mapping only, not certification or direct integration
  with RNDS, e-SUS, an EHR, or another health system.
- Biometric authentication, production identity management, smartwatch support, remote push,
  desktop/web support, and clinical-data correction workflows are out of scope.
- Accessibility has automated regression coverage, but physical-device screen-reader, dynamic-font,
  and usability acceptance still require manual validation.

## Project documentation

- [Current Overview](docs/current-overview.md)
- [Constitution](.specify/memory/constitution.md)
- [Feature specification](specs/001-manage-epilepsy-care/spec.md)
- [Implementation plan](specs/001-manage-epilepsy-care/plan.md)
- [Data model](specs/001-manage-epilepsy-care/data-model.md)
- [Task plan](specs/001-manage-epilepsy-care/tasks.md)
- [Validation quickstart](specs/001-manage-epilepsy-care/quickstart.md)
- [Architecture and data flows](docs/architecture.md)
- [Architecture decisions](docs/adr/)
