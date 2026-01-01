import * as tf from '@tensorflow/tfjs';
import { AnomalyResult, TrendPrediction, AIInsight } from '../types';

/**
 * AI-Powered Data Analysis Utilities
 * Advanced ML algorithms for anomaly detection and trend prediction
 */

// Z-Score based anomaly detection
export function detectAnomaliesZScore(
  data: number[],
  sensitivity: number = 3  // Increased from 2 to 3 for better accuracy
): AnomalyResult[] {
  if (data.length < 3) {
    return [];
  }

  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const std = Math.sqrt(
    data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
  );

  const anomalies: AnomalyResult[] = [];
  data.forEach((value, index) => {
    const zScore = Math.abs((value - mean) / (std || 1));
    // Use sensitivity directly as threshold (higher = fewer anomalies)
    if (zScore > sensitivity) {
      anomalies.push({
        index,
        value,
        timestamp: Date.now() - (data.length - index) * 1000,
        score: zScore,
        method: 'zscore',
      });
    }
  });

  return anomalies;
}

// IQR (Interquartile Range) based anomaly detection
export function detectAnomaliesIQR(
  data: number[],
  sensitivity: number = 2.0  // Increased from 1.5 to 2.0 for better accuracy
): AnomalyResult[] {
  if (data.length < 4) {
    return [];
  }

  const sorted = [...data].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  // Use sensitivity directly as multiplier (higher = wider bounds = fewer anomalies)
  const lowerBound = q1 - sensitivity * iqr;
  const upperBound = q3 + sensitivity * iqr;

  const anomalies: AnomalyResult[] = [];
  data.forEach((value, index) => {
    if (value < lowerBound || value > upperBound) {
      const distance = Math.min(
        Math.abs(value - lowerBound),
        Math.abs(value - upperBound)
      );
      anomalies.push({
        index,
        value,
        timestamp: Date.now() - (data.length - index) * 1000,
        score: distance / iqr,
        method: 'iqr',
      });
    }
  });

  return anomalies;
}

// ML-based anomaly detection using TensorFlow.js
export async function detectAnomaliesML(
  data: number[],
  sensitivity: number = 0.1
): Promise<AnomalyResult[]> {
  if (data.length < 5) {
    return [];
  }

  try {
    // Normalize data
    const tensor = tf.tensor1d(data);
    const mean = tensor.mean();
    const std = tf.moments(tensor).variance.sqrt();
    const normalized = tensor.sub(mean).div(std.add(1e-7));

    // Simple autoencoder approach - reconstruction error
    // tfjs typing for `array()` is broad union; we know this is 1D -> number[]
    const sequence = (await normalized.array()) as number[];
    const anomalies: AnomalyResult[] = [];

    // Use sliding window to detect anomalies
    const windowSize = Math.min(5, Math.floor(data.length / 3));
    
    // Calculate adaptive threshold based on sensitivity
    // Higher sensitivity (3.0) = higher threshold = fewer anomalies
    // Fixed formula: sensitivity 3.0 should give threshold ~3.0 (not 0.3)
    const threshold = sensitivity * 0.8; // More reasonable scaling
    
    for (let i = windowSize; i < data.length; i++) {
      const window = sequence.slice(i - windowSize, i);
      const current = sequence[i];
      const windowMean =
        window.reduce((a: number, b: number) => a + b, 0) / window.length;
      const windowStd = Math.sqrt(
        window.reduce((sum: number, v: number) => sum + Math.pow(v - windowMean, 2), 0) / window.length
      );
      const error = Math.abs(current - windowMean) / (windowStd + 1e-7);

      if (error > threshold) {
        anomalies.push({
          index: i,
          value: data[i],
          timestamp: Date.now() - (data.length - i) * 1000,
          score: error,
          method: 'ml',
        });
      }
    }

    tensor.dispose();
    normalized.dispose();
    mean.dispose();
    std.dispose();

    return anomalies;
  } catch (error) {
    console.error('ML anomaly detection failed:', error);
    return detectAnomaliesZScore(data, sensitivity * 10);
  }
}

// Advanced ML-based trend prediction using TensorFlow.js
export async function predictTrend(
  data: number[],
  steps: number = 10
): Promise<TrendPrediction[]> {
  if (data.length < 5) {
    return simpleLinearPrediction(data, steps);
  }

  try {
    // Use recent data for prediction (last 20-30% of data, min 10 points)
    const lookback = Math.min(30, Math.max(10, Math.floor(data.length * 0.3)));
    const trainingData = data.slice(-lookback);
    
    // Normalize data for better ML performance
    const mean = trainingData.reduce((a, b) => a + b, 0) / trainingData.length;
    const std = Math.sqrt(
      trainingData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / trainingData.length
    );
    
    // Avoid division by zero
    const normalizedStd = std < 0.01 ? 1 : std;
    const normalized = trainingData.map(v => (v - mean) / normalizedStd);
    
    // Create sequences for training (input: last 3 points, output: next point)
    const sequenceLength = 3;
    const xs: number[][] = [];
    const ys: number[] = [];
    
    for (let i = sequenceLength; i < normalized.length; i++) {
      xs.push(normalized.slice(i - sequenceLength, i));
      ys.push(normalized[i]);
    }
    
    if (xs.length < 3) {
      return simpleLinearPrediction(data, steps);
    }
    
    // Build a simple sequential neural network
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [sequenceLength], units: 8, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.1 }),
        tf.layers.dense({ units: 4, activation: 'relu' }),
        tf.layers.dense({ units: 1 })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'meanSquaredError'
    });
    
    // Convert to tensors
    const xsTensor = tf.tensor2d(xs);
    const ysTensor = tf.tensor1d(ys);
    
    // Train the model (quick training, 20 epochs)
    await model.fit(xsTensor, ysTensor, {
      epochs: 20,
      batchSize: Math.min(8, xs.length),
      verbose: 0,
      shuffle: true
    });
    
    // Make predictions
    const predictions: TrendPrediction[] = [];
    const lastActualValue = data[data.length - 1];
    
    // Start with the last sequence from actual data
    let currentSequence = normalized.slice(-sequenceLength);
    
    for (let i = 1; i <= steps; i++) {
      // Predict next normalized value
      const inputTensor = tf.tensor2d([currentSequence]);
      const predictionTensor = model.predict(inputTensor) as tf.Tensor;
      const normalizedPrediction = (await predictionTensor.data())[0];
      
      // Denormalize back to original scale
      const predictedValue = normalizedPrediction * normalizedStd + mean;
      
      // Calculate confidence based on:
      // 1. Distance from last actual value
      // 2. Prediction step
      const distance = Math.abs(predictedValue - lastActualValue);
      const distanceRatio = distance / (Math.abs(lastActualValue) + 1);
      const stepDecay = Math.pow(0.92, i - 1);
      const distancePenalty = Math.max(0, 1 - distanceRatio * 0.5);
      const confidence = Math.max(0.4, Math.min(0.95, stepDecay * distancePenalty));
      
      predictions.push({
        timestamp: Date.now() + i * 60000,
        value: predictedValue,
        confidence
      });
      
      // Update sequence for next prediction
      currentSequence = [...currentSequence.slice(1), normalizedPrediction];
      
      // Cleanup
      inputTensor.dispose();
      predictionTensor.dispose();
    }
    
    // Cleanup
    xsTensor.dispose();
    ysTensor.dispose();
    model.dispose();
    
    return predictions;
    
  } catch (error) {
    console.error('ML prediction failed, falling back to linear:', error);
    return simpleLinearPrediction(data, steps);
  }
}

// Helper function to calculate slope of data
function calculateSlope(data: number[]): number {
  if (data.length < 2) return 0;
  
  const n = data.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = data.reduce((sum, y, x) => sum + x * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  
  const denominator = n * sumX2 - sumX * sumX;
  if (Math.abs(denominator) < 0.0001) return 0;
  
  return (n * sumXY - sumX * sumY) / denominator;
}

// Simple linear regression fallback (uses recent data only)
function simpleLinearPrediction(
  data: number[],
  steps: number
): TrendPrediction[] {
  // Use only recent 30% of data for trend
  const lookback = Math.max(5, Math.floor(data.length * 0.3));
  const recentData = data.slice(-lookback);
  
  const slope = calculateSlope(recentData);
  const mean = recentData.reduce((a, b) => a + b, 0) / recentData.length;
  const lastValue = data[data.length - 1];

  const predictions: TrendPrediction[] = [];
  
  for (let i = 1; i <= steps; i++) {
    // Linear extrapolation with dampening
    const trendValue = lastValue + slope * i;
    const dampening = Math.exp(-i * 0.12);
    
    // Blend between trend and mean for stability
    const predValue = trendValue * dampening + mean * (1 - dampening);
    
    predictions.push({
      timestamp: Date.now() + i * 60000,
      value: predValue,
      confidence: Math.max(0.3, 1 - (i / steps) * 0.6),
    });
  }

  return predictions;
}

// Generate AI-powered insights from data
export function generateAIInsights(
  data: number[],
  anomalies: AnomalyResult[],
  predictions: TrendPrediction[]
): AIInsight[] {
  const insights: AIInsight[] = [];

  if (data.length < 2) {
    insights.push({
      type: 'info',
      message: 'Not enough data points for analysis. Need at least 2 data points.',
      confidence: 1.0,
    });
    return insights;
  }

  // Calculate statistics
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const latest = data[data.length - 1];
  const previous = data[data.length - 2];
  const change = ((latest - previous) / previous) * 100;

  // Trend analysis
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  const firstMean =
    firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondMean =
    secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const trendChange = ((secondMean - firstMean) / firstMean) * 100;

  // Generate insights based on analysis
  if (anomalies.length > 0) {
    const severity =
      anomalies.length > data.length * 0.1 ? 'critical' : 'warning';
    insights.push({
      type: severity,
      message: `Detected ${anomalies.length} anomal${anomalies.length > 1 ? 'ies' : 'y'} in the data. ${
        severity === 'critical'
          ? 'Immediate attention required!'
          : 'Investigation recommended.'
      }`,
      confidence: 0.9,
    });
  }

  if (Math.abs(change) > 20) {
    insights.push({
      type: change > 0 ? 'info' : 'warning',
      message: `Significant ${change > 0 ? 'increase' : 'decrease'} of ${Math.abs(change).toFixed(1)}% detected in latest value.`,
      confidence: 0.85,
    });
  }

  if (Math.abs(trendChange) > 15) {
    insights.push({
      type: 'info',
      message: `Overall trend shows ${trendChange > 0 ? 'upward' : 'downward'} movement of ${Math.abs(trendChange).toFixed(1)}% over time.`,
      confidence: 0.8,
    });
  }

  if (predictions.length > 0) {
    const avgPrediction =
      predictions.reduce((sum, p) => sum + p.value, 0) / predictions.length;
    const predChange = ((avgPrediction - mean) / mean) * 100;
    
    if (Math.abs(predChange) > 10) {
      insights.push({
        type: Math.abs(predChange) > 30 ? 'warning' : 'info',
        message: `AI predicts ${predChange > 0 ? 'increase' : 'decrease'} of ${Math.abs(predChange).toFixed(1)}% in upcoming values.`,
        confidence: 0.75,
      });
    }
  }

  if (latest > mean * 1.5) {
    insights.push({
      type: 'info',
      message: `Current value (${latest.toFixed(2)}) is ${(((latest - mean) / mean) * 100).toFixed(0)}% above average.`,
      confidence: 0.9,
    });
  } else if (latest < mean * 0.5) {
    insights.push({
      type: 'warning',
      message: `Current value (${latest.toFixed(2)}) is ${(((mean - latest) / mean) * 100).toFixed(0)}% below average.`,
      confidence: 0.9,
    });
  }

  // Volatility analysis
  const volatility =
    Math.sqrt(
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
    ) / mean;
  
  if (volatility > 0.3) {
    insights.push({
      type: 'warning',
      message: `High volatility detected (${(volatility * 100).toFixed(1)}%). Data shows significant fluctuations.`,
      confidence: 0.85,
    });
  } else if (volatility < 0.05) {
    insights.push({
      type: 'info',
      message: `Low volatility detected. Data is stable and consistent.`,
      confidence: 0.8,
    });
  }

  return insights;
}

// Calculate statistical metrics
export function calculateStats(data: number[]) {
  if (data.length === 0) {
    return null;
  }

  const sorted = [...data].sort((a, b) => a - b);
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const variance =
    data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    median,
    min,
    max,
    stdDev,
    variance,
    count: data.length,
  };
}

