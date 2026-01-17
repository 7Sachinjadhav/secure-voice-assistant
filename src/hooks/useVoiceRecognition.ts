import { useState, useEffect, useCallback, useRef } from "react";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface UseVoiceRecognitionResult {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const useVoiceRecognition = (): UseVoiceRecognitionResult => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

  const clearRestartTimer = () => {
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const scheduleRestart = useCallback(() => {
    if (!shouldListenRef.current || !recognitionRef.current) return;

    clearRestartTimer();
    // Android WebView/Chrome sometimes ends recognition after a short pause.
    restartTimerRef.current = window.setTimeout(() => {
      try {
        recognitionRef.current?.start();
      } catch {
        // Ignore "start called twice" and similar transient errors.
      }
    }, 300);
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();

    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    // Match your app language
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => (prev + " " + finalTranscript).trim());
      }
      setInterimTranscript(interimText.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setError(event.error);
      setIsListening(false);

      // If user expects continuous listening, try to recover.
      if (shouldListenRef.current) {
        scheduleRestart();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");

      // Keep listening unless user explicitly stopped.
      if (shouldListenRef.current) {
        scheduleRestart();
      }
    };

    return () => {
      clearRestartTimer();
      shouldListenRef.current = false;
      if (recognition) {
        recognition.abort();
      }
    };
  }, [isSupported, scheduleRestart]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    shouldListenRef.current = true;
    clearRestartTimer();
    setTranscript("");
    setInterimTranscript("");
    setError(null);

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Failed to start recognition:", err);
      // If it failed due to already-started state, let it continue.
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    shouldListenRef.current = false;
    clearRestartTimer();

    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error("Failed to stop recognition:", err);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    transcript: transcript.trim(),
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
};
