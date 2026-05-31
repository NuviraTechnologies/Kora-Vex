// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// Bundle ID for Kora Vex — independent, no platform prefixing
const rawBundleId = "com.nuvira.kora.vex";
const bundleId =
  rawBundleId
    .replace(/[-_]/g, ".")
    .replace(/[^a-zA-Z0-9.]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .toLowerCase()
    .split(".")
    .map((segment) => {
      return /^[a-zA-Z]/.test(segment) ? segment : "x" + segment;
    })
    .join(".") || "com.nuvira.koravex";
const schemeFromBundleId = "koravex";

const env = {
  appName: "Kora Vex",
  appSlug: "kora-vex",
  logoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663467303048/KHyhVJjWGJuAogbSjvLteH/kora-vex-icon-TizmfB6vVEStiVM6icZTfW.png",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  owner: "richardvigslist",
  extra: {
    eas: {
      projectId: "88a7abdb-8462-4ad7-8490-169c974c3a97",
    },
  },
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    buildNumber: "6",
    "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false,
        "NSMicrophoneUsageDescription": "Kora Vex uses your microphone to record your voice so you can speak directly to Vex, an AI companion. Your voice is converted to text and sent to Vex to generate a spoken response. Audio is not stored or shared.",
        "NSCameraUsageDescription": "Kora Vex uses your camera to capture photos that you share with Vex for analysis and conversation. Images are sent to Vex to generate a contextual response and are not stored on external servers.",
        "NSPhotoLibraryUsageDescription": "Kora Vex accesses your photo library so you can select images to share with Vex for analysis and discussion. Selected images are sent to Vex to generate a response and are not stored.",
        "NSPhotoLibraryAddUsageDescription": "Kora Vex saves images to your photo library when you request to keep a photo that was shared during your conversation with Vex."
      }
  },
  android: {
    versionCode: 2,
    adaptiveIcon: {
      backgroundColor: "#000000",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    softwareKeyboardLayoutMode: "pan",
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS", "RECORD_AUDIO", "CAMERA", "INTERNET"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ]
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-image-picker",
      {
        "photosPermission": "Allow $(PRODUCT_NAME) to access your photos so Vex can analyze them.",
        "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera so Vex can see your world."
      }
    ],
    [
      "expo-audio",
      {
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: false,
        supportsPictureInPicture: false,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
