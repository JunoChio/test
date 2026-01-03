import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Activity, Plus, Minus, Check, AlertTriangle, ShieldAlert } from 'lucide-react';
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
  isLightMode?: boolean;
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
  label, seconds, totalDuration, overtimeThresholdSeconds, isRunning, mode, alertPoints, foulCount, onUpdateFoul, onToggle, onReset, onCompensate, onToggleMode, isLarge = true, accentColor, customSound, isMute = false, isLightMode = false
}) => {
  const prevIsRunning = useRef(isRunning);
  const prevSeconds = useRef(seconds);
  const triggeredAlerts = useRef<Set<number>>(new Set());
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const [isCustomCompOpen, setIsCustomCompOpen] = useState(false);
  const [customCompValue, setCustomCompValue] = useState("5");
  const [isSubtractMode, setIsSubtractMode] = useState(false);

  // 淺色模式下背景更白，邊框更深
  const glassPanelClass = isLightMode ? 'bg-white/90 border-slate-300 shadow-2xl' : 'bg-slate-900/40 border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]';
  const textColor = isLightMode ? 'text-black' : 'text-white';
  const subTextColor = isLightMode ? 'text-slate-600' : 'text-slate-400';

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
    if (isCountdown) { if (seconds > prevSeconds.current + 1) triggeredAlerts.current.clear(); }
    else { if (seconds < prevSeconds.current - 1) triggeredAlerts.current.clear(); }
    prevSeconds.current = seconds;
  }, [seconds, isCountdown]);

  const percentage = isCountdown 
    ? Math.max(0, Math.min(100, (seconds / totalDuration) * 100))
    : Math.min(100, (seconds / totalDuration) * 100);

  const timeParts = formatTimeParts(seconds);

  return (
    <div 
      className={`flex flex-col items-center ${isLarge ? 'p-12' : 'p-8'} glass-panel rounded-[3.5rem] transition-all duration-700 relative overflow-hidden group ${isRunning ? 'timer-active' : ''} ${glassPanelClass}`}
      style={{ 
        '--accent-glow': isOvertime ? '#ef444466' : (isGracePeriod ? '#f59e0b44' : `${accentColor}33`),
        borderColor: isOvertime ? '#ef4444' : (isGracePeriod ? '#f59e0b' : (isRunning ? accentColor : (isLightMode ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)'))),
        transform: isRunning ? 'scale(1.02)' : 'scale(1)'
      } as React.CSSProperties}
    >
      <div className="absolute top-8 left-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 max-w-[220px]">
        <div className="flex gap-2">
          <button onClick={() => onCompensate(10)} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/20 text-[10px] font-black text-emerald-600 transition-all flex items-center gap-1"><Plus size={10} /> 10秒</button>
          <button onClick={() => onCompensate(-10)} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/30 border border-red-500/20 text-[10px] font-black text-red-600 transition-all flex items-center gap-1"><Minus size={10} /> 10秒</button>
        </div>
        <button onClick={() => setIsCustomCompOpen(!isCustomCompOpen)} className={`px-3 py-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 text-[10px] font-black ${isCustomCompOpen ? 'bg-slate-900 text-white' : (isLightMode ? 'bg-slate-200 border-slate-300 text-slate-700' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white')}`}>手動調整</button>
      </div>

      <div className="absolute bottom-8 right-10 flex flex-col items-center gap-1.5 group/foul transition-all">
        <span className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all duration-300 ${foulCount > 0 ? 'text-red-500/80' : 'text-slate-400 group-hover/foul:text-slate-600'}`}>犯規數</span>
        <div className={`flex items-center border p-1.5 rounded-2xl shadow-xl backdrop-blur-md transition-all ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-white/5 border-white/10'}`}>
          <button onClick={() => onUpdateFoul(-1)} className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-lg transition-all active:scale-90"><Minus size={14}/></button>
          <span className={`px-2.5 text-center text-sm font-black transition-all tabular-nums ${foulCount > 0 ? 'text-red-500 scale-110' : subTextColor}`}>{foulCount}</span>
          <button onClick={() => onUpdateFoul(1)} className="p-1.5 hover:bg-emerald-500/20 text-slate-500 hover:text-emerald-500 rounded-lg transition-all active:scale-90"><Plus size={14}/></button>
        </div>
      </div>

      <button onClick={(e) => { e.stopPropagation(); onToggleMode?.(); }} className={`absolute top-8 right-10 flex items-center gap-2.5 opacity-80 hover:opacity-100 hover:scale-105 transition-all px-4 py-2 rounded-xl border z-20 shadow-xl ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-white/10 border-white/10'}`}>
        {isCountdown ? <TimerIcon size={14} className="text-emerald-600"/> : <Activity size={14} className="text-blue-600 animate-pulse"/>}
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${textColor}`}>{isCountdown ? '倒計時' : '秒錶'}</span>
      </button>

      {/* 辯位標籤：在淺色模式下使用深色背景增強對比度 */}
      <div className="flex flex-col items-center mb-10 w-full">
        <div className={`px-10 py-3 rounded-2xl shadow-lg border transition-all flex items-center justify-center gap-4 ${isLightMode ? 'bg-black border-black scale-110 shadow-black/20' : 'bg-white/10 border-white/10'}`}>
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: isOvertime ? '#ef4444' : (isGracePeriod ? '#f59e0b' : (isRunning ? accentColor : '#94a3b8')) }}></div>
          <span className="text-4xl font-black uppercase tracking-[0.25em] text-white">{label}</span>
        </div>
      </div>
      
      <div className="relative mb-12 flex items-baseline justify-center">
        <div className={`font-mono leading-none ${isLarge ? 'text-[10rem]' : 'text-8xl'} digital-ghost ${isLightMode ? 'opacity-[0.05]' : 'opacity-[0.02]'}`}>
          {timeParts.isNegative ? '-' : ''}88:88<span className="text-4xl">.88</span>
        </div>
        <div 
          className={`font-mono leading-none ${isLarge ? 'text-[10rem]' : 'text-8xl'} transition-all duration-200 tabular-nums font-black`}
          style={{ 
            color: isOvertime ? '#ef4444' : (isGracePeriod ? '#f59e0b' : (isLightMode ? '#000000' : (isRunning ? '#ffffff' : '#475569'))),
            textShadow: isOvertime ? `0 0 40px #ef444499` : (isGracePeriod ? `0 0 40px #f59e0b99` : (isRunning && !isLightMode ? `0 0 30px ${accentColor}33` : 'none'))
          }}
        >
          {timeParts.main}
        </div>
        <div className={`font-mono font-bold ml-2 ${isLarge ? 'text-5xl' : 'text-3xl'} tabular-nums transition-opacity duration-300`} style={{ color: isOvertime ? '#ef4444' : (isGracePeriod ? '#f59e0b' : (isLightMode ? '#334155' : (isRunning ? accentColor : '#475569'))), opacity: isRunning || isOvertime || isGracePeriod ? 1 : 0.4 }}>.{timeParts.cents}</div>

        {(isOvertime || isGracePeriod) && (
          <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-2 rounded-full shadow-2xl ${isOvertime ? 'bg-red-600' : 'bg-amber-600'} animate-bounce`}>
            {isOvertime ? <AlertTriangle size={16} className="text-white" /> : <ShieldAlert size={16} className="text-white" />}
            <span className="text-xs font-black text-white uppercase tracking-widest">{isOvertime ? '超時' : '寬限期'}</span>
          </div>
        )}
      </div>

      <div className={`w-full h-3 rounded-full overflow-hidden mb-12 relative border ${isLightMode ? 'bg-slate-200 border-slate-300' : 'bg-white/5 border-white/5'}`}>
        <div className={`h-full transition-all duration-300 ease-out`} style={{ width: `${(isOvertime || isGracePeriod) ? 0 : percentage}%`, background: isOvertime ? '#ef4444' : (isGracePeriod ? '#f59e0b' : `linear-gradient(90deg, ${isCountdown ? 'transparent' : accentColor}, ${isCountdown ? accentColor : 'transparent'})`), boxShadow: isRunning ? `0 0 15px ${isOvertime ? '#ef4444' : (isGracePeriod ? '#f59e0b' : accentColor)}aa` : 'none', transform: isCountdown ? 'none' : 'rotate(180deg)' }} />
      </div>

      <div className="flex gap-10">
        <button onClick={onToggle} className="group/btn relative p-8 rounded-[2rem] transition-all active:scale-90 shadow-2xl" style={{ backgroundColor: isOvertime ? '#ef444422' : (isGracePeriod ? '#f59e0b22' : (isRunning ? '#f59e0b22' : `${accentColor}22`)), color: isOvertime ? '#ef4444' : (isGracePeriod ? '#f59e0b' : (isRunning ? '#f59e0b' : (isLightMode ? '#000' : accentColor))), border: `1px solid ${isOvertime ? '#ef444455' : (isGracePeriod ? '#f59e0b55' : (isRunning ? '#f59e0b44' : `${accentColor}44`))}` }}>
          {isRunning ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" />}
        </button>
        <button onClick={() => { triggeredAlerts.current.clear(); onReset(); }} className={`group/reset p-8 rounded-[2rem] border transition-all active:scale-90 ${isLightMode ? 'bg-slate-200 border-slate-300 text-slate-600 hover:text-black hover:bg-slate-300' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}><RotateCcw size={48} className="group-hover/reset:rotate-[-45deg] transition-transform" /></button>
      </div>
    </div>
  );
};