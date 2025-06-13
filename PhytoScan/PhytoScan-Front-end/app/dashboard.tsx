import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome, AntDesign, Ionicons } from "@expo/vector-icons";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Modal,
  Alert,
  Text,
  Image,
  Platform,
  Dimensions,
  ActivityIndicator,
  Linking,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Home from "./Home";
import Profile from "./Profile";
import History from "./History";
import Feedback from "./Feedback";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl, getFlaskApiBaseUrl } from "@/components/utils/config";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const Tab = createBottomTabNavigator();
const screenWidth = Dimensions.get("window").width;

export default function Dashboard() {
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [aiProcessing, setAiProcessing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [showImagePickerModal, setShowImagePickerModal] = useState<boolean>(false);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState<boolean>(false);
  const [treatmentData, setTreatmentData] = useState<any>(null);
  const [userID, setUserID] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [plant, setPlant] = useState<string>("");
  const [disease, setDisease] = useState<string>("");
  const [confidence, setConfidence] = useState<string>("");
  const [showDiseaseSection, setShowDiseaseSection] = useState(false);

  const API_BASE_URL = getApiBaseUrl();
  const FLASK_API_BASE_URL = getFlaskApiBaseUrl();

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const storedUserID = await AsyncStorage.getItem("userID");
        if (!storedUserID) {
          setErrorMsg("User ID not found. Please login again.");
          router.replace("/login");
          return;
        }
        setUserID(storedUserID);
      } catch (error) {
        console.error("User ID Error:", error);
        setErrorMsg("Failed to load user information");
      } finally {
        setLoading(false);
      }
    };
    loadUserId();
  }, []);

  useEffect(() => {
    if (aiResult) {
      const lines = aiResult.split("\n");
      const predictionLine = lines[0].replace("Prediction: ", "");
      const [plantPart, diseasePart] = predictionLine.split("___");
      setPlant(plantPart || "Unknown");
      setDisease(diseasePart || "Unknown");
      setConfidence(lines[1] || "");
    }
  }, [aiResult]);

  useEffect(() => {
    if (showResultModal) {
      setShowDiseaseSection(false);
      const timer = setTimeout(() => {
        setShowDiseaseSection(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showResultModal]);

  const requestPermissions = async () => {
    if (Platform.OS === "web") return true;

    try {
      const [cameraStatus, mediaStatus] = await Promise.all([
        ImagePicker.requestCameraPermissionsAsync(),
        ImagePicker.requestMediaLibraryPermissionsAsync()
      ]);

      if (cameraStatus.status !== "granted" || mediaStatus.status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera and gallery access in settings to continue.",
          [
            { text: "Cancel" },
            { 
              text: "Open Settings", 
              onPress: () => Platform.OS === 'ios' ? 
                Linking.openURL('app-settings:') : Linking.openSettings() 
            }
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Permission Error:", error);
      Alert.alert("Error", "Failed to request permissions");
      return false;
    }
  };

  const validateUser = () => {
    if (loading) {
      Alert.alert("Please wait", "User information is loading");
      return false;
    }
    if (!userID) {
      Alert.alert("Authentication Required", "Please login to use this feature");
      router.replace("/login");
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    if (!validateUser()) return;
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        handleImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image Picker Error:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const openCamera = async () => {
    if (!validateUser()) return;
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        handleImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera Error:", error);
      Alert.alert("Error", "Failed to access camera. Please try again.");
    }
  };

  const handleImage = async (uri: string) => {
    try {
      setImage(uri);
      setShowImagePickerModal(false);
      await uploadImage(uri);
    } catch (error) {
      console.error("Image Handling Error:", error);
      Alert.alert("Error", "Failed to process image. Please try again.");
    }
  };

  const uploadImage = async (imageUri: string) => {
    if (!userID) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      name: "photo.jpg",
      type: "image/jpeg",
    } as any);
    formData.append("userId", userID);

    try {
      const uploadResponse = await fetch(`${API_BASE_URL}/upload-image`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Image upload failed. Please try again.");
      }

      const uploadResult = await uploadResponse.json();
      if (!uploadResult.filePath) {
        throw new Error("Server response incomplete. Please try again.");
      }
      await getPrediction(uploadResult.filePath);
    } catch (error) {
      console.error("Upload Error:", error);
      Alert.alert(
        "Upload Error", 
        error instanceof Error ? error.message : "An error occurred while uploading"
      );
    } finally {
      setUploading(false);
    }
  };

  const getPrediction = async (filePath: string) => {
    setAiProcessing(true);

    try {
      const predictionResponse = await fetch(`${FLASK_API_BASE_URL}/predict-from-file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });

      if (!predictionResponse.ok) {
        const errorData = await predictionResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Analysis failed. Please try again.");
      }

      const result = await predictionResponse.json();
      if (!result.predicted_class || !result.confidence) {
        throw new Error("Invalid analysis results received.");
      }

      setAiResult(`Prediction: ${result.predicted_class}\nConfidence: ${result.confidence}%`);
      setShowResultModal(true);
    } catch (error) {
      console.error("Prediction Error:", error);
      Alert.alert(
        "Analysis Error", 
        error instanceof Error ? error.message : "Failed to analyze image"
      );
    } finally {
      setAiProcessing(false);
    }
  };

  const fetchTreatment = async () => {
    if (!aiResult) return;
    
    try {
      const label = aiResult.split("\n")[0].replace("Prediction: ", "").trim();
      const confidenceStr = aiResult.split("\n")[1].replace("Confidence:", "").replace("%", "").trim();
      const confidence = parseFloat(confidenceStr) / 100;
      
      const response = await fetch(
        `${API_BASE_URL}/get-treatment?label=${encodeURIComponent(label)}&confidence=${confidence}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch treatments');
      }
      
      const data = await response.json();
      setTreatmentData(data);
      setShowResultModal(false);
      setShowTreatmentModal(true);
    } catch (error) {
      console.error('Error fetching treatments:', error);
      Alert.alert('Error', 'Could not load treatment suggestions. Please try again.');
    }
  };

  const resetState = () => {
    setImage(null);
    setAiResult(null);
    setShowResultModal(false);
    setShowTreatmentModal(false);
    setTreatmentData(null);
    setPlant("");
    setDisease("");
    setConfidence("");
    setShowDiseaseSection(false);
  };

  const handleSavePrediction = async () => {
    if (!userID || !aiResult) return;

    try {
      const predictionParts = aiResult.split("\n")[0]
        .replace("Prediction: ", "")
        .split("___");
      
      const plantType = predictionParts[0]?.trim() || "Unknown";
      const disease = predictionParts[1]?.trim() || "Unknown";

      const saveResponse = await fetch(`${API_BASE_URL}/save-prediction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userID, plantType, disease }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save prediction.");
      }

      Alert.alert("Saved", "Prediction saved to history successfully!");
      resetState();
    } catch (error) {
      console.error("Save Error:", error);
      Alert.alert(
        "Save Error", 
        error instanceof Error ? error.message : "Failed to save prediction"
      );
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={["#F8F9FF", "#EFF1FF"]} style={styles.loadingContainer}>
        <LottieView
          source={require("@/assets/animations/loading.json")}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </LinearGradient>
    );
  }

  if (errorMsg) {
    return (
      <LinearGradient colors={["#F8F9FF", "#EFF1FF"]} style={styles.errorContainer}>
        <LottieView
          source={require("@/assets/animations/error.json")}
          autoPlay
          loop
          style={styles.errorAnimation}
        />
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.retryButtonText}>Return to Login</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let animation;
            switch (route.name) {
              case "Home":
                animation = require("@/assets/animations/home.json");
                break;
              case "Profile":
                animation = require("@/assets/animations/profile.json");
                break;
              case "History":
                animation = require("@/assets/animations/history.json");
                break;
              case "Feedback":
                animation = require("@/assets/animations/feedback.json");
                break;
              default:
                animation = require("@/assets/animations/home.json");
            }

            return (
              <LottieView
                source={animation}
                autoPlay
                loop
                style={{ width: size, height: size }}
              />
            );
          },
          tabBarActiveTintColor: "#2E8B57",
          tabBarInactiveTintColor: "#88889D",
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            height: 70,
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            elevation: 8,
            shadowColor: "#2E8B57",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            paddingBottom: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginBottom: 4,
          },
        })}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="History" component={History} />
        <Tab.Screen name="Feedback" component={Feedback} />
        <Tab.Screen name="Profile" component={Profile} />
      </Tab.Navigator>

      <View style={styles.uploadButtonWrapper}>
        <TouchableOpacity
          onPress={() => setShowImagePickerModal(true)}
          style={styles.uploadButton}
          activeOpacity={0.8}
        >
          <LottieView
            source={require("@/assets/animations/cam.json")}
            autoPlay
            loop
            style={styles.cameraAnimation}
          />
        </TouchableOpacity>
      </View>

      <Modal visible={showImagePickerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Image Source</Text>
            
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={pickImage}
            >
              <View style={styles.optionIconContainer}>
                <Ionicons name="image" size={24} color="#2E8B57" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionLabel}>Choose from Gallery</Text>
                <Text style={styles.optionDescription}>Select an image from your device</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#88889D" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={openCamera}
            >
              <View style={styles.optionIconContainer}>
                <Ionicons name="camera" size={24} color="#2E8B57" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionLabel}>Take a Photo</Text>
                <Text style={styles.optionDescription}>Use your camera to capture an image</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#88889D" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowImagePickerModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={uploading && !aiProcessing}>
        <View style={styles.loaderContainer}>
          <View style={styles.loaderContent}>
            <LottieView
              source={require("@/assets/animations/uploading.json")}
              autoPlay
              loop
              style={styles.loaderAnimation}
            />
            <Text style={styles.loaderText}>Uploading Image</Text>
            <Text style={styles.loaderSubText}>Please wait while we upload your image</Text>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={aiProcessing}>
        <View style={styles.loaderContainer}>
          <View style={styles.loaderContent}>
            <LottieView
              source={require("@/assets/animations/ai-processing.json")}
              autoPlay
              loop
              style={styles.loaderAnimation}
            />
            <Text style={styles.loaderText}>Analyzing Image</Text>
            <Text style={styles.loaderSubText}>Our AI is examining your image</Text>
          </View>
        </View>
      </Modal>

      <Modal visible={showResultModal} transparent animationType="slide">
        <View style={styles.resultModalOverlay}>
          <View style={styles.resultModalContent}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={resetState}
            >
              <AntDesign name="close" size={24} color="#2E8B57" />
            </TouchableOpacity>
            <Text style={styles.resultModalTitle}>Analysis Result</Text>
            {image && (
              <View style={styles.resultImageContainer}>
                <Image source={{ uri: image }} style={styles.resultImage} />
              </View>
            )}
            {aiResult && (
              <View style={styles.resultTextContainer}>
                <Text style={styles.resultModalText}>
                  Detected Plant: {plant}
                </Text>
                {showDiseaseSection && (
                  <>
                    <Text style={styles.resultModalText}>
                      Detected Disease: {disease === "Healthy" 
                        ? "No Disease (Healthy)" 
                        : disease}
                    </Text>
                    <Text style={styles.confidenceText}>
                      {confidence}
                    </Text>
                  </>
                )}
              </View>
            )}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSavePrediction}
              disabled={!aiResult}
            >
              <Text style={styles.saveButtonText}>
                {aiResult ? "Save to History" : "Processing..."}
              </Text>
              {!aiResult && <ActivityIndicator color="#FFFFFF" style={styles.saveButtonSpinner} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, styles.treatmentButton]}
              onPress={fetchTreatment}
              disabled={!aiResult}
            >
              <Text style={styles.saveButtonText}>
                Need Treatment?
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showTreatmentModal} transparent animationType="slide">
        <View style={styles.resultModalOverlay}>
          <View style={[styles.resultModalContent, styles.treatmentModalContent]}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => {
                setShowTreatmentModal(false);
                setShowResultModal(true);
              }}
            >
              <AntDesign name="close" size={24} color="#2E8B57" />
            </TouchableOpacity>
            
            <Text style={styles.resultModalTitle}>Treatment Suggestions</Text>
            
            {treatmentData && (
              <>
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultModalText}>
                    {treatmentData.disease.replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.confidenceText}>
                    Confidence: {treatmentData.confidence} ({treatmentData.confidenceLevel})
                  </Text>
                </View>
                
                <ScrollView style={styles.treatmentScrollView}>
                  <View style={styles.treatmentList}>
                    {treatmentData.treatments.map((treatment: string, index: number) => (
                      <View key={index} style={styles.treatmentItem}>
                        <Text style={styles.treatmentBullet}>•</Text>
                        <Text style={styles.treatmentText}>{treatment}</Text>
                      </View>
                    ))}
                    
                    {treatmentData.treatments.length === 0 && (
                      <Text style={styles.noTreatmentText}>
                        No treatment needed - plant is healthy!
                      </Text>
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingAnimation: {
    width: 150,
    height: 150,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#2E8B57",
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  errorAnimation: {
    width: 150,
    height: 150,
  },
  errorText: {
    fontSize: 16,
    color: "#FF4B2B",
    textAlign: "center",
    marginTop: 12,
    fontWeight: "600",
    marginHorizontal: 24,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: "#2E8B57",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  uploadButtonWrapper: {
    position: "absolute",
    bottom: 40,
    left: "50%",
    transform: [{ translateX: -35 }],
    zIndex: 999,
  },
  uploadButton: {
    width: 70,
    height: 70,
    backgroundColor: "#2E8B57",
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  cameraAnimation: {
    width: 60,
    height: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D48',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(46, 139, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D48',
  },
  optionDescription: {
    fontSize: 14,
    color: '#88889D',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#EDEDF7',
    marginVertical: 8,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4B2B',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loaderContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    width: "90%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  loaderAnimation: {
    width: 120,
    height: 120,
  },
  loaderText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2D2D48",
    marginTop: 16,
  },
  loaderSubText: {
    fontSize: 14,
    color: "#88889D",
    marginTop: 8,
    textAlign: "center",
  },
  resultModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  resultModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  treatmentModalContent: {
    maxHeight: '80%',
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
  },
  resultModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2D2D48",
    marginBottom: 16,
    textAlign: "center",
  },
  resultImageContainer: {
    alignItems: "center",
    marginVertical: 12,
  },
  resultImage: {
    width: 220,
    height: 220,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  resultTextContainer: {
    backgroundColor: "rgba(46, 139, 87, 0.1)",
    borderRadius: 14,
    padding: 16,
    marginVertical: 12,
  },
  resultModalText: {
    fontSize: 16,
    color: "#2E8B57",
    lineHeight: 24,
    textAlign: "center",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#2E8B57",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  treatmentButton: {
    backgroundColor: '#2E8B57',
    marginTop: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonSpinner: {
    marginLeft: 10,
  },
  treatmentScrollView: {
    maxHeight: 300,
  },
  treatmentList: {
    marginTop: 16,
  },
  treatmentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  treatmentBullet: {
    fontSize: 20,
    color: '#2E8B57',
    marginRight: 8,
    lineHeight: 24,
  },
  treatmentText: {
    flex: 1,
    fontSize: 15,
    color: '#2E8B57',
    lineHeight: 22,
  },
  noTreatmentText: {
    fontSize: 16,
    color: '#2E8B57',
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  confidenceText: {
    fontSize: 14,
    color: '#2E8B57',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  }
});