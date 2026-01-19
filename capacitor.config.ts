import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.voiceassistant',
  appName: 'Voice Assistant',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    WakeWord: {
      // Custom plugin registration
    }
  }
};

export default config;
