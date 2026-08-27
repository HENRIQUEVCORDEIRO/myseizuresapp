The EAS Android development build is now failing during React Native Codegen.

The exact failure is:

```text
Execution failed for task ':react-native-screens:generateCodegenSchemaFromJavaScript'.

Error: The first argument of method setToolbarMenuElementOptions
must be of type React.ElementRef<>

The installed versions currently include:

Expo SDK 54
expo@54.0.37
react-native@0.81.5
react-native-screens@4.26.2
expo-router@6.0.24
expo-dev-client@6.0.21

Do not patch node_modules manually.

Please:

Inspect package.json files, package-lock.json, and npm workspace dependency resolution.
Determine the Expo SDK 54-compatible version of react-native-screens.
Check whether react-native-screens@4.26.2 is too new or otherwise incompatible with the React Native 0.81.5 Codegen used by Expo SDK 54.
Use Expo-compatible dependency installation/versioning (npx expo install ...) where appropriate.
Check expo-router and related React Navigation packages for compatible versions as well.
Do not upgrade Expo SDK or React Native.
Do not disable React Native Codegen as a workaround unless there is an explicit documented reason.
After fixing dependencies, run:
npm ls react
npm ls react-native
npm ls react-native-screens
npx expo-doctor@latest
Re-run or prepare the EAS development build only after dependency validation passes.

There is also a warning during Gradle:

Warning: Root-level "expo" object found.
Ignoring extra keys in Expo config: "slug", "plugins", "extra"

Inspect mobile/app.json / app.config.* and determine why the Expo configuration is nested or structured incorrectly. Fix that separately without unnecessarily changing the app name, package id, plugins, or runtime configuration.

Also note that the NODE_ENV warning is present, but it was not the fatal build error. Do not treat it as the primary cause.

Before editing files, report:

the root cause you found,
which package/config versions are incompatible,
and which files you intend to modify.

Then make the smallest safe fix and report the validation results.
```
