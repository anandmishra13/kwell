export interface FetchDataRequest {
  numberOfRecords: number;
  deviceID: string;
}

export interface FetchDataResponse {
  analytics?: AnalyticsData[];
}

export interface AnalyticsData {
  emotion?: {
    score?: number;
  };
  // Add other fields as needed from your API
}
