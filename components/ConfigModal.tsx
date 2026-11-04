import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, Clock, Bell, Settings2, Trophy, 
  ArrowUp, ArrowDown, Volume2, Save, Undo2, Layers, Check, FileCode, Palette, Sparkles 
} from 'lucide-react';
import { DebatePhase, PhaseType, MatchInfo, StageSettings } from '../types';
import { TOURNAMENT_TEMPLATES, DEFAULT_MATCH_INFO } from '../templates';
import { bellSynthesizer } from '../audioBell';
import { JsonTransferModal } from './JsonTransferModal';
import { ThemeId, STAGE_THEMES } from '../themes';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  phases: DebatePhase[];
  matchInfo: MatchInfo;
  settings: StageSettings;
  currentThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  onSave: (newPhases: DebatePhase[], newMatchInfo: MatchInfo, newSettings: StageSettings) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  phases: initialPhases,
  matchInfo: initialMatchInfo,
  settings: initialSettings,
  currentThemeId,
  onSelectTheme,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'phases' | 'match' | 'theme' | 'settings'>('phases');
  
  // 确保初始状态即包含有效数据，防止空白
  const [phases, setPhases] = useState<DebatePhase[]>(() => {
    if (initialPhases && Array.isArray(initialPhases) && initialPhases.length > 0) {
      return JSON.parse(JSON.stringify(initialPhases));
    }
    return JSON.parse(JSON.stringify(TOURNAMENT_TEMPLATES['标准立论与自由辩 (通用推荐)']));
  });

  const [matchInfo, setMatchInfo] = useState<MatchInfo>(() => {
    return initialMatchInfo && initialMatchInfo.affirmativeTeam
      ? JSON.parse(JSON.stringify(initialMatchInfo))
      : DEFAULT_MATCH_INFO;
  });

  const [settings, setSettings] = useState<StageSettings>(() => {
    return initialSettings || {
      isMute: false,
      volume: 0.8,
      timeStep: 10,
      isChessClockMode: true,
      autoNextPhaseOnFinish: false,
      bellStyle: 'brass'
    };
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // 仅在弹窗从关闭变为打开时同步初始数据，避免计时器高频刷新的干扰
  useEffect(() => {
    if (isOpen) {
      if (initialPhases && Array.isArray(initialPhases) && initialPhases.length > 0) {
        setPhases(JSON.parse(JSON.stringify(initialPhases)));
      } else {
        setPhases(JSON.parse(JSON.stringify(TOURNAMENT_TEMPLATES['标准立论与自由辩 (通用推荐)'])));
      }

      if (initialMatchInfo && initialMatchInfo.affirmativeTeam) {
        setMatchInfo(JSON.parse(JSON.stringify(initialMatchInfo)));
      } else {
        setMatchInfo(DEFAULT_MATCH_INFO);
      }

      if (initialSettings) {
        setSettings(JSON.parse(JSON.stringify(initialSettings)));
      }

      setSelectedTemplate('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 添加新环节
  const handleAddPhase = () => {
    const newPhaseId = `phase-${Date.now()}`;
    const newPhase: DebatePhase = {
      id: newPhaseId,
      name: `第 ${phases.length + 1} 环节：新辩论阶段`,
      type: PhaseType.STANDARD,
      chessMode: false,
      timers: [
        {
          id: `t-${newPhaseId}-aff`,
          label: '正方辩手',
          durationSeconds: 180,
          remainingSeconds: 180,
          usedSeconds: 0,
          isRunning: false,
          mode: 'countdown',
          warningSeconds: 30,
          foulCount: 0
        },
        {
          id: `t-${newPhaseId}-neg`,
          label: '反方辩手',
          durationSeconds: 180,
          remainingSeconds: 180,
          usedSeconds: 0,
          isRunning: false,
          mode: 'countdown',
          warningSeconds: 30,
          foulCount: 0
        }
      ]
    };
    setPhases(prev => [...prev, newPhase]);
  };

  // 删除环节
  const handleDeletePhase = (index: number) => {
    if (phases.length <= 1) {
      alert('至少保留一个辩论环节');
      return;
    }
    setPhases(prev => prev.filter((_, i) => i !== index));
  };

  // 环节上移/下移
  const handleMovePhase = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= phases.length) return;
    const newArr = [...phases];
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;
    setPhases(newArr);
  };

  // 套用预设赛制模板
  const handleApplyTemplate = (tmplKey: string) => {
    if (TOURNAMENT_TEMPLATES[tmplKey]) {
      const cloned = JSON.parse(JSON.stringify(TOURNAMENT_TEMPLATES[tmplKey]));
      setPhases(cloned);
      setSelectedTemplate(tmplKey);
    }
  };

  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  // 保存并退出
  const handleSave = () => {
    onSave(phases, matchInfo, settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-5xl max-h-[92vh] bg-[#0B1120] border border-slate-700/80 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* 弹窗头部 */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Settings2 size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">赛制与赛事系统设置</h2>
              <p className="text-xs text-slate-400">自由增减赛程环节、设置辩手发言时长与对阵信息</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsJsonModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition-colors"
              title="导入或导出 JSON 赛制配置包"
            >
              <FileCode size={15} className="text-blue-400" />
              <span>导入 / 导出 JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 标签栏 */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-900/30 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('phases')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'phases'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={16} />
            环节流程编排 ({phases.length})
          </button>
          <button
            onClick={() => setActiveTab('match')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'match'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy size={16} />
            辩题与对阵队伍
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'theme'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette size={16} />
            视觉主题配色
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 size={16} />
            音效与操作偏好
          </button>
        </div>

        {/* 内容主体 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: 环节流程编排 */}
          {activeTab === 'phases' && (
            <div className="space-y-6">
              {/* 预设赛制快捷载入 */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
                <div className="text-xs font-semibold text-slate-400 mb-2">快速载入主流赛制模板：</div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(TOURNAMENT_TEMPLATES).map(tmplName => (
                    <button
                      key={tmplName}
                      onClick={() => handleApplyTemplate(tmplName)}
                      className={`text-xs px-3.5 py-1.5 rounded-lg border font-medium transition-all ${
                        selectedTemplate === tmplName
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      {tmplName}
                    </button>
                  ))}
                </div>
              </div>

              {/* 环节列表 */}
              <div className="space-y-4">
                {phases.length === 0 && (
                  <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 space-y-3">
                    <p className="text-sm">当前暂无任何辩论环节，您可以一键载入标准赛制：</p>
                    <button
                      onClick={() => setPhases(JSON.parse(JSON.stringify(TOURNAMENT_TEMPLATES['标准立论与自由辩 (通用推荐)'])))}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30"
                    >
                      载入标准立论与自由辩赛制
                    </button>
                  </div>
                )}
                {phases.map((phase, pIndex) => (
                  <div
                    key={phase.id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 transition-all"
                  >
                    {/* 环节标题与控制 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black flex items-center justify-center shrink-0">
                          {pIndex + 1}
                        </span>
                        <input
                          type="text"
                          value={phase.name}
                          onChange={e => {
                            const val = e.target.value;
                            setPhases(prev => prev.map((p, idx) => idx === pIndex ? { ...p, name: val } : p));
                          }}
                          placeholder="输入环节名称（如：第一环节 开篇立论）"
                          className="flex-1 bg-slate-800/80 border border-slate-700/80 px-3.5 py-2 rounded-xl text-white font-bold text-base focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 棋钟自由辩模式切换 */}
                        <button
                          onClick={() => {
                            setPhases(prev => prev.map((p, idx) => idx === pIndex ? { ...p, chessMode: !p.chessMode } : p));
                          }}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                            phase.chessMode
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                          title="自由辩论模式下双方交替倒计时"
                        >
                          {phase.chessMode ? '自由辩模式 (棋钟)' : '独立发言模式'}
                        </button>

                        {/* 上移/下移 */}
                        <button
                          disabled={pIndex === 0}
                          onClick={() => handleMovePhase(pIndex, 'up')}
                          className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-slate-300 transition-colors"
                          title="上移"
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          disabled={pIndex === phases.length - 1}
                          onClick={() => handleMovePhase(pIndex, 'down')}
                          className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-slate-300 transition-colors"
                          title="下移"
                        >
                          <ArrowDown size={15} />
                        </button>

                        {/* 删除 */}
                        <button
                          onClick={() => handleDeletePhase(pIndex)}
                          className="p-2 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                          title="删除该环节"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* 正反双方辩手时长与预警 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                      {(phase.timers && phase.timers.length >= 2 ? phase.timers : [
                        phase.timers?.[0] || { id: `t-${phase.id}-aff`, label: '正方辩手', durationSeconds: 180, remainingSeconds: 180, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
                        phase.timers?.[1] || { id: `t-${phase.id}-neg`, label: '反方辩手', durationSeconds: 180, remainingSeconds: 180, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 }
                      ]).map((timer, tIndex) => {
                        const isAff = tIndex === 0;
                        return (
                          <div
                            key={timer.id || `${phase.id}-${tIndex}`}
                            className={`p-4 rounded-xl border ${
                              isAff
                                ? 'bg-red-950/20 border-red-500/20'
                                : 'bg-blue-950/20 border-blue-500/20'
                            } space-y-3`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold ${
                                  isAff ? 'text-red-400' : 'text-blue-400'
                                }`}
                              >
                                {isAff ? '正方发言席' : '反方发言席'}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {Math.floor(timer.durationSeconds / 60)}分
                                {timer.durationSeconds % 60 > 0 ? `${timer.durationSeconds % 60}秒` : ''}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-1">
                                <label className="text-[10px] text-slate-400 block mb-1">辩手标签</label>
                                <input
                                  type="text"
                                  value={timer.label}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setPhases(prev => prev.map((p, idx) => {
                                      if (idx !== pIndex) return p;
                                      return {
                                        ...p,
                                        timers: p.timers.map((tm, ti) => ti === tIndex ? { ...tm, label: val } : tm)
                                      };
                                    }));
                                  }}
                                  className="w-full bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                                />
                              </div>

                              <div className="col-span-1">
                                <label className="text-[10px] text-slate-400 block mb-1">总时长(秒)</label>
                                <input
                                  type="number"
                                  min="5"
                                  step="5"
                                  value={timer.durationSeconds}
                                  onChange={e => {
                                    const val = Math.max(5, parseInt(e.target.value) || 0);
                                    setPhases(prev => prev.map((p, idx) => {
                                      if (idx !== pIndex) return p;
                                      return {
                                        ...p,
                                        timers: p.timers.map((tm, ti) => ti === tIndex ? { ...tm, durationSeconds: val, remainingSeconds: val } : tm)
                                      };
                                    }));
                                  }}
                                  className="w-full bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                                />
                              </div>

                              <div className="col-span-1">
                                <label className="text-[10px] text-slate-400 block mb-1">预警铃(秒)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={timer.warningSeconds}
                                  onChange={e => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    setPhases(prev => prev.map((p, idx) => {
                                      if (idx !== pIndex) return p;
                                      return {
                                        ...p,
                                        timers: p.timers.map((tm, ti) => ti === tIndex ? { ...tm, warningSeconds: val } : tm)
                                      };
                                    }));
                                  }}
                                  className="w-full bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* 添加环节按钮 */}
              <button
                onClick={handleAddPhase}
                className="w-full py-4 border-2 border-dashed border-slate-800 hover:border-blue-500/60 rounded-2xl text-slate-400 hover:text-blue-400 font-bold text-sm flex items-center justify-center gap-2 transition-all bg-slate-900/40 hover:bg-blue-500/5"
              >
                <Plus size={18} />
                添加新辩论环节
              </button>
            </div>
          )}

          {/* TAB 2: 辩题与对阵队伍 */}
          {activeTab === 'match' && (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">设置当前赛场的官方大会名称、辩题与对阵双方</span>
                <button
                  type="button"
                  onClick={() => setMatchInfo(DEFAULT_MATCH_INFO)}
                  className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 transition-colors"
                >
                  填入推荐示例队伍与辩题
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  赛事大会全称
                </label>
                <input
                  type="text"
                  value={matchInfo.tournamentTitle || ''}
                  onChange={e => setMatchInfo(prev => ({ ...prev, tournamentTitle: e.target.value }))}
                  placeholder="例如：2026 华语国际辩论锦标赛"
                  className="w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  辩论主辩题 (Motion)
                </label>
                <textarea
                  rows={3}
                  value={matchInfo.motion || ''}
                  onChange={e => setMatchInfo(prev => ({ ...prev, motion: e.target.value }))}
                  placeholder="例如：人工智能的发展对人类文化传承利大于弊 / 弊大于利"
                  className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white font-bold text-base focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2 p-4 rounded-xl bg-red-950/20 border border-red-500/30">
                  <label className="text-xs font-bold text-red-400 uppercase tracking-wider">
                    正方队伍名称
                  </label>
                  <input
                    type="text"
                    value={matchInfo.affirmativeTeam || ''}
                    onChange={e => setMatchInfo(prev => ({ ...prev, affirmativeTeam: e.target.value }))}
                    placeholder="例如：思辨先锋队"
                    className="w-full bg-slate-800 border border-slate-700 px-3.5 py-2.5 rounded-lg text-white font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-blue-950/20 border border-blue-500/30">
                  <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    反方队伍名称
                  </label>
                  <input
                    type="text"
                    value={matchInfo.negativeTeam || ''}
                    onChange={e => setMatchInfo(prev => ({ ...prev, negativeTeam: e.target.value }))}
                    placeholder="例如：格物立言队"
                    className="w-full bg-slate-800 border border-slate-700 px-3.5 py-2.5 rounded-lg text-white font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 视觉主题配色 */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              {/* 当前激活主题说明卡 */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-950/30 via-slate-900 to-amber-950/20 border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[11px] font-bold">
                      当前实时生效中
                    </span>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      {STAGE_THEMES[currentThemeId]?.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl">
                    {STAGE_THEMES[currentThemeId]?.tagline}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">大屏色标:</span>
                  <div className="flex items-center gap-1.5 p-1.5 bg-black/60 rounded-xl border border-slate-800">
                    <span 
                      className="w-5 h-5 rounded-lg border border-white/20 shadow" 
                      style={{ backgroundColor: STAGE_THEMES[currentThemeId]?.dotColors[0] }} 
                      title="主背景深色"
                    />
                    <span 
                      className="w-5 h-5 rounded-lg border border-white/20 shadow" 
                      style={{ backgroundColor: STAGE_THEMES[currentThemeId]?.dotColors[1] }} 
                      title="舞台高光色"
                    />
                  </div>
                </div>
              </div>

              {/* 5套预设主题选择卡片网格 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles size={16} className="text-orange-400" />
                    赛事大屏专属主题（点击卡片即刻全局换肤）
                  </h4>
                  <span className="text-xs text-slate-400">支持舞台抗光与电竞级高对比度</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(Object.keys(STAGE_THEMES) as ThemeId[]).map((themeKey) => {
                    const theme = STAGE_THEMES[themeKey];
                    const isSelected = themeKey === currentThemeId;

                    return (
                      <div
                        key={theme.id}
                        onClick={() => onSelectTheme(theme.id)}
                        className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 border-2 flex flex-col justify-between ${
                          isSelected
                            ? 'bg-slate-900/90 border-orange-500 shadow-xl shadow-orange-950/30 ring-2 ring-orange-500/20'
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                        }`}
                      >
                        {/* 顶部标题与色彩预览圆点 */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-1.5 items-center">
                                <span
                                  className="w-5 h-5 rounded-full border-2 border-slate-900 shadow-sm"
                                  style={{ backgroundColor: theme.dotColors[0] }}
                                />
                                <span
                                  className="w-5 h-5 rounded-full border-2 border-slate-900 shadow-sm"
                                  style={{ backgroundColor: theme.dotColors[1] }}
                                />
                              </div>
                              <span className="font-extrabold text-white text-base">
                                {theme.name}
                              </span>
                            </div>

                            {isSelected ? (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-full border border-orange-500/30">
                                <Check size={12} strokeWidth={3} /> 使用中
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500 group-hover:text-slate-300">
                                点击应用
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed mb-4">
                            {theme.tagline}
                          </p>
                        </div>

                        {/* 迷你计时器预览效果 */}
                        <div className="pt-3 border-t border-slate-800/80 bg-black/40 -mx-4 -mb-4 p-3 rounded-b-2xl">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span>正反方计时色彩演示</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className={`p-2 rounded-lg text-center ${theme.sideBadge.aff}`}>
                              <span className="text-[10px] block font-medium opacity-80">正方辩手</span>
                              <span className={`text-base font-black font-mono leading-none ${theme.timerDigitClass.aff}`}>
                                03:00
                              </span>
                            </div>
                            <div className={`p-2 rounded-lg text-center ${theme.sideBadge.neg}`}>
                              <span className="text-[10px] block font-medium opacity-80">反方辩手</span>
                              <span className={`text-base font-black font-mono leading-none ${theme.timerDigitClass.neg}`}>
                                03:00
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 配色对照规范说明 */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>💡 提示：主题设置实时同步至浏览器本地缓存，全屏投影和双计时卡片均会同步呈现对应光效与色调。</span>
              </div>
            </div>
          )}

          {/* TAB 4: 音效与操作偏好 */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">黄铜拍铃音效试听</h4>
                    <p className="text-xs text-slate-400">使用 Web Audio API 多泛音合成，模拟赛场黄铜敲击音</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => bellSynthesizer.play('single', settings.volume)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                    >
                      单响 (30s)
                    </button>
                    <button
                      onClick={() => bellSynthesizer.play('double', settings.volume)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                    >
                      双响 (到时)
                    </button>
                    <button
                      onClick={() => bellSynthesizer.play('triple', settings.volume)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                    >
                      三响 (违规)
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">音效音量</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.volume}
                      onChange={e => setSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                      className="w-32 accent-blue-500"
                    />
                    <span className="text-xs font-mono text-slate-400 w-8">
                      {Math.round(settings.volume * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">补时与扣时步长</h4>
                    <p className="text-xs text-slate-400">计时卡片上加减按钮单次微调的秒数</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[5, 10, 15, 30].map(s => (
                      <button
                        key={s}
                        onClick={() => setSettings(prev => ({ ...prev, timeStep: s }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          settings.timeStep === s
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {s}秒
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-300">全局静音模式</span>
                    <p className="text-[11px] text-slate-500">关闭所有拍铃与倒计时提醒声音</p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, isMute: !prev.isMute }))}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      settings.isMute ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {settings.isMute ? '已静音' : '声音开启'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 弹窗底部操作 */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            放弃修改
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            <Save size={16} />
            保存赛制配置
          </button>
        </div>

      </div>

      {/* JSON 导入导出弹窗 */}
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
        }}
      />
    </div>
  );
};
