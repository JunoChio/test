import React, { useState, useEffect } from 'react';
import { X, Download, Upload, Copy, Check, AlertTriangle, FileCode, CheckCircle2, ArrowRight } from 'lucide-react';
import { DebatePhase, MatchInfo, StageSettings } from '../types';

interface TournamentBundle {
  schema: string;
  version: string;
  exportTime: string;
  matchInfo: MatchInfo;
  settings: StageSettings;
  phases: DebatePhase[];
}

interface JsonTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  phases: DebatePhase[];
  matchInfo: MatchInfo;
  settings: StageSettings;
  onImport: (importedPhases: DebatePhase[], importedMatchInfo: MatchInfo, importedSettings?: StageSettings) => void;
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
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{
    phaseCount: number;
    motion: string;
    affTeam: string;
    negTeam: string;
    validData: TournamentBundle | null;
  } | null>(null);

  // 生成标准导出的 JSON 字符串
  const exportData: TournamentBundle = {
    schema: 'debate-stage-pro-v1',
    version: '1.0.0',
    exportTime: new Date().toISOString(),
    matchInfo,
    settings,
    phases
  };

  const exportJsonString = JSON.stringify(exportData, null, 2);

  // 每次打开重置状态
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setImportJsonText('');
      setImportError(null);
      setParsedPreview(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 下载 .json 文件
  const handleDownloadFile = () => {
    try {
      const blob = new Blob([exportJsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeTitle = matchInfo.tournamentTitle ? matchInfo.tournamentTitle.slice(0, 15).replace(/[\\/:*?"<>|]/g, '_') : '辩论赛制包';
      a.href = url;
      a.download = `${safeTitle}_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('下载文件失败，请使用复制文本功能');
    }
  };

  // 复制 JSON 文本
  const handleCopyJson = () => {
    navigator.clipboard.writeText(exportJsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      alert('复制失败，请手动选中文本框复制');
    });
  };

  // 解析并校验输入的 JSON 数据
  const validateAndParse = (rawText: string) => {
    setImportError(null);
    setParsedPreview(null);

    const trimmed = rawText.trim();
    if (!trimmed) {
      return;
    }

    try {
      const data = JSON.parse(trimmed);

      // 兼容两种结构：标准 Bundle 结构 或 纯 phases 数组
      let targetPhases: DebatePhase[] = [];
      let targetMatchInfo: MatchInfo = matchInfo;
      let targetSettings: StageSettings = settings;

      if (Array.isArray(data)) {
        // 纯环节数组
        targetPhases = data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.phases)) {
          targetPhases = data.phases;
        } else {
          throw new Error('未在数据中找到有效的辩论环节列表 (phases 数组)');
        }

        if (data.matchInfo && typeof data.matchInfo === 'object') {
          targetMatchInfo = {
            tournamentTitle: data.matchInfo.tournamentTitle || matchInfo.tournamentTitle,
            motion: data.matchInfo.motion || matchInfo.motion,
            affirmativeTeam: data.matchInfo.affirmativeTeam || matchInfo.affirmativeTeam,
            negativeTeam: data.matchInfo.negativeTeam || matchInfo.negativeTeam
          };
        }

        if (data.settings && typeof data.settings === 'object') {
          targetSettings = { ...settings, ...data.settings };
        }
      } else {
        throw new Error('JSON 格式必须为对象或环节数组');
      }

      if (targetPhases.length === 0) {
        throw new Error('赛制环节列表不能为空');
      }

      // 验证环节合法性并修补必要字段
      const validatedPhases: DebatePhase[] = targetPhases.map((p, idx) => ({
        id: p.id || `phase-imp-${idx}-${Date.now()}`,
        name: p.name || `第 ${idx + 1} 环节`,
        type: p.type || 'STANDARD',
        chessMode: Boolean(p.chessMode),
        timers: Array.isArray(p.timers) ? p.timers.map((t, ti) => {
          const duration = Math.max(5, parseInt(t.durationSeconds as any) || 180);
          return {
            id: t.id || `t-imp-${idx}-${ti}-${Date.now()}`,
            label: t.label || (ti === 0 ? '正方辩手' : '反方辩手'),
            durationSeconds: duration,
            remainingSeconds: duration,
            usedSeconds: 0,
            isRunning: false,
            mode: t.mode === 'stopwatch' ? 'stopwatch' : 'countdown',
            warningSeconds: typeof t.warningSeconds === 'number' ? t.warningSeconds : 30,
            foulCount: 0
          };
        }) : [
          { id: `t-imp-${idx}-0`, label: '正方辩手', durationSeconds: 180, remainingSeconds: 180, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
          { id: `t-imp-${idx}-1`, label: '反方辩手', durationSeconds: 180, remainingSeconds: 180, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 }
        ]
      }));

      const finalBundle: TournamentBundle = {
        schema: 'debate-stage-pro-v1',
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        matchInfo: targetMatchInfo,
        settings: targetSettings,
        phases: validatedPhases
      };

      setParsedPreview({
        phaseCount: validatedPhases.length,
        motion: targetMatchInfo.motion,
        affTeam: targetMatchInfo.affirmativeTeam,
        negTeam: targetMatchInfo.negativeTeam,
        validData: finalBundle
      });

    } catch (err: any) {
      setImportError(err.message || 'JSON 解析语法错误，请检查格式');
    }
  };

  // 处理文件读取
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJsonText(content);
        validateAndParse(content);
      }
    };
    reader.onerror = () => {
      setImportError('读取本地文件失败，请重试');
    };
    reader.readAsText(file);
  };

  // 执行最终导入
  const handleExecuteImport = () => {
    if (!parsedPreview?.validData) return;
    const { phases: newPhases, matchInfo: newMatchInfo, settings: newSettings } = parsedPreview.validData;
    onImport(newPhases, newMatchInfo, newSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#0B1120] border border-slate-700/80 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileCode size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">赛制配置导入与导出</h3>
              <p className="text-xs text-slate-400">以标准 JSON 赛事包分享或载入整场辩论配置</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 标签栏 */}
        <div className="px-6 pt-2 border-b border-slate-800 bg-slate-900/40 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-5 py-2.5 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download size={15} />
            导出当前赛制配置
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-5 py-2.5 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload size={15} />
            导入赛制配置包
          </button>
        </div>

        {/* 内容主体 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: 导出 */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white">完整赛事包导出就绪</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    已打包 {phases.length} 个辩论环节、时长与预警规则，以及当前辩题与对阵队伍
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors active:scale-95"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copied ? '已复制' : '复制 JSON 代码'}
                  </button>
                  <button
                    onClick={handleDownloadFile}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
                  >
                    <Download size={14} />
                    下载 .json 文件
                  </button>
                </div>
              </div>

              {/* JSON 预览框 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  JSON 代码预览 (可直接全选复制)
                </label>
                <textarea
                  readOnly
                  value={exportJsonString}
                  rows={12}
                  className="w-full bg-[#070B14] border border-slate-800 p-4 rounded-xl text-xs font-mono text-slate-300 focus:outline-none select-all resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: 导入 */}
          {activeTab === 'import' && (
            <div className="space-y-5">
              
              {/* 文件上传入口 */}
              <div className="p-5 border-2 border-dashed border-slate-700/80 hover:border-blue-500/60 rounded-2xl bg-slate-900/40 text-center transition-colors relative cursor-pointer group">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload size={20} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-200">点击选择本地 .json 文件</span>
                    <span className="text-xs text-slate-400 block mt-0.5">或将配置文件拖拽至此区域自动读取</span>
                  </div>
                </div>
              </div>

              {/* 文本粘贴输入 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    或者直接粘贴 JSON 代码
                  </label>
                  {importJsonText && (
                    <button
                      onClick={() => {
                        setImportJsonText('');
                        setParsedPreview(null);
                        setImportError(null);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-300"
                    >
                      清空输入
                    </button>
                  )}
                </div>
                <textarea
                  placeholder="在此粘贴他人分享给您的赛制 JSON 格式代码..."
                  value={importJsonText}
                  onChange={e => {
                    const text = e.target.value;
                    setImportJsonText(text);
                    validateAndParse(text);
                  }}
                  rows={6}
                  className="w-full bg-[#070B14] border border-slate-800 p-3.5 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* 错误提示 */}
              {importError && (
                <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-500/40 text-red-300 rounded-xl text-xs font-medium">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* 解析成功预览 */}
              {parsedPreview && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 size={16} />
                    配置解析成功，就绪导入！
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="p-2.5 bg-slate-900/60 rounded-lg">
                      <span className="text-slate-400 text-[11px] block">赛程环节</span>
                      <strong className="text-white font-mono text-sm">{parsedPreview.phaseCount} 个环节</strong>
                    </div>
                    <div className="p-2.5 bg-slate-900/60 rounded-lg">
                      <span className="text-slate-400 text-[11px] block">对阵队伍</span>
                      <span className="text-red-400 font-semibold">{parsedPreview.affTeam}</span>
                      <span className="text-slate-500 mx-1">vs</span>
                      <span className="text-blue-400 font-semibold">{parsedPreview.negTeam}</span>
                    </div>
                    <div className="sm:col-span-2 p-2.5 bg-slate-900/60 rounded-lg truncate">
                      <span className="text-slate-400 text-[11px] block">辩论主辩题</span>
                      <span className="text-slate-200 font-medium truncate">{parsedPreview.motion}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* 底部操作条 */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            关闭
          </button>

          {activeTab === 'import' && (
            <button
              onClick={handleExecuteImport}
              disabled={!parsedPreview?.validData}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            >
              <span>确认载入并应用此配置</span>
              <ArrowRight size={14} />
            </button>
          )}

          {activeTab === 'export' && (
            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            >
              <Download size={14} />
              <span>下载配置文件</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
