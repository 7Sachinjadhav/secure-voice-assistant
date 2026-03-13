import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Capacitor, registerPlugin } from "@capacitor/core";

import Login from "./pages/Login";
import Permissions from "./pages/Permissions";
import VoiceRegistration from "./pages/VoiceRegistration";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

import { lockDevice } from "@/lib/device-admin";

const queryClient = new QueryClient();

// Register the WakeWord plugin globally
const WakeWord = registerPlugin("WakeWord", {
  web: () => import("./pages/wakeWordWeb").then(m => new m.WakeWordWeb()),
});

const AppContent = () => {
  const [isNativeListening, setIsNativeListening] = useState(false);

  // Setup listener for native plugin events
  useEffect(() => {
    const setupNativeListener = async () => {
      try {
        if (!Capacitor.isNativePlatform()) {
          console.log("[APP] Not on native platform, skipping listener setup");
          return;
        }

        console.log("[APP] Setting up native WakeWord listener...");
        
        // Listen for command detection events from native plugin
        const listener = await (WakeWord as any).addListener?.("commandDetected", async (data: any) => {
          console.log("[APP] 🔔 commandDetected event received:", data);

          const command = data?.command || "";
          console.log("[APP] Command extracted: '" + command + "'");

          if (command.toLowerCase().includes("lock")) {
            console.log("[APP] 🔒 LOCK command detected - executing lockDevice()");
            try {
              const success = await lockDevice();
              console.log("[APP] Lock executed, success:", success);
            } catch (err) {
              console.error("[APP] Error locking device:", err);
            }
          }
        });

        if (listener) {
          console.log("[APP] ✓ Native listener registered successfully");
          setIsNativeListening(true);
        } else {
          console.error("[APP] ❌ Failed to register listener");
        }

        return () => {
          listener?.remove?.();
        };
      } catch (error) {
        console.error("[APP] Exception setting up listener:", error);
      }
    };

    setupNativeListener();
  }, []);

  // Check if app is ready (registration complete) and start native listening
  useEffect(() => {
    const startNativeListening = async () => {
      const isReady = localStorage.getItem("appReady") === "true";
      console.log("[APP] App ready:", isReady);

      if (!isReady) {
        console.log("[APP] App not ready yet, skipping native listening start");
        return;
      }

      if (!Capacitor.isNativePlatform()) {
        console.log("[APP] Not on native platform, skipping native listening start");
        return;
      }

      try {
        console.log("[APP] Starting native WakeWord listening...");
        await (WakeWord as any).startListening?.();
        console.log("[APP] ✓ Native listening started successfully");
      } catch (error) {
        console.error("[APP] ❌ Failed to start native listening:", error);
      }
    };

    startNativeListening();
    window.addEventListener("storage", startNativeListening);

    return () => {
      window.removeEventListener("storage", startNativeListening);
    };
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />

      {/* Native listening indicator */}
      {isNativeListening && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-700 animate-pulse">
            🎤 Native Listening Active...
          </div>
        </div>
      )}

      <HashRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/voice-registration" element={<VoiceRegistration />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
