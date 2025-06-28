import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { BarChart3, ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface StatusFlowChartProps {
  statusData: Record<string, number>;
}

export function StatusFlowChart({ statusData }: StatusFlowChartProps) {
  const { colorScheme } = useTheme();
  
  // Get status config based on color scheme
  const getStatusConfig = () => {
    if (colorScheme === 'yellow') {
      return {
        applied: { 
          label: 'Applied', 
          color: 'from-gray-600 to-gray-700', 
          textColor: 'text-gray-300',
          bgColor: 'bg-gray-600/20'
        },
        'followed-up': { 
          label: 'Followed Up', 
          color: 'from-yellow-500 to-yellow-600', 
          textColor: 'text-yellow-400',
          bgColor: 'bg-yellow-600/20'
        },
        interview: { 
          label: 'Interview', 
          color: 'from-purple-500 to-purple-600', 
          textColor: 'text-purple-400',
          bgColor: 'bg-purple-600/20'
        },
        offer: { 
          label: 'Offer', 
          color: 'from-green-500 to-green-600', 
          textColor: 'text-green-400',
          bgColor: 'bg-green-600/20'
        },
        rejected: { 
          label: 'Rejected', 
          color: 'from-red-500 to-red-600', 
          textColor: 'text-red-400',
          bgColor: 'bg-red-600/20'
        },
        'no-response': { 
          label: 'No Response', 
          color: 'from-yellow-600 to-yellow-700', 
          textColor: 'text-yellow-500',
          bgColor: 'bg-yellow-600/20'
        }
      };
    }
    
    if (colorScheme === 'purple') {
      return {
        applied: { 
          label: 'Applied', 
          color: 'from-gray-600 to-gray-700', 
          textColor: 'text-gray-300',
          bgColor: 'bg-gray-600/20'
        },
        'followed-up': { 
          label: 'Followed Up', 
          color: 'from-purple-500 to-purple-600', 
          textColor: 'text-purple-400',
          bgColor: 'bg-purple-600/20'
        },
        interview: { 
          label: 'Interview', 
          color: 'from-yellow-500 to-yellow-600', 
          textColor: 'text-yellow-400',
          bgColor: 'bg-yellow-600/20'
        },
        offer: { 
          label: 'Offer', 
          color: 'from-green-500 to-green-600', 
          textColor: 'text-green-400',
          bgColor: 'bg-green-600/20'
        },
        rejected: { 
          label: 'Rejected', 
          color: 'from-red-500 to-red-600', 
          textColor: 'text-red-400',
          bgColor: 'bg-red-600/20'
        },
        'no-response': { 
          label: 'No Response', 
          color: 'from-yellow-600 to-yellow-700', 
          textColor: 'text-yellow-500',
          bgColor: 'bg-yellow-600/20'
        }
      };
    }
    
    if (colorScheme === 'green') {
      return {
        applied: { 
          label: 'Applied', 
          color: 'from-gray-600 to-gray-700', 
          textColor: 'text-gray-300',
          bgColor: 'bg-gray-600/20'
        },
        'followed-up': { 
          label: 'Followed Up', 
          color: 'from-green-500 to-green-600', 
          textColor: 'text-green-400',
          bgColor: 'bg-green-600/20'
        },
        interview: { 
          label: 'Interview', 
          color: 'from-purple-500 to-purple-600', 
          textColor: 'text-purple-400',
          bgColor: 'bg-purple-600/20'
        },
        offer: { 
          label: 'Offer', 
          color: 'from-green-600 to-green-700', 
          textColor: 'text-green-500',
          bgColor: 'bg-green-600/20'
        },
        rejected: { 
          label: 'Rejected', 
          color: 'from-red-500 to-red-600', 
          textColor: 'text-red-400',
          bgColor: 'bg-red-600/20'
        },
        'no-response': { 
          label: 'No Response', 
          color: 'from-yellow-500 to-yellow-600', 
          textColor: 'text-yellow-400',
          bgColor: 'bg-yellow-600/20'
        }
      };
    }
    
    // Default blue theme
    return {
      applied: { 
        label: 'Applied', 
        color: 'from-gray-600 to-gray-700', 
        textColor: 'text-gray-300',
        bgColor: 'bg-gray-600/20'
      },
      'followed-up': { 
        label: 'Followed Up', 
        color: 'from-blue-500 to-blue-600', 
        textColor: 'text-blue-400',
        bgColor: 'bg-blue-600/20'
      },
      interview: { 
        label: 'Interview', 
        color: 'from-purple-500 to-purple-600', 
        textColor: 'text-purple-400',
        bgColor: 'bg-purple-600/20'
      },
      offer: { 
        label: 'Offer', 
        color: 'from-green-500 to-green-600', 
        textColor: 'text-green-400',
        bgColor: 'bg-green-600/20'
      },
      rejected: { 
        label: 'Rejected', 
        color: 'from-red-500 to-red-600', 
        textColor: 'text-red-400',
        bgColor: 'bg-red-600/20'
      },
      'no-response': { 
        label: 'No Response', 
        color: 'from-yellow-500 to-yellow-600', 
        textColor: 'text-yellow-400',
        bgColor: 'bg-yellow-600/20'
      }
    };
  };

  const statusConfig = getStatusConfig();
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
    <Card className="bg-card border-card-border" elevation="raised">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <BarChart3 className="w-5 h-5 text-white" />
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
                        initial={{ width: 0, opacity: 0.5 }}
                        animate={{ width: `${Math.max(percentage, 2)}%`, opacity: 1 }}
                        transition={{ delay: delay + 0.3, duration: 0.8, ease: "easeOut" }}
                        className={`h-10 bg-gradient-to-r ${config.color} rounded-lg relative overflow-hidden shadow-md`}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mt-2">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 shadow-sm">
                <div className="text-lg font-bold text-blue-500">{totalApplications}</div>
                <div className="text-xs text-muted">Total Flow</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 shadow-sm">
                <div className="text-lg font-bold text-green-500">
                  {((statusData.interview || 0) + (statusData.offer || 0))}
                </div>
                <div className="text-xs text-muted">Positive Flow</div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 shadow-sm">
                <div className="text-lg font-bold text-purple-500">
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