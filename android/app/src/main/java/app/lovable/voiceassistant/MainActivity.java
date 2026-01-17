package app.lovable.voiceassistant;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register custom plugins
        registerPlugin(PermissionsPlugin.class);
        registerPlugin(WakeWordPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
