import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Mic, 
  MicOff, 
  Shield, 
  Lock,
  Volume2,
  ArrowLeft,
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

type CommandStatus = "idle" | "listening" | "processing" | "success" | "error";

const VoiceCommand = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  // Process transcript for wake word and commands
  useEffect(() => {
    const fullTranscript = (transcript + " " + interimTranscript).trim();
    
    if (!fullTranscript) return;

    // Check for wake word
    if (containsWakeWord(fullTranscript) && !wakeWordDetected) {
      setWakeWordDetected(true);
      toast({
        title: "🎤 Wake Word Detected!",
        description: "Listening for your command...",
      });
    }
  }, [transcript, interimTranscript, wakeWordDetected, toast]);

  // Execute command when we have a complete phrase with wake word
  const processCommand = useCallback(async () => {
    if (!transcript || status === "processing") return;

    const fullTranscript = transcript.trim();
    
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

    try {
      const result = await executeVoiceCommand(command);
      
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
    }, 3000);
  }, [transcript, status, toast, resetTranscript]);

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
      // Process the command when stopping
      if (transcript) {
        processCommand();
      }
    } else {
      setStatus("listening");
      setWakeWordDetected(false);
      startListening();
    }
  };

  const handleReset = () => {
    stopListening();
    resetTranscript();
    setStatus("idle");
    setWakeWordDetected(false);
    setLastCommand(null);
    setCommandResult("");
  };

  const getStatusIcon = () => {
    switch (status) {
      case "processing":
        return <Loader2 className="w-8 h-8 animate-spin" />;
      case "success":
        return <CheckCircle className="w-8 h-8 text-success" />;
      case "error":
        return <XCircle className="w-8 h-8 text-destructive" />;
      default:
        return isListening ? (
          <Volume2 className="w-8 h-8 animate-pulse" />
        ) : (
          <Mic className="w-8 h-8" />
        );
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "listening":
        return wakeWordDetected ? "Command detected! Listening..." : "Listening for 'Hey Sri'...";
      case "processing":
        return "Processing command...";
      case "success":
        return "Command executed!";
      case "error":
        return "Command failed";
      default:
        return "Tap to start listening";
    }
  };

  return (
    <div className="min-h-screen p-4 pb-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between py-6"
        >
          <Button variant="ghost" size="sm" onClick={() => navigate("/about")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">Voice Control</span>
          </div>
        </motion.header>

        {/* Main Voice Control Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12"
        >
          {/* Voice Button */}
          <motion.button
            onClick={handleMicToggle}
            disabled={!isSupported || status === "processing"}
            className={`
              relative w-40 h-40 rounded-full flex items-center justify-center
              transition-all duration-300 focus:outline-none
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
              {getStatusIcon()}
            </div>
          </motion.button>

          {/* Status Text */}
          <motion.p
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-lg font-medium text-center"
          >
            {getStatusText()}
          </motion.p>

          {/* Wake Word Indicator */}
          <AnimatePresence>
            {wakeWordDetected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mt-4 px-4 py-2 rounded-full bg-success/20 border border-success/30"
              >
                <span className="text-success text-sm font-medium">
                  ✓ "Hey Sri" detected
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Transcript Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-muted-foreground">TRANSCRIPT</h3>
            {(transcript || interimTranscript) && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Clear
              </Button>
            )}
          </div>
          
          <div className="min-h-[80px] p-4 rounded-lg bg-secondary/50 border border-border/50">
            {transcript || interimTranscript ? (
              <p className="text-foreground">
                {transcript}
                {interimTranscript && (
                  <span className="text-muted-foreground"> {interimTranscript}</span>
                )}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Your voice command will appear here...
              </p>
            )}
          </div>

          {/* Error Display */}
          {voiceError && (
            <p className="mt-2 text-sm text-destructive">
              Error: {voiceError}
            </p>
          )}
        </motion.div>

        {/* Command Result */}
        <AnimatePresence>
          {commandResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`glass-card p-4 mb-6 border ${
                status === "success" ? "border-success/50" : "border-destructive/50"
              }`}
            >
              <div className="flex items-center gap-3">
                {status === "success" ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <p className="text-sm">{commandResult}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Commands */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h3 className="font-semibold mb-4">Available Commands</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
              <Lock className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-sm">"Hey Sri, lock my phone"</p>
                <p className="text-xs text-muted-foreground">Locks the device immediately</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              More commands coming soon!
            </p>
          </div>
        </motion.div>

        {/* Not Supported Warning */}
        {!isSupported && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 rounded-lg bg-warning/20 border border-warning/30"
          >
            <p className="text-sm text-warning text-center">
              Voice recognition is not supported in this browser. Please use Chrome on Android.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VoiceCommand;
