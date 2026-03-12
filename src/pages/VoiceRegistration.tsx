import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Capacitor, registerPlugin } from "@capacitor/core";

// Register the WakeWord plugin
const WakeWord = registerPlugin("WakeWord", {
  web: () => import("./wakeWordWeb").then(m => new m.WakeWordWeb()),
});

type RecordingState = "idle" | "recording" | "processing" | "complete";

interface VoiceRegistrationProps {
  onRegistrationComplete?: () => void;
}

const VoiceRegistration = ({ onRegistrationComplete }: VoiceRegistrationProps) => {
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
      recognition.continuous = false;

      setRecordingState("recording");

      console.log("[REGISTRATION] Recording started...");

      recognition.onresult = (event: any) => {
        try {
          console.log("[REGISTRATION] onresult fired, isFinal:", event.results[event.results.length - 1].isFinal);
          // ONLY process final results
          if (!event.results[event.results.length - 1].isFinal) {
            console.log("[REGISTRATION] Interim result, skipping...");
            return;
          }

          const text = event.results[0][0].transcript
            .toLowerCase()
            .trim();

          console.log("[REGISTRATION] Heard:", text);

          const isBuddy = text.includes("buddy");
          console.log("[REGISTRATION] Contains 'buddy'?:", isBuddy);

          if (isBuddy) {
            console.log("\n\n✅✅✅ HOTWORD MATCHED - Starting native plugin ✅✅✅");
            recognition.stop();
            setRecordingState("processing");

            setTimeout(() => {
              toast({
                title: "Voice Registered",
                description: 'Wake word detected successfully.',
              });
              setRecordingState("complete");
              localStorage.setItem("appReady", "true");
              console.log("[REGISTRATION] Calling native plugin start...");
              startNativeWakeWordListener();
              onRegistrationComplete?.();
            }, 800);
          } else {
            recognition.stop();
            toast({
              variant: "destructive",
              title: "Try again",
              description: 'Please say "Hey Buddy" clearly',
            });
            setRecordingState("idle");
          }
        } catch (error) {
          console.error("[REGISTRATION] ERROR IN CALLBACK:", error);
          console.error("[REGISTRATION] Stack:", (error as any)?.stack);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("[REGISTRATION] Recognition error:", event.error);
        setRecordingState("idle");
      };

      recognition.start();
    } catch (err) {
      console.error("[REGISTRATION] Error:", err);
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: "Speech recognition failed.",
      });
      setRecordingState("idle");
    }
  };

  const handleNavigate = () => {
    console.log("[REGISTRATION] Navigating to /about");
    navigate("/about");
  };

  const startNativeWakeWordListener = async () => {
    console.log("\n\n🔥🔥🔥 [NATIVE] startNativeWakeWordListener() CALLED 🔥🔥🔥\n");
    
    try {
      console.log("[NATIVE] Step 1: Checking if native platform");
      if (!Capacitor.isNativePlatform()) {
        console.log("[NATIVE] ❌ Not native platform");
        return;
      }

      console.log("[NATIVE] ✓ Is native platform");
      console.log("[NATIVE] Step 2: Getting WakeWord plugin");

      console.log("[NATIVE] WakeWord:", WakeWord ? "FOUND" : "NOT FOUND");

      if (!WakeWord) {
        console.error("[NATIVE] ❌ WakeWord plugin is undefined!");
        return;
      }

      console.log("[NATIVE] ✓ WakeWord found");
      console.log("[NATIVE] Step 3: Calling WakeWord.startListening()");

      const result = await (WakeWord as any).startListening?.();
      console.log("[NATIVE] ✓✓✓ startListening() returned:", result);
      console.log("[NATIVE] 🎤 Native plugin STARTED and LISTENING");
    } catch (error) {
      console.error("[NATIVE] ❌ EXCEPTION:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">Voice Registration</h1>

        <p className="text-muted-foreground mb-6">
          You are the owner of this device. Say{" "}
          <span className="font-semibold text-primary">“Hey Buddy”</span>
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
          <Button onClick={handleNavigate} className="w-full">
            Continue <ChevronRight className="ml-2" />
          </Button>
        )}

        {recordingState === "recording" && (
          <p className="text-sm text-primary font-medium">
            Listening... Say "Hey Buddy"
          </p>
        )}
      </div>
    </div>
  );
};

export default VoiceRegistration;