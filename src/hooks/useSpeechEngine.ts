/**
 * React Hook: useSpeechEngine
 * 
 * Manages the global speech recognition engine within React lifecycle
 * Handles setup, teardown, and state management
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { SpeechEngine, type SpeechState } from "@/lib/speech-engine";
import { parseCommand, type ParsedCommand } from "@/lib/commands";
import { executeCommand } from "@/lib/device-admin";

export interface UseSpeechEngineOptions {
  hotword?: string;
  lang?: string;
  autoStart?: boolean;
  onCommandDetected?: (command: ParsedCommand) => void;
}

export function useSpeechEngine(options: UseSpeechEngineOptions = {}) {
  const {
    hotword = "hey buddy",
    lang = "en-IN",
    autoStart = true,
    onCommandDetected,
  } = options;

  const engineRef = useRef<SpeechEngine | null>(null);
  const [state, setState] = useState<SpeechState>("IDLE");
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the speech engine
  useEffect(() => {
    // Only initialize once
    if (engineRef.current) return;

    try {
      engineRef.current = new SpeechEngine({
        hotword,
        lang,
        onHotwordDetected: () => {
          console.log("[HOOK] Hotword detected");
        },
        onCommandDetected: (command: string) => {
          console.log("[HOOK] Command detected:", command);

          // Parse the command
          const parsed = parseCommand(command);
          console.log("[HOOK] Parsed command:", parsed);

          // Execute the command
          if (parsed.intent !== "unknown") {
            executeCommand(parsed.intent, parsed.target);
          }

          // Notify parent component
          onCommandDetected?.(parsed);
        },
        onError: (error: string) => {
          console.error("[HOOK] Engine error:", error);
          setError(error);
        },
        onStateChange: (newState: SpeechState) => {
          console.log("[HOOK] State changed to:", newState);
          setState(newState);
        },
      });

      setIsInitialized(true);
      console.log("[HOOK] Speech engine initialized");

      // Auto-start if requested
      if (autoStart) {
        engineRef.current.start();
      }
    } catch (err) {
      const errorMsg = `Failed to initialize speech engine: ${err}`;
      console.error("[HOOK]", errorMsg);
      setError(errorMsg);
    }

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
        setIsInitialized(false);
      }
    };
  }, [hotword, lang, autoStart, onCommandDetected]);

  // Control functions
  const start = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.start();
    }
  }, []);

  const stop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
  }, []);

  return {
    state,
    isInitialized,
    error,
    start,
    stop,
    isActive: state !== "IDLE",
  };
}

export default useSpeechEngine;
