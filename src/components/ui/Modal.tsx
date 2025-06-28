import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button'; 
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', footer, className }: ModalProps) {
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  return (
    <AnimatePresence>
      {isOpen && ( 
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/25 backdrop-blur-sm">
          <div className="flex items-start justify-center min-h-screen px-2 sm:px-4 pt-4 pb-20 text-center transition-colors duration-300">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 transition-opacity"
              onClick={onClose}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`
                relative inline-block w-full bg-card/95 backdrop-blur-xl rounded-xl text-left 
                overflow-hidden shadow-lg transform transition-all 
                my-4 sm:my-8 mx-auto border border-card-border
                ${sizeStyles[size]}
                max-h-[90vh] flex flex-col
                ${className}
              `}
            >
              {/* Header - Fixed */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-card-border flex-shrink-0 bg-card/80">
                <h3 className="text-lg font-semibold text-foreground truncate pr-4">
                  {title}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-dark-700/50 flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
                {children}
              </div>

              {/* Footer - Fixed */}
              {footer && (
                <div className="flex-shrink-0 p-4 sm:p-6 border-t border-card-border bg-card/50">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}