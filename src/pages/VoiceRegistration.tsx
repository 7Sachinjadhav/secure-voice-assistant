import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type RecordingState = "idle" | "recording" | "processing" | "complete";

const VoiceRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
      }
    };
    checkAuth();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [navigate]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analyzer for visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        setRecordingState("processing");
        
        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // In a real app, you would send the audio to your backend for processing
        toast({
          title: "Voice Registered",
          description: "Your voice print has been securely stored.",
        });
        
        setRecordingState("complete");
      };

      mediaRecorder.start();
      setRecordingState("recording");

      // Start audio level visualization
      const updateAudioLevel = () => {
        if (analyserRef.current && recordingState === "recording") {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();

      // Auto-stop after 3 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 3000);

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: "Could not access your microphone. Please check permissions.",
      });
    }
  };

  const handleContinue = () => {
    navigate("/about");
  };

  // Generate wave bars for visualization
  const waveBars = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md text-center"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold mb-2">Voice Registration</h1>
          <p className="text-muted-foreground">
            Please provide your voice. You are the owner of this device.
          </p>
        </motion.div>

        {/* Voice visualization */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative mb-8"
        >
          {/* Outer rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                className={`absolute rounded-full border border-primary/20 ${
                  recordingState === "recording" ? "pulse-ring" : ""
                }`}
                style={{
                  width: `${150 + ring * 50}px`,
                  height: `${150 + ring * 50}px`,
                  animationDelay: `${ring * 0.2}s`,
                }}
              />
            ))}
          </div>

          {/* Main circle with microphone */}
          <div className="relative mx-auto w-40 h-40 flex items-center justify-center">
            <motion.div
              animate={{
                scale: recordingState === "recording" ? 1 + audioLevel * 0.3 : 1,
                boxShadow: recordingState === "recording" 
                  ? `0 0 ${40 + audioLevel * 60}px hsl(186, 100%, 50%, ${0.3 + audioLevel * 0.3})`
                  : "0 0 20px hsl(186, 100%, 50%, 0.2)",
              }}
              className={`
                w-32 h-32 rounded-full flex items-center justify-center
                ${recordingState === "complete" 
                  ? "bg-success/20 border-2 border-success" 
                  : "bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/50"
                }
              `}
            >
              <AnimatePresence mode="wait">
                {recordingState === "complete" ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <CheckCircle2 className="w-12 h-12 text-success" />
                  </motion.div>
                ) : recordingState === "processing" ? (
                  <motion.div
                    key="processing"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full"
                  />
                ) : (
                  <motion.div key="mic">
                    {recordingState === "recording" ? (
                      <Mic className="w-12 h-12 text-primary" />
                    ) : (
                      <MicOff className="w-12 h-12 text-muted-foreground" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Audio wave visualization */}
          {recordingState === "recording" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-1 mt-6 h-12"
            >
              {waveBars.map((bar, index) => (
                <motion.div
                  key={bar}
                  className="w-1 bg-gradient-to-t from-primary to-accent rounded-full"
                  animate={{
                    height: `${10 + Math.sin(Date.now() / 100 + index) * 20 + audioLevel * 30}px`,
                  }}
                  transition={{ duration: 0.1 }}
                />
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 mb-6"
        >
          <AnimatePresence mode="wait">
            {recordingState === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-start gap-3 mb-4 text-left">
                  <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Voice Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      The system will respond only to your registered voice and ignore others for security.
                    </p>
                  </div>
                </div>
                <p className="text-lg font-medium mb-4">
                  Say: <span className="gradient-text font-mono">"Hey Sri"</span>
                </p>
                <Button
                  variant="glow"
                  size="xl"
                  onClick={startRecording}
                  className="w-full"
                >
                  <Mic className="w-5 h-5" />
                  Start Recording
                </Button>
              </motion.div>
            )}

            {recordingState === "recording" && (
              <motion.div
                key="recording"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <p className="text-lg font-medium text-primary mb-2">Recording...</p>
                <p className="text-sm text-muted-foreground">
                  Say <span className="font-mono">"Hey Sri"</span> clearly
                </p>
              </motion.div>
            )}

            {recordingState === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <p className="text-lg font-medium mb-2">Processing Voice...</p>
                <p className="text-sm text-muted-foreground">
                  Creating your unique voice print
                </p>
              </motion.div>
            )}

            {recordingState === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Voice Registered!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your voice print has been securely stored. Only you can control this device.
                </p>
                <Button
                  variant="success"
                  size="xl"
                  onClick={handleContinue}
                  className="w-full"
                >
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Security note */}
        {recordingState !== "complete" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-muted-foreground"
          >
            🔒 Your voice data is encrypted and stored securely
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default VoiceRegistration;
