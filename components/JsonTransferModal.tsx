import React, { useState } from 'react';
import { X, Download, Upload, Copy, Check, FileCode, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { DebatePhase, MatchInfo, StageSettings, PhaseType } from '../types';

interface JsonTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  phases: DebatePhase[];
  matchInfo: MatchInfo;
  settings: StageSettings;
  onImport: (phases: DebatePhase[], matchInfo: MatchInfo, settings?: StageSettings) => void;
}

export const JsonTransferModal: React.FC<JsonTransferModalProps> = ({
  isOpen,
  onClose,
  phases,
  matchInfo,
  settings,
  onImport
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  
  // 导入状态
  const [importText, setImportText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{
    phasesCount: number;
    tournamentTitle: string;
    motion: string;
    affirmativeTeam: string;
    negativeTeam: string;
    data: { phases: DebatePhase[]; matchInfo: MatchInfo; settings?: StageSettings };
  } | null>(null);

  if (!isOpen) return null;

  // 构造完整赛事包数据结构
  const exportPayload = {
    schema: 'debate-stage-pro-v1',
    exportTime: new Date().toISOString(),
    matchInfo: {
      tournamentTitle: matchInfo.tournamentTitle,
      motion: matchInfo.motion,
      affirmativeTeam: matchInfo.affirmativeTeam,
      negativeTeam: matchInfo.negativeTeam,
    },
    settings: {
      timeStep: settings.timeStep,
      isChessClockMode: settings.isChessClockMode,
      volume: settings.volume,
      bellStyle: settings.bellStyle,
    },
    phases: phases.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      type: p.type,
      chessMode: p.chessMode,
      timers: p.timers.map(t => ({
        id: t.id,
        label: t.label,
        durationSeconds: t.durationSeconds,
        remainingSeconds: t.durationSeconds, // 导出时重置回完整时长
        usedSeconds: 0,
        isRunning: false,
        mode: t.mode,
        warningSeconds: t.warningSeconds,
        foulCount: 0
      }))
    }))
  };

  const exportJsonString = JSON.stringify(exportPayload, null, 2);

  // 一键复制
  const handleCopy = () => {
    navigator.clipboard.writeText(exportJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 一键下载文件
  const handleDownload = () => {
    const cleanMotion = (matchInfo.motion || '辩论赛制').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 15);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `${cleanMotion}_赛制配置_${dateStr}.json`;

    const blob = new Blob([exportJsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 处理文本输入解析
  const handleValidateImportText = (text: string) => {
    setImportText(text);
    setParseError(null);
    setParsedPreview(null);

    if (!text.trim()) return;

    try {
      const parsed = JSON.parse(text);

      // 兼容直接是 phases 数组，或是包含 matchInfo/phases 的完整赛事包
      let targetPhases: DebatePhase[] = [];
      let targetMatchInfo: MatchInfo = { ...matchInfo };
      let targetSettings: StageSettings | undefined = undefined;

      if (Array.isArray(parsed)) {
        targetPhases = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.phases)) {
          targetPhases = parsed.phases;
        } else {
          throw new Error('未在数据中找到有效的 phases 环节列表数组');
        }

        if (parsed.matchInfo && typeof parsed.matchInfo === 'object') {
          targetMatchInfo = {
            tournamentTitle: parsed.matchInfo.tournamentTitle || targetMatchInfo.tournamentTitle,
            motion: parsed.matchInfo.motion || targetMatchInfo.motion,
            affirmativeTeam: parsed.matchInfo.affirmativeTeam || targetMatchInfo.affirmativeTeam,
            negativeTeam: parsed.matchInfo.negativeTeam || targetMatchInfo.negativeTeam,
          };
        }

        if (parsed.settings && typeof parsed.settings === 'object') {
          targetSettings = {
            ...settings,
            ...parsed.settings
          };
        }
      }

      if (targetPhases.length === 0) {
        throw new Error('环节列表不能为空，请至少包含 1 个辩论环节');
      }

      // 规范化环节内部 timers
      const sanitizedPhases: DebatePhase[] = targetPhases.map((p, idx) => ({
        id: p.id || `imported-phase-${Date.now()}-${idx}`,
        name: p.name || `第 ${idx + 1} 环节`,
        description: p.description,
        type: p.type || PhaseType.STANDARD,
        chessMode: Boolean(p.chessMode),
        timers: Array.isArray(p.timers) && p.timers.length > 0 ? p.timers.map((t, tIdx) => ({
          id: t.id || `timer-${idx}-${tIdx}-${Date.now()}`,
          label: t.label || (tIdx === 0 ? '正方辩手' : '反方辩手'),
          durationSeconds: Number(t.durationSeconds) > 0 ? Number(t.durationSeconds) : 180,
          remainingSeconds: Number(t.durationSeconds) > 0 ? Number(t.durationSeconds) : 180,
          usedSeconds: 0,
          isRunning: false,
          mode: t.mode === 'stopwatch' ? 'stopwatch' : 'countdown',
          warningSeconds: Number(t.warningSeconds) >= 0 ? Number(t.warningSeconds) : 30,
          foulCount: 0
        })) : [
          {
            id: `t1-${idx}-${Date.now()}`,
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
            id: `t2-${idx}-${Date.now()}`,
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
      }));

      setParsedPreview({
        phasesCount: sanitizedPhases.length,
        tournamentTitle: targetMatchInfo.tournamentTitle,
        motion: targetMatchInfo.motion,
        affirmativeTeam: targetMatchInfo.affirmativeTeam,
        negativeTeam: targetMatchInfo.negativeTeam,
        data: {
          phases: sanitizedPhases,
          matchInfo: targetMatchInfo,
          settings: targetSettings
        }
      });
    } catch (err: any) {
      setParseError(err.message || 'JSON 格式解析失败，请检查语法结构');
    }
  };

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleValidateImportText(content);
      }
    };
    reader.readAsText(file);
    // 重置 input 以便再次选择同一文件
    e.target.value = '';
  };

  // 确认导入生效
  const handleConfirmImport = () => {
    if (!parsedPreview) return;
    onImport(
      parsedPreview.data.phases,
      parsedPreview.data.matchInfo,
      parsedPreview.data.settings
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#0B1120] border border-slate-700/80 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileCode size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">赛制配置模板共享</h2>
              <p className="text-xs text-slate-400">一键导出或导入包含赛制环节、辩题与对阵队伍的完整赛事包</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 标签切换 */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-900/30 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-5 py-2.5 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download size={16} />
            导出赛制包
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-5 py-2.5 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload size={16} />
            导入赛制包
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: 导出 */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              {/* 赛事摘要卡片 */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">赛事全称</span>
                  <span className="font-bold text-white truncate block">{matchInfo.tournamentTitle}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">对阵双方</span>
                  <span className="font-bold text-white truncate block">
                    <span className="text-red-400">{matchInfo.affirmativeTeam}</span> 对阵 <span className="text-blue-400">{matchInfo.negativeTeam}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">包含环节数量</span>
                  <span className="font-bold text-blue-400 font-mono">{phases.length} 个赛段环节</span>
                </div>
              </div>

              {/* 代码展示区 */}
              <div className="relative">
                <div className="flex items-center justify-between pb-2 text-xs text-slate-400">
                  <span>完整配置 JSON 预览：</span>
                  <span>可直接复制或下载分享</span>
                </div>
                <pre className="w-full h-72 sm:h-80 bg-black/60 border border-slate-800 rounded-xl p-4 overflow-auto text-xs font-mono text-emerald-400/90 leading-relaxed scrollbar-thin">
                  {exportJsonString}
                </pre>
              </div>

              {/* 导出操作条 */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all active:scale-95"
                >
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  {copied ? '已成功复制 JSON 代码' : '复制代码到剪贴板'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
                >
                  <Download size={16} />
                  下载 .json 配置文件
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: 导入 */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              
              {/* 文件上传触发区 */}
              <div className="relative border-2 border-dashed border-slate-700/80 hover:border-blue-500/80 bg-slate-900/40 hover:bg-blue-500/5 rounded-2xl p-6 text-center transition-all cursor-pointer group">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Upload size={22} />
                  </div>
                  <div className="text-sm font-bold text-white">点击选择或拖拽 .json 配置文件到此处</div>
                  <div className="text-xs text-slate-400">支持读取由本系统导出的完整赛事配置文件</div>
                </div>
              </div>

              {/* 或者粘贴 JSON 文本 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>或者直接粘贴 JSON 文本：</span>
                  {importText && (
                    <button
                      onClick={() => handleValidateImportText('')}
                      className="text-slate-500 hover:text-slate-300"
                    >
                      清空输入
                    </button>
                  )}
                </div>
                <textarea
                  rows={6}
                  value={importText}
                  onChange={e => handleValidateImportText(e.target.value)}
                  placeholder="在此处粘贴他人分享的 JSON 配置代码..."
                  className="w-full bg-slate-900/80 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none scrollbar-thin"
                />
              </div>

              {/* 解析错误提示 */}
              {parseError && (
                <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* 解析成功预览 */}
              {parsedPreview && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 size={16} />
                    配置校验成功！请确认以下载入信息：
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-black/40 p-3 rounded-xl border border-emerald-500/20">
                    <div>
                      <span className="text-slate-400 block text-[11px]">赛事名称</span>
                      <span className="font-semibold text-white">{parsedPreview.tournamentTitle}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">环节数量</span>
                      <span className="font-semibold text-blue-400 font-mono">{parsedPreview.phasesCount} 个赛段环节</span>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <span className="text-slate-400 block text-[11px]">辩题</span>
                      <span className="font-semibold text-amber-300">{parsedPreview.motion}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">正方队伍</span>
                      <span className="font-semibold text-red-400">{parsedPreview.affirmativeTeam}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">反方队伍</span>
                      <span className="font-semibold text-blue-400">{parsedPreview.negativeTeam}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <button
                      onClick={handleConfirmImport}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                    >
                      <Check size={16} />
                      确认覆盖并应用到当前赛场
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
