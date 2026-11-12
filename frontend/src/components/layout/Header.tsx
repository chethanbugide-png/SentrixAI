import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';

interface HeaderProps {
  collapsed: boolean;
  onOpenCommandPalette: () => void;
  onToggleCrt?: () => void;
  crtActive?: boolean;
  onToggleTerminal?: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Security Overview',
  '/playground': 'Security Playground',
  '/targets': 'Target Models',
  '/assessments': 'Assessment Runs',
  '/assessments/new': 'New Assessment',
  '/findings': 'Vulnerabilities & Findings',
  '/reports': 'Audit Reports',
  '/remediation': 'Remediation Workshop',
  '/matrix': 'Threat Matrix',
  '/redteam': 'Red-Team Testing',
};

export const Header: React.FC<HeaderProps> = ({
  collapsed,
  onOpenCommandPalette,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-black/90 backdrop-blur-xl border-b border-charcoal-800 z-30 transition-all duration-300 ease-in-out flex items-center justify-between px-6 ${
        collapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Title with stark monochrome accent */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-bold text-white tracking-tight uppercase font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#fff]" />
          {title}
        </h1>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Command Search Bar */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-3 bg-charcoal-900/90 hover:bg-charcoal-800 border border-charcoal-700/80 hover:border-charcoal-500 text-charcoal-300 hover:text-white px-3.5 py-1.5 rounded-lg text-xs transition-all duration-150 group w-48 sm:w-64"
        >
          <Search className="w-3.5 h-3.5 text-charcoal-400 group-hover:text-white transition-colors" />
          <span className="flex-1 text-left truncate text-charcoal-300 group-hover:text-white font-mono text-[11px]">
            Command (Ctrl+K)...
          </span>
          <kbd className="hidden sm:inline-flex items-center text-[10px] bg-charcoal-800 text-charcoal-300 px-1.5 py-0.5 rounded border border-charcoal-700 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* System Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-charcoal-900 border border-charcoal-700 text-white text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[11px] text-charcoal-200">DEFENSE ACTIVE</span>
        </div>

        {/* Primary Action Button (Pure White on Stark Black) */}
        <button
          onClick={() => navigate('/assessments/new')}
          className="flex items-center gap-1.5 bg-white hover:bg-charcoal-100 text-black font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-all duration-150 shadow-sm hover:shadow"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Assessment</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
