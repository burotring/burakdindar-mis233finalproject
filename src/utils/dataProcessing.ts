import { DataFrame, FieldType } from '@grafana/data';
import { DataPoint } from '../types';

/**
 * Data Processing Utilities
 * Extract and process data from Grafana queries
 */

export function extractTimeSeriesData(data: DataFrame[]): DataPoint[] {
  const points: DataPoint[] = [];

  if (!data || data.length === 0) {
    return points;
  }

  for (const series of data) {
    const timeField = series.fields.find(
      (f) => f.type === FieldType.time
    );
    const valueField = series.fields.find(
      (f) => f.type === FieldType.number
    );

    if (!timeField || !valueField) {
      continue;
    }

    const timeValues = timeField.values;
    const dataValues = valueField.values;

    for (let i = 0; i < timeValues.length; i++) {
      const timestamp = timeValues[i];
      const value = dataValues[i];

      if (timestamp != null && value != null && !isNaN(value)) {
        points.push({
          timestamp,
          value,
          isAnomaly: false,
          isPrediction: false,
        });
      }
    }
  }

  // Sort by timestamp
  points.sort((a, b) => a.timestamp - b.timestamp);

  return points;
}

export function extractNumericValues(data: DataFrame[]): number[] {
  const values: number[] = [];

  if (!data || data.length === 0) {
    return values;
  }

  for (const series of data) {
    const valueFields = series.fields.filter(
      (f) => f.type === FieldType.number
    );

    for (const field of valueFields) {
      for (const value of field.values) {
        if (value != null && !isNaN(value)) {
          values.push(value);
        }
      }
    }
  }

  return values;
}

export function getSeriesNames(data: DataFrame[]): string[] {
  if (!data || data.length === 0) {
    return [];
  }

  return data
    .map((series) => series.name || series.refId || 'Series')
    .filter((name) => name);
}

export function aggregateByTimeWindow(
  points: DataPoint[],
  windowMs: number
): DataPoint[] {
  if (points.length === 0) {
    return [];
  }

  const aggregated: DataPoint[] = [];
  let currentWindow: DataPoint[] = [];
  let windowStart = points[0].timestamp;

  for (const point of points) {
    if (point.timestamp - windowStart < windowMs) {
      currentWindow.push(point);
    } else {
      // Aggregate current window
      if (currentWindow.length > 0) {
        const avgValue =
          currentWindow.reduce((sum, p) => sum + p.value, 0) / currentWindow.length;
        const avgTimestamp =
          currentWindow.reduce((sum, p) => sum + p.timestamp, 0) /
          currentWindow.length;

        aggregated.push({
          timestamp: avgTimestamp,
          value: avgValue,
          isAnomaly: currentWindow.some((p) => p.isAnomaly),
          isPrediction: false,
        });
      }

      // Start new window
      currentWindow = [point];
      windowStart = point.timestamp;
    }
  }

  // Add last window
  if (currentWindow.length > 0) {
    const avgValue =
      currentWindow.reduce((sum, p) => sum + p.value, 0) / currentWindow.length;
    const avgTimestamp =
      currentWindow.reduce((sum, p) => sum + p.timestamp, 0) /
      currentWindow.length;

    aggregated.push({
      timestamp: avgTimestamp,
      value: avgValue,
      isAnomaly: currentWindow.some((p) => p.isAnomaly),
      isPrediction: false,
    });
  }

  return aggregated;
}

export function normalizeData(values: number[]): number[] {
  if (values.length === 0) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  if (range === 0) {
    return values.map(() => 0.5);
  }

  return values.map((v) => (v - min) / range);
}

export function smoothData(values: number[], windowSize: number = 3): number[] {
  if (values.length < windowSize) {
    return values;
  }

  const smoothed: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(values.length, i + halfWindow + 1);
    const window = values.slice(start, end);
    const avg = window.reduce((sum, v) => sum + v, 0) / window.length;
    smoothed.push(avg);
  }

  return smoothed;
}

export function interpolateMissingValues(points: DataPoint[]): DataPoint[] {
  if (points.length < 2) {
    return points;
  }

  const result: DataPoint[] = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const timeDiff = curr.timestamp - prev.timestamp;

    // If there's a large gap, interpolate
    if (timeDiff > 120000) {
      // More than 2 minutes
      const steps = Math.floor(timeDiff / 60000); // 1 minute intervals
      const valueDiff = curr.value - prev.value;

      for (let j = 1; j < steps && j < 10; j++) {
        // Limit interpolation
        result.push({
          timestamp: prev.timestamp + (timeDiff * j) / steps,
          value: prev.value + (valueDiff * j) / steps,
          isAnomaly: false,
          isPrediction: false,
        });
      }
    }

    result.push(curr);
  }

  return result;
}

export function calculateMovingAverage(
  values: number[],
  period: number
): number[] {
  if (values.length < period) {
    return values;
  }

  const ma: number[] = [];

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      ma.push(values[i]);
    } else {
      const window = values.slice(i - period + 1, i + 1);
      const avg = window.reduce((sum, v) => sum + v, 0) / window.length;
      ma.push(avg);
    }
  }

  return ma;
}

export function detectSeasonality(values: number[]): {
  hasSeason: boolean;
  period?: number;
} {
  if (values.length < 10) {
    return { hasSeason: false };
  }

  // Simple autocorrelation check
  const maxLag = Math.min(Math.floor(values.length / 3), 50);
  let maxCorr = 0;
  let bestLag = 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);

  for (let lag = 2; lag < maxLag; lag++) {
    let correlation = 0;
    for (let i = 0; i < values.length - lag; i++) {
      correlation += (values[i] - mean) * (values[i + lag] - mean);
    }
    correlation = correlation / variance;

    if (correlation > maxCorr) {
      maxCorr = correlation;
      bestLag = lag;
    }
  }

  return {
    hasSeason: maxCorr > 0.5,
    period: maxCorr > 0.5 ? bestLag : undefined,
  };
}

