package app.lovable.voiceassistant;

import android.content.Intent;
import android.os.Build;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;

public class VoiceServicePlugin extends Plugin {

    public void startCommandListener(PluginCall call) {

        Intent intent = new Intent(getContext(), VoiceAssistantService.class);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }

        call.resolve();
    }
}
