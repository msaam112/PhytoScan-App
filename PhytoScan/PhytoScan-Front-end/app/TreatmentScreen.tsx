import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getApiBaseUrl } from '@/components/utils/config';

interface TreatmentData {
  disease: string;
  confidence: string;
  confidenceLevel: string;
  treatments: string[];
  isHealthy: boolean;
}

export default function TreatmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [treatmentData, setTreatmentData] = useState<TreatmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = getApiBaseUrl();

  useEffect(() => {
    const fetchTreatment = async () => {
      try {
        const { label, confidence } = params;
        
        if (!label || !confidence) {
          throw new Error('Missing prediction data');
        }

        const confidenceNum = parseFloat(confidence as string) / 100;
        
        const response = await fetch(
          `${API_BASE_URL}/get-treatment?label=${encodeURIComponent(label as string)}&confidence=${confidenceNum}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch treatments');
        }
        
        const data = await response.json();
        setTreatmentData(data);
      } catch (error) {
        console.error('Error:', error);
        alert('Error');
      } finally {
        setLoading(false);
      }
    };

    fetchTreatment();
  }, [params]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading treatment suggestions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      {treatmentData ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Treatment Plan</Text>
          
          <View style={styles.diseaseCard}>
            <Text style={styles.diseaseName}>
              {treatmentData.disease.replace(/_/g, ' ')}
            </Text>
            <Text style={styles.confidenceText}>
              Confidence: {treatmentData.confidence} ({treatmentData.confidenceLevel})
            </Text>
          </View>

          {treatmentData.isHealthy ? (
            <View style={styles.healthyContainer}>
              <Text style={styles.healthyText}>Your plant is healthy!</Text>
              <Text style={styles.healthySubText}>
                No treatments needed. Continue with your current care routine.
              </Text>
            </View>
          ) : (
            <View style={styles.treatmentsContainer}>
              <Text style={styles.sectionTitle}>Recommended Treatments</Text>
              {treatmentData.treatments.map((treatment, index) => (
                <View key={index} style={styles.treatmentItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.treatmentText}>{treatment}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No treatment data available</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4CAF50',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 20,
    padding: 10,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D2D48',
    marginBottom: 24,
    textAlign: 'center',
  },
  diseaseCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  diseaseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#388E3C',
    textAlign: 'center',
  },
  confidenceText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
  },
  healthyContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  healthyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
  },
  healthySubText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  treatmentsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D48',
    marginBottom: 16,
  },
  treatmentItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bullet: {
    fontSize: 20,
    color: '#4CAF50',
    marginRight: 8,
  },
  treatmentText: {
    flex: 1,
    fontSize: 15,
    color: '#2D2D48',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4B2B',
  },
});