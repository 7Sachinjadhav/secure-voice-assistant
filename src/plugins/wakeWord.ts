import { registerPlugin } from "@capacitor/core";

export type WakeWordEvents = {
  /** Fired when wake word detected */
  wakeWordDetected: { wakeWord: string };
  /** Fired for raw speech stream (partial + final) */
  speechHeard: { text: string; partial: boolean };
  /** Fired when a complete command is detected */
  commandDetected: { text: string; type: "lock" | "unknown" };
};

export interface WakeWordPlugin {
  startListening(): Promise<void>;
  stopListening(): Promise<void>;

  addListener<E extends keyof WakeWordEvents>(
    eventName: E,
    listenerFunc: (event: WakeWordEvents[E]) => void
  ): Promise<{ remove: () => Promise<void> }>;

  removeAllListeners(): Promise<void>;
}

export const WakeWord = registerPlugin<WakeWordPlugin>("WakeWord");
