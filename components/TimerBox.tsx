
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Activity, Plus, Minus, Check, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { TimerMode } from '../types';

interface TimerBoxProps {
  label: string;
  seconds: number;
  totalDuration: number;
  overtimeThresholdSeconds: number;
  isRunning: boolean;
  mode: TimerMode;
  alertPoints: number[];
  foulCount: number;
  onUpdateFoul: (delta: number) => void;
  onToggle: () => void;
  onReset: () => void;
  onCompensate: (seconds: number) => void;
  onToggleMode?: () => void;
  isLarge?: boolean;
  accentColor: string;
  customSound?: string;
  isMute?: boolean;
}

const playTone = (freq: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

const formatTimeParts = (totalSeconds: number) => {
  const isNegative = totalSeconds < 0 && Math.abs(totalSeconds) >= 0.01;
  const absSeconds = Math.abs(totalSeconds);
  const mins = Math.floor(absSeconds / 60);
  const secs = Math.floor(absSeconds % 60);
  const cents = Math.floor((absSeconds % 1) * 100);
  
  return {
    isNegative,
    main: `${isNegative ? '-' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
    cents: cents.toString().padStart(2, '0')
  };
};

export const TimerBox: React.FC<TimerBoxProps> = ({ 
  label, seconds, totalDuration, overtimeThresholdSeconds, isRunning, mode, alertPoints, foulCount, onUpdateFoul, onToggle, onReset, onCompensate, onToggleMode, isLarge = true, accentColor, customSound, isMute = false
}) => {
  const prevIsRunning = useRef(isRunning);
  const prevSeconds = useRef(seconds);
  const triggeredAlerts = useRef<Set<number>>(new Set());
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const [isCustomCompOpen, setIsCustomCompOpen] = useState(false);
  const [customCompValue, setCustomCompValue] = useState("5");
  const [isSubtractMode, setIsSubtractMode] = useState(false);

  useEffect(() => {
    if (customSound) {
      customAudioRef.current = new Audio(customSound);
    } else {
      customAudioRef.current = null;
    }
  }, [customSound]);

  const triggerAlert = () => {
    if (isMute) return;
    if (customAudioRef.current) {
      customAudioRef.current.currentTime = 0;
      customAudioRef.current.play().catch(console.error);
    } else {
      playTone(880, 'sine', 0.4, 0.15);
    }
  };

  const isCountdown = mode === 'countdown';
  const isGracePeriod = isCountdown && seconds < 0 && seconds >= -overtimeThresholdSeconds;
  const isOvertime = isCountdown && seconds < -overtimeThresholdSeconds;

  useEffect(() => {
    if (!prevIsRunning.current && isRunning && !isMute) {
      playTone(660, 'sine', 0.05, 0.02); 
    }
    prevIsRunning.current = isRunning;
  }, [isRunning, isMute]);

  useEffect(() => {
    if (!isRunning) return;

    alertPoints.forEach(point => {
      if (isCountdown) {
        if (prevSeconds.current > point && seconds <= point && !triggeredAlerts.current.has(point)) {
          triggerAlert();
          triggeredAlerts.current.add(point);
        }
      } else {
        if (prevSeconds.current < point && seconds >= point && !triggeredAlerts.current.has(point)) {
          triggerAlert();
          triggeredAlerts.current.add(point);
        }
      }
    });

    if (isCountdown && prevSeconds.current > 0 && seconds <= 0 && !triggeredAlerts.current.has(0)) {
       triggerAlert();
       triggeredAlerts.current.add(0);
    }

    prevSeconds.current = seconds;
  }, [seconds, isCountdown, isRunning, alertPoints, isMute]);

  useEffect(() => {
    if (isCountdown) {
       if (seconds > prevSeconds.current + 1) triggeredAlerts.current.clear();
    } else {
       if (seconds < prevSeconds.current - 1) triggeredAlerts.current.clear();
    }
    prevSeconds.current = seconds;
  }, [seconds, isCountdown]);

  const percentage = isCountdown 
    ? Math.max(0, Math.min(100, (seconds / totalDuration) * 100))
    : Math.min(100, (seconds / totalDuration) * 100);

  const timeParts = formatTimeParts(seconds);

  const handleCustomCompSubmit = () => {
    const val = parseInt(customCompValue);
    if (!isNaN(val)) {
      onCompensate(isSubtractMode ? -val : val);
    }
    setIsCustomCompOpen(false);
  };

  return (
    <div 
      className={`flex flex-col items-center ${isLarge ? 'p-12' : 'p-8'} glass-panel rounded-[3.5rem] transition-all duration-700 relative overflow-hidden group ${isRunning ? 'timer-active' : ''}`}
      style={{ 
        '--accent-glow': isOvertime ? '#ef444466' : (isGracePeriod ? '#f59e0b44' : `${accentColor}33`),
        borderColor: isOvertime ? '#ef4444' : (isGracePeriod ? '#f59e0b' : (isRunning ? accentColor : 'rgba(255,255,255,0.1)')),
        transform: isRunning ? 'scale(1.02)' : 'scale(1)'
      } as React.CSSProperties}
    >
      <div className="absolute top-8 left-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 max-w-[220px]">
        <div className="flex gap-2">
          <button onClick={() => onCompensate(10)} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/20 text-[10px] font-black text-emerald-400 transition-all flex items-center gap-1"><Plus size={10} /> 10秒</button>
          <button onClick={() => onCompensate(-10)} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/30 border border-red-500/20 text-[10px] font-black text-red-400 transition-all flex items-center gap-1"><Minus size={10} /> 10秒</button>
        </div>
        <button onClick={() => setIsCustomCompOpen(!isCustomCompOpen)} className={`px-3 py-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 text-[10px] font-black ${isCustomCompOpen ? 'bg-white text-slate-900 border-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}>手動調整</button>
        {isCustomCompOpen && (
          <div className="flex flex-col gap-2 bg-slate-900/95 backdrop-blur-xl p-3 rounded-2xl border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2">
              <button onClick={() => setIsSubtractMode(!isSubtractMode)} className={`p-1.5 rounded-lg transition-all ${isSubtractMode ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>{isSubtractMode ? <Minus size={14} /> : <Plus size={14} />}</button>
              <input type="number" autoFocus value={customCompValue} onChange={(e) => setCustomCompValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCustomCompSubmit()} className="w-16 bg-black/40 rounded-lg px-2 py-1.5 text-xs text-white outline-none font-mono border border-white/10 focus:border-white/30" />
              <button onClick={handleCustomCompSubmit} className="p-1.5 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all"><Check size={14} /></button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 right-10 flex flex-col items-center gap-1.5 group/foul transition-all">
        <span className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all duration-300 ${foulCount > 0 ? 'text-red-500/80' : 'text-slate-600 group-hover/foul:text-slate-400'}`}>犯規數</span>
        <div className="flex items-center bg-white/5 border border-white/10 p-1.5 rounded-2xl shadow-xl backdrop-blur-md transition-all group-hover/foul:bg-white/10 group-hover/foul:border-white/20 group-hover/foul:scale-110">
          <button 
            onClick={() => onUpdateFoul(-1)} 
            className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover/foul:opacity-100 translate-x-2 group-hover/foul:translate-x-0 active:scale-90"
            title="減少犯規"
          >
            <Minus size={14}/>
          </button>
          <span className={`px-2.5 text-center text-sm font-black transition-all tabular-nums ${foulCount > 0 ? 'text-red-500 scale-110' : 'text-slate-500 opacity-40 group-hover/foul:opacity-100'}`}>
            {foulCount}
          </span>
          <button 
            onClick={() => onUpdateFoul(1)} 
            className="p-1.5 hover:bg-emerald-500/20 text-slate-500 hover:text-emerald-400 rounded-lg transition-all opacity-0 group-hover/foul:opacity-100 -translate-x-2 group-hover/foul:translate-x-0 active:scale-90"
            title="增加犯規"
          >
            <Plus size={14}/>
          </button>
        </div>
      </div>

      <button onClick={(e) => { e.stopPropagation(); onToggleMode?.(); }} className="absolute top-8 right-10 flex items-center gap-2.5 opacity-80 hover:opacity-100 hover:scale-105 transition-all bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/10 z-20 shadow-xl">
        {isCountdown ? <TimerIcon size={14} className="text-emerald-400"/> : <Activity size={14} className="text-blue-400 animate-pulse"/>}
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{isCountdown ? '倒計時' : '秒錶模式'}</span>
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isOvertime ? '#ef4444' : (isGracePeriod ? '#f59e0b' : (isRunning ? accentColor : '#475569')) }}></div>
        <span className="text-slate-500 text-[11px] font-black uppercase tracking-[0.5em]">{label}</span>
      </div>
      
      <div className="relative mb-12 flex items-baseline justify-center">
        <div className={`font-mono leading-none ${isLarge ? 'text-[10rem]' : 'text-8xl'} digital-ghost`}>
          {timeParts.isNegative ? '-' : ''}88:88<span className="text-4xl">.88</span>
        </div>
        <div 
          className={`font-mono leading-none ${isLarge ? 'text-[10rem]' : 'text-8xl'} transition-all duration-200 tabular-nums font-black`}
          style={{ 
            color: isOvertime ? '#ef4444' : (isGracePeriod ? '#f59e0b' : (isRunning ? '#fff' : '#94a3b8')),
            textShadow: isOvertime ? `0 0 40px #ef444499` : (isGracePeriod ? `0 0 40px #f59e0b99` : (isRunning ? `0 0 30px ${accentColor}55` : 'none'))
          }}
        >
          {timeParts.main}
        </div>
        <div className={`font-mono font-bold ml-2 ${isLarge ? 'text-5xl' : 'text-3xl'} tabular-nums transition-opacity duration-300`} style={{ color: isOvertime ? '#ef4444' : (isGracePeriod ? '#f59e0b' : (isRunning ? accentColor : '#64748b')), opacity: isRunning || isOvertime || isGracePeriod ? 1 : 0.4 }}>.{timeParts.cents}</div>

        {isOvertime && (
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 bg-red-500 rounded-full shadow-[0_0_20px_#ef4444aa]">
            <AlertTriangle size={14} className="text-white animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">超時</span>
          </div>
        )}
        {isGracePeriod && (
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 bg-amber-500 rounded-full shadow-[0_0_20px_#f59e0baa]">
            <ShieldAlert size={14} className="text-white animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">寬限</span>
          </div>
        )}
      </div>

      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-12 relative border border-white/5">
        <div className={`h-full transition-all duration-300 ease-out`} style={{ width: `${(isOvertime || isGracePeriod) ? 0 : percentage}%`, background: isOvertime ? '#ef4444' : (isGracePeriod ? '#f59e0b' : `linear-gradient(90deg, ${isCountdown ? 'transparent' : accentColor}, ${isCountdown ? accentColor : 'transparent'})`), boxShadow: isRunning ? `0 0 15px ${isOvertime ? '#ef4444' : (isGracePeriod ? '#f59e0b' : accentColor)}aa` : 'none', transform: isCountdown ? 'none' : 'rotate(180deg)' }} />
      </div>

      <div className="flex gap-10">
        <button onClick={onToggle} className="group/btn relative p-8 rounded-[2rem] transition-all active:scale-90 shadow-2xl" style={{ backgroundColor: isOvertime ? '#ef444411' : (isGracePeriod ? '#f59e0b11' : (isRunning ? '#f59e0b11' : `${accentColor}11`)), color: isOvertime ? '#ef4444' : (isGracePeriod ? '#f59e0b' : (isRunning ? '#f59e0b' : accentColor)), border: `1px solid ${isOvertime ? '#ef444433' : (isGracePeriod ? '#f59e0b33' : (isRunning ? '#f59e0b22' : `${accentColor}22`))}` }}>
          <div className="absolute inset-0 rounded-[2rem] bg-current opacity-0 group-hover/btn:opacity-5 transition-opacity"></div>
          {isRunning ? <Pause size={42} fill="currentColor" /> : <Play size={42} fill="currentColor" />}
        </button>
        <button onClick={() => { triggeredAlerts.current.clear(); onReset(); }} className="group/reset p-8 rounded-[2rem] bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 border border-white/5 transition-all active:scale-90"><RotateCcw size={42} className="group-hover/reset:rotate-[-45deg] transition-transform" /></button>
      </div>
    </div>
  );
};
