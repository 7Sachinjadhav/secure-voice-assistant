/**
 * Command Parser - Extract intents from spoken commands
 * 
 * Recognizes:
 * - "lock my phone" -> { intent: "lock", target: "phone" }
 * - "lock device" -> { intent: "lock" }
 * 
 * Future:
 * - "call mom" -> { intent: "call", target: "mom" }
 * - "send sms to dad" -> { intent: "sms", target: "dad" }
 */

export interface ParsedCommand {
  intent: string;
  target?: string;
  confidence: number;
  rawText: string;
}

export class CommandParser {
  // Intent patterns with regex for robust matching
  private patterns: Record<string, RegExp[]> = {
    lock: [
      /lock.*(phone|device|screen)/i,
      /lock\s*(my\s*)?(phone|device)/i,
      /device.*(lock|lock\s*down)/i,
    ],
    call: [
      /call\s+([a-z]+)/i,
      /phone\s+call\s+([a-z]+)/i,
    ],
    sms: [
      /send\s+sms?\s+(?:to\s+)?([a-z]+)/i,
      /text\s+(?:to\s+)?([a-z]+)/i,
      /message\s+([a-z]+)/i,
    ],
    open: [
      /open\s+([a-z]+)/i,
      /launch\s+([a-z]+)/i,
    ],
  };

  /**
   * Parse a voice command string into structured intent
   */
  parse(command: string): ParsedCommand {
    const normalizedCommand = command.toLowerCase().trim();

    // Try each intent pattern
    for (const [intent, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        const match = normalizedCommand.match(pattern);
        if (match) {
          // Extract target from capture group if present
          const target = match[1] || undefined;

          return {
            intent,
            target,
            confidence: 0.95,
            rawText: command,
          };
        }
      }
    }

    // No match found
    return {
      intent: "unknown",
      confidence: 0,
      rawText: command,
    };
  }

  /**
   * Check if command contains specific intent
   */
  hasIntent(command: string, intent: string): boolean {
    const parsed = this.parse(command);
    return parsed.intent === intent;
  }

  /**
   * List supported intents
   */
  getAvailableIntents(): string[] {
    return Object.keys(this.patterns);
  }
}

// Singleton instance
const parser = new CommandParser();

/**
 * Quick parsing helper
 */
export function parseCommand(command: string): ParsedCommand {
  return parser.parse(command);
}

/**
 * Check if command is a lock command
 */
export function isLockCommand(command: string): boolean {
  const parsed = parser.parse(command);
  return parsed.intent === "lock";
}
