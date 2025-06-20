import React from 'react';
import { NavLink } from 'react-router-dom';
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
  TrendingUp,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';

const navigation = [
  { name: 'Dashboard', href: '#/', icon: LayoutDashboard, color: 'text-blue-400' },
  { name: 'Applications', href: '#/applications', icon: Briefcase, color: 'text-purple-400' },
  { name: 'Job Opportunities', href: '#/job-opportunities', icon: Target, color: 'text-emerald-400' },
  { name: 'Resume Generator', href: '#/resume', icon: FileText, color: 'text-green-400' },
  { name: 'Cover Letters', href: '#/cover-letters', icon: Mail, color: 'text-cyan-400' },
  { name: 'Documents', href: '#/documents', icon: FolderOpen, color: 'text-yellow-400' },
  { name: 'Follow-Ups', href: '#/follow-ups', icon: Clock, color: 'text-orange-400' },
  { name: 'Settings', href: '#/settings', icon: Settings, color: 'text-gray-400' },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <div className="flex flex-col h-screen w-64 bg-dark-900/80 backdrop-blur-xl border-r border-slate-700/50">
      {/* Logo */}
      <div className="flex items-center px-4 lg:px-6 py-4 lg:py-6 border-b border-slate-700/50">
        <motion.div 
          className="flex items-center space-x-2 lg:space-x-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-gradient-to-r from-success-400 to-success-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-bold gradient-text">
              JobTracker AI
            </h1>
            <p className="text-xs text-slate-400 flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span className="hidden sm:inline">Smart Job Management</span>
              <span className="sm:hidden">Smart Jobs</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 lg:px-4 py-4 lg:py-6 space-y-1 lg:space-y-2 overflow-y-auto">
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
                `group flex items-center px-3 lg:px-4 py-2 lg:py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600/20 to-secondary-600/20 text-white border border-primary-500/30 shadow-glow-sm'
                    : 'text-slate-300 hover:bg-dark-800/50 hover:text-white hover:border-slate-600/50 border border-transparent'
                }`
              }
            >
              <item.icon className={`w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 transition-colors duration-300 ${
                item.color
              } group-hover:scale-110`} />
              <span className="transition-all duration-300 text-xs lg:text-sm">{item.name}</span>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-primary-400 rounded-full"></div>
              </div>
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* AI Status Footer */}
      <div className="px-3 lg:px-4 py-3 lg:py-4 border-t border-slate-700/50">
        <motion.div 
          className="flex items-center space-x-2 lg:space-x-3 px-3 lg:px-4 py-2 lg:py-3 bg-gradient-to-r from-success-900/20 to-primary-900/20 rounded-xl border border-success-500/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="relative">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-success-500 to-primary-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 lg:w-4 lg:h-4 text-white animate-pulse" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 lg:w-3 lg:h-3 bg-success-400 rounded-full animate-ping"></div>
          </div>
          <div>
            <p className="text-xs lg:text-sm font-medium text-white">AI Assistant</p>
            <p className="text-xs text-success-300 flex items-center space-x-1">
              <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-success-400 rounded-full animate-pulse"></div>
              <span>Ready to help</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}