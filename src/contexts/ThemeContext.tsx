import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'blue' | 'purple' | 'green' | 'red' | 'gray';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'system');
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>('color-scheme', 'blue');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'blue', 'purple', 'green', 'red', 'gray');
    
    // Apply theme (dark/light)
    const activeTheme = theme === 'system' ? systemTheme : theme;
    root.classList.add(activeTheme);
    
    // Apply color scheme
    root.classList.add(colorScheme);
    
    // Set color-scheme for browser UI
    root.style.colorScheme = activeTheme;
  }, [theme, systemTheme, colorScheme]);

  const toggleTheme = () => {
    // Cycle through themes: light -> dark -> system
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      colorScheme, 
      setColorScheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}