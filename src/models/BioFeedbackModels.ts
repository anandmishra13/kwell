export interface FetchDataBFSResponse {
  Bio_Feedback_Data?: BioFeedbackData[];
}

export interface BioFeedbackData {
  Bio_Feedback_Score?: number;
  'Date with Timestamp'?: string;
  
  // Convenience accessors
  get bioFeedbackScore(): number | undefined;
  get timestamp(): string | undefined;
}

export interface UpdateBFSRequest {
  date?: string;
  deviceId?: string;
  bioFeedbackScore?: number;
}

export interface UpdateBFSResponse {
  error?: string;
  message?: string;
  ID?: number;
  Date?: string;
  'Device ID'?: string;
  'Bio Feedback Score'?: number;
}
