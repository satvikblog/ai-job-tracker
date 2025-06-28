import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ThemeToggle } from '../layout/ThemeToggle';
import { Sparkles, Mail, Lock, User, AlertCircle, Settings, CheckCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
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

  // Configuration screen if not connected
  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="w-full max-w-md">
          <Card className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">
                Configuration Required
              </h1>
              <p className="text-muted mt-2">
                Please set up your Supabase connection
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-500/20 border border-yellow-500/70 rounded-lg p-4">
                <h3 className="text-yellow-500 font-medium mb-2">Setup Instructions:</h3>
                <ol className="text-sm text-yellow-400 space-y-2">
                  <li>1. Create a Supabase project at supabase.com</li>
                  <li>2. Copy your project URL and anon key</li>
                  <li>3. Update the .env file with your credentials</li>
                  <li>4. Restart the development server</li>
                </ol>
              </div>

              <Button
                onClick={checkConnection}
                className="w-full"
                leftIcon={<Settings className="w-4 h-4" />}
              >
                Test Connection
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        <Card className="p-8 shadow-lg rounded-xl">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-muted mt-1">
              {isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
            </p>
            
            {/* Connection Status */}
            <div className="mt-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs bg-green-500/10 border border-green-500/30">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-green-500 font-medium">Connected to Supabase</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-red-500 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <Input
                label="Full Name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-5 h-5 text-muted" />}
                required
                placeholder="Enter your full name"
                size="lg"
                className="w-full"
              />
            )}
            
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-5 h-5 text-muted" />}
              required
              placeholder="Enter your email"
              size="lg"
              className="w-full"
            />
            
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-5 h-5 text-muted" />}
                required
                placeholder="Enter your password"
                minLength={6}
                size="lg"
                className="w-full pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full py-4 rounded-xl text-base"
                isLoading={loading}
                rightIcon={loading ? undefined : <ArrowRight className="w-5 h-5" />}
                glow
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
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
          </div>
          
          <div className="mt-8 pt-6 border-t border-card-border/30 text-center">
            <div className="flex items-center justify-center space-x-2 text-xs text-muted">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Secure authentication powered by Supabase</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}