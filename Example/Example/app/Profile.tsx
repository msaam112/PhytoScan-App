import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "../components/utils/config";
import LottieView from "lottie-react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

type UserProfile = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};

const { width } = Dimensions.get("window");

export default function Profile() {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [userID, setUserID] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const API_BASE_URL = getApiBaseUrl();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedUserID = await AsyncStorage.getItem("userID");
        setUserID(storedUserID);

        if (!storedUserID) {
          setErrorMsg("User ID not found in storage.");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/profile/${storedUserID}`);
        const data = await response.json();

        if (response.ok && data.user) {
          setUserData(data.user);
        } else {
          setErrorMsg(data.message || "Failed to fetch profile.");
        }
      } catch (error) {
        console.error("Profile Fetch Error:", error);
        setErrorMsg("Something went wrong while fetching profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("user_data");
      await AsyncStorage.removeItem("userID");
      router.replace("/login");
      Alert.alert("Success", "You have been logged out.");
    } catch (error) {
      console.error("Logout Error:", error);
      Alert.alert("Error", "An error occurred while logging out.");
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={["#F8F9FF", "#EFF1FF"]} style={styles.center}>
        <LottieView
          source={require("../assets/animations/loading.json")}
          autoPlay
          loop
          style={styles.lottie}
        />
        <Text style={styles.loadingText}>Fetching Profile...</Text>
      </LinearGradient>
    );
  }

  if (errorMsg) {
    return (
      <LinearGradient colors={["#F8F9FF", "#EFF1FF"]} style={styles.center}>
        <LottieView
          source={require("../assets/animations/error.json")}
          autoPlay
          loop
          style={styles.lottie}
        />
        <Text style={styles.errorText}>{errorMsg}</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#F8F9FF", "#EFF1FF"]} style={styles.fullContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava2-bg.webp",
              }}
              style={styles.avatar}
            />
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          </View>

          <Text style={styles.name}>{userData?.name}</Text>
          <Text style={styles.tagline}>Premium Member</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>ID: {userID || userData?.id}</Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>✉️</Text>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userData?.email}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📅</Text>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Joined</Text>
                <Text style={styles.infoValue}>
                  {new Date(userData?.created_at || "").toLocaleDateString("en-GB")}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LinearGradient
              colors={["#2E8B57", "#2E8B57"]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.logoutText}>Sign Out</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
  },
  container: {
    paddingVertical: 40,
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 24,
    width: width * 0.9,
    alignItems: "center",
    shadowColor: "#6360FF",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  avatarContainer: {
    shadowColor: "#6360FF",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#4CAF50",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  verifiedText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  name: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2D2D48",
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: "#6360FF",
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  statItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F8F9FF",
    borderRadius: 16,
    marginHorizontal: 6,
  },
  statValue: {
    fontSize: 14,
    color: "#2D2D48",
    fontWeight: "600",
  },
  infoContainer: {
    width: "100%",
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EDEDF7",
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#88889D",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#2D2D48",
    fontWeight: "500",
  },
  logoutButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
    borderRadius: 16,
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.8,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  lottie: {
    width: 150,
    height: 150,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#2D2D48",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    color: "#FF4B2B",
    textAlign: "center",
    marginTop: 12,
    fontWeight: "600",
  },
});