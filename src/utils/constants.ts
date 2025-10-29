export const AppConstants = {
  baseURL: 'https://devapi.qwell.app/api/',
};

export const getDeviceId = async (): Promise<string> => {
  // Install: npm install react-native-device-info
  const DeviceInfo = require('react-native-device-info');
  return DeviceInfo.getUniqueId();
};
