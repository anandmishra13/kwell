// API Response Types
export interface FetchDataBFSResponse {
  Bio_Feedback_Data?: BioFeedbackData[];
}

export interface BioFeedbackData {
  Bio_Feedback_Score?: number;
  'Date with Timestamp'?: string;
}

export interface UpdateBFSRequest {
  date: string;
  device_id: string;
  bio_feedback_score: number;
}

export interface UpdateBFSResponse {
  error?: string;
  message?: string;
  ID?: number;
  Date?: string;
  'Device ID'?: string;
  'Bio Feedback Score'?: number;
}

// Analytics Types
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
}
