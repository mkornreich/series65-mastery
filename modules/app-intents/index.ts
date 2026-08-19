import { requireNativeModule } from 'expo-modules-core';

interface AppIntentsNative {
  isAppInstalled(pkg: string): boolean;
  openInApp(url: string, pkg: string): boolean;
  copyAsset(assetName: string, destPath: string): boolean;
}

let native: AppIntentsNative | null = null;
try {
  native = requireNativeModule<AppIntentsNative>('AppIntents');
} catch {
  // Module not present (e.g. web, or a build without the native module).
  native = null;
}

/** Whether the native intent helper is compiled into this build. */
export function isAppIntentsSupported(): boolean {
  return native != null;
}

/** Whether an app with this package id is installed and visible to us. */
export function isAppInstalled(pkg: string): boolean {
  try {
    return !!native && native.isAppInstalled(pkg);
  } catch {
    return false;
  }
}

/** Try to open a url in a specific app (package). Returns true if it launched. */
export function openInApp(url: string, pkg: string): boolean {
  try {
    return !!native && native.openInApp(url, pkg);
  } catch {
    return false;
  }
}

/** Copy a bundled APK asset to an absolute filesystem path (preloaded models). */
export function copyAsset(assetName: string, destPath: string): boolean {
  try {
    return !!native && native.copyAsset(assetName, destPath);
  } catch {
    return false;
  }
}
