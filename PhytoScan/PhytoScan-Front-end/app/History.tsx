import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Image,
  Alert,
  Platform,
  Dimensions,
  TouchableOpacity,
  Modal,
  ScrollView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "../components/utils/config";
import LottieView from "lottie-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Swipeable } from "react-native-gesture-handler";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Prediction {
  id: number;
  plant_type: string;
  disease: string;
  submitted_at: string;
  image_path?: string;
}

interface TreatmentData {
  disease: string;
  confidence: string;
  confidenceLevel: string;
  treatments: string[];
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [treatmentData, setTreatmentData] = useState<TreatmentData | null>(null);
  const swipeableRefs = useRef<{[key: string]: Swipeable | null}>({});

  const API_BASE_URL = getApiBaseUrl();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const userID = await AsyncStorage.getItem("userID");

      if (!userID) {
        setErrorMsg("User not logged in.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/history/${userID}`);
      const data = await response.json();

      if (response.ok && Array.isArray(data.history)) {
        setHistory(data.history);
        setErrorMsg("");
      } else {
        setErrorMsg(data.message || "Failed to fetch history.");
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      setErrorMsg("Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTreatment = async (plantType: string, disease: string) => {
    try {
      const label = `${plantType}___${disease}`;
      const response = await fetch(
        `${API_BASE_URL}/get-treatment?label=${encodeURIComponent(label)}&confidence=0.8`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch treatments');
      }
      
      const data = await response.json();
      setTreatmentData(data);
      setShowTreatmentModal(true);
    } catch (error) {
      console.error('Error fetching treatments:', error);
      Alert.alert('Error', 'Could not load treatment suggestions. Please try again.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
      return () => {
        Object.values(swipeableRefs.current).forEach(ref => {
          if (ref) ref.close();
        });
      };
    }, [])
  );

  const formatDate = (timestamp: string): string => {
    if (!timestamp) return "Unknown Date";

    try {
      const date = new Date(timestamp.replace(" ", "T"));
      return isNaN(date.getTime()) 
        ? "Unknown Date" 
        : date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });
    } catch (err) {
      console.error("Invalid date:", err);
      return "Unknown Date";
    }
  };

  const renderRightActions = (item: Prediction) => {
    const isHealthy = item.disease.toLowerCase() === "healthy";
    
    return (
      <View style={[
        styles.actionButton, 
        isHealthy ? styles.healthyAction : styles.diseaseAction
      ]}>
        <TouchableOpacity 
          style={styles.actionContainer}
          onPress={() => fetchTreatment(item.plant_type, item.disease)}
        >
          <MaterialIcons 
            name="medical-services" 
            size={24} 
            color="white" 
          />
          <Text style={styles.actionText}>
            {isHealthy ? "Care Tips" : "Treatment"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Prediction }) => {
    const plant = item?.plant_type || "Unknown Plant";
    const disease = item?.disease || "No disease detected";
    const date = formatDate(item?.submitted_at || "");
    const isHealthy = disease.toLowerCase() === "healthy";

    return (
      <Swipeable
        ref={ref => swipeableRefs.current[item.id] = ref}
        renderRightActions={() => renderRightActions(item)}
        rightThreshold={40}
        onSwipeableWillOpen={() => {
          Object.keys(swipeableRefs.current).forEach(key => {
            if (key !== item.id.toString() && swipeableRefs.current[key]) {
              swipeableRefs.current[key]?.close();
            }
          });
        }}
      >
        <LinearGradient
          colors={["#FFFFFF", "#F8F9FF"]}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {item.image_path && (
            <Image
              source={{ uri: `${API_BASE_URL}${item.image_path}` }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          )}
          
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={[
                styles.iconContainer,
                isHealthy ? styles.healthyIcon : styles.diseaseIcon
              ]}>
                <Ionicons 
                  name="leaf" 
                  size={20} 
                  color="white" 
                />
              </View>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {plant}
              </Text>
            </View>
            
            <View style={styles.diseaseContainer}>
              <Ionicons 
                name={isHealthy ? "checkmark-circle" : "bug"} 
                size={16} 
                color={isHealthy ? "#2E8B57" : "#D32F2F"} 
              />
              <Text 
                style={[
                  styles.subtitle,
                  isHealthy ? styles.healthyText : styles.diseaseText
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {disease.replace(/_/g, " ")}
              </Text>
            </View>
            
            <View style={styles.dateContainer}>
              <Ionicons name="time" size={14} color="#757575" />
              <Text style={styles.date}>{date}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => fetchTreatment(item.plant_type, item.disease)}
          >
            <Ionicons name="chevron-forward" size={20} color="#88889D" />
          </TouchableOpacity>
        </LinearGradient>
      </Swipeable>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <LottieView
        source={require("../assets/animations/empty.json")}
        autoPlay
        loop
        style={styles.emptyAnimation}
      />
      <Text style={styles.emptyTitle}>No History Found</Text>
      <Text style={styles.emptyText}>
        Your plant analysis history will appear here
      </Text>
      <TouchableOpacity 
        onPress={fetchHistory} 
        style={styles.refreshButton}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient 
        colors={["#F8F9FF", "#EFF1FF"]} 
        style={styles.container}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Prediction History</Text>
          <TouchableOpacity 
            onPress={fetchHistory} 
            style={styles.refreshIcon}
          >
            <Ionicons name="refresh" size={24} color="#2E8B57" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <LottieView
              source={require("../assets/animations/loading.json")}
              autoPlay
              loop
              style={styles.loadingAnimation}
            />
            <Text style={styles.loadingText}>Loading your history...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.errorContainer}>
            <LottieView
              source={require("../assets/animations/error.json")}
              autoPlay
              loop={false}
              style={styles.errorAnimation}
            />
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity 
              onPress={fetchHistory} 
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={history}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#2E8B57"]}
                tintColor="#2E8B57"
                progressBackgroundColor="#FFFFFF"
              />
            }
            contentContainerStyle={
              history.length === 0 ? styles.flatlistCenter : styles.listContainer
            }
            ListEmptyComponent={renderEmptyComponent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {/* Treatment Modal */}
        <Modal visible={showTreatmentModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setShowTreatmentModal(false)}
              >
                <Ionicons name="close" size={24} color="#2E8B57" />
              </TouchableOpacity>
              
              <Text style={styles.modalTitle}>
                {treatmentData?.disease.replace(/_/g, ' ') === 'Healthy' 
                  ? 'Plant Care Tips' 
                  : 'Treatment'}
              </Text>
              
              {treatmentData && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalSubtitle}>
                      {treatmentData.disease.replace(/_/g, ' ')}
                    </Text>
                    <Text style={styles.modalConfidence}>
                      Confidence: {treatmentData.confidence} ({treatmentData.confidenceLevel})
                    </Text>
                  </View>
                  
                  <ScrollView style={styles.treatmentScrollView}>
                    <View style={styles.treatmentList}>
                      {treatmentData.treatments.length > 0 ? (
                        treatmentData.treatments.map((treatment, index) => (
                          <View key={index} style={styles.treatmentItem}>
                            <Text style={styles.treatmentBullet}>•</Text>
                            <Text style={styles.treatmentText}>{treatment}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noTreatmentText}>
                          No specific treatment needed - your plant appears healthy!
                        </Text>
                      )}
                    </View>
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2D2D48",
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  },
  refreshIcon: {
    padding: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#2E8B57",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    minHeight: 100,
  },
  cardImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  healthyIcon: {
    backgroundColor: "#2E8B57",
  },
  diseaseIcon: {
    backgroundColor: "#D32F2F",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D2D48",
    flex: 1,
  },
  diseaseContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  healthyText: {
    color: "#2E8B57",
    fontWeight: '500',
  },
  diseaseText: {
    color: "#D32F2F",
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  date: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 8,
  },
  detailsButton: {
    padding: 8,
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 30,
  },
  flatlistCenter: {
    flexGrow: 1,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingAnimation: {
    width: 180,
    height: 180,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#616161",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 20,
  },
  emptyAnimation: {
    width: 250,
    height: 250,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2E8B57",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#757575",
    marginTop: 8,
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorAnimation: {
    width: 150,
    height: 150,
  },
  errorText: {
    fontSize: 16,
    color: "#D32F2F",
    marginTop: 16,
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 24,
  },
  refreshButton: {
    backgroundColor: "#2E8B57",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#2E8B57",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  separator: {
    height: 12,
  },
  actionButton: {
    width: 90,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginLeft: 8,
  },
  healthyAction: {
    backgroundColor: '#2E8B57',
  },
  diseaseAction: {
    backgroundColor: '#D32F2F',
  },
  actionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  modalCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2D2D48",
    marginBottom: 16,
    textAlign: "center",
  },
  modalHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E8B57",
    textAlign: "center",
    marginBottom: 4,
  },
  modalConfidence: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
  },
  treatmentScrollView: {
    maxHeight: Dimensions.get('window').height * 0.5,
  },
  treatmentList: {
    paddingHorizontal: 8,
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
    color: '#2D2D48',
    lineHeight: 22,
  },
  noTreatmentText: {
    fontSize: 16,
    color: '#2E8B57',
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
});