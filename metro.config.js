// metro.config.js — CJS wrapper with async NativeWind import for EAS compatibility
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// NativeWind v4 ships ESM-only metro wrapper; use dynamic import to stay CJS-compatible
async function getConfig() {
  const { withNativeWind } = await import("nativewind/dist/metro/index.js");
  return withNativeWind(config, { input: "./global.css" });
}

module.exports = getConfig();
