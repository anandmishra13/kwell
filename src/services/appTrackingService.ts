import { Platform } from 'react-native';
import { requestTrackingPermission } from 'react-native-tracking-transparency';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AppTrackingService {
  private static instance: AppTrackingService;

  private constructor() {}

  static getInstance(): AppTrackingService {
    if (!AppTrackingService.instance) {
      AppTrackingService.instance = new AppTrackingService();
    }
    return AppTrackingService.instance;
  }

  // Request tracking permission (iOS 14.5+)
  async requestPermission(): Promise<string> {
    if (Platform.OS !== 'ios') {
      return 'not-applicable';
    }

    try {
      const trackingStatus = await requestTrackingPermission();
      await AsyncStorage.setItem('trackingPermissionRequested', 'true');
      return trackingStatus;
    } catch (error) {
      console.error('Error requesting tracking permission:', error);
      return 'unavailable';
    }
  }

  // Check if permission was requested
  async isPermissionRequested(): Promise<boolean> {
    try {
      const requested = await AsyncStorage.getItem('trackingPermissionRequested');
      return requested === 'true';
    } catch (error) {
      console.error('Error checking tracking permission status:', error);
      return false;
    }
  }
}

export default AppTrackingService.getInstance();