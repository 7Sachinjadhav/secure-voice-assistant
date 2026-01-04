import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.voiceassistant',
  appName: 'Voice Assistant',
  webDir: 'dist',
  server: {
    url: 'https://4a5c7a33-aad7-49e1-a67d-664b7bba8f37.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
