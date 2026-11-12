import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface RunningAnimationProps {
  targetName?: string;
}

const steps = [
  'Initializing test harness & adapter protocol...',
  'Connecting to target model in sandboxed session...',
  'Evaluating Prompt Injection & Boundary Overrides...',
  'Testing Synthetic Secret Probes & Canary Tripwires...',
  'Evaluating Factual Reliability & Hallucinations...',
  'Verifying Structured Output Schema & JSON constraints...',
  'Testing Adversarial Robustness & Perturbations...',
  'Compiling risk scores and generating report...',
];

export const RunningAnimation: React.FC<RunningAnimationProps> = ({ targetName = 'AI Target' }) => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 350);
    return () => clearInterval(timer);
  }, []);

  const progressPct = Math.round(((activeStep + 1) / steps.length) * 100);

  return (
    <div className="bg-[#111114] border border-[#222228] rounded-2xl p-8 max-w-xl mx-auto text-center space-y-6 shadow-2xl">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-charcoal-900 border border-charcoal-800 text-white">
        <RefreshCw className="w-6 h-6 animate-spin text-white" />
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white tracking-tight">
          Running Security Assessment
        </h2>
        <p className="text-xs font-mono text-charcoal-400">
          Target: <strong className="text-white">{targetName}</strong> • Automated adversarial test suite active
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-charcoal-300">
          <span>{steps[activeStep]}</span>
          <span className="font-bold text-white">{progressPct}%</span>
        </div>
        <div className="w-full bg-[#1c1c22] h-2 rounded-full overflow-hidden border border-[#282832]">
          <div
            className="bg-white h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default RunningAnimation;
