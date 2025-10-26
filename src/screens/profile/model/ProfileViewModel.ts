import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { HealthKitService } from '../../../services/HealthKitService';
import { AnalyticsService } from '../../../services/AnalyticsService';
import { BioFeedbackData } from '../../../models/BioFeedbackModels';
import { BioFeedbackScoreService } from '../../../services/bioFeedBackScoreService';
import { Alert } from 'react-native';

interface ProfileState {
  bioFeedbackScore: number;
  improvementPercentage: number;
  showHealthKitAuthAlert: boolean;
}

type Listener = (state: ProfileState) => void;

export class ProfileViewModel {
  private healthKitService: HealthKitService;
  private bfsService: BioFeedbackScoreService;
  private analyticsService: AnalyticsService;
  
  private state: ProfileState = {
    bioFeedbackScore: 0.0,
    improvementPercentage: 0.0,
    showHealthKitAuthAlert: false,
  };
  
  private listeners: Listener[] = [];
  private bfsData: BioFeedbackData[] = [];

  constructor() {
    this.healthKitService = new HealthKitService();
    this.bfsService = new BioFeedbackScoreService();
    this.analyticsService = new AnalyticsService();
    
    // Check if auth was requested
    this.checkHealthKitAuthStatus();
  }

  private async checkHealthKitAuthStatus() {
    const authRequested = await AsyncStorage.getItem('healthKitAuthRequested');
    if (!authRequested || authRequested !== 'true') {
      this.updateState({ showHealthKitAuthAlert: true });
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  private updateState(updates: Partial<ProfileState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  async loadData(): Promise<void> {
    // Check if we need to show HealthKit auth alert
    if (this.state.showHealthKitAuthAlert) {
      // Will be handled in the UI component
      return;
    }

    await this.fetchBFS();
    
    this.bfsData = await this.bfsService.fetchDataBioFeedbackScore();
    const improvement = this.getImprovementPercentage();
    this.updateState({ improvementPercentage: improvement });
    
    // Update score if different
    await this.updateBioFeedbackScore();
  }

  async requestHealthKitPermission(): Promise<void> {
    try {
      await this.healthKitService.requestAuthorization();
      await AsyncStorage.setItem('healthKitAuthRequested', 'true');
      this.updateState({ showHealthKitAuthAlert: false });
      
      // Now load the data
      await this.loadData();
    } catch (error) {
      console.error('Error requesting HealthKit permission:', error);
      Alert.alert('Error', 'Failed to request HealthKit permission');
    }
  }

  async fetchBFS(): Promise<void> {
    const analyticsScore = await this.fetchAnalyticsBFS();
    
    return new Promise((resolve) => {
      this.fetchHealthKitBFS((healthKitScore) => {
        const finalScore = (healthKitScore + analyticsScore) / 2;
        this.updateState({ bioFeedbackScore: finalScore });
        resolve();
      });
    });
  }

  private fetchHealthKitBFS(completion: (score: number) => void): void {
    this.healthKitService.getBiofeedbackScore((score, error) => {
      if (error) {
        console.error('Error fetching biofeedback score:', error);
      }
      completion(score);
    });
  }

  private async fetchAnalyticsBFS(): Promise<number> {
    const data = await this.analyticsService.fetchAnalytics(5);
    
    const allScores: number[] = data
      .map(d => d.emotion?.score)
      .filter((score): score is number => score !== undefined)
      .map(score => score / 0.74); // Normalize
    
    if (allScores.length === 0) return 0;
    
    const averageScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
    return averageScore * 100;
  }

  private async updateBioFeedbackScore(): Promise<void> {
    if (this.bfsData.length > 0) {
      const latestData = this.bfsData[0];
      const score = latestData.bioFeedbackScore;
      const date = this.convertToLocalDate(latestData.timestamp || '');
      const currentDate = this.getCurrentDate();
      
      if (this.state.bioFeedbackScore !== score || date !== currentDate) {
        await this.bfsService.updateBioFeedbackScore(this.state.bioFeedbackScore);
      }
    } else {
      await this.bfsService.updateBioFeedbackScore(this.state.bioFeedbackScore);
    }
  }

  private getImprovementPercentage(): number {
    if (this.bfsData.length === 0) return 0;
    
    const current = this.state.bioFeedbackScore;
    
    switch (this.bfsData.length) {
      case 1:
        const prevScore = this.bfsData[0].bioFeedbackScore;
        return prevScore ? this.calculateImprovementPercentage(prevScore, current) : 0;
      
      case 2:
        const lastRecord = this.bfsData[0];
        const secondLastRecord = this.bfsData[1];
        
        if (lastRecord.bioFeedbackScore === current && secondLastRecord.bioFeedbackScore) {
          return this.calculateImprovementPercentage(secondLastRecord.bioFeedbackScore, current);
        } else if (lastRecord.bioFeedbackScore) {
          return this.calculateImprovementPercentage(lastRecord.bioFeedbackScore, current);
        }
        return 0;
      
      default:
        return 0;
    }
  }

  private calculateImprovementPercentage(prev: number, current: number): number {
    if (prev === 0) return 0;
    return (current - prev) / prev;
  }

  private convertToLocalDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB').split('/').reverse().join('-');
  }

  private getCurrentDate(): string {
    return new Date().toLocaleDateString('en-GB').split('/').reverse().join('-');
  }
}
