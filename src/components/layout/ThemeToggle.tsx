import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Laptop, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeToggleProps {
  variant?: 'icon' | 'full';
  className?: string;
}

export function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, colorScheme, setColorScheme } = useTheme();
  const [showColorPicker, setShowColorPicker] = React.useState(false);

  const colorSchemes = [
    { name: 'blue', label: 'Blue (Default)', color: '#3b82f6' },
    { name: 'purple', label: 'Purple', color: '#8b5cf6' },
    { name: 'green', label: 'Green', color: '#10b981' },
    { name: 'red', label: 'Red', color: '#ef4444' },
    { name: 'gray', label: 'Gray', color: '#6b7280' },
  ];

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-5 h-5" />;
    if (theme === 'dark') return <Moon className="w-5 h-5" />;
    return <Laptop className="w-5 h-5" />;
  };

  const getThemeLabel = () => {
    if (theme === 'light') return 'Light';
    if (theme === 'dark') return 'Dark';
    return 'System';
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-card border border-card-border hover:bg-card-hover transition-colors duration-200 shadow-md"
          aria-label="Toggle theme"
        >
          {getThemeIcon()}
        </button>
        
        {variant === 'full' && (
          <span className="text-sm font-medium text-foreground">{getThemeLabel()} Mode</span>
        )}
        
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-2 rounded-full bg-card border border-card-border hover:bg-card-hover transition-colors duration-200 shadow-md"
          aria-label="Change color scheme"
        >
          <Palette className="w-5 h-5" style={{ color: colorSchemes.find(c => c.name === colorScheme)?.color }} />
        </button>
      </div>
      
      <AnimatePresence>
        {showColorPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 p-2 bg-card border border-card-border rounded-lg shadow-lg z-50 w-48"
          >
            <div className="space-y-1">
              {colorSchemes.map((scheme) => (
                <button
                  key={scheme.name}
                  onClick={() => {
                    setColorScheme(scheme.name as any);
                    setShowColorPicker(false);
                  }}
                  className={`flex items-center w-full p-2 rounded-md transition-colors duration-200 ${
                    colorScheme === scheme.name 
                      ? 'bg-primary/20 text-primary' 
                      : 'hover:bg-card-hover text-foreground'
                  }`}
                >
                  <div 
                    className="w-4 h-4 rounded-full mr-2" 
                    style={{ backgroundColor: scheme.color }}
                  />
                  <span className="text-sm">{scheme.label}</span>
                  {colorScheme === scheme.name && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}