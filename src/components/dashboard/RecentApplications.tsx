import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ArrowRight, Building, MapPin, Calendar, ExternalLink, Briefcase } from 'lucide-react';
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
  const navigate = useNavigate();

  return (
    <Card className="bg-card border-card-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary-accent rounded-xl flex items-center justify-center shadow-md">
            <Calendar className="w-5 h-5 text-secondary-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Recent Applications
          </h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/applications')}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="text-muted hover:text-foreground"
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
          >
            <div className="group flex items-center justify-between p-4 bg-card-hover/50 rounded-xl hover:bg-card-hover transition-all duration-300 border border-card-border hover:border-primary/30">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground group-hover:text-foreground transition-colors">
                      {application.job_title}
                    </h3>
                    <div className="flex items-center text-sm text-muted space-x-3 mt-1">
                      <span className="font-medium text-foreground">{application.company_name}</span>
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
                      <div className="text-xs text-muted-foreground mt-1">
                        💰 {application.salary}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <Badge variant={statusColors[application.status]} glow>
                    {application.status.replace(/-/g, ' ')}
                  </Badge>
                  <div className="text-sm text-muted mt-1">
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
            </div>
          </motion.div>
        ))}
      </div>

      {recent.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-card-hover rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No applications yet</h3>
          <p className="text-muted text-sm">
            Start tracking your job applications to see them here
          </p>
        </div>
      )}
    </Card>
  );
}