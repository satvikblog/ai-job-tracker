import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Database } from '../../lib/database.types';
import { format } from 'date-fns';
import { Search, Filter, MoreHorizontal, Edit, Trash2, ExternalLink, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

type JobApplication = Database['public']['Tables']['job_applications']['Row'];

interface ApplicationTableProps {
  applications: JobApplication[];
  onEdit: (application: JobApplication) => void;
  onDelete: (id: string) => void;
}

export function ApplicationTable({ applications, onEdit, onDelete }: ApplicationTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { colorScheme } = useTheme();

  // Get status colors based on color scheme
  const getStatusColors = () => {
    if (colorScheme === 'yellow') {
      return {
        'applied': 'default',
        'followed-up': 'primary', // yellow
        'rejected': 'error',
        'no-response': 'warning',
        'offer': 'success',
        'interview': 'secondary' // purple
      };
    }
    
    if (colorScheme === 'purple') {
      return {
        'applied': 'default',
        'followed-up': 'primary', // purple
        'rejected': 'error',
        'no-response': 'warning',
        'offer': 'success',
        'interview': 'secondary' // yellow
      };
    }
    
    if (colorScheme === 'green') {
      return {
        'applied': 'default',
        'followed-up': 'primary', // green
        'rejected': 'error',
        'no-response': 'warning',
        'offer': 'success',
        'interview': 'secondary' // purple
      };
    }
    
    // Default blue theme
    return {
      'applied': 'default',
      'followed-up': 'primary', // blue
      'rejected': 'error',
      'no-response': 'warning',
      'offer': 'success',
      'interview': 'secondary' // purple
    };
  };

  const statusColors = getStatusColors();

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'applied', label: 'Applied' },
    { value: 'followed-up', label: 'Followed Up' },
    { value: 'interview', label: 'Interview' },
    { value: 'offer', label: 'Offer' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'no-response', label: 'No Response' }
  ];

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card elevation="raised">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <h2 className="text-lg font-semibold text-foreground">
          Applications ({filteredApplications.length})
        </h2>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <div className="relative">
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="w-full sm:w-64"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="w-4 h-4" />}
          >
            Filters
          </Button>
        </div>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 bg-card-hover rounded-lg border border-card-border"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Status"
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </motion.div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-card-hover border-b border-card-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Company & Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Applied On
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Salary
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-card-border">
            {filteredApplications.map((application, index) => (
              <motion.tr
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="hover:bg-card-hover transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {application.job_title}
                    </div>
                    <div className="text-sm text-muted">
                      {application.company_name}
                    </div>
                    {application.location && (
                      <div className="text-xs text-muted-foreground">
                        📍 {application.location}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={statusColors[application.status]}>
                    {application.status.replace('-', ' ')}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {format(new Date(application.applied_on), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                  {application.source_site}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                  {application.salary || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {application.job_link && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(application.job_link!, '_blank')}
                        className="p-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(application)}
                      className="p-2"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(application.id)}
                      className="p-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted">
            {searchTerm || statusFilter ? 'No applications match your filters.' : 'No applications found.'}
          </div>
          {!searchTerm && !statusFilter && (
            <p className="text-muted-foreground mt-2">
              Click "Add Application" to get started with tracking your job applications.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}