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
import { cn } from '../../utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, color: 'text-blue-400' },
  { name: 'Jobs', href: '/applications', icon: Briefcase, color: 'text-purple-400' },
  { name: 'Leads', href: '/job-opportunities', icon: Target, color: 'text-yellow-400' },
  { name: 'Resume', href: '/resume', icon: FileText, color: 'text-green-400' },
  { name: 'Letters', href: '/cover-letters', icon: Mail, color: 'text-blue-400' },
  { name: 'Docs', href: '/documents', icon: FolderOpen, color: 'text-yellow-400' },
  { name: 'Follow', href: '/follow-ups', icon: Clock, color: 'text-purple-400' },
];

export function MobileNavigation() {
  const { theme } = useTheme();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-card-border/80 p-2 flex justify-around items-center z-40 transition-colors duration-300 shadow-lg">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) => cn(
            "flex flex-col items-center space-y-1 p-2 rounded-lg text-xs font-medium transition-all duration-200 min-w-[60px] text-center border",
            isActive
              ? "text-primary bg-primary/10 border-primary/30"
              : "text-muted hover:text-foreground border-transparent"
          )}
        >
          <item.icon className={cn(
            "w-5 h-5",
            item.color,
            theme === 'dark' && 'drop-shadow-glow'
          )} />
          <span>{item.name}</span>
        </NavLink>
      ))}
    </div>
  );
}