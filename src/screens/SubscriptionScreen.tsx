import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { fonts } from '../theme/fonts';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HealthKitService } from '../services/HealthKitService';

type RootStackParamList = {
  Splash: undefined;
  Subscription: undefined;
  MainTabs: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Subscription'>;



interface Subscription {
  id: string;
  title: string;
  price: string;
}

const DEMO_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'monthly',
    title: 'Monthly',
    price: '799',
  },
  {
    id: 'yearly',
    title: 'Yearly',
    price: '3,999',
  },
];

// interface SubscriptionsViewProps {
//   onNavigateToHome: () => void;
// }

const SubscriptionsView: React.FC<Props> = ({ navigation }) => {
  const [selectedProduct, setSelectedProduct] = useState<Subscription>(DEMO_SUBSCRIPTIONS[0]);
  const [isfetchAmount, setIsFetchAmount] = useState<boolean>(false);
  const [healthKitAvailable, setHealthKitAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const healthKitService = new HealthKitService();

  useEffect(() => {
    initializeHealthKit();
    setTimeout(() => {
      setIsFetchAmount(true);
    }, 3000);
  }, [])

  const initializeHealthKit = async () => {
    try {
      // Check if HealthKit is available on this device
      // const available = await healthKitService.isAvailable();
      // setHealthKitAvailable(available);
      
      // if (!available) {
      //   console.log('HealthKit is not available on this device');
      //   setIsLoading(false);
      //   return;
      // }

      // Check if we've already requested permission
      const authStatus = await healthKitService.getHealthKitAuthStatus();
      
      if (!authStatus) {
        // Show alert and request permission
        await requestHealthKitPermission();
      } else {
        console.log('HealthKit already authorized');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error initializing HealthKit:', error);
      setIsLoading(false);
    }
  };

  const requestHealthKitPermission = async () => {
    try {
      setIsLoading(true);
      
      // Request HealthKit authorization
      await healthKitService.requestAuthorization();
      
      // Log analytics event
      // FIRAnalytics.logEvent(FIRAnalyticsEvent.openHealthKit);
      
      console.log('✅ HealthKit permission granted successfully');
      setIsLoading(false);
      
      // Optional: Show success message
      Alert.alert(
        'Success',
        'HealthKit access granted! Your biofeedback score will now be calculated.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error requesting HealthKit permission:', error);
      setIsLoading(false);
      
      Alert.alert(
        'Permission Denied',
        'HealthKit access was not granted. You can enable it later in Settings.',
        [{ text: 'OK' }]
      );
    }
  };


  const handlePurchase = () => {
    console.log('Starting free trial for:', selectedProduct.title);
    // Handle purchase logic here when implementing real IAP
  };

  const handleRestorePurchases = () => {
    navigation.replace('MainTabs');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Setting up HealthKit...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#7C3AED', '#6D28D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      <View style={styles.content}>
        <View style={styles.textContent}>
          <Text style={styles.title}>
            Your emotions are talking. Are you listening?
          </Text>

          <View style={styles.bulletPoints}>
            <View style={styles.bulletItem}>
              <View style={styles.checkmarkCircle}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.bulletText}>
                Track your emotional patterns over time.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <View style={styles.checkmarkCircle}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.bulletText}>
                Receive tailored insights to improve sleep, focus and calm.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <View style={styles.checkmarkCircle}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.bulletText}>
                Get personalized binaural audio based on your voice.
              </Text>
            </View>
          </View>

          <View style={styles.tagline}>
            <Text style={styles.taglineText}>
              Kwell transforms your voice into wellness guidance.
            </Text>
            <Text style={styles.taglineText}>Start your journey today.</Text>
          </View>
        </View>

        <View style={styles.bottomSheetContainer}>
          <View style={styles.freeTrialBadge}>
            <Text style={styles.freeTrialText}>FREE FOR 3 DAYS</Text>
          </View>

          <View style={styles.bottomSheet}>
            <View style={styles.subscriptionOptions}>
              {!isfetchAmount ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
                  <ActivityIndicator color="#fffff" size="large" />
                </View>
              ) : (
                DEMO_SUBSCRIPTIONS.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.optionButton,
                      selectedProduct.id === product.id && styles.selectedOption,
                    ]}
                    onPress={() => setSelectedProduct(product)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioButton,
                        selectedProduct.id === product.id && styles.radioButtonSelected,
                      ]}
                    >
                      {selectedProduct.id === product.id && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.priceText}>
                        <Text style={styles.currencySymbol}>₹</Text>
                        <Text> {product.price} - {product.title}</Text>
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            <TouchableOpacity
              style={styles.purchaseButton}
              onPress={handlePurchase}
              activeOpacity={0.8}
            >
              <Text style={styles.purchaseButtonText}>Start Free Trial</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestorePurchases}
              activeOpacity={0.7}
            >
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            </TouchableOpacity>

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                Cancel anytime - no charge during trial
              </Text>
              <Text style={styles.disclaimerText}>
                No ads. No data selling. Just insight.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7C3AED',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  textContent: {
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 20,
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
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    fontFamily: fonts.bold,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  bulletPoints: {
    marginBottom: 0,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  checkmarkCircle: {
    width: 16,
    height: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 10,
    color: '#7C3AED',
    fontWeight: '700',
  },
  bulletText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    flex: 1,
    fontWeight: '600',
    lineHeight: 21,
  },
  tagline: {
    alignItems: 'center',
  },
  taglineText: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.95,
    lineHeight: 20,
    fontFamily: fonts.medium,
  },
  bottomSheetContainer: {
    position: 'absolute',
    bottom: -50,
    left: 0,
    right: 0,
    paddingLeft: 30,
    paddingRight: 30
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  freeTrialBadge: {
    position: 'absolute',
    top: -18,
    alignSelf: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  freeTrialText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    fontFamily: fonts.bold,
  },
  subscriptionOptions: {
    marginBottom: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  selectedOption: {
    borderColor: '#7C3AED',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  radioButtonSelected: {
    borderColor: '#7C3AED',
    borderWidth: 1,
  },
  radioButtonInner: {
    width: 14,
    height: 14,
    borderRadius: 6,
    backgroundColor: '#7C3AED',
  },
  optionTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  priceText: {
    fontSize: 13,
    display: 'flex',
    flexDirection: 'row',
    color: '#1F2937',
    fontWeight: '400',
    fontFamily: fonts.bold,
  },
  currencySymbol: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  purchaseButton: {
    height: 54,
    backgroundColor: '#7C3AED',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  purchaseButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
    fontFamily: fonts.bold,
  },
  disclaimer: {
    alignItems: 'center',
    gap: 4,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#050505ff',
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: fonts.medium,
  },
});

export default SubscriptionsView;