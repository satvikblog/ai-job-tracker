import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Database } from '../../lib/database.types';
import { format } from 'date-fns';
import { Building, MapPin, ExternalLink, Edit, Calendar, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

type JobApplication = Database['public']['Tables']['job_applications']['Row'];

interface KanbanBoardProps {
  applications: JobApplication[];
  onEdit: (application: JobApplication) => void;
}

const columns = [
  { id: 'applied', title: 'Applied', color: 'from-slate-600 to-slate-700', textColor: 'text-slate-300' },
  { id: 'followed-up', title: 'Followed Up', color: 'from-primary-600 to-primary-700', textColor: 'text-primary-300' },
  { id: 'interview', title: 'Interview', color: 'from-secondary-600 to-secondary-700', textColor: 'text-secondary-300' },
  { id: 'offer', title: 'Offer', color: 'from-success-600 to-success-700', textColor: 'text-success-300' },
  { id: 'rejected', title: 'Rejected', color: 'from-error-600 to-error-700', textColor: 'text-error-300' },
  { id: 'no-response', title: 'No Response', color: 'from-warning-600 to-warning-700', textColor: 'text-warning-300' }
];

export function KanbanBoard({ applications, onEdit }: KanbanBoardProps) {
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
              <h3 className="font-semibold text-slate-100 flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${column.color}`}></div>
                <span>{column.title}</span>
              </h3>
              <Badge variant="default" className={`${column.textColor} bg-dark-800/50 border-slate-600`}>
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
                  <Card hover className="p-4 bg-dark-800/70 border border-slate-700/50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`w-12 h-12 bg-gradient-to-br ${column.color} rounded-xl flex items-center justify-center shadow-lg`}>
                          <Building className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-100 text-sm truncate">
                            {application.job_title}
                          </h4>
                          <p className="text-sm text-slate-300 truncate">
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
                      <div className="flex items-center text-sm text-slate-400 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="truncate">{application.location}</span>
                      </div>
                    )}

                    {application.salary && (
                      <div className="flex items-center text-sm text-slate-400 mb-2">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span className="truncate">{application.salary}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Applied {format(new Date(application.applied_on), 'MMM dd')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">{application.source_site}</span>
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
                      <div className="mt-2 text-xs text-amber-400 bg-amber-900/20 border border-amber-600/30 rounded px-2 py-1">
                        Follow up: {format(new Date(application.next_follow_up_date), 'MMM dd')}
                      </div>
                    )}

                    {application.notes && (
                      <div className="mt-2 text-xs text-slate-400 bg-dark-900/50 rounded px-2 py-1 line-clamp-2">
                        {application.notes}
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}

              {columnApplications.length === 0 && (
                <div className="text-center py-8 text-slate-500">
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