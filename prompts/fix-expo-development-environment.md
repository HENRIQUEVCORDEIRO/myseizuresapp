# Diagnose and Fix Expo SDK 54 Development Environment

I need you to diagnose and fix the current Expo/React Native development environment of this repository.

This is an **npm workspaces monorepo** with at least:

- `mobile`
- `api`

Do **not** blindly upgrade packages, regenerate the project, or make broad architectural changes.

Inspect the repository first, determine the root causes, and make the **smallest safe changes required**.

Preserve the existing application behavior and Spec Kit implementation unless a change is necessary to fix the issues described below.

---

## 1. Current Environment and Known Facts

The mobile app is using **Expo SDK 54**.

After running:

```bash
npx expo install --fix
```

the relevant versions include:

```text
expo@54.0.37
jest-expo@54.0.18
react-native@0.81.5
```

`expo-doctor` currently reports:

```text
16/18 checks passed
2 checks failed
```

The two failures are described below.

---

# 2. Invalid Expo Slug

The first failure is:

```text
Check Expo config (app.json/app.config.js) schema

Field: slug - 'slug' must match pattern "^[a-zA-Z0-9_\-]+$".
```

Inspect:

```text
mobile/app.json
```

or the effective Expo configuration if another config file is being used.

Fix the slug with the smallest possible change.

Use a valid slug containing only:

- letters
- numbers
- `_`
- `-`

Do **not** unnecessarily change the application's visible display name.

---

# 3. Duplicate React Installations

The second `expo-doctor` failure is:

```text
Check that no duplicate dependencies are installed

Found duplicates for react:
  react@19.1.0 (at: node_modules\react)
  react@19.2.8 (at: ..\node_modules\react)
```

The mobile workspace itself currently resolves:

```text
react@19.1.0
```

while many Expo/mobile dependencies are resolving:

```text
react@19.2.8
```

from the monorepo root.

`npm ls react` shows both React 19.1.0 and React 19.2.8 in the dependency tree.

Meanwhile:

```bash
npm ls react-native
```

shows React Native consistently resolving to:

```text
react-native@0.81.5
```

---

## 3.1 Runtime Errors

The application currently produces:

```text
Invalid hook call. Hooks can only be called inside of the body of a function component.
```

followed by:

```text
Cannot read property 'useMemo' of null
```

The stack trace points through:

```text
AuthSessionProvider
exports.useMemo
renderWithHooks
```

Do **not** assume that `AuthSessionProvider` violates the Rules of Hooks until the duplicate React installation has been resolved.

The duplicate React instances are a strong candidate for the invalid hook call.

---

# 4. Required React Investigation

Before changing dependencies:

1. Inspect the root `package.json`.
2. Inspect `mobile/package.json`.
3. Inspect the npm workspace configuration.
4. Inspect the lockfile.
5. Run or reason from:

```bash
npm why react
```

and:

```bash
npm ls react
```

6. Determine exactly why React `19.2.8` is being installed at the monorepo root while the mobile workspace has React `19.1.0`.

7. Determine the React version expected by the installed Expo SDK 54 / React Native 0.81 setup.

8. Fix the dependency tree so the mobile application uses **one compatible React instance**.

Prefer fixing an incorrect explicit dependency or workspace dependency declaration if one exists.

Use npm `overrides` only if it is actually appropriate after inspecting the dependency tree.

Do **not** upgrade the project to a newer Expo SDK as part of this fix.

After making dependency changes, perform the appropriate clean reinstall/deduplication procedure for this npm workspace setup and verify that only the intended React version is used by the mobile runtime.

---

# 5. Expo Go / `expo-notifications` Issue

The application also produces this error in Expo Go on Android:

```text
expo-notifications: Android Push notifications (remote notifications)
functionality provided by expo-notifications was removed from Expo Go
with the release of SDK 53. Use a development build instead of Expo Go.
```

This is a **separate issue from the duplicate React problem**.

Do **not** try to fix this by:

- downgrading Expo;
- removing notification functionality;
- removing `expo-notifications`.

The project uses `expo-notifications`, and remote Android push notifications are required by the application.

Therefore, after the React/dependency problems are fixed, prepare the project to use an **Expo development build / development client** instead of relying on Expo Go for this functionality.

---

## 5.1 Development Build Investigation

Before making development-build changes:

1. Inspect the existing Expo configuration and dependencies.
2. Determine whether `expo-dev-client` is already installed/configured.
3. If not, install it using the Expo-compatible installation method.
4. Make only the configuration changes required for a development build.
5. Do not perform unrelated native customization.

Explain whether the appropriate next step is:

```bash
npx expo run:android
```

for a local Android development build, or an **EAS development build**, considering that development is currently being done on **Windows with a physical Android device**.

---

# 6. Environment Configuration Issue

There is also an environment configuration inconsistency that should be investigated rather than worked around blindly.

The repository root contains:

```text
.env.example
```

with variables equivalent to:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:<API_PORT>
API_PORT=<API_PORT>
API_TOKEN_SECRET=<placeholder>
```

For development on the current **physical Android device**, the mobile API URL needs to use the PC's LAN address instead of:

```text
10.0.2.2
```

The currently confirmed LAN address is:

```text
192.168.1.105
```

and the API is currently being run on:

```text
3000
```

Therefore the mobile development value should be:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.105:3000
```

Do **not** commit machine-specific `.env` values or real secrets.

---

# 7. API Environment Loading

`api/src/config.js` currently contains:

```js
const DEFAULT_PORT = 3000;

function requireValue(environment, name) {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and provide a local value.`
    );
  }

  return value;
}

function parsePort(value) {
  if (!value) {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('API_PORT must be an integer between 1 and 65535.');
  }

  return port;
}

export function getApiConfig(environment = process.env) {
  return {
    port: parsePort(environment.API_PORT),
    tokenSecret: requireValue(environment, 'API_TOKEN_SECRET'),
  };
}
```

The API currently starts successfully only when the PowerShell session is manually configured with:

```powershell
$env:API_TOKEN_SECRET="..."
$env:API_PORT="3000"
npm run dev:api
```

The root npm script is:

```json
"dev:api": "npm run dev --workspace api"
```

Creating `.env` files did **not** make `API_TOKEN_SECRET` available to `process.env`.

This suggests that the API currently does not load `.env` automatically.

---

## 7.1 Required API Configuration Investigation

Inspect the API workspace and determine whether:

- environment loading is intentionally shell-only;
- Node's `--env-file` support was intended;
- `dotenv` or another loader was intended but omitted;
- or the documentation/error message is inconsistent with the actual implementation.

Do **not** introduce a new dependency unless necessary.

Make the implementation and documentation consistent.

In particular, do not leave an error message telling developers to:

```text
Copy .env.example to .env
```

if the application does not actually load that `.env` file.

Also ensure that:

```text
API_TOKEN_SECRET
```

is **never** exposed through an `EXPO_PUBLIC_*` variable or bundled into the mobile application.

---

# 8. Mobile Environment Configuration

Expo is started from the:

```text
mobile
```

workspace.

The mobile development environment should be able to obtain:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.105:3000
```

from the appropriate mobile Expo environment configuration.

Verify where Expo SDK 54 loads this variable in this monorepo instead of assuming that the repository-root `.env` is visible to the mobile workspace.

Do **not** commit the developer's LAN IP unless that is already the intended repository convention.

Keep `.env.example` generic if appropriate.

---

# 9. Networking

LAN mode has already been tested successfully.

Running:

```bash
npx expo start --lan
```

from the mobile workspace produces:

```text
Metro waiting on exp://192.168.1.105:8081
```

Therefore, do **not** treat the previous `127.0.0.1` Metro issue as the primary remaining problem.

The API and Metro are separate:

```text
Metro: 192.168.1.105:8081
API:   192.168.1.105:3000
```

Preserve that distinction.

---

# 10. Validation Requirements

After applying the fixes, validate the repository rather than merely editing package files.

At minimum:

1. Run the appropriate install/deduplication step.

2. Run:

```bash
npm ls react
```

and verify that the mobile runtime no longer has conflicting React instances.

3. Run:

```bash
npm ls react-native
```

and verify the React Native dependency tree.

4. Run:

```bash
npx expo-doctor@latest
```

from the appropriate workspace and report every remaining failure or warning.

5. Run the project's existing tests, lint, and type-check commands where available.

6. Verify that the Expo configuration schema error for `slug` is gone.

7. Verify that the dependency-related cause of:

```text
Invalid hook call
```

and:

```text
Cannot read property 'useMemo' of null
```

has been addressed.

8. Do **not** claim that the Expo Go push-notification error is fixed by dependency deduplication. That limitation requires the development build.

9. Verify that the API can obtain:

```text
API_TOKEN_SECRET
```

using the configuration mechanism you determine is intended.

10. Verify that the mobile app obtains:

```text
EXPO_PUBLIC_API_BASE_URL
```

from the correct location.

11. If the invalid hook error remains **after React is fully deduplicated**, then inspect `AuthSessionProvider` and its callers for an actual Rules of Hooks violation.

Do this **after**, not before, resolving the duplicate React installation.

---

# 11. Safety and Scope Constraints

Do **not**:

- delete application features to make Expo Go work;
- remove `expo-notifications`;
- downgrade Expo to SDK 52 or earlier;
- upgrade to a newer Expo SDK as part of this task;
- rewrite the application architecture;
- delete or regenerate the Spec Kit work;
- replace the lockfile without a concrete reason;
- expose `API_TOKEN_SECRET` to the mobile bundle;
- commit real secrets;
- commit developer-specific LAN configuration unless explicitly appropriate;
- blindly run destructive cleanup commands before inspecting the workspace structure and Git state.

Preserve existing behavior wherever possible.

---

# 12. Change Reporting

Before modifying files, briefly report:

1. the root causes you found;
2. which files you intend to change;
3. why each change is necessary.

Then make the changes.

After modifications, report:

1. exactly which files changed;
2. why each file changed;
3. which dependency versions changed, if any;
4. which commands/tests were run;
5. their results;
6. any remaining warnings or errors;
7. whether the repository is ready for the development-build step.

---

# Priority Order

Follow this order:

1. **Inspect the repository and dependency tree.**
2. **Fix the Expo `slug` configuration.**
3. **Fix the duplicate React dependency problem.**
4. **Validate the React runtime and check whether the `Invalid hook call` / `useMemo` errors are resolved.**
5. **Make the API and mobile environment-variable configuration coherent.**
6. **Re-run Expo Doctor and the project's tests/checks.**
7. **Prepare the existing application for an Expo development build so `expo-notifications` can be tested correctly on Android.**

Do not conflate the duplicate React runtime problem with the Expo Go notification limitation. They are separate issues and should be diagnosed and validated separately.