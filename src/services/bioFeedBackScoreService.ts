import DeviceInfo from 'react-native-device-info';
import {
  BioFeedbackData,
  UpdateBFSRequest,
} from '../models/BioFeedbackModels';

const BASE_URL = 'https://devapi.qwell.app/api/';

export class BioFeedbackScoreService {
  private deviceId: any;

  constructor() {
    this.deviceId = DeviceInfo.getUniqueId();
  }

  async fetchDataBioFeedbackScore(records: number = 2): Promise<BioFeedbackData[]> {
    const endpoint = 'fetch-data-bioFeedbackScore/';
    const url = `${BASE_URL}${endpoint}?number_of_records=${records}&device_id=${this.deviceId}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      });
      
      const  FetchDataBFSResponse = await response.json();
      console.log('FetchDataBFSResponse', FetchDataBFSResponse)
      return FetchDataBFSResponse.bioFeedbackData || [];
    } catch (error) {
      console.error('Error fetching biofeedback score ', error);
      return [];
    }
  }

  async updateBioFeedbackScore(score: number): Promise<void> {
    const endpoint = 'update-bio-feedback-score/';
    const url = `${BASE_URL}${endpoint}`;
    
    const date = new Date().toISOString().split('T')[0]; // Format: yyyy-MM-dd
    
    const requestBody: UpdateBFSRequest = {
      date,
      deviceId: this.deviceId,
      bioFeedbackScore: score,
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
      
      const  UpdateBFSResponse = await response.json();
      console.log('Update BFS response:', UpdateBFSResponse);
    } catch (error) {
      console.error('Error updating bio feedback score:', error);
    }
  }
}
