# Quickstart Validation: Manage Epilepsy Care

## Prerequisites

- Node.js active LTS, a package manager, Android emulator or iOS simulator/device, and the Expo
  development environment.
- A local simulated API instance and seeded patient and doctor/caregiver accounts.

## Run

1. Install the workspace dependencies with `npm install`.
2. Start the simulated API with `npm run dev --workspace api`.
3. Start the mobile app with `npm run start --workspace mobile`.
4. Open the app on an Android/iOS simulator or device and allow notifications for the reminder test.

## Validation Scenarios

1. Sign in as a patient, disable network connectivity, record a seizure and trigger, restart the
   app, and verify both appear in the calendar.
2. Create a treatment with two base times; verify upcoming reminders; mark one taken and one missed;
   verify the report's adherence value follows [data-model.md](data-model.md).
3. Re-enable connectivity, grant a seeded doctor/caregiver access, sign in as that account, and
   verify report visibility. Revoke the grant and verify access is denied.
4. Create data matching a documented prototype alert threshold and verify the report displays its
   severity/reason; verify no alert appears when the pattern does not match.
5. Export the selected report and validate its fields against
   [export-json.md](contracts/export-json.md). Confirm no transmission is initiated.

## Automated Checks

Run `npm test` for domain/application rules, `npm run test:api` for REST contract tests, and
`npm run test:ui` for critical screen flows. All must pass before acceptance testing.

## Expected Evidence

Capture test output, accessible-screen screenshots, a redacted sample export, and the
manual-device notification result for the academic demonstration.
