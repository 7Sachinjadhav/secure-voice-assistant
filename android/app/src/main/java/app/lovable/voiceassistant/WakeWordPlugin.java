package app.lovable.voiceassistant;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
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
    private Intent recognizerIntent;

    @PluginMethod
    public void startListening(PluginCall call) {
        System.out.println("\n\n==== [WakeWordPlugin] startListening() CALLED ====\n");

        // Run on main thread
        getActivity().runOnUiThread(() -> {
            try {
                System.out.println("\n\n[WakeWordPlugin] ========== STARLISTENING MAIN THREAD START ==========");
                
                if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                    System.out.println("[WakeWordPlugin] ❌ Speech recognition NOT available");
                    call.reject("Speech recognition not available");
                    return;
                }

                System.out.println("[WakeWordPlugin] ✓ Speech recognition available");

                if (speechRecognizer != null) {
                    speechRecognizer.destroy();
                }

                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
                System.out.println("[WakeWordPlugin] SpeechRecognizer created");

                recognizerIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                recognizerIntent.putExtra(
                        RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                        RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
                );
                recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-IN");
                recognizerIntent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);

                speechRecognizer.setRecognitionListener(new RecognitionListener() {

                    @Override
                    public void onReadyForSpeech(Bundle params) {
                        System.out.println("[WakeWordPlugin] 🎤 onReadyForSpeech() - Ready to listen");
                    }

                    @Override
                    public void onBeginningOfSpeech() {
                        System.out.println("[WakeWordPlugin] 🎵 onBeginningOfSpeech() - Speech detected!");
                    }

                    @Override public void onRmsChanged(float rmsdB) {
                        // Don't log this - too spammy
                    }

                    @Override public void onBufferReceived(byte[] buffer) {
                        System.out.println("[WakeWordPlugin] 📦 onBufferReceived() - " + buffer.length + " bytes");
                    }

                    @Override
                    public void onEndOfSpeech() {
                        System.out.println("[WakeWordPlugin] 🛑 onEndOfSpeech() - Speech ended, processing...");
                    }

                    @Override
                    public void onError(int error) {
                        System.out.println("[WakeWordPlugin] ❌❌❌ onError() called with error code: " + error);
                        String errorMsg = "";
                        switch(error) {
                            case SpeechRecognizer.ERROR_AUDIO: errorMsg = "Audio recording error"; break;
                            case SpeechRecognizer.ERROR_CLIENT: errorMsg = "Client side error"; break;
                            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: errorMsg = "Insufficient permissions"; break;
                            case SpeechRecognizer.ERROR_NETWORK: errorMsg = "Network error"; break;
                            case SpeechRecognizer.ERROR_NO_MATCH: errorMsg = "No match found"; break;
                            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: errorMsg = "Network timeout"; break;
                            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: errorMsg = "Recognizer busy"; break;
                            case SpeechRecognizer.ERROR_SERVER: errorMsg = "Server error"; break;
                            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: errorMsg = "Speech timeout"; break;
                            default: errorMsg = "Unknown error";
                        }
                        System.out.println("[WakeWordPlugin] Error message: " + errorMsg);
                        restartListening();
                    }

                    @Override
                    public void onResults(Bundle results) {
                        System.out.println("[WakeWordPlugin] >>> onResults() called");

                        ArrayList<String> matches =
                                results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);

                        if (matches == null || matches.isEmpty()) {
                            System.out.println("[WakeWordPlugin] No matches received");
                            restartListening();
                            return;
                        }

                        System.out.println("[WakeWordPlugin] Got " + matches.size() + " matches");
                        for (int i = 0; i < matches.size(); i++) {
                            System.out.println("[WakeWordPlugin] Match " + i + ": '" + matches.get(i) + "'");
                        }

                        boolean foundHotword = false;
                        for (String text : matches) {
                            text = text.toLowerCase();
                            System.out.println("[WakeWordPlugin] Checking: '" + text + "'");

                            if (text.contains("hey sri")) {
                                foundHotword = true;
                                System.out.println("[WakeWordPlugin] ✓✓✓ HOTWORD DETECTED!");

                                // Extract command after wake word
                                String command = text.replace("hey sri", "").trim();
                                System.out.println("[WakeWordPlugin] Raw command: '" + command + "'");
                                System.out.println("[WakeWordPlugin] Command length: " + command.length());

                                JSObject data = new JSObject();
                                data.put("command", command);

                                System.out.println("[WakeWordPlugin] === ABOUT TO SEND EVENT ===");
                                System.out.println("[WakeWordPlugin] Event name: commandDetected");
                                System.out.println("[WakeWordPlugin] Event data: " + data.toString());
                                notifyListeners("commandDetected", data);
                                System.out.println("[WakeWordPlugin] === EVENT SENT ===");

                                // Execute native actions
                                handleCommand(command);
                                break;
                            }
                        }

                        if (!foundHotword) {
                            System.out.println("[WakeWordPlugin] No hotword found in any match, restarting...");
                        }
                        
                        System.out.println("[WakeWordPlugin] Restarting listening...");
                        restartListening();
                    }

                    @Override public void onPartialResults(Bundle partialResults) {}
                    @Override public void onEvent(int eventType, Bundle params) {}
                });

                speechRecognizer.startListening(recognizerIntent);
                System.out.println("[WakeWordPlugin] 🎤 startListening() STARTED - waiting for speech...");
                System.out.println("[WakeWordPlugin] Say: 'hey sri lock my phone'");
                System.out.println("==== [WakeWordPlugin] Setup Complete ====\n");
                call.resolve();
            } catch (Exception e) {
                System.out.println("[WakeWordPlugin] ❌ EXCEPTION in startListening: " + e.getMessage());
                e.printStackTrace();
                call.reject("Error starting speech recognition: " + e.getMessage());
            }
        });
    }

    private void restartListening() {
        System.out.println("[WakeWordPlugin] restartListening() called");
        if (speechRecognizer != null) {
            speechRecognizer.stopListening();
            // Add a delay before restarting to prevent excessive CPU usage
            try {
                Thread.sleep(1000);  // 1 second delay
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            speechRecognizer.startListening(recognizerIntent);
            System.out.println("[WakeWordPlugin] Listening restarted");
        }
    }

    private void handleCommand(String command) {
        System.out.println("[WakeWordPlugin] handleCommand() called with: '" + command + "'");

        if (command.contains("lock")) {
            System.out.println("[WakeWordPlugin] 🔒 LOCK COMMAND DETECTED");
            lockPhone();
        } else {
            System.out.println("[WakeWordPlugin] ❓ Unknown/empty command");
        }
    }

    private void lockPhone() {
        System.out.println("[WakeWordPlugin] lockPhone() called");

        DevicePolicyManager dpm =
                (DevicePolicyManager) getContext().getSystemService(Context.DEVICE_POLICY_SERVICE);

        ComponentName adminComponent =
                new ComponentName(getContext(), MyDeviceAdminReceiver.class);

        if (dpm != null && dpm.isAdminActive(adminComponent)) {
            System.out.println("[WakeWordPlugin] ✓ Device Admin active, locking...");
            dpm.lockNow();
            System.out.println("[WakeWordPlugin] ✓ lockNow() called");
        } else {
            System.out.println("[WakeWordPlugin] ❌ Device Admin not active!");
        }
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        if (speechRecognizer != null) {
            speechRecognizer.stopListening();
            speechRecognizer.destroy();
            speechRecognizer = null;
        }
        if (call != null) call.resolve();
    }
}
