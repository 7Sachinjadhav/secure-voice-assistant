import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type RecordingState = "idle" | "recording" | "processing" | "complete";

const VoiceRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recordingState, setRecordingState] =
    useState<RecordingState>("idle");

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate("/");
    });

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [navigate]);

  const startRecording = () => {
    try {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;

      if (!SpeechRecognition) {
        throw new Error("SpeechRecognition not supported");
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.continuous = false; // ✅ SAME AS YESTERDAY

      setRecordingState("recording");

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript
          .toLowerCase()
          .trim();

        console.log("Heard:", text);

        if (text.includes("hey sri")) {
          recognition.stop();
          setRecordingState("processing");

          setTimeout(() => {
            toast({
              title: "Voice Registered",
              description: 'Wake word "Hey Sri" detected successfully.',
            });
            setRecordingState("complete");
          }, 800);
        } else {
          recognition.stop();
          toast({
            variant: "destructive",
            title: "Try again",
            description: 'Please say "Hey Sri" clearly',
          });
          setRecordingState("idle");
        }
      };

      recognition.onerror = () => {
        setRecordingState("idle");
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: "Speech recognition failed.",
      });
      setRecordingState("idle");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">Voice Registration</h1>

        <p className="text-muted-foreground mb-6">
          You are the owner of this device. Say{" "}
          <span className="font-semibold text-primary">“Hey Sri”</span>
        </p>

        <div className="flex justify-center mb-6">
          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center
              ${recordingState === "recording"
                ? "bg-primary/20 animate-pulse"
                : "bg-muted"}
            `}
          >
            {recordingState === "complete" ? (
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            ) : (
              <Mic className="w-12 h-12 text-primary" />
            )}
          </div>
        </div>

        {recordingState === "idle" && (
          <Button onClick={startRecording} className="w-full">
            <Mic className="mr-2" /> Start Recording
          </Button>
        )}

        {recordingState === "processing" && (
          <p className="text-sm text-muted-foreground">
            Processing voice…
          </p>
        )}

        {recordingState === "complete" && (
          <Button onClick={() => navigate("/about")} className="w-full">
            Continue <ChevronRight className="ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default VoiceRegistration;
