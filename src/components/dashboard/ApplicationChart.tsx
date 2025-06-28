import React from 'react';
import { Card } from '../ui/Card';
import { AreaChart, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

interface ApplicationChartProps {
  data: { month: string; count: number }[];
}

export function ApplicationChart({ data }: ApplicationChartProps) {
  const { theme, colorScheme } = useTheme();
  const maxValue = Math.max(...data.map(d => d.count), 1);
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Get colors based on theme and color scheme
  const getBarColor = (index: number) => {
    const colors = {
      yellow: ['#eab308', '#facc15', '#fde047'],
      blue: ['#3b82f6', '#60a5fa', '#93c5fd'],
      purple: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
      green: ['#22c55e', '#4ade80', '#86efac']
    };
    
    const colorSet = colors[colorScheme as keyof typeof colors] || colors.blue;
    return colorSet[index % colorSet.length];
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-card-border p-2 rounded-md shadow-md">
          <p className="text-sm font-medium text-foreground">{`${label}: ${payload[0].value}`}</p>
          <p className="text-xs text-muted">Applications</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="bg-card border-card-border" elevation="raised">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-accent rounded-xl flex items-center justify-center shadow-lg">
          <AreaChart className="w-5 h-5 text-primary-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Application Flow Trends
        </h2>
      </div>
      
      <div className="h-72 relative">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke={isDarkMode ? 'rgba(203, 213, 225, 0.1)' : 'rgba(15, 23, 42, 0.1)'} 
              />
              <XAxis 
                dataKey="month" 
                tick={{ fill: isDarkMode ? '#cbd5e1' : '#334155' }}
                axisLine={{ stroke: isDarkMode ? 'rgba(203, 213, 225, 0.2)' : 'rgba(15, 23, 42, 0.2)' }}
              />
              <YAxis 
                tick={{ fill: isDarkMode ? '#cbd5e1' : '#334155' }}
                axisLine={{ stroke: isDarkMode ? 'rgba(203, 213, 225, 0.2)' : 'rgba(15, 23, 42, 0.2)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(index)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-card-hover rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-muted" />
              </div>
              <p className="text-muted">No data available yet</p>
              <p className="text-muted-foreground text-sm mt-1">Start applying to see trends</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Flow Legend */}
      {data.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border/80">
          <div className="flex items-center justify-between text-xs text-muted">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-primary to-primary-accent rounded-full shadow-sm"></div>
              <span>Application Flow</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Total: {data.reduce((sum, item) => sum + item.count, 0)}</span>
              <span>Peak: {maxValue}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}