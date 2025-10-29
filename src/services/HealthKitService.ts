import BrokenHealthKit, {
  HealthKitPermissions,
} from 'react-native-health';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

// Fix for react-native-health
const AppleHealthKit = NativeModules.AppleHealthKit as typeof BrokenHealthKit;
AppleHealthKit.Constants = BrokenHealthKit.Constants;

interface BiofeedbackData {
  hrv?: number;
  heartRate?: number;
  mindfulness?: number;
  respiratoryRate?: number;
}

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.HeartRateVariability,
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.MindfulSession,
      AppleHealthKit.Constants.Permissions.RespiratoryRate,
    ],
    write: [
      AppleHealthKit.Constants.Permissions.MindfulSession, // ⭐ Important for writing
    ],
  },
};

// Check if HealthKit is available
export const isHealthKitAvailable = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'ios') {
      resolve(false);
      return;
    }

    AppleHealthKit.isAvailable((err: any, available: boolean) => {
      if (err) {
        console.error('HealthKit availability error:', err);
        resolve(false);
        return;
      }
      resolve(available);
    });
  });
};

// Check if authorization was requested
export const isAuthRequested = async (): Promise<boolean> => {
  try {
    const requested = await AsyncStorage.getItem('healthKitAuthRequested');
    return requested === 'true';
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};

// Request authorization
export const requestAuthorization = (): Promise<boolean> => {
  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(permissions, (err: any) => {
      if (err) {
        console.error('HealthKit authorization error:', err);
        resolve(false);
        return;
      }
      AsyncStorage.setItem('healthKitAuthRequested', 'true');
      console.log('✅ HealthKit authorization granted');
      resolve(true);
    });
  });
};

// ⭐ THIS IS THE KEY FUNCTION - Add Mindful Session
export const addMindfulSession = async (durationInSeconds: number): Promise<boolean> => {
  return new Promise(async (resolve) => {
    try {
      // Check if authorized
      const authRequested = await isAuthRequested();
      
      if (!authRequested) {
        console.log('⚠️ HealthKit not authorized, requesting...');
        const success = await requestAuthorization();
        if (!success) {
          console.log('❌ Authorization failed');
          resolve(false);
          return;
        }
      }

      // Calculate dates
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - durationInSeconds * 1000);

      console.log(`💚 Saving mindful session:`);
      console.log(`   Duration: ${durationInSeconds} seconds (${(durationInSeconds / 60).toFixed(1)} minutes)`);
      console.log(`   Start: ${startDate.toLocaleString()}`);
      console.log(`   End: ${endDate.toLocaleString()}`);

      // Save to HealthKit - ADD VALUE PROPERTY
      const options = {
        value: 0, // ⭐ REQUIRED by react-native-health (even though it's not used for mindful sessions)
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.saveMindfulSession(options, (err: any) => {
        if (err) {
          console.error('❌ Error saving mindful session:', err);
          resolve(false);
          return;
        }
        console.log('✅ Mindful session saved successfully!');
        resolve(true);
      });
    } catch (error) {
      console.error('❌ Unexpected error in addMindfulSession:', error);
      resolve(false);
    }
  });
};


// Fetch HRV
const fetchHRV = (): Promise<number | undefined> => {
  return new Promise((resolve) => {
    AppleHealthKit.getHeartRateVariabilitySamples(
      {
        startDate: new Date(2020, 1, 1).toISOString(),
        endDate: new Date().toISOString(),
      },
      (err: any, results: any[]) => {
        if (err || !results || results.length === 0) {
          resolve(undefined);
          return;
        }

        const sum = results.reduce((acc, sample) => acc + sample.value, 0);
        const avg = sum / results.length;
        resolve(avg);
      }
    );
  });
};

// Fetch Heart Rate
const fetchHeartRate = (): Promise<number | undefined> => {
  return new Promise((resolve) => {
    AppleHealthKit.getHeartRateSamples(
      {
        startDate: new Date(2020, 1, 1).toISOString(),
        endDate: new Date().toISOString(),
      },
      (err: any, results: any[]) => {
        if (err || !results || results.length === 0) {
          resolve(undefined);
          return;
        }

        const sum = results.reduce((acc, sample) => acc + sample.value, 0);
        const avg = sum / results.length;
        resolve(avg);
      }
    );
  });
};

// Fetch Mindful Minutes (today)
const fetchMindfulMinutes = (): Promise<number | undefined> => {
  return new Promise((resolve) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    AppleHealthKit.getMindfulSession(
      {
        startDate: today.toISOString(),
        endDate: new Date().toISOString(),
      },
      (err: any, results: any[]) => {
        if (err || !results || results.length === 0) {
          console.log('ℹ️ No mindful sessions found today');
          resolve(undefined);
          return;
        }

        // Calculate total mindful minutes
        const totalMinutes = results.reduce((acc, session) => {
          const start = new Date(session.startDate);
          const end = new Date(session.endDate);
          const duration = (end.getTime() - start.getTime()) / 60000; // Convert to minutes
          return acc + duration;
        }, 0);

        console.log(`✅ Total mindful minutes today: ${totalMinutes.toFixed(1)}`);
        resolve(totalMinutes);
      }
    );
  });
};

// Fetch Respiratory Rate
const fetchRespiratoryRate = (): Promise<number | undefined> => {
  return new Promise((resolve) => {
    AppleHealthKit.getRespiratoryRateSamples(
      {
        startDate: new Date(2020, 1, 1).toISOString(),
        endDate: new Date().toISOString(),
      },
      (err: any, results: any[]) => {
        if (err || !results || results.length === 0) {
          resolve(undefined);
          return;
        }

        const sum = results.reduce((acc, sample) => acc + sample.value, 0);
        const avg = sum / results.length;
        resolve(avg);
      }
    );
  });
};

// Calculate biofeedback score
const calculateBiofeedbackScore = async (): Promise<number> => {
  try {
    const [hrv, heartRate, mindfulness, respiratoryRate] = await Promise.all([
      fetchHRV(),
      fetchHeartRate(),
      fetchMindfulMinutes(),
      fetchRespiratoryRate(),
    ]);

    const healthData: BiofeedbackData = {
      hrv,
      heartRate,
      mindfulness,
      respiratoryRate,
    };

    let totalWeight = 0;
    let biofeedbackScore = 0;

    // HRV component (0.25 weight)
    if (healthData.hrv !== undefined && healthData.hrv !== null) {
      const hrvWeight = 0.25;
      const normalizedHRV = Math.min(Math.max(healthData.hrv / 100, 0), 1);
      biofeedbackScore += normalizedHRV * hrvWeight;
      totalWeight += hrvWeight;
    }

    // Heart Rate component (0.25 weight)
    if (healthData.heartRate !== undefined && healthData.heartRate !== null) {
      const heartRateWeight = 0.25;
      const normalizedHeartRate = Math.min(Math.max((100 - healthData.heartRate) / 100, 0), 1);
      biofeedbackScore += normalizedHeartRate * heartRateWeight;
      totalWeight += heartRateWeight;
    }

    // Mindfulness component (0.25 weight)
    if (healthData.mindfulness !== undefined && healthData.mindfulness !== null) {
      const mindfulWeight = 0.25;
      const normalizedMindfulness = Math.min(Math.max(healthData.mindfulness / 500, 0), 1);
      biofeedbackScore += normalizedMindfulness * mindfulWeight;
      totalWeight += mindfulWeight;
      console.log(`✅ Mindfulness contributing to score: ${(normalizedMindfulness * mindfulWeight * 100).toFixed(2)}%`);
    }

    // Respiratory Rate component (0.25 weight)
    if (healthData.respiratoryRate !== undefined && healthData.respiratoryRate !== null) {
      const respiratoryWeight = 0.25;
      const normalizedRespiratory = Math.min(
        Math.max((18 - healthData.respiratoryRate) / 18, 0),
        1
      );
      biofeedbackScore += normalizedRespiratory * respiratoryWeight;
      totalWeight += respiratoryWeight;
    }

    // Normalize score to 0-100
    if (totalWeight > 0) {
      const finalScore = (biofeedbackScore / totalWeight) * 100;
      console.log(`📊 HealthKit Score Breakdown:`);
      console.log(`   Total Weight: ${totalWeight}`);
      console.log(`   Final Score: ${finalScore.toFixed(2)}`);
      return finalScore;
    }

    return 0;
  } catch (error) {
    console.error('Error calculating biofeedback score:', error);
    return 0;
  }
};


// Get biofeedback score (main function)
export const getBiofeedbackScore = async (): Promise<number> => {
  const authRequested = await isAuthRequested();
  
  if (!authRequested) {
    console.log('⚠️ HealthKit not authorized for biofeedback score');
    return 0;
  }

  return calculateBiofeedbackScore();
};

// Export all functions as default object
export default {
  isAvailable: isHealthKitAvailable,
  isAuthRequested,
  requestAuthorization,
  getBiofeedbackScore,
  addMindfulSession,
};
