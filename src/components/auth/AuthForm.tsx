import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ThemeToggle } from '../layout/ThemeToggle';
import { Sparkles, Mail, Lock, User, AlertCircle, Settings, CheckCircle, ArrowRight, Eye, EyeOff, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { testConnection } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [isToggling, setIsToggling] = useState(false); // Prevent animation overlap
  const { colorScheme } = useTheme();

  const { signIn, signUp } = useAuth();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const isConnected = await testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    } catch (error: any) {
      console.error('Connection check failed:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (connectionStatus !== 'connected') {
      toast.error('Please configure Supabase connection first', { position: 'top-center' });
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { data, error } = await signUp(email, password, fullName);
        if (error) throw error;
        if (data.user && !data.user.email_confirmed_at) {
          toast.success('Account created! Please check your email to verify your account.', { position: 'top-center' });
        } else {
          toast.success('Account created successfully!', { position: 'top-center' });
        }
      } else {
        const { data, error } = await signIn(email, password);
        if (error) throw error;
        toast.success('Welcome back!', { position: 'top-center' });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'An error occurred');
      toast.error(error.message || 'Authentication failed', { position: 'top-center' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (isToggling) return;
    setIsToggling(true);
    setTimeout(() => {
      setIsSignUp(!isSignUp);
      setError('');
      setIsToggling(false);
    }, 300); // Match animation duration
  };

  const getGradientColors = () => {
    switch (colorScheme) {
      case 'yellow':
        return 'from-yellow-400 via-purple-500 to-green-500';
      case 'purple':
        return 'from-purple-500 via-yellow-400 to-green-500';
      case 'green':
        return 'from-green-500 via-blue-500 to-purple-500';
      default: // blue
        return 'from-blue-500 via-purple-500 to-green-500';
    }
  };

  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4 sm:p-6 md:p-8 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md sm:max-w-lg relative z-10"
        >
          <Card className="p-6 sm:p-8 border-card-border bg-card/80 backdrop-blur-md shadow-lg rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-foreground">Configuration Required</h1>
              <ThemeToggle />
            </div>
            <p className="text-muted text-center mb-6">Set up your Supabase connection to continue</p>

            <div className="space-y-4">
              <div className="bg-yellow-500/20 border border-yellow-500/70 rounded-lg p-4">
                <h3 className="text-yellow-500 font-medium mb-2 tracking-wide">Setup Steps</h3>
                <ol className="text-sm text-yellow-400 space-y-2 list-decimal list-inside">
                  <li>Sign up at <a href="https://supabase.com" className="underline hover:text-yellow-300" target="_blank" rel="noopener noreferrer">supabase.com</a></li>
                  <li>Copy your project URL and anon key from the dashboard</li>
                  <li>Add them to your <code>.env</code> file</li>
                  <li>Restart your development server</li>
                </ol>
              </div>

              <div className="bg-card-hover rounded-lg p-4">
                <h4 className="text-foreground font-medium mb-3 tracking-wide">Environment Variables</h4>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">VITE_SUPABASE_URL</span>
                    <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-500 font-medium">MISSING</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">VITE_SUPABASE_ANON_KEY</span>
                    <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-500 font-medium">MISSING</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={checkConnection}
                className="w-full rounded-xl py-3 text-base"
                leftIcon={<Settings className="w-5 h-5" />}
                glow
              >
                Test Connection
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4 sm:p-6 md:p-8 transition-colors duration-300">
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md sm:max-w-lg relative z-10"
      >
        <Card className="p-6 sm:p-8 border-card-border/80 bg-card/90 backdrop-blur-xl shadow-lg rounded-2xl">
          <motion.div
            className="text-center mb-6"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className={`w-16 h-16 bg-gradient-to-br ${getGradientColors()} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-glow`}>
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <motion.h1
              className="text-2xl sm:text-3xl font-bold text-foreground mb-1"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              JobTracker AI
            </motion.h1>
            <motion.p
              className="text-muted text-sm sm:text-base"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </motion.p>

            <motion.div
              className="mt-4"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              aria-live="polite"
            >
              <div
                className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs sm:text-sm ${
                  connectionStatus === 'connected'
                    ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                    : connectionStatus === 'checking'
                    ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                    : 'bg-red-500/20 text-red-500 border border-red-500/30'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected'
                      ? 'bg-green-500 animate-pulse'
                      : connectionStatus === 'checking'
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-red-500'
                  }`}
                ></div>
                <span>
                  {connectionStatus === 'connected' && 'Connected to Supabase'}
                  {connectionStatus === 'checking' && 'Checking connection...'}
                  {connectionStatus === 'disconnected' && 'Connection failed'}
                </span>
              </div>
            </motion.div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-500 text-sm">{error}</span>
            </motion.div>
          )}

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div
                  key="fullname"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Input
                    label="Full Name"
                    type="text"
                    className="rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    leftIcon={<User className="w-5 h-5 text-muted" />}
                    required
                    placeholder="e.g., John Doe"
                    size="lg"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Input
                label="Email Address"
                type="email"
                className="rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-5 h-5 text-muted" />}
                required
                placeholder="e.g., name@example.com"
                size="lg"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  className="rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 pr-14"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-5 h-5 text-muted" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-foreground transition-colors p-2"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  required
                  placeholder="Enter your password"
                  minLength={6}
                  size="lg"
                />
              </div>
            </motion.div>

            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-xs text-muted text-center"
              >
                By creating an account, you agree to our{' '}
                <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and{' '}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <Button
                type="submit"
                className="w-full rounded-lg py-3 text-base shadow-sm hover:shadow-md transition-shadow"
                isLoading={loading}
                disabled={loading || connectionStatus !== 'connected'}
                glow
                rightIcon={loading ? <Loader className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </motion.div>
          </motion.form>

          <motion.div
            className="mt-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <button
              type="button"
              onClick={handleToggle}
              className="text-primary hover:text-primary-hover text-sm transition-colors"
              disabled={isToggling}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-6 pt-4 border-t border-card-border/30"
          >
            <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-muted">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Secure authentication powered by Supabase</span>
            </div>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}