import React from 'react';
import { Card } from '../ui/Card';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface ApplicationChartProps {
  data: { month: string; count: number }[];
}

export function ApplicationChart({ data }: ApplicationChartProps) {
  const maxValue = Math.max(...data.map(d => d.count), 1);
  
  return (
    <Card className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-slate-700/50">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-slate-100">
          Application Flow Trends
        </h2>
      </div>
      
      <div className="h-64 relative">
        {data.length > 0 ? (
          <div className="flex items-end justify-between h-full space-x-4 px-4">
            {data.map((item, index) => {
              const height = (item.count / maxValue) * 100;
              const delay = index * 0.1;
              
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center">
                  {/* Flow Node */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: delay + 0.3, duration: 0.5 }}
                    className="mb-2 text-center"
                  >
                    <div className="text-lg font-bold text-slate-100 mb-1">
                      {item.count}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {item.month}
                    </div>
                  </motion.div>
                  
                  {/* Sankey Flow Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay, duration: 0.8, ease: "easeOut" }}
                    className="w-full relative rounded-t-lg overflow-hidden"
                    style={{ minHeight: '8px' }}
                  >
                    {/* Gradient Flow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-600 via-primary-500 to-secondary-400 opacity-90" />
                    
                    {/* Flow Lines */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    
                    {/* Shimmer Effect */}
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ 
                        delay: delay + 1, 
                        duration: 1.5, 
                        repeat: Infinity, 
                        repeatDelay: 3 
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                    />
                  </motion.div>
                  
                  {/* Connection Flow to Next */}
                  {index < data.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 0.3, scaleX: 1 }}
                      transition={{ delay: delay + 1.2, duration: 0.6 }}
                      className="absolute top-1/2 w-8 h-0.5 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full"
                      style={{ 
                        left: `${((index + 1) / data.length) * 100 - 8}%`,
                        transform: 'translateY(-50%)'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">No data available yet</p>
              <p className="text-slate-500 text-sm mt-1">Start applying to see trends</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Flow Legend */}
      {data.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-primary-500 to-secondary-400 rounded-full"></div>
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