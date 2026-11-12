import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Target,
  FileCheck2,
  FileText,
  Play,
  Terminal,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Wrench,
  Bot,
  Zap,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleCrt?: () => void;
  crtActive?: boolean;
}

interface CommandItem {
  id: string;
  label: string;
  sublabel?: string;
  category: 'Navigation' | 'Actions' | 'Tools';
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: 'nav-overview',
        label: 'Security Overview',
        sublabel: 'Executive telemetry & risk posture',
        category: 'Navigation',
        icon: LayoutDashboard,
        action: () => navigate('/'),
      },
      {
        id: 'nav-playground',
        label: 'Interactive Playground',
        sublabel: 'Side-by-side prompt testing & live probes',
        category: 'Navigation',
        icon: Terminal,
        action: () => navigate('/playground'),
      },
      {
        id: 'nav-targets',
        label: 'Monitored Targets',
        sublabel: 'Manage LLM endpoints & local models',
        category: 'Navigation',
        icon: Target,
        action: () => navigate('/targets'),
      },
      {
        id: 'nav-assessments',
        label: 'Assessment Runs',
        sublabel: 'History of test suite executions',
        category: 'Navigation',
        icon: FileCheck2,
        action: () => navigate('/assessments'),
      },
      {
        id: 'nav-findings',
        label: 'Findings & Vulnerabilities',
        sublabel: 'Audit findings, severity triage & retesting',
        category: 'Navigation',
        icon: ShieldAlert,
        action: () => navigate('/findings'),
      },
      {
        id: 'nav-remediation',
        label: 'Remediation Workshop',
        sublabel: 'Prompt boundaries & Python guardrail code',
        category: 'Navigation',
        icon: Wrench,
        action: () => navigate('/remediation'),
      },
      {
        id: 'nav-reports',
        label: 'Audit Reports & Dossiers',
        sublabel: 'Auditor-grade PDF & JSON downloads',
        category: 'Navigation',
        icon: FileText,
        action: () => navigate('/reports'),
      },
      {
        id: 'nav-matrix',
        label: 'Threat Matrix',
        sublabel: 'OWASP LLM 2025 & MITRE ATLAS coverage',
        category: 'Navigation',
        icon: Sparkles,
        action: () => navigate('/matrix'),
      },
      // Actions
      {
        id: 'act-new-assessment',
        label: 'Launch New Assessment',
        sublabel: 'Configure target, test profile, and suite',
        category: 'Actions',
        icon: Play,
        action: () => navigate('/assessments/new'),
      },
      {
        id: 'act-probe-secret',
        label: 'Probe System Credentials',
        sublabel: 'Send secret extraction vector to Playground',
        category: 'Actions',
        icon: Zap,
        action: () => {
          navigate('/playground');
          toast.info('Loaded secret extraction probe vector');
        },
      },
      {
        id: 'act-discover-local',
        label: 'Discover Local Models',
        sublabel: 'Scan local ports for Ollama & LM Studio',
        category: 'Actions',
        icon: Bot,
        action: () => {
          navigate('/targets');
          toast.info('Scanning for local Ollama/LM Studio instances...');
        },
      },
    ],
    [navigate, toast]
  );

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.sublabel && c.sublabel.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filteredCommands, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#111114] border border-[#222228] rounded-xl shadow-2xl overflow-hidden flex flex-col text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#222228] bg-[#0a0a0c]">
          <Search className="w-4 h-4 text-charcoal-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, navigate or launch actions..."
            className="flex-1 bg-transparent text-sm text-white placeholder-charcoal-500 focus:outline-none font-mono"
          />
          <kbd className="text-[10px] bg-charcoal-900 text-charcoal-400 px-1.5 py-0.5 rounded border border-charcoal-700 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-charcoal-500">
              No matching commands found for "{query}".
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors font-mono ${
                    isSelected
                      ? 'bg-charcoal-900 text-white border border-charcoal-600'
                      : 'text-charcoal-300 hover:bg-[#16161c] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-md ${
                        isSelected
                          ? 'bg-white text-black'
                          : 'bg-charcoal-900 text-charcoal-400 border border-charcoal-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{cmd.label}</p>
                      {cmd.sublabel && (
                        <p className="text-[11px] text-charcoal-400 truncate">{cmd.sublabel}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-charcoal-400 bg-[#0a0a0c] px-1.5 py-0.5 rounded border border-charcoal-800">
                      {cmd.category}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-white" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-[#222228] bg-[#0a0a0c] flex items-center justify-between text-[11px] font-mono text-charcoal-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="bg-charcoal-900 text-charcoal-300 px-1 py-0.5 rounded text-[10px] mr-1 border border-charcoal-800">↑↓</kbd>
              Navigate
            </span>
            <span>
              <kbd className="bg-charcoal-900 text-charcoal-300 px-1 py-0.5 rounded text-[10px] mr-1 border border-charcoal-800">↵</kbd>
              Select
            </span>
          </div>
          <span>Sentrix Command Center</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
