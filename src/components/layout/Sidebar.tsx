import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Mail, 
  FolderOpen, 
  Clock, 
  Settings,
  Sparkles,
  Zap,
  Target,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { motion } from 'framer-motion';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, color: 'text-blue-400' },
  { name: 'Applications', href: '/applications', icon: Briefcase, color: 'text-purple-400' },
  { name: 'Job Opportunities', href: '/job-opportunities', icon: Target, color: 'text-yellow-400' },
  { name: 'Resume Generator', href: '/resume', icon: FileText, color: 'text-green-400' },
  { name: 'Cover Letters', href: '/cover-letters', icon: Mail, color: 'text-blue-400' },
  { name: 'Documents', href: '/documents', icon: FolderOpen, color: 'text-yellow-400' },
  { name: 'Follow-Ups', href: '/follow-ups', icon: Clock, color: 'text-purple-400' },
  { name: 'Settings', href: '/settings', icon: Settings, color: 'text-green-400' },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { theme, toggleTheme, colorScheme, setColorScheme } = useTheme();
  
  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-4 h-4" />;
    if (theme === 'dark') return <Moon className="w-4 h-4" />;
    return <Laptop className="w-4 h-4" />;
  };

  return (
    <div className="flex flex-col h-screen w-64 bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border transition-colors duration-300 shadow-lg">
      {/* Logo */}
      <div className="flex items-center px-4 lg:px-6 py-4 lg:py-6 border-b border-sidebar-border/80 bg-sidebar/80 backdrop-blur-md">
        <motion.div 
          className="flex items-center space-x-2 lg:space-x-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-yellow-400 via-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-glow-lg">
              <Zap className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-gradient">
              JobTracker AI
            </h1>
            <p className="text-xs text-muted flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
              <span>Smart Job Management</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 lg:px-4 py-4 lg:py-6 space-y-1 lg:space-y-2 overflow-y-auto scrollbar-thin">
        {navigation.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <NavLink
              to={item.href}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center px-3 lg:px-4 py-2 lg:py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-sidebar-hover ${
                  isActive
                    ? 'bg-sidebar-active text-sidebar-text-active border border-sidebar-border-active shadow-glow-sm'
                    : 'text-sidebar-text hover:text-sidebar-text-hover border border-transparent'
                }`
              }
            >
              <item.icon className={`w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 transition-colors duration-300 ${item.color} group-hover:scale-110`} />
              <span className="transition-all duration-300 text-xs lg:text-sm">{item.name}</span>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-yellow-400 rounded-full"></div>
              </div>
            </NavLink>
          </motion.div>
        ))}
        
        {/* Theme Toggle */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: navigation.length * 0.1 }}
        >
          <button
            onClick={toggleTheme}
            className="w-full group flex items-center px-3 lg:px-4 py-2 lg:py-3 rounded-xl text-sm font-medium transition-all duration-300 text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-hover border border-transparent"
          >
            {getThemeIcon()}
            <span className="ml-2 lg:ml-3 transition-all duration-300 text-xs lg:text-sm">
              {theme === 'light' ? 'Light Mode' : theme === 'dark' ? 'Dark Mode' : 'System Theme'}
            </span>
          </button>
        </motion.div>
        
        {/* Color Scheme Selector */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: (navigation.length + 1) * 0.1 }}
        >
          <div className="px-3 lg:px-4 py-2">
            <p className="text-xs text-muted mb-2">Color Theme</p>
            <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={() => setColorScheme('yellow')}
                className={`w-full h-8 rounded-md transition-all duration-200 ${
                  colorScheme === 'yellow' ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-background' : ''
                }`}
                style={{ background: 'linear-gradient(to right, #eab308, #facc15)' }}
                aria-label="Yellow theme"
              />
              <button 
                onClick={() => setColorScheme('blue')}
                className={`w-full h-8 rounded-md transition-all duration-200 ${
                  colorScheme === 'blue' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background' : ''
                }`}
                style={{ background: 'linear-gradient(to right, #2563eb, #60a5fa)' }}
                aria-label="Blue theme"
              />
              <button 
                onClick={() => setColorScheme('purple')}
                className={`w-full h-8 rounded-md transition-all duration-200 ${
                  colorScheme === 'purple' ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-background' : ''
                }`}
                style={{ background: 'linear-gradient(to right, #8b5cf6, #a78bfa)' }}
                aria-label="Purple theme"
              />
              <button 
                onClick={() => setColorScheme('green')}
                className={`w-full h-8 rounded-md transition-all duration-200 ${
                  colorScheme === 'green' ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-background' : ''
                }`}
                style={{ background: 'linear-gradient(to right, #22c55e, #4ade80)' }}
                aria-label="Green theme"
              />
            </div>
          </div>
        </motion.div>
      </nav>

      {/* AI Status Footer */}
      <div className="px-3 lg:px-4 py-3 lg:py-4 border-t border-sidebar-border/80 bg-sidebar/80 backdrop-blur-md">
        <motion.div 
          className="flex items-center space-x-2 lg:space-x-3 px-3 lg:px-4 py-2 lg:py-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl border border-green-500/30 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="relative">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 lg:w-4 lg:h-4 text-white animate-pulse" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 lg:w-3 lg:h-3 bg-green-400 rounded-full animate-ping"></div>
          </div>
          <div>
            <p className="text-xs lg:text-sm font-medium text-foreground">AI Assistant</p>
            <p className="text-xs text-green-400 flex items-center space-x-1">
              <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Ready to help</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}