export default {
  expo: {
    name: "pulseguard",
    slug: "pulseguard",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSMotionUsageDescription: "PulseGuard needs access to motion data to track your daily steps for health monitoring."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    scheme: "pulseguard",
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow PulseGuard to use your location for emergency assistance."
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#ffffff"
        }
      ],
      "expo-secure-store"
    ],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      openRouterApiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
    },
  },
};
