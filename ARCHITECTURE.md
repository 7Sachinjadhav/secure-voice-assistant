# Architecture Diagram

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        App.tsx (ROOT)                            │
│  - useSpeechEngine hook                                          │
│  - Global speech engine (runs continuously)                      │
│  - App-wide state management                                     │
│  - Green indicator UI                                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              <Router>                                    │   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │  Login Page  │  │ Permissions  │  │   Voice Reg  │  │   │
│  │  │              │  │              │  │              │  │   │
│  │  │ onAuthReady  │  │ onPermissions│  │ onComplete   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │         About & Other Pages                       │  │   │
│  │  │  (Speech engine persists here - CRITICAL!)       │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
         │
         └─→ useSpeechEngine()
              │
              └─→ SpeechEngine class
                  │
                  ├─→ SpeechRecognition API
                  │   ├─ onstart()
                  │   ├─ onresult() → parse speech
                  │   ├─ onend() → AUTO-RESTART 🔑
                  │   └─ onerror() → handle errors
                  │
                  └─→ CommandParser
                      └─→ parseCommand(text)
                          └─→ match patterns
                              └─→ extract intent + target
                                  └─→ executeCommand()
                                      └─→ DeviceLockHelper.lockDevice()
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────┐
│    User Speaks "hey sri lock..."    │
└────────────┬────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────┐
    │  SpeechRecognizer.onresult()    │
    │  raw text: "hey sri lock my..."│
    └────────────┬────────────────────┘
             │
             ▼
    ┌─────────────────────────────────┐
    │  State == HOTWORD?              │
    │  ✓ YES → Check for hotword      │
    │  ✓ NO  → Check for command      │
    └────────────┬────────────────────┘
             │
        ┌────┴────┐
        │         │
        ▼ YES     ▼ NO
     ┌──────┐  ┌─────────────────┐
     │MATCH?│  │  CommandParser  │
     └──┬───┘  │  .parse()       │
        │      │  ↓              │
        │ YES  │  {intent, ...}  │
        │      └────────┬────────┘
        ▼              │
    ┌─────────────┐    ▼
    │HOTWORD MODE│  ┌───────────────────┐
    │ DETECTED!  │  │ executeCommand()  │
    │            │  │                   │
    │ setState   │  │ if intent=="lock" │
    │ COMMAND    │  │  → lockDevice()   │
    │            │  │                   │
    │ [500ms]    │  │ else              │
    │ restart    │  │  → log "unknown"  │
    └─────┬──────┘  └─────────┬─────────┘
          │                   │
          │ Listening...      ▼
          │          ┌──────────────────┐
          │          │  Device Admin    │
          │          │  lockNow()       │
          │          │                  │
          │          │  [Phone locks]   │
          │          └────────┬─────────┘
          │                   │
          └───────────┬───────┘
                      │
                      ▼
              ┌────────────────┐
              │  setState      │
              │  (HOTWORD)     │
              │                │
              │  [500ms]       │
              │  restart       │
              └────────┬───────┘
                       │
                       ▼
              ┌──────────────────┐
              │ Listening again  │
              │ for "hey sri"... │
              └──────────────────┘
```

---

## State Machine

```
                         ┌─────────────────────┐
                         │   IDLE STATE        │
                         │ (App not ready)     │
                         └────────────┬────────┘
                                      │
                                      │ localStorage.appReady = "true"
                                      │
                         ┌────────────▼────────────┐
                         │   START LISTENING       │
                         │ setState("HOTWORD")     │
                         └────────────┬────────────┘
                                      │
        ┌─────────────────────────────┴──────────────────────────────┐
        │                                                              │
        ▼                                                              │
   HOTWORD STATE                                                      │
   ══════════════                                                     │
                                                                      │
   [Listening for "hey sri"]                                         │
        │                                                             │
        │ User speaks                                                │
        ▼                                                             │
   [SpeechRecognition.onresult]                                      │
        │                                                             │
        ├─ Match "hey sri"? ─YES→ [HOTWORD DETECTED!]               │
        │              │           setState("COMMAND")              │
        │              │           [wait 500ms]                      │
        │              │           startListening()                  │
        │              │           │                                 │
        │              │           ▼                                 │
        │              │       COMMAND STATE                         │
        │              │       ═════════════                         │
        │              │                                             │
        │              │       [Listening for command]               │
        │              │            │                                │
        │              │            │ User speaks                    │
        │              │            ▼                                │
        │              │       [SpeechRecognition.onresult]         │
        │              │            │                                │
        │              │            ├─ Parse intent? ─YES→ Execute  │
        │              │            │             │    Command      │
        │              │            │             │    │             │
        │              │            │             │    ▼             │
        │              │            │             │ [lockDevice()]  │
        │              │            │             │ [device lock]   │
        │              │            │             │                 │
        │              │            │             └──→ [OK]         │
        │              │            │                 │              │
        │              │            └─ NO? ────→ [UNKNOWN] Log      │
        │              │                             │               │
        │              └─────────────────────────────┘               │
        │                                            │               │
        └──────────────────────────────────────────┐ │               │
                                                    │ │               │
                                   ┌────────────────┴─┴───────────┐  │
                                   │                              │  │
                                   ▼                              │  │
                              [onend event]                      │  │
                         setState("HOTWORD")                     │  │
                         [wait 500ms]                            │  │
                         startListening()                        │  │
                                   │                              │  │
                                   └──────────────┬───────────────┘  │
                                                  │                  │
                                                  ▼                  │
                                            [LOOP BACK] ◄────────────┘
```

---

## Class Relationships

```
┌──────────────────────────────────────┐
│         React Components             │
│  (App, VoiceRegistration, etc)       │
└────────────────┬─────────────────────┘
                 │ uses
                 ▼
┌──────────────────────────────────────┐
│     useSpeechEngine() Hook            │
│  - Manages lifecycle                  │
│  - Calls SpeechEngine methods        │
│  - Exposes state to React            │
└────────────────┬─────────────────────┘
                 │ instantiates
                 ▼
┌──────────────────────────────────────┐
│        SpeechEngine Class             │
│  - State machine logic                │
│  - SpeechRecognition wrapper         │
│  - Auto-restart mechanism             │
│  - Event callbacks                    │
└────────────────┬─────────────────────┘
                 │ uses
                 ▼
┌──────────────────────────────────────┐
│      CommandParser Class              │
│  - Pattern matching                   │
│  - Intent extraction                  │
│  - Target identification              │
└────────────────┬─────────────────────┘
                 │ calls
                 ▼
┌──────────────────────────────────────┐
│    DeviceAdmin Functions              │
│  - executeCommand()                   │
│  - lockDevice()                       │
│  - Capacitor bridge                   │
└────────────────┬─────────────────────┘
                 │ invokes
                 ▼
┌──────────────────────────────────────┐
│    Android Native (Java)              │
│  - WakeWordPlugin                     │
│  - DeviceLockHelper                   │
│  - Device Admin API                   │
└──────────────────────────────────────┘
```

---

## Timing Diagram

```
Timeline: User says "hey sri" then "lock my phone"

Time:     0ms          500ms        1000ms       1500ms        2000ms
│         │            │             │            │             │
├─────────┼────────────┼─────────────┼────────────┼─────────────┤
│         │            │             │            │             │
│  User:  │ "hey sri"  │ [pause]     │ "lock..."  │ [waiting]   │
│         │            │             │            │             │
│ Engine: │ Listening  │             │            │             │
│         │ for        │ [MATCH]     │            │             │
│         │ hotword    │ Transition  │ Listening  │ [MATCH]     │
│         │            │ to COMMAND  │ for        │ EXECUTE     │
│         │            │ [start rec] │ command    │ [lock]      │
│         │            │             │            │             │
│ State:  │ HOTWORD ───┼─────────────┼→ COMMAND ──┼──→ HOTWORD  │
│         │            │             │            │             │
│ Native: │            │             │            │ [Phone]     │
│         │            │             │            │  locked     │
│         │            │             │            │             │
└─────────┴────────────┴─────────────┴────────────┴─────────────┘

Key timings:
- Hotword recognition: ~500-800ms
- Transition delay: 500ms (audio settle)
- Command recognition: ~500-800ms
- Device lock execution: <100ms
- Return to hotword: ~500ms

Total flow: ~2-2.5 seconds from "hey sri" to phone locked
```

---

## localStorage State

```
┌──────────────────────────────────────────────┐
│         localStorage Keys                     │
├──────────────────────────────────────────────┤
│                                              │
│ appReady: "false"                            │
│ ├─ Initial state (before registration)      │
│ ├─ Set by: VoiceRegistration.tsx            │
│ └─ Checked by: App.tsx                      │
│                                              │
│ appReady: "true"                             │
│ ├─ Set after voice sample captured          │
│ ├─ Triggers: Global speech engine start     │
│ └─ Event: Speech engine ready!              │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Signal Flow: Complete Example

```
User speaks: "hey sri lock my phone"

┌─────────────────────────────────────────────────────────┐
│ SpeechRecognition.onresult()                            │
│ → transcript: "hey sri lock my phone"                   │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ SpeechEngine.handleHotwordMode()                        │
│ → Check: "hey sri lock my phone".includes("hey sri")   │
│ ✓ TRUE                                                  │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ onHotwordDetected() callback                            │
│ setState("COMMAND")                                     │
│ [wait 500ms]                                            │
│ startListening()                                        │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼ [User says "lock my phone"]
┌─────────────────────────────────────────────────────────┐
│ SpeechRecognition.onresult()                            │
│ → transcript: "lock my phone"                           │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ SpeechEngine.handleCommandMode()                        │
│ → onCommandDetected("lock my phone")                    │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ useSpeechEngine hook's onCommandDetected handler        │
│ → parseCommand("lock my phone")                         │
│ → CommandParser matches pattern /lock.*phone/i         │
│ → returns { intent: "lock", target: "phone", ... }     │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ executeCommand("lock", "phone")                         │
│ → switch case "lock"                                    │
│ → call lockDevice()                                     │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ Capacitor.Plugins.WakeWord.lockDevice()                │
│ → Bridge to native Android                              │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ [Native] DeviceLockHelper.lockDevice()                  │
│ → DevicePolicyManager.lockNow()                         │
│ → Android kernel: Lock the device                       │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
         [Phone Locked! 🔒]

After phone locks:
┌─────────────────────────────────────────────────────────┐
│ SpeechEngine.handleCommandMode()                        │
│ → setState("HOTWORD")                                   │
│ → [wait 500ms]                                          │
│ → startListening()                                      │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
         [Back to listening for "hey sri"...]
```

---

This completes the architecture overview. All components work together to create a seamless voice assistant experience!

