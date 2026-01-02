import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Mic, 
  Phone, 
  MessageSquare, 
  Users, 
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Permission {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  purpose: string;
  granted: boolean;
}

const initialPermissions: Permission[] = [
  {
    id: "microphone",
    name: "Microphone",
    icon: Mic,
    description: "Access to your device microphone",
    purpose: "Required to listen to voice commands and recognize your voice",
    granted: false,
  },
  {
    id: "phone",
    name: "Phone Call",
    icon: Phone,
    description: "Make and manage phone calls",
    purpose: "Required to make calls using voice commands",
    granted: false,
  },
  {
    id: "sms",
    name: "SMS",
    icon: MessageSquare,
    description: "Send and read text messages",
    purpose: "Required to send messages using voice commands",
    granted: false,
  },
  {
    id: "contacts",
    name: "Contacts",
    icon: Users,
    description: "Access your contact list",
    purpose: "Required to identify contact names when making calls or sending messages",
    granted: false,
  },
  {
    id: "admin",
    name: "Device Admin",
    icon: ShieldCheck,
    description: "Device administrator access",
    purpose: "Required to lock the phone using voice commands",
    granted: false,
  },
];

const Permissions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGranting, setIsGranting] = useState(false);

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

  const currentPermission = permissions[currentIndex];
  const allGranted = permissions.every(p => p.granted);
  const grantedCount = permissions.filter(p => p.granted).length;

  const handleGrantPermission = async () => {
    setIsGranting(true);
    
    // Simulate permission request (in a real Android app, this would call native APIs)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setPermissions(prev => 
      prev.map((p, i) => 
        i === currentIndex ? { ...p, granted: true } : p
      )
    );

    toast({
      title: "Permission Granted",
      description: `${currentPermission.name} access has been enabled.`,
    });

    setIsGranting(false);

    // Move to next permission or finish
    if (currentIndex < permissions.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 500);
    }
  };

  const handleContinue = () => {
    navigate("/voice-registration");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4 shadow-lg"
          >
            <ShieldCheck className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2">Required Permissions</h1>
          <p className="text-muted-foreground">
            Grant permissions to enable voice control features
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{grantedCount} of {permissions.length}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${(grantedCount / permissions.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Permission cards */}
        <div className="space-y-3 mb-6">
          {permissions.map((permission, index) => {
            const Icon = permission.icon;
            const isActive = index === currentIndex && !allGranted;
            const isPast = permission.granted;
            const isFuture = index > currentIndex && !permission.granted;

            return (
              <motion.div
                key={permission.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  permission-card glass-card p-4 flex items-center gap-4
                  ${isActive ? 'border-primary/50 glow-border' : ''}
                  ${isFuture ? 'opacity-50' : ''}
                `}
              >
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-xl
                  ${isPast ? 'bg-success/20' : isActive ? 'bg-primary/20' : 'bg-secondary'}
                `}>
                  {isPast ? (
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  ) : (
                    <Icon className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-medium">{permission.name}</h3>
                  <p className="text-sm text-muted-foreground">{permission.description}</p>
                </div>

                {isPast && (
                  <span className="text-xs text-success font-medium">Granted</span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Current permission detail */}
        <AnimatePresence mode="wait">
          {!allGranted && currentPermission && (
            <motion.div
              key={currentPermission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-6 mb-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Why we need this</h3>
                  <p className="text-sm text-muted-foreground">{currentPermission.purpose}</p>
                </div>
              </div>

              <Button
                variant="permission"
                size="lg"
                className="w-full"
                onClick={handleGrantPermission}
                disabled={isGranting}
              >
                {isGranting ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                    />
                    Requesting...
                  </span>
                ) : (
                  <>
                    Grant {currentPermission.name} Access
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue button */}
        {allGranted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="glass-card p-6 mb-6">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Permissions Granted!</h3>
              <p className="text-sm text-muted-foreground">
                Your device is ready for voice control setup.
              </p>
            </div>

            <Button
              variant="glow"
              size="xl"
              onClick={handleContinue}
              className="w-full"
            >
              Continue to Voice Registration
              <ChevronRight className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Permissions;
