import DeviceInfo from 'react-native-device-info';
import { FetchDataRequest, AnalyticsData } from '../models/AnalyticsModels';

const BASE_URL = 'https://devapi.qwell.app/api/'; // Replace with your API base URL

export class AnalyticsService {
  private deviceId: any;

  constructor() {
    this.deviceId = DeviceInfo.getUniqueId();
  }

  async fetchAnalytics(numberOfRecords: number): Promise<AnalyticsData[]> {
    const endpoint = 'fetch-data/';
    const url = `${BASE_URL}${endpoint}`;
    
    const requestBody: FetchDataRequest = {
      numberOfRecords,
      deviceID: this.deviceId,
    };
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const  FetchDataResponse = await response.json();
      return FetchDataResponse.analytics || [];
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return [];
    }
  }
}
