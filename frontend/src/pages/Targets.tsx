import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target as TargetIcon,
  Plus,
  Play,
  Trash2,
  RefreshCw,
  Search,
  Radio,
  Zap,
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { getTargets, createTarget, deleteTarget, pingTarget, detectLocalModels } from '../services/api';
import type { Target, CreateTargetRequest } from '../types';
import { formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export const Targets: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pingStates, setPingStates] = useState<Record<string | number, any>>({});
  const [scanningLocal, setScanningLocal] = useState(false);
  const [discoveredModels, setDiscoveredModels] = useState<any[]>([]);

  const [formData, setFormData] = useState<CreateTargetRequest>({
    name: '',
    description: '',
    target_type: 'simulated_vulnerable',
    endpoint: '',
    config_json: '',
  });

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const data = await getTargets();
      setTargets(data);
    } catch (err: any) {
      toast.error('Failed to load targets', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handlePing = async (id: number | string) => {
    setPingStates((prev) => ({ ...prev, [id]: { pinging: true } }));
    try {
      const res = await pingTarget(id);
      setPingStates((prev) => ({ ...prev, [id]: { ...res, pinging: false } }));
      if (res.is_online) {
        toast.success(
          'Target Online',
          `${res.name} responded in ${res.latency_ms}ms with status 200`
        );
      } else {
        toast.error('Target Offline', res.details || 'Connection failed');
      }
    } catch (err: any) {
      setPingStates((prev) => ({
        ...prev,
        [id]: { is_online: false, latency_ms: 0, details: err.message, pinging: false },
      }));
      toast.error('Ping Failed', err.message);
    }
  };

  const handleScanLocal = async () => {
    setScanningLocal(true);
    try {
      const res = await detectLocalModels();
      setDiscoveredModels(res.discovered || []);
      if (res.total_found > 0) {
        toast.success(
          'Local Nodes Discovered',
          `Detected ${res.total_found} local inference instance(s)`
        );
      } else {
        toast.info(
          'Scan Complete',
          'No local Ollama (:11434) or LM Studio (:1234) detected. Simulated targets ready.'
        );
      }
    } catch (err: any) {
      toast.error('Scan Failed', err.message);
    } finally {
      setScanningLocal(false);
    }
  };

  const handleAddDiscovered = async (engine: string, modelName: string, endpoint: string) => {
    try {
      await createTarget({
        name: `${engine} - ${modelName}`,
        description: `Auto-discovered node from ${engine}`,
        target_type: 'local_model',
        endpoint: endpoint,
        config_json: JSON.stringify({ model: modelName }),
      });
      toast.success('Node Registered', `Added ${modelName} to targets`);
      fetchTargets();
    } catch (err: any) {
      toast.error('Import Failed', err.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setSubmitting(true);
    try {
      await createTarget(formData);
      setIsModalOpen(false);
      toast.success('Target Configured', `Registered ${formData.name}`);
      setFormData({
        name: '',
        description: '',
        target_type: 'simulated_vulnerable',
        endpoint: '',
        config_json: '',
      });
      fetchTargets();
    } catch (err: any) {
      toast.error('Creation Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this target?')) return;
    try {
      await deleteTarget(id);
      toast.success('Target Removed', 'The target has been deleted.');
      fetchTargets();
    } catch (err: any) {
      toast.error('Deletion Failed', err.message);
    }
  };

  const filteredTargets = targets.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.target_type.toLowerCase().includes(search.toLowerCase())
  );

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'simulated_protected':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-charcoal-800 text-white border border-charcoal-600">
            HARDENED
          </span>
        );
      case 'simulated_vulnerable':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-black">
            VULNERABLE
          </span>
        );
      case 'http_api':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-charcoal-900 text-charcoal-200 border border-charcoal-700">
            HTTP ENDPOINT
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-charcoal-900 text-charcoal-300 border border-charcoal-700">
            LOCAL MODEL
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-mono">
            <TargetIcon className="w-6 h-6 text-white" />
            Monitored Target Models
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-300 mt-1">
            Registered LLM endpoints, local Ollama nodes, and simulated architectures.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto font-mono text-xs">
          <button
            onClick={handleScanLocal}
            disabled={scanningLocal}
            className="pro-button-secondary px-3.5 py-2 uppercase flex items-center gap-1.5"
          >
            <Radio className={`w-3.5 h-3.5 ${scanningLocal ? 'animate-pulse text-white' : ''}`} />
            <span>{scanningLocal ? 'Scanning...' : 'Detect Local LLMs'}</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="pro-button-primary px-4 py-2 uppercase flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Target</span>
          </button>
        </div>
      </div>

      {/* Discovered Models Banner */}
      {discoveredModels.length > 0 && (
        <div className="p-4 rounded-xl bg-stark-950 border border-charcoal-700 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white uppercase">
              <Zap className="w-4 h-4 text-white" />
              <span>Discovered Local Inference Nodes ({discoveredModels.length})</span>
            </div>
            <button
              onClick={() => setDiscoveredModels([])}
              className="text-[11px] text-charcoal-400 hover:text-white"
            >
              [Dismiss]
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {discoveredModels.map((disc, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-black border border-charcoal-800 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-white">{disc.engine}</p>
                  <p className="text-[11px] text-charcoal-400 mt-0.5">{disc.endpoint}</p>
                  <p className="text-[11px] text-charcoal-300 mt-1">
                    Models: {disc.models?.join(', ') || 'Default'}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleAddDiscovered(
                      disc.engine,
                      disc.models?.[0] || 'default-model',
                      disc.endpoint
                    )
                  }
                  className="pro-button-primary px-3 py-1 text-xs"
                >
                  Import
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="max-w-md relative font-mono text-xs">
        <Search className="w-4 h-4 text-charcoal-500 absolute left-3.5 top-2.5" />
        <input
          type="text"
          placeholder="Filter targets by name or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-stark-950 border border-charcoal-800 rounded-lg pl-10 pr-4 py-2 text-white placeholder-charcoal-500 focus:outline-none focus:border-white transition-colors"
        />
      </div>

      {/* Target Grid */}
      {loading ? (
        <LoadingSpinner size="lg" label="Loading target models..." />
      ) : filteredTargets.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="No targets registered"
          description="Register your first target model to begin automated security testing."
          action={{
            label: 'Add Target',
            onClick: () => setIsModalOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTargets.map((target) => {
            const pingInfo = pingStates[target.id];

            return (
              <div
                key={target.id}
                className="p-5 rounded-xl bg-stark-950 border border-charcoal-800 hover:border-charcoal-600 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight font-mono">{target.name}</h3>
                    {getTypeBadge(target.target_type)}
                  </div>
                  <p className="text-xs text-charcoal-300 line-clamp-2 leading-relaxed">
                    {target.description || 'Configured AI target model.'}
                  </p>

                  {target.endpoint && (
                    <div className="p-2 rounded bg-black border border-charcoal-800 font-mono text-[11px] text-charcoal-400 truncate">
                      {target.endpoint}
                    </div>
                  )}

                  {/* Ping latency status */}
                  {pingInfo && (
                    <div className="text-xs font-mono pt-1">
                      {pingInfo.pinging ? (
                        <span className="text-charcoal-400 flex items-center gap-1.5 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin text-white" /> Probing latency...
                        </span>
                      ) : pingInfo.is_online ? (
                        <span className="text-white font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
                          Online ({pingInfo.latency_ms}ms)
                        </span>
                      ) : (
                        <span className="text-charcoal-400 flex items-center gap-1">
                          Connection Timeout
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-charcoal-800 flex items-center justify-between font-mono text-xs">
                  <span className="text-[11px] text-charcoal-400">
                    {formatDate(target.created_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePing(target.id)}
                      disabled={pingInfo?.pinging}
                      className="px-2.5 py-1 rounded bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 border border-charcoal-700 transition"
                    >
                      Ping
                    </button>
                    <button
                      onClick={(e) => handleDelete(target.id, e)}
                      className="p-1 rounded text-charcoal-500 hover:text-white transition"
                      title="Delete target"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        navigate('/assessments/new', { state: { targetId: target.id } })
                      }
                      className="pro-button-primary px-3 py-1 flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-black stroke-black" />
                      <span>Scan</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Target Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Target Model"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-white font-bold mb-1">TARGET NAME *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Customer Copilot API"
              className="w-full bg-black border border-charcoal-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white text-xs"
            />
          </div>

          <div>
            <label className="block text-white font-bold mb-1">TARGET TYPE *</label>
            <select
              value={formData.target_type}
              onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
              className="w-full bg-black border border-charcoal-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white text-xs"
            >
              <option value="simulated_vulnerable">Simulated Target (Baseline Vulnerable)</option>
              <option value="simulated_protected">Simulated Target (Hardened / Guarded)</option>
              <option value="http_api">External HTTP Endpoint</option>
              <option value="local_model">Local Model (Ollama / LM Studio)</option>
            </select>
          </div>

          {(formData.target_type === 'http_api' || formData.target_type === 'local_model') && (
            <div>
              <label className="block text-white font-bold mb-1">ENDPOINT URL *</label>
              <input
                type="text"
                required
                value={formData.endpoint || ''}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                placeholder={formData.target_type === 'local_model' ? 'http://127.0.0.1:11434' : 'https://api.internal/v1/chat/completions'}
                className="w-full bg-black border border-charcoal-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white text-xs"
              />
            </div>
          )}

          <div>
            <label className="block text-white font-bold mb-1">DESCRIPTION</label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="System prompt context, model architecture..."
              className="w-full bg-black border border-charcoal-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-charcoal-700 text-charcoal-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="pro-button-primary px-4 py-1.5 text-xs disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Target'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Targets;
