import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Trash2, Cpu } from 'lucide-react';
import { executeCliCommand } from '../../services/api';
import { sounds } from '../../utils/soundEffects';

interface TerminalEntry {
  type: 'input' | 'output' | 'error' | 'banner';
  text: string;
}

interface TacticalTerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TacticalTerminal: React.FC<TacticalTerminalProps> = ({ isOpen, onClose }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [entries, setEntries] = useState<TerminalEntry[]>([
    {
      type: 'banner',
      text: `
  ███████╗███████╗███╗   ██╗████████╗██████╗ ██╗██╗  ██╗   ██████╗ ███████╗
  ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██╔══██╗██║╚██╗██╔╝  ██╔═══██╗██╔════╝
  ███████╗█████╗  ██╔██╗ ██║   ██║   ██████╔╝██║ ╚███╔╝   ██║   ██║███████╗
  ╚════██║██╔══╝  ██║╚██╗██║   ██║   ██╔══██╗██║ ██╔██╗   ██║   ██║╚════██║
  ███████║███████╗██║ ╚████║   ██║   ██║  ██║██║██╔╝ ██╗  ╚██████╔╝███████║
  ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝   ╚═════╝ ╚══════╝
       [ AI RED-TEAMING & THREAT OPERATIONS OPERATING SYSTEM - PRO EDITION ]
Type 'help' to inspect operational directives or 'status' for kernel vitals.`,
    },
  ]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMatrixRain, setIsMatrixRain] = useState(false);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-scroll on new entries
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [entries, isOpen]);

  // Matrix digital rain effect (Monochrome Stark White / Charcoal)
  useEffect(() => {
    if (!isMatrixRain || !isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 400;

    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>+-*/=アァカサタナハマヤャラワ'.split('');
    const fontSize = 12;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);

    let animId: number;
    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ffffff';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = characters[Math.floor(Math.random() * characters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [isMatrixRain, isOpen]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = command.trim();
    if (!cmd) return;

    sounds.playKey();

    // Add to history
    setHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);

    if (cmd.toLowerCase() === 'clear') {
      sounds.playClick();
      setEntries([]);
      setCommand('');
      return;
    }

    if (cmd.toLowerCase() === 'matrix-rain') {
      setIsMatrixRain(!isMatrixRain);
      setEntries((prev) => [
        ...prev,
        { type: 'input', text: cmd },
        { type: 'output', text: `[+] Matrix digital rain mode ${!isMatrixRain ? 'ACTIVATED' : 'DEACTIVATED'}.` },
      ]);
      setCommand('');
      return;
    }

    setEntries((prev) => [...prev, { type: 'input', text: cmd }]);
    setCommand('');
    setLoading(true);

    try {
      const res = await executeCliCommand(cmd);
      if (res.output === '__CLEAR__') {
        setEntries([]);
      } else {
        if (res.status === 'success') {
          sounds.playLaser();
        } else {
          sounds.playAlert();
        }
        setEntries((prev) => [
          ...prev,
          {
            type: res.status === 'error' ? 'error' : 'output',
            text: res.output,
          },
        ]);
      }
    } catch (err: any) {
      sounds.playAlert();
      setEntries((prev) => [
        ...prev,
        {
          type: 'error',
          text: `[!] Command execution failed: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setCommand(history[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setCommand('');
      } else {
        setHistoryIndex(nextIndex);
        setCommand(history[nextIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-0 right-0 left-0 z-50 flex flex-col bg-black/98 border-t-2 border-charcoal-700 backdrop-blur-2xl transition-all duration-300 shadow-[0_-15px_40px_rgba(0,0,0,0.95)] ${
        isMaximized ? 'top-0 h-screen' : 'h-[460px]'
      }`}
    >
      {/* Matrix rain canvas background */}
      {isMatrixRain && (
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-15 z-0" />
      )}

      {/* Terminal Titlebar */}
      <div className="h-11 px-4 bg-[#0a0a0c] border-b border-[#222228] flex items-center justify-between z-10 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-charcoal-600 hover:bg-white cursor-pointer transition" onClick={onClose} />
            <span
              className="w-2.5 h-2.5 rounded-full bg-charcoal-500 hover:bg-white cursor-pointer transition"
              onClick={() => setIsMaximized(!isMaximized)}
            />
            <span
              className="w-2.5 h-2.5 rounded-full bg-charcoal-400 hover:bg-white cursor-pointer transition"
              onClick={() => setIsMatrixRain(!isMatrixRain)}
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-white">
            <TerminalIcon className="w-3.5 h-3.5" />
            <span className="font-bold tracking-wider">SENTRIX TACTICAL CLI</span>
            <span className="text-charcoal-600">•</span>
            <span className="text-[11px] text-charcoal-400">pts/0 [ONLINE]</span>
          </div>
        </div>

        {/* Quick Directive Pills */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono">
          <button
            onClick={() => {
              setCommand('status');
              inputRef.current?.focus();
            }}
            className="px-2 py-0.5 rounded bg-charcoal-900 hover:bg-charcoal-800 text-charcoal-300 hover:text-white border border-charcoal-700 transition"
          >
            status
          </button>
          <button
            onClick={() => {
              setCommand('targets');
              inputRef.current?.focus();
            }}
            className="px-2 py-0.5 rounded bg-charcoal-900 hover:bg-charcoal-800 text-charcoal-300 hover:text-white border border-charcoal-700 transition"
          >
            targets
          </button>
          <button
            onClick={() => {
              setCommand('assess 1');
              inputRef.current?.focus();
            }}
            className="px-2 py-0.5 rounded bg-charcoal-900 hover:bg-charcoal-800 text-charcoal-300 hover:text-white border border-charcoal-700 transition"
          >
            assess 1
          </button>
          <button
            onClick={() => {
              setCommand('matrix');
              inputRef.current?.focus();
            }}
            className="px-2 py-0.5 rounded bg-charcoal-900 hover:bg-charcoal-800 text-charcoal-300 hover:text-white border border-charcoal-700 transition"
          >
            matrix
          </button>
          <button
            onClick={() => setIsMatrixRain(!isMatrixRain)}
            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border transition font-mono ${
              isMatrixRain
                ? 'bg-white text-black border-white'
                : 'bg-charcoal-900 text-charcoal-400 border-charcoal-700 hover:text-white'
            }`}
          >
            Rain {isMatrixRain ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setEntries([])}
            className="p-1 text-charcoal-400 hover:text-white transition"
            title="Clear Terminal Buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 text-charcoal-400 hover:text-white transition"
            title={isMaximized ? 'Restore Size' : 'Maximize Terminal'}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onClose} className="p-1 text-charcoal-400 hover:text-white transition" title="Close Terminal">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Output Log Area */}
      <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2 relative z-10 select-text">
        {entries.map((entry, idx) => (
          <div key={idx} className="leading-relaxed">
            {entry.type === 'input' && (
              <div className="flex items-center gap-2 text-white">
                <span className="font-bold text-white">root@sentrix-os:~$</span>
                <span className="text-charcoal-200">{entry.text}</span>
              </div>
            )}
            {entry.type === 'output' && (
              <pre className="text-charcoal-300 whitespace-pre-wrap font-mono pl-4 border-l border-charcoal-700 my-1 py-0.5 bg-black/40 rounded">
                {entry.text}
              </pre>
            )}
            {entry.type === 'error' && (
              <pre className="text-white font-bold whitespace-pre-wrap font-mono pl-4 border-l-2 border-white my-1 py-0.5 bg-charcoal-900 rounded">
                {entry.text}
              </pre>
            )}
            {entry.type === 'banner' && (
              <pre className="text-white whitespace-pre font-mono text-[11px] leading-tight select-none">
                {entry.text}
              </pre>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-white font-mono text-xs animate-pulse pl-4">
            <Cpu className="w-3.5 h-3.5 animate-spin" />
            <span>SENTRIX KERNEL EXECUTING DIRECTIVE...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Prompt Input Line */}
      <form onSubmit={handleCommand} className="p-3 bg-[#0a0a0c] border-t border-[#222228] flex items-center gap-2 z-10">
        <span className="text-white font-mono text-xs font-bold shrink-0">root@sentrix-os:~$</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type 'help', 'status', 'assess 1', or 'mutate <objective>'..."
          className="flex-1 bg-transparent font-mono text-xs text-white placeholder-charcoal-500 focus:outline-none"
          autoFocus
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={loading || !command.trim()}
          className="p-1 px-3 rounded bg-white hover:bg-charcoal-200 text-black text-xs font-mono font-bold disabled:opacity-30 transition"
        >
          EXEC
        </button>
      </form>
    </div>
  );
};

export default TacticalTerminal;
