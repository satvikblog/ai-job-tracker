import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Database } from '../../lib/database.types';
import { format } from 'date-fns';
import { Building, MapPin, ExternalLink, Edit, Calendar, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

type JobApplication = Database['public']['Tables']['job_applications']['Row'];

interface KanbanBoardProps {
  applications: JobApplication[];
  onEdit: (application: JobApplication) => void;
}

export function KanbanBoard({ applications, onEdit }: KanbanBoardProps) {
  const { colorScheme } = useTheme();
  
  // Get column colors based on color scheme
  const getColumnColors = () => {
    if (colorScheme === 'yellow') {
      return [
        { id: 'applied', title: 'Applied', color: 'from-gray-600 to-gray-700', textColor: 'text-gray-300' },
        { id: 'followed-up', title: 'Followed Up', color: 'from-yellow-500 to-yellow-600', textColor: 'text-yellow-400' },
        { id: 'interview', title: 'Interview', color: 'from-purple-500 to-purple-600', textColor: 'text-purple-400' },
        { id: 'offer', title: 'Offer', color: 'from-green-500 to-green-600', textColor: 'text-green-400' },
        { id: 'rejected', title: 'Rejected', color: 'from-red-500 to-red-600', textColor: 'text-red-400' },
        { id: 'no-response', title: 'No Response', color: 'from-yellow-600 to-yellow-700', textColor: 'text-yellow-500' }
      ];
    }
    
    if (colorScheme === 'purple') {
      return [
        { id: 'applied', title: 'Applied', color: 'from-gray-600 to-gray-700', textColor: 'text-gray-300' },
        { id: 'followed-up', title: 'Followed Up', color: 'from-purple-500 to-purple-600', textColor: 'text-purple-400' },
        { id: 'interview', title: 'Interview', color: 'from-yellow-500 to-yellow-600', textColor: 'text-yellow-400' },
        { id: 'offer', title: 'Offer', color: 'from-green-500 to-green-600', textColor: 'text-green-400' },
        { id: 'rejected', title: 'Rejected', color: 'from-red-500 to-red-600', textColor: 'text-red-400' },
        { id: 'no-response', title: 'No Response', color: 'from-yellow-600 to-yellow-700', textColor: 'text-yellow-500' }
      ];
    }
    
    if (colorScheme === 'green') {
      return [
        { id: 'applied', title: 'Applied', color: 'from-gray-600 to-gray-700', textColor: 'text-gray-300' },
        { id: 'followed-up', title: 'Followed Up', color: 'from-green-500 to-green-600', textColor: 'text-green-400' },
        { id: 'interview', title: 'Interview', color: 'from-purple-500 to-purple-600', textColor: 'text-purple-400' },
        { id: 'offer', title: 'Offer', color: 'from-green-600 to-green-700', textColor: 'text-green-500' },
        { id: 'rejected', title: 'Rejected', color: 'from-red-500 to-red-600', textColor: 'text-red-400' },
        { id: 'no-response', title: 'No Response', color: 'from-yellow-500 to-yellow-600', textColor: 'text-yellow-400' }
      ];
    }
    
    // Default blue theme
    return [
      { id: 'applied', title: 'Applied', color: 'from-gray-600 to-gray-700', textColor: 'text-gray-300' },
      { id: 'followed-up', title: 'Followed Up', color: 'from-blue-500 to-blue-600', textColor: 'text-blue-400' },
      { id: 'interview', title: 'Interview', color: 'from-purple-500 to-purple-600', textColor: 'text-purple-400' },
      { id: 'offer', title: 'Offer', color: 'from-green-500 to-green-600', textColor: 'text-green-400' },
      { id: 'rejected', title: 'Rejected', color: 'from-red-500 to-red-600', textColor: 'text-red-400' },
      { id: 'no-response', title: 'No Response', color: 'from-yellow-500 to-yellow-600', textColor: 'text-yellow-400' }
    ];
  };

  const columns = getColumnColors();

  const getApplicationsByStatus = (status: string) => {
    return applications.filter(app => app.status === status);
  };

  return (
    <div className="flex space-x-6 overflow-x-auto pb-6">
      {columns.map((column) => {
        const columnApplications = getApplicationsByStatus(column.id);
        
        return (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${column.color}`}></div>
                <span>{column.title}</span>
              </h3>
              <Badge variant="default" className={`${column.textColor} bg-card-hover border-card-border`}>
                {columnApplications.length}
              </Badge>
            </div>
            
            <div className="space-y-3 min-h-96">
              {columnApplications.map((application, index) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card hover className="p-4 bg-card/70 border border-card-border/50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`w-12 h-12 bg-gradient-to-br ${column.color} rounded-xl flex items-center justify-center shadow-lg`}>
                          <Building className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm truncate">
                            {application.job_title}
                          </h4>
                          <p className="text-sm text-muted truncate">
                            {application.company_name}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(application)}
                        className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>

                    {application.location && (
                      <div className="flex items-center text-sm text-muted mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="truncate">{application.location}</span>
                      </div>
                    )}

                    {application.salary && (
                      <div className="flex items-center text-sm text-muted mb-2">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span className="truncate">{application.salary}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-card-border">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Applied {format(new Date(application.applied_on), 'MMM dd')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted">{application.source_site}</span>
                        {application.job_link && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(application.job_link!, '_blank')}
                            className="p-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {application.next_follow_up_date && (
                      <div className="mt-2 text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-1">
                        Follow up: {format(new Date(application.next_follow_up_date), 'MMM dd')}
                      </div>
                    )}

                    {application.notes && (
                      <div className="mt-2 text-xs text-muted bg-card-hover/50 rounded px-2 py-1 line-clamp-2">
                        {application.notes}
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}

              {columnApplications.length === 0 && (
                <div className="text-center py-8 text-muted">
                  <div className={`w-16 h-16 bg-gradient-to-br ${column.color} opacity-20 rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <Building className="w-6 h-6" />
                  </div>
                  <p className="text-sm">No applications</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}