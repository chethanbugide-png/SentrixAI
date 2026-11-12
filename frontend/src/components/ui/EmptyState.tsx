import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, Search, AlertTriangle, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: 'inbox' | 'search' | 'alert' | 'refresh';
  action?: {
    label: string;
    onClick: () => void;
  };
}

const iconMap = {
  inbox: Inbox,
  search: Search,
  alert: AlertTriangle,
  refresh: RefreshCw,
};

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'inbox',
  action,
}) => {
  const Icon = iconMap[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="p-4 bg-[#111114] rounded-2xl border border-[#222228] mb-4">
        <Icon size={32} className="text-white" />
      </div>
      <h3 className="text-base font-bold text-white mb-1 tracking-tight">{title}</h3>
      <p className="text-xs font-mono text-charcoal-400 max-w-md mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-white hover:bg-charcoal-200 text-black text-xs font-bold font-mono tracking-wider uppercase rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};

export const ErrorState: React.FC<{
  error: string;
  onRetry?: () => void;
}> = ({ error, onRetry }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
  >
    <div className="p-4 bg-[#111114] rounded-2xl border border-[#33333d] mb-4">
      <AlertTriangle size={32} className="text-white" />
    </div>
    <h3 className="text-base font-bold text-white mb-1 tracking-tight">System Exception Detected</h3>
    <p className="text-xs font-mono text-charcoal-400 max-w-md mb-6">{error}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-charcoal-200 text-black text-xs font-bold font-mono tracking-wider uppercase rounded-lg transition-colors"
      >
        <RefreshCw size={14} />
        Retry Telemetry
      </button>
    )}
  </motion.div>
);

export default EmptyState;
