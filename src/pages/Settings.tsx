import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { GmailIntegration } from '../components/gmail/GmailIntegration';
import { Settings as SettingsIcon, User, Bell, Database, Key, Mail, Zap, Save, LogOut, Shield, Webhook, TestTube, Activity, CheckCircle, XCircle, Clock, Plus, Edit, Trash2, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWebhookIntegration } from '../hooks/useWebhookIntegration';
import { supabase } from '../lib/supabase';
import { Database as DatabaseType } from '../lib/database.types';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<DatabaseType['public']['Tables']['user_settings']['Row'] | null>(null);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
  });
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<DatabaseType['public']['Tables']['webhooks']['Row'] | null>(null);
  
  const { user, signOut } = useAuth();
  const webhooks = useWebhookIntegration();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  ];

  const availableEvents = [
    { id: 'application_added', label: 'New Application Added', desc: 'Triggers when a new job application is created' },
    { id: 'application_updated', label: 'Application Status Updated', desc: 'Triggers when application status changes' },
    { id: 'follow_up_due', label: 'Follow-up Due', desc: 'Triggers when a follow-up date is reached' },
    { id: 'interview_scheduled', label: 'Interview Scheduled', desc: 'Triggers when status changes to interview' },
    { id: 'offer_received', label: 'Offer Received', desc: 'Triggers when status changes to offer' },
    { id: 'follow_up_logged', label: 'Follow-up Logged', desc: 'Triggers when a follow-up is recorded' }
  ];

  useEffect(() => {
    if (user) {
      fetchUserSettings();
      fetchProfile();
    }
  }, [user]);

  const fetchUserSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
        });
      } else {
        setProfile({
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: profile.email,
          full_name: profile.full_name,
        });

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updates: Partial<DatabaseType['public']['Tables']['user_settings']['Insert']>) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          ...updates,
        });

      if (error) throw error;
      
      setSettings(prev => ({ ...prev, ...updates } as any));
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
    }
  };

  const openWebhookModal = (webhook?: DatabaseType['public']['Tables']['webhooks']['Row']) => {
    setEditingWebhook(webhook || null);
    if (webhook) {
      reset({
        name: webhook.name,
        url: webhook.url,
        enabled: webhook.enabled,
        events: webhook.events,
        send_form_fields: webhook.send_form_fields,
        include_metadata: webhook.include_metadata
      });
    } else {
      reset({
        name: '',
        url: '',
        enabled: true,
        events: ['application_added', 'application_updated'],
        send_form_fields: true,
        include_metadata: true
      });
    }
    setIsWebhookModalOpen(true);
  };

  const handleWebhookSubmit = async (data: any) => {
    console.log('Webhook form data:', data);
    try {
      if (editingWebhook) {
        await webhooks.updateWebhook(editingWebhook.id, data);
      } else {
        await webhooks.createWebhook(data);
      }
      setIsWebhookModalOpen(false);
      reset();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDeleteWebhook = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the webhook "${name}"?`)) {
      await webhooks.deleteWebhook(id);
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-success-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-error-400" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusText = (webhook: DatabaseType['public']['Tables']['webhooks']['Row']) => {
    if (!webhook.last_triggered_at) return 'Never triggered';
    const timeAgo = new Date(webhook.last_triggered_at).toLocaleString();
    return `${webhook.last_status}: ${timeAgo}`;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold gradient-text flex items-center space-x-3">
            <SettingsIcon className="w-6 h-6 lg:w-8 lg:h-8 text-primary-500" />
            <span>Settings</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm lg:text-base">
            Manage your account preferences and integrations
          </p>
        </div>
        <Button variant="outline" onClick={handleSignOut} leftIcon={<LogOut className="w-4 h-4" />}>
          Sign Out
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 lg:py-3 rounded-lg text-left transition-colors text-sm lg:text-base ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary-600/20 to-secondary-600/20 text-white border border-primary-500/30'
                      : 'text-slate-300 hover:bg-dark-700/50 border border-transparent'
                  }`}
                >
                  <tab.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </motion.div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'profile' && (
              <Card>
                <h2 className="text-lg font-semibold text-white mb-6">
                  Profile Information
                </h2>
                <div className="space-y-6">
                  <Input
                    label="Full Name"
                    value={profile.full_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    variant="glass"
                  />
                  
                  <Input
                    label="Email Address"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    variant="glass"
                  />
                  
                  <div className="flex justify-end">
                    <Button onClick={saveProfile} isLoading={loading} leftIcon={<Save className="w-4 h-4" />}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <h2 className="text-lg font-semibold text-white mb-6">
                  Notification Preferences
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-white mb-4">
                      Follow-up Reminders
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-800" 
                          defaultChecked={settings?.notification_preferences?.email_reminders !== false}
                          onChange={(e) => saveSettings({
                            notification_preferences: {
                              ...settings?.notification_preferences as any,
                              email_reminders: e.target.checked
                            }
                          })}
                        />
                        <span className="ml-2 text-sm text-gray-300">Email notifications</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-800" 
                          defaultChecked={settings?.notification_preferences?.browser_notifications === true}
                          onChange={(e) => saveSettings({
                            notification_preferences: {
                              ...settings?.notification_preferences as any,
                              browser_notifications: e.target.checked
                            }
                          })}
                        />
                        <span className="ml-2 text-sm text-gray-300">Browser notifications</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-white mb-4">
                      Application Updates
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-800" 
                          defaultChecked={settings?.notification_preferences?.weekly_summary !== false}
                          onChange={(e) => saveSettings({
                            notification_preferences: {
                              ...settings?.notification_preferences as any,
                              weekly_summary: e.target.checked
                            }
                          })}
                        />
                        <span className="ml-2 text-sm text-gray-300">Weekly summary reports</span>
                      </label>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <GmailIntegration />
              </div>
            )}

            {activeTab === 'api-keys' && (
              <Card>
                <h2 className="text-lg font-semibold text-white mb-6">
                  API Keys & Integrations
                </h2>
                <div className="space-y-6">
                  <div>
                    <Input
                      label="OpenAI API Key"
                      type="password"
                      placeholder="sk-..."
                      value={settings?.openai_api_key || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, openai_api_key: e.target.value } as any))}
                      variant="glass"
                    />
                    <p className="text-sm text-gray-400 mt-1">
                      Required for AI-powered resume and cover letter generation
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-primary-900/20 to-secondary-900/20 border border-primary-600/30 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-primary-300 mb-2 flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span>Google API Configuration</span>
                    </h3>
                    <div className="space-y-3">
                      <Input
                        label="Google Client ID"
                        placeholder="your-client-id.googleusercontent.com"
                        value={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}
                        disabled
                        variant="glass"
                      />
                      <Input
                        label="Google API Key"
                        type="password"
                        placeholder="Your Google API Key"
                        value={import.meta.env.VITE_GOOGLE_API_KEY || ''}
                        disabled
                        variant="glass"
                      />
                      <p className="text-xs text-slate-400">
                        Configure these in your environment variables for Gmail integration
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => saveSettings({ openai_api_key: settings?.openai_api_key })}
                      isLoading={loading}
                      leftIcon={<Save className="w-4 h-4" />}
                    >
                      Save API Keys
                    </Button>
                  </div>

                  <div className="border-t border-gray-700 pt-6">
                    <h3 className="font-medium text-white mb-4">
                      Security Notice
                    </h3>
                    <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                      <p className="text-sm text-yellow-200">
                        Your API keys are encrypted and stored securely. They are only used for the features you enable and are never shared with third parties.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'webhooks' && (
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                    <Webhook className="w-5 h-5" />
                    <span>Webhook Management</span>
                  </h2>
                  <Button
                    onClick={() => openWebhookModal()}
                    leftIcon={<Plus className="w-4 h-4" />}
                    glow
                  >
                    Add Webhook
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {/* Info Card */}
                  <div className="bg-gradient-to-r from-primary-900/20 to-secondary-900/20 border border-primary-600/30 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-primary-300 mb-3 flex items-center space-x-2">
                      <Activity className="w-4 h-4" />
                      <span>🔗 Multiple Webhook Support</span>
                    </h3>
                    <p className="text-xs text-slate-400 mb-3">
                      Create unlimited webhooks for different automation platforms (n8n, Zapier, Make, etc.)
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <div>• Company Name</div>
                      <div>• Job Title</div>
                      <div>• Job Link</div>
                      <div>• Source Site</div>
                      <div>• Applied On</div>
                      <div>• Status</div>
                      <div>• Next Follow-Up Date</div>
                      <div>• Notes</div>
                      <div>• Salary</div>
                      <div>• Location</div>
                    </div>
                  </div>

                  {/* Webhooks List */}
                  {webhooks.webhooks.length > 0 ? (
                    <div className="space-y-4">
                      {webhooks.webhooks.map((webhook) => (
                        <div key={webhook.id} className="bg-dark-800/50 rounded-xl p-4 border border-slate-700/30">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-medium text-white">{webhook.name}</h3>
                                <Badge variant={webhook.enabled ? 'success' : 'default'}>
                                  {webhook.enabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(webhook.last_status)}
                                  <span className="text-xs text-slate-400">
                                    {getStatusText(webhook)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-slate-400 mb-2">
                                <Globe className="w-4 h-4" />
                                <span className="truncate">{webhook.url}</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {webhook.events.map((event) => (
                                  <Badge key={event} variant="primary" size="sm">
                                    {event.replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                onClick={() => webhooks.testWebhook(webhook.id)}
                                isLoading={webhooks.loading}
                                variant="outline"
                                size="sm"
                                leftIcon={<TestTube className="w-4 h-4" />}
                              >
                                Test
                              </Button>
                              <Button
                                onClick={() => openWebhookModal(webhook)}
                                variant="outline"
                                size="sm"
                                leftIcon={<Edit className="w-4 h-4" />}
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleDeleteWebhook(webhook.id, webhook.name)}
                                variant="outline"
                                size="sm"
                                leftIcon={<Trash2 className="w-4 h-4" />}
                                className="text-error-400 hover:text-error-300"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          {webhook.last_response && (
                            <div className="text-xs text-slate-500 bg-dark-900/50 rounded p-2 mt-2">
                              Last Response: {webhook.last_response.substring(0, 200)}
                              {webhook.last_response.length > 200 && '...'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Webhook className="w-8 h-8 text-slate-500" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-300 mb-2">No webhooks configured</h3>
                      <p className="text-slate-400 text-sm mb-4">
                        Create your first webhook to start automating your job application workflow
                      </p>
                      <Button
                        onClick={() => openWebhookModal()}
                        leftIcon={<Plus className="w-4 h-4" />}
                        glow
                      >
                        Add Your First Webhook
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </motion.div>
        </div>
      </div>

      {/* Webhook Modal */}
      <Modal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        title={editingWebhook ? 'Edit Webhook' : 'Add New Webhook'}
        size="lg"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsWebhookModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(handleWebhookSubmit)} isLoading={webhooks.loading}>
              {editingWebhook ? 'Update' : 'Create'} Webhook
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(handleWebhookSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Webhook Name *
            </label>
            <input
              {...register('name', { required: 'Name is required' })}
              className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              placeholder="e.g., n8n Production, Zapier Backup"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-error-400 flex items-center space-x-1">
                <span className="text-error-500">⚠️</span>
                <span>{errors.name.message}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Webhook URL *
            </label>
            <input
              {...register('url', { 
                required: 'URL is required',
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please enter a valid URL'
                }
              })}
              className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              placeholder="https://your-automation-platform.com/webhook/endpoint"
            />
            {errors.url && (
              <p className="mt-2 text-sm text-error-400 flex items-center space-x-1">
                <span className="text-error-500">⚠️</span>
                <span>{errors.url.message}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('enabled')}
                defaultChecked={true}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-800"
              />
              <span className="text-sm text-gray-300">Enable webhook</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Events to Trigger
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableEvents.map((event) => (
                <label key={event.id} className="flex items-start space-x-3 p-2 hover:bg-dark-700/30 rounded">
                  <input
                    type="checkbox"
                    value={event.id}
                    {...register('events')}
                    defaultChecked={['application_added', 'application_updated'].includes(event.id)}
                    className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-800 mt-1"
                  />
                  <div>
                    <span className="text-sm text-gray-300 font-medium">{event.label}</span>
                    <p className="text-xs text-gray-400">{event.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}