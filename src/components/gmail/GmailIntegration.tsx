import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useGmailAPI } from '../../hooks/useGmailAPI';
import { useJobApplications } from '../../hooks/useJobApplications';
import { Mail, Shield, Download, Plus, Calendar, Building, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function GmailIntegration() {
  const { 
    isAuthenticated, 
    loading, 
    messages, 
    lastSyncTime,
    requestGmailPermissions, 
    fetchJobEmails, 
    createApplicationFromEmail,
    revokeAccess 
  } = useGmailAPI();
  
  const { addApplication } = useJobApplications();
  const [importingEmails, setImportingEmails] = useState<string[]>([]);
  const [autoSync, setAutoSync] = useState(false);

  const handleImportEmail = async (email: any) => {
    try {
      setImportingEmails(prev => [...prev, email.id]);
      const applicationData = createApplicationFromEmail(email);
      await addApplication(applicationData);
      toast.success(`Imported application for ${applicationData.company_name}`);
    } catch (error) {
      toast.error('Failed to import email');
    } finally {
      setImportingEmails(prev => prev.filter(id => id !== email.id));
    }
  };

  const handleBulkImport = async () => {
    if (messages.length === 0) return;

    const confirmImport = window.confirm(
      `Import all ${messages.length} job applications? This will create new job application entries.`
    );

    if (!confirmImport) return;

    try {
      for (const email of messages) {
        if (!importingEmails.includes(email.id)) {
          await handleImportEmail(email);
          // Add small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      toast.success(`Successfully imported ${messages.length} applications!`);
    } catch (error) {
      toast.error('Some imports failed. Please try again.');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'primary';
    if (confidence >= 0.4) return 'warning';
    return 'error';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    if (confidence >= 0.4) return 'Low Confidence';
    return 'Very Low';
  };

  return (
    <div className="space-y-6">
      {/* Main Integration Card */}
      <Card className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-slate-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Gmail Integration</h2>
              <p className="text-sm text-slate-400">Automatically import job applications from your emails</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant={isAuthenticated ? 'success' : 'error'} glow>
              {isAuthenticated ? 'Connected' : 'Disconnected'}
            </Badge>
            
            {!isAuthenticated ? (
              <Button
                onClick={requestGmailPermissions}
                isLoading={loading}
                leftIcon={<Shield className="w-4 h-4" />}
                glow
              >
                Connect Gmail
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => fetchJobEmails(100)}
                  isLoading={loading}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  variant="outline"
                  size="sm"
                >
                  Sync Emails
                </Button>
                {messages.length > 0 && (
                  <Button
                    onClick={handleBulkImport}
                    leftIcon={<Download className="w-4 h-4" />}
                    variant="primary"
                    size="sm"
                    glow
                  >
                    Import All ({messages.length})
                  </Button>
                )}
                <Button
                  onClick={revokeAccess}
                  variant="outline"
                  size="sm"
                >
                  Disconnect
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Connection Status */}
        {isAuthenticated && (
          <div className="bg-gradient-to-r from-success-900/20 to-primary-900/20 border border-success-600/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-success-400" />
                <div>
                  <h3 className="text-sm font-medium text-success-300">Gmail Connected Successfully</h3>
                  <p className="text-xs text-slate-400">
                    {lastSyncTime 
                      ? `Last synced: ${format(lastSyncTime, 'MMM dd, yyyy HH:mm')}`
                      : 'Never synced'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="rounded border-slate-600 text-primary-600 focus:ring-primary-500 bg-dark-800"
                  />
                  <span>Auto-sync</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-primary-900/20 to-secondary-900/20 border border-primary-600/30 rounded-xl p-4">
            <h3 className="text-sm font-medium text-primary-300 mb-3 flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>🔐 Secure Gmail Access</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
              <div>
                <h4 className="font-medium text-slate-200 mb-2">What we access:</h4>
                <ul className="space-y-1 text-slate-400">
                  <li>• Read-only access to your Gmail</li>
                  <li>• Search for job-related emails only</li>
                  <li>• Extract company and position info</li>
                  <li>• No access to personal emails</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-200 mb-2">Features:</h4>
                <ul className="space-y-1 text-slate-400">
                  <li>• Automatic job email detection</li>
                  <li>• Smart company name extraction</li>
                  <li>• One-click application import</li>
                  <li>• Secure token storage</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Email Results */}
      {isAuthenticated && messages.length > 0 && (
        <Card className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center space-x-2">
              <Mail className="w-5 h-5 text-primary-400" />
              <span>Job-Related Emails</span>
            </h3>
            <div className="flex items-center space-x-3">
              <Badge variant="primary" glow>{messages.length} found</Badge>
              <Button
                onClick={() => fetchJobEmails(100)}
                isLoading={loading}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                variant="outline"
                size="sm"
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {messages.map((email, index) => (
              <motion.div
                key={email.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start justify-between p-4 bg-dark-900/50 rounded-xl border border-slate-700/30 hover:border-primary-500/30 transition-all duration-300"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-100 line-clamp-1">{email.subject}</h4>
                      <p className="text-sm text-slate-400">From: {email.from}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getConfidenceColor(email.confidence)} size="sm">
                        {getConfidenceLabel(email.confidence)}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {Math.round(email.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  {email.companyName && (
                    <div className="text-sm text-primary-300 mb-1">
                      🏢 Company: {email.companyName}
                    </div>
                  )}
                  
                  {email.jobTitle && (
                    <div className="text-sm text-secondary-300 mb-2">
                      💼 Position: {email.jobTitle}
                    </div>
                  )}
                  
                  <div className="flex items-center text-xs text-slate-500 space-x-4 mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(email.date), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Confidence: {Math.round(email.confidence * 100)}%</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-400 line-clamp-2 bg-dark-800/30 rounded p-2">
                    {email.content}
                  </p>
                </div>
                
                <div className="ml-4 flex flex-col space-y-2">
                  <Button
                    onClick={() => handleImportEmail(email)}
                    isLoading={importingEmails.includes(email.id)}
                    leftIcon={<Plus className="w-4 h-4" />}
                    size="sm"
                    variant="primary"
                    glow
                  >
                    Import
                  </Button>
                  <Button
                    onClick={() => window.open(`https://mail.google.com/mail/u/0/#inbox/${email.id}`, '_blank')}
                    leftIcon={<Mail className="w-4 h-4" />}
                    size="sm"
                    variant="outline"
                  >
                    View
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {isAuthenticated && messages.length === 0 && !loading && (
        <Card className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-slate-700/50">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">No job emails found</h3>
            <p className="text-slate-400 text-sm mb-4">
              {lastSyncTime 
                ? 'No new job-related emails since your last sync'
                : 'Click "Sync Emails" to search for job-related emails in your Gmail'
              }
            </p>
            <Button
              onClick={() => fetchJobEmails(100)}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              variant="primary"
              glow
            >
              Sync Emails
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}