import React from 'react';
import { NavLink } from 'react-router-dom';
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
  return (
    <div className="mobile-nav">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            `mobile-nav-item ${isActive ? 'active' : ''}`
          }
        >
          <item.icon className="w-5 h-5" />
          <span>{item.name}</span>
        </NavLink>
      ))}
    </div>
  );
}