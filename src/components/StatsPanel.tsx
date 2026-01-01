import React from 'react';
import { css } from '@emotion/css';
import { useTheme2 } from '@grafana/ui';

interface Stats {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  variance?: number;
  count: number;
}

interface Props {
  stats: Stats | null;
  primaryColor: string;
  fontSize: number;
}

export const StatsPanel: React.FC<Props> = ({ stats, primaryColor, fontSize }) => {
  const theme = useTheme2();

  const styles = {
    container: css`
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      padding: 16px;
      background: ${theme.colors.background.secondary};
      border-radius: 8px;
      margin: 12px 0;
    `,
    statBox: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
      background: ${theme.colors.background.primary};
      border-radius: 6px;
      border: 1px solid ${theme.colors.border.weak};
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        border-color: ${primaryColor};
      }
    `,
    statLabel: css`
      font-size: ${fontSize * 0.9}px;
      color: ${theme.colors.text.secondary};
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    `,
    statValue: css`
      font-size: ${fontSize * 1.4}px;
      font-weight: 700;
      color: ${primaryColor};
      font-family: 'Courier New', monospace;
    `,
    noData: css`
      text-align: center;
      padding: 20px;
      color: ${theme.colors.text.secondary};
      font-size: ${fontSize}px;
    `,
  };

  if (!stats) {
    return <div className={styles.noData}>No statistical data available</div>;
  }

  const statItems = [
    { label: 'Count', value: stats.count.toFixed(0) },
    { label: 'Mean', value: stats.mean.toFixed(2) },
    { label: 'Median', value: stats.median.toFixed(2) },
    { label: 'Min', value: stats.min.toFixed(2) },
    { label: 'Max', value: stats.max.toFixed(2) },
    { label: 'Std Dev', value: stats.stdDev.toFixed(2) },
  ];

  return (
    <div className={styles.container}>
      {statItems.map((item) => (
        <div key={item.label} className={styles.statBox}>
          <div className={styles.statLabel}>
            {item.label}
          </div>
          <div className={styles.statValue}>{item.value}</div>
        </div>
      ))}
    </div>
  );
};

