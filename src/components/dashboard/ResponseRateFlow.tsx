import React from 'react';
import { Card } from '../ui/Card';
import { TrendingUp, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResponseRateFlowProps {
  applications: any[];
}

export function ResponseRateFlow({ applications }: ResponseRateFlowProps) {
  const totalApps = applications.length;
  const responded = applications.filter(app => 
    ['interview', 'offer', 'rejected'].includes(app.status)
  ).length;
  const positive = applications.filter(app => 
    ['interview', 'offer'].includes(app.status)
  ).length;
  const pending = applications.filter(app => 
    ['applied', 'followed-up', 'no-response'].includes(app.status)
  ).length;
  
  const responseRate = totalApps > 0 ? (responded / totalApps) * 100 : 0;
  const positiveRate = totalApps > 0 ? (positive / totalApps) * 100 : 0;
  
  const flowData = [
    {
      label: 'Total Applications',
      count: totalApps,
      percentage: 100,
      color: 'from-slate-600 to-slate-700',
      icon: Users,
      textColor: 'text-slate-300'
    },
    {
      label: 'Responses Received',
      count: responded,
      percentage: responseRate,
      color: 'from-primary-600 to-primary-700',
      icon: CheckCircle,
      textColor: 'text-primary-300'
    },
    {
      label: 'Positive Responses',
      count: positive,
      percentage: positiveRate,
      color: 'from-success-600 to-success-700',
      icon: TrendingUp,
      textColor: 'text-success-300'
    },
    {
      label: 'Still Pending',
      count: pending,
      percentage: totalApps > 0 ? (pending / totalApps) * 100 : 0,
      color: 'from-warning-600 to-warning-700',
      icon: Clock,
      textColor: 'text-warning-300'
    }
  ];
  
  return (
    <Card className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-slate-700/50">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-slate-100">
          Response Rate Flow
        </h2>
      </div>

      {totalApps > 0 ? (
        <div className="space-y-6">
          {/* Sankey Flow Nodes */}
          <div className="space-y-4">
            {flowData.map((item, index) => {
              const delay = index * 0.15;
              const IconComponent = item.icon;
              
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay, duration: 0.5 }}
                  className="relative"
                >
                  <div className="flex items-center space-x-4">
                    {/* Icon & Label */}
                    <div className="flex items-center space-x-3 w-48">
                      <div className={`w-8 h-8 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-slate-300">
                        {item.label}
                      </span>
                    </div>
                    
                    {/* Flow Visualization */}
                    <div className="flex-1 relative">
                      {/* Background Track */}
                      <div className="h-6 bg-dark-900/50 rounded-full border border-slate-700/30" />
                      
                      {/* Flow Bar */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ delay: delay + 0.3, duration: 1, ease: "easeOut" }}
                        className={`absolute top-0 h-6 bg-gradient-to-r ${item.color} rounded-full overflow-hidden`}
                      >
                        {/* Flow Animation */}
                        <motion.div
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ 
                            delay: delay + 1.5, 
                            duration: 2, 
                            repeat: Infinity, 
                            repeatDelay: 3 
                          }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        />
                        
                        {/* Count Display */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">
                            {item.count}
                          </span>
                        </div>
                      </motion.div>
                    </div>
                    
                    {/* Percentage */}
                    <div className="w-16 text-right">
                      <span className={`text-sm font-bold ${item.textColor}`}>
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Flow Connection */}
                  {index < flowData.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 0.2, height: '16px' }}
                      transition={{ delay: delay + 0.8, duration: 0.4 }}
                      className="ml-52 w-0.5 bg-gradient-to-b from-slate-500 to-transparent"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
          
          {/* Flow Metrics */}
          <div className="pt-4 border-t border-slate-700/50">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-primary-900/20 to-primary-800/20 border border-primary-600/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-primary-400" />
                  <span className="text-sm font-medium text-primary-300">Response Rate</span>
                </div>
                <div className="text-2xl font-bold text-primary-200">
                  {responseRate.toFixed(1)}%
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-success-900/20 to-success-800/20 border border-success-600/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-success-400" />
                  <span className="text-sm font-medium text-success-300">Success Rate</span>
                </div>
                <div className="text-2xl font-bold text-success-200">
                  {positiveRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400">No response data available</p>
            <p className="text-slate-500 text-sm mt-1">Add applications to see flow</p>
          </div>
        </div>
      )}
    </Card>
  );
}