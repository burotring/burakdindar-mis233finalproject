type SeriesSize = 'sm' | 'md' | 'lg';

export type VisualizationMode = 'chart' | 'gauge' | 'stats' | 'ai-analysis';
export type ChartType = 'line' | 'bar' | 'area' | 'scatter';
export type AnomalyMethod = 'zscore' | 'iqr' | 'ml';

export interface SimpleOptions {
  text: string;
  showSeriesCount: boolean;
  seriesCountSize: SeriesSize;
  
  // Visualization Options
  visualizationMode: VisualizationMode;
  chartType: ChartType;
  
  // Color Options
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  anomalyColor: string;
  
  // AI/ML Features
  enableAnomalyDetection: boolean;
  anomalyMethod: AnomalyMethod;
  anomalySensitivity: number;
  
  enableTrendPrediction: boolean;
  predictionSteps: number;
  
  enableAIInsights: boolean;
  
  // Data Upload
  enableDataUpload: boolean;
  dataUrl: string;
  dataFormat: 'csv' | 'json' | 'sql';
  
  // Interactivity
  enableTooltips: boolean;
  enableAnimations: boolean;
  animationDuration: number;
  
  // Display Options
  showStats: boolean;
  showLegend: boolean;
  fontSize: number;
}

export interface DataPoint {
  timestamp: number;
  value: number;
  isAnomaly?: boolean;
  isPrediction?: boolean;
}

export interface AnomalyResult {
  index: number;
  value: number;
  timestamp: number;
  score: number;
  method: string;
}

export interface TrendPrediction {
  timestamp: number;
  value: number;
  confidence: number;
}

export interface AIInsight {
  type: 'info' | 'warning' | 'critical';
  message: string;
  confidence: number;
}
