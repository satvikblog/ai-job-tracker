import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNavigation } from './MobileNavigation';
import { ThemeToggle } from './ThemeToggle';
import { Toaster, ToastPosition } from 'react-hot-toast';
import { Menu, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-background-secondary transition-colors duration-300">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-card/90 backdrop-blur-sm"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-colors duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-64 h-full">
            <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto transition-colors duration-300">
        <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      
      {/* Theme Toggle (Mobile) */}
      <div className="fixed bottom-20 right-4 lg:hidden z-30">
        <ThemeToggle />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <MobileNavigation />
      </div>

      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-background)',
            color: 'var(--toast-foreground)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid var(--toast-border)',
            backdropFilter: 'blur(10px)',
            boxShadow: 'var(--shadow-md)',
            fontSize: '14px',
            maxWidth: '90vw',
          },
          success: {
            style: {
              border: '1px solid var(--success-border)',
              background: 'var(--success-background)',
              color: 'var(--success)',
              fontWeight: '500',
            },
            icon: <CheckCircle className="w-5 h-5 text-success" />,
          },
          error: {
            style: {
              border: '1px solid var(--error-border)',
              background: 'var(--error-background)',
              color: 'var(--error)',
              fontWeight: '500',
            },
            icon: <AlertCircle className="w-5 h-5 text-error" />,
          },
        }}
      />
    </div>
  );
}