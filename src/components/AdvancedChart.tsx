import React, { useMemo } from 'react';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { DataPoint, ChartType, TrendPrediction } from '../types';
import { css } from '@emotion/css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  data: DataPoint[];
  predictions?: TrendPrediction[];
  chartType: ChartType;
  primaryColor: string;
  secondaryColor: string;
  anomalyColor: string;
  enableTooltips: boolean;
  enableAnimations: boolean;
  animationDuration: number;
  showLegend: boolean;
}

export const AdvancedChart: React.FC<Props> = ({
  data,
  predictions = [],
  chartType,
  primaryColor,
  secondaryColor,
  anomalyColor,
  enableTooltips,
  enableAnimations,
  animationDuration,
  showLegend,
}) => {
  const isScatter = chartType === 'scatter';

  const chartData = useMemo(() => {
    const labels = data.map((point) => {
      const date = new Date(point.timestamp);
      return date.toLocaleTimeString();
    });

    const values = data.map((point) => point.value);
    const anomalyPoints = data.map((point) =>
      point.isAnomaly ? point.value : null
    );

    // Prediction data - connect to last actual data point
    const allLabels = [
      ...labels,
      ...predictions.map((p) => {
        const date = new Date(p.timestamp);
        return date.toLocaleTimeString();
      }),
    ];

    // Safe array length calculations
    const dataLength = Math.max(0, data.length);
    const predictionsLength = Math.max(0, Math.min(predictions.length, 100)); // Cap at 100
    const bridgeLength = Math.max(0, dataLength - 1);

    // Bridge prediction to last actual value
    const lastActualValue = dataLength > 0 ? data[data.length - 1].value : null;
    const predictedValues = dataLength > 0 && predictionsLength > 0 ? [
      ...new Array(bridgeLength).fill(null),
      lastActualValue, // Connect point
      ...predictions.slice(0, 100).map((p) => p.value), // Limit predictions
    ] : [];

    // Scatter plot uses {x, y} format instead of labels
    if (chartType === 'scatter') {
      const datasets: any[] = [
        {
          label: 'Actual Data',
          data: data.map((point, idx) => ({ x: idx, y: point.value })),
          borderColor: primaryColor,
          backgroundColor: primaryColor,
          borderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ];

      // Add anomaly points for scatter
      const anomalyScatterPoints = data
        .map((point, idx) => (point.isAnomaly ? { x: idx, y: point.value } : null))
        .filter((p) => p !== null);

      if (anomalyScatterPoints.length > 0) {
        datasets.push({
          label: 'Anomalies',
          data: anomalyScatterPoints,
          borderColor: anomalyColor,
          backgroundColor: anomalyColor,
          borderWidth: 2,
          pointRadius: 10,
          pointHoverRadius: 12,
          pointStyle: 'triangle',
        });
      }

      // Add predictions for scatter
      if (predictionsLength > 0) {
        datasets.push({
          label: 'AI Predictions',
          data: predictions.slice(0, 100).map((p, idx) => ({ 
            x: dataLength + idx, 
            y: p.value 
          })),
          borderColor: secondaryColor,
          backgroundColor: secondaryColor
            .replace(')', ', 0.5)')
            .replace('rgb', 'rgba'),
          borderWidth: 2,
          pointRadius: 7,
          pointHoverRadius: 9,
          pointStyle: 'cross',
        });
      }

      return { datasets };
    }

    // For line, bar, area charts
    const datasets: any[] = [
      {
        label: 'Actual Data',
        data: predictionsLength > 0 ? [...values, ...new Array(predictionsLength).fill(null)] : values,
        borderColor: primaryColor,
        backgroundColor: (ctx: any) => {
          // Gradient fill for "area" only
          if (chartType !== 'area') {
            return primaryColor;
          }
          const chart = ctx.chart;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) {
            return primaryColor.replace(')', ', 0.18)').replace('rgb', 'rgba');
          }
          const g = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, primaryColor.replace(')', ', 0.35)').replace('rgb', 'rgba'));
          g.addColorStop(1, 'rgba(0,0,0,0)');
          return g;
        },
        borderWidth: 2.5,
        fill: chartType === 'area',
        tension: 0.42,
        pointRadius: 3.5,
        pointHoverRadius: 6,
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        borderCapStyle: 'round',
        borderJoinStyle: 'round',
        spanGaps: false,
      },
    ];

    // Add anomaly points
    if (anomalyPoints.some((p) => p !== null)) {
      datasets.push({
        label: 'Anomalies',
        data: predictionsLength > 0 ? [...anomalyPoints, ...new Array(predictionsLength).fill(null)] : anomalyPoints,
        borderColor: anomalyColor,
        backgroundColor: anomalyColor,
        borderWidth: 2,
        pointRadius: 8,
        pointHoverRadius: 10,
        pointStyle: 'triangle',
        showLine: false,
      });
    }

    // Add predictions - connected to last actual value
    if (predictionsLength > 0 && predictedValues.length > 0) {
      datasets.push({
        label: 'AI Predictions',
        data: predictedValues,
        borderColor: secondaryColor,
        backgroundColor: secondaryColor.replace(')', ', 0.12)').replace('rgb', 'rgba'),
        borderWidth: 2.5,
        borderDash: [7, 5],
        fill: false,
        tension: 0.42,
        pointRadius: 4.5,
        pointHoverRadius: 7,
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        borderCapStyle: 'round',
        borderJoinStyle: 'round',
        spanGaps: false,
      });
    }

    return {
      labels: allLabels,
      datasets,
    };
  }, [
    data,
    predictions,
    chartType,
    primaryColor,
    secondaryColor,
    anomalyColor,
  ]);

  const options: ChartOptions<any> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      layout: {
        padding: { top: 6, left: 6, right: 10, bottom: 6 },
      },
      elements: {
        line: {
          tension: 0.42,
          borderWidth: 2.5,
          capBezierPoints: true,
        },
        point: {
          hitRadius: 10,
        },
      },
      plugins: {
        legend: {
          display: showLegend,
          position: 'top' as const,
          labels: {
            color: 'rgba(255,255,255,0.92)',
            font: {
              size: 12,
              family: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
            },
            usePointStyle: true,
            boxWidth: 10,
            boxHeight: 10,
            padding: 14,
          },
        },
        tooltip: {
          enabled: enableTooltips,
          backgroundColor: 'rgba(15, 18, 28, 0.92)',
          titleColor: 'rgba(255,255,255,0.95)',
          bodyColor: 'rgba(255,255,255,0.92)',
          borderColor: 'rgba(255,255,255,0.16)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          displayColors: true,
          titleFont: {
            family: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
            weight: '600',
          } as any,
          bodyFont: {
            family: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
            weight: '500',
          } as any,
          callbacks: {
            label: function (context: any) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(2);
              }
              return label;
            },
          },
        },
      },
      scales: {
        x: {
          type: isScatter ? ('linear' as const) : ('category' as const),
          display: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.07)',
            tickColor: 'rgba(255, 255, 255, 0.07)',
          },
          ticks: {
            color: 'rgba(255,255,255,0.75)',
            maxRotation: isScatter ? 0 : 35,
            minRotation: 0,
            font: {
              family: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
              size: 11,
            },
          },
          border: {
            color: 'rgba(255,255,255,0.12)',
          },
        },
        y: {
          display: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.07)',
            tickColor: 'rgba(255, 255, 255, 0.07)',
          },
          ticks: {
            color: 'rgba(255,255,255,0.75)',
            font: {
              family: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
              size: 11,
            },
          },
          border: {
            color: 'rgba(255,255,255,0.12)',
          },
        },
      },
      animation: {
        duration: enableAnimations ? animationDuration : 0,
        easing: 'easeInOutQuart' as const,
      },
    }),
    [
      showLegend,
      enableTooltips,
      primaryColor,
      enableAnimations,
      animationDuration,
      isScatter,
      chartType,
    ]
  );

  const styles = {
    container: css`
      width: 100%;
      height: 100%;
      position: relative;
    `,
  };

  const ChartComponent =
    chartType === 'bar' ? Bar : chartType === 'scatter' ? Scatter : Line;

  return (
    <div className={styles.container}>
      <ChartComponent data={chartData} options={options} />
    </div>
  );
};

