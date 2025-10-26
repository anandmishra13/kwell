import axios from 'axios';

const API_BASE = 'https://devapi.qwell.app/api/';

export interface DashboardData {
  moodScore: number;
  avgFocus: number;
  avgSleep: number;
  suggestion: string;
}

export const fetchDashboardData = async (userId: string): Promise<DashboardData> => {
  try {
    const response = await axios.get(`${API_BASE}/dashboard/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};