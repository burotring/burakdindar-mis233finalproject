import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './components/SimplePanel';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions((builder) => {
  return builder
    // ===== MANDATORY: STUDENT INFORMATION =====
    .addTextInput({
      path: 'studentName',
      name: 'Student Name',
      description: 'Your full name (MANDATORY - Required to pass)',
      defaultValue: 'Burak Dindar',
      category: ['Student Info'],
    })
    .addTextInput({
      path: 'studentId',
      name: 'Student ID',
      description: 'Your student ID number',
      defaultValue: '2022502126',
      category: ['Student Info'],
    })

    // ===== VISUALIZATION MODE =====
    .addRadio({
      path: 'visualizationMode',
      name: 'Visualization Mode',
      description: 'Choose how to display data',
      defaultValue: 'chart',
      category: ['Visualization'],
      settings: {
        options: [
          { value: 'chart', label: 'Chart' },
          { value: 'gauge', label: 'Gauge' },
          { value: 'stats', label: 'Stats' },
          { value: 'ai-analysis', label: 'AI Analysis' },
        ],
      },
    })
    .addRadio({
      path: 'chartType',
      name: 'Chart Type',
      description: 'Type of chart to display',
      defaultValue: 'line',
      category: ['Visualization'],
      settings: {
        options: [
          { value: 'line', label: 'Line Chart' },
          { value: 'bar', label: 'Bar Chart' },
          { value: 'area', label: 'Area Chart' },
          { value: 'scatter', label: 'Scatter Plot' },
        ],
      },
      showIf: (config) => config.visualizationMode === 'chart',
    })

    // ===== COLOR CUSTOMIZATION =====
    .addColorPicker({
      path: 'primaryColor',
      name: 'Primary Color',
      description: 'Main color for data visualization',
      defaultValue: 'rgb(31, 120, 193)',
      category: ['Colors'],
    })
    .addColorPicker({
      path: 'secondaryColor',
      name: 'Secondary Color',
      description: 'Color for predictions and secondary elements',
      defaultValue: 'rgb(255, 127, 14)',
      category: ['Colors'],
    })
    .addColorPicker({
      path: 'backgroundColor',
      name: 'Background Color',
      description: 'Panel background color',
      defaultValue: 'rgba(20, 20, 30, 0.9)',
      category: ['Colors'],
    })
    .addColorPicker({
      path: 'anomalyColor',
      name: 'Anomaly Color',
      description: 'Color for detected anomalies',
      defaultValue: 'rgb(255, 0, 0)',
      category: ['Colors'],
    })

    // ===== AI/ML FEATURES =====
    .addBooleanSwitch({
      path: 'enableAnomalyDetection',
      name: 'Enable Anomaly Detection',
      description: 'Detect unusual patterns in data using AI',
      defaultValue: false,
      category: ['AI Features'],
    })
    .addRadio({
      path: 'anomalyMethod',
      name: 'Anomaly Detection Method',
      description: 'Algorithm for detecting anomalies',
      defaultValue: 'iqr',
      category: ['AI Features'],
      settings: {
        options: [
          { value: 'zscore', label: 'Z-Score (Fast, Sensitive)' },
          { value: 'iqr', label: 'IQR (Recommended, Robust)' },
          { value: 'ml', label: 'Machine Learning (Slow, Advanced)' },
        ],
      },
      showIf: (config) => config.enableAnomalyDetection,
    })
    .addSliderInput({
      path: 'anomalySensitivity',
      name: 'Anomaly Sensitivity',
      description: 'LOWER = more anomalies, HIGHER = fewer anomalies (stricter)',
      defaultValue: 3.0,
      category: ['AI Features'],
      settings: {
        min: 1.5,
        max: 5,
        step: 0.1,
      },
      showIf: (config) => config.enableAnomalyDetection,
    })
    .addBooleanSwitch({
      path: 'enableTrendPrediction',
      name: 'Enable Trend Prediction',
      description: 'Predict future values using Machine Learning (WARNING: Heavy computation)',
      defaultValue: false,
      category: ['AI Features'],
    })
    .addSliderInput({
      path: 'predictionSteps',
      name: 'Prediction Steps',
      description: 'Number of future points to predict',
      defaultValue: 5,
      category: ['AI Features'],
      settings: {
        min: 3,
        max: 20,
        step: 1,
      },
      showIf: (config) => config.enableTrendPrediction,
    })
    .addBooleanSwitch({
      path: 'enableAIInsights',
      name: 'Enable AI Insights',
      description: 'Generate intelligent insights from data analysis',
      defaultValue: false,
      category: ['AI Features'],
    })

    // ===== DATA UPLOAD =====
    .addBooleanSwitch({
      path: 'enableDataUpload',
      name: 'Enable External Data Upload',
      description: 'Load data from external files (CSV, JSON, SQL)',
      defaultValue: false,
      category: ['Data Source'],
    })
    .addRadio({
      path: 'dataFormat',
      name: 'Data Format',
      description: 'Format of the data file',
      defaultValue: 'csv',
      category: ['Data Source'],
      settings: {
        options: [
          { value: 'csv', label: 'CSV' },
          { value: 'json', label: 'JSON' },
          { value: 'sql', label: 'SQL' },
        ],
      },
      showIf: (config) => config.enableDataUpload,
    })
    .addTextInput({
      path: 'dataUrl',
      name: 'Data URL',
      description: 'URL to data file (CSV, JSON array, or SQL dump)',
      defaultValue: '',
      category: ['Data Source'],
      showIf: (config) => config.enableDataUpload,
    })

    // ===== DISPLAY OPTIONS =====
    .addBooleanSwitch({
      path: 'showStats',
      name: 'Show Statistics',
      description: 'Display statistical metrics',
      defaultValue: true,
      category: ['Display'],
    })
    .addBooleanSwitch({
      path: 'showLegend',
      name: 'Show Legend',
      description: 'Display chart legend',
      defaultValue: true,
      category: ['Display'],
    })
    .addBooleanSwitch({
      path: 'enableTooltips',
      name: 'Enable Tooltips',
      description: 'Show interactive tooltips on hover',
      defaultValue: true,
      category: ['Display'],
    })
    .addSliderInput({
      path: 'fontSize',
      name: 'Font Size',
      description: 'Base font size for text',
      defaultValue: 14,
      category: ['Display'],
      settings: {
        min: 10,
        max: 24,
        step: 1,
      },
    })

    // ===== ANIMATIONS =====
    .addBooleanSwitch({
      path: 'enableAnimations',
      name: 'Enable Animations',
      description: 'Smooth transitions and animations',
      defaultValue: true,
      category: ['Animation'],
    })
    .addSliderInput({
      path: 'animationDuration',
      name: 'Animation Duration',
      description: 'Duration of animations in milliseconds',
      defaultValue: 750,
      category: ['Animation'],
      settings: {
        min: 0,
        max: 2000,
        step: 50,
      },
      showIf: (config) => config.enableAnimations,
    })

    // ===== LEGACY OPTIONS =====
    .addBooleanSwitch({
      path: 'showSeriesCount',
      name: 'Show series counter',
      defaultValue: false,
      category: ['Legacy'],
    })
    .addTextInput({
      path: 'text',
      name: 'Simple text option',
      description: 'Description of panel option',
      defaultValue: 'Advanced AI Panel',
      category: ['Legacy'],
    });
});
