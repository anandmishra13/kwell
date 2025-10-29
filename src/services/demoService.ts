import AppleHealthKit, { HealthKitPermissions } from 'react-native-health';

const permissions: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.StepCount, AppleHealthKit.Constants.Permissions.HeartRate],
    write: [AppleHealthKit.Constants.Permissions.StepCount, AppleHealthKit.Constants.Permissions.HeartRate],
  },
};

AppleHealthKit.initHealthKit(permissions, (error: string) => {
  if (error) {
    console.log('Error initializing HealthKit: ', error);
    return;
  }
  // HealthKit is initialized, proceed with reading/writing data
});