import { AppConstants, getDeviceId } from '../utils/constants';
import {
  BioFeedbackData,
  UpdateBFSRequest,
  AnalyticsData,
  FetchDataRequest,
} from '../screens/profile/interface/profile.interface';

// Biofeedback Score Service
export class BioFeedbackScoreService {
  // Fetch biofeedback score data from API
  async fetchDataBioFeedbackScore(records: number = 2): Promise<BioFeedbackData[]> {
    try {
      const deviceId = await getDeviceId();
      const endpoint = 'fetch-data-bioFeedbackScore/';
      const url = `${AppConstants.baseURL}${endpoint}?number_of_records=${records}&device_id=${deviceId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      });

      const  data = await response.json();
      
      if (data.Bio_Feedback_Data) {
        console.log('✅ Fetched BFS ', data.Bio_Feedback_Data.length, 'records');
        return data.Bio_Feedback_Data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching biofeedback score ', error);
      return [];
    }
  }

  // Update biofeedback score on server
  async updateBioFeedbackScore(score: number): Promise<void> {
    try {
      const deviceId = await getDeviceId();
      const endpoint = 'update-bio-feedback-score/';
      const url = `${AppConstants.baseURL}${endpoint}`;

      // Format date as yyyy-MM-dd
      const date = new Date().toISOString().split('T')[0];

      const requestBody: UpdateBFSRequest = {
        date,
        device_id: deviceId,
        bio_feedback_score: score,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const  data = await response.json();
      console.log('✅ Updated BFS:', data);
    } catch (error) {
      console.error('Error updating bio feedback score:', error);
    }
  }
}

// Analytics Service
export class AnalyticsService {
  async fetchAnalytics(numberOfRecords: number): Promise<AnalyticsData[]> {
    try {
      const deviceId = await getDeviceId();
      const endpoint = 'fetch-data/';
      const url = `${AppConstants.baseURL}${endpoint}`;

      const requestBody: FetchDataRequest = {
        numberOfRecords,
        deviceID: deviceId,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const  data = await response.json();
      
      if (data.analytics) {
        console.log('✅ Fetched analytics:', data.analytics.length, 'records');
        return data.analytics;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return [];
    }
  }
}
