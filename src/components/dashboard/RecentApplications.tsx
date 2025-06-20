import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ArrowRight, Building, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

type JobApplication = Database['public']['Tables']['job_applications']['Row'];

interface RecentApplicationsProps {
  applications: JobApplication[];
}

const statusColors = {
  'applied': 'default',
  'followed-up': 'primary',
  'rejected': 'error',
  'no-response': 'warning',
  'offer': 'success',
  'interview': 'secondary'
} as const;

export function RecentApplications({ applications }: RecentApplicationsProps) {
  const recent = applications.slice(0, 5);

  return (
    <Card className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-slate-700/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-slate-100">
            Recent Applications
          </h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="text-slate-300 hover:text-white"
        >
          View All
        </Button>
      </div>

      <div className="space-y-4">
        {recent.map((application, index) => (
          <motion.div
            key={application.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="group flex items-center justify-between p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/70 transition-all duration-300 border border-slate-700/30 hover:border-primary-500/30"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-100 group-hover:text-white transition-colors">
                    {application.job_title}
                  </h3>
                  <div className="flex items-center text-sm text-slate-400 space-x-3 mt-1">
                    <span className="font-medium text-slate-300">{application.company_name}</span>
                    {application.location && (
                      <>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{application.location}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {application.salary && (
                    <div className="text-xs text-slate-500 mt-1">
                      💰 {application.salary}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <Badge variant={statusColors[application.status]} glow>
                  {application.status.replace('-', ' ')}
                </Badge>
                <div className="text-sm text-slate-400 mt-1">
                  {format(new Date(application.applied_on), 'MMM dd')}
                </div>
              </div>
              {application.job_link && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(application.job_link!, '_blank')}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {recent.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">No applications yet</h3>
          <p className="text-slate-400 text-sm">
            Start tracking your job applications to see them here
          </p>
        </div>
      )}
    </Card>
  );
}