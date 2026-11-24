import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  chartType?: 'bar' | 'line';
  data: any[];
  xKey: string;
  barKeys?: string[];
  lineKeys?: string[];
  colors?: string[];
  height?: number;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  chartType = 'bar',
  data,
  xKey,
  barKeys = ['value'],
  lineKeys = ['value'],
  colors = ['#0D9488', '#172554', '#D97706', '#DC2626'],
  height = 250,
}) => {
  return (
    <div className="card p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {barKeys.map((key, idx) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[idx % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {lineKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartCard;
