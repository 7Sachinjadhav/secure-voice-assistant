# Quick Start: Testing Your Voice Assistant

## 🚀 Step-by-Step Test

### 1. Build & Run
```bash
npx cap run android
```

### 2. Complete Onboarding
- Enter email/password → **Next**
- Grant permissions (Mic, Phone, SMS, Contacts, Device Admin) → **Continue**
- Say "Hey Sri" for voice registration → **Done**
- Tap **Continue** → Goes to About page

### 3. Look for Green Indicator
Bottom-right corner should show:
```
🎤 Listening for 'Hey Sri'...
```
(Green animated dot)

If you don't see it:
- Wait 2 seconds
- Check Inspect console for errors
- Verify `localStorage.appReady = "true"`

### 4. Test the Command

**Expected behavior:**

User says: `"hey sri lock my phone"`

Console shows:
```
[SPEECH] Listening for HOTWORD...
[ASR] Heard: "hey sri lock my phone"
[HOTWORD] Detected!
[COMMAND] Listening for command...
[ASR] Heard: "lock my phone"
[COMMAND] Intent detected: "lock my phone"
[DEVICE] Phone locked successfully
[SPEECH] Changed to: HOTWORD
[SPEECH] Listening for HOTWORD...
```

**Result:** Phone locks immediately ✓

---

## 🐛 Common Issues & Fixes

### Issue: Green Indicator Not Showing

**Check 1:** Inspect console
```
[APP] Speech engine state: { initialized: true, active: true, state: "HOTWORD" }
```

If `active: false`, then:
```
[HOOK] Engine error: SpeechRecognition not supported
```

**Fix:** Using WebView on Android? Device must have Google Speech API.

---

### Issue: "hey sri" Not Detected

**What you might hear in logs:**
```
[ASR] Heard: "hey s r i"
[HOTWORD] NOT Detected! (returns to HOTWORD)
```

**Fixes:**
1. Speak clearly "hey sri"
2. Check language setting is `en-IN` (for Indian English)
3. Try alternatives: "hey", "hey siri", "hey sri" (3 variations)

---

### Issue: "lock my phone" Not Recognized

**What you see:**
```
[COMMAND] Intent detected: "lock my phone"
[COMMAND] Executing: unknown
```

**Cause:** Command parser didn't recognize "lock"

**Fix:** Check `src/lib/commands.ts` has pattern:
```typescript
lock: [
  /lock.*(phone|device|screen)/i,
  /lock\s*(my\s*)?(phone|device)/i,
]
```

---

### Issue: Phone Doesn't Lock After Command

**What you see:**
```
[DEVICE] Phone locked successfully
```
But phone doesn't lock...

**Cause:** Device Admin not enabled

**Fix:**
1. Settings → Apps → Special App Access → Device Admin
2. Find your app → Enable "Device Admin"

---

### Issue: No Console Logs at All

**Cause:** Inspect not connected

**Fix:**
```bash
# In terminal 1:
npx cap run android

# In terminal 2:
adb logcat | grep -i "SPEECH\|COMMAND\|DEVICE"
```

Or open Chrome:
```
chrome://inspect/#devices
```

---

## 📊 Verify Implementation

### Files Created:
- ✓ `src/lib/speech-engine.ts` - Core engine
- ✓ `src/hooks/useSpeechEngine.ts` - React hook
- ✓ `src/lib/commands.ts` - Command parser
- ✓ `src/lib/device-admin.ts` - Device lock bridge

### Files Modified:
- ✓ `src/App.tsx` - Added global speech engine
- ✓ `src/pages/VoiceRegistration.tsx` - Sets `appReady` flag
- ✓ `src/pages/Permissions.tsx` - Callback setup
- ✓ `src/pages/Login.tsx` - Callback setup

### Android Native (already exists):
- ✓ `WakeWordPlugin.java` - Has `lockPhone()` method
- ✓ `DeviceLockHelper.java` - Calls Device Admin lock
- ✓ `MyDeviceAdminReceiver.java` - Device Admin receiver
- ✓ `device_admin.xml` - Manifest config

---

## 🧪 Advanced Testing

### Test 1: Continuous Listening
1. Say "hey sri"
2. Say "lock my phone"
3. Phone locks ✓
4. Immediately say "hey sri" again
5. Should listen again (no restart needed) ✓

### Test 2: Error Recovery
1. Say gibberish
2. No match → console shows "Unknown intent"
3. Should return to HOTWORD mode ✓
4. Say "hey sri lock my phone" again ✓

### Test 3: Page Navigation
1. From About page, tap back button
2. Green indicator still visible (listening continues) ✓
3. Say "hey sri lock my phone"
4. Phone locks ✓

### Test 4: State Transitions
Monitor console for exact sequence:
```
HOTWORD → [user says "hey sri"] → COMMAND → [user says "lock my phone"] → HOTWORD
```

---

## 📱 Device Admin Verification

### Check if Device Admin is Enabled:

```bash
adb shell settings get secure enabled_notification_listeners
```

Your app should be listed. If not:

1. Phone Settings
2. Apps & Notifications → Special App Access → Device Admin
3. Find your app (should be named `app.lovable.voiceassistant`)
4. Toggle ON

---

## ✅ Success Criteria

Your implementation is working when:

1. **Indicator shows:** Green "🎤 Listening for 'Hey Sri'..." at app startup
2. **Hotword works:** Say "hey sri" → console shows `[HOTWORD] Detected!`
3. **Command parsing:** Say "lock my phone" → `[COMMAND] Intent: lock`
4. **Execution:** Phone locks immediately and silently
5. **Auto-restart:** Returns to "🎤 Listening..." without action needed
6. **Persistence:** Green indicator remains across page navigation

If all 6 are working → ✅ Implementation is complete!

---

## 🔄 Next: Adding More Commands

Once "lock" is working, add more commands:

### Future: "call mom"
1. Update `commands.ts` patterns
2. Add handler in `device-admin.ts`
3. Test: "hey sri call mom"

### Future: "send SMS"
Similar 3-step process

---

## 📞 Support

If still stuck:

1. Check `IMPLEMENTATION_GUIDE.md` (detailed explanation)
2. Verify all 4 new files exist
3. Verify all 4 file modifications
4. Check Device Admin is enabled
5. Run `adb logcat | grep SPEECH` while testing

