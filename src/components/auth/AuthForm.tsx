import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ThemeToggle } from '../layout/ThemeToggle';
import { Sparkles, Mail, Lock, User, AlertCircle, Settings, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { testConnection } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  const { signIn, signUp } = useAuth();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    
    // Hardcoded credentials for Vercel deployment
    const supabaseUrl = 'https://zeiivnxtkcqwlnmtxyfd.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaWl2bnh0a2Nxd2xubXR4eWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzMyNzUsImV4cCI6MjA2NTY0OTI3NX0.lhahnsYyO9yEvnYTt-5fxZ6bxtDzqHSiOR0OABD_jSI';
    
    // Log connection details for debugging
    console.log('Using Supabase URL:', supabaseUrl);
    console.log('Using Supabase Anon Key:', supabaseAnonKey ? 'Set (not shown for security)' : 'Not set');
    
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
          className="w-full max-w-md"
        >
          <Card className="p-8 border-card-border bg-card">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-warning to-error rounded-xl flex items-center justify-center mx-auto mb-4 shadow-glow">
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
              <div className="bg-orange-900/20 border border-orange-500 rounded-lg p-4">
                <h3 className="text-orange-300 font-medium mb-2">Setup Instructions:</h3>
                <ol className="text-sm text-orange-200 space-y-1">
                  <li>1. Create a Supabase project at supabase.com</li>
                  <li>2. Copy your project URL and anon key</li>
                  <li>3. Update the .env file with your credentials</li>
                  <li>4. Restart the development server</li>
                </ol>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-gray-300 font-medium mb-2">Environment Variables:</h4>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">VITE_SUPABASE_URL</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      supabaseUrl && 
                      !supabaseUrl.includes('placeholder') &&
                      !supabaseUrl.includes('your_supabase_project_url')
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {supabaseUrl && 
                       !supabaseUrl.includes('placeholder') &&
                       !supabaseUrl.includes('your_supabase_project_url') ? 'SET' : 'MISSING'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">VITE_SUPABASE_ANON_KEY</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      supabaseAnonKey && 
                      !supabaseAnonKey.includes('placeholder') &&
                      !supabaseAnonKey.includes('your_supabase_anon_key')
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {supabaseAnonKey && 
                       !supabaseAnonKey.includes('placeholder') &&
                       !supabaseAnonKey.includes('your_supabase_anon_key') ? 'SET' : 'MISSING'}
                    </span>
                  </div>
                </div>
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
        </motion.div>
      </div>
    );
  }

  // Floating particles animation
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    size: Math.random() * 4 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Web 3.0 Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-primary/20"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              x: [
                Math.random() * 100 - 50,
                Math.random() * 100 - 50,
                Math.random() * 100 - 50,
                Math.random() * 100 - 50
              ],
              y: [
                Math.random() * 100 - 50,
                Math.random() * 100 - 50,
                Math.random() * 100 - 50,
                Math.random() * 100 - 50
              ],
              opacity: [0.2, 0.5, 0.2, 0.5],
              scale: [1, 1.5, 1, 1.5]
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              repeatType: "reverse",
              delay: particle.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* Animated Gradient Blob */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 blur-3xl"
        animate={{
          x: [50, -50, 50],
          y: [20, -20, 20],
          scale: [1, 1.1, 1],
          rotate: [0, 10, 0]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        style={{ top: '20%', left: '30%', zIndex: -1 }}
      />
      
      <motion.div
        className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-secondary/30 to-accent/30 blur-3xl"
        animate={{
          x: [-30, 30, -30],
          y: [-40, 40, -40],
          scale: [1, 1.2, 1],
          rotate: [0, -10, 0]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        style={{ bottom: '20%', right: '30%', zIndex: -1 }}
      />
      
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="p-8 border-card-border bg-card/80 backdrop-blur-md shadow-lg">
          <motion.div 
            className="text-center mb-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow relative">
              <Sparkles className="w-10 h-10 text-white" />
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-white/20"
                animate={{ 
                  boxShadow: ['0 0 0 0 rgba(255,255,255,0)', '0 0 0 10px rgba(255,255,255,0)'],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
              />
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
                  ? 'bg-success/20 text-success border border-success/30'
                  : connectionStatus === 'checking' 
                  ? 'bg-warning/20 text-warning border border-warning/30'
                  : 'bg-error/20 text-error border border-error/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' 
                    ? 'bg-success animate-pulse'
                    : connectionStatus === 'checking'
                    ? 'bg-warning animate-pulse'
                    : 'bg-error'
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
              className="mb-4 p-3 bg-error/20 border border-error/50 rounded-lg flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 text-error" />
              <span className="text-error text-sm">{error}</span>
            </motion.div>
          )}

          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Input
                  label="Full Name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                  placeholder="Enter your full name"
                />
              </motion.div>
            )}
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
                placeholder="Enter your email"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
                placeholder="Enter your password"
                minLength={6}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <Button
                type="submit"
                className="w-full"
                isLoading={loading}
                disabled={connectionStatus !== 'connected'}
                glow
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </motion.div>
          </motion.form>

          <motion.div 
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
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
              transition={{ delay: 1.1, duration: 0.5 }}
            >
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </motion.div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}