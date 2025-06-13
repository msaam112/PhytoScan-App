import React, { useState } from "react";
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Dimensions,
} from "react-native";
import LottieView from 'lottie-react-native';
import { FontAwesome, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getApiBaseUrl } from "../components/utils/config.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get('window');

// Custom Alert component
const CustomAlert = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <View style={styles.alertContainer}>
    <View style={styles.alertBox}>
      <Feather name="alert-circle" size={32} color="#FF4757" style={styles.alertIcon} />
      <Text style={styles.alertMessage}>{message}</Text>
      <TouchableOpacity onPress={onClose} style={styles.alertButton}>
        <Text style={styles.alertButtonText}>Got it</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginVisible, setLoginVisible] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [movingToDashboard, setMovingToDashboard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({
    email: false,
    password: false
  });

  const API_BASE_URL = getApiBaseUrl();

  const validateEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+$/.test(email);

  const onLogin = async () => {
    setErrorMessage("");
    setLoading(true);

    if (!email || !password) {
      setLoading(false);
      setErrorMessage("Please fill in both fields.");
      return;
    }

    if (!validateEmail(email)) {
      setLoading(false);
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setLoginVisible(false);
        setLoginSuccess(true);

        if (data.token) {
          await AsyncStorage.setItem("auth_token", data.token);
        }

        if (data.userID && data.email) {
          await AsyncStorage.setItem("userID", data.userID.toString());
          await AsyncStorage.setItem(
            "user_data",
            JSON.stringify({
              userID: data.userID,
              email: data.email,
            })
          );
        }

        setTimeout(() => {
          setMovingToDashboard(true);
          setTimeout(() => {
            router.replace("/dashboard");
          }, 500);
        }, 3000);
      } else {
        setErrorMessage(data.message || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (field: string) => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
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
          {loading && (
            <View style={styles.loadingOverlay}>
              <LottieView
                source={require("../assets/animations/loading.json")}
                autoPlay
                loop
                style={styles.loadingAnimation}
              />
              <Text style={styles.loadingText}>Authenticating...</Text>
            </View>
          )}

          {loginSuccess && !movingToDashboard && (
            <View style={styles.successContainer}>
              <LottieView
                source={require("../assets/animations/login-success.json")}
                autoPlay
                loop={false}
                style={styles.successAnimation}
              />
              <Text style={styles.successMessage}>Welcome back!</Text>
              <Text style={styles.successSubMessage}>Redirecting to your dashboard...</Text>
            </View>
          )}

          {loginVisible && (
            <View style={styles.contentContainer}>
              <View style={styles.header}>
                <LottieView
                  source={require("../assets/animations/login.json")}
                  autoPlay
                  loop
                  style={styles.loginAnimation}
                />
                <Text style={styles.welcomeMessage}>Welcome Back</Text>
                <Text style={styles.subTitle}>Sign in to continue your journey</Text>
              </View>

              <View style={styles.formContainer}>
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
                    placeholder="Email address"
                    placeholderTextColor="#666"
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => handleFocus('email')}
                    onBlur={() => handleBlur('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    maxLength={30}
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
                    maxLength={12}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Feather 
                      name={showPassword ? "eye" : "eye-off"} 
                      size={20} 
                      color={isFocused.password ? "#2E8B57" : "#666"} 
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>

                {errorMessage && (
                  <CustomAlert message={errorMessage} onClose={() => setErrorMessage("")} />
                )}

                <TouchableOpacity 
                  style={styles.loginButton} 
                  onPress={onLogin}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#2E8B57', '#3CB371']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.loginButtonText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialButtonsContainer}>
                  <TouchableOpacity style={styles.socialButton}>
                    <Feather name="github" size={24} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton}>
                    <Feather name="twitter" size={24} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton}>
                    <FontAwesome name="google" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => router.push("/signup")}>
                    <Text style={styles.signupLink}>Sign up</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
    marginBottom: 40,
  },
  loginAnimation: {
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#2E8B57',
    fontSize: 14,
    fontFamily: 'SFProDisplay-Medium',
  },
  loginButton: {
    borderRadius: 10,
    overflow: 'hidden',
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
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'SFProDisplay-Semibold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(102, 102, 102, 0.3)',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: 'SFProDisplay-Regular',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(46, 139, 87, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(46, 139, 87, 0.2)',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    color: '#666',
    fontSize: 15,
    fontFamily: 'SFProDisplay-Regular',
  },
  signupLink: {
    color: '#2E8B57',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'SFProDisplay-Semibold',
  },
  alertContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  alertBox: {
    backgroundColor: 'white',
    width: width * 0.8,
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  alertIcon: {
    marginBottom: 15,
  },
  alertMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
    fontFamily: 'SFProDisplay-Medium',
    lineHeight: 24,
  },
  alertButton: {
    backgroundColor: '#FF4757',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SFProDisplay-Semibold',
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
});