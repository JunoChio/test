
import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Palette, Type as TypeIcon, Layout, Smile, Timer as TimerIcon, Activity, Keyboard, Image as ImageIcon, Volume2, Upload, Bell, UserPlus, UserMinus, Eye, EyeOff } from 'lucide-react';
import { DebatePhase, PhaseType, TimerInstance, AppearanceConfig, ThemeType, HotkeyConfig, TimerMode } from '../types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (phases: DebatePhase[], appearance: AppearanceConfig) => void;
  initialPhases: DebatePhase[];
  initialAppearance: AppearanceConfig;
}

const THEMES: { id: ThemeType; label: string; color: string }[] = [
  { id: 'midnight', label: '午夜極黑', color: '#020617' },
  { id: 'aurora', label: '極光深空', color: '#1e1b4b' },
  { id: 'ocean', label: '深海領域', color: '#0c4a6e' },
  { id: 'sunset', label: '落日餘暉', color: '#451a03' },
  { id: 'custom', label: '自定義背景', color: '#334155' },
];

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onSave, initialPhases, initialAppearance }) => {
  const [phases, setPhases] = useState<DebatePhase[]>(initialPhases);
  const [appearance, setAppearance] = useState<AppearanceConfig>(initialAppearance);
  const [activeTab, setActiveTab] = useState<'appearance' | 'phases' | 'hotkeys'>('appearance');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const soundInputRef = useRef<HTMLInputElement>(null);

  // 僅在 Modal 打開時初始化內部狀態，避免操作中途被外部 prop 覆蓋
  useEffect(() => {
    if (isOpen) {
      setPhases([...initialPhases]);
      setAppearance({ ...initialAppearance });
      if (initialPhases.length === 0) {
        setActiveTab('phases');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAppearance(prev => ({ ...prev, backgroundImage: reader.result as string, theme: 'custom' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAppearance(prev => ({ ...prev, customSound: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const createDefaultTimer = (label: string = '發言方'): TimerInstance => ({
    id: Math.random().toString(36).substr(2, 9),
    label,
    durationSeconds: 180,
    remainingSeconds: 180,
    isRunning: false,
    mode: 'countdown',
    alertPoints: [30, 0]
  });

  const addPhase = () => {
    const newPhase: DebatePhase = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新賽事環節',
      type: PhaseType.STANDARD,
      timers: [
        createDefaultTimer('正方發言'),
        createDefaultTimer('反方發言')
      ]
    };
    setPhases(prev => [...prev, newPhase]);
  };

  const addTimerToPhase = (phaseId: string) => {
    setPhases(prevPhases => prevPhases.map(p => {
      if (p.id !== phaseId) return p;
      const newTimer = createDefaultTimer(`發言方 ${p.timers.length + 1}`);
      if (p.type === PhaseType.FREE) {
        newTimer.mode = 'stopwatch';
        newTimer.remainingSeconds = 0;
      }
      return { ...p, timers: [...p.timers, newTimer] };
    }));
  };

  const removeTimerFromPhase = (phaseId: string, timerId: string) => {
    setPhases(prevPhases => prevPhases.map(p => {
      if (p.id !== phaseId) return p;
      if (p.timers.length <= 1) return p;
      return { ...p, timers: p.timers.filter(t => t.id !== timerId) };
    }));
  };

  const updatePhaseType = (phaseId: string, newType: PhaseType) => {
    setPhases(prevPhases => prevPhases.map(p => {
      if (p.id !== phaseId) return p;
      const newMode: TimerMode = newType === PhaseType.FREE ? 'stopwatch' : 'countdown';
      return {
        ...p,
        type: newType,
        timers: p.timers.map(t => ({
          ...t,
          mode: newMode,
          remainingSeconds: newMode === 'countdown' ? t.durationSeconds : 0
        }))
      };
    }));
  };

  const updateTimer = (phaseId: string, timerId: string, updates: Partial<TimerInstance>) => {
    setPhases(prevPhases => prevPhases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        timers: p.timers.map(t => t.id === timerId ? { ...t, ...updates } : t)
      };
    }));
  };

  const toggleAlertPoint = (phaseId: string, timerId: string, point: number) => {
    setPhases(prevPhases => prevPhases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        timers: p.timers.map(t => {
          if (t.id !== timerId) return t;
          const points = t.alertPoints.includes(point) 
            ? t.alertPoints.filter(p => p !== point) 
            : [...t.alertPoints, point].sort((a, b) => b - a);
          return { ...t, alertPoints: points };
        })
      };
    }));
  };

  const addCustomAlert = (phaseId: string, timerId: string) => {
    const val = prompt("請輸入鳴鈴點 (秒):");
    const num = parseInt(val || "");
    if (!isNaN(num)) {
      toggleAlertPoint(phaseId, timerId, num);
    }
  };

  const updateHotkey = (key: keyof HotkeyConfig, value: string) => {
    setAppearance(prev => ({ ...prev, hotkeys: { ...prev.hotkeys, [key]: value } }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-5xl max-h-[90vh] glass-panel rounded-[3rem] flex flex-col shadow-2xl overflow-hidden border border-white/10">
        <div className="flex items-center justify-between p-10 border-b border-white/5">
          <h2 className="text-3xl font-black flex items-center gap-4 text-white uppercase tracking-tighter italic">
            <div className="w-4 h-10 rounded-full" style={{ backgroundColor: appearance.accentColor }}></div>
            Control Center
          </h2>
          <div className="flex bg-slate-900 p-1.5 rounded-2xl shadow-inner">
             <button onClick={() => setActiveTab('appearance')} className={`px-6 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'appearance' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>外觀與多媒體</button>
             <button onClick={() => setActiveTab('phases')} className={`px-6 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'phases' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>環節與鳴鈴</button>
             <button onClick={() => setActiveTab('hotkeys')} className={`px-6 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'hotkeys' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>快捷鍵</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12">
          {activeTab === 'appearance' && (
            <div className="space-y-10 animate-in slide-in-from-left-4 duration-300">
              <div className="grid grid-cols-2 gap-8">
                <section>
                  <label className="text-[10px] font-black text-slate-500 mb-4 block uppercase tracking-[0.3em]">賽事主標題</label>
                  <input value={appearance.appTitle} onChange={(e) => setAppearance(prev => ({...prev, appTitle: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-bold outline-none text-white focus:border-emerald-500/50 transition-colors"/>
                </section>
                <section>
                  <label className="text-[10px] font-black text-slate-500 mb-4 block uppercase tracking-[0.3em]">圖標 / Emoji</label>
                  <input value={appearance.iconText} onChange={(e) => setAppearance(prev => ({...prev, iconText: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-bold outline-none text-white text-center" maxLength={2}/>
                </section>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <section>
                  <label className="text-[10px] font-black text-slate-500 mb-4 block uppercase tracking-[0.3em]">背景圖片</label>
                  <div className="flex items-center gap-4">
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-3 py-6 rounded-2xl bg-white/5 border border-dashed border-white/20 hover:bg-white/10 transition-all text-slate-400 hover:text-white">
                      <ImageIcon size={20} />
                      <span className="text-xs font-black uppercase tracking-widest">上傳背景圖</span>
                    </button>
                    {appearance.backgroundImage && (
                       <button onClick={() => setAppearance(prev => ({...prev, backgroundImage: undefined, theme: 'midnight'}))} className="p-6 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"><Trash2 size={20}/></button>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                </section>

                <section>
                  <label className="text-[10px] font-black text-slate-500 mb-4 block uppercase tracking-[0.3em]">鳴鈴音效</label>
                  <div className="flex items-center gap-4">
                    <button onClick={() => soundInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-3 py-6 rounded-2xl bg-white/5 border border-dashed border-white/20 hover:bg-white/10 transition-all text-slate-400 hover:text-white">
                      <Volume2 size={20} />
                      <span className="text-xs font-black uppercase tracking-widest">上傳音效</span>
                    </button>
                    {appearance.customSound && (
                       <button onClick={() => setAppearance(prev => ({...prev, customSound: undefined}))} className="p-6 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"><Trash2 size={20}/></button>
                    )}
                  </div>
                  <input type="file" ref={soundInputRef} className="hidden" accept="audio/*" onChange={handleSoundUpload} />
                </section>
              </div>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">顯示設置</label>
                </div>
                <div className="flex items-center gap-4 p-6 bg-white/5 rounded-2xl border border-white/10">
                  <button 
                    onClick={() => setAppearance(prev => ({...prev, showInfoBar: !prev.showInfoBar}))}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl font-black text-xs uppercase transition-all ${appearance.showInfoBar ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}
                  >
                    {appearance.showInfoBar ? <Eye size={16} /> : <EyeOff size={16} />}
                    {appearance.showInfoBar ? '顯示日期時間欄' : '隱藏日期時間欄'}
                  </button>
                  <p className="text-[10px] text-slate-500 font-bold">開啟後，日期與時間將顯示於頂部周標題區域。</p>
                </div>
              </section>

              <section>
                <label className="text-[10px] font-black text-slate-500 mb-4 block uppercase tracking-[0.3em]">預設主題氛圍</label>
                <div className="grid grid-cols-5 gap-4">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => setAppearance(prev => ({...prev, theme: t.id}))} className={`p-4 rounded-2xl border-2 transition-all ${appearance.theme === t.id ? 'border-white bg-white/10' : 'border-transparent bg-white/5 opacity-60 hover:opacity-100'}`}>
                      <div className="w-full h-12 rounded-lg mb-2" style={{ backgroundColor: t.color }}></div>
                      <span className="text-[10px] font-black uppercase text-white">{t.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'phases' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              {phases.map((phase) => (
                <div key={phase.id} className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 relative group hover:border-white/10 transition-all">
                  <div className="flex gap-4 mb-8">
                    <input value={phase.name} onChange={(e) => setPhases(prev => prev.map(p => p.id === phase.id ? {...p, name: e.target.value} : p))} className="flex-1 bg-transparent border-b border-white/10 text-xl font-black outline-none text-white uppercase focus:border-emerald-500/50 transition-colors"/>
                    <div className="flex gap-2">
                       <select value={phase.type} onChange={(e) => updatePhaseType(phase.id, e.target.value as PhaseType)} className="bg-slate-800 rounded-xl px-4 py-2 text-xs font-black text-white outline-none border border-white/10">
                        <option value={PhaseType.STANDARD}>標準 (倒數)</option>
                        <option value={PhaseType.FREE}>自由 (秒錶)</option>
                      </select>
                      <button onClick={() => addTimerToPhase(phase.id)} className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500/20 transition-all text-xs font-black flex items-center gap-2">
                        <UserPlus size={14} /> 添加發言方
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid gap-6">
                    {phase.timers.map((timer) => (
                      <div key={timer.id} className="p-6 bg-white/5 rounded-2xl flex flex-col gap-6 border border-white/5 relative group/timer">
                        <div className="flex justify-between items-center">
                          <input value={timer.label} onChange={(e) => updateTimer(phase.id, timer.id, { label: e.target.value })} className="bg-transparent font-black text-lg text-white outline-none w-1/3 focus:text-emerald-400 transition-colors"/>
                          <div className="flex gap-3 items-center">
                             <span className="text-[10px] font-black text-slate-500 uppercase">{timer.mode === 'countdown' ? '初始' : '基準'}</span>
                             <input type="number" value={timer.durationSeconds} onChange={(e) => {
                                const v = parseInt(e.target.value) || 0;
                                updateTimer(phase.id, timer.id, { durationSeconds: v, remainingSeconds: timer.mode === 'countdown' ? v : 0 });
                             }} className="w-20 bg-white/10 rounded-xl px-3 py-1.5 text-center font-mono text-sm text-white"/>
                             <div className="flex items-center gap-2 ml-4">
                               <label className="text-[10px] font-black text-slate-500 uppercase">鳴鈴</label>
                               <button onClick={() => addCustomAlert(phase.id, timer.id)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"><Plus size={12}/></button>
                             </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {timer.alertPoints.map(p => (
                            <button key={p} onClick={() => toggleAlertPoint(phase.id, timer.id, p)} className="px-3 py-1.5 rounded-lg bg-white/5 text-[10px] font-bold text-slate-400 hover:bg-red-500/20 hover:text-red-500 transition-all flex items-center gap-2">
                              {p}s <X size={10} />
                            </button>
                          ))}
                        </div>

                        {phase.timers.length > 1 && (
                          <button onClick={() => removeTimerFromPhase(phase.id, timer.id)} className="absolute -right-2 -top-2 p-1.5 bg-slate-800 text-slate-500 rounded-full opacity-0 group-hover:opacity-100 group-timer/hover:opacity-100 hover:bg-red-500 hover:text-white transition-all">
                            <UserMinus size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setPhases(prev => prev.filter(p => p.id !== phase.id))} className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110"><X size={16}/></button>
                </div>
              ))}
              <button onClick={addPhase} className="w-full py-10 border-2 border-dashed border-white/10 rounded-[2.5rem] flex items-center justify-center gap-3 text-slate-500 hover:text-white hover:border-white/30 transition-all group">
                <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300"/> 
                <span className="font-black uppercase tracking-widest text-sm">新增賽事環節</span>
              </button>
            </div>
          )}

          {activeTab === 'hotkeys' && (
            <div className="grid grid-cols-2 gap-12 animate-in slide-in-from-bottom-4 duration-300">
               <div className="space-y-6">
                 <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3 mb-8 border-l-4 border-emerald-500 pl-4">
                   <Keyboard size={18} /> 全局操作
                 </h3>
                 <div className="space-y-4">
                    <HotkeyInput label="全部暫停" value={appearance.hotkeys.pauseAll} onChange={(v) => updateHotkey('pauseAll', v)} />
                    <HotkeyInput label="全部復位" value={appearance.hotkeys.resetAll} onChange={(v) => updateHotkey('resetAll', v)} />
                    <HotkeyInput label="手動鳴鈴" value={appearance.hotkeys.manualBell} onChange={(v) => updateHotkey('manualBell', v)} />
                    <HotkeyInput label="下一環節" value={appearance.hotkeys.nextPhase} onChange={(v) => updateHotkey('nextPhase', v)} />
                    <HotkeyInput label="上一環節" value={appearance.hotkeys.prevPhase} onChange={(v) => updateHotkey('prevPhase', v)} />
                 </div>
               </div>
               <div className="space-y-6">
                 <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3 mb-8 border-l-4 border-blue-500 pl-4">
                   <Activity size={18} /> 辯手控制
                 </h3>
                 <div className="space-y-4">
                    <HotkeyInput label="計時器 1" value={appearance.hotkeys.toggleTimer1} onChange={(v) => updateHotkey('toggleTimer1', v)} />
                    <HotkeyInput label="計時器 2" value={appearance.hotkeys.toggleTimer2} onChange={(v) => updateHotkey('toggleTimer2', v)} />
                    <HotkeyInput label="計時器 3" value={appearance.hotkeys.toggleTimer3} onChange={(v) => updateHotkey('toggleTimer3', v)} />
                 </div>
               </div>
            </div>
          )}
        </div>

        <div className="p-10 border-t border-white/5 flex justify-end gap-6 bg-black/40 backdrop-blur-md">
          <button onClick={onClose} className="px-8 py-4 rounded-xl font-black text-xs uppercase text-slate-400 hover:text-white transition-colors">取消</button>
          <button onClick={() => onSave(phases, appearance)} className="px-10 py-4 rounded-xl font-black text-xs uppercase text-white shadow-xl hover:scale-105 active:scale-95 transition-all" style={{ backgroundColor: appearance.accentColor }}>保存配置</button>
        </div>
      </div>
    </div>
  );
};

const HotkeyInput = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group hover:border-white/20 transition-all">
    <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors">{label}</span>
    <input 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') return;
        e.preventDefault();
        onChange(e.key);
      }}
      className="w-24 bg-slate-800 rounded-xl py-2 text-center text-sm font-black text-emerald-400 border border-white/5 outline-none uppercase transition-all"
    />
  </div>
);
