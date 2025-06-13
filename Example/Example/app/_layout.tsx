// _layout.tsx
import { Stack } from "expo-router";
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Import navigation types

// Define the navigation type inline here
type RootStackParamList = {
  index: undefined;       // Splash Screen, no params
  login: undefined;       // Login Screen, no params
  signup: undefined;      // Signup Screen, no params
  dashboard: undefined;   // Dashboard Screen, no params
};

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide headers globally
        animation: "slide_from_right", // Smooth transition
        gestureEnabled: true, // Enable swipe gestures
        animationDuration: 250, // Smooth animation duration
      }}
    >
      {/* Splash Screen */}
      <Stack.Screen
        name="index" // Corresponds to the 'index' screen in the param list
        options={{ headerShown: false }} // Hide header only for the splash screen
      />
      

      {/* Authentication Screens */}
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />

      {/* Main Dashboard */}
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}
