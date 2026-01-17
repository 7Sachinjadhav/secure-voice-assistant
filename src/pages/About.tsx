import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Lock, 
  Phone, 
  MessageSquare, 
  AppWindow, 
  Camera,
  Shield,
  Mic,
  MicOff,
  Wifi,
  Cpu,
  Sparkles,
  ChevronRight,
  LogOut,
  Volume2,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { 
  containsWakeWord, 
  parseVoiceCommand, 
  executeVoiceCommand,
  VoiceCommand as VoiceCommandType
} from "@/services/voiceCommand.service";

const currentFeatures = [
  {
    icon: Lock,
    title: "Lock Phone",
    description: "Secure your device instantly with voice commands",
  },
  {
    icon: Phone,
    title: "Make Calls",
    description: "Call any contact hands-free using voice",
  },
  {
    icon: MessageSquare,
    title: "Send Messages",
    description: "Compose and send SMS using voice commands",
  },
  {
    icon: AppWindow,
    title: "Open Apps",
    description: "Launch any installed app by speaking its name",
  },
  {
    icon: Camera,
    title: "Camera Control",
    description: "Open camera and capture photos with voice",
  },
];

const futureFeatures = [
  {
    icon: Shield,
    title: "Enhanced Voice Auth",
    description: "Multi-layer voice biometric authentication",
  },
  {
    icon: Wifi,
    title: "Offline Recognition",
    description: "Voice commands work without internet",
  },
  {
    icon: Cpu,
    title: "Smart Automation",
    description: "Create custom voice automation routines",
  },
  {
    icon: Sparkles,
    title: "Advanced Security",
    description: "Real-time threat detection and protection",
  },
];

type CommandStatus = "idle" | "listening" | "processing" | "success" | "error";

const About = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Voice recognition
  const {
    isListening,
    transcript,
    interimTranscript,
    error: voiceError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition();

  const [status, setStatus] = useState<CommandStatus>("idle");
  const [lastCommand, setLastCommand] = useState<VoiceCommandType | null>(null);
  const [commandResult, setCommandResult] = useState<string>("");
  const [wakeWordDetected, setWakeWordDetected] = useState(false);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  // Execute command from a given transcript
  const processCommandFromTranscript = useCallback(async (fullTranscript: string) => {
    if (!fullTranscript || status === "processing") return;
    
    if (!containsWakeWord(fullTranscript)) {
      toast({
        title: "No Wake Word",
        description: "Please start with 'Hey Sri' followed by your command",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");
    const command = parseVoiceCommand(fullTranscript);
    setLastCommand(command);

    console.log("Processing command:", command);

    try {
      const result = await executeVoiceCommand(command);
      
      console.log("Command result:", result);
      
      if (result.success) {
        setStatus("success");
        setCommandResult(result.message);
        toast({
          title: "✅ Command Executed",
          description: result.message,
        });
      } else {
        setStatus("error");
        setCommandResult(result.message);
        toast({
          title: "Command Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Command error:", err);
      setStatus("error");
      setCommandResult("An error occurred");
      toast({
        title: "Error",
        description: "Failed to execute command",
        variant: "destructive",
      });
    }

    // Reset after delay
    setTimeout(() => {
      setStatus("idle");
      setWakeWordDetected(false);
      resetTranscript();
      setCommandResult("");
    }, 3000);
  }, [status, toast, resetTranscript]);

  // Process transcript for wake word and commands - auto execute
  useEffect(() => {
    const fullTranscript = (transcript + " " + interimTranscript).trim();
    
    if (!fullTranscript) return;

    console.log("Heard:", fullTranscript);

    // Check for wake word
    if (containsWakeWord(fullTranscript)) {
      if (!wakeWordDetected) {
        setWakeWordDetected(true);
        toast({
          title: "🎤 Wake Word Detected!",
          description: "Listening for your command...",
        });
      }
      
      // Check if we have a complete command (wake word + action)
      const lowerTranscript = fullTranscript.toLowerCase();
      const hasLockCommand = lowerTranscript.includes("lock") && 
        (lowerTranscript.includes("phone") || lowerTranscript.includes("device") || lowerTranscript.includes("screen"));
      const hasCallCommand = lowerTranscript.includes("call ");
      const hasMessageCommand = lowerTranscript.includes("message") || lowerTranscript.includes("send");
      const hasOpenCommand = lowerTranscript.includes("open ");
      
      // Auto-execute if we detect a complete command
      if ((hasLockCommand || hasCallCommand || hasMessageCommand || hasOpenCommand) && status !== "processing") {
        console.log("Auto-executing command:", fullTranscript);
        stopListening();
        processCommandFromTranscript(fullTranscript);
      }
    }
  }, [transcript, interimTranscript, wakeWordDetected, toast, status, stopListening, processCommandFromTranscript]);

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
      // Process the command when stopping manually
      if (transcript) {
        processCommandFromTranscript(transcript);
      }
    } else {
      setStatus("listening");
      setWakeWordDetected(false);
      setCommandResult("");
      startListening();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const getStatusIcon = () => {
    switch (status) {
      case "processing":
        return <Loader2 className="w-6 h-6 animate-spin" />;
      case "success":
        return <CheckCircle className="w-6 h-6 text-success" />;
      case "error":
        return <XCircle className="w-6 h-6 text-destructive" />;
      default:
        return isListening ? (
          <Volume2 className="w-6 h-6 animate-pulse" />
        ) : (
          <Mic className="w-6 h-6" />
        );
    }
  };

  return (
    <div className="min-h-screen p-4 pb-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between py-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Voice Assistant</h1>
              <p className="text-xs text-muted-foreground">Secure & Smart</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </motion.header>

        {/* Voice Control Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center py-8"
        >
          {/* Large Mic Button */}
          <motion.button
            onClick={handleMicToggle}
            disabled={!isSupported || status === "processing"}
            className={`
              relative w-32 h-32 mx-auto rounded-full flex items-center justify-center
              transition-all duration-300 focus:outline-none mb-6
              ${isListening 
                ? "bg-primary shadow-[0_0_60px_rgba(var(--primary),0.5)]" 
                : "bg-gradient-to-br from-primary to-accent"
              }
              ${status === "success" ? "bg-success" : ""}
              ${status === "error" ? "bg-destructive" : ""}
              disabled:opacity-50
            `}
            whileTap={{ scale: 0.95 }}
          >
            {/* Ripple effect when listening */}
            <AnimatePresence>
              {isListening && (
                <>
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-primary"
                  />
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    className="absolute inset-0 rounded-full bg-primary"
                  />
                </>
              )}
            </AnimatePresence>
            
            <div className="relative z-10 text-primary-foreground">
              {isListening ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
            </div>
          </motion.button>
          
          <h2 className="text-2xl font-bold mb-2">
            {isListening ? (
              <span className="text-primary">Listening...</span>
            ) : (
              "Tap to Start Voice Control"
            )}
          </h2>
          
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            {isListening 
              ? 'Say "Hey Sri" followed by your command' 
              : 'Tap the microphone and say "Hey Sri, lock my phone"'
            }
          </p>

          {/* Wake Word Indicator */}
          <AnimatePresence>
            {wakeWordDetected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 border border-success/30 mb-4"
              >
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-success text-sm font-medium">
                  "Hey Sri" detected!
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcript Display */}
          {(transcript || interimTranscript) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 max-w-md mx-auto mb-4"
            >
              <p className="text-sm text-muted-foreground mb-1">You said:</p>
              <p className="text-foreground font-medium">
                {transcript}
                {interimTranscript && (
                  <span className="text-muted-foreground"> {interimTranscript}</span>
                )}
              </p>
            </motion.div>
          )}

          {/* Command Result */}
          <AnimatePresence>
            {commandResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                  status === "success" 
                    ? "bg-success/20 border border-success/30" 
                    : "bg-destructive/20 border border-destructive/30"
                }`}
              >
                {status === "success" ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
                <span className={status === "success" ? "text-success" : "text-destructive"}>
                  {commandResult}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice Error Display */}
          {voiceError && (
            <p className="mt-2 text-sm text-destructive">
              Error: {voiceError}
            </p>
          )}

          {/* Not Supported Warning */}
          {!isSupported && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 rounded-lg bg-warning/20 border border-warning/30 max-w-md mx-auto"
            >
              <p className="text-sm text-warning text-center">
                Voice recognition is not supported in this browser. Please use Chrome on Android.
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center gap-4 mt-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 border border-success/30">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm text-success">Voice Registered</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary">Secured</span>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* Current Features */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full" />
            <h3 className="text-xl font-bold">Current Features</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="glass-card p-6 permission-card group cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Voice Command Examples */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-4">Try These Commands</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                '"Hey Sri, lock my phone"',
                '"Hey Sri, call Mom"',
                '"Hey Sri, send message to John"',
                '"Hey Sri, open Camera"',
              ].map((command, index) => (
                <motion.div
                  key={command}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50"
                >
                  <Mic className="w-4 h-4 text-primary" />
                  <code className="text-sm font-mono text-foreground">{command}</code>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Future Features */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-accent to-warning rounded-full" />
            <h3 className="text-xl font-bold">Coming Soon</h3>
            <span className="px-2 py-1 text-xs rounded-full bg-warning/20 text-warning border border-warning/30">
              Future
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {futureFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="glass-card p-6 opacity-80"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Project Info */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card p-6 text-center"
        >
          <h3 className="text-lg font-bold mb-2">Voice-Controlled Secure Android Assistant</h3>
          <p className="text-sm text-muted-foreground mb-4">
            A Final Year Project demonstrating secure voice authentication and device control
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>React + TypeScript</span>
            <span>•</span>
            <span>Web Audio API</span>
            <span>•</span>
            <span>OAuth 2.0</span>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default About;
