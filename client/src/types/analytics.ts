export interface QueryPlan {
  intent: 'aggregation' | 'filtering' | 'comparison' | 'trend' | 'distribution' | 'general_qa';
  targetFiles: string[];
  sqlQuery?: string;
  aggregationColumn?: string;
  groupColumn?: string;
  filterConditions?: string[];
  suggestedChartType?: 'bar' | 'line' | 'area' | 'pie' | 'scatter';
  explanation: string;
}

export interface AnalyticalQueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  sqlExecuted?: string;
  suggestedChart?: {
    type: 'bar' | 'line' | 'area' | 'pie' | 'scatter';
    xAxisKey: string;
    yAxisKey: string;
    title: string;
  };
}

export interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtext?: string;
  fileSource: string;
}
