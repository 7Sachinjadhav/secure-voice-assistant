package app.lovable.voiceassistant;

import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
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
}
