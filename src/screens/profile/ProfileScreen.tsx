import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ProfileViewModel } from './model/ProfileViewModel';
import HealthKitService from '../../services/HealthKitService';
import HeaderView from './components/header';
import { Fonts } from '../../theme/fonts';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { height, width } = Dimensions.get('window');

interface ProfileViewProps {
  switchToDashboard: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ switchToDashboard }) => {
  const [vm] = useState(() => new ProfileViewModel());
  const [bioFeedbackScore, setBioFeedbackScore] = useState<number>(0.0);
  const [improvementPercentage, setImprovementPercentage] = useState<number>(0.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Log analytics (Firebase/Facebook if implemented)
    // FIRAnalytics.logEvent('openProfile');
    // FacebookEvents.logEvent('openProfile');

    // Subscribe to ViewModel updates
    const unsubscribe = vm.subscribe((state) => {
      console.log('state', state)
      setBioFeedbackScore(state.bioFeedbackScore);
      setImprovementPercentage(state.improvementPercentage);
      setIsLoading(state.isLoading);
    });

    // Check HealthKit authorization and load data
    initializeProfile();

    return () => unsubscribe();
  }, []);

  const initializeProfile = async () => {
    try {
      const available = await HealthKitService.isAvailable();
      
      if (!available) {
        console.log('HealthKit not available');
        await vm.loadData();
        return;
      }

      const authRequested = await HealthKitService.isAuthRequested();
      
      if (!authRequested) {
        Alert.alert(
          'HealthKit Access Required',
          'To provide you with a personalized biofeedback score, we require access to your HealthKit data. This score helps you understand your overall health by using the data already on your device.\n\nRest assured, your privacy is our top priority and the information is used only to generate your biofeedback score.',
          [
            {
              text: 'Continue',
              onPress: async () => {
                const success = await HealthKitService.requestAuthorization();
                if (success) {
                  // Log analytics
                  // FIRAnalytics.logEvent('openHealthKit');
                  await vm.loadData();
                } else {
                  await vm.loadData(); // Load without HealthKit data
                }
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        // Already authorized, load data
        await vm.loadData();
        console.log('vm.loadData()', vm.loadData())
      }
    } catch (error) {
      console.error('Error initializing profile:', error);
      setIsLoading(false);
    }
  };

  const handleEULA = () => {
    Linking.openURL('https://kwell.app/dev/eula.php');
  };

  const handlePrivacy = () => {
    Linking.openURL('https://kwell.app/dev/privacy-policy.php');
  };

  const handleRecordAgain = () => {
    switchToDashboard();
  };

  const renderBiofeedbackScore = () => {
    const improvementPercentageDisplay = Math.abs(improvementPercentage).toLocaleString('en-US', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return (
      <View style={styles.biofeedbackContainer}>
        <View style={styles.scoreSection}>
          <Text style={[styles.scoreLabel, Fonts.GothamMedium]}>Biofeedback Score:</Text>
          <Text style={[styles.scoreValue, Fonts.GothamMedium]}>{bioFeedbackScore.toFixed(2)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.percentageSection}>
          {improvementPercentage !== 0 && (
            <Text style={styles.arrow}>
              {improvementPercentage < 0 ? '↓' : '↑'}
            </Text>
          )}
          <Text style={[styles.percentageValue, Fonts.GothamMedium]}>{improvementPercentageDisplay}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading your biofeedback score...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <HeaderView
            title="Your emotions"
            subtitle="at a glance"
            onEULAPress={handleEULA}
            onPrivacyPress={handlePrivacy}
          />

          {renderBiofeedbackScore()}

          <View style={styles.descriptionContainer}>
            <Text style={[styles.description, Fonts.GothamBook]}>
              Your biofeedback score is an average of four main health components under Apple
              HealthKit that include your emotional affect. You can monitor changes in your
              affect, and how it effects your score to obtain a heightened awareness of your
              overall health via changes in emotional affect.
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.recordButton} onPress={handleRecordAgain}>
            <Text style={styles.recordButtonText}>Record again</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6B00F5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: 'white',
    fontSize: 16,
  },
  biofeedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: width * 0.85,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  scoreSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  scoreLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  scoreValue: {
    color: 'white',
    fontSize: 30,
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: 'white',
    marginHorizontal: 16,
  },
  percentageSection: {
    flex: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 8,
  },
  percentageValue: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    // marginTop: 8,
    width: width * 0.85,
  },
  description: {
    color: 'white',
    fontSize: 16,
    // lineHeight: 22,
    textAlign: 'left',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
    marginTop: 32,
  },
  recordButton: {
    width: width * 0.85,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ProfileView;
