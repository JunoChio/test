
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Layout, Timer as TimerIcon, Activity, Bell, BellOff, Clock, Zap, BookOpen, Users, UserMinus, Keyboard, Settings2, Repeat, Layers, MousePointer2, Check } from 'lucide-react';
import { DebatePhase, PhaseType, AppearanceConfig, ThemeType, HotkeyConfig, TimerMode } from '../types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (phases: DebatePhase[], appearance: AppearanceConfig) => void;
  initialPhases: DebatePhase[];
  initialAppearance: AppearanceConfig;
}

const THEMES: { id: ThemeType; label: string; color: string; gradient: string }[] = [
  { id: 'midnight', label: '午夜極黑', color: '#020617', gradient: 'from-slate-900 to-black' },
  { id: 'aurora', label: '極光深空', color: '#1e1b4b', gradient: 'from-indigo-950 to-slate-950' },
  { id: 'ocean', label: '深海領域', color: '#0c4a6e', gradient: 'from-sky-950 to-slate-950' },
  { id: 'sunset', label: '落日餘暉', color: '#451a03', gradient: 'from-orange-950 to-stone-950' },
  { id: 'custom', label: '自定義背景', color: '#334155', gradient: 'from-slate-800 to-slate-900' },
];

const TEMPLATES = [
  {
    name: '標準四辯賽制',
    desc: '4vs4 完整對壘結構',
    icon: Users,
    phases: [
      { id: 'p1', name: '開篇申論', type: PhaseType.STANDARD, timers: [
        { id: 't1', label: '正一', durationSeconds: 180, remainingSeconds: 180, isRunning: false, mode: 'countdown', alertPoints: [30, 0], overtimeThresholdSeconds: 15, foulCount: 0 },
        { id: 't2', label: '反一', durationSeconds: 180, remainingSeconds: 180, isRunning: false, mode: 'countdown', alertPoints: [30, 0], overtimeThresholdSeconds: 15, foulCount: 0 }
      ]},
      { id: 'p3', name: '自由辯論', type: PhaseType.FREE, timers: [
        { id: 't5', label: '正方團隊', durationSeconds: 240, remainingSeconds: 240, isRunning: false, mode: 'countdown', alertPoints: [30, 0], overtimeThresholdSeconds: 15, foulCount: 0 },
        { id: 't6', label: '反方團隊', durationSeconds: 240, remainingSeconds: 240, isRunning: false, mode: 'countdown', alertPoints: [30, 0], overtimeThresholdSeconds: 15, foulCount: 0 }
      ]}
    ]
  },
  {
    name: '政策質詢模式',
    desc: '強化質詢與交叉對答',
    icon: BookOpen,
    phases: [
      { id: 'o1', name: '一辯申論/質詢', type: PhaseType.STANDARD, timers: [
        { id: 'ot1', label: '正一申論', durationSeconds: 240, remainingSeconds: 240, isRunning: false, mode: 'countdown', alertPoints: [30, 0], overtimeThresholdSeconds: 15, foulCount: 0 },
        { id: 'ot2', label: '反二質詢', durationSeconds: 120, remainingSeconds: 120, isRunning: false, mode: 'countdown', alertPoints: [30, 0], overtimeThresholdSeconds: 15, foulCount: 0 }
      ]}
    ]
  }
];

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onSave, initialPhases, initialAppearance }) => {
  const [phases, setPhases] = useState<DebatePhase[]>([]);
  const [appearance, setAppearance] = useState<AppearanceConfig>(initialAppearance);
  const [activeTab, setActiveTab] = useState<'appearance' | 'phases' | 'hotkeys'>('phases');

  useEffect(() => {
    if (isOpen) {
      setPhases(JSON.parse(JSON.stringify(initialPhases)));
      setAppearance(JSON.parse(JSON.stringify(initialAppearance)));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyTemplate = (templatePhases: any[]) => {
    const formatted = templatePhases.map(p => ({
      ...p,
      id: Math.random().toString(36).substr(2, 9),
      timers: p.timers.map((t: any) => ({ ...t, id: Math.random().toString(36).substr(2, 9) }))
    }));
    setPhases(formatted);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl">
      <div className="w-full max-w-6xl max-h-[92vh] glass-panel rounded-[4rem] flex flex-col shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-12 py-10 bg-gradient-to-b from-white/5 to-transparent">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-500 shadow-lg shadow-emerald-500/20">
              <Settings2 size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">配置中心</h2>
              <p className="text-[10px] text-slate-500 font-black tracking-[0.4em] uppercase opacity-70">PROFESSIONAL DEBATE SYSTEM</p>
            </div>
          </div>
          <div className="flex bg-black/40 p-1.5 rounded-[2rem] border border-white/5">
             <button onClick={() => setActiveTab('phases')} className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'phases' ? 'bg-white/10 text-white border border-white/20' : 'text-slate-500 hover:text-slate-300'}`}><Layers size={16}/> 流程</button>
             <button onClick={() => setActiveTab('appearance')} className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'appearance' ? 'bg-white/10 text-white border border-white/20' : 'text-slate-500 hover:text-slate-300'}`}><Layout size={16}/> 風格</button>
             <button onClick={() => setActiveTab('hotkeys')} className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'hotkeys' ? 'bg-white/10 text-white border border-white/20' : 'text-slate-500 hover:text-slate-300'}`}><Keyboard size={16}/> 鍵位</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-12 pb-12 space-y-12">
          {activeTab === 'phases' && (
            <div className="space-y-10">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Zap size={18} className="text-amber-400" />
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">快捷範本</label>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   {TEMPLATES.map(tmp => (
                     <button key={tmp.name} onClick={() => handleApplyTemplate(tmp.phases)} className="group flex items-center gap-6 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/[0.08] hover:border-emerald-500/30 transition-all text-left">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:bg-emerald-500 transition-all text-slate-400 group-hover:text-white">
                           <tmp.icon size={22} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-white mb-1">{tmp.name}</h4>
                          <p className="text-xs text-slate-500 font-medium">{tmp.desc}</p>
                        </div>
                     </button>
                   ))}
                </div>
              </section>

              <div className="space-y-8">
                {phases.map((phase, idx) => (
                  <div key={phase.id} className="p-10 bg-white/[0.03] rounded-[3.5rem] border border-white/5 relative">
                    <div className="flex gap-8 items-end mb-10">
                      <div className="flex-1">
                        <label className="text-[10px] font-black text-emerald-500/60 uppercase mb-3 block">Step 0{idx+1} — 環節名稱</label>
                        <input value={phase.name} onChange={(e) => setPhases(prev => prev.map(p => p.id === phase.id ? {...p, name: e.target.value} : p))} className="w-full bg-transparent border-b-2 border-white/10 text-3xl font-black outline-none text-white uppercase focus:border-emerald-500/50 pb-3"/>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase">邏輯</label>
                         <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
                            <button onClick={() => setPhases(prev => prev.map(p => p.id === phase.id ? {...p, type: PhaseType.STANDARD} : p))} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${phase.type === PhaseType.STANDARD ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>標準</button>
                            <button onClick={() => setPhases(prev => prev.map(p => p.id === phase.id ? {...p, type: PhaseType.FREE} : p))} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${phase.type === PhaseType.FREE ? 'bg-blue-500 text-white' : 'text-slate-500'}`}>自由</button>
                         </div>
                      </div>
                      <button onClick={() => setPhases(prev => prev.filter(p => p.id !== phase.id))} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all self-end"><Trash2 size={20}/></button>
                    </div>

                    <div className="space-y-4">
                      {phase.timers.map((timer) => (
                        <div key={timer.id} className="p-6 bg-white/[0.02] rounded-3xl flex items-center gap-8 border border-white/5 hover:bg-white/[0.05] transition-all">
                          <div className="flex-1">
                             <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">標籤</label>
                             <input value={timer.label} onChange={(e) => setPhases(prev => prev.map(p => p.id === phase.id ? {...p, timers: p.timers.map(t => t.id === timer.id ? {...t, label: e.target.value} : t)} : p))} className="w-full bg-transparent font-black text-white text-lg outline-none border-b border-white/5 focus:border-emerald-500/30 pb-1"/>
                          </div>
                          
                          <div className="w-44">
                             <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">模式</label>
                             <div className="flex bg-slate-900/60 p-1 rounded-xl">
                               <button onClick={() => setPhases(prev => prev.map(p => p.id === phase.id ? {...p, timers: p.timers.map(t => t.id === timer.id ? {...t, mode: 'countdown'} : t)} : p))} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black transition-all ${timer.mode === 'countdown' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-600'}`}><TimerIcon size={12}/> 倒計時</button>
                               <button onClick={() => setPhases(prev => prev.map(p => p.id === phase.id ? {...p, timers: p.timers.map(t => t.id === timer.id ? {...t, mode: 'stopwatch'} : t)} : p))} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black transition-all ${timer.mode === 'stopwatch' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-600'}`}><Activity size={12}/> 秒錶</button>
                             </div>
                          </div>

                          {timer.mode === 'countdown' && (
                            <div className="w-32">
                               <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">秒數</label>
                               <input type="number" value={timer.durationSeconds} onChange={(e) => {
                                 const v = parseInt(e.target.value) || 0;
                                 setPhases(prev => prev.map(p => p.id === phase.id ? {...p, timers: p.timers.map(t => t.id === timer.id ? {...t, durationSeconds: v, remainingSeconds: v} : t)} : p));
                               }} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-center font-mono text-emerald-400 font-bold outline-none focus:border-emerald-500/50"/>
                            </div>
                          )}

                          <button onClick={() => setPhases(prev => prev.map(p => p.id === phase.id ? { ...p, timers: p.timers.filter(t => t.id !== timer.id) } : p))} className="p-3 text-slate-600 hover:text-red-500 transition-colors mt-5"><UserMinus size={20}/></button>
                        </div>
                      ))}
                      <button onClick={() => {
                        setPhases(prev => prev.map(p => p.id === phase.id ? { ...p, timers: [...p.timers, { id: Math.random().toString(36).substr(2, 9), label: '新增辯手', durationSeconds: 180, remainingSeconds: 180, isRunning: false, mode: 'countdown', alertPoints: [30, 0], overtimeThresholdSeconds: 15, foulCount: 0 }] } : p));
                      }} className="w-full py-4 border-2 border-dashed border-white/5 rounded-3xl text-xs font-black text-slate-600 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all uppercase flex items-center justify-center gap-2 tracking-widest">+ 添加席位</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setPhases(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: '新辯論環節', type: PhaseType.STANDARD, timers: [{ id: Math.random().toString(36).substr(2, 9), label: '辯手', durationSeconds: 180, remainingSeconds: 180, isRunning: false, mode: 'countdown', alertPoints: [30, 0], overtimeThresholdSeconds: 15, foulCount: 0 }] }])} className="w-full py-12 border-2 border-dashed border-white/10 rounded-[3.5rem] flex items-center justify-center gap-4 text-slate-500 hover:text-white hover:border-emerald-500/40 hover:bg-white/5 transition-all uppercase font-black tracking-[0.2em] group">
                  <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300"/>
                  添加全新賽事環節
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <section className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">主標題內容</label>
                  <input value={appearance.appTitle} onChange={(e) => setAppearance(prev => ({...prev, appTitle: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-5 text-2xl font-black outline-none text-white focus:border-emerald-500/50 transition-all"/>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">主題配色</label>
                  <div className="grid grid-cols-5 gap-4 h-[68px]">
                    {THEMES.map(t => (
                      <button key={t.id} onClick={() => setAppearance(prev => ({...prev, theme: t.id}))} className={`relative flex-1 rounded-2xl border-4 transition-all ${appearance.theme === t.id ? 'border-emerald-500 scale-105 shadow-lg shadow-emerald-500/20' : 'border-transparent'}`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient} rounded-xl`}></div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-3 gap-6">
                 {[
                   { label: '顯示 Logo', val: appearance.showLogo, field: 'showLogo' },
                   { label: '顯示狀態標籤', val: appearance.showPhasePill, field: 'showPhasePill' },
                   { label: '開啟響鈴提示', val: !appearance.isMute, field: 'isMute', inverse: true }
                 ].map(sw => (
                   <button key={sw.field} onClick={() => setAppearance(prev => ({...prev, [sw.field]: sw.inverse ? !sw.val : !sw.val}))} className={`p-8 rounded-[2.5rem] border transition-all flex flex-col gap-4 text-left ${sw.val ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black uppercase tracking-widest">{sw.label}</span>
                         <Check size={18} className={sw.val ? 'opacity-100' : 'opacity-20'} />
                      </div>
                      <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                         <div className={`h-full transition-all duration-500 ${sw.val ? 'w-full bg-emerald-500' : 'w-0'}`}></div>
                      </div>
                   </button>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'hotkeys' && (
            <div className="grid grid-cols-2 gap-6 animate-in fade-in duration-500">
               {[
                 { label: '全局暫停/恢復', val: appearance.hotkeys.pauseAll, field: 'pauseAll' },
                 { label: '全部重置', val: appearance.hotkeys.resetAll, field: 'resetAll' },
                 { label: '強制鳴鈴', val: appearance.hotkeys.manualBell, field: 'manualBell' },
                 { label: '下一環節', val: appearance.hotkeys.nextPhase, field: 'nextPhase' },
                 { label: '上一環節', val: appearance.hotkeys.prevPhase, field: 'prevPhase' },
                 { label: '辯手 1', val: appearance.hotkeys.toggleTimer1, field: 'toggleTimer1' },
                 { label: '辯手 2', val: appearance.hotkeys.toggleTimer2, field: 'toggleTimer2' },
                 { label: '辯手 3', val: appearance.hotkeys.toggleTimer3, field: 'toggleTimer3' },
               ].map(item => (
                 <div key={item.field} className="flex items-center justify-between px-8 py-5 bg-white/5 rounded-3xl border border-white/10 group">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                    <input value={item.val} onKeyDown={(e) => { e.preventDefault(); setAppearance(prev => ({ ...prev, hotkeys: { ...prev.hotkeys, [item.field]: e.key } })); }} readOnly className="w-24 bg-slate-900 border-2 border-white/5 rounded-xl px-2 py-2 text-center font-mono text-emerald-400 font-black text-sm outline-none focus:border-emerald-500 cursor-pointer"/>
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-10 px-12 border-t border-white/5 flex justify-end gap-8 bg-black/40">
          <button onClick={onClose} className="px-10 py-4 rounded-2xl font-black text-xs uppercase text-slate-500 hover:text-white transition-all tracking-widest">取消</button>
          <button onClick={() => onSave(phases, appearance)} className="px-14 py-4 rounded-2xl font-black text-xs uppercase text-white shadow-2xl hover:scale-105 active:scale-95 transition-all" style={{ backgroundColor: appearance.accentColor }}>保存並套用配置</button>
        </div>
      </div>
    </div>
  );
};
