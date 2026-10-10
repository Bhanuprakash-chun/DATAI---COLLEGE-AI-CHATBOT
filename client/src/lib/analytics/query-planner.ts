import { FileMetadata, TabularSheetSchema, TabularColumnProfile } from '@/types/file';
import { CalculationEvidence, MessageChart } from '@/types/chat';
import { AnalyticalQueryResult, QueryPlan } from '@/types/analytics';
import { analyticsEngine } from './duckdb-client';
import { generateId } from '@/lib/utils';

export class QueryPlanner {
  /**
   * Plans and executes an analytical query over tabular file schemas
   */
  static planAndExecute(
    question: string,
    file: FileMetadata,
    cachedRows: Record<string, any>[]
  ): {
    plan: QueryPlan;
    result: AnalyticalQueryResult;
    evidence: CalculationEvidence;
    chart?: MessageChart;
  } | null {
    if (!file.sheets || file.sheets.length === 0 || cachedRows.length === 0) {
      return null;
    }

    const sheet = file.sheets[0];
    const columns = sheet.columns;
    const lowerQ = question.toLowerCase();

    // Register rows in analytics engine
    const tableName = file.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    analyticsEngine.registerTable(tableName, cachedRows);

    // Identify numeric/metric columns
    const metricCols = columns.filter((c) => c.type === 'INTEGER' || c.type === 'DECIMAL');
    // Identify categorical/group columns
    const categoricalCols = columns.filter((c) => c.type === 'TEXT' || c.type === 'BOOLEAN' || c.type === 'DATE');

    // 1. Detect target metric column
    let targetMetric = metricCols.find((c) => lowerQ.includes(c.name.toLowerCase()));
    if (!targetMetric && metricCols.length > 0) {
      // Heuristics for common terms
      if (lowerQ.includes('revenue') || lowerQ.includes('sales') || lowerQ.includes('amount')) {
        targetMetric = metricCols.find((c) => /rev|sale|amount|total|price/i.test(c.name));
      } else if (lowerQ.includes('profit') || lowerQ.includes('margin')) {
        targetMetric = metricCols.find((c) => /profit|margin/i.test(c.name));
      } else if (lowerQ.includes('count') || lowerQ.includes('quantity') || lowerQ.includes('order')) {
        targetMetric = metricCols.find((c) => /qty|count|order/i.test(c.name));
      } else if (lowerQ.includes('salary') || lowerQ.includes('cost') || lowerQ.includes('expense')) {
        targetMetric = metricCols.find((c) => /salary|cost|expense|comp/i.test(c.name));
      }
      if (!targetMetric) {
        targetMetric = metricCols[0];
      }
    }

    // 2. Detect group-by column
    let targetGroup = categoricalCols.find((c) => lowerQ.includes(c.name.toLowerCase()));
    if (!targetGroup && categoricalCols.length > 0) {
      if (lowerQ.includes('region') || lowerQ.includes('country') || lowerQ.includes('area') || lowerQ.includes('city')) {
        targetGroup = categoricalCols.find((c) => /region|country|area|city|state/i.test(c.name));
      } else if (lowerQ.includes('product') || lowerQ.includes('item') || lowerQ.includes('category')) {
        targetGroup = categoricalCols.find((c) => /product|item|category/i.test(c.name));
      } else if (lowerQ.includes('department') || lowerQ.includes('team') || lowerQ.includes('dept')) {
        targetGroup = categoricalCols.find((c) => /dept|department|team/i.test(c.name));
      } else if (lowerQ.includes('month') || lowerQ.includes('date') || lowerQ.includes('year') || lowerQ.includes('quarter')) {
        targetGroup = categoricalCols.find((c) => /date|month|year|qtr|quarter/i.test(c.name));
      } else if (lowerQ.includes('customer') || lowerQ.includes('client') || lowerQ.includes('user')) {
        targetGroup = categoricalCols.find((c) => /customer|client|user|name/i.test(c.name));
      }
    }

    // 3. Formulate SQL and intent
    const isSum = lowerQ.includes('total') || lowerQ.includes('sum') || lowerQ.includes('highest') || lowerQ.includes('top');
    const isAvg = lowerQ.includes('average') || lowerQ.includes('avg') || lowerQ.includes('mean');
    const isCountOnly = lowerQ.includes('how many') || lowerQ.includes('number of') || (!targetMetric && lowerQ.includes('count'));
    const isTop = lowerQ.includes('top') || lowerQ.includes('highest') || lowerQ.includes('best') || lowerQ.includes('leading');
    const isBottom = lowerQ.includes('lowest') || lowerQ.includes('worst') || lowerQ.includes('bottom') || lowerQ.includes('least');

    let sql = '';
    let planIntent: QueryPlan['intent'] = 'aggregation';
    let suggestedChartType: MessageChart['type'] = 'bar';

    if (targetGroup && targetMetric) {
      const aggFunc = isAvg ? 'AVG' : 'SUM';
      const alias = `${aggFunc.toLowerCase()}_${targetMetric.name}`;
      const sortDirection = isBottom ? 'ASC' : 'DESC';
      const limit = isTop || isBottom ? 10 : 25;

      sql = `SELECT "${targetGroup.name}", ${aggFunc}("${targetMetric.name}") as "${alias}" FROM ${tableName} GROUP BY "${targetGroup.name}" ORDER BY "${alias}" ${sortDirection} LIMIT ${limit};`;
      planIntent = isTop ? 'comparison' : 'aggregation';
      suggestedChartType = /date|month|year/i.test(targetGroup.name) ? 'line' : 'bar';
    } else if (targetGroup && isCountOnly) {
      sql = `SELECT "${targetGroup.name}", COUNT(*) as "count" FROM ${tableName} GROUP BY "${targetGroup.name}" ORDER BY "count" DESC LIMIT 15;`;
      planIntent = 'aggregation';
      suggestedChartType = 'bar';
    } else if (targetMetric) {
      const aggFunc = isAvg ? 'AVG' : 'SUM';
      const alias = `${aggFunc.toLowerCase()}_${targetMetric.name}`;
      sql = `SELECT ${aggFunc}("${targetMetric.name}") as "${alias}" FROM ${tableName};`;
      planIntent = 'aggregation';
    } else {
      // General sampling
      sql = `SELECT * FROM ${tableName} LIMIT 10;`;
      planIntent = 'general_qa';
    }

    // Execute query synchronously using AnalyticalEngine
    const result = analyticsEngine.query(sql, tableName) as any;
    // (Note: analyticsEngine handles fallback execution immediately)

    // Build evidence
    let calculatedVal: string | number = 0;
    if (result.rows.length === 1 && result.columns.length === 1) {
      calculatedVal = result.rows[0][result.columns[0]];
    } else if (result.rows.length > 0 && targetGroup && targetMetric) {
      const topRow = result.rows[0];
      const metricKey = Object.keys(topRow).find((k) => k !== targetGroup?.name) || '';
      calculatedVal = `${topRow[targetGroup.name]}: ${topRow[metricKey]}`;
    } else if (result.rows.length > 0) {
      calculatedVal = `${result.rowCount} records analyzed`;
    }

    const evidence: CalculationEvidence = {
      query: question,
      sqlQuery: sql,
      sheetName: sheet.sheetName,
      rowsAnalyzed: sheet.rowCount,
      calculatedValue: calculatedVal,
      formula: targetMetric ? `${isAvg ? 'AVG' : 'SUM'}(${targetMetric.name})` : 'COUNT(*)',
    };

    // Configure interactive chart if grouped results exist
    let chart: MessageChart | undefined;
    if (targetGroup && result.rows.length > 1) {
      const valueKey = Object.keys(result.rows[0]).find((k) => k !== targetGroup?.name) || 'value';
      chart = {
        id: generateId(),
        title: `${targetMetric ? targetMetric.name : 'Count'} by ${targetGroup.name}`,
        description: `Calculated from ${file.name} (${sheet.sheetName})`,
        type: suggestedChartType,
        xAxisKey: targetGroup.name,
        series: [
          {
            name: targetMetric ? targetMetric.name : 'Count',
            dataKey: valueKey,
            color: '#F4B942', // Bespoke Saffron theme accent
          },
        ],
        data: result.rows,
      };
    }

    const plan: QueryPlan = {
      intent: planIntent,
      targetFiles: [file.name],
      sqlQuery: sql,
      aggregationColumn: targetMetric?.name,
      groupColumn: targetGroup?.name,
      suggestedChartType,
      explanation: `Analyzed ${sheet.rowCount} rows in ${file.name} using ${sql}`,
    };

    return {
      plan,
      result,
      evidence,
      chart,
    };
  }
}
