
import React, { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Activity, AlertCircle } from 'lucide-react';
import { TimerMode } from '../types';

interface TimerBoxProps {
  label: string;
  seconds: number;
  totalDuration: number;
  isRunning: boolean;
  mode: TimerMode;
  alertPoints: number[];
  onToggle: () => void;
  onReset: () => void;
  onToggleMode?: () => void;
  isLarge?: boolean;
  accentColor: string;
  customSound?: string;
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
  const absSeconds = Math.abs(totalSeconds);
  const mins = Math.floor(absSeconds / 60);
  const secs = Math.floor(absSeconds % 60);
  const cents = Math.floor((absSeconds % 1) * 100);
  
  return {
    main: `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
    cents: cents.toString().padStart(2, '0')
  };
};

export const TimerBox: React.FC<TimerBoxProps> = ({ 
  label, seconds, totalDuration, isRunning, mode, alertPoints, onToggle, onReset, onToggleMode, isLarge = true, accentColor, customSound 
}) => {
  const prevIsRunning = useRef(isRunning);
  const prevSeconds = useRef(seconds);
  const triggeredAlerts = useRef<Set<number>>(new Set());
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (customSound) {
      customAudioRef.current = new Audio(customSound);
    } else {
      customAudioRef.current = null;
    }
  }, [customSound]);

  const triggerAlert = () => {
    if (customAudioRef.current) {
      customAudioRef.current.currentTime = 0;
      customAudioRef.current.play().catch(console.error);
    } else {
      playTone(880, 'sine', 0.4, 0.15);
    }
  };

  const isCountdown = mode === 'countdown';
  const isTimeUp = isCountdown && seconds <= 0;

  useEffect(() => {
    if (!prevIsRunning.current && isRunning) {
      playTone(660, 'sine', 0.05, 0.05); 
    }
    prevIsRunning.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;

    // 檢查鳴鈴點
    alertPoints.forEach(point => {
      if (isCountdown) {
        // 倒數模式：向下穿越鳴鈴點
        if (prevSeconds.current > point && seconds <= point && !triggeredAlerts.current.has(point)) {
          triggerAlert();
          triggeredAlerts.current.add(point);
        }
      } else {
        // 秒錶模式：向上穿越鳴鈴點
        if (prevSeconds.current < point && seconds >= point && !triggeredAlerts.current.has(point)) {
          triggerAlert();
          triggeredAlerts.current.add(point);
        }
      }
    });

    // 倒數結束自動鳴鈴（若未在鳴鈴點設置）
    if (isCountdown && prevSeconds.current > 0 && seconds <= 0 && !triggeredAlerts.current.has(0)) {
       triggerAlert();
       triggeredAlerts.current.add(0);
    }

    prevSeconds.current = seconds;
  }, [seconds, isCountdown, isRunning, alertPoints]);

  useEffect(() => {
    // 當時間重置（秒錶變小或倒數變大）時，重置已觸發標記
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

  return (
    <div 
      className={`flex flex-col items-center ${isLarge ? 'p-12' : 'p-8'} glass-panel rounded-[3.5rem] transition-all duration-700 relative overflow-hidden group ${isRunning ? 'timer-active' : ''}`}
      style={{ 
        '--accent-glow': isTimeUp ? '#ef444444' : `${accentColor}33`,
        borderColor: isRunning ? accentColor : 'rgba(255,255,255,0.1)',
        transform: isRunning ? 'scale(1.02)' : 'scale(1)'
      } as React.CSSProperties}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleMode?.(); }}
        className="absolute top-8 right-10 flex items-center gap-2.5 opacity-80 hover:opacity-100 hover:scale-105 transition-all bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/10 z-20 shadow-xl"
        title="點擊切換 倒數/秒錶 模式"
      >
        {isCountdown ? <TimerIcon size={14} className="text-emerald-400"/> : <Activity size={14} className="text-blue-400 animate-pulse"/>}
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
          {isCountdown ? 'Countdown' : 'Stopwatch'}
        </span>
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isRunning ? accentColor : '#475569' }}></div>
        <span className="text-slate-500 text-[11px] font-black uppercase tracking-[0.5em]">{label}</span>
      </div>
      
      <div className="relative mb-12 flex items-baseline justify-center">
        <div className={`font-mono leading-none ${isLarge ? 'text-[10rem]' : 'text-8xl'} digital-ghost`}>
          88:88<span className="text-4xl">.88</span>
        </div>
        
        <div 
          className={`font-mono leading-none ${isLarge ? 'text-[10rem]' : 'text-8xl'} transition-all duration-200 tabular-nums font-black`}
          style={{ 
            color: isTimeUp ? '#ef4444' : (isRunning ? '#fff' : '#94a3b8'),
            textShadow: isRunning ? `0 0 30px ${accentColor}55` : 'none'
          }}
        >
          {timeParts.main}
        </div>
        
        <div 
          className={`font-mono font-bold ml-2 ${isLarge ? 'text-5xl' : 'text-3xl'} tabular-nums transition-opacity duration-300`}
          style={{ color: isTimeUp ? '#ef4444' : (isRunning ? accentColor : '#64748b'), opacity: isRunning || !isCountdown ? 1 : 0.4 }}
        >
          .{timeParts.cents}
        </div>

        {isTimeUp && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 animate-bounce">
            <AlertCircle size={14} className="text-red-500" />
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">時間終了</span>
          </div>
        )}
      </div>

      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-12 relative border border-white/5">
        <div 
          className={`h-full transition-all duration-300 ease-out`}
          style={{ 
            width: `${percentage}%`, 
            background: isTimeUp ? 'linear-gradient(90deg, #b91c1c, #ef4444)' : `linear-gradient(90deg, ${isCountdown ? 'transparent' : accentColor}, ${isCountdown ? accentColor : 'transparent'})`,
            boxShadow: isRunning ? `0 0 15px ${accentColor}aa` : 'none',
            transform: isCountdown ? 'none' : 'rotate(180deg)' // 秒錶模式讓進度條反向增長或維持視覺慣性
          }}
        />
      </div>

      <div className="flex gap-10">
        <button 
          onClick={onToggle}
          className="group/btn relative p-8 rounded-[2rem] transition-all active:scale-90 shadow-2xl"
          style={{ 
            backgroundColor: isRunning ? '#f59e0b11' : `${accentColor}11`, 
            color: isRunning ? '#f59e0b' : accentColor,
            border: `1px solid ${isRunning ? '#f59e0b22' : `${accentColor}22`}`
          }}
        >
          <div className="absolute inset-0 rounded-[2rem] bg-current opacity-0 group-hover/btn:opacity-5 transition-opacity"></div>
          {isRunning ? <Pause size={42} fill="currentColor" /> : <Play size={42} fill="currentColor" />}
        </button>
        
        <button 
          onClick={() => { triggeredAlerts.current.clear(); onReset(); }}
          className="group/reset p-8 rounded-[2rem] bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 border border-white/5 transition-all active:scale-90"
        >
          <RotateCcw size={42} className="group-hover/reset:rotate-[-45deg] transition-transform" />
        </button>
      </div>
    </div>
  );
};
