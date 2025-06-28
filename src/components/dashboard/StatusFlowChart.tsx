import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { BarChart3, ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatusFlowChartProps {
  statusData: Record<string, number>;
}

const statusConfig = {
  applied: { 
    label: 'Applied', 
    color: 'from-slate-600 to-slate-700', 
    textColor: 'text-slate-300',
    bgColor: 'bg-slate-600/20'
  },
  'followed-up': { 
    label: 'Followed Up', 
    color: 'from-primary-600 to-primary-700', 
    textColor: 'text-primary-300',
    bgColor: 'bg-primary-600/20'
  },
  interview: { 
    label: 'Interview', 
    color: 'from-secondary-600 to-secondary-700', 
    textColor: 'text-secondary-300',
    bgColor: 'bg-secondary-600/20'
  },
  offer: { 
    label: 'Offer', 
    color: 'from-success-600 to-success-700', 
    textColor: 'text-success-300',
    bgColor: 'bg-success-600/20'
  },
  rejected: { 
    label: 'Rejected', 
    color: 'from-error-600 to-error-700', 
    textColor: 'text-error-300',
    bgColor: 'bg-error-600/20'
  },
  'no-response': { 
    label: 'No Response', 
    color: 'from-warning-600 to-warning-700', 
    textColor: 'text-warning-300',
    bgColor: 'bg-warning-600/20'
  }
};

export function StatusFlowChart({ statusData }: StatusFlowChartProps) {
  const totalApplications = Object.values(statusData).reduce((sum, count) => sum + count, 0);
  const statusEntries = Object.entries(statusData)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => {
      // Custom sort order for status flow
      const order = {
        'applied': 1,
        'followed-up': 2,
        'interview': 3,
        'offer': 4,
        'rejected': 5,
        'no-response': 6
      };
      return (order[a[0] as keyof typeof order] || 99) - (order[b[0] as keyof typeof order] || 99);
    });
  
  return (
    <Card className="bg-card border-card-border">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary-accent rounded-xl flex items-center justify-center shadow-md">
          <BarChart3 className="w-5 h-5 text-secondary-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Application Status Flow
        </h2>
      </div>

      {totalApplications > 0 ? (
        <div className="space-y-6">
          {/* Sankey Flow Visualization */}
          <div className="relative space-y-4">
            {statusEntries.map(([status, count], index) => {
              const config = statusConfig[status as keyof typeof statusConfig];
              const percentage = (count / totalApplications) * 100;
              const delay = index * 0.2;
              
              return (
                <motion.div
                  key={`status-${status}`}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay, duration: 0.6 }}
                  className="relative"
                >
                  {/* Flow Node */}
                  <div className="flex items-center space-x-4">
                    {/* Status Info */}
                    <div className="flex-shrink-0 w-36">
                      <Badge variant={status as any} className="w-full justify-center py-1.5">
                        {config.label}
                      </Badge>
                    </div>
                    
                    {/* Flow Bar */}
                    <div className="flex-1 relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(percentage, 2)}%` }}
                        transition={{ delay: delay + 0.3, duration: 0.8, ease: "easeOut" }}
                        className={`h-10 bg-gradient-to-r ${config.color} rounded-lg relative overflow-hidden`}
                      >
                        {/* Flow Lines */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        
                        {/* Shimmer Effect */}
                        <motion.div
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ 
                            delay: delay + 1.2, 
                            duration: 2, 
                            repeat: Infinity, 
                            repeatDelay: 4 
                          }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                        />
                        
                        {/* Count Display */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-bold text-sm drop-shadow-md">
                            {count}
                          </span>
                        </div>
                      </motion.div>
                    </div>
                    
                    {/* Percentage */}
                    <div className="flex-shrink-0 w-16 text-right">
                      <span className={`text-sm font-medium ${config.textColor} drop-shadow-sm`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Connection Flow */}
                  {index < statusEntries.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: delay + 1, duration: 0.4 }}
                      className="flex items-center justify-center my-3 ml-36"
                    >
                      <ChevronRight className="w-5 h-5 text-muted animate-pulse" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
          
          {/* Flow Summary */}
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                <div className="text-lg font-bold text-primary">{totalApplications}</div>
                <div className="text-xs text-muted">Total Flow</div>
              </div>
              <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                <div className="text-lg font-bold text-success">
                  {((statusData.interview || 0) + (statusData.offer || 0))}
                </div>
                <div className="text-xs text-muted">Positive Flow</div>
              </div>
              <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-3">
                <div className="text-lg font-bold text-secondary">
                  {statusData.offer || 0}
                </div>
                <div className="text-xs text-muted">Success Flow</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="w-16 h-16 bg-card-hover rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-muted" />
            </div>
            <p className="text-muted">No status data available</p>
            <p className="text-muted-foreground text-sm mt-1">Add applications to see flow</p>
          </div>
        </div>
      )}
    </Card>
  );
}