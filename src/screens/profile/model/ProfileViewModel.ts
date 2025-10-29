import { BioFeedbackScoreService, AnalyticsService } from "../../../services/apiService";
import HealthKitService from "../../../services/HealthKitService";
import { BioFeedbackData } from "../interface/profile.interface";

interface ProfileState {
  bioFeedbackScore: number;
  improvementPercentage: number;
  isLoading: boolean;
}

type Listener = (state: ProfileState) => void;

export class ProfileViewModel {
  private bfsService: BioFeedbackScoreService;
  private analyticsService: AnalyticsService;
  
  private state: ProfileState = {
    bioFeedbackScore: 0.0,
    improvementPercentage: 0.0,
    isLoading: true,
  };
  
  private listeners: Listener[] = [];
  private bfsData: BioFeedbackData[] = [];

  constructor() {
    this.bfsService = new BioFeedbackScoreService();
    this.analyticsService = new AnalyticsService();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    listener(this.state);
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
    try {
      console.log('🔄 ===== STARTING DATA LOAD =====');
      this.updateState({ isLoading: true });

      // Step 1: Fetch combined biofeedback score
      console.log('📊 Step 1: Fetching biofeedback score...');
      await this.fetchBFS();
      
      // Step 2: Fetch historical data from API
      console.log('📊 Step 2: Fetching historical data...');
      this.bfsData = await this.bfsService.fetchDataBioFeedbackScore(2);
      console.log(`   → Got ${this.bfsData.length} historical records`);
      
      // Step 3: Calculate improvement percentage
      console.log('📊 Step 3: Calculating improvement...');
      const improvement = this.getImprovementPercentage();
      this.updateState({ improvementPercentage: improvement });
      
      // Step 4: Update score on server if needed
      console.log('📊 Step 4: Syncing with server...');
      await this.updateBioFeedbackScore();
      
      console.log('✅ ===== DATA LOAD COMPLETE =====');
      console.log(`   Final Score: ${this.state.bioFeedbackScore.toFixed(2)}`);
      console.log(`   Improvement: ${(this.state.improvementPercentage * 100).toFixed(2)}%`);
      
      this.updateState({ isLoading: false });
    } catch (error) {
      console.error('❌ Error loading profile ', error);
      this.updateState({ isLoading: false });
    }
  }

  private async fetchBFS(): Promise<void> {
    try {
      console.log('   → Fetching Analytics Score...');
      const analyticsScore = await this.fetchAnalyticsBFS();
      console.log(`   → Analytics Score: ${analyticsScore.toFixed(2)}`);
      
      console.log('   → Fetching HealthKit Score...');
      const healthKitScore = await HealthKitService.getBiofeedbackScore();
      console.log(`   → HealthKit Score: ${healthKitScore.toFixed(2)}`);
      
      // Average the two scores
      const combinedScore = (healthKitScore + analyticsScore) / 2;
      console.log(`   → Combined Score: ${combinedScore.toFixed(2)}`);
      
      this.updateState({ bioFeedbackScore: combinedScore });
    } catch (error) {
      console.error('   ❌ Error fetching biofeedback score:', error);
      this.updateState({ bioFeedbackScore: 0 });
    }
  }

  private async fetchAnalyticsBFS(): Promise<number> {
    try {
      const data = await this.analyticsService.fetchAnalytics(5);
      console.log(`      → Got ${data.length} analytics records`);
      
      if (data.length === 0) {
        console.log('      ⚠️ No analytics data available');
        return 0;
      }
      
      // Extract scores
      const allScores: number[] = data
        .map(d => d.emotion?.score)
        .filter((score): score is number => score !== undefined)
        .map(score => score / 0.74); // Normalize
      
      console.log('      → Raw scores:', allScores.map(s => s.toFixed(3)));
      
      if (allScores.length === 0) {
        console.log('      ⚠️ No valid emotion scores found');
        return 0;
      }
      
      const averageScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
      const percentage = averageScore * 100;
      
      console.log(`      → Average normalized: ${averageScore.toFixed(3)}`);
      console.log(`      → Percentage: ${percentage.toFixed(2)}%`);
      
      return percentage;
    } catch (error) {
      console.error('      ❌ Error fetching analytics BFS:', error);
      return 0;
    }
  }

  private async updateBioFeedbackScore(): Promise<void> {
    try {
      if (this.bfsData.length > 0) {
        const latestData = this.bfsData[0];
        const score = latestData.Bio_Feedback_Score;
        const timestamp = latestData['Date with Timestamp'];
        
        const date = this.extractDate(timestamp || '');
        const currentDate = this.getCurrentDate();
        
        console.log(`   → Latest server score: ${score}`);
        console.log(`   → Current score: ${this.state.bioFeedbackScore}`);
        console.log(`   → Latest date: ${date}`);
        console.log(`   → Current date: ${currentDate}`);
        
        if (this.state.bioFeedbackScore !== score || date !== currentDate) {
          console.log('   → 📤 Updating server...');
          await this.bfsService.updateBioFeedbackScore(this.state.bioFeedbackScore);
        } else {
          console.log('   → ✅ Score already up to date');
        }
      } else {
        console.log('   → 📤 First upload...');
        await this.bfsService.updateBioFeedbackScore(this.state.bioFeedbackScore);
      }
    } catch (error) {
      console.error('   ❌ Error updating biofeedback score:', error);
    }
  }

  private getImprovementPercentage(): number {
    if (this.bfsData.length === 0) {
      console.log('   → No historical data');
      return 0;
    }
    
    const current = this.state.bioFeedbackScore;
    console.log('this.bfsData', this.bfsData);
    switch (this.bfsData.length) {
      case 1: {
        const prev = this.bfsData[0];
        const prevScore = prev.Bio_Feedback_Score;
        if (prevScore !== undefined) {
          const improvement = this.calculateImprovementPercentage(prevScore, current);
          console.log(`   → Comparing ${prevScore} → ${current} = ${(improvement * 100).toFixed(2)}%`);
          return improvement;
        }
        return 0;
      }
      
      case 2: {
        const lastRecord = this.bfsData[0];
        const secondLastRecord = this.bfsData[1];
        
        if (lastRecord.Bio_Feedback_Score === current && secondLastRecord.Bio_Feedback_Score) {
          const improvement = this.calculateImprovementPercentage(secondLastRecord.Bio_Feedback_Score, current);
          console.log(`   → Using second-to-last: ${secondLastRecord.Bio_Feedback_Score} → ${current}`);
          return improvement;
        } else if (lastRecord.Bio_Feedback_Score) {
          const improvement = this.calculateImprovementPercentage(lastRecord.Bio_Feedback_Score, current);
          console.log(`   → Using last: ${lastRecord.Bio_Feedback_Score} → ${current}`);
          return improvement;
        }
        return 0;
      }
      
      default:
        return 0;
    }
  }

  private calculateImprovementPercentage(prev: number, current: number): number {
    if (prev === 0) return 0;
    return (current - prev) / prev;
  }

  private extractDate(timestamp: string): string {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
