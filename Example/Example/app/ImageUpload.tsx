import React, { useState, useEffect } from "react"; 
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform, ActivityIndicator, Modal, ScrollView, Alert } from "react-native"; 
import * as ImagePicker from "expo-image-picker";
import { getApiBaseUrl, getFlaskApiBaseUrl } from "@/components/utils/config";
import { MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";
import LottieView from 'lottie-react-native'; 

export default function ImageUpload() {
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [aiProcessing, setAiProcessing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>(""); 
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [resultModalVisible, setResultModalVisible] = useState<boolean>(false);
  const [plantType, setPlantType] = useState<string | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);

  const userId = 5;
  const API_BASE_URL = getApiBaseUrl();
  const FLASK_API_BASE_URL = getFlaskApiBaseUrl();

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === "web") return true;
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (cameraStatus !== "granted" || mediaStatus !== "granted") {
      Alert.alert("Permission Required", "Please grant camera and gallery access to continue.");
      return false;
    }
    return true;
  };

  const pickImage = async (): Promise<string | null> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    return result.canceled ? null : result.assets[0].uri;
  };

  const openCamera = async (): Promise<string | null> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
    return result.canceled ? null : result.assets[0].uri;
  };

  const handleImageSelection = async (pickerFunction: () => Promise<string | null>) => {
    const uri = await pickerFunction();
    if (!uri) return;
    setImage(uri);
    setModalVisible(false);
    uploadImage(uri);
  };

  const uploadImage = async (imageUri: string) => {
    if (!imageUri) {
      Alert.alert("Error", "Please select or capture an image first.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      name: "photo.jpg",
      type: "image/jpeg",
    } as any);
    formData.append("userId", userId.toString());
    try {
      const uploadResponse = await fetch(`${API_BASE_URL}/upload-image`, {
        method: "POST",
        body: formData,
      });
      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        setUploadedFilePath(uploadResult.filePath); 

        // Delay the upload animation and proceed to AI processing directly after it finishes
        setTimeout(() => {
          setUploading(false);
          getPrediction(uploadResult.filePath); // Directly start AI processing
        }, 3000); // Adjust this time based on the animation duration (here 3 seconds)
      } else {
        Alert.alert("Upload Failed", "Unable to upload image.");
      }
    } catch (error) {
      console.error("Upload Error:", error);
      Alert.alert("Upload Error", "An error occurred while uploading the image.");
    }
  };

  const getPrediction = async (filePath: string) => {
    setAiProcessing(true);
    try {
      const response = await fetch(`${FLASK_API_BASE_URL}/predict-from-file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });
      if (response.ok) {
        const result = await response.json();
        setAiResult(`Prediction: ${result.predicted_class}\nConfidence: ${result.confidence}`);

        // Set a delay before revealing the result
        setTimeout(() => {
          setAiProcessing(false); // Stop AI processing animation
          setResultModalVisible(true); // Show the result modal after animation completes
        }, 3000); // Match this time with the animation duration (3 seconds in this case)
      } else {
        const errorText = await response.text();
        Alert.alert("Prediction Failed", errorText);
      }
    } catch (error) {
      console.error("Prediction Error:", error);
      Alert.alert("Prediction Error", "An error occurred during prediction.");
    }
  };

  const resetState = () => {
    setImage(null);
    setAiResult(null);
    setPlantType(null);
    setUploadedFilePath(null);
  };

  useEffect(() => {
    if (Platform.OS !== "web") {
      requestPermissions();
    }
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Upload Your Image</Text>
      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.imagePreview} />
        </View>
      )}
      {uploading && (
        <View style={styles.loaderContainer}>
          <LottieView source={require('@/assets/animations/uploading.json')} autoPlay loop style={styles.loaderAnimation} />
          <Text style={styles.loaderText}>Uploading image...</Text>
        </View>
      )}
      {aiProcessing && (
        <View style={styles.loaderContainer}>
          <LottieView source={require('@/assets/animations/ai-processing.json')} autoPlay loop style={styles.loaderAnimation} />
          <Text style={styles.loaderText}>AI is analyzing your image...</Text>
        </View>
      )}
      {!image && !uploading && !aiProcessing && (
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.uploadButton}>
          <MaterialCommunityIcons name="image-plus" size={80} color="#4CAF50" />
          <Text style={styles.uploadButtonText}>Upload or Capture Image</Text>
        </TouchableOpacity>
      )}
      {/* Image Selection Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose an option</Text>
            <TouchableOpacity style={styles.optionButton} onPress={() => handleImageSelection(pickImage)}>
              <FontAwesome name="photo" size={24} color="#fff" />
              <Text style={styles.optionText}>Upload Image</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={() => handleImageSelection(openCamera)}>
              <FontAwesome name="camera" size={24} color="#fff" />
              <Text style={styles.optionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Prediction Modal */}
      <Modal visible={resultModalVisible} transparent animationType="slide" onRequestClose={() => setResultModalVisible(false)}>
        <View style={styles.predictionModalOverlay}>
          <View style={styles.predictionModalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => { setResultModalVisible(false); resetState(); }}>
              <AntDesign name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.predictionModalTitle}>Prediction Result</Text>
            {image && <Image source={{ uri: image }} style={styles.predictionImage} />}
            {aiResult && <Text style={styles.predictionModalText}>{aiResult}</Text>}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: "center", padding: 20, backgroundColor: "#f5f5f5" },
  title: { fontSize: 24, fontWeight: "bold", color: "#2E7D32", marginBottom: 20 },
  imageContainer: { width: "100%", alignItems: "center", marginBottom: 20 },
  imagePreview: { width: 300, height: 300, borderRadius: 15, borderWidth: 2, borderColor: "#4CAF50" },
  uploadButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#4CAF50",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButtonText: { marginTop: 10, fontSize: 16, color: "#4CAF50", fontWeight: "bold" },
  loaderContainer: { justifyContent: "center", alignItems: "center", marginVertical: 20 },
  loaderText: { marginTop: 10, fontSize: 16, color: "#4CAF50" },
  loaderAnimation: { width: 100, height: 100 },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" },
  modalContent: { backgroundColor: "#fff", borderRadius: 15, padding: 30, width: "80%", alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#2E7D32", marginBottom: 20 },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: "100%",
    justifyContent: "center",
  },
  optionText: { color: "#fff", fontSize: 16, fontWeight: "bold", marginLeft: 10 },
  cancelButton: { padding: 15, width: "100%", alignItems: "center", borderRadius: 10, backgroundColor: "#D32F2F", marginTop: 10 },
  cancelButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  predictionModalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.7)" },
  predictionModalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: "80%",
    alignItems: "center",
    position: "relative",
  },
  predictionModalTitle: { fontSize: 22, fontWeight: "bold", color: "#2E7D32", marginBottom: 10 },
  predictionModalText: { fontSize: 16, color: "#388E3C", textAlign: "center", marginTop: 10 },
  predictionImage: { width: 250, height: 250, borderRadius: 10, marginVertical: 10 },
  closeButton: { position: "absolute", top: 10, right: 10 },
});
