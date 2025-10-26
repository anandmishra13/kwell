import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
  HealthValueOptions,
} from 'react-native-health';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HEALTHKIT_AUTH_KEY = 'healthKitAuthRequested';

export class HealthKitService {
  private permissions: HealthKitPermissions = {
    permissions: {
      read: [
        AppleHealthKit.Constants.Permissions.HeartRateVariability,
        AppleHealthKit.Constants.Permissions.HeartRate,
        AppleHealthKit.Constants.Permissions.MindfulSession,
        AppleHealthKit.Constants.Permissions.RespiratoryRate,
      ],
      write: [
        AppleHealthKit.Constants.Permissions.MindfulSession,
      ],
    },
  };

  // Request HealthKit authorization - this triggers the permission prompt
  async requestAuthorization(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.initHealthKit(this.permissions, (error: string) => {
        if (error) {
          console.error('[ERROR] Cannot grant HealthKit permissions:', error);
          reject(new Error(error));
          return;
        }
        
        console.log('✅ HealthKit permissions granted');
        this.setHealthKitAuthStatus(true);
        resolve(true);
      });
    });
  }

  // Check if HealthKit is available on this device
  isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      AppleHealthKit.isAvailable((error: Object, results: boolean) => {
        if (error) {
          console.error('HealthKit is not available');
          resolve(false);
          return;
        }
        resolve(results);
      });
    });
  }

  async getBiofeedbackScore(
    completion: (score: number, error?: Error) => void
  ): Promise<void> {
    const authRequested = await this.getHealthKitAuthStatus();
    
    if (!authRequested) {
      completion(0.0, new Error('HealthKit not authorized'));
      return;
    }
    
    this.calculateBiofeedbackScore(completion);
  }

  async addMindfulSession(duration: number): Promise<void> {
    const authRequested = await this.getHealthKitAuthStatus();
    
    if (!authRequested) {
      console.warn('HealthKit not authorized, cannot save mindful session');
      return;
    }
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - duration * 1000);
    
    // Fixed: Use the correct type and include value property
    const options: HealthValueOptions = {
      value: 0, // For mindful sessions, value is not used but required by the type
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    
    AppleHealthKit.saveMindfulSession(options, (error: string) => {
      if (error) {
        console.error('Error saving mindful session:', error);
        return;
      }
      console.log('✅ Mindful session saved successfully');
    });
  }

  private calculateBiofeedbackScore(
    completion: (score: number, error?: Error) => void
  ): void {
    let hrv: number | null = null;
    let heartRate: number | null = null;
    let mindfulness: number | null = null;
    let respiratoryRate: number | null = null;
    
    let completed = 0;
    const totalTasks = 4;
    
    const checkCompletion = () => {
      completed++;
      if (completed === totalTasks) {
        let totalWeight = 0;
        let biofeedbackScore = 0;
        
        if (hrv !== null) {
          const hrvWeight = 0.25;
          const normalizedHRV = Math.min(Math.max(hrv / 100, 0), 1);
          biofeedbackScore += normalizedHRV * hrvWeight;
          totalWeight += hrvWeight;
        }
        
        if (heartRate !== null) {
          const heartRateWeight = 0.25;
          const normalizedHeartRate = Math.min(Math.max((100 - heartRate) / 100, 0), 1);
          biofeedbackScore += normalizedHeartRate * heartRateWeight;
          totalWeight += heartRateWeight;
        }
        
        if (mindfulness !== null) {
          const mindfulWeight = 0.25;
          const normalizedMindfulness = Math.min(Math.max(mindfulness / 500, 0), 1);
          biofeedbackScore += normalizedMindfulness * mindfulWeight;
          totalWeight += mindfulWeight;
        }
        
        if (respiratoryRate !== null) {
          const respiratoryWeight = 0.25;
          const normalizedRespiratory = Math.min(Math.max((18 - respiratoryRate) / 18, 0), 1);
          biofeedbackScore += normalizedRespiratory * respiratoryWeight;
          totalWeight += respiratoryWeight;
        }
        
        const finalScore = totalWeight > 0 ? (biofeedbackScore / totalWeight) * 100 : 0;
        completion(finalScore);
      }
    };
    
    this.fetchHRV((value) => {
      hrv = value;
      checkCompletion();
    });
    
    this.fetchHeartRate((value) => {
      heartRate = value;
      checkCompletion();
    });
    
    this.fetchMindfulMinutes((value) => {
      mindfulness = value;
      checkCompletion();
    });
    
    this.fetchRespiratoryRate((value) => {
      respiratoryRate = value;
      checkCompletion();
    });
  }

  private fetchHRV(completion: (value: number | null) => void): void {
    const options = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    };
    
    AppleHealthKit.getHeartRateVariabilitySamples(
      options,
      (error: string, results: HealthValue[]) => {
        if (error || !results || results.length === 0) {
          console.log('No HRV data available');
          completion(null);
          return;
        }
        
        const avgHRV = results.reduce((sum, sample) => sum + sample.value, 0) / results.length;
        console.log(`✅ HRV: ${avgHRV.toFixed(2)} ms`);
        completion(avgHRV);
      }
    );
  }

  private fetchHeartRate(completion: (value: number | null) => void): void {
    const options = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    };
    
    AppleHealthKit.getHeartRateSamples(
      options,
      (error: string, results: HealthValue[]) => {
        if (error || !results || results.length === 0) {
          console.log('No heart rate data available');
          completion(null);
          return;
        }
        
        const avgHR = results.reduce((sum, sample) => sum + sample.value, 0) / results.length;
        console.log(`✅ Heart Rate: ${avgHR.toFixed(2)} bpm`);
        completion(avgHR);
      }
    );
  }

  private fetchMindfulMinutes(completion: (value: number | null) => void): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const options = {
      startDate: today.toISOString(),
      endDate: new Date().toISOString(),
    };
    
    AppleHealthKit.getMindfulSession(
      options,
      (error: string, results: HealthValue[]) => {
        if (error || !results || results.length === 0) {
          console.log('No mindful session data available');
          completion(null);
          return;
        }
        
        const totalMinutes = results.reduce((sum, session) => {
          const start = new Date(session.startDate);
          const end = new Date(session.endDate);
          const duration = (end.getTime() - start.getTime()) / (1000 * 60);
          return sum + duration;
        }, 0);
        
        console.log(`✅ Mindful Minutes: ${totalMinutes.toFixed(2)} min`);
        completion(totalMinutes);
      }
    );
  }

  private fetchRespiratoryRate(completion: (value: number | null) => void): void {
    const options = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    };
    
    AppleHealthKit.getRespiratoryRateSamples(
      options,
      (error: string, results: HealthValue[]) => {
        if (error || !results || results.length === 0) {
          console.log('No respiratory rate data available');
          completion(null);
          return;
        }
        
        const avgRate = results.reduce((sum, sample) => sum + sample.value, 0) / results.length;
        console.log(`✅ Respiratory Rate: ${avgRate.toFixed(2)} breaths/min`);
        completion(avgRate);
      }
    );
  }

  async getHealthKitAuthStatus(): Promise<boolean> {
    const value = await AsyncStorage.getItem(HEALTHKIT_AUTH_KEY);
    return value === 'true';
  }

  private async setHealthKitAuthStatus(status: boolean): Promise<void> {
    await AsyncStorage.setItem(HEALTHKIT_AUTH_KEY, status.toString());
  }
}
