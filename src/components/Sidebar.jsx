import React from 'react';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  GraduationCap,
  FileText,
  Settings as SettingsIcon,
} from 'lucide-react';
import { cn } from '../lib/utils';

const ALL_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',           icon: LayoutDashboard, roles: ['Admin', 'Staff'] },
  { id: 'users',        label: 'Users',                icon: Users,           roles: ['Admin'] },
  { id: 'marketing',    label: 'Requests',             icon: Megaphone,       roles: ['Admin', 'Staff'] },
  { id: 'intelligence', label: 'Trailblazing',         icon: GraduationCap,   roles: ['Admin', 'Staff'] },
  { id: 'documents',    label: 'Documents & Reports',  icon: FileText,        roles: ['Admin', 'Staff'] },
  { id: 'settings',     label: 'Settings',             icon: SettingsIcon,    roles: ['Admin', 'Staff'] },
];

const Sidebar = ({ activeTab, setActiveTab, userRole }) => {
  const menuItems = ALL_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <div className="w-64 bg-white fixed left-0 top-13 h-[calc(100vh-3rem)] flex flex-col shadow-xl z-40">
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group',
                isActive
                  ? 'bg-accent text-primary font-semibold shadow-lg scale-[1.02]'
                  : 'hover:bg-primary text-gray-800 hover:text-white'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 transition-transform duration-300 group-hover:scale-110',
                isActive ? 'text-primary' : 'text-gray-400'
              )} />
              <span className="text-sm">{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
