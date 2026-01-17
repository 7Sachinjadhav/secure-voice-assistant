package app.lovable.voiceassistant;

import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;

@CapacitorPlugin(name = "WakeWord")
public class WakeWordPlugin extends Plugin {

    private SpeechRecognizer speechRecognizer;
    private Intent listenIntent;

    // Simple state machine: after wake word, we accept the next phrase as the command.
    private boolean wakeArmed = false;
    private long wakeArmedAtMs = 0;
    private static final long WAKE_WINDOW_MS = 6000;

    private void startInternalListening() {
        if (speechRecognizer == null || listenIntent == null) return;
        try {
            speechRecognizer.startListening(listenIntent);
        } catch (Exception ignored) {
        }
    }

    private void resetWakeWindow() {
        wakeArmed = false;
        wakeArmedAtMs = 0;
    }

    private boolean isWakeWord(String text) {
        if (text == null) return false;
        final String lower = text.toLowerCase();
        return lower.contains("hey sri") || lower.contains("hey s r i") || lower.contains("hey siri") || lower.contains("hey shri") || lower.contains("hey shree") || lower.contains("hey three") || lower.contains("hey serie");
    }

    private boolean isLockCommand(String text) {
        if (text == null) return false;
        final String lower = text.toLowerCase();
        return (lower.contains("lock") && (lower.contains("phone") || lower.contains("device") || lower.contains("screen")));
    }

    private void handleRecognizedText(String text, boolean isPartial) {
        if (text == null) return;

        // Emit raw speech stream to JS for debugging / UI
        JSObject raw = new JSObject();
        raw.put("text", text);
        raw.put("partial", isPartial);
        notifyListeners("speechHeard", raw);

        long now = System.currentTimeMillis();

        // Expire wake window
        if (wakeArmed && (now - wakeArmedAtMs) > WAKE_WINDOW_MS) {
            resetWakeWindow();
        }

        // If phrase includes wake word, arm the window
        if (isWakeWord(text)) {
            wakeArmed = true;
            wakeArmedAtMs = now;

            JSObject data = new JSObject();
            data.put("wakeWord", "hey sri");
            notifyListeners("wakeWordDetected", data);

            // If the same phrase already contains the command, emit immediately
            if (isLockCommand(text)) {
                JSObject cmd = new JSObject();
                cmd.put("text", text);
                cmd.put("type", "lock");
                notifyListeners("commandDetected", cmd);
                resetWakeWindow();
            }
            return;
        }

        // If wake is armed, treat the next full result that looks like a command as the command
        if (!isPartial && wakeArmed) {
            if (isLockCommand(text)) {
                JSObject cmd = new JSObject();
                cmd.put("text", text);
                cmd.put("type", "lock");
                notifyListeners("commandDetected", cmd);
                resetWakeWindow();
            }
        }
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
            call.reject("Speech recognition not available");
            return;
        }

        stopListening(null);

        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(getContext());

        listenIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        listenIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        listenIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-IN");
        listenIntent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        listenIntent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);

        speechRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) {}
            @Override public void onBeginningOfSpeech() {}
            @Override public void onRmsChanged(float rmsdB) {}
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() {}

            @Override
            public void onError(int error) {
                // Recover by restarting
                startInternalListening();
            }

            @Override
            public void onResults(Bundle results) {
                ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (matches != null && matches.size() > 0) {
                    // Use best match
                    handleRecognizedText(matches.get(0), false);
                }
                startInternalListening();
            }

            @Override
            public void onPartialResults(Bundle partialResults) {
                ArrayList<String> matches = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (matches != null && matches.size() > 0) {
                    handleRecognizedText(matches.get(0), true);
                }
            }

            @Override public void onEvent(int eventType, Bundle params) {}
        });

        resetWakeWindow();
        startInternalListening();
        call.resolve();
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        resetWakeWindow();

        if (speechRecognizer != null) {
            try { speechRecognizer.stopListening(); } catch (Exception ignored) {}
            try { speechRecognizer.cancel(); } catch (Exception ignored) {}
            try { speechRecognizer.destroy(); } catch (Exception ignored) {}
            speechRecognizer = null;
        }
        listenIntent = null;

        if (call != null) call.resolve();
    }
}
