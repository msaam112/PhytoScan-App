import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
  ActivityIndicator
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { getApiBaseUrl } from "@/components/utils/config";
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const LOADER_SIZES = {
  small: width * 0.5,
  medium: width * 0.5,
  large: width * 0.5,
};

const Loader: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ size = 'small' }) => (
  <LottieView
    source={require('@/assets/animations/loading.json')}
    autoPlay
    loop
    style={{
      width: LOADER_SIZES[size],
      height: LOADER_SIZES[size],
      alignSelf: 'center'
    }}
  />
);

export default function Feedback() {
  const [feedback, setFeedback] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const buttonScale = useRef(new Animated.Value(1)).current;

  const API_BASE_URL = getApiBaseUrl();

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.96,
        duration: 100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      })
    ]).start();
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 200);
      return () => clearTimeout(timer);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setIsLoading(true);
    setTimeout(() => {
      setRefreshing(false);
      setIsLoading(false);
    }, 3000);
  };

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert("Error", "Please enter your feedback before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const userID = await AsyncStorage.getItem("userID");
      
      if (!userID) {
        Alert.alert("Error", "You must be logged in to submit feedback.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/submit-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          feedback,
          userId: userID // Send as string (or parseInt if backend expects number)
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setFeedback("");
          setSubmitSuccess(false);
        }, 3000);
      } else {
        Alert.alert("Error", data.message || "Failed to submit feedback.");
      }
    } catch (error) {
      console.error("Feedback Error:", error);
      Alert.alert("Error", "An error occurred while submitting feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <Loader size="small" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#4CAF50"]}
          tintColor="#4CAF50"
          progressBackgroundColor="#FFFFFF"
        />
      }
    >
      {submitSuccess ? (
        <View style={styles.successContainer}>
          <LottieView
            source={require('@/assets/animations/submit.json')}
            autoPlay
            loop={false}
            style={{ width: width * 0.6, height: width * 0.6 }}
          />
          <Text style={styles.successTitle}>Thank You!</Text>
          <Text style={styles.successMessage}>Your feedback has been submitted successfully</Text>
        </View>
      ) : (
        <View style={styles.formContainer}>
          <View style={styles.animationContainer}>
            <LottieView
              source={require('@/assets/animations/feedback-top.json')}
              autoPlay
              loop={false}
              style={{ width: width * 0.8, height: width * 0.8 }}
            />
          </View>

          <View style={styles.contentBox}>
            <Text style={styles.title}>Share Your Thoughts</Text>
            <Text style={styles.subtitle}>We value your feedback to improve our service</Text>

            <TextInput
              style={styles.input}
              placeholder="Write your feedback here..."
              placeholderTextColor="#9E9E9E"
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={5}
            />

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled
                ]}
                onPressIn={animatePress}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.9}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    Submit Feedback
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {isSubmitting && (
            <View style={styles.loadingOverlay}>
              <Loader size="medium" />
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F5F9F5",
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#F5F9F5",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: -40,
  },
  contentBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    minHeight: 150,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#212121',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: "#81C784",
    opacity: 0.7
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2E7D32',
    marginTop: 16,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#616161',
    textAlign: 'center',
    lineHeight: 24,
  },
});