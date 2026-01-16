import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Lock, 
  Phone, 
  MessageSquare, 
  AppWindow, 
  Camera,
  Shield,
  Mic,
  Wifi,
  Cpu,
  Sparkles,
  ChevronRight,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const About = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
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

        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center py-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent mb-6 shadow-lg animate-pulse-glow"
          >
            <Mic className="w-12 h-12 text-primary-foreground" />
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">Voice-Controlled</span>
            <br />
            Secure Android Assistant
          </h2>
          
          <p className="text-muted-foreground max-w-md mx-auto">
            Your personal AI assistant that responds only to your voice, keeping your device secure and hands-free.
          </p>

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
            
            <Button 
              onClick={() => navigate("/voice-command")}
              size="lg"
              className="mt-4 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Voice Control
            </Button>
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
