import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import {
  check,
  openSettings,
  PERMISSIONS,
  request,
  RESULTS,
} from 'react-native-permissions';
import { Recorder } from '@react-native-community/audio-toolkit';
import DeviceInfo from 'react-native-device-info';
import Svg, { Circle } from 'react-native-svg';
import HealthKitService from '../services/HealthKitService';
import { Fonts } from '../theme/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RECORDING_DURATION = 5;
const MINIMUM_RECORDING_DURATION = 3;

const BASE_URL = __DEV__
  ? 'https://devapi.qwell.app/api/'
  : 'https://api.qwell.app/api/';

const HomeScreen = () => {
  const [state, setState] = useState<'idle' | 'recording' | 'processing' | 'completed'>('idle');
  const [timeRemaining, setTimeRemaining] = useState(RECORDING_DURATION);
  const [detectedResult, setDetectedResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);


  const recorderRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioFilePath = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);

  const permissionType = Platform.select({
    ios: PERMISSIONS.IOS.MICROPHONE,
    android: PERMISSIONS.ANDROID.RECORD_AUDIO,
  });



  useEffect(() => {
    checkPermission();
    return () => {
      stopTimer();
      cleanupRecording();
    };
  }, []);

  const checkPermission = async () => {
    if (!permissionType) {
      return;
    }
    const status = await check(permissionType);
    setPermissionStatus(status);
    handlePermissionStatus(status, true);
  };

  const requestPermission = async () => {
    if (!permissionType) {
      return;
    }
    const status = await request(permissionType);
    setPermissionStatus(status);
    handlePermissionStatus(status, false);
  };

  const handlePermissionStatus = (status: string, isInitialCheck: boolean) => {
    switch (status) {
      case RESULTS.UNAVAILABLE:
        Alert.alert('Microphone not available on this device.');
        break;
      case RESULTS.DENIED:
        if (!isInitialCheck) {
          Alert.alert(
            'Permission Denied',
            'Microphone access is required to record and detect emotions. Would you like to allow it?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Allow', onPress: requestPermission },
            ]
          );
        }
        break;
      case RESULTS.BLOCKED:
        Alert.alert(
          'Permission Blocked',
          'Microphone access is blocked. Please enable it manually in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => openSettings(),
            },
          ]
        );
        break;
      case RESULTS.GRANTED:
        console.log('✅ Microphone permission granted');
        break;
      case RESULTS.LIMITED:
        console.log('⚠️ Microphone permission limited');
        break;
      default:
        Alert.alert('Unknown permission status');
    }
  };

  const startRecording = async () => {
    try {
      // Check permission before recording
      if (permissionStatus !== RESULTS.GRANTED) {
        await requestPermission();
        return;
      }

      reset();
      setState('recording');

      const fileName = `recording_${Date.now()}.mp4`;
      audioFilePath.current = fileName;

      recorderRef.current = new Recorder(fileName, {
        bitrate: 256000,
        channels: 2,
        sampleRate: 44100,
        quality: 'high',
        format: 'mp4',
        encoder: 'mp4'
      });

      recorderRef.current.prepare((err: any) => {
        if (err) {
          console.error('Prepare error:', err);
          Alert.alert('Error', 'Unable to start recording. Please check microphone permissions.');
          reset();
          return;
        }

        recorderRef.current.record((err: any) => {
          if (err) {
            console.error('Record error:', err);
            Alert.alert('Error', 'Unable to start recording.');
            reset();
            return;
          }

          startTimeRef.current = Date.now();
          startTimer();
          console.log('🎙 Recording started');
        });
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Unable to start recording.');
      reset();
    }
  };

  const stopRecording = async () => {
    try {
      if (!recorderRef.current) {
        console.log('No recording to stop');
        return;
      }

      stopTimer();

      const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;

      if (elapsedSeconds < MINIMUM_RECORDING_DURATION) {
        recorderRef.current.stop(() => {
          recorderRef.current.destroy();
          recorderRef.current = null;
        });

        Alert.alert(
          'Too Short',
          `Please record for at least ${MINIMUM_RECORDING_DURATION} seconds.`
        );
        reset();
        return;
      }

      recorderRef.current.stop((err: any) => {
        if (err) {
          console.error('Stop error:', err);
          Alert.alert('Error', 'Failed to stop recording.');
          reset();
          return;
        }

        console.log('🎧 Recording stopped:', audioFilePath.current);
        const path = recorderRef.current.fsPath;
        console.log('File path:', path);

        recorderRef.current.destroy();
        recorderRef.current = null;

        setState('processing');
        uploadAndDetect(path);
      });
    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', 'Failed to stop recording.');
      await cleanupRecording();
      reset();
    }
  };

  const cleanupRecording = async () => {
    try {
      if (recorderRef.current) {
        recorderRef.current.stop(() => {
          recorderRef.current.destroy();
          recorderRef.current = null;
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  const startTimer = () => {
    const start = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const remaining = Math.max(0, RECORDING_DURATION - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        stopRecording();
      }
    }, 100);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const uploadAndDetect = async (filePath: string) => {
  try {
    if (!filePath) {
      throw new Error('No audio file found');
    }

    setIsLoading(true);

    // Get device ID
    const deviceId = await DeviceInfo.getUniqueId();

    // Use FormData
    const formData = new FormData();
    formData.append('file', {
      uri: filePath,
      type: 'audio/x-m4a',
      name: 'recording.m4a',
    } as any);
    formData.append('device_id', deviceId);

    console.log('📤 Uploading audio...');
    const uploadRes = await fetch(`${BASE_URL}upload-to-spaces/`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
      },
      body: formData,
    });

    const responseText = await uploadRes.text();
    console.log('Upload response body:', responseText);

    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${uploadRes.status} - ${responseText}`);
    }

    let uploadData;
    try {
      uploadData = JSON.parse(responseText);
    } catch (error) {
      throw new Error(`Failed to parse upload response: ${responseText} log error ${error}`);
    }

    const uploadId = uploadData?.ID || uploadData?.id;
    
    if (!uploadId) {
      throw new Error(`Upload failed - no ID returned`);
    }

    console.log('✅ Upload successful, ID:', uploadId);

    // Call detect API
    console.log('📊 Calling detect API...');
    const detectRes = await fetch(`${BASE_URL}detect/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({ id: uploadId }),
    });

    const detectText = await detectRes.text();
    console.log('Detect response body:', detectText);

    if (!detectRes.ok) {
      throw new Error(`Detection failed: ${detectRes.status} - ${detectText}`);
    }

    let detectData;
    try {
      detectData = JSON.parse(detectText);
    } catch (e) {
      throw new Error(`Failed to parse detect response: ${detectText} ${e}`);
    }

    console.log('✅ Detection successful:', detectData);

    // ⭐ NEW: Save mindful session to HealthKit (matching Swift logic)
    if (detectData?.result) {
      const emotionPoints = detectData.result.max_emotion_points || 0;
      const duration = Math.abs(emotionPoints * 600 + 5); // Same formula as Swift
      
      console.log(`💚 Saving mindful session: ${duration} seconds (emotion points: ${emotionPoints})`);
      
      try {
        await HealthKitService.addMindfulSession(duration);
        console.log('✅ Mindful session saved to HealthKit');
      } catch (error) {
        console.error('⚠️ Failed to save mindful session:', error);
        // Don't fail the whole flow if HealthKit save fails
      }
    }

    setDetectedResult(detectData);
    setState('completed');

    // ⭐ NEW: Trigger profile refresh (optional but recommended)
    // This notifies the ProfileScreen to reload
    // You can use React Navigation params or EventEmitter
    
  } catch (error) {
    console.error('Detection error:', error);
    Alert.alert('Error', `Failed to analyze your voice: ${error.message}`);
    reset();
  } finally {
    setIsLoading(false);
  }
};

  const reset = () => {
    setState('idle');
    setDetectedResult(null);
    setTimeRemaining(RECORDING_DURATION);
    audioFilePath.current = null;
    stopTimer();
  };

  const getButtonTitle = () => {
    if (state === 'recording') return 'Stop Recording';
    if (state === 'processing') return 'Record again';
    if (state === 'completed') return 'Record again';
    return 'Start Recording';
  };

  const handlePress = () => {
    if (state === 'recording') {
      stopRecording();
    } else if (state === 'completed' || state === 'idle') {
      startRecording();
    }
  };

  const renderCircle = () => {
    const radius = (SCREEN_WIDTH * 0.52) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = timeRemaining / RECORDING_DURATION;
    const dashOffset = circumference * (1 - progress);

    return (
      <View style={styles.centerContent}>
        <Svg height={SCREEN_WIDTH * 0.52} width={SCREEN_WIDTH * 0.52}>
          <Circle
            cx={radius}
            cy={radius}
            r={radius - 10}
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="6"
            fill="none"
          />
          <Circle
            cx={radius}
            cy={radius}
            r={radius - 10}
            stroke="white"
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${radius}, ${radius}`}
          />
        </Svg>
        <Text style={[styles.timerText, Fonts.GothamBold]}>0{Math.ceil(timeRemaining)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo-w.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity 
        onPress={() => Alert.alert(
          'Disclaimer', 
          "The information provided by the Kwell app is for informational purposes only. It is not a substitute for professional medical advice, diagnosis or treatment. You should always seek advice from a doctor or other qualified healthcare provider regarding any health concerns or before making any decisions about your health based on information you've read or heard, as the information provided is not a substitute for professional medical advice.",
          [{text: "I Understand"}]
          )}>
          <Text style={styles.infoIcon}>ⓘ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={[styles.title, Fonts.GothamBold]}>Check your emotion.</Text>
        <Text style={[styles.subtitle, Fonts.GothamLight]}>Record your voice to detect your mood</Text>
      </View>

      <View style={styles.centerContent}>
        {state === 'processing' || isLoading ? (
          <View>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        ) : state === 'completed' ? (
          <>
            <Text style={[styles.resultLabel, Fonts.GothamLight]}>Detected Emotion:</Text>
            <Text style={[styles.resultEmotion]}>
              {detectedResult?.result?.max_emotion || 'Unknown'}
            </Text>
          </>
        ) : (
          renderCircle()
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.buttonDisabled, getButtonTitle() === "Record again" && styles.outlineButton]}
          onPress={handlePress}
          disabled={isLoading || state === 'processing'}
        >
          <Text style={[styles.primaryButtonText, Fonts.GothamMedium, getButtonTitle() === "Record again" && styles.outlineButtonText]}>{getButtonTitle()}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#6B00F5',
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
    marginBottom: 10,
  },
  logo: { 
    width: SCREEN_WIDTH * 0.30,
    height: 100,
  },
  infoIcon: {
    color: 'white',
    fontSize: 18,
    borderColor: 'white',
    width: 30,
    height: 30,
    textAlign: 'center',
    lineHeight: 25,
    fontWeight: '700',
  },
  titleContainer: { 
    paddingHorizontal: 26, 
    marginBottom: 60,
  },
  title: { 
    fontSize: 30, 
    fontWeight: '600', 
    color: 'white',
    marginBottom: 10,
    letterSpacing: -0.8,
  },
  loadingText: {
    marginTop: 5,
    color: '#ffffff',
    fontSize: 16,
    opacity: 0.8
  },
  subtitle: { 
    fontSize: 20, 
    color: 'rgba(255,255,255,0.9)',
    // letterSpacing: 0.1,
  },
  centerContent: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingBottom: 120,
  },
  timerText: { 
    position: 'absolute', 
    fontSize: 50, 
    color: 'white', 
    fontWeight: '500',
    letterSpacing: -3,
    top: '50%',
    left: '50%',
    transform: [{ translateX: -125 }, { translateY: -30 }],
  },
  resultLabel: { 
    fontSize: 20, 
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '400',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  resultEmotion: { 
    fontSize: 28, 
    color: 'white', 
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: -1.5,
    textTransform: 'capitalize'
  },
  buttonContainer: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24, 
    paddingBottom: 110,
  },
  primaryButton: {
    backgroundColor: 'white',
    paddingVertical: 22,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  outlineButton: {
    backgroundColor: '#6B00F5',
    paddingVertical: 22,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderColor: '#ffffff',
    borderStyle: 'solid',
    borderWidth: 2
  },
  outlineButtonText: {
    color: '#ffffff', 
    fontSize: 19, 
    letterSpacing: 0.5,
  },
  primaryButtonText: { 
    color: '#6B00F5', 
    fontSize: 19, 
    letterSpacing: 0.5,
  },
  buttonDisabled: { opacity: 0.6 },
});

export default HomeScreen;