import React from "react";
import { TouchableOpacity, View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

type CenterButtonProps = {
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

const CenterButton: React.FC<CenterButtonProps> = (props) => {
  // Ensure `props.style` is valid before spreading
  const resolvedStyle = Array.isArray(props.style)
    ? props.style.filter(Boolean)
    : props.style && typeof props.style === "object"
    ? [props.style]
    : [];

  return (
    <TouchableOpacity
      style={[styles.centerButton, ...resolvedStyle]}
      onPress={props.onPress}
    >
      <View style={styles.iconContainer}>
        <FontAwesome name="camera" size={24} color="#fff" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  centerButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    width: 70,
    height: 70,
    backgroundColor: "#4CAF50",
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CenterButton;
