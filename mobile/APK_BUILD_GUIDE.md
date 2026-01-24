# Mobile App APK Build Guide

## Current Status
Building APK requires Android SDK or EAS Build cloud service.

## Option 1: EAS Build (Cloud-based - Recommended)

1. **Create Expo account**: https://expo.dev/signup
2. **Login to EAS**:
   ```bash
   cd mobile
   npx eas-cli login
   ```
3. **Build APK**:
   ```bash
   npx eas build --platform android --profile preview
   ```
   This will build in the cloud and provide download link.

## Option 2: Local Build with Android Studio

### Prerequisites
1. **Install Android Studio**: https://developer.android.com/studio
2. **Install Android SDK** (through Android Studio)
3. **Set environment variable**:
   ```powershell
   $env:ANDROID_HOME = "C:\Users\<YourUsername>\AppData\Local\Android\Sdk"
   [Environment]::SetEnvironmentVariable("ANDROID_HOME", $env:ANDROID_HOME, "User")
   ```

### Build Steps
```bash
cd mobile
npx expo prebuild --platform android
cd android
.\gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Option 3: Use Expo Dev Client

Build a development APK to test on device:
```bash
cd mobile
npx eas build --profile development --platform android
```

## Quick Solution: Web Version

Since Android SDK is not installed, you can use the web version immediately:
```bash
cd mobile
npx expo start
# Press 'w' to open in browser
```

Or deploy web version:
```bash
npx expo export --platform web
```

## Mobile Testing Without Build

Use Expo Go app:
1. Install **Expo Go** from Google Play Store
2. Run: `npx expo start`
3. Scan QR code with Expo Go app

---

**Note**: APK build attempted but requires Android SDK installation or Expo account for cloud build.
