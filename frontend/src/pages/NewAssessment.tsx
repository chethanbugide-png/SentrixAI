import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Play,
  CheckCircle2,
} from 'lucide-react';
import RunningAnimation from '../components/assessment/RunningAnimation';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getTargets, createAssessment } from '../services/api';
import type { Target } from '../types';
import { useToast } from '../context/ToastContext';

const allCategories = [
  {
    id: 'prompt_injection',
    name: 'Prompt Injection & Jailbreaks',
    desc: 'Direct instruction override, system prompt leakage, and role hijacking.',
  },
  {
    id: 'secret_exposure',
    name: 'Sensitive Data Exposure',
    desc: 'Synthetic API credentials, canary tokens, and private system instructions.',
  },
  {
    id: 'hallucination',
    name: 'Hallucination & Reliability',
    desc: 'Fabricated facts, non-existent packages, and unanswerable paradoxes.',
  },
  {
    id: 'compliance',
    name: 'Instruction Compliance',
    desc: 'JSON schema validation, strict key presence, and format adherence.',
  },
  {
    id: 'unsafe_output',
    name: 'Unsafe Code & Content',
    desc: 'Malware synthesis refusal, credential harvesting, and exploit generation.',
  },
  {
    id: 'robustness',
    name: 'Robustness & Perturbations',
    desc: 'Homoglyph smuggling, zero-width characters, and leetspeak invariance.',
  },
];

export const NewAssessment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const initialTargetId = location.state?.targetId;

  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTargetId, setSelectedTargetId] = useState<number | string>(initialTargetId || '');
  const [selectedProfile, setSelectedProfile] = useState('full');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    allCategories.map((c) => c.id)
  );
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTargets();
        setTargets(data);
        if (!initialTargetId && data.length > 0) {
          setSelectedTargetId(data[0].id);
        }
      } catch (err: any) {
        toast.error('Failed to load targets', err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [initialTargetId]);

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      if (selectedCategories.length === 1) return;
      setSelectedCategories(selectedCategories.filter((c) => c !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const handleLaunch = async () => {
    if (!selectedTargetId) {
      toast.warning('Target Required', 'Please select a target before launching assessment');
      return;
    }
    setRunning(true);
    toast.info('Assessment Launched', 'Executing test suite vectors against model target...');

    try {
      const res = await createAssessment({
        target_id: selectedTargetId,
        test_profile: selectedProfile,
        categories: selectedCategories,
      });

      setTimeout(() => {
        toast.success('Assessment Complete', `Finished running tests for Run #${res.id}`);
        navigate(`/assessments/${res.id}`);
      }, 2500);
    } catch (err: any) {
      toast.error('Assessment Failed', err.message || 'Failed to start assessment');
      setRunning(false);
    }
  };

  const activeTarget = targets.find((t) => String(t.id) === String(selectedTargetId));

  if (running) {
    return (
      <div className="py-16">
        <RunningAnimation targetName={activeTarget?.name || 'Selected Target'} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" label="Preparing assessment wizard..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-mono uppercase">
          Launch Security Assessment
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-300 mt-1">
          Select target model, configure scope, and execute automated adversarial verification.
        </p>
      </div>

      {/* Step 1: Select Target */}
      <div className="p-5 rounded-xl bg-stark-950 border border-charcoal-800 space-y-4 font-mono">
        <div className="flex items-center justify-between text-xs">
          <h2 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-charcoal-800 text-white flex items-center justify-center font-bold">
              1
            </span>
            <span>Target Architecture</span>
          </h2>
          <span className="text-charcoal-400">
            {targets.length} registered
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {targets.map((t) => {
            const isSelected = String(t.id) === String(selectedTargetId);
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTargetId(t.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-charcoal-800 border-white text-white shadow-sm'
                    : 'bg-black border-charcoal-800 hover:border-charcoal-600 text-charcoal-300'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="font-bold text-xs text-white">{t.name}</div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                </div>
                <p className="text-xs text-charcoal-400 line-clamp-2 mb-2 font-sans">{t.description}</p>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-charcoal-900 text-charcoal-300 border border-charcoal-700">
                  {t.target_type}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Select Profile */}
      <div className="p-5 rounded-xl bg-stark-950 border border-charcoal-800 space-y-4 font-mono">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-charcoal-800 text-white flex items-center justify-center font-bold">
            2
          </span>
          <span>Evaluation Profile</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'full',
              title: 'Full Audit Suite',
              desc: 'Evaluates all 6 vulnerability categories with 36 test probes.',
              badge: 'RECOMMENDED',
            },
            {
              id: 'injection_only',
              title: 'Adversarial Injection Focus',
              desc: 'Targeted evaluation for prompt leaks, roleplay overrides, and delimiters.',
              badge: 'RED TEAM',
            },
            {
              id: 'compliance_only',
              title: 'Schema & Reliability Focus',
              desc: 'Validates JSON formatting constraints, facts, and hallucination bounds.',
              badge: 'RELIABILITY',
            },
          ].map((prof) => {
            const isSelected = selectedProfile === prof.id;
            return (
              <div
                key={prof.id}
                onClick={() => setSelectedProfile(prof.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-charcoal-800 border-white text-white shadow-sm'
                    : 'bg-black border-charcoal-800 hover:border-charcoal-600 text-charcoal-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="font-bold text-white">{prof.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-charcoal-900 text-charcoal-300 border border-charcoal-700">
                      {prof.badge}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-400 font-sans leading-relaxed">{prof.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 3: Scope */}
      <div className="p-5 rounded-xl bg-stark-950 border border-charcoal-800 space-y-4 font-mono">
        <div className="flex items-center justify-between text-xs">
          <h2 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-charcoal-800 text-white flex items-center justify-center font-bold">
              3
            </span>
            <span>Vulnerability Scope ({selectedCategories.length} Selected)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {allCategories.map((cat) => {
            const isChecked = selectedCategories.includes(cat.id);
            return (
              <div
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                  isChecked
                    ? 'bg-charcoal-800 border-charcoal-500 text-white'
                    : 'bg-black border-charcoal-800 text-charcoal-400 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="mt-0.5 rounded border-charcoal-700 bg-black text-white focus:ring-0 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-white">{cat.name}</p>
                  <p className="text-[11px] text-charcoal-400 font-sans mt-0.5">{cat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Launch CTA */}
      <div className="flex justify-end pt-2 font-mono">
        <button
          onClick={handleLaunch}
          disabled={running || !selectedTargetId}
          className="pro-button-primary px-6 py-2.5 text-xs uppercase flex items-center gap-2 disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-black stroke-black" />
          <span>Execute Assessment</span>
        </button>
      </div>
    </div>
  );
};

export default NewAssessment;
