import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Animated,
  Dimensions,
  Easing,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CustomAlert from "@/components/CustomAlert";
import * as Location from 'expo-location';
import Svg, { Path } from 'react-native-svg';

// Color Theme
const COLORS = {
  primary: {
    disease: '#FF6B6B',     // Coral Red
    type: '#2E8B57',        // SeaGreen
    feedback: '#6C5CE7',    // Purple
    weather: '#4D8AF0',     // Blue
  },
  weather: {
    hot: '#FFA726',         // Orange
    cold: '#87CEEB',        // Sky Blue
    rain: '#4D8AF0',        // Blue
    snow: '#B0E0E6',        // Powder Blue
    fog: '#A9A9A9',         // Dark Gray
    default: '#2E8B57',
  },
  backgrounds: {
    light: '#F8F9FA',
    card: '#FFFFFF',
  },
  text: {
    dark: '#2D3436',
    light: '#FFFFFF',
  },
  accents: {
    success: '#4CAF50',     // Green
    warning: '#FFD700',     // Yellow
    error: '#EF5350',       // Red
  },
};

type WeatherIconName = 
  | 'weather-sunny' 
  | 'weather-cloudy' 
  | 'weather-rainy' 
  | 'weather-pouring' 
  | 'weather-lightning-rainy' 
  | 'weather-snowy' 
  | 'weather-fog' 
  | 'weather-hail' 
  | 'weather-hurricane' 
  | 'weather-partly-cloudy';

interface Feature {
  name: string;
  icon: "leaf" | "flower" | "comment-text" | WeatherIconName;
  description: string;
  details: string;
  color: string;
}

interface WeatherData {
  temp: number;
  humidity: number;
  condition: string;
  icon: WeatherIconName;
  feels_like: number;
  color: string;
}

const { width } = Dimensions.get('window');

const FEATURES: Feature[] = [
  {
    name: "Disease",
    icon: "leaf",
    description: "AI-Powered Detection",
    details: "Instant plant health analysis with our advanced AI technology.",
    color: COLORS.primary.disease
  },
  {
    name: "Type",
    icon: "flower",
    description: "Species Recognition",
    details: "Identify plants instantly using your camera.",
    color: COLORS.primary.type
  },
  {
    name: "Feedback",
    icon: "comment-text",
    description: "Provide Feedback",
    details: "Help us improve by sharing your experience.",
    color: COLORS.primary.feedback
  },
  {
    name: "Weather",
    icon: "weather-cloudy",
    description: "Local Conditions",
    details: "Real-time weather data for your plants.",
    color: COLORS.primary.weather
  },
];

const API_KEY = "dabbac8d0962bf83f7ef8acdecad1141";

const LeafBackground = () => (
  <Svg width="100%" height="100%" viewBox="0 0 1440 320" style={styles.leafBackground}>
    <Path 
      fill={COLORS.backgrounds.light} 
      fillOpacity="0.9" 
      d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
    />
  </Svg>
);

export default function Home() {
  const [alertVisible, setAlertVisible] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [refreshingWeather, setRefreshingWeather] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleValues = useRef(FEATURES.map(() => new Animated.Value(1))).current;
  const weatherOpacity = useRef(new Animated.Value(0)).current;
  const translateYValues = useRef(FEATURES.map(() => new Animated.Value(20))).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const getWeatherIcon = (weatherId: number): WeatherIconName => {
    if (weatherId >= 200 && weatherId < 300) return 'weather-lightning-rainy';
    if (weatherId >= 300 && weatherId < 400) return 'weather-pouring';
    if (weatherId >= 500 && weatherId < 600) return 'weather-rainy';
    if (weatherId >= 600 && weatherId < 700) return 'weather-snowy';
    if (weatherId >= 700 && weatherId < 800) return 'weather-fog';
    if (weatherId === 800) return 'weather-sunny';
    if (weatherId === 801) return 'weather-partly-cloudy';
    if (weatherId > 801) return 'weather-cloudy';
    return 'weather-cloudy';
  };

  const getWeatherColor = (weatherId: number, temp: number): string => {
    if (temp > 30) return COLORS.weather.hot;
    if (temp < 10) return COLORS.weather.cold;
    if (weatherId >= 200 && weatherId < 300) return COLORS.weather.default;
    if (weatherId >= 300 && weatherId < 600) return COLORS.weather.rain;
    if (weatherId >= 600 && weatherId < 700) return COLORS.weather.snow;
    if (weatherId >= 700 && weatherId < 800) return COLORS.weather.fog;
    return COLORS.weather.default;
  };

  const fetchWeatherData = useCallback(async () => {
    try {
      setLoadingWeather(true);
      setLocationError(null);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        setLoadingWeather(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
      );
      const data = await response.json();

      if (data.cod === 200) {
        setWeather({
          temp: Math.round(data.main.temp),
          humidity: data.main.humidity,
          condition: data.weather[0].main,
          icon: getWeatherIcon(data.weather[0].id),
          feels_like: Math.round(data.main.feels_like),
          color: getWeatherColor(data.weather[0].id, data.main.temp),
        });
        
        Animated.timing(weatherOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      } else {
        setLocationError('Could not fetch weather data');
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      setLocationError('Error fetching weather data');
    } finally {
      setLoadingWeather(false);
      setRefreshingWeather(false);
    }
  }, []);

  const refreshWeather = () => {
    setRefreshingWeather(true);
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
    fetchWeatherData();
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    FEATURES.forEach((_, index) => {
      Animated.spring(translateYValues[index], {
        toValue: 0,
        delay: index * 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    });

    fetchWeatherData();
  }, [fetchWeatherData]);

  const getWeatherRecommendation = () => {
    if (!weather) return "Fetching weather data...";
    
    const { temp, humidity, condition } = weather;
    
    if (condition.includes('Rain')) {
      return "Rainy day - no need to water your plants!";
    }
    if (temp > 30) {
      return "Hot day - water plants early morning or late evening.";
    }
    if (temp < 10) {
      return "Cold day - protect sensitive plants from frost.";
    }
    if (humidity > 80) {
      return "Humid conditions - reduce watering frequency.";
    }
    return "Good day for plant care activities!";
  };

  const animatePress = (index: number, value: number) => {
    Animated.spring(scaleValues[index], {
      toValue: value,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const showFeatureDetails = (feature: Feature) => {
    setSelectedFeature(feature);
    setAlertVisible(true);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.container}>
      <LeafBackground />
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim }}
      >
        {/* Hero Section */}
        <ImageBackground
          source={require("@/assets/images/plant.jpeg")}
          style={styles.heroImage}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay}>
            <Text style={styles.appName}>PhytoScan</Text>
            <Text style={styles.appTagline}>Your Intelligent Plant Companion</Text>
          </View>
        </ImageBackground>

        {/* Feature Grid */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Main Features</Text>
          <View style={styles.gridContainer}>
            {FEATURES.map((feature, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.featureCard,
                  { 
                    transform: [
                      { scale: scaleValues[index] },
                      { translateY: translateYValues[index] }
                    ],
                    borderColor: `${feature.color}30`,
                    shadowColor: feature.color,
                  }
                ]}
              >
                <TouchableOpacity
                  onPressIn={() => animatePress(index, 0.95)}
                  onPressOut={() => animatePress(index, 1)}
                  onPress={() => showFeatureDetails(feature)}
                  style={styles.featureContent}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${feature.color}10` }]}>
                    <MaterialCommunityIcons
                      name={feature.icon}
                      size={32}
                      color={feature.color}
                    />
                  </View>
                  <Text style={[styles.featureTitle, { color: feature.color }]}>
                    {feature.name}
                  </Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Weather Card */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="weather-cloudy" size={28} color={COLORS.primary.weather} />
          <Text style={styles.sectionTitle}>Garden Weather</Text>
        </View>
        
        <Animated.View style={[styles.weatherCard, { 
          opacity: weatherOpacity,
          borderColor: weather ? `${weather.color}30` : `${COLORS.weather.default}30`,
          shadowColor: weather?.color || COLORS.weather.default
        }]}>
          {loadingWeather ? (
            <ActivityIndicator size="large" color={COLORS.primary.weather} style={styles.weatherLoading} />
          ) : locationError ? (
            <Text style={styles.weatherError}>{locationError}</Text>
          ) : weather ? (
            <>
              <View style={styles.weatherHeader}>
                <View style={styles.weatherIconContainer}>
                  <MaterialCommunityIcons 
                    name={weather.icon} 
                    size={48} 
                    color={weather.color} 
                  />
                  <Text style={[styles.weatherTemp, { color: weather.color }]}>{weather.temp}°C</Text>
                </View>
                <View style={styles.weatherDetails}>
                  <View style={styles.weatherDetailItem}>
                    <MaterialCommunityIcons name="water-percent" size={24} color={COLORS.primary.weather} />
                    <Text style={styles.weatherDetailText}>{weather.humidity}% Humidity</Text>
                  </View>
                  <View style={styles.weatherDetailItem}>
                    <MaterialCommunityIcons name="weather-windy" size={24} color={COLORS.primary.weather} />
                    <Text style={styles.weatherDetailText}>{weather.condition}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={refreshWeather} style={styles.refreshButton}>
                  <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                    <MaterialCommunityIcons 
                      name="refresh" 
                      size={28} 
                      color={refreshingWeather ? COLORS.primary.weather : COLORS.text.dark} 
                    />
                  </Animated.View>
                </TouchableOpacity>
              </View>
              <View style={styles.weatherTipContainer}>
                <MaterialCommunityIcons name="lightbulb-on" size={24} color={COLORS.accents.warning} />
                <Text style={styles.weatherTip}>{getWeatherRecommendation()}</Text>
              </View>
            </>
          ) : null}
        </Animated.View>

        {/* Tips Section */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="lightbulb-on" size={28} color={COLORS.accents.warning} />
          <Text style={styles.sectionTitle}>Gardening Tips</Text>
        </View>
        <View style={styles.tipsContainer}>
          {[
            "Water plants early morning to reduce evaporation",
            "Use organic fertilizers for healthier growth",
            "Rotate plants periodically for even sunlight",
            "Prune dead leaves to encourage new growth"
          ].map((tip, index) => (
            <View key={index} style={[styles.tipItem, { backgroundColor: `${COLORS.primary.type}08` }]}>
              <View style={[styles.tipBullet, { backgroundColor: COLORS.primary.type }]}>
                <Text style={styles.tipBulletText}>{index + 1}</Text>
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: COLORS.primary.type }]}>🌱 Powered by PhytoScan</Text>
        </View>
      </Animated.ScrollView>

      {/* Custom Alert */}
      {selectedFeature && (
        <CustomAlert
          visible={alertVisible}
          title={selectedFeature.name}
          message={selectedFeature.details}
          onClose={() => setAlertVisible(false)}
          themeColor={selectedFeature.color}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgrounds.light,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  leafBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  heroImage: {
    height: 280,
    borderRadius: 16,
    margin: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.primary.type,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
  },
  appName: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.text.light,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 8,
  },
  appTagline: {
    fontSize: 20,
    color: COLORS.text.light,
    marginTop: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.dark,
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  featuresContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    backgroundColor: COLORS.backgrounds.card,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  featureContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#4A6860',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  weatherCard: {
    backgroundColor: COLORS.backgrounds.card,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 24,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  weatherIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherTemp: {
    fontSize: 32,
    fontWeight: '700',
    marginLeft: 16,
  },
  weatherDetails: {
    flex: 1,
    marginLeft: 24,
  },
  weatherDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherDetailText: {
    fontSize: 16,
    color: COLORS.text.dark,
    marginLeft: 12,
    fontWeight: '500',
  },
  refreshButton: {
    padding: 8,
    marginLeft: 16,
  },
  weatherLoading: {
    marginVertical: 32,
  },
  weatherError: {
    color: COLORS.accents.error,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 24,
  },
  weatherTipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: `${COLORS.primary.weather}20`,
  },
  weatherTip: {
    fontSize: 16,
    color: COLORS.text.dark,
    marginLeft: 16,
    flex: 1,
    lineHeight: 24,
  },
  tipsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    borderRadius: 16,
    padding: 20,
  },
  tipBullet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipBulletText: {
    color: COLORS.text.light,
    fontWeight: '700',
    fontSize: 16,
  },
  tipText: {
    fontSize: 16,
    color: COLORS.text.dark,
    flex: 1,
    lineHeight: 24,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 24,
    borderTopWidth: 2,
    borderTopColor: `${COLORS.primary.type}20`,
  },
  footerText: {
    marginBottom: 50,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});