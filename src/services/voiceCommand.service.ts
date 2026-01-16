import { Capacitor, registerPlugin } from "@capacitor/core";

interface AppPermissionsPlugin {
  lockPhone(): Promise<{ success: boolean; message: string }>;
  isDeviceAdminEnabled(): Promise<{ enabled: boolean }>;
}

const AppPermissions = registerPlugin<AppPermissionsPlugin>("AppPermissions");

export type VoiceCommand = {
  type: "lock" | "call" | "message" | "open" | "unknown";
  target?: string;
  rawText: string;
};

/**
 * Parses voice transcript to extract command type and target
 */
export const parseVoiceCommand = (transcript: string): VoiceCommand => {
  const lowerText = transcript.toLowerCase().trim();
  
  // Remove wake word variations
  const cleanedText = lowerText
    .replace(/hey\s*(sri|siri|serie|shri|shree|three)/gi, "")
    .trim();

  // Lock phone command
  if (cleanedText.includes("lock") && (cleanedText.includes("phone") || cleanedText.includes("device") || cleanedText.includes("screen"))) {
    return { type: "lock", rawText: transcript };
  }

  // Call command
  if (cleanedText.includes("call")) {
    const target = cleanedText.replace(/call\s*/i, "").trim();
    return { type: "call", target, rawText: transcript };
  }

  // Message command
  if (cleanedText.includes("send") && cleanedText.includes("message")) {
    const match = cleanedText.match(/message\s*to\s*(.+)/i);
    const target = match ? match[1].trim() : undefined;
    return { type: "message", target, rawText: transcript };
  }

  // Open app command
  if (cleanedText.includes("open")) {
    const target = cleanedText.replace(/open\s*/i, "").trim();
    return { type: "open", target, rawText: transcript };
  }

  return { type: "unknown", rawText: transcript };
};

/**
 * Checks if transcript contains wake word "Hey Sri"
 */
export const containsWakeWord = (transcript: string): boolean => {
  const wakeWordPatterns = [
    /hey\s*sri/i,
    /hey\s*siri/i,
    /hey\s*shri/i,
    /hey\s*shree/i,
    /hey\s*three/i,
    /hey\s*serie/i,
  ];
  
  return wakeWordPatterns.some(pattern => pattern.test(transcript));
};

/**
 * Executes the lock phone command
 */
export const executeLockCommand = async (): Promise<{ success: boolean; message: string }> => {
  if (Capacitor.getPlatform() !== "android") {
    return { success: false, message: "Lock command only works on Android" };
  }

  try {
    // First check if device admin is enabled
    const adminCheck = await AppPermissions.isDeviceAdminEnabled();
    
    if (!adminCheck.enabled) {
      return { 
        success: false, 
        message: "Device admin not enabled. Please enable it in Permissions." 
      };
    }

    // Execute lock
    const result = await AppPermissions.lockPhone();
    return result;
  } catch (error) {
    console.error("Lock command error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to lock phone" 
    };
  }
};

/**
 * Executes a parsed voice command
 */
export const executeVoiceCommand = async (
  command: VoiceCommand
): Promise<{ success: boolean; message: string }> => {
  switch (command.type) {
    case "lock":
      return executeLockCommand();
    
    case "call":
      // TODO: Implement call functionality
      return { success: false, message: `Call feature coming soon. Target: ${command.target}` };
    
    case "message":
      // TODO: Implement message functionality
      return { success: false, message: `Message feature coming soon. Target: ${command.target}` };
    
    case "open":
      // TODO: Implement open app functionality
      return { success: false, message: `Open app feature coming soon. Target: ${command.target}` };
    
    default:
      return { success: false, message: "Unknown command. Try: 'Hey Sri, lock my phone'" };
  }
};
