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
  Target
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Jobs', href: '/applications', icon: Briefcase },
  { name: 'Leads', href: '/job-opportunities', icon: Target },
  { name: 'Resume', href: '/resume', icon: FileText },
  { name: 'Letters', href: '/cover-letters', icon: Mail },
  { name: 'Docs', href: '/documents', icon: FolderOpen },
  { name: 'Follow', href: '/follow-ups', icon: Clock },
];

export function MobileNavigation() {
  const { theme } = useTheme();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-card-border p-2 flex justify-around items-center z-40 transition-colors duration-300">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) => `
            flex flex-col items-center space-y-1 p-2 rounded-lg text-xs font-medium transition-all duration-200
            min-w-[60px] text-center
            ${isActive 
              ? 'text-primary' 
              : 'text-muted hover:text-foreground'
            }
          `}
        >
          <item.icon className={`w-5 h-5 ${theme === 'dark' ? 'drop-shadow-glow' : ''}`} />
          <span>{item.name}</span>
        </NavLink>
      ))}
    </div>
  );
}