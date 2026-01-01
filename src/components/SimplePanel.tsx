import React, { useState, useEffect, useMemo } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions, DataPoint, AnomalyResult, TrendPrediction, AIInsight } from 'types';
import { css, cx } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { PanelDataErrorView } from '@grafana/runtime';
import { AdvancedChart } from './AdvancedChart';
import { StatsPanel } from './StatsPanel';
import { AIInsightsPanel } from './AIInsightsPanel';
import {
  detectAnomaliesZScore,
  detectAnomaliesIQR,
  detectAnomaliesML,
  predictTrend,
  generateAIInsights,
  calculateStats,
} from '../utils/aiAnalysis';
import {
  extractTimeSeriesData,
  extractNumericValues,
} from '../utils/dataProcessing';
import { fetchDataFromUrl } from '../utils/dataLoader';

interface Props extends PanelProps<SimpleOptions> {}

const getStyles = (options: SimpleOptions) => {
  return {
    wrapper: css`
      font-family: 'Inter', 'Open Sans', sans-serif;
      position: relative;
      background: ${options.backgroundColor};
      background-image:
        radial-gradient(circle at 15% 10%, rgba(255, 255, 255, 0.08), transparent 40%),
        radial-gradient(circle at 85% 0%, rgba(255, 255, 255, 0.06), transparent 35%),
        radial-gradient(circle at 70% 90%, rgba(255, 255, 255, 0.05), transparent 45%);
      padding: 16px;
      box-sizing: border-box;
      
      /* Custom scrollbar styling */
      &::-webkit-scrollbar {
        width: 8px;
      }
      
      &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: ${options.primaryColor};
        border-radius: 4px;
      }
      
      &::-webkit-scrollbar-thumb:hover {
        background: ${options.secondaryColor};
      }
    `,
    header: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding: 14px 16px;
      border-radius: 14px;
      position: relative;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow:
        0 10px 28px rgba(0, 0, 0, 0.35),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, ${options.primaryColor}, ${options.secondaryColor});
        opacity: 0.22;
        pointer-events: none;
      }
    `,
    title: css`
      font-size: ${options.fontSize * 1.45}px;
      font-weight: 700;
      color: white;
      line-height: 1.15;
      letter-spacing: -0.01em;
      position: relative;
      text-shadow: none;
    `,
    subtitle: css`
      margin-top: 4px;
      font-size: ${options.fontSize * 0.95}px;
      color: rgba(255, 255, 255, 0.82);
      font-weight: 500;
      letter-spacing: 0.01em;
      position: relative;
    `,
    studentInfo: css`
      text-align: right;
      color: white;
      position: relative;
    `,
    content: css`
      display: flex;
      flex-direction: column;
      gap: 16px;
    `,
    chartContainer: css`
      min-height: 300px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 16px;
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28);
    `,
    statsContainer: css`
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 16px;
    `,
    modeSelector: css`
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    `,
    modeButton: css`
      padding: 8px 16px;
      border-radius: 6px;
      border: 2px solid ${options.primaryColor};
      background: transparent;
      color: ${options.primaryColor};
      font-size: ${options.fontSize * 0.9}px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: ${options.primaryColor};
        color: white;
        transform: translateY(-2px);
      }

      &.active {
        background: ${options.primaryColor};
        color: white;
      }
    `,
    loadingOverlay: css`
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      z-index: 10;
    `,
    loadingText: css`
      color: white;
      font-size: ${options.fontSize * 1.2}px;
      font-weight: 600;
    `,
    badge: css`
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: ${options.fontSize * 0.75}px;
      font-weight: 600;
      background: rgba(0, 0, 0, 0.28);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: rgba(255, 255, 255, 0.9);
      margin-left: 8px;
    `,
  };
};

export const SimplePanel: React.FC<Props> = ({ options, data, width, height, fieldConfig, id }) => {
  const styles = useStyles2(() => getStyles(options));
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string>('');
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
  const [predictions, setPredictions] = useState<TrendPrediction[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [processedData, setProcessedData] = useState<DataPoint[]>([]);
  const [externalData, setExternalData] = useState<DataPoint[]>([]);

  // Load external data if enabled (CSV, JSON, or SQL)
  useEffect(() => {
    const loadExternalData = async () => {
      if (options.enableDataUpload && options.dataUrl) {
        setDataLoading(true);
        setDataError('');
        try {
          const dataPoints = await fetchDataFromUrl(options.dataUrl, options.dataFormat);
          
          if (dataPoints.length === 0) {
            setDataError('No data loaded. Check URL and format.');
          }
          setExternalData(dataPoints);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          setDataError(`Failed to load data: ${errorMsg}`);
          setExternalData([]);
        } finally {
          setDataLoading(false);
        }
      } else {
        setExternalData([]);
        setDataError('');
      }
    };
    loadExternalData();
  }, [options.enableDataUpload, options.dataUrl, options.dataFormat]);

  // Extract and process data with limit for performance
  const numericValues = useMemo(() => {
    let values;
    // Priority: If external data is loaded, use it. Otherwise, use Grafana data
    if (options.enableDataUpload && options.dataUrl && externalData.length > 0) {
      values = externalData.map(p => p.value);
    } else {
      // Use Grafana datasource (fallback)
      values = extractNumericValues(data.series);
    }
    // Limit data points for performance (max 1000)
    return values.length > 1000 ? values.slice(-1000) : values;
  }, [data.series, externalData, options.enableDataUpload, options.dataUrl]);

  const timeSeriesData = useMemo(() => {
    let tsData;
    // Priority: If external data is loaded, use it. Otherwise, use Grafana data
    if (options.enableDataUpload && options.dataUrl && externalData.length > 0) {
      tsData = externalData;
    } else {
      // Use Grafana datasource (fallback)
      tsData = extractTimeSeriesData(data.series);
    }
    // Limit data points for performance (max 1000)
    return tsData.length > 1000 ? tsData.slice(-1000) : tsData;
  }, [data.series, externalData, options.enableDataUpload, options.dataUrl]);

  const stats = useMemo(() => {
    return calculateStats(numericValues);
  }, [numericValues]);

  // Run AI analysis with debouncing
  useEffect(() => {
    // Safety check: need at least 2 valid data points
    if (!numericValues || numericValues.length < 2 || !Array.isArray(numericValues)) {
      setInsights([]);
      setAnomalies([]);
      setPredictions([]);
      setProcessedData([]);
      return;
    }
    
    // Safety check: validate all values are numbers
    const validValues = numericValues.every(v => typeof v === 'number' && !isNaN(v) && isFinite(v));
    if (!validValues) {
      setInsights([]);
      setAnomalies([]);
      setPredictions([]);
      return;
    }

    // Force AI features when in AI Analysis mode
    const forceAIAnalysis = options.visualizationMode === 'ai-analysis';
    const shouldRunAnomalyDetection = forceAIAnalysis || options.enableAnomalyDetection;
    const shouldRunTrendPrediction = forceAIAnalysis || options.enableTrendPrediction;
    const shouldRunAIInsights = forceAIAnalysis || options.enableAIInsights;

    // Always generate basic insights if enabled
    if (shouldRunAIInsights && !shouldRunAnomalyDetection && !shouldRunTrendPrediction) {
      const basicInsights = generateAIInsights(numericValues, [], []);
      setInsights(basicInsights);
      setProcessedData(timeSeriesData);
      return;
    }

    // Skip heavy AI if nothing enabled
    if (!shouldRunAnomalyDetection && !shouldRunTrendPrediction && !shouldRunAIInsights) {
      setAnomalies([]);
      setPredictions([]);
      setInsights([]);
      setProcessedData(timeSeriesData);
      return;
    }

    // Debounce heavy computations
    const timeoutId = setTimeout(async () => {
      setLoading(true);

      try {
        let detectedAnomalies: AnomalyResult[] = [];

        // Anomaly detection (lighter algorithms only)
        if (shouldRunAnomalyDetection) {
          switch (options.anomalyMethod) {
            case 'zscore':
              detectedAnomalies = detectAnomaliesZScore(
                numericValues,
                options.anomalySensitivity
              );
              break;
            case 'iqr':
              detectedAnomalies = detectAnomaliesIQR(
                numericValues,
                options.anomalySensitivity
              );
              break;
            case 'ml':
              // Only run ML if data is not too large
              if (numericValues.length <= 100) {
                detectedAnomalies = await detectAnomaliesML(
                  numericValues,
                  options.anomalySensitivity / 10
                );
              } else {
                // Fallback to Z-Score for large datasets
                detectedAnomalies = detectAnomaliesZScore(
                  numericValues,
                  options.anomalySensitivity
                );
              }
              break;
          }
        }

        setAnomalies(detectedAnomalies);

        // Mark anomalies in data
        const dataWithAnomalies = timeSeriesData.map((point, idx) => ({
          ...point,
          isAnomaly: detectedAnomalies.some((a) => a.index === idx),
        }));
        setProcessedData(dataWithAnomalies);

        // Trend prediction (only for small datasets)
        let trendPredictions: TrendPrediction[] = [];
        if (shouldRunTrendPrediction && numericValues.length >= 5 && numericValues.length <= 100) {
          trendPredictions = await predictTrend(
            numericValues,
            Math.min(options.predictionSteps, 10) // Limit predictions
          );
        }
        setPredictions(trendPredictions);

        // AI insights (always generate when data exists)
        if (shouldRunAIInsights) {
          const aiInsights = generateAIInsights(
            numericValues,
            detectedAnomalies,
            trendPredictions
          );
          setInsights(aiInsights);
        }
      } catch (error) {
        console.error('Analysis error:', error);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    numericValues,
    timeSeriesData,
    options.enableAnomalyDetection,
    options.anomalyMethod,
    options.anomalySensitivity,
    options.enableTrendPrediction,
    options.predictionSteps,
    options.enableAIInsights,
    options.visualizationMode,
  ]);

  // Check if we have any data to display
  const hasExternalData = options.enableDataUpload && options.dataUrl && externalData.length > 0;
  // Only show error if no data source is available
  if (!options.enableDataUpload && data.series.length === 0) {
    return <PanelDataErrorView fieldConfig={fieldConfig} panelId={id} data={data} needsStringField />;
  }

  const dataToDisplay = processedData.length > 0 ? processedData : timeSeriesData;

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
          max-height: ${height}px;
          overflow-y: auto;
          overflow-x: hidden;
        `
      )}
    >
      {/* Header with student info */}
      <div className={styles.header}>
        <div>
          <div className={styles.title}>
            Advanced Analytics Panel
            {options.enableDataUpload && <span className={styles.badge}>EXTERNAL DATA</span>}
          </div>
          <div className={styles.subtitle}>MIS233 • AI insights • anomaly detection • forecasting</div>
        </div>
        <div className={styles.studentInfo} />
      </div>

      {/* Data Loading/Error State */}
      {options.enableDataUpload && dataLoading && (
        <div className={css`
          padding: 16px;
          margin: 16px;
          background: rgba(52, 152, 219, 0.1);
          border: 2px solid #3498db;
          border-radius: 8px;
          text-align: center;
          color: #3498db;
          font-size: ${options.fontSize}px;
        `}>
          <div className={css`
            font-weight: 600;
            margin-bottom: 8px;
          `}>
            Loading external data...
          </div>
        </div>
      )}
      
      {options.enableDataUpload && dataError && (
        <div className={css`
          padding: 16px;
          margin: 16px;
          background: rgba(255, 0, 0, 0.1);
          border: 2px solid #ff4444;
          border-radius: 8px;
          color: #ff4444;
          font-size: ${options.fontSize}px;
        `}>
          <strong>Error:</strong> {dataError}
          <div style={{ marginTop: '8px', fontSize: '0.9em', opacity: 0.8 }}>
            Make sure file format is correct or URL is accessible.
          </div>
        </div>
      )}

      {/* External Data Status */}
      {options.enableDataUpload && !dataLoading && (
        <div className={css`
          padding: 12px 16px;
          margin: 16px;
          background: ${hasExternalData ? 'rgba(46, 204, 113, 0.1)' : 'rgba(52, 152, 219, 0.1)'};
          border: 2px solid ${hasExternalData ? '#2ecc71' : '#3498db'};
          border-radius: 8px;
          font-size: ${options.fontSize}px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        `}>
          <div className={css`
            display: flex;
            align-items: center;
            gap: 8px;
          `}>
            {hasExternalData ? (
              <>
                <span className={css`font-size: 1.2em;`}>OK</span>
                <div>
                  <div className={css`
                    color: #2ecc71;
                    font-weight: 600;
                    font-size: ${options.fontSize * 0.95}px;
                  `}>
                    External Data Loaded
                  </div>
                  <div className={css`
                    color: #888;
                    font-size: ${options.fontSize * 0.8}px;
                    margin-top: 2px;
                  `}>
                    {externalData.length} data points from URL
                  </div>
                </div>
              </>
            ) : (
              <>
                <span className={css`font-size: 1.2em;`}>i</span>
                <div>
                  <div className={css`
                    color: #3498db;
                    font-weight: 600;
                    font-size: ${options.fontSize * 0.95}px;
                  `}>
                    External Data Upload Enabled
                  </div>
                  <div className={css`
                    color: #888;
                    font-size: ${options.fontSize * 0.8}px;
                    margin-top: 2px;
                  `}>
                    {options.dataUrl ? 'Waiting for data from URL' : 'Add a Data URL in settings to load external data'}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {!hasExternalData && !options.dataUrl && (
            <div className={css`
              color: #888;
              font-size: ${options.fontSize * 0.8}px;
              font-style: italic;
            `}>
              Using Grafana datasource
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div className={styles.content}>
        {/* Visualization Mode: Chart */}
        {options.visualizationMode === 'chart' && (
          <div className={styles.chartContainer}>
            <AdvancedChart
              data={dataToDisplay}
              predictions={predictions}
              chartType={options.chartType}
              primaryColor={options.primaryColor}
              secondaryColor={options.secondaryColor}
              anomalyColor={options.anomalyColor}
              enableTooltips={options.enableTooltips}
              enableAnimations={options.enableAnimations}
              animationDuration={options.animationDuration}
              showLegend={options.showLegend}
            />
          </div>
        )}

        {/* Visualization Mode: Gauge */}
        {options.visualizationMode === 'gauge' && stats && (
          <div className={styles.chartContainer}>
            <div className={css`
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 300px;
              flex-direction: column;
              gap: 20px;
            `}>
              <div className={css`
                font-size: ${options.fontSize * 3}px;
                font-weight: 700;
                color: ${options.primaryColor};
                font-family: 'Courier New', monospace;
                text-shadow: 0 0 20px ${options.primaryColor}40;
              `}>
                {stats.mean.toFixed(2)}
              </div>
              <div className={css`
                font-size: ${options.fontSize * 1.2}px;
                color: ${options.secondaryColor};
                text-transform: uppercase;
                letter-spacing: 2px;
              `}>
                Average Value
              </div>
              <div className={css`
                display: flex;
                gap: 30px;
                margin-top: 20px;
              `}>
                <div className={css`text-align: center;`}>
                  <div className={css`
                    font-size: ${options.fontSize * 1.5}px;
                    color: ${options.primaryColor};
                    font-weight: 600;
                  `}>
                    {stats.min.toFixed(2)}
                  </div>
                  <div className={css`
                    font-size: ${options.fontSize * 0.9}px;
                    color: #888;
                    margin-top: 4px;
                  `}>MIN</div>
                </div>
                <div className={css`text-align: center;`}>
                  <div className={css`
                    font-size: ${options.fontSize * 1.5}px;
                    color: ${options.primaryColor};
                    font-weight: 600;
                  `}>
                    {stats.max.toFixed(2)}
                  </div>
                  <div className={css`
                    font-size: ${options.fontSize * 0.9}px;
                    color: #888;
                    margin-top: 4px;
                  `}>MAX</div>
                </div>
                <div className={css`text-align: center;`}>
                  <div className={css`
                    font-size: ${options.fontSize * 1.5}px;
                    color: ${options.primaryColor};
                    font-weight: 600;
                  `}>
                    {stats.stdDev.toFixed(2)}
                  </div>
                  <div className={css`
                    font-size: ${options.fontSize * 0.9}px;
                    color: #888;
                    margin-top: 4px;
                  `}>STD DEV</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visualization Mode: Stats */}
        {options.visualizationMode === 'stats' && stats && (
          <StatsPanel
            stats={stats}
            primaryColor={options.primaryColor}
            fontSize={options.fontSize}
          />
        )}

        {/* Visualization Mode: AI Analysis */}
        {options.visualizationMode === 'ai-analysis' && (
          <>
            {/* AI Insights */}
            <AIInsightsPanel
              insights={insights}
              fontSize={options.fontSize}
              enableAnimations={options.enableAnimations}
            />
            
            {/* Statistics */}
            {stats && (
              <StatsPanel
                stats={stats}
                primaryColor={options.primaryColor}
                fontSize={options.fontSize}
              />
            )}
            
            {/* Anomaly Detection Results - Always shown in AI Analysis mode */}
            <div className={css`
                padding: 16px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 8px;
                margin: 12px 0;
              `}>
                <div className={css`
                  font-size: ${options.fontSize * 1.2}px;
                  font-weight: 700;
                  color: ${anomalies.length > 0 ? options.anomalyColor : '#888'};
                  margin-bottom: 12px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                `}>
                  {anomalies.length > 0 ? 'ALERT' : 'OK'} 
                  Anomalies detected: {anomalies.length}
                  <span className={css`
                    font-size: ${options.fontSize * 0.8}px;
                    font-weight: 500;
                    color: #888;
                    margin-left: 8px;
                  `}>
                    (Method: {options.anomalyMethod.toUpperCase()})
                  </span>
                </div>
                
                {anomalies.length > 0 ? (
                  <div className={css`
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    max-height: 300px;
                    overflow-y: auto;
                  `}>
                    {anomalies.slice(0, 10).map((anomaly, idx) => (
                      <div key={idx} className={css`
                        padding: 8px 12px;
                        background: rgba(255, 0, 0, 0.1);
                        border-left: 3px solid ${options.anomalyColor};
                        border-radius: 4px;
                        font-size: ${options.fontSize * 0.9}px;
                      `}>
                        <strong>Index {anomaly.index}:</strong> Value = {anomaly.value.toFixed(2)}, 
                        Score = {anomaly.score.toFixed(2)}
                      </div>
                    ))}
                    {anomalies.length > 10 && (
                      <div className={css`
                        text-align: center;
                        color: #888;
                        font-size: ${options.fontSize * 0.85}px;
                        padding: 8px;
                      `}>
                        ... and {anomalies.length - 10} more anomalies
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={css`
                    text-align: center;
                    padding: 20px;
                    color: #888;
                    font-size: ${options.fontSize * 0.9}px;
                  `}>
                    No anomalies detected in the current dataset. All data points are within normal range.
                  </div>
                )}
              </div>
            
            {/* Trend Predictions - Always shown in AI Analysis mode */}
            {predictions.length > 0 && (
              <div className={css`
                padding: 16px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 8px;
                margin: 12px 0;
              `}>
                <div className={css`
                  font-size: ${options.fontSize * 1.2}px;
                  font-weight: 700;
                  color: ${options.secondaryColor};
                  margin-bottom: 12px;
                `}>
                  Trend forecast: next {predictions.length} points
                </div>
                <div className={css`
                  color: rgba(255, 255, 255, 0.7);
                  font-size: ${options.fontSize * 0.9}px;
                  line-height: 1.45;
                  margin-bottom: 12px;
                `}>
                  This section shows the model’s estimated values for the <strong>next {predictions.length} data points</strong>.
                  “+1” means the next point right after the last real measurement. The percent value is the model’s <strong>confidence</strong>
                  (higher = more reliable) and it typically decreases as we predict further into the future.
                </div>
                <div className={css`
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                  gap: 8px;
                  max-height: 200px;
                  overflow-y: auto;
                `}>
                  {predictions.slice(0, 10).map((pred, idx) => (
                    <div key={idx} className={css`
                      padding: 8px;
                      background: rgba(0, 100, 255, 0.1);
                      border: 1px solid ${options.secondaryColor}40;
                      border-radius: 4px;
                      text-align: center;
                      font-size: ${options.fontSize * 0.85}px;
                    `}>
                      <div className={css`
                        color: ${options.secondaryColor};
                        font-weight: 600;
                      `}>
                        +{idx + 1}
                      </div>
                      <div className={css`color: #fff;`}>
                        {pred.value.toFixed(2)}
                      </div>
                      <div className={css`
                        color: #888;
                        font-size: 0.9em;
                      `}>
                        Confidence: {(pred.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Show Stats below chart if enabled and not in stats mode */}
        {options.showStats && options.visualizationMode === 'chart' && stats && (
          <StatsPanel
            stats={stats}
            primaryColor={options.primaryColor}
            fontSize={options.fontSize}
          />
        )}

        {/* Show AI Insights below chart if enabled and not in ai-analysis mode */}
        {options.enableAIInsights && options.visualizationMode === 'chart' && (
          <AIInsightsPanel
            insights={insights}
            fontSize={options.fontSize}
            enableAnimations={options.enableAnimations}
          />
        )}

        {/* Series count (legacy feature) */}
        {options.showSeriesCount && (
          <div
            className={css`
              padding: 12px;
              background: rgba(0, 0, 0, 0.2);
              border-radius: 6px;
              font-size: ${options.fontSize}px;
              color: ${options.primaryColor};
            `}
          >
            Number of series: {data.series.length}
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingText}>
            AI Analysis in Progress...
          </div>
        </div>
      )}
    </div>
  );
};
