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
      toast.error('Please configure Supabase connection first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { data, error } = await signUp(email, password, fullName);
        if (error) throw error;
        
        if (data.user && !data.user.email_confirmed_at) {
          toast.success('Account created! Please check your email to verify your account.');
        } else {
          toast.success('Account created successfully!');
        }
      } else {
        const { data, error } = await signIn(email, password);
        if (error) throw error;
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'An error occurred');
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Get gradient colors based on color scheme
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

  // Show configuration screen if not connected
  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4 transition-colors duration-300">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="p-8 border-card-border bg-card/80 backdrop-blur-md shadow-lg">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                <Settings className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Configuration Required
              </h1>
              <p className="text-muted mt-2">
                Please set up your Supabase connection
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-500/20 border border-yellow-500/70 rounded-lg p-4 shadow-inner">
                <h3 className="text-yellow-500 font-medium mb-2 tracking-wide">Setup Instructions:</h3>
                <ol className="text-sm text-yellow-400 space-y-2">
                  <li>1. Create a Supabase project at supabase.com</li>
                  <li>2. Copy your project URL and anon key</li>
                  <li>3. Update the .env file with your credentials</li>
                  <li>4. Restart the development server</li>
                </ol>
              </div>

              <div className="bg-card-hover rounded-lg p-4 shadow-inner">
                <h4 className="text-foreground font-medium mb-3 tracking-wide">Environment Variables:</h4>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">VITE_SUPABASE_URL</span>
                    <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-500 font-medium">
                      MISSING
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">VITE_SUPABASE_ANON_KEY</span>
                    <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-500 font-medium">
                      MISSING
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={checkConnection}
                className="w-full"
                leftIcon={<Settings className="w-4 h-4" />}
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
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4 transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="p-8 border-card-border/80 bg-card/90 backdrop-blur-xl shadow-lg rounded-2xl">
          <motion.div 
            className="text-center mb-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className={`w-20 h-20 bg-gradient-to-br ${getGradientColors()} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-lg`}>
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <motion.h1 
              className="text-3xl font-bold text-foreground mb-1"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              JobTracker AI
            </motion.h1>
            <motion.p 
              className="text-muted mt-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </motion.p>
            
            {/* Connection Status */}
            <motion.div 
              className="mt-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
                connectionStatus === 'connected' 
                  ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                  : connectionStatus === 'checking' 
                  ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                  : 'bg-red-500/20 text-red-500 border border-red-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' 
                    ? 'bg-green-500 animate-pulse'
                    : connectionStatus === 'checking'
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-red-500'
                }`}></div>
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
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-500 text-sm">{error}</span>
            </motion.div> 
          )}

          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div
                  key="fullname"
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Input
                    label="Full Name"
                    type="text"
                    className="rounded-xl shadow-md mb-2"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    leftIcon={<User className="w-5 h-5 text-muted" />}
                    required
                    placeholder="Enter your full name"
                    size="lg"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Input
                label="Email Address"
                type="email"
                className="rounded-xl shadow-md mb-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-5 h-5 text-muted" />}
                required
                placeholder="Enter your email"
                size="lg"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  className="rounded-xl shadow-md mb-2 pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-5 h-5 text-muted" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-foreground transition-colors"
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="pt-2"
            >
              <Button
                type="submit"
                className="w-full rounded-xl py-4 text-base shadow-lg"
                isLoading={loading}
                disabled={connectionStatus !== 'connected'} 
                glow={true}
                rightIcon={loading ? <Loader className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </motion.div>
          </motion.form>

          <motion.div 
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-primary hover:text-primary-hover text-sm transition-colors"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button> 
          </motion.div>

          {isSignUp && (
            <motion.div 
              className="mt-4 text-xs text-muted text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </motion.div>
          )}
          
          {/* Connection Status Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-8 pt-6 border-t border-card-border/30"
          >
            <div className="flex items-center justify-center space-x-2 text-xs text-muted">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Secure authentication powered by Supabase</span>
            </div>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}