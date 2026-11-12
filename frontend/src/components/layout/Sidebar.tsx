import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  FileCheck2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shield,
  PlayCircle,
  ShieldCheck,
  Wrench,
  Grid,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const mainNav = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/playground', label: 'Playground', icon: PlayCircle },
  { path: '/targets', label: 'Targets', icon: Target },
  { path: '/assessments', label: 'Assessments', icon: ShieldCheck },
  { path: '/findings', label: 'Findings', icon: FileCheck2 },
  { path: '/reports', label: 'Reports', icon: FileText },
];

const advancedNav = [
  { path: '/remediation', label: 'Remediation', icon: Wrench },
  { path: '/matrix', label: 'Threat Matrix', icon: Grid },
  { path: '/redteam', label: 'Red-Team Engine', icon: Zap },
];

const NavItem: React.FC<{
  item: { path: string; label: string; icon: any };
  collapsed: boolean;
}> = ({ item, collapsed }) => {
  const Icon = item.icon;

  return (
    <NavLink
      key={item.path}
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
          isActive
            ? 'bg-charcoal-800 text-white font-semibold border border-charcoal-600/70 shadow-sm'
            : 'text-charcoal-300 hover:text-white hover:bg-charcoal-900/80 border border-transparent'
        }`
      }
      title={collapsed ? item.label : undefined}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-white rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
          )}
          <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-white' : 'text-charcoal-400 group-hover:text-white'}`} />
          {!collapsed && <span>{item.label}</span>}
        </>
      )}
    </NavLink>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-black border-r border-charcoal-800 transition-all duration-300 ease-in-out z-40 flex flex-col justify-between select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-charcoal-800">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white text-black font-extrabold shrink-0 shadow-sm transition-transform group-hover:scale-105">
              <Shield className="w-4 h-4 text-black fill-black" />
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1">
                  SENTRIX <span className="text-charcoal-400 font-mono text-xs">PRO</span>
                </span>
                <span className="text-[10px] text-charcoal-400 font-mono tracking-wider uppercase">
                  LLM Defense OS
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-white hover:bg-charcoal-800 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-5 space-y-6">
          <div>
            {!collapsed && (
              <div className="px-3 mb-2 text-[10px] font-mono font-semibold text-charcoal-400 uppercase tracking-widest">
                Platform
              </div>
            )}
            <nav className="space-y-1">
              {mainNav.map((item) => (
                <NavItem key={item.path} item={item} collapsed={collapsed} />
              ))}
            </nav>
          </div>

          <div>
            {!collapsed && (
              <div className="px-3 mb-2 text-[10px] font-mono font-semibold text-charcoal-400 uppercase tracking-widest">
                Red-Teaming & Hardening
              </div>
            )}
            <nav className="space-y-1">
              {advancedNav.map((item) => (
                <NavItem key={item.path} item={item} collapsed={collapsed} />
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div
        className={`p-4 border-t border-charcoal-800 text-xs text-charcoal-400 transition-opacity duration-200 ${
          collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-charcoal-300">v1.2.0-STARK</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-charcoal-800 text-charcoal-200 border border-charcoal-700">
            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
            ONLINE
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
