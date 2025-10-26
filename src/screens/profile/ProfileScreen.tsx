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
} from 'react-native';
import { ProfileViewModel } from './model/ProfileViewModel';
import HeaderView from './components/header';

const { height, width } = Dimensions.get('window');

interface ProfileViewProps {
  switchToDashboard: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ switchToDashboard }) => {
  const [vm] = useState(() => new ProfileViewModel());
  const [bioFeedbackScore, setBioFeedbackScore] = useState(0.0);
  const [improvementPercentage, setImprovementPercentage] = useState(0.0);

  useEffect(() => {
    // Subscribe to ViewModel updates
    const unsubscribe = vm.subscribe((state) => {
      setBioFeedbackScore(state.bioFeedbackScore);
      setImprovementPercentage(state.improvementPercentage);
    });

    // Load data on mount
    vm.loadData();

    // Log analytics (implement your analytics service)
    // FIRAnalytics.logEvent('openProfile');
    // FacebookEvents.logEvent('openProfile');

    return () => unsubscribe();
  }, []);

  const handleEULA = () => {
    Linking.openURL('https://kwell.app/dev/eula.php');
  };

  const handlePrivacy = () => {
    Linking.openURL('https://kwell.app/dev/privacy-policy.php');
  };

  const renderBiofeedbackScore = () => {
    const improvementPercentageDisplay = 
      Math.abs(improvementPercentage).toLocaleString('en-US', {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

    return (
      <View style={styles.biofeedbackContainer}>
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>Biofeedback Score:</Text>
          <Text style={styles.scoreValue}>
            {bioFeedbackScore.toFixed(2)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.percentageSection}>
          {improvementPercentage !== 0 && (
            <Text style={styles.arrow}>
              {improvementPercentage < 0 ? '↓' : '↑'}
            </Text>
          )}
          <Text style={styles.percentageValue}>
            {improvementPercentageDisplay}
          </Text>
        </View>
      </View>
    );
  };

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
            <Text style={styles.description}>
              Your biofeedback score is an average of four main health components 
              under Apple HealthKit that include your emotional affect. You can 
              monitor changes in your affect, and how it effects your score to 
              obtain a heightened awareness of your overall health via changes 
              in emotional affect.
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.recordButton}
            onPress={switchToDashboard}
          >
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
    backgroundColor: '#6B00F5', // Purple background from image
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 3,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  biofeedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: width * 0.8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 12,
    marginTop: 20,
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
    fontSize: 32,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: 'white',
    marginHorizontal: 16,
  },
  percentageSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  percentageValue: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    marginTop: 24,
    width: width * 0.8,
  },
  description: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 32,
    marginTop: 32,
  },
  recordButton: {
    width: width * 0.8,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileView;
