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

    private SpeechRecognizer wakeRecognizer;
    private SpeechRecognizer commandRecognizer;
    private Intent wakeIntent;
    private Intent commandIntent;

    @PluginMethod
    public void startListening(PluginCall call) {
        System.out.println("\n\n==== [WakeWordPlugin] startListening() CALLED ====\n\n");

        getActivity().runOnUiThread(() -> {
            try {
                if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                    System.out.println("[WakeWordPlugin] ? Speech recognition NOT available");
                    call.reject("Speech recognition not available");
                    return;
                }

                System.out.println("[WakeWordPlugin] ? Speech recognition available");
                startWakeWordListener();
                System.out.println("==== [WakeWordPlugin] Setup Complete ====\n");
                call.resolve();
            } catch (Exception e) {
                System.out.println("[WakeWordPlugin] ? EXCEPTION: " + e.getMessage());
                e.printStackTrace();
                call.reject("Error: " + e.getMessage());
            }
        });
    }

    private void startWakeWordListener() {
        System.out.println("[WakeWordPlugin] startWakeWordListener() called");

        wakeRecognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
        wakeIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        wakeIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        wakeIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US");

        wakeRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) {
                System.out.println("[WakeWordPlugin] ?? Wake listener ready");
            }
            @Override public void onBeginningOfSpeech() {
                System.out.println("[WakeWordPlugin] ?? Wake speech detected");
            }
            @Override public void onRmsChanged(float rmsdB) {}
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() {
                System.out.println("[WakeWordPlugin] ?? Wake speech ended");
            }
            @Override public void onError(int error) {
                System.out.println("[WakeWordPlugin] ? Wake error: " + error);
                if (error == 7) {
                    restartWakeListener();
                }
                // Don't restart for other errors to avoid loops
            }
            @Override
            public void onResults(Bundle results) {
                ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (matches != null && matches.size() > 0) {
                    String heard = matches.get(0).toLowerCase();
                    System.out.println("[WakeWordPlugin] Wake heard: '" + heard + "'");
                    
                    if (heard.contains("hey buddy") || heard.equals("buddy")) {
                        System.out.println("[WakeWordPlugin] ??? HOTWORD DETECTED!");
                        if (heard.contains("lock")) {
                            System.out.println("[WakeWordPlugin] ?? LOCK DETECTED IN WAKE - LOCKING NOW");
                            JSObject data = new JSObject();
                            data.put("command", "lock");
                            notifyListeners("commandDetected", data);
                            lockPhone();
                            restartWakeListener();
                            return;
                        } else {
                            startCommandListener();
                            return;
                        }
                    }
                }
                System.out.println("[WakeWordPlugin] No hotword, restarting");
                restartWakeListener();
            }
            @Override public void onPartialResults(Bundle partialResults) {}
            @Override public void onEvent(int eventType, Bundle params) {}
        });

        wakeRecognizer.startListening(wakeIntent);
        System.out.println("[WakeWordPlugin] Wake listening started");
    }

    private void restartWakeListener() {
        if (wakeRecognizer != null) {
            try {
                wakeRecognizer.stopListening();
                Thread.sleep(2000); // Longer delay to avoid error loops
                wakeRecognizer.startListening(wakeIntent);
                System.out.println("[WakeWordPlugin] Wake listener restarted");
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private void startCommandListener() {
        System.out.println("[WakeWordPlugin] startCommandListener() called");
        
        if (wakeRecognizer != null) {
            wakeRecognizer.stopListening();
            wakeRecognizer.destroy();
            wakeRecognizer = null;
        }

        try {
            Thread.sleep(1000); // Give time for wake recognizer to fully destroy
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        commandRecognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
        commandIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        commandIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        commandIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US");
        commandIntent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 5000L);
        commandIntent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 2000L);

        commandRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) {
                System.out.println("[WakeWordPlugin] ?? Command listener ready - WAITING 5 SECONDS");
            }
            @Override public void onBeginningOfSpeech() {
                System.out.println("[WakeWordPlugin] ?? Command speech detected");
            }
            @Override public void onRmsChanged(float rmsdB) {}
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() {
                System.out.println("[WakeWordPlugin] ?? Command speech ended");
            }
            @Override public void onError(int error) {
                System.out.println("[WakeWordPlugin] ? Command error: " + error);
                startWakeWordListener();
            }
            @Override
            public void onResults(Bundle results) {
                ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (matches != null && matches.size() > 0) {
                    String heard = matches.get(0).toLowerCase();
                    System.out.println("[WakeWordPlugin] Command heard: '" + heard + "'");
                    
                    if (heard.contains("lock")) {
                        System.out.println("[WakeWordPlugin] ?? LOCK DETECTED - LOCKING NOW");
                        JSObject data = new JSObject();
                        data.put("command", "lock");
                        notifyListeners("commandDetected", data);
                        lockPhone();
                        startWakeWordListener();
                        return;
                    }
                }
                System.out.println("[WakeWordPlugin] No lock command, back to wake");
                startWakeWordListener();
            }
            @Override public void onPartialResults(Bundle partialResults) {}
            @Override public void onEvent(int eventType, Bundle params) {}
        });

        commandRecognizer.startListening(commandIntent);
        System.out.println("[WakeWordPlugin] Command listening started");
    }

    private void lockPhone() {
        System.out.println("[WakeWordPlugin] lockPhone() called");
        DevicePolicyManager dpm = (DevicePolicyManager) getContext().getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName adminComponent = new ComponentName(getContext(), MyDeviceAdminReceiver.class);

        boolean isAdminActive = dpm != null && dpm.isAdminActive(adminComponent);
        System.out.println("[WakeWordPlugin] Device admin active: " + isAdminActive);

        if (isAdminActive) {
            System.out.println("[WakeWordPlugin] ? LOCKING DEVICE NOW");
            dpm.lockNow();
        } else {
            System.out.println("[WakeWordPlugin] ? Device Admin not active - cannot lock");
        }
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        if (wakeRecognizer != null) {
            wakeRecognizer.stopListening();
            wakeRecognizer.destroy();
        }
        if (commandRecognizer != null) {
            commandRecognizer.stopListening();
            commandRecognizer.destroy();
        }
        call.resolve();
    }
}
