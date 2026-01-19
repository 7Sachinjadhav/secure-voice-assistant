import { WebPlugin } from "@capacitor/core";

export class WakeWordWeb extends WebPlugin {
  async startListening(): Promise<{ success: boolean }> {
    console.log("[WakeWordWeb] startListening called on web platform");
    return { success: false };
  }

  async stopListening(): Promise<{ success: boolean }> {
    console.log("[WakeWordWeb] stopListening called on web platform");
    return { success: false };
  }
}
