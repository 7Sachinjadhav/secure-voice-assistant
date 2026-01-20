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
    private boolean isListening = false;

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
        if (speechRecognizer != null) {
            speechRecognizer.destroy();
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
                String errorMsg = getErrorMessage(error);
                System.out.println("[WakeWordPlugin] ⚠️ Error " + error + ": " + errorMsg);
                
                // Restart after a delay (don't block UI thread)
                scheduleRestart(1500);
            }

            @Override
            public void onResults(Bundle results) {
                isListening = false;
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
                scheduleRestart(500);
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
        speechRecognizer.startListening(recognizerIntent);
        System.out.println("[WakeWordPlugin] 🎤 Started listening...");
    }

    private void scheduleRestart(int delayMs) {
        mainHandler.postDelayed(() -> {
            if (speechRecognizer != null) {
                System.out.println("[WakeWordPlugin] 🔄 Restarting...");
                speechRecognizer.startListening(recognizerIntent);
            }
        }, delayMs);
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
        if (speechRecognizer != null) {
            speechRecognizer.stopListening();
            speechRecognizer.destroy();
            speechRecognizer = null;
        }
        isListening = false;
        if (call != null) call.resolve();
    }
}
