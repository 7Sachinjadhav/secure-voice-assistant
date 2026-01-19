package app.lovable.voiceassistant;

import android.Manifest;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AppPermissions")
public class AppPermissionsPlugin extends Plugin {

    private static final int REQ_CODE = 500;

    private PluginCall savedCall;

    @PluginMethod
    public void requestPermission(PluginCall call) {
        String type = call.getString("type");

        if (type == null) {
            call.reject("Permission type missing");
            return;
        }

        savedCall = call;

        switch (type) {
            case "microphone":
                request(new String[]{Manifest.permission.RECORD_AUDIO});
                break;

            case "phone":
                request(new String[]{
                        Manifest.permission.CALL_PHONE,
                        Manifest.permission.READ_PHONE_STATE
                });
                break;

            case "sms":
                request(new String[]{
                        Manifest.permission.SEND_SMS,
                        Manifest.permission.READ_SMS
                });
                break;

            case "contacts":
                request(new String[]{
                        Manifest.permission.READ_CONTACTS,
                        Manifest.permission.WRITE_CONTACTS
                });
                break;

            default:
                call.reject("Unknown permission type");
        }
    }

    private void request(String[] permissions) {
        ActivityCompat.requestPermissions(
                getActivity(),
                permissions,
                REQ_CODE
        );
    }

    @Override
    protected void handleRequestPermissionsResult(
            int requestCode,
            String[] permissions,
            int[] grantResults) {

        if (requestCode == REQ_CODE && savedCall != null) {
            boolean granted = true;

            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    granted = false;
                    break;
                }
            }

            JSObject res = new JSObject();
            res.put("granted", granted);
            savedCall.resolve(res);
            savedCall = null;
        }
    }

    // 🔒 DEVICE ADMIN — DO NOT CHANGE YOUR FLOW
    @PluginMethod
    public void requestDeviceAdmin(PluginCall call) {
        Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
        intent.putExtra(
                DevicePolicyManager.EXTRA_DEVICE_ADMIN,
                new ComponentName(getContext(), MyDeviceAdminReceiver.class)
        );
        intent.putExtra(
                DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                "Required to lock the phone using voice commands"
        );
        getActivity().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void isDeviceAdminEnabled(PluginCall call) {
        DevicePolicyManager dpm =
                (DevicePolicyManager) getContext()
                        .getSystemService(Context.DEVICE_POLICY_SERVICE);

        ComponentName admin =
                new ComponentName(getContext(), MyDeviceAdminReceiver.class);

        boolean enabled = dpm != null && dpm.isAdminActive(admin);

        JSObject res = new JSObject();
        res.put("enabled", enabled);
        call.resolve(res);
    }
}

