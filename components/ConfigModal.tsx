import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, Clock, Bell, Settings2, Trophy, 
  ArrowUp, ArrowDown, Volume2, Save, Undo2, Layers, Check, FileCode 
} from 'lucide-react';
import { DebatePhase, PhaseType, MatchInfo, StageSettings } from '../types';
import { TOURNAMENT_TEMPLATES } from '../templates';
import { bellSynthesizer } from '../audioBell';
import { JsonTransferModal } from './JsonTransferModal';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  phases: DebatePhase[];
  matchInfo: MatchInfo;
  settings: StageSettings;
  onSave: (newPhases: DebatePhase[], newMatchInfo: MatchInfo, newSettings: StageSettings) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  phases: initialPhases,
  matchInfo: initialMatchInfo,
  settings: initialSettings,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'phases' | 'match' | 'settings'>('phases');
  const [phases, setPhases] = useState<DebatePhase[]>([]);
  const [matchInfo, setMatchInfo] = useState<MatchInfo>(initialMatchInfo);
  const [settings, setSettings] = useState<StageSettings>(initialSettings);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isJsonTransferOpen, setIsJsonTransferOpen] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  // 仅在弹窗打开时从 props 同步一次初始状态，避免在弹窗内编辑时被父组件计时器循环重置！
  useEffect(() => {
    if (isOpen) {
      setPhases(JSON.parse(JSON.stringify(initialPhases)));
      setMatchInfo(JSON.parse(JSON.stringify(initialMatchInfo)));
      setSettings(JSON.parse(JSON.stringify(initialSettings)));
      setSelectedTemplate('');
      setNoticeMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 添加新环节
  const handleAddPhase = () => {
    const newPhaseId = `phase-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
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
    setNoticeMsg(`已成功添加第 ${phases.length + 1} 环节，请在下方设置发言时长与标题`);
    setTimeout(() => setNoticeMsg(null), 3500);
  };

  // 删除环节（允许删除任意环节）
  const handleDeletePhase = (index: number) => {
    const removedName = phases[index]?.name || '环节';
    setPhases(prev => prev.filter((_, i) => i !== index));
    setNoticeMsg(`已删除「${removedName}」`);
    setTimeout(() => setNoticeMsg(null), 2500);
  };

  // 一键清空所有环节
  const handleClearAllPhases = () => {
    if (phases.length === 0) return;
    if (window.confirm('确定要清空当前所有辩论环节吗？清空后您可以重新添加或套用模板。')) {
      setPhases([]);
      setSelectedTemplate('');
      setNoticeMsg('已清空所有环节，您可以重新添加或套用赛制模板');
      setTimeout(() => setNoticeMsg(null), 3000);
    }
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
      // 为每个环节及计时器生成全新唯一 ID
      const freshPhases: DebatePhase[] = cloned.map((p: DebatePhase, idx: number) => ({
        ...p,
        id: `phase-${Date.now()}-${idx}`,
        timers: p.timers.map((t, tIdx) => ({
          ...t,
          id: `timer-${Date.now()}-${idx}-${tIdx}`
        }))
      }));
      setPhases(freshPhases);
      setSelectedTemplate(tmplKey);
      setNoticeMsg(`已成功载入「${tmplKey}」，共 ${freshPhases.length} 个赛段环节`);
      setTimeout(() => setNoticeMsg(null), 3500);
    }
  };

  // 保存并退出
  const handleSave = () => {
    if (phases.length === 0) {
      alert('请至少保留或添加一个辩论环节后再保存');
      return;
    }
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
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 标签栏与导入导出快捷入口 */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-900/30 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
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

          <button
            onClick={() => setIsJsonTransferOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 mb-2 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700/80 rounded-xl text-xs font-bold transition-all shadow-sm"
            title="一键导出或导入完整赛制 JSON 文件"
          >
            <FileCode size={15} />
            导入 / 导出 JSON
          </button>
        </div>

        {/* 内容主体 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 操作即时反馈条 */}
          {noticeMsg && (
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300 font-bold animate-in fade-in shadow-lg">
              <Check size={16} className="text-emerald-400 shrink-0" />
              <span>{noticeMsg}</span>
            </div>
          )}

          {/* TAB 1: 环节流程编排 */}
          {activeTab === 'phases' && (
            <div className="space-y-6">
              {/* 预设赛制快捷载入与快速新建 */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-2">快速载入主流赛制模板（点击即套用）：</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(TOURNAMENT_TEMPLATES).map(tmplName => (
                      <button
                        type="button"
                        key={tmplName}
                        onClick={() => handleApplyTemplate(tmplName)}
                        className={`text-xs px-3.5 py-1.5 rounded-lg border font-medium transition-all ${
                          selectedTemplate === tmplName
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {tmplName}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                  {phases.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllPhases}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-700/80 hover:border-red-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                      title="一键清空全部辩论环节"
                    >
                      <Trash2 size={15} />
                      清空全部 ({phases.length})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleAddPhase}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                  >
                    <Plus size={16} />
                    + 添加新环节
                  </button>
                </div>
              </div>

              {/* 环节列表或空状态 */}
              {phases.length === 0 ? (
                <div className="py-12 px-6 rounded-2xl bg-slate-900/40 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
                    <Layers size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">当前暂无任何辩论环节</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      已全部清空。您可以点击上方模板一键载入赛制，或点击「+ 添加新环节」定制专属环节。
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate('标准立论与自由辩 (通用推荐)')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      载入推荐赛制
                    </button>
                    <button
                      type="button"
                      onClick={handleAddPhase}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={16} />
                      添加第一个环节
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
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
                      {phase.timers.map((timer, tIndex) => {
                        const isAff = tIndex === 0;
                        return (
                          <div
                            key={timer.id}
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
            )}

              {/* 添加环节按钮 */}
              <button
                type="button"
                onClick={handleAddPhase}
                className="w-full py-4 border-2 border-dashed border-slate-800 hover:border-blue-500/60 rounded-2xl text-slate-400 hover:text-blue-400 font-bold text-sm flex items-center justify-center gap-2 transition-all bg-slate-900/40 hover:bg-blue-500/5 active:scale-98"
              >
                <Plus size={18} />
                添加新辩论环节
              </button>
            </div>
          )}

          {/* TAB 2: 辩题与对阵队伍 */}
          {activeTab === 'match' && (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  赛事大会全称
                </label>
                <input
                  type="text"
                  value={matchInfo.tournamentTitle}
                  onChange={e => setMatchInfo(prev => ({ ...prev, tournamentTitle: e.target.value }))}
                  placeholder="例如：2026 华语国际辩论锦标赛"
                  className="w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 tracking-wider">
                  辩论主辩题
                </label>
                <textarea
                  rows={3}
                  value={matchInfo.motion}
                  onChange={e => setMatchInfo(prev => ({ ...prev, motion: e.target.value }))}
                  placeholder="例如：人工智能的发展对人类文化传承利大于弊 / 弊大于利"
                  className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white font-bold text-base focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2 p-4 rounded-xl bg-red-950/20 border border-red-500/30">
                  <label className="text-xs font-bold text-red-400 tracking-wider">
                    正方队伍名称
                  </label>
                  <input
                    type="text"
                    value={matchInfo.affirmativeTeam}
                    onChange={e => setMatchInfo(prev => ({ ...prev, affirmativeTeam: e.target.value }))}
                    placeholder="例如：思辨先锋队"
                    className="w-full bg-slate-800 border border-slate-700 px-3.5 py-2.5 rounded-lg text-white font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-blue-950/20 border border-blue-500/30">
                  <label className="text-xs font-bold text-blue-400 tracking-wider">
                    反方队伍名称
                  </label>
                  <input
                    type="text"
                    value={matchInfo.negativeTeam}
                    onChange={e => setMatchInfo(prev => ({ ...prev, negativeTeam: e.target.value }))}
                    placeholder="例如：格物立言队"
                    className="w-full bg-slate-800 border border-slate-700 px-3.5 py-2.5 rounded-lg text-white font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 音效与操作偏好 */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">黄铜拍铃音效试听</h4>
                    <p className="text-xs text-slate-400">内置物理声学多泛音合成，模拟赛场黄铜敲击音</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => bellSynthesizer.play('single', settings.volume)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                    >
                      单响 (30秒)
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

      {/* JSON 模板导入与导出模态窗 */}
      <JsonTransferModal
        isOpen={isJsonTransferOpen}
        onClose={() => setIsJsonTransferOpen(false)}
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
