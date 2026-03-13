package app.lovable.voiceassistant;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register the custom permissions plugin
        registerPlugin(PermissionsPlugin.class);
        registerPlugin(VoiceServicePlugin.class);
        registerPlugin(WakeWordPlugin.class);
        super.onCreate(savedInstanceState);

        // 🔥 Start background service if registration is complete
        startBackgroundServiceIfReady();
    }

    private void startBackgroundServiceIfReady() {
        SharedPreferences prefs = getSharedPreferences("app_settings", MODE_PRIVATE);
        boolean isRegistered = prefs.getBoolean("appReady", false);

        if (isRegistered) {
            Intent serviceIntent = new Intent(this, VoiceAssistantService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        }
    }
}