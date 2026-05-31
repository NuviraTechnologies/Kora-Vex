/**
 * Runtime stub — Manus container communication removed.
 * Safe area insets now handled natively by react-native-safe-area-context.
 */

import { Platform } from "react-native";
import type { Metrics } from "react-native-safe-area-context";

type SafeAreaCallback = (metrics: Metrics) => void;

let safeAreaCallback: SafeAreaCallback | null = null;

/**
 * No-op: Manus runtime initialization removed.
 */
export function initManusRuntime(): void {
  // No-op — app runs standalone
}

/**
 * No-op: safe area subscription removed. Use SafeAreaProvider directly.
 */
export function subscribeSafeAreaInsets(_callback: SafeAreaCallback): () => void {
  return () => {};
}

/**
 * Always returns false — app never runs inside a preview iframe.
 */
export function isRunningInPreviewIframe(): boolean {
  return false;
}
