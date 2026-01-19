package app.lovable.voiceassistant;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;

public class DeviceLockHelper {

    public static void lockDevice(Context context) {
        DevicePolicyManager dpm =
                (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);

        ComponentName admin =
                new ComponentName(context, MyDeviceAdminReceiver.class);

        if (dpm != null && dpm.isAdminActive(admin)) {
            dpm.lockNow(); // 🔒 ACTUAL LOCK
        }
    }
}
