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
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/");
    };
    checkAuth();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [navigate]);

  const startRecording = async () => {
  try {
    // 1️⃣ Mic access
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    streamRef.current = stream;

    // 2️⃣ Audio context (for animation)
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    setRecordingState("recording");

    // 🔊 Animation loop
    const updateAudioLevel = () => {
      if (!analyserRef.current) return;
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setAudioLevel(avg / 255);
      animationRef.current = requestAnimationFrame(updateAudioLevel);
    };
    updateAudioLevel();

    // 3️⃣ Speech Recognition (KEY PART)
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error("Speech recognition not supported");
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const text = event.results[event.results.length - 1][0]
        .transcript
        .toLowerCase()
        .trim();

      console.log("Heard:", text);

      // ✅ ONLY stop on "hey sri"
      if (text === "hey sri") {
        recognition.stop();
        stream.getTracks().forEach(t => t.stop());
        cancelAnimationFrame(animationRef.current!);

        setRecordingState("processing");

        setTimeout(() => {
          toast({
            title: "Voice Registered",
            description: 'Wake word "Hey Sri" detected successfully.',
          });
          setRecordingState("complete");
        }, 1200);
      }
    };

    recognition.start();
  } catch (error) {
    console.error(error);
    toast({
      variant: "destructive",
      title: "Microphone Error",
      description: "Unable to access microphone or speech recognition.",
    });
    setRecordingState("idle");
  }
};


      mediaRecorder.start();
      setRecordingState("recording");

      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b) / data.length;
        setAudioLevel(avg / 255);
        animationRef.current = requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();

      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 3000);

    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: "Microphone permission denied. Please allow it in settings.",
      });
      setRecordingState("idle");
    }
  };

  const handleContinue = () => navigate("/about");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">Voice Registration</h1>
        <p className="text-muted-foreground mb-6">
          Please provide your voice. You are the owner of this device.
        </p>

        {recordingState === "idle" && (
          <Button onClick={startRecording} className="w-full">
            <Mic className="mr-2" /> Start Recording
          </Button>
        )}

        {recordingState === "complete" && (
          <Button onClick={handleContinue} className="w-full">
            Continue <ChevronRight className="ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default VoiceRegistration;
