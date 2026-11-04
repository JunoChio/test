import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Settings, ChevronLeft, ChevronRight, Bell, BellOff, RotateCcw, 
  Pause, Play, Zap, Maximize, Minimize, FileText, Volume2, 
  Clock, ShieldAlert, Sparkles, Check, Edit3, FileCode, Palette, ChevronDown
} from 'lucide-react';
import { DebatePhase, PhaseType, MatchInfo, DebateRecord, StageSettings, TimerMode } from './types';
import { TOURNAMENT_TEMPLATES, DEFAULT_MATCH_INFO } from './templates';
import { TimerBox } from './components/TimerBox';
import { ConfigModal } from './components/ConfigModal';
import { RecordDrawer } from './components/RecordDrawer';
import { JsonTransferModal } from './components/JsonTransferModal';
import { bellSynthesizer } from './audioBell';
import { ThemeId, STAGE_THEMES, DEFAULT_THEME_ID } from './themes';

const DEFAULT_SETTINGS: StageSettings = {
  isMute: false,
  volume: 0.8,
  timeStep: 10,
  isChessClockMode: true,
  autoNextPhaseOnFinish: false,
  bellStyle: 'brass'
};

export const App: React.FC = () => {
  // 赛制环节状态持久化 (确保环节与辩手定时器永不为空)
  const [phases, setPhases] = useState<DebatePhase[]>(() => {
    try {
      const saved = localStorage.getItem('debate_stage_phases_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p, idx) => ({
            ...p,
            timers: Array.isArray(p.timers) && p.timers.length >= 2 ? p.timers : [
              p.timers?.[0] || { id: `t-${p.id || idx}-aff`, label: '正方辩手', durationSeconds: 180, remainingSeconds: 180, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
              p.timers?.[1] || { id: `t-${p.id || idx}-neg`, label: '反方辩手', durationSeconds: 180, remainingSeconds: 180, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 }
            ]
          }));
        }
      }
    } catch (e) {}
    return TOURNAMENT_TEMPLATES['标准立论与自由辩 (通用推荐)'];
  });

  // 赛事对阵与辩题信息持久化 (确保对阵队伍与辩题非空)
  const [matchInfo, setMatchInfo] = useState<MatchInfo>(() => {
    try {
      const saved = localStorage.getItem('debate_stage_match_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            tournamentTitle: parsed.tournamentTitle || DEFAULT_MATCH_INFO.tournamentTitle,
            motion: parsed.motion || DEFAULT_MATCH_INFO.motion,
            affirmativeTeam: parsed.affirmativeTeam || DEFAULT_MATCH_INFO.affirmativeTeam,
            negativeTeam: parsed.negativeTeam || DEFAULT_MATCH_INFO.negativeTeam
          };
        }
      }
    } catch (e) {}
    return DEFAULT_MATCH_INFO;
  });

  // 设置偏好持久化
  const [settings, setSettings] = useState<StageSettings>(() => {
    try {
      const saved = localStorage.getItem('debate_stage_settings_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  // 历史发言流水记录
  const [records, setRecords] = useState<DebateRecord[]>(() => {
    try {
      const saved = localStorage.getItem('debate_stage_records_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // 赛场视觉主题持久化 (默认曜石黑橙高对比度)
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('debate_stage_theme_v1') as ThemeId;
      if (saved && STAGE_THEMES[saved]) return saved;
    } catch (e) {}
    return DEFAULT_THEME_ID;
  });

  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isRecordDrawerOpen, setIsRecordDrawerOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEditingMotion, setIsEditingMotion] = useState(false);
  const [motionDraft, setMotionDraft] = useState(matchInfo.motion);

  // 点击外部自动收起主题选择菜单
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    if (isThemeMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isThemeMenuOpen]);

  // 记录各计时器已触发过的提醒点（防止重复鸣铃）
  const ringTrackerRef = useRef<{ [timerId: string]: { warningRinged: boolean; zeroRinged: boolean; overtimeRinged: boolean } }>({});

  const timerIntervalRef = useRef<any>(null);

  // 播放铃声工具
  const triggerBell = useCallback((type: 'single' | 'double' | 'triple' = 'single') => {
    if (settings.isMute) return;
    bellSynthesizer.play(type, settings.volume);
  }, [settings.isMute, settings.volume]);

  // 实时系统时间走动
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // 监听全屏变动
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 本地存储同步
  useEffect(() => {
    try {
      localStorage.setItem('debate_stage_phases_v1', JSON.stringify(phases));
      localStorage.setItem('debate_stage_match_v1', JSON.stringify(matchInfo));
      localStorage.setItem('debate_stage_settings_v1', JSON.stringify(settings));
      localStorage.setItem('debate_stage_records_v1', JSON.stringify(records));
      localStorage.setItem('debate_stage_theme_v1', currentThemeId);
    } catch (e) {}
  }, [phases, matchInfo, settings, records, currentThemeId]);

  // 全屏切换动作
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // 记录辩手发言
  const logSpeechRecord = useCallback((timer: any, phaseName: string, side: 'affirmative' | 'negative') => {
    if (timer.usedSeconds < 1) return; // 小于1秒不计入流水
    const newRecord: DebateRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      phaseName,
      speakerLabel: timer.label,
      side,
      usedSeconds: timer.usedSeconds,
      remainingSeconds: timer.remainingSeconds,
      isOvertime: timer.remainingSeconds < 0,
      foulCount: timer.foulCount || 0
    };
    setRecords(prev => [newRecord, ...prev]);
  }, []);

  // 核心高精度定时器循环 (每 10ms 步进 0.01 秒)
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setPhases(prevPhases => {
        const curPhase = prevPhases[currentPhaseIndex];
        if (!curPhase) return prevPhases;

        const anyRunning = curPhase.timers.some(t => t.isRunning);
        if (!anyRunning) return prevPhases;

        return prevPhases.map((phase, pIdx) => {
          if (pIdx !== currentPhaseIndex) return phase;

          return {
            ...phase,
            timers: phase.timers.map((timer) => {
              if (!timer.isRunning) return timer;

              const nextRemaining = timer.remainingSeconds - 0.01;
              const nextUsed = timer.usedSeconds + 0.01;

              // 初始化本计时器的预警记录
              if (!ringTrackerRef.current[timer.id]) {
                ringTrackerRef.current[timer.id] = { warningRinged: false, zeroRinged: false, overtimeRinged: false };
              }
              const tracker = ringTrackerRef.current[timer.id];

              if (timer.mode === 'countdown') {
                // 30秒预警点 (触发单响)
                if (timer.warningSeconds > 0 && nextRemaining <= timer.warningSeconds && !tracker.warningRinged) {
                  tracker.warningRinged = true;
                  triggerBell('single');
                }

                // 0秒到时点 (触发清脆双响)
                if (nextRemaining <= 0 && !tracker.zeroRinged) {
                  tracker.zeroRinged = true;
                  triggerBell('double');
                }

                // 超时30秒严重超期点 (触发连续三响)
                if (nextRemaining <= -30 && !tracker.overtimeRinged) {
                  tracker.overtimeRinged = true;
                  triggerBell('triple');
                }
              }

              return {
                ...timer,
                remainingSeconds: nextRemaining,
                usedSeconds: nextUsed
              };
            })
          };
        });
      });
    }, 10);

    return () => clearInterval(timerIntervalRef.current);
  }, [currentPhaseIndex, triggerBell]);

  // 切换指定计时器状态 (支持棋钟模式与自由辩论交替)
  const toggleTimer = useCallback((timerId: string) => {
    setPhases(prev => {
      const curPhase = prev[currentPhaseIndex];
      if (!curPhase) return prev;

      const target = curPhase.timers.find(t => t.id === timerId);
      if (!target) return prev;

      const willBeRunning = !target.isRunning;
      const isChessMode = curPhase.chessMode ?? settings.isChessClockMode;

      // 如果正在停止运行，记录一次流水
      if (!willBeRunning && target.usedSeconds > 2) {
        const side = curPhase.timers[0].id === timerId ? 'affirmative' : 'negative';
        logSpeechRecord(target, curPhase.name, side);
      }

      return prev.map((p, pIdx) => {
        if (pIdx !== currentPhaseIndex) return p;

        return {
          ...p,
          timers: p.timers.map(timer => {
            if (timer.id === timerId) {
              return { ...timer, isRunning: willBeRunning };
            }
            // 在自由辩论或棋钟模式下，开启一方时自动关闭另一方
            if (isChessMode && willBeRunning) {
              if (timer.isRunning && timer.usedSeconds > 2) {
                const side = p.timers[0].id === timer.id ? 'affirmative' : 'negative';
                logSpeechRecord(timer, p.name, side);
              }
              return { ...timer, isRunning: false };
            }
            return timer;
          })
        };
      });
    });
  }, [currentPhaseIndex, settings.isChessClockMode, logSpeechRecord]);

  // 快捷键按 [1] 控制正方，按 [2] 控制反方
  const activateSpeakerBySide = useCallback((sideIndex: 0 | 1) => {
    const curPhase = phases[currentPhaseIndex];
    if (!curPhase || !curPhase.timers[sideIndex]) return;
    const targetTimer = curPhase.timers[sideIndex];
    toggleTimer(targetTimer.id);
  }, [phases, currentPhaseIndex, toggleTimer]);

  // 暂停当前环节全部计时
  const pauseAll = useCallback(() => {
    setPhases(prev => prev.map((p, pIdx) => {
      if (pIdx !== currentPhaseIndex) return p;
      return {
        ...p,
        timers: p.timers.map(t => {
          if (t.isRunning && t.usedSeconds > 2) {
            const side = p.timers[0].id === t.id ? 'affirmative' : 'negative';
            logSpeechRecord(t, p.name, side);
          }
          return { ...t, isRunning: false };
        })
      };
    }));
  }, [currentPhaseIndex, logSpeechRecord]);

  // 复位当前环节
  const resetCurrentPhase = useCallback(() => {
    // 重置提醒记录
    ringTrackerRef.current = {};
    setPhases(prev => prev.map((p, pIdx) => {
      if (pIdx !== currentPhaseIndex) return p;
      return {
        ...p,
        timers: p.timers.map(t => ({
          ...t,
          isRunning: false,
          remainingSeconds: t.durationSeconds,
          usedSeconds: 0,
          foulCount: 0
        }))
      };
    }));
  }, [currentPhaseIndex]);

  // 微调时间 (+/-)
  const adjustTimer = useCallback((timerId: string, deltaSeconds: number) => {
    setPhases(prev => prev.map((p, pIdx) => {
      if (pIdx !== currentPhaseIndex) return p;
      return {
        ...p,
        timers: p.timers.map(t => {
          if (t.id !== timerId) return t;
          const nextRemaining = t.remainingSeconds + deltaSeconds;
          // 重设提醒点，若补时回安全区允许再次响铃
          if (nextRemaining > t.warningSeconds && ringTrackerRef.current[t.id]) {
            ringTrackerRef.current[t.id].warningRinged = false;
            ringTrackerRef.current[t.id].zeroRinged = false;
          }
          return { ...t, remainingSeconds: nextRemaining };
        })
      };
    }));
  }, [currentPhaseIndex]);

  // 更新犯规计数
  const updateFoul = useCallback((timerId: string, delta: number) => {
    setPhases(prev => prev.map((p, pIdx) => {
      if (pIdx !== currentPhaseIndex) return p;
      return {
        ...p,
        timers: p.timers.map(t => {
          if (t.id !== timerId) return t;
          const newFoul = Math.max(0, t.foulCount + delta);
          return { ...t, foulCount: newFoul };
        })
      };
    }));
  }, [currentPhaseIndex]);

  // 切换正计时/倒计时
  const switchTimerMode = useCallback((timerId: string, mode: TimerMode) => {
    setPhases(prev => prev.map((p, pIdx) => {
      if (pIdx !== currentPhaseIndex) return p;
      return {
        ...p,
        timers: p.timers.map(t => t.id === timerId ? { ...t, mode } : t)
      };
    }));
  }, [currentPhaseIndex]);

  // 切换环节 (前进/后退)
  const changePhase = useCallback((targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= phases.length) return;
    pauseAll();
    ringTrackerRef.current = {};
    setCurrentPhaseIndex(targetIndex);
  }, [phases.length, pauseAll]);

  // 键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 避免输入框内部打字时误触
      const activeEl = document.activeElement;
      const isInputActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      if (isInputActive || isConfigOpen || isRecordDrawerOpen || isJsonModalOpen) return;

      if (e.code === 'Space') {
        e.preventDefault();
        const curPhase = phases[currentPhaseIndex];
        const anyRunning = curPhase?.timers.some(t => t.isRunning);
        if (anyRunning) {
          pauseAll();
        } else {
          // 默认启动第一个或保持原状
          if (curPhase && curPhase.timers[0]) {
            toggleTimer(curPhase.timers[0].id);
          }
        }
      } else if (e.code === 'Digit1' || e.code === 'Numpad1') {
        e.preventDefault();
        activateSpeakerBySide(0);
      } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
        e.preventDefault();
        activateSpeakerBySide(1);
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        triggerBell('single');
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        resetCurrentPhase();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        setSettings(p => ({ ...p, isMute: !p.isMute }));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        changePhase(currentPhaseIndex + 1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        changePhase(currentPhaseIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isConfigOpen,
    isRecordDrawerOpen,
    isJsonModalOpen,
    phases,
    currentPhaseIndex,
    pauseAll,
    toggleTimer,
    activateSpeakerBySide,
    triggerBell,
    resetCurrentPhase,
    changePhase
  ]);

  const currentPhase = phases[currentPhaseIndex] || {
    name: '开篇立论',
    type: PhaseType.STANDARD,
    timers: []
  };

  const isCurrentChessMode = currentPhase.chessMode ?? settings.isChessClockMode;
  const currentTheme = STAGE_THEMES[currentThemeId] || STAGE_THEMES['black-orange'];

  return (
    <div className={`min-h-screen flex flex-col ${currentTheme.bgClass} text-slate-100 transition-colors duration-300 ${isFullscreen ? 'p-4 sm:p-6 justify-between' : 'p-4 sm:p-6 md:p-8'}`}>
      
      {/* 顶部赛场信息条与全局操作 (Top Bar Contract: 3-Zone) */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        
        {/* Zone 1: 赛事名称与现场时钟 */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold border ${currentTheme.headerBadgeClass}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
            专业赛场控制台
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {matchInfo.tournamentTitle}
            </h1>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1 font-mono">
                <Clock size={12} className="text-slate-500" />
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span>·</span>
              <span>{currentTime.toLocaleDateString([], { month: 'numeric', day: 'numeric', weekday: 'short' })}</span>
            </div>
          </div>
        </div>

        {/* Zone 2: 拍铃试听与快捷提示 */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800">
          <button
            onClick={() => triggerBell('single')}
            className="flex items-center gap-1.5 hover:text-amber-400 transition-colors font-medium"
            title="快捷拍铃 (按 B 键)"
          >
            <Bell size={14} className="text-amber-400" />
            手动拍铃 [B]
          </button>
          <span>·</span>
          <button
            onClick={() => setSettings(p => ({ ...p, isMute: !p.isMute }))}
            className={`flex items-center gap-1.5 font-medium transition-colors ${
              settings.isMute ? 'text-red-400' : 'hover:text-blue-400'
            }`}
            title="声音静音开关 (按 M 键)"
          >
            {settings.isMute ? <BellOff size={14} /> : <Volume2 size={14} />}
            {settings.isMute ? '已静音 [M]' : '声效开启'}
          </button>
        </div>

        {/* Zone 3: 核心操作按钮与快捷主题切换 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 快速主题切换下拉菜单 */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setIsThemeMenuOpen(prev => !prev)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 transition-all active:scale-95 shadow-sm"
              title="快速切换赛事主题配色"
            >
              <div className="flex -space-x-1 items-center">
                <span className="w-3 h-3 rounded-full border border-slate-900 shadow" style={{ backgroundColor: currentTheme.dotColors[0] }} />
                <span className="w-3 h-3 rounded-full border border-slate-900 shadow" style={{ backgroundColor: currentTheme.dotColors[1] }} />
              </div>
              <span className="font-bold hidden sm:inline">{currentTheme.name}</span>
              <ChevronDown size={13} className={`text-slate-400 transition-transform ${isThemeMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isThemeMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0F1322] border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50">
                <div className="px-3 py-2 text-[11px] font-bold text-slate-400 border-b border-slate-800/80 flex items-center justify-between">
                  <span>切换大屏赛场配色</span>
                  <span className="text-[10px] text-orange-400">5款专业预设</span>
                </div>
                <div className="space-y-1 mt-1">
                  {(Object.keys(STAGE_THEMES) as ThemeId[]).map((tId) => {
                    const themeObj = STAGE_THEMES[tId];
                    const isSelected = tId === currentThemeId;
                    return (
                      <button
                        key={tId}
                        onClick={() => {
                          setCurrentThemeId(tId);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex -space-x-1 items-center">
                            <span className="w-3.5 h-3.5 rounded-full border border-black/50" style={{ backgroundColor: themeObj.dotColors[0] }} />
                            <span className="w-3.5 h-3.5 rounded-full border border-black/50" style={{ backgroundColor: themeObj.dotColors[1] }} />
                          </div>
                          <span>{themeObj.name}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-orange-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsRecordDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 transition-all active:scale-95 shadow-sm"
            title="查看发言与违规流水"
          >
            <FileText size={15} className="text-blue-400" />
            <span className="hidden sm:inline">发言流水</span>
            {records.length > 0 && (
              <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-400 rounded-md font-mono text-[10px]">
                {records.length}
              </span>
            )}
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 transition-all active:scale-95 shadow-sm"
            title="投影全屏模式 (按 F 键)"
          >
            {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            <span className="hidden sm:inline">{isFullscreen ? '退出全屏' : '全屏投影 [F]'}</span>
          </button>

          <button
            onClick={() => setIsJsonModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 transition-all active:scale-95 shadow-sm"
            title="导入或导出赛制 JSON 包"
          >
            <FileCode size={15} className="text-amber-400" />
            <span className="hidden sm:inline">导入/导出</span>
          </button>

          <button
            onClick={() => setIsConfigOpen(true)}
            className={`flex items-center gap-1.5 px-4 py-2 ${currentTheme.primaryAccentBg} text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg`}
          >
            <Settings size={15} />
            <span>配置赛制</span>
          </button>
        </div>
      </header>

      {/* 辩题展示条 (支持就地快速修改) */}
      <section className={`my-4 sm:my-6 p-4 sm:p-5 rounded-2xl border transition-all ${currentTheme.motionBarClass} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              辩论主辩题
            </span>
            <span className="text-xs text-slate-400">
              正方：<strong className="text-red-400">{matchInfo.affirmativeTeam}</strong> vs 反方：<strong className="text-blue-400">{matchInfo.negativeTeam}</strong>
            </span>
          </div>

          {isEditingMotion ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={motionDraft}
                onChange={e => setMotionDraft(e.target.value)}
                className="flex-1 bg-slate-900 border border-blue-500 px-3 py-1.5 rounded-lg text-white font-bold text-base focus:outline-none"
              />
              <button
                onClick={() => {
                  setMatchInfo(prev => ({ ...prev, motion: motionDraft }));
                  setIsEditingMotion(false);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setMotionDraft(matchInfo.motion);
                  setIsEditingMotion(false);
                }}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                取消
              </button>
            </div>
          ) : (
            <h2
              onClick={() => {
                setMotionDraft(matchInfo.motion);
                setIsEditingMotion(true);
              }}
              className="text-lg sm:text-2xl font-black text-white tracking-tight cursor-pointer hover:text-blue-300 transition-colors flex items-center gap-2 group"
              title="点击快速编辑辩题"
            >
              {matchInfo.motion}
              <Edit3 size={16} className="text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
            </h2>
          )}
        </div>

        {/* 赛段指示与棋钟状态 */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium">当前赛制模式</span>
            <span className="text-xs font-bold text-slate-200">
              {isCurrentChessMode ? '自由交替 (棋钟互锁)' : '常规单向发言'}
            </span>
          </div>
        </div>
      </section>

      {/* 赛程环节横向步进器 (Phase Progress Stepper) */}
      <nav className="mb-6 flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          disabled={currentPhaseIndex === 0}
          onClick={() => changePhase(currentPhaseIndex - 1)}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl disabled:opacity-20 transition-all active:scale-95 shrink-0"
          title="上一环节 (按 ← 键)"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
          {phases.map((phase, pIdx) => {
            const isActive = pIdx === currentPhaseIndex;
            const isCompleted = pIdx < currentPhaseIndex;
            return (
              <button
                key={phase.id}
                onClick={() => changePhase(pIdx)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all truncate shrink-0 border ${
                  isActive
                    ? currentTheme.activePhaseBtnClass
                    : isCompleted
                    ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    : 'bg-slate-900/40 text-slate-500 border-slate-800/60 hover:text-slate-300'
                }`}
              >
                <span className="w-5 h-5 rounded-md bg-black/30 flex items-center justify-center text-[10px] font-black font-mono">
                  {pIdx + 1}
                </span>
                <span className="truncate max-w-[120px] sm:max-w-[180px]">{phase.name}</span>
              </button>
            );
          })}
        </div>

        <button
          disabled={currentPhaseIndex === phases.length - 1}
          onClick={() => changePhase(currentPhaseIndex + 1)}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl disabled:opacity-20 transition-all active:scale-95 shrink-0"
          title="下一环节 (按 → 键)"
        >
          <ChevronRight size={20} />
        </button>
      </nav>

      {/* 赛场中心核心舞台对阵双栏 (Stage Duel Center) */}
      <main className="flex-1 flex flex-col items-center justify-center my-2">
        
        {/* 当前赛段大标题 */}
        <div className="text-center mb-6">
          <span className={`text-xs font-bold tracking-widest uppercase ${currentTheme.primaryAccentText}`}>
            第 0{currentPhaseIndex + 1} 环节 · 共 0{phases.length} 环节
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-1">
            {currentPhase.name}
          </h2>
          {currentPhase.description && (
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl mx-auto">
              {currentPhase.description}
            </p>
          )}
        </div>

        {/* 双计时器并列对抗区域 */}
        <div className="w-full max-w-7xl flex flex-col lg:flex-row items-stretch justify-center gap-6 sm:gap-8 px-2">
          {currentPhase.timers.map((t, idx) => {
            const isAff = idx === 0;
            return (
              <TimerBox
                key={t.id}
                id={t.id}
                label={t.label}
                teamName={isAff ? matchInfo.affirmativeTeam : matchInfo.negativeTeam}
                seconds={t.remainingSeconds}
                durationSeconds={t.durationSeconds}
                usedSeconds={t.usedSeconds}
                isRunning={t.isRunning}
                mode={t.mode}
                warningSeconds={t.warningSeconds}
                foulCount={t.foulCount}
                isAffirmative={isAff}
                settings={settings}
                theme={currentTheme}
                hotkeyNum={isAff ? '1' : '2'}
                onToggle={() => toggleTimer(t.id)}
                onReset={() => {
                  ringTrackerRef.current[t.id] = { warningRinged: false, zeroRinged: false, overtimeRinged: false };
                  setPhases(prev => prev.map((p, pIdx) => {
                    if (pIdx !== currentPhaseIndex) return p;
                    return {
                      ...p,
                      timers: p.timers.map(tm => tm.id === t.id ? { ...tm, isRunning: false, remainingSeconds: tm.durationSeconds, usedSeconds: 0, foulCount: 0 } : tm)
                    };
                  }));
                }}
                onAdjustTime={(d) => adjustTimer(t.id, d)}
                onSwitchMode={(m) => switchTimerMode(t.id, m)}
                onUpdateFoul={(d) => updateFoul(t.id, d)}
                onUpdateStep={(newStep) => setSettings(prev => ({ ...prev, timeStep: newStep }))}
              />
            );
          })}
        </div>

        {/* 赛场控制中枢工具栏 (Arena Master Controls) */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={pauseAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-200 transition-all active:scale-95 shadow-md"
          >
            <Pause size={15} fill="currentColor" />
            全部暂停 [Space]
          </button>

          <button
            onClick={() => {
              setPhases(prev => prev.map((p, pIdx) => {
                if (pIdx !== currentPhaseIndex) return p;
                return { ...p, chessMode: !p.chessMode };
              }));
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 shadow-md ${
              isCurrentChessMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300'
            }`}
          >
            <Zap size={15} fill={isCurrentChessMode ? 'currentColor' : 'none'} />
            自由对辩模式: {isCurrentChessMode ? '开启 (交替)' : '关闭 (独立)'}
          </button>

          <button
            onClick={resetCurrentPhase}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-red-950/30 border border-slate-700/80 hover:border-red-500/40 text-slate-300 hover:text-red-400 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md"
          >
            <RotateCcw size={15} />
            重置本环节 [R]
          </button>

          <button
            onClick={() => triggerBell('single')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-amber-950/30 border border-slate-700/80 hover:border-amber-500/40 text-slate-300 hover:text-amber-400 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md"
          >
            <Bell size={15} />
            拍铃一声 [B]
          </button>
        </div>
      </main>

      {/* 底部极速快捷键参考栏 (Footer Hotkey Strip) */}
      <footer className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>辩论赛场控制台运行中 · 拟真黄铜声学合成引擎就绪</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">Space</kbd> 启停</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">1 / 2</kbd> 正反方切换</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">← / →</kbd> 切环节</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">B</kbd> 拍铃</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">R</kbd> 复位</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">F</kbd> 全屏</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">M</kbd> 静音</span>
        </div>
      </footer>

      {/* 赛制配置弹窗 */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        phases={phases}
        matchInfo={matchInfo}
        settings={settings}
        currentThemeId={currentThemeId}
        onSelectTheme={setCurrentThemeId}
        onSave={(newPhases, newMatchInfo, newSettings) => {
          setPhases(newPhases);
          setMatchInfo(newMatchInfo);
          setSettings(newSettings);
          // 若删除了当前越界环节，重设索引
          if (currentPhaseIndex >= newPhases.length) {
            setCurrentPhaseIndex(Math.max(0, newPhases.length - 1));
          }
        }}
      />

      {/* 发言记录流水侧抽屉 */}
      <RecordDrawer
        isOpen={isRecordDrawerOpen}
        onClose={() => setIsRecordDrawerOpen(false)}
        records={records}
        matchInfo={matchInfo}
        onClearRecords={() => setRecords([])}
      />

      {/* 赛制 JSON 导入导出弹窗 */}
      <JsonTransferModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        phases={phases}
        matchInfo={matchInfo}
        settings={settings}
        onImport={(importedPhases, importedMatchInfo, importedSettings) => {
          setPhases(importedPhases);
          setMatchInfo(importedMatchInfo);
          if (importedSettings) setSettings(importedSettings);
          setCurrentPhaseIndex(0);
        }}
      />

    </div>
  );
};

export default App;
