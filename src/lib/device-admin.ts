/**
 * Device Admin - TypeScript bridge to Android device locking
 */

import { Capacitor, registerPlugin } from "@capacitor/core";

interface WakeWordPlugin {
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  lockDevice(): Promise<void>;
}

const WakeWord = registerPlugin<WakeWordPlugin>("WakeWord");

export function isAndroidPlatform(): boolean {
  return Capacitor.getPlatform() === "android";
}

export async function lockDevice(): Promise<boolean> {
  try {
    if (!isAndroidPlatform()) {
      console.warn("[DEVICE] Not on Android");
      return false;
    }

    console.log("[DEVICE] Calling native lockDevice...");
    await WakeWord.lockDevice();
    console.log("[DEVICE] Lock command sent");
    return true;
  } catch (error) {
    console.error("[DEVICE] Lock failed:", error);
    return false;
  }
}

export async function executeCommand(intent: string, target?: string): Promise<boolean> {
  console.log(`[COMMAND] Executing: ${intent}${target ? ` (${target})` : ""}`);

  if (intent.toLowerCase() === "lock") {
    return await lockDevice();
  }

  console.warn(`[COMMAND] Unknown: ${intent}`);
  return false;
}

export async function checkDeviceAdminStatus(): Promise<{ isEnabled: boolean; platform: string }> {
  return {
    isEnabled: isAndroidPlatform(),
    platform: Capacitor.getPlatform(),
  };
}
