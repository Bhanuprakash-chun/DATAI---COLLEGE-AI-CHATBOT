import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, Download, Copy, Check } from 'lucide-react';
import { MessageChart } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/store/settings-store';

export interface ChartRendererProps {
  chart: MessageChart;
}

// Universal Design System Palette: Saffron Accent with harmonic supporting tones
const PALETTE_COLORS = ['#F59E0B', '#38BDF8', '#818CF8', '#10B981', '#F97316', '#A78BFA', '#F43F5E'];

export function ChartRenderer({ chart }: ChartRendererProps) {
  const [activeType, setActiveType] = useState<MessageChart['type']>(chart.type);
  const [copied, setCopied] = useState(false);
  const { theme } = useSettingsStore();

  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#1B202B' : '#FFFFFF',
    borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#E5E7EB',
    borderRadius: '0.75rem',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    fontSize: '12px',
    boxShadow: theme === 'dark' ? '0 10px 15px -3px rgba(0, 0, 0, 0.4)' : '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
  };

  const handleCopyData = () => {
    navigator.clipboard.writeText(JSON.stringify(chart.data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    if (!chart.data || chart.data.length === 0) return;
    const headers = Object.keys(chart.data[0]);
    const csvContent =
      headers.join(',') +
      '\n' +
      chart.data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chart.title.replace(/\s+/g, '_')}_data.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-4 p-5 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
      {/* Chart Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="text-sm font-bold text-text-primary tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            {chart.title}
          </h4>
          {chart.description && <p className="text-xs text-text-muted mt-0.5">{chart.description}</p>}
        </div>

        {/* Chart Type Switcher & Action Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-elevated rounded-full p-1 border border-border">
            <Button
              variant={activeType === 'bar' ? 'accent' : 'ghost'}
              size="icon-sm"
              onClick={() => setActiveType('bar')}
              className="rounded-full w-7 h-7"
              title="Bar Chart"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={activeType === 'line' ? 'accent' : 'ghost'}
              size="icon-sm"
              onClick={() => setActiveType('line')}
              className="rounded-full w-7 h-7"
              title="Line Chart"
            >
              <LineIcon className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={activeType === 'pie' ? 'accent' : 'ghost'}
              size="icon-sm"
              onClick={() => setActiveType('pie')}
              className="rounded-full w-7 h-7"
              title="Pie Chart"
            >
              <PieIcon className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleCopyData}
            className="rounded-full text-text-muted hover:text-text-primary"
            title="Copy Raw JSON Data"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleDownloadCSV}
            className="rounded-full text-text-muted hover:text-text-primary"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Responsive Chart Container */}
      <div className="w-full h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {activeType === 'bar' ? (
            <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(124, 133, 143, 0.15)" vertical={false} />
              <XAxis
                dataKey={chart.xAxisKey}
                tick={{ fill: '#7C858F', fontSize: 11, fontFamily: 'Plus Jakarta Sans' }}
                axisLine={{ stroke: 'rgba(124, 133, 143, 0.25)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#7C858F', fontSize: 11, fontFamily: 'Plus Jakarta Sans' }}
                axisLine={{ stroke: 'rgba(124, 133, 143, 0.25)' }}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              {chart.series.map((s, idx) => (
                <Bar
                  key={s.dataKey}
                  dataKey={s.dataKey}
                  fill={s.color || PALETTE_COLORS[idx % PALETTE_COLORS.length]}
                  radius={[6, 6, 0, 0]}
                />
              ))}
            </BarChart>
          ) : activeType === 'line' ? (
            <LineChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(124, 133, 143, 0.15)" vertical={false} />
              <XAxis
                dataKey={chart.xAxisKey}
                tick={{ fill: '#7C858F', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(124, 133, 143, 0.25)' }}
              />
              <YAxis
                tick={{ fill: '#7C858F', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(124, 133, 143, 0.25)' }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              {chart.series.map((s, idx) => (
                <Line
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  stroke={s.color || PALETTE_COLORS[idx % PALETTE_COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ fill: '#F59E0B', r: 3.5 }}
                  activeDot={{ r: 5.5 }}
                />
              ))}
            </LineChart>
          ) : (
            <PieChart>
              <Tooltip contentStyle={tooltipStyle} />
              <Pie
                data={chart.data}
                dataKey={chart.series[0]?.dataKey || 'value'}
                nameKey={chart.xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
                paddingAngle={4}
              >
                {chart.data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE_COLORS[index % PALETTE_COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: '11px', color: '#7C858F' }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

