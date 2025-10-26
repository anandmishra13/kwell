import React, { useEffect, useState } from 'react';
import Navigation from './navigation';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// import RNBootSplash from "react-native-bootsplash";
import BootSplash from 'react-native-bootsplash';
import SplashScreen from './screens/SplashScreen';



export default function App() {
    const [showJSSplash, setShowJSSplash] = useState(true);

  useEffect(() => {
    // Hide native splash when JS is ready
    BootSplash.hide({ fade: true });
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
