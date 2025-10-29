import React, { useEffect, useState } from 'react';
import Navigation from './navigation';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// import RNBootSplash from "react-native-bootsplash";
import BootSplash from 'react-native-bootsplash';
import SplashScreen from './screens/SplashScreen';
import { NativeModules, Platform } from 'react-native';
import AppleHealthKit from 'react-native-health';


export default function App() {
    const [showJSSplash, setShowJSSplash] = useState(true);

  useEffect(() => {
    // Hide native splash when JS is ready
    BootSplash.hide({ fade: true });
  //   if (Platform.OS === 'ios') {
  //   console.log('=== DEBUG ===');
  //   console.log('AppleHealthKit import:', AppleHealthKit);
  //   console.log('AppleHealthKit.initHealthKit:', AppleHealthKit?.initHealthKit);
  //   console.log('Available methods:', Object.keys(AppleHealthKit || {}));
  //   console.log('NativeModules.RNAppleHealthKit:', NativeModules.RNAppleHealthKit);
  //   console.log('=== END DEBUG ===');
  // }
  }, []);

  if (showJSSplash) {
    return <SplashScreen onFinish={() => setShowJSSplash(false)} />;
  }


  return (
    <SafeAreaProvider>
      <SubscriptionProvider>
        <Navigation />
      </SubscriptionProvider>
    </SafeAreaProvider>
  );
}
