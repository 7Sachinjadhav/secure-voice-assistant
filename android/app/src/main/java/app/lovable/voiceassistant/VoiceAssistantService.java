package app.lovable.voiceassistant;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.util.ArrayList;

public class VoiceAssistantService extends Service {

    private static final String CHANNEL_ID = "voice_assistant_channel";

    private SpeechRecognizer wakeRecognizer;
    private SpeechRecognizer commandRecognizer;

    private Intent wakeIntent;
    private Intent commandIntent;

    @Override
    public void onCreate() {
        super.onCreate();

        createNotificationChannel();
        startForeground(1, getNotification());

        startWakeWordListener();
    }

    // =========================
    // 🔹 WAKE WORD LISTENER
    // =========================
    private void startWakeWordListener() {

        destroyCommandRecognizer();

        wakeRecognizer = SpeechRecognizer.createSpeechRecognizer(this);

        wakeIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        wakeIntent.putExtra(
                RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
        );
        wakeIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-IN");

        wakeRecognizer.setRecognitionListener(new RecognitionListener() {

            @Override public void onReadyForSpeech(Bundle params) {}
            @Override public void onBeginningOfSpeech() {}
            @Override public void onRmsChanged(float rmsdB) {}
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() {}

            @Override
            public void onError(int error) {
                restartWakeListener();
            }

            @Override
            public void onResults(Bundle results) {
                ArrayList<String> matches =
                        results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);

                if (matches != null) {
                    for (String text : matches) {
                        Log.d("VOICE", "Wake heard: " + text);
                        text = text.toLowerCase();

                        if (text.contains("hey sri")) {
                            startCommandListener();
                            return;
                        }
                    }
                }
                restartWakeListener();
            }

            @Override public void onPartialResults(Bundle partialResults) {}
            @Override public void onEvent(int eventType, Bundle params) {}
        });

        wakeRecognizer.startListening(wakeIntent);
    }

    private void restartWakeListener() {
        if (wakeRecognizer != null) {
            wakeRecognizer.cancel();
            wakeRecognizer.startListening(wakeIntent);
        }
    }

    // =========================
    // 🔹 COMMAND LISTENER
    // =========================
    private void startCommandListener() {

        destroyWakeRecognizer();

        commandRecognizer = SpeechRecognizer.createSpeechRecognizer(this);

        commandIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        commandIntent.putExtra(
                RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
        );
        commandIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-IN");

        commandRecognizer.setRecognitionListener(new RecognitionListener() {

            @Override public void onReadyForSpeech(Bundle params) {}
            @Override public void onBeginningOfSpeech() {}
            @Override public void onRmsChanged(float rmsdB) {}
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() {}

            @Override
            public void onError(int error) {
                startWakeWordListener();
            }

            @Override
            public void onResults(Bundle results) {
                ArrayList<String> matches =
                        results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);

                if (matches != null) {
                    for (String cmd : matches) {
                        Log.d("VOICE", "Command heard: " + cmd);
                        cmd = cmd.toLowerCase();

                        if (cmd.contains("lock")) {
                            DeviceLockHelper.lockDevice(VoiceAssistantService.this);
                            break;
                        }
                    }
                }
                startWakeWordListener();
            }

            @Override public void onPartialResults(Bundle partialResults) {}
            @Override public void onEvent(int eventType, Bundle params) {}
        });

        commandRecognizer.startListening(commandIntent);
    }

    // =========================
    // 🔹 CLEANUP
    // =========================
    private void destroyWakeRecognizer() {
        if (wakeRecognizer != null) {
            wakeRecognizer.cancel();
            wakeRecognizer.destroy();
            wakeRecognizer = null;
        }
    }

    private void destroyCommandRecognizer() {
        if (commandRecognizer != null) {
            commandRecognizer.cancel();
            commandRecognizer.destroy();
            commandRecognizer = null;
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        destroyWakeRecognizer();
        destroyCommandRecognizer();
        super.onDestroy();
    }

    // =========================
    // 🔹 NOTIFICATION
    // =========================
    private Notification getNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Sri Voice Assistant")
                .setContentText("Listening for 'Hey Sri'")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setOngoing(true)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Voice Assistant",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}
