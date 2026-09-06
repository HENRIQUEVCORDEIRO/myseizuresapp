# Task: Diagnose and fix Android cleartext HTTP access for the local API

We have an Expo SDK 54 React Native app in a monorepo.

**Project structure:**

- **Repository root:** `C:\Users\Cliente\myseizuresapp`
- **Mobile Expo workspace:** `C:\Users\Cliente\myseizuresapp\mobile`
- **API workspace:** `C:\Users\Cliente\myseizuresapp\api`

The mobile app is currently running successfully in an Android development build on a physical device.

## Current problem

The login screen opens correctly, but attempting to sign in shows:

> `Unable to reach the authentication service.`

The mobile REST client uses:

```js
response = await this.fetchImpl(`${this.baseUrl}${path}`, options);
```

and converts fetch failures into:

```js
new RestClientError({
  status: null,
  code: 'NETWORK_ERROR',
  message: 'Unable to reach the authentication service.',
  cause,
});
```

**The login endpoint is:**
`POST /auth/login`

**The current mobile environment variable is:**
`EXPO_PUBLIC_API_BASE_URL=http://192.168.5.105:3000`

### Important facts already confirmed:

- The API is running on port 3000.
- `Test-NetConnection 192.168.5.105 -Port 3000` succeeds.
- The physical Android device can open `http://192.168.5.105:3000` in its browser.
- The API responds from the phone browser with a valid JSON 401 response:
  ```json
  { "error": { "code": "UNAUTHENTICATED", "message": "A autenticação é necessária." } }
  ```
- Therefore phone-to-laptop network connectivity is working.
- When the app attempts login, nothing appears in the API terminal, which suggests the request fails before reaching Express.
- The app is using plain HTTP for the local development API.

## Goal

Determine whether Android cleartext HTTP restrictions are blocking the React Native `fetch()` request, and if so, make the smallest correct Expo SDK 54 configuration change to allow HTTP access to the local development API.

## Instructions

1. **Inspect the existing Expo configuration first:**
   - `mobile/app.json`
   - `mobile/app.config.js` or `mobile/app.config.*` if present
   - `mobile/package.json`
   - Any existing Expo plugins
   - Whether `expo-build-properties` is already installed
   - Whether `android:usesCleartextTraffic` is already configured anywhere
2. **Determine native directory presence:** Also determine whether the project has a checked-in native Android directory (`mobile/android`).
3. **Avoid broad changes:** Do not make unrelated dependency upgrades or broad configuration changes.
4. **Install missing plugin:** If `expo-build-properties` is not installed and the managed/Prebuild Expo configuration is the appropriate place for this project, install the Expo SDK 54-compatible version using the equivalent of:
   ```bash
   npx expo install expo-build-properties
   ```
5. **Preserve config:** Preserve all existing Expo plugins and configuration.
6. **Configure cleartext traffic:** Configure Android cleartext traffic through `expo-build-properties`:
   ```json
   [
     "expo-build-properties",
     {
       "android": {
         "usesCleartextTraffic": true
       }
     }
   ]
   ```
   Merge this into the existing plugin array rather than replacing anything.
7. **Handle native project:** If an existing native Android project changes the appropriate implementation approach, inspect it and use the correct project-consistent solution instead of blindly adding duplicate/conflicting configuration.
8. **Protect secrets:** Do not expose server secrets to Expo public environment variables. In particular, do **NOT** put `API_TOKEN_SECRET` or other backend secrets into `mobile/.env`.
9. **Keep API URL:** Keep `EXPO_PUBLIC_API_BASE_URL=http://192.168.5.105:3000` unchanged unless there is concrete evidence that the application is not reading this value correctly.
10. **Validate configuration:** After making the change, validate the Expo configuration using appropriate commands, such as:
    ```bash
    npx expo config --type public
    npx expo-doctor@latest
    ```
11. **Verify output:** If possible, verify that the generated Android configuration contains the equivalent of `android:usesCleartextTraffic="true"` without making an unnecessary permanent native-directory change solely for inspection.
12. **Build requirement:** Do **NOT** create a new EAS build automatically. Report whether a new development build is required after the configuration change.

## Important constraints

- **Expo SDK:** 54
- **React Native:** 0.81.5
- **Target:** Android physical device
- **Environment:** Development build / `expo-dev-client`
- **Architecture:** npm workspaces monorepo
- Do **not** use Expo Go
- Do **not** run `npm audit fix --force`
- Do **not** remove or downgrade unrelated packages
- Do **not** modify authentication behavior as a workaround
- Do **not** replace HTTP with HTTPS unless there is an actual HTTPS development server already configured
- Do **not** suppress the `NETWORK_ERROR`
- Do **not** hardcode fake login success

## Expected output

After inspection and any necessary correction, provide:

1. Root cause or most likely root cause.
2. Exact files changed.
3. Exact configuration added or modified.
4. Whether `expo-build-properties` was installed.
5. Validation command results.
6. Whether a new EAS development build is required.
7. Any remaining uncertainty if cleartext HTTP was already correctly enabled.
