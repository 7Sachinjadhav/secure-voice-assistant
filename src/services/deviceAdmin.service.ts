import { Capacitor } from "@capacitor/core";

/**
 * Opens Android Device Admin settings screen
 * User must manually enable the app
 */
export const openDeviceAdminSettings = () => {
  if (Capacitor.getPlatform() !== "android") return;

  window.open("android.settings.DEVICE_ADMIN_SETTINGS", "_system");
};
