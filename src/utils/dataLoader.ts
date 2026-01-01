import { DataPoint } from '../types';

/**
 * Universal Data Loader
 * Supports CSV, JSON, and SQL formats
 */

export async function fetchDataFromUrl(
  url: string,
  format: 'csv' | 'json' | 'sql'
): Promise<DataPoint[]> {
  if (!url || url.trim() === '') {
    return [];
  }

  try {
    const response = await fetch(url, {
      mode: 'cors',
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();

    let parsedData: DataPoint[] = [];
    switch (format) {
      case 'csv':
        parsedData = parseCSV(text);
        break;
      case 'json':
        parsedData = parseJSON(text);
        break;
      case 'sql':
        parsedData = parseSQL(text);
        break;
      default:
        parsedData = [];
    }

    return parsedData;
  } catch (error) {
    // Re-throw so SimplePanel can catch and show error
    throw error;
  }
}

// CSV Parser
export function parseCSV(csvText: string): DataPoint[] {
  const points: DataPoint[] = [];

  if (!csvText || csvText.trim() === '') {
    return points;
  }

  const lines = csvText.trim().split('\n');
  if (lines.length === 0) {
    return points;
  }

  // Skip header line
  const dataLines = lines.slice(1);

  for (const line of dataLines) {
    const values = line.split(',').map((v) => v.trim());

    if (values.length >= 2) {
      const timestamp = parseTimestamp(values[0]);
      const value = parseFloat(values[1]);

      if (!isNaN(timestamp) && !isNaN(value)) {
        points.push({
          timestamp,
          value,
          isAnomaly: false,
          isPrediction: false,
        });
      }
    }
  }

  return points;
}

// JSON Parser - expects array of {timestamp, value} or {time, value} or {date, value}
export function parseJSON(jsonText: string): DataPoint[] {
  const points: DataPoint[] = [];

  try {
    const data = JSON.parse(jsonText);

    if (!Array.isArray(data)) {
      return points;
    }

    for (const item of data) {
      // Try different common field names
      const timestamp =
        parseTimestamp(item.timestamp || item.time || item.date || item.ts || item.x);
      const value = parseFloat(
        item.value || item.val || item.y || item.metric || item.amount
      );

      if (!isNaN(timestamp) && !isNaN(value)) {
        points.push({
          timestamp,
          value,
          isAnomaly: false,
          isPrediction: false,
        });
      }
    }
  } catch (error) {
    console.error('Error parsing JSON:', error);
  }

  return points;
}

// SQL Parser - extracts data from INSERT statements or simple query results
export function parseSQL(sqlText: string): DataPoint[] {
  const points: DataPoint[] = [];

  if (!sqlText || sqlText.trim() === '') {
    return points;
  }

  // Pattern 1: INSERT INTO ... VALUES (...)
  const insertPattern = /INSERT\s+INTO\s+\w+.*?VALUES\s*\((.*?)\)/gi;
  let match;

  while ((match = insertPattern.exec(sqlText)) !== null) {
    const values = match[1].split(',').map((v) => v.trim().replace(/['"]/g, ''));

    if (values.length >= 2) {
      const timestamp = parseTimestamp(values[0]);
      const value = parseFloat(values[1]);

      if (!isNaN(timestamp) && !isNaN(value)) {
        points.push({
          timestamp,
          value,
          isAnomaly: false,
          isPrediction: false,
        });
      }
    }
  }

  // Pattern 2: Query result format (pipe-separated or tab-separated)
  if (points.length === 0) {
    const lines = sqlText.split('\n');
    for (const line of lines) {
      // Skip SQL comments and empty lines
      if (
        line.trim() === '' ||
        line.trim().startsWith('--') ||
        line.trim().startsWith('/*')
      ) {
        continue;
      }

      // Try pipe-separated
      let values = line.split('|').map((v) => v.trim());

      // Try tab-separated if pipe didn't work
      if (values.length < 2) {
        values = line.split('\t').map((v) => v.trim());
      }

      // Try comma-separated as fallback
      if (values.length < 2) {
        values = line.split(',').map((v) => v.trim());
      }

      if (values.length >= 2) {
        const timestamp = parseTimestamp(values[0]);
        const value = parseFloat(values[1]);

        if (!isNaN(timestamp) && !isNaN(value)) {
          points.push({
            timestamp,
            value,
            isAnomaly: false,
            isPrediction: false,
          });
        }
      }
    }
  }

  return points;
}

function parseTimestamp(value: string | number): number {
  // If already a number, try to use it
  if (typeof value === 'number') {
    // If timestamp is in seconds, convert to milliseconds
    if (value < 10000000000) {
      return value * 1000;
    }
    return value;
  }

  // Remove quotes if present
  const cleaned = String(value).replace(/['"]/g, '').trim();

  // Try parsing as ISO date
  const isoDate = Date.parse(cleaned);
  if (!isNaN(isoDate)) {
    return isoDate;
  }

  // Try parsing as Unix timestamp
  const timestamp = parseFloat(cleaned);
  if (!isNaN(timestamp)) {
    // If timestamp is in seconds, convert to milliseconds
    if (timestamp < 10000000000) {
      return timestamp * 1000;
    }
    return timestamp;
  }

  // Try common date formats
  const dateFormats = [
    // YYYY-MM-DD HH:mm:ss
    /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/,
    // DD/MM/YYYY HH:mm:ss
    /(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/,
    // MM/DD/YYYY HH:mm:ss
    /(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/,
  ];

  for (const pattern of dateFormats) {
    const match = cleaned.match(pattern);
    if (match) {
      const parsed = Date.parse(match[1]);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
  }

  // Default to current time if parsing fails
  return Date.now();
}

export function validateDataUrl(url: string): boolean {
  if (!url || url.trim() === '') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

