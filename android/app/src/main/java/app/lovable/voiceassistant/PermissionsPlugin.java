package app.lovable.voiceassistant;

import android.Manifest;
import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "AppPermissions",
    permissions = {
        @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "microphone"),
        @Permission(strings = { Manifest.permission.CALL_PHONE, Manifest.permission.READ_PHONE_STATE }, alias = "phone"),
        @Permission(strings = { Manifest.permission.SEND_SMS, Manifest.permission.READ_SMS }, alias = "sms"),
        @Permission(strings = { Manifest.permission.READ_CONTACTS, Manifest.permission.WRITE_CONTACTS }, alias = "contacts")
    }
)
public class PermissionsPlugin extends Plugin {

    @PluginMethod
    public void requestPermission(PluginCall call) {
        String permissionType = call.getString("type", "");
        
        switch (permissionType) {
            case "microphone":
                requestPermissionForAlias("microphone", call, "permissionCallback");
                break;
            case "phone":
                requestPermissionForAlias("phone", call, "permissionCallback");
                break;
            case "sms":
                requestPermissionForAlias("sms", call, "permissionCallback");
                break;
            case "contacts":
                requestPermissionForAlias("contacts", call, "permissionCallback");
                break;
            default:
                call.reject("Unknown permission type: " + permissionType);
        }
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        String permissionType = call.getString("type", "");
        boolean granted = false;
        
        switch (permissionType) {
            case "microphone":
                granted = getPermissionState("microphone") == PermissionState.GRANTED;
                break;
            case "phone":
                granted = getPermissionState("phone") == PermissionState.GRANTED;
                break;
            case "sms":
                granted = getPermissionState("sms") == PermissionState.GRANTED;
                break;
            case "contacts":
                granted = getPermissionState("contacts") == PermissionState.GRANTED;
                break;
        }
        
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        String permissionType = call.getString("type", "");
        boolean granted = false;
        
        switch (permissionType) {
            case "microphone":
                granted = getPermissionState("microphone") == PermissionState.GRANTED;
                break;
            case "phone":
                granted = getPermissionState("phone") == PermissionState.GRANTED;
                break;
            case "sms":
                granted = getPermissionState("sms") == PermissionState.GRANTED;
                break;
            case "contacts":
                granted = getPermissionState("contacts") == PermissionState.GRANTED;
                break;
        }
        
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    // ✅ ONLY ADDITION — DEVICE ADMIN (NATIVE, CORRECT)
    @PluginMethod
    public void requestDeviceAdmin(PluginCall call) {
        Activity activity = getActivity();

        ComponentName adminComponent =
            new ComponentName(activity, MyDeviceAdminReceiver.class);

        Intent intent =
            new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);

        intent.putExtra(
            DevicePolicyManager.EXTRA_DEVICE_ADMIN,
            adminComponent
        );

        intent.putExtra(
            DevicePolicyManager.EXTRA_ADD_EXPLANATION,
            "Required to lock your phone using voice commands."
        );

        activity.startActivity(intent);
        call.resolve();
    }
    @PluginMethod
    public void isDeviceAdminEnabled(PluginCall call) {
        Activity activity = getActivity();

        DevicePolicyManager dpm =
                (DevicePolicyManager) activity.getSystemService(Activity.DEVICE_POLICY_SERVICE);

        ComponentName adminComponent =
                new ComponentName(activity, MyDeviceAdminReceiver.class);

        boolean enabled = dpm.isAdminActive(adminComponent);

        JSObject result = new JSObject();
        result.put("enabled", enabled);
        call.resolve(result);
    }

    @PluginMethod
    public void lockPhone(PluginCall call) {
        Activity activity = getActivity();

        DevicePolicyManager dpm =
                (DevicePolicyManager) activity.getSystemService(Activity.DEVICE_POLICY_SERVICE);

        ComponentName adminComponent =
                new ComponentName(activity, MyDeviceAdminReceiver.class);

        if (dpm.isAdminActive(adminComponent)) {
            dpm.lockNow();
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Phone locked successfully");
            call.resolve(result);
        } else {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", "Device admin not enabled");
            call.reject("Device admin not enabled. Please enable it first.");
        }
    }

}
