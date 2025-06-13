import React from "react";
import { StyleSheet, View } from "react-native";
import LottieView from "lottie-react-native";

const ParticleBackground = () => {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <LottieView
        source={require("../assets/particles.json")} // Replace with your JSON file
        autoPlay
        loop
        style={styles.particles}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  particles: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
});

export default ParticleBackground;
