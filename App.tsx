import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, ChevronLeft, ChevronRight, ShieldAlert, Maximize2, Minimize2, Pause, RotateCcw, Activity, BellRing, Bell, BellOff, PlusCircle, Layout, Calendar, Clock } from 'lucide-react';
import { DebatePhase, PhaseType, AppearanceConfig, ThemeType, TimerMode, HotkeyConfig } from './types';
import { TimerBox } from './components/TimerBox';
import { ConfigModal } from './components/ConfigModal';

const DEFAULT_HOTKEYS: HotkeyConfig = {
  pauseAll: 'p',
  resetAll: 'r',
  nextPhase: 'ArrowRight',
  prevPhase: 'ArrowLeft',
  toggleTimer1: '1',
  toggleTimer2: '2',
  toggleTimer3: '3',
  manualBell: 'b' 
};

const DEFAULT_PHASES: DebatePhase[] = [
  {
    id: '1',
    name: '申論環節',
    type: PhaseType.STANDARD,
    timers: [
      { id: 't1', label: '正方一辯', durationSeconds: 180, remainingSeconds: 180, isRunning: false, mode: 'countdown', alertPoints: [30, 0], overtimeThresholdSeconds: 15, foulCount: 0 },
      { id: 't2', label: '反方一辯', durationSeconds: 180, remainingSeconds: 180, isRunning: false, mode: 'countdown', alertPoints: [30, 0], overtimeThresholdSeconds: 15, foulCount: 0 },
    ]
  },
  {
    id: '2',
    name: '自由辯論',
    type: PhaseType.FREE,
    timers: [
      { id: 't3', label: '正方團隊', durationSeconds: 240, remainingSeconds: 240, isRunning: false, mode: 'countdown', alertPoints: [30, 0], overtimeThresholdSeconds: 15, foulCount: 0 },
      { id: 't4', label: '反方團隊', durationSeconds: 240, remainingSeconds: 240, isRunning: false, mode: 'countdown', alertPoints: [30, 0], overtimeThresholdSeconds: 15, foulCount: 0 },
    ]
  }
];

const DEFAULT_APPEARANCE: AppearanceConfig = {
  appTitle: 'SuperDebater Pro',
  appSubtitle: '',
  iconText: '⚔️',
  theme: 'minimalist-light',
  accentColor: '#10b981',
  customBgColor: '#f8fafc',
  hotkeys: DEFAULT_HOTKEYS,
  showInfoBar: true,
  isMute: false
};

const THEME_COLORS: Record<ThemeType, string> = {
  midnight: '#020617',
  aurora: '#0a0a23',
  ocean: '#021024',
  sunset: '#1a0d02',
  'minimalist-light': '#f8fafc',
  ivory: '#fdfbf7',
  'nordic-frost': '#e2e8f0',
  custom: '#0f172a'
};

// 亮度檢測函數：判定顏色是否為淺色
const isColorLight = (hex: string) => {
  if (!hex) return false;
  const color = hex.replace('#', '');
  if (color.length !== 6) return false;
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
};

const App: React.FC = () => {
  const [phases, setPhases] = useState<DebatePhase[]>(DEFAULT_PHASES);
  const [appearance, setAppearance] = useState<AppearanceConfig>(DEFAULT_APPEARANCE);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentPhase = phases[currentPhaseIndex];

  // 計算當前配色模式
  const currentBgColor = appearance.theme === 'custom' ? (appearance.customBgColor || '#0f172a') : THEME_COLORS[appearance.theme];
  const isLightMode = isColorLight(currentBgColor);

  const textColor = isLightMode ? 'text-slate-900' : 'text-white';
  const subTextColor = isLightMode ? 'text-slate-500' : 'text-slate-400';
  
  const overlayColor = isLightMode ? 'rgba(255, 255, 255, 0.75)' : 'rgba(2, 6, 23, 0.7)';
  const backgroundImageStyle = appearance.backgroundImage 
    ? `linear-gradient(${overlayColor}, ${overlayColor}), url(${appearance.backgroundImage})` 
    : 'none';

  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleFsChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      clearInterval(clockTimer);
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  const playBellSound = useCallback(() => {
    if (appearance.isMute) return; 
    if (appearance.customSound) {
      const audio = new Audio(appearance.customSound);
      audio.play().catch(console.error);
    } else {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1320, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    }
  }, [appearance.customSound, appearance.isMute]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const compensateTimer = (timerId: string, addSeconds: number) => {
    setPhases(prevPhases => prevPhases.map((phase, pIdx) => {
      if (pIdx !== currentPhaseIndex) return phase;
      return {
        ...phase,
        timers: phase.timers.map(timer => {
          if (timer.id !== timerId) return timer;
          const nextRemaining = timer.remainingSeconds + addSeconds;
          return { ...timer, remainingSeconds: nextRemaining };
        })
      };
    }));
  };

  const updateFoulCount = (timerId: string, delta: number) => {
    setPhases(prevPhases => prevPhases.map((phase, pIdx) => {
      if (pIdx !== currentPhaseIndex) return phase;
      return {
        ...phase,
        timers: phase.timers.map(timer => {
          if (timer.id !== timerId) return timer;
          return { ...timer, foulCount: Math.max(0, timer.foulCount + delta) };
        })
      };
    }));
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setPhases(prevPhases => prevPhases.map((phase, pIdx) => {
        if (pIdx !== currentPhaseIndex) return phase;
        return {
          ...phase,
          timers: phase.timers.map(timer => {
            if (!timer.isRunning) return timer;
            const step = 0.01;
            if (timer.mode === 'countdown') {
              const nextValue = timer.remainingSeconds - step;
              return { ...timer, remainingSeconds: nextValue };
            } else {
              return { ...timer, remainingSeconds: timer.remainingSeconds + step };
            }
          })
        };
      }));
    }, 10);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentPhaseIndex]);

  const pauseAllTimers = useCallback(() => {
    setPhases(prev => prev.map((p, idx) => idx !== currentPhaseIndex ? p : { ...p, timers: p.timers.map(t => ({ ...t, isRunning: false })) }));
  }, [currentPhaseIndex]);

  const resetAllTimers = useCallback(() => {
    setPhases(prev => prev.map((p, idx) => idx !== currentPhaseIndex ? p : { ...p, timers: p.timers.map(t => ({ ...t, isRunning: false, remainingSeconds: t.mode === 'countdown' ? t.durationSeconds : 0, foulCount: 0 })) }));
  }, [currentPhaseIndex]);

  const nextPhase = useCallback(() => {
    if (currentPhaseIndex < phases.length - 1) { setCurrentPhaseIndex(prev => prev + 1); }
  }, [currentPhaseIndex, phases.length]);

  const prevPhase = useCallback(() => {
    if (currentPhaseIndex > 0) { setCurrentPhaseIndex(prev => prev - 1); }
  }, [currentPhaseIndex]);

  const toggleTimer = useCallback((timerId: string) => {
    setPhases(prevPhases => prevPhases.map((phase, pIdx) => {
      if (pIdx !== currentPhaseIndex) return phase;
      const isFreeDebate = phase.type === PhaseType.FREE;
      return {
        ...phase,
        timers: phase.timers.map(timer => {
          if (timer.id === timerId) return { ...timer, isRunning: !timer.isRunning };
          if (isFreeDebate) {
            const target = phase.timers.find(t => t.id === timerId);
            if (target && !target.isRunning) return { ...timer, isRunning: false };
          }
          return timer;
        })
      };
    }));
  }, [currentPhaseIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isConfigOpen || !currentPhase) return;
      const key = e.key;
      const h = appearance.hotkeys;
      if (key === h.pauseAll) pauseAllTimers();
      else if (key === h.resetAll) resetAllTimers();
      else if (key === h.manualBell) playBellSound();
      else if (key === h.nextPhase) nextPhase();
      else if (key === h.prevPhase) prevPhase();
      else if (key === h.toggleTimer1 && currentPhase.timers[0]) toggleTimer(currentPhase.timers[0].id);
      else if (key === h.toggleTimer2 && currentPhase.timers[1]) toggleTimer(currentPhase.timers[1].id);
      else if (key === h.toggleTimer3 && currentPhase.timers[2]) toggleTimer(currentPhase.timers[2].id);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appearance.hotkeys, isConfigOpen, pauseAllTimers, resetAllTimers, playBellSound, nextPhase, prevPhase, toggleTimer, currentPhase]);

  const isEmpty = phases.length === 0;

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return date.toLocaleDateString('zh-TW', options);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="min-h-screen flex flex-col relative transition-all duration-1000 bg-cover bg-center" style={{ backgroundColor: currentBgColor, backgroundImage: backgroundImageStyle }}>
      
      {!isEmpty && !isFullScreen && (
        <>
          <button 
            onClick={prevPhase} 
            disabled={currentPhaseIndex === 0} 
            className={`fixed left-8 top-1/2 -translate-y-1/2 z-40 p-6 glass-panel rounded-full hover:bg-white/10 transition-all disabled:opacity-0 active:scale-90 group ${isLightMode ? 'border-slate-300 shadow-2xl bg-white/50' : 'border-white/20'} shadow-2xl`}
            title="上一個環節"
          >
            <ChevronLeft size={48} className={isLightMode ? 'text-slate-800' : 'text-white'} />
          </button>
          <button 
            onClick={nextPhase} 
            disabled={currentPhaseIndex === phases.length - 1} 
            className={`fixed right-8 top-1/2 -translate-y-1/2 z-40 p-6 glass-panel rounded-full hover:bg-white/10 transition-all disabled:opacity-0 active:scale-90 group ${isLightMode ? 'border-slate-300 shadow-2xl bg-white/50' : 'border-white/20'} shadow-2xl`}
            title="下一個環節"
          >
            <ChevronRight size={48} className={isLightMode ? 'text-slate-800' : 'text-white'} />
          </button>
        </>
      )}

      {!isFullScreen && (
        <header className="z-20 px-12 py-8 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className={`w-16 h-16 rounded-[1.5rem] shadow-2xl flex items-center justify-center text-3xl glass-panel ${isLightMode ? 'bg-white/80' : ''}`} style={{ color: appearance.accentColor }}>{appearance.iconText}</div>
            <div className="flex flex-col">
              <h1 className={`text-3xl font-black italic tracking-tighter uppercase ${textColor}`}>{appearance.appTitle}</h1>
            </div>
          </div>
          {appearance.showInfoBar && !isEmpty && (
            <div className={`flex items-center gap-6 px-8 py-3.5 glass-panel rounded-2xl border ${isLightMode ? 'border-slate-200 shadow-xl bg-white/60' : 'border-white/10 shadow-2xl'} animate-in fade-in slide-in-from-top-4 duration-1000`}>
               <div className="flex items-center gap-3"><Calendar size={18} style={{ color: appearance.accentColor }} /><span className={`text-sm font-bold tracking-wide ${textColor}`}>{formatDate(currentTime)}</span></div>
               <div className={`w-[1px] h-4 ${isLightMode ? 'bg-slate-300' : 'bg-white/10'}`}></div>
               <div className="flex items-center gap-3"><Clock size={18} style={{ color: appearance.accentColor }} /><span className={`text-sm font-black font-mono tracking-widest ${textColor}`}>{formatTime(currentTime)}</span></div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <button onClick={() => setAppearance(prev => ({...prev, isMute: !prev.isMute}))} className={`p-4 glass-panel rounded-2xl transition-all hover:bg-white/10 ${appearance.isMute ? 'text-red-500' : 'text-emerald-500'} ${isLightMode ? 'bg-white/50' : ''}`} title={appearance.isMute ? '解除靜音' : '全局靜音'}>{appearance.isMute ? <BellOff size={20} /> : <Bell size={20} />}</button>
            {!isEmpty && <button onClick={toggleFullScreen} className={`px-6 py-4 glass-panel rounded-2xl transition-all hover:bg-white/10 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 ${textColor} ${isLightMode ? 'bg-white/50' : ''}`}><Maximize2 size={16}/> 全螢幕</button>}
            <button onClick={() => setIsConfigOpen(true)} className={`px-6 py-4 glass-panel rounded-2xl transition-all hover:bg-white/10 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 ${textColor} ${isLightMode ? 'bg-white/50' : ''}`}><Settings size={16}/> 配置中心</button>
          </div>
        </header>
      )}

      <main className={`flex-1 z-10 p-10 flex flex-col items-center justify-center transition-all duration-1000 ${isFullScreen ? 'scale-[1.15]' : ''}`}>
        {isEmpty ? (
          <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-700">
            <div className={`w-48 h-48 rounded-[3rem] glass-panel flex items-center justify-center mb-12 border-dashed border-2 ${isLightMode ? 'border-slate-300 bg-white/40' : 'border-white/10'} text-slate-700`}><Layout size={64} /></div>
            <h2 className={`text-5xl font-black mb-6 tracking-tighter italic uppercase ${textColor}`}>尚未配置賽事環節</h2>
            <button onClick={() => setIsConfigOpen(true)} className="px-12 py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] text-white flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-2xl" style={{ backgroundColor: appearance.accentColor }}><PlusCircle size={20} />立即添加賽事環節</button>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <h2 className={`font-black mb-8 transition-all ${isFullScreen ? 'text-[9rem]' : 'text-[7.5rem]'} leading-none italic tracking-tighter uppercase ${textColor}`}>{currentPhase?.name}</h2>
              <div className={`inline-flex items-center gap-4 px-8 py-3 rounded-full border shadow-inner ${isLightMode ? 'bg-white/40 border-slate-300' : 'bg-white/5 border-white/5'}`}>
                <ShieldAlert size={14} style={{ color: appearance.accentColor }} />
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${subTextColor}`}>
                  模式: {currentPhase?.type === PhaseType.FREE ? '自由辯論' : '標準環節'}
                </span>
              </div>
            </div>

            <div className="flex gap-4 mb-14">
              <button onClick={pauseAllTimers} className={`flex items-center gap-3 px-10 py-4 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-2xl transition-all group ${isLightMode ? 'bg-amber-50/80 border-amber-500/30' : ''}`}><Pause size={16} className="text-amber-600 group-hover:scale-110 transition-transform"/><span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">全部暫停</span></button>
              <button onClick={playBellSound} className={`flex items-center gap-3 px-10 py-4 border rounded-2xl transition-all group active:scale-95 shadow-lg ${isLightMode ? 'bg-white border-slate-200' : ''}`} style={{ backgroundColor: `${appearance.accentColor}11`, borderColor: `${appearance.accentColor}33` }}><BellRing size={16} style={{ color: appearance.accentColor }} className="group-hover:animate-bounce transition-transform"/><span className="text-[10px] font-black uppercase tracking-widest" style={{ color: appearance.accentColor }}>手動鳴鈴</span></button>
              <button onClick={resetAllTimers} className={`flex items-center gap-3 px-10 py-4 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-2xl transition-all group ${isLightMode ? 'bg-blue-50/80 border-blue-500/30' : ''}`}><RotateCcw size={16} className="text-blue-600 group-hover:rotate-[-45deg] transition-transform"/><span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">全部重置</span></button>
            </div>

            {/* 計時器容器：單個計時器時寬度限制並居中，多個時自動排列 */}
            <div className={`grid gap-16 w-full max-w-7xl items-center justify-center transition-all duration-700 ${currentPhase?.timers.length === 1 ? 'grid-cols-1 max-w-4xl mx-auto' : currentPhase?.timers.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {currentPhase?.timers.map((timer) => (
                <TimerBox 
                  key={timer.id}
                  label={timer.label}
                  seconds={timer.remainingSeconds}
                  totalDuration={timer.durationSeconds}
                  overtimeThresholdSeconds={timer.overtimeThresholdSeconds}
                  isRunning={timer.isRunning}
                  mode={timer.mode}
                  alertPoints={timer.alertPoints}
                  foulCount={timer.foulCount}
                  onUpdateFoul={(delta) => updateFoulCount(timer.id, delta)}
                  accentColor={appearance.accentColor}
                  customSound={appearance.customSound}
                  isMute={appearance.isMute}
                  isLightMode={isLightMode}
                  onToggle={() => toggleTimer(timer.id)}
                  onCompensate={(secs) => compensateTimer(timer.id, secs)}
                  onReset={() => { setPhases(prev => prev.map((p, idx) => idx !== currentPhaseIndex ? p : { ...p, timers: p.timers.map(t => t.id === timer.id ? { ...t, isRunning: false, remainingSeconds: t.mode === 'countdown' ? t.durationSeconds : 0, foulCount: 0 } : t) })); }}
                  onToggleMode={() => { setPhases(prev => prev.map((p, idx) => idx !== currentPhaseIndex ? p : { ...p, timers: p.timers.map(t => { if (t.id !== timer.id) return t; const newMode: TimerMode = t.mode === 'countdown' ? 'stopwatch' : 'countdown'; return { ...t, mode: newMode, isRunning: false, remainingSeconds: newMode === 'countdown' ? t.durationSeconds : 0, foulCount: 0 }; })})); }}
                  // 如果只有一個計時器或全螢幕，強制使用 Large 佈局
                  isLarge={currentPhase?.timers.length === 1 || isFullScreen}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <ConfigModal 
        isOpen={isConfigOpen}
        initialPhases={phases}
        initialAppearance={appearance}
        onClose={() => setIsConfigOpen(false)}
        onSave={(newPhases, newAppearance) => { setPhases(newPhases); setAppearance(newAppearance); setIsConfigOpen(false); }}
      />
    </div>
  );
};

export default App;