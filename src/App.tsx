import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Permissions from "./pages/Permissions";
import VoiceRegistration from "./pages/VoiceRegistration";
import About from "./pages/About";
import VoiceCommand from "./pages/VoiceCommand";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/voice-registration" element={<VoiceRegistration />} />
          <Route path="/about" element={<About />} />
          <Route path="/voice-command" element={<VoiceCommand />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
