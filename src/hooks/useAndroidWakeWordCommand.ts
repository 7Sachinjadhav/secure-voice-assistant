import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { WakeWord } from "@/plugins/wakeWord";

export type UseAndroidWakeWordCommandResult = {
  isSupported: boolean;
  isListening: boolean;
  lastHeard: string;
  wakeWordDetected: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
};

/**
 * Android-native continuous listener that detects: "Hey Sri ... lock my phone"
 * (Web Speech API is unreliable inside Android WebView in many devices.)
 */
export function useAndroidWakeWordCommand(
  onCommand: (fullText: string) => void
): UseAndroidWakeWordCommandResult {
  const isSupported = useMemo(
    () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android",
    []
  );

  const [isListening, setIsListening] = useState(false);
  const [lastHeard, setLastHeard] = useState("");
  const [wakeWordDetected, setWakeWordDetected] = useState(false);

  const subsRef = useRef<Array<{ remove: () => Promise<void> }>>([]);

  const cleanup = useCallback(async () => {
    for (const sub of subsRef.current) {
      try {
        await sub.remove();
      } catch {
        // ignore
      }
    }
    subsRef.current = [];
    try {
      await WakeWord.removeAllListeners();
    } catch {
      // ignore
    }
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) return;

    await cleanup();
    setLastHeard("");
    setWakeWordDetected(false);

    const wakeSub = await WakeWord.addListener("wakeWordDetected", () => {
      setWakeWordDetected(true);
    });

    const heardSub = await WakeWord.addListener("speechHeard", (e) => {
      // show partials too so user can see it's still listening
      setLastHeard(e.text);
    });

    const cmdSub = await WakeWord.addListener("commandDetected", (e) => {
      setLastHeard(e.text);
      onCommand(e.text);
    });

    subsRef.current = [wakeSub, heardSub, cmdSub];

    await WakeWord.startListening();
    setIsListening(true);
  }, [cleanup, isSupported, onCommand]);

  const stop = useCallback(async () => {
    if (!isSupported) return;
    await cleanup();
    try {
      await WakeWord.stopListening();
    } catch {
      // ignore
    }
    setIsListening(false);
    setWakeWordDetected(false);
  }, [cleanup, isSupported]);

  useEffect(() => {
    return () => {
      // best-effort cleanup
      void stop();
    };
  }, [stop]);

  return { isSupported, isListening, lastHeard, wakeWordDetected, start, stop };
}
