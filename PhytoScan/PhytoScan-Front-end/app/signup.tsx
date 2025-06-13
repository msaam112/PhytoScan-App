import React, { useState } from "react";
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from "react-native";
import LottieView from "lottie-react-native";
import { FontAwesome, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getApiBaseUrl } from "../components/utils/config";
import { LinearGradient } from "expo-linear-gradient";
import CustomAlert from "../components/CustomAlert";

const { width, height } = Dimensions.get('window');

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const [isOtpVisible, setIsOtpVisible] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  const API_BASE_URL = getApiBaseUrl();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleFocus = (field: string) => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
  };

  const onRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      return showAlert("All fields are required");
    }
    if (!validateEmail(email)) {
      return showAlert("Please enter a valid email address");
    }
    if (password.length < 6) {
      return showAlert("Password must be at least 6 characters");
    }
    if (password !== confirmPassword) {
      return showAlert("Passwords do not match");
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (response.ok) {
        showAlert(data.message);
        setIsOtpVisible(true);
      } else {
        showAlert(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      showAlert("Network error. Please check your connection.");
      setIsLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    try {
      setOtpLoading(true);
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      setOtpLoading(false);

      if (response.ok) {
        setIsOtpVisible(false);
        setAccountCreated(true);
        setTimeout(() => router.replace("/login"), 3000);
      } else {
        showAlert(data.message || "Invalid OTP code");
      }
    } catch (err) {
      console.error(err);
      showAlert("OTP verification failed. Try again.");
      setOtpLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/images/login-background.jpg')} 
      style={styles.backgroundImage}
      blurRadius={2}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.95)']}
        style={styles.gradientOverlay}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {accountCreated ? (
            <View style={styles.successContainer}>
              <LottieView
                source={require("../assets/animations/account-created.json")}
                autoPlay
                loop={false}
                style={styles.successAnimation}
              />
              <Text style={styles.successMessage}>Account Created!</Text>
              <Text style={styles.successSubMessage}>Redirecting to login...</Text>
            </View>
          ) : (
            <View style={styles.contentContainer}>
              <View style={styles.header}>
                <LottieView
                  source={require("../assets/animations/register.json")}
                  autoPlay
                  loop
                  style={styles.signupAnimation}
                />
                <Text style={styles.welcomeMessage}>Create Account</Text>
                <Text style={styles.subTitle}>Join our community today</Text>
              </View>

              <View style={styles.formContainer}>
                <View style={[
                  styles.inputContainer,
                  isFocused.name && styles.inputContainerFocused
                ]}>
                  <Feather 
                    name="user" 
                    size={20} 
                    color={isFocused.name ? "#2E8B57" : "#666"} 
                    style={styles.icon} 
                  />
                  <TextInput
                    placeholder="Full Name"
                    placeholderTextColor="#666"
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => handleFocus('name')}
                    onBlur={() => handleBlur('name')}
                  />
                </View>

                <View style={[
                  styles.inputContainer,
                  isFocused.email && styles.inputContainerFocused
                ]}>
                  <Feather 
                    name="mail" 
                    size={20} 
                    color={isFocused.email ? "#2E8B57" : "#666"} 
                    style={styles.icon} 
                  />
                  <TextInput
                    placeholder="Email Address"
                    placeholderTextColor="#666"
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => handleFocus('email')}
                    onBlur={() => handleBlur('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={[
                  styles.inputContainer,
                  isFocused.password && styles.inputContainerFocused
                ]}>
                  <Feather 
                    name="lock" 
                    size={20} 
                    color={isFocused.password ? "#2E8B57" : "#666"} 
                    style={styles.icon} 
                  />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#666"
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => handleFocus('password')}
                    onBlur={() => handleBlur('password')}
                  />
                </View>

                <View style={[
                  styles.inputContainer,
                  isFocused.confirmPassword && styles.inputContainerFocused
                ]}>
                  <Feather 
                    name="lock" 
                    size={20} 
                    color={isFocused.confirmPassword ? "#2E8B57" : "#666"} 
                    style={styles.icon} 
                  />
                  <TextInput
                    placeholder="Confirm Password"
                    placeholderTextColor="#666"
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => handleFocus('confirmPassword')}
                    onBlur={() => handleBlur('confirmPassword')}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Feather 
                      name={showPassword ? "eye" : "eye-off"} 
                      size={20} 
                      color={isFocused.confirmPassword ? "#2E8B57" : "#666"} 
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.registerButton} 
                  onPress={onRegister}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#2E8B57', '#3CB371']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.registerButtonText}>Create Account</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => router.push("/login")}>
                    <Text style={styles.loginLink}>Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* OTP Modal */}
          <Modal
            visible={isOtpVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setIsOtpVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Verify Your Email</Text>
                <Text style={styles.modalSubtitle}>We've sent a 6-digit code to your email</Text>
                
                <TextInput
                  style={styles.otpInput}
                  placeholder="Enter OTP"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={6}
                />

                <TouchableOpacity 
                  style={styles.verifyButton} 
                  onPress={onVerifyOtp}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#2E8B57', '#3CB371']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {otpLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.verifyButtonText}>Verify & Continue</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.resendCode}>
                  <Text style={styles.resendCodeText}>Didn't receive code? Resend</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <CustomAlert
            visible={alertVisible}
            title="Alert"
            message={alertMessage}
            onClose={() => setAlertVisible(false)}
            themeColor="#2E8B57"
          />

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <LottieView
                source={require("../assets/animations/loading.json")}
                autoPlay
                loop
                style={styles.loadingAnimation}
              />
              <Text style={styles.loadingText}>Creating your account...</Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  contentContainer: {
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  signupAnimation: {
    width: 180,
    height: 180,
    marginBottom: 10,
  },
  welcomeMessage: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2E8B57',
    marginBottom: 8,
    fontFamily: 'SFProDisplay-Bold',
  },
  subTitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'SFProDisplay-Regular',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 139, 87, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(46, 139, 87, 0.1)',
  },
  inputContainerFocused: {
    borderColor: '#2E8B57',
    backgroundColor: 'rgba(46, 139, 87, 0.15)',
  },
  icon: {
    marginRight: 12,
  },
  eyeIcon: {
    padding: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: 'SFProDisplay-Regular',
    paddingVertical: 0,
  },
  registerButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 25,
    elevation: 5,
    shadowColor: '#2E8B57',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'SFProDisplay-Semibold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 15,
    fontFamily: 'SFProDisplay-Regular',
  },
  loginLink: {
    color: '#2E8B57',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'SFProDisplay-Semibold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    width: '100%',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46, 139, 87, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E8B57',
    marginBottom: 8,
    fontFamily: 'SFProDisplay-Bold',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'SFProDisplay-Regular',
  },
  otpInput: {
    width: '100%',
    fontSize: 18,
    color: '#333',
    backgroundColor: 'rgba(46, 139, 87, 0.1)',
    borderRadius: 10,
    padding: 15,
    textAlign: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(46, 139, 87, 0.2)',
    fontFamily: 'SFProDisplay-Medium',
  },
  verifyButton: {
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 20,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'SFProDisplay-Semibold',
  },
  resendCode: {
    marginTop: 10,
  },
  resendCodeText: {
    color: '#2E8B57',
    fontSize: 14,
    fontFamily: 'SFProDisplay-Medium',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'white',
  },
  successAnimation: {
    width: 200,
    height: 200,
  },
  successMessage: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E8B57',
    marginTop: 20,
    textAlign: 'center',
    fontFamily: 'SFProDisplay-Bold',
  },
  successSubMessage: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'SFProDisplay-Regular',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingAnimation: {
    width: 120,
    height: 120,
  },
  loadingText: {
    color: '#2E8B57',
    marginTop: 20,
    fontSize: 16,
    fontFamily: 'SFProDisplay-Medium',
  },
});