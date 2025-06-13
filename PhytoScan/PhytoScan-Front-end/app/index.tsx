import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { useFonts } from "expo-font";
import LottieView from "lottie-react-native";

export default function Index() {
  const route = useRouter();
  const onContinue = () => {
    route.navigate("/login");
  };

  const fadeAnim = useState(new Animated.Value(0))[0];
  const buttonScale = useState(new Animated.Value(1))[0];
  const [showSubtitle, setShowSubtitle] = useState(false);

  const [fontsLoaded] = useFonts({
    "Poppins-Bold": require("../assets/fonts/sam.ttf"),
    "Poppins-Regular": require("../assets/fonts/sam2.ttf"),
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => setShowSubtitle(true));
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/images/intro-background.jpg")} // replace with your image path
      resizeMode="cover"
      style={styles.container}
    >
      {/* Dark overlay */}
      <View style={styles.overlay} />

      {/* Header section */}
      <View style={styles.headerContainer}>
        <Text style={styles.welcome}>Welcome to</Text>
        <Text style={styles.appName}>PhytoScan</Text>
      </View>

      {/* Lottie Animation */}
      <LottieView
        source={require("../assets/animations/plant.json")}
        autoPlay
        loop
        style={styles.lottieTop}
      />

      {/* Subtitle */}
      {showSubtitle ? (
        <Text style={styles.subtitle}>Scan, Detect, Protect!</Text>
      ) : (
        <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
          Scan, Detect, Protect!
        </Animated.Text>
      )}

      {/* CTA Button */}
      <Animated.View
        style={[styles.buttonContainer, { transform: [{ scale: buttonScale }] }]}
      >
        <TouchableOpacity style={styles.aiButton} onPress={onContinue}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Footer */}
      <View style={styles.bottomContainer}>
        <Text style={styles.bottomText}>© University of Education</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)", // soft white overlay
  },
  headerContainer: {
    position: "absolute",
    top: 80,
    alignItems: "center",
  },
  welcome: {
    fontSize: 26,
    color: "#2E8B57",
    fontFamily: "Poppins-Bold",
    textAlign: "center",
  },
  appName: {
    fontSize: 42,
    color: "#000",
    fontFamily: "Poppins-Bold",
    marginTop: -5,
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  lottieTop: {
    width: 200,
    height: 200,
    marginTop: 220,
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 18,
    color: "#2E8B57",
    fontFamily: "Poppins-Regular",
    marginBottom: 200,
    textAlign: "center",
  },
  aiButton: {
    backgroundColor: "#2E8B57",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 6,
    shadowColor: "#61892F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
    textTransform: "uppercase",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 80,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 20,
  },
  bottomText: {
    fontSize: 14,
    color: "black",
    fontFamily: "Poppins-Regular",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
