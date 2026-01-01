import React from 'react';
import { css, keyframes } from '@emotion/css';
import { useTheme2 } from '@grafana/ui';
import { AIInsight } from '../types';

interface Props {
  insights: AIInsight[];
  fontSize: number;
  enableAnimations: boolean;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

export const AIInsightsPanel: React.FC<Props> = ({
  insights,
  fontSize,
  enableAnimations,
}) => {
  const theme = useTheme2();

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'critical':
        return theme.colors.error.main;
      case 'warning':
        return theme.colors.warning.main;
      case 'info':
        return theme.colors.info.main;
      default:
        return theme.colors.text.primary;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return '[!]';
      case 'warning':
        return '[!]';
      case 'info':
        return '[i]';
      default:
        return '[i]';
    }
  };

  const styles = {
    container: css`
      padding: 16px;
      background: ${theme.colors.background.secondary};
      border-radius: 8px;
      margin: 12px 0;
    `,
    title: css`
      font-size: ${fontSize * 1.2}px;
      font-weight: 700;
      color: ${theme.colors.text.primary};
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    `,
    insightsList: css`
      display: flex;
      flex-direction: column;
      gap: 12px;
    `,
    insight: css`
      display: flex;
      align-items: flex-start;
      padding: 12px;
      background: ${theme.colors.background.primary};
      border-radius: 6px;
      border-left: 4px solid;
      transition: all 0.3s ease;
      ${enableAnimations ? `animation: ${fadeIn} 0.5s ease-out;` : ''}

      &:hover {
        transform: translateX(4px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
    `,
    insightIcon: css`
      font-size: ${fontSize * 1.5}px;
      margin-right: 12px;
      flex-shrink: 0;
    `,
    insightContent: css`
      flex: 1;
    `,
    insightMessage: css`
      font-size: ${fontSize}px;
      color: ${theme.colors.text.primary};
      line-height: 1.5;
      margin-bottom: 4px;
    `,
    insightConfidence: css`
      font-size: ${fontSize * 0.85}px;
      color: ${theme.colors.text.secondary};
      font-style: italic;
    `,
    noInsights: css`
      text-align: center;
      padding: 20px;
      color: ${theme.colors.text.secondary};
      font-size: ${fontSize}px;
    `,
    aiLabel: css`
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: ${fontSize * 0.8}px;
      font-weight: 600;
      color: white;
      margin-left: 8px;
    `,
  };

  if (!insights || insights.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.title}>
          AI Insights
          <span className={styles.aiLabel}>POWERED BY AI</span>
        </div>
        <div className={styles.noInsights}>
          No AI insights available yet. Add more data points for analysis.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        AI Insights
        <span className={styles.aiLabel}>POWERED BY AI</span>
      </div>
      <div className={styles.insightsList}>
        {insights.map((insight, index) => (
          <div
            key={index}
            className={styles.insight}
            style={{
              borderLeftColor: getInsightColor(insight.type),
              animationDelay: enableAnimations ? `${index * 0.1}s` : '0s',
            }}
          >
            <div className={styles.insightIcon}>
              {getInsightIcon(insight.type)}
            </div>
            <div className={styles.insightContent}>
              <div className={styles.insightMessage}>{insight.message}</div>
              <div className={styles.insightConfidence}>
                Confidence: {(insight.confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

