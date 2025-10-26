/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { fonts } from '../theme/fonts';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    // Navigate to next screen after 3 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" translucent />
      <LinearGradient
        colors={['#7C3AED', '#6D28D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/logo-w.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={styles.mainText}>Voice-Powered</Text>
            <Text style={styles.subText}>Emotional Insight</Text>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Wave Image */}
          <View style={styles.waveContainer}>
            <Image
              source={require('../../assets/splash/bootsplash_logo.png')}
              style={styles.waveImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7F00FF',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 150,
    paddingBottom: 0,
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  logo: {
    width: SCREEN_WIDTH * 0.45,
    height: 100,
  },
  textContainer: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  mainText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subText: {
    fontSize: 34,
    fontWeight: '300',
    color: '#FFFFFF',
    fontFamily: fonts.medium,
    opacity: 0.85,
    letterSpacing: 0.3,
  },
  spacer: {
    flex: 1,
  },
  waveContainer: {
    width: 90,
    height: 260,
    // marginLeft: -40,
    // marginBottom: -10,
  },
  waveImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
});

export default SplashScreen;