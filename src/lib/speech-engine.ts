/**
 * Speech Engine - Global continuous hotword listening with command recognition
 * 
 * States:
 * HOTWORD -> Listening for "hey buddy"
 * COMMAND -> Listening for command after hotword detected (no need to repeat hotword)
 */

export type SpeechState = "HOTWORD" | "COMMAND" | "IDLE";

export interface SpeechEngineConfig {
  hotword: string;
  lang: string;
  onHotwordDetected?: () => void;
  onCommandDetected?: (command: string) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: SpeechState) => void;
}

export class SpeechEngine {
  private recognizer: any = null;
  private state: SpeechState = "IDLE";
  private config: SpeechEngineConfig;
  private isListening = false;

  constructor(config: SpeechEngineConfig) {
    this.config = {
      lang: "en-IN",
      ...config,
    };
    this.init();
  }

  private init() {
    try {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;

      if (!SpeechRecognition) {
        this.log("ERROR", "SpeechRecognition API not available");
        this.config.onError?.("SpeechRecognition not supported");
        return;
      }

      this.recognizer = new SpeechRecognition();
      this.setupRecognizer();
    } catch (error) {
      this.log("ERROR", `Init failed: ${error}`);
      this.config.onError?.(`Init failed: ${error}`);
    }
  }

  private setupRecognizer() {
    if (!this.recognizer) return;

    this.recognizer.lang = this.config.lang;
    this.recognizer.continuous = false; // Stop after each result
    this.recognizer.interimResults = false;

    this.recognizer.onstart = () => {
      this.isListening = true;
      this.log("SPEECH", `Listening for ${this.state}...`);
    };

    this.recognizer.onresult = (event: any) => {
      const results = event.results;
      if (results.length === 0) return;

      const transcript = results[results.length - 1][0].transcript
        .toLowerCase()
        .trim();

      this.log("ASR", `Heard: "${transcript}"`);

      if (this.state === "HOTWORD") {
        this.handleHotwordMode(transcript);
      } else if (this.state === "COMMAND") {
        this.handleCommandMode(transcript);
      }
    };

    this.recognizer.onerror = (event: any) => {
      const errorMsg = `Recognition error: ${event.error}`;
      this.log("ERROR", errorMsg);
      this.config.onError?.(errorMsg);
      this.restartListening();
    };

    this.recognizer.onend = () => {
      this.isListening = false;
      this.log("SPEECH", "Recognition ended, restarting...");
      
      // 🔑 CRITICAL: Auto-restart after recognition ends
      // This is why your app was getting stuck - we need to restart immediately
      if (this.state !== "IDLE") {
        this.restartListening();
      }
    };
  }

  private handleHotwordMode(transcript: string) {
    if (transcript.includes(this.config.hotword)) {
      this.log("HOTWORD", "Detected!");
      this.config.onHotwordDetected?.();

      // Transition to command mode
      this.setState("COMMAND");

      // Wait a moment for audio to settle, then start listening for command
      setTimeout(() => {
        this.log("COMMAND", "Listening for command...");
        this.restartListening();
      }, 500);
    } else {
      // Didn't detect hotword, continue hotword listening
      this.restartListening();
    }
  }

  private handleCommandMode(transcript: string) {
    if (transcript.trim()) {
      this.log("COMMAND", `Intent detected: "${transcript}"`);
      this.config.onCommandDetected?.(transcript);
    }

    // Return to hotword listening after command processing
    this.setState("HOTWORD");
    this.log("HOTWORD", "Returning to hotword listening...");
    setTimeout(() => {
      this.restartListening();
    }, 500);
  }

  private restartListening() {
    try {
      if (!this.recognizer || this.isListening) return;

      this.recognizer.start();
    } catch (error) {
      this.log("ERROR", `Restart failed: ${error}`);
      // Retry after a moment
      setTimeout(() => this.restartListening(), 1000);
    }
  }

  private setState(newState: SpeechState) {
    if (this.state !== newState) {
      this.state = newState;
      this.config.onStateChange?.(newState);
      this.log("STATE", `Changed to: ${newState}`);
    }
  }

  private log(category: string, message: string) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [${category}] ${message}`);
  }

  public start() {
    if (this.state === "IDLE") {
      this.setState("HOTWORD");
      this.restartListening();
    }
  }

  public stop() {
    this.setState("IDLE");
    if (this.recognizer) {
      this.recognizer.stop();
    }
  }

  public destroy() {
    this.stop();
    if (this.recognizer) {
      this.recognizer.abort();
      this.recognizer = null;
    }
  }

  public getState(): SpeechState {
    return this.state;
  }

  public isActive(): boolean {
    return this.state !== "IDLE";
  }
}
