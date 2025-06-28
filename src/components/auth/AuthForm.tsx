import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ThemeToggle } from '../layout/ThemeToggle';
import {
  Sparkles, Mail, Lock, User, AlertCircle,
  Settings, CheckCircle, ArrowRight, Eye, EyeOff, Loader
} from 'lucide-react';
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
  const [connectionStatus, setConnectionStatus] = useState('checking');
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
    } catch (error) {
      console.error('Connection check failed:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleSubmit = async (e) => {
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
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message || 'An error occurred');
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const getGradientColors = () => {
    switch (colorScheme) {
      case 'yellow':
        return 'from-yellow-400 via-purple-500 to-green-500';
      case 'purple':
        return 'from-purple-500 via-yellow-400 to-green-500';
      case 'green':
        return 'from-green-500 via-blue-500 to-purple-500';
      default:
        return 'from-blue-500 via-purple-500 to-green-500';
    }
  };

  const statusStyles = {
    connected: 'bg-green-500/20 text-green-500 border border-green-500/30',
    checking: 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30',
    disconnected: 'bg-red-500/20 text-red-500 border border-red-500/30',
  };

  const dotStyles = {
    connected: 'bg-green-500 animate-pulse',
    checking: 'bg-yellow-500 animate-pulse',
    disconnected: 'bg-red-500',
  };

  const connectionLabel = {
    connected: 'Connected to Supabase',
    checking: 'Checking connection...',
    disconnected: 'Connection failed',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="p-8 border-card-border bg-card/90 backdrop-blur-xl shadow-xl rounded-2xl">

          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br ${getGradientColors()} shadow-glow-lg`}>
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">JobTracker AI</h1>
            <p className="text-muted mt-2">{isSignUp ? 'Create your account' : 'Welcome back'}</p>
            <div className={`inline-flex items-center mt-4 px-3 py-1 rounded-full text-xs ${statusStyles[connectionStatus]}`}>
              <div className={`w-2 h-2 rounded-full ${dotStyles[connectionStatus]}`}></div>
              <span className="ml-2">{connectionLabel[connectionStatus]}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-500 text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence>
              {isSignUp && (
                <motion.div
                  key="fullname"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Input
                    label="Full Name"
                    type="text"
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

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-5 h-5 text-muted" />}
              required
              placeholder="Enter your email"
              size="lg"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-5 h-5 text-muted" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                required
                placeholder="Enter your password"
                size="lg"
              />
            </div>

            <Button
              type="submit"
              className="w-full py-4 text-base"
              isLoading={loading}
              disabled={connectionStatus !== 'connected'}
              glow
              rightIcon={loading ? <Loader className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          {/* Switch Auth Mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-primary hover:text-primary-hover text-sm"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {isSignUp && (
            <div className="mt-4 text-xs text-muted text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-card-border/30 text-xs text-muted text-center">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Secure authentication powered by Supabase</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
