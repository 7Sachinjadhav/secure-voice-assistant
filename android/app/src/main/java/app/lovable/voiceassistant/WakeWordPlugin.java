package app.lovable.voiceassistant;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
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
    private Intent recognizerIntent;
    private Handler mainHandler;

    // Guard against duplicate startListening/restart calls
    private boolean isListening = false;
    private boolean isStarting = false;
    private Runnable restartRunnable;

    @Override
    public void load() {
        super.load();
        mainHandler = new Handler(Looper.getMainLooper());
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        System.out.println("\n\n==== [WakeWordPlugin] startListening() CALLED ====\n");

        getActivity().runOnUiThread(() -> {
            try {
                if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                    System.out.println("[WakeWordPlugin] ❌ Speech recognition NOT available");
                    call.reject("Speech recognition not available");
                    return;
                }

                // Prevent duplicate starts which commonly cause ERROR_CLIENT (5)
                if (isListening || isStarting) {
                    System.out.println("[WakeWordPlugin] ℹ️ Already listening/starting - ignoring duplicate start");
                    call.resolve();
                    return;
                }

                System.out.println("[WakeWordPlugin] ✓ Speech recognition available");
                initializeSpeechRecognizer();
                call.resolve();
            } catch (Exception e) {
                System.out.println("[WakeWordPlugin] ❌ EXCEPTION: " + e.getMessage());
                e.printStackTrace();
                call.reject("Error: " + e.getMessage());
            }
        });
    }

    private void initializeSpeechRecognizer() {
        // Cancel any pending restarts
        if (restartRunnable != null) {
            mainHandler.removeCallbacks(restartRunnable);
        }

        isListening = false;
        isStarting = false;

        if (speechRecognizer != null) {
            try {
                speechRecognizer.cancel();
            } catch (Exception ignored) {}
            speechRecognizer.destroy();
            speechRecognizer = null;
        }

        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(getContext());

        recognizerIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-IN");
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        recognizerIntent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);

        speechRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override
            public void onReadyForSpeech(Bundle params) {
                isStarting = false;
                isListening = true;
                System.out.println("[WakeWordPlugin] 🎤 Ready to listen - say 'hey sri lock my phone'");
            }

            @Override
            public void onBeginningOfSpeech() {
                System.out.println("[WakeWordPlugin] 🎵 Speech detected!");
            }

            @Override
            public void onRmsChanged(float rmsdB) {}

            @Override
            public void onBufferReceived(byte[] buffer) {}

            @Override
            public void onEndOfSpeech() {
                System.out.println("[WakeWordPlugin] 🛑 Speech ended");
                isListening = false;
            }

            @Override
            public void onError(int error) {
                isListening = false;
                isStarting = false;

                String errorMsg = getErrorMessage(error);
                System.out.println("[WakeWordPlugin] ⚠️ Error " + error + ": " + errorMsg);

                // ERROR_CLIENT (5) is commonly caused by duplicate/overlapping startListening calls.
                // We guard above, and for safety we fully cancel + restart with a slightly longer delay.
                int delay = (error == SpeechRecognizer.ERROR_CLIENT) ? 2000 : 1200;
                scheduleRestart(delay, error);
            }

            @Override
            public void onResults(Bundle results) {
                isListening = false;
                isStarting = false;

                ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);

                if (matches != null && !matches.isEmpty()) {
                    System.out.println("[WakeWordPlugin] 📝 Results: " + matches.toString());

                    for (String text : matches) {
                        String lowerText = text.toLowerCase();
                        System.out.println("[WakeWordPlugin] Checking: '" + lowerText + "'");

                        // Check for wake word and lock command
                        if (lowerText.contains("hey") && lowerText.contains("sri")) {
                            System.out.println("[WakeWordPlugin] ✓ Wake word detected!");

                            // Notify JavaScript
                            JSObject data = new JSObject();
                            data.put("command", lowerText);
                            notifyListeners("commandDetected", data);

                            // Check for lock command
                            if (lowerText.contains("lock")) {
                                System.out.println("[WakeWordPlugin] 🔒 LOCK COMMAND - Locking phone NOW!");
                                lockPhone();
                            }
                            break;
                        }
                    }
                } else {
                    System.out.println("[WakeWordPlugin] No matches received");
                }

                // Restart listening
                scheduleRestart(700, -1);
            }

            @Override
            public void onPartialResults(Bundle partialResults) {
                ArrayList<String> partial = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (partial != null && !partial.isEmpty()) {
                    System.out.println("[WakeWordPlugin] Partial: " + partial.get(0));
                }
            }

            @Override
            public void onEvent(int eventType, Bundle params) {}
        });

        // Start listening
        startListeningSafely("init");
    }

    private void startListeningSafely(String reason) {
        if (speechRecognizer == null || recognizerIntent == null) return;
        if (isListening || isStarting) {
            System.out.println("[WakeWordPlugin] ℹ️ startListeningSafely(" + reason + ") skipped (already listening/starting)");
            return;
        }

        try {
            isStarting = true;
            try {
                // Cancel any previous session; helps reduce ERROR_CLIENT(5)
                speechRecognizer.cancel();
            } catch (Exception ignored) {}

            speechRecognizer.startListening(recognizerIntent);
            System.out.println("[WakeWordPlugin] 🎤 Started listening (" + reason + ")...");
        } catch (Exception e) {
            isStarting = false;
            System.out.println("[WakeWordPlugin] ❌ startListeningSafely(" + reason + ") failed: " + e.getMessage());
            scheduleRestart(2000, SpeechRecognizer.ERROR_CLIENT);
        }
    }

    private void scheduleRestart(int delayMs, int lastError) {
        if (restartRunnable != null) {
            mainHandler.removeCallbacks(restartRunnable);
        }

        restartRunnable = () -> {
            if (speechRecognizer == null) return;
            if (isListening || isStarting) {
                System.out.println("[WakeWordPlugin] 🔁 Restart skipped (still listening/starting)");
                return;
            }

            // For persistent client errors, re-initialize from scratch
            if (lastError == SpeechRecognizer.ERROR_CLIENT) {
                System.out.println("[WakeWordPlugin] 🔄 Reinitializing after ERROR_CLIENT...");
                initializeSpeechRecognizer();
                return;
            }

            System.out.println("[WakeWordPlugin] 🔄 Restarting...");
            startListeningSafely("restart");
        };

        mainHandler.postDelayed(restartRunnable, delayMs);
    }

    private String getErrorMessage(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_AUDIO: return "Audio error";
            case SpeechRecognizer.ERROR_CLIENT: return "Client error";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "No permission";
            case SpeechRecognizer.ERROR_NETWORK: return "Network error";
            case SpeechRecognizer.ERROR_NO_MATCH: return "No match";
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "Network timeout";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "Busy";
            case SpeechRecognizer.ERROR_SERVER: return "Server error";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "Speech timeout";
            default: return "Unknown";
        }
    }

    private void lockPhone() {
        try {
            DevicePolicyManager dpm = (DevicePolicyManager) getContext().getSystemService(Context.DEVICE_POLICY_SERVICE);
            ComponentName admin = new ComponentName(getContext(), MyDeviceAdminReceiver.class);

            if (dpm != null && dpm.isAdminActive(admin)) {
                System.out.println("[WakeWordPlugin] ✓ Device Admin active - LOCKING!");
                dpm.lockNow();
                System.out.println("[WakeWordPlugin] ✓ Phone LOCKED!");
            } else {
                System.out.println("[WakeWordPlugin] ❌ Device Admin NOT active - cannot lock");
            }
        } catch (Exception e) {
            System.out.println("[WakeWordPlugin] ❌ Lock error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void lockDevice(PluginCall call) {
        System.out.println("[WakeWordPlugin] lockDevice() called from JS");
        lockPhone();
        call.resolve();
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        if (restartRunnable != null) {
            mainHandler.removeCallbacks(restartRunnable);
            restartRunnable = null;
        }

        if (speechRecognizer != null) {
            try {
                speechRecognizer.cancel();
            } catch (Exception ignored) {}
            speechRecognizer.stopListening();
            speechRecognizer.destroy();
            speechRecognizer = null;
        }

        isListening = false;
        isStarting = false;
        if (call != null) call.resolve();
    }
}
