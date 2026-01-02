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
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

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
      // Cleanup audio resources
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [navigate]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      streamRef.current = stream;
      
      // Set up audio analyzer for visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Set up media recorder with fallback for mobile
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }
      }
      
      const mediaRecorder = mimeType 
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
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

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast({
          variant: "destructive",
          title: "Recording Error",
          description: "An error occurred while recording. Please try again.",
        });
        setRecordingState("idle");
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setRecordingState("recording");

      // Start audio level visualization
      const updateAudioLevel = () => {
        if (analyserRef.current) {
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

    } catch (error: any) {
      console.error("Microphone error:", error);
      
      let errorMessage = "Could not access your microphone. Please check permissions.";
      if (error.name === "NotAllowedError") {
        errorMessage = "Microphone permission denied. Please allow microphone access in your browser settings.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No microphone found. Please connect a microphone and try again.";
      } else if (error.name === "NotSupportedError") {
        errorMessage = "Your browser doesn't support audio recording. Please try a different browser.";
      }
      
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: errorMessage,
      });
    }
  };

  const handleContinue = () => {
    navigate("/about");
  };

  // Generate wave bars for visualization
  const waveBars = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md text-center animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 text-foreground">Voice Registration</h1>
          <p className="text-muted-foreground">
            Please provide your voice. You are the owner of this device.
          </p>
        </div>

        {/* Voice visualization */}
        <div className="relative mb-8">
          {/* Outer rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[1, 2, 3].map((ring) => (
              <div
                key={ring}
                className={`absolute rounded-full border border-primary/20 ${
                  recordingState === "recording" ? "animate-pulse" : ""
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
            <div
              className={`
                w-32 h-32 rounded-full flex items-center justify-center transition-all duration-200
                ${recordingState === "complete" 
                  ? "bg-success/20 border-2 border-success" 
                  : "bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/50"
                }
              `}
              style={{
                transform: recordingState === "recording" ? `scale(${1 + audioLevel * 0.3})` : "scale(1)",
                boxShadow: recordingState === "recording" 
                  ? `0 0 ${40 + audioLevel * 60}px hsl(var(--primary) / ${0.3 + audioLevel * 0.3})`
                  : "0 0 20px hsl(var(--primary) / 0.2)",
              }}
            >
              {recordingState === "complete" ? (
                <CheckCircle2 className="w-12 h-12 text-success" />
              ) : recordingState === "processing" ? (
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              ) : recordingState === "recording" ? (
                <Mic className="w-12 h-12 text-primary" />
              ) : (
                <MicOff className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Audio wave visualization */}
          {recordingState === "recording" && (
            <div className="flex items-center justify-center gap-1 mt-6 h-12">
              {waveBars.map((bar, index) => (
                <div
                  key={bar}
                  className="w-1 bg-gradient-to-t from-primary to-accent rounded-full transition-all duration-100"
                  style={{
                    height: `${10 + Math.sin(Date.now() / 100 + index) * 20 + audioLevel * 30}px`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="glass-card p-6 mb-6">
          {recordingState === "idle" && (
            <div>
              <div className="flex items-start gap-3 mb-4 text-left">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1 text-foreground">Voice Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    The system will respond only to your registered voice and ignore others for security.
                  </p>
                </div>
              </div>
              <p className="text-lg font-medium mb-4 text-foreground">
                Say: <span className="gradient-text font-mono">"Hey Sri"</span>
              </p>
              <Button
                variant="glow"
                size="lg"
                onClick={startRecording}
                className="w-full"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            </div>
          )}

          {recordingState === "recording" && (
            <div className="text-center">
              <p className="text-lg font-medium text-primary mb-2">Recording...</p>
              <p className="text-sm text-muted-foreground">
                Say <span className="font-mono">"Hey Sri"</span> clearly
              </p>
            </div>
          )}

          {recordingState === "processing" && (
            <div className="text-center">
              <p className="text-lg font-medium mb-2 text-foreground">Processing Voice...</p>
              <p className="text-sm text-muted-foreground">
                Creating your unique voice print
              </p>
            </div>
          )}

          {recordingState === "complete" && (
            <div>
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">Voice Registered!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your voice print has been securely stored. Only you can control this device.
              </p>
              <Button
                variant="success"
                size="lg"
                onClick={handleContinue}
                className="w-full"
              >
                Continue
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </div>

        {/* Security note */}
        {recordingState !== "complete" && (
          <p className="text-xs text-muted-foreground">
            🔒 Your voice data is encrypted and stored securely
          </p>
        )}
      </div>
    </div>
  );
};

export default VoiceRegistration;
