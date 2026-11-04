import React from 'react';
import { X, Download, Trash2, Copy, FileText, Check, ShieldAlert, Clock } from 'lucide-react';
import { DebateRecord, MatchInfo } from '../types';

interface RecordDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  records: DebateRecord[];
  matchInfo: MatchInfo;
  onClearRecords: () => void;
}

const formatSeconds = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}分${s}秒`;
};

export const RecordDrawer: React.FC<RecordDrawerProps> = ({
  isOpen,
  onClose,
  records,
  matchInfo,
  onClearRecords
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopyText = () => {
    let text = `【${matchInfo.tournamentTitle} 辩论赛程记录表】\n`;
    text += `辩题：${matchInfo.motion}\n`;
    text += `正方队伍：${matchInfo.affirmativeTeam}\n`;
    text += `反方队伍：${matchInfo.negativeTeam}\n`;
    text += `-------------------------------------------\n`;
    records.forEach((r, idx) => {
      text += `${idx + 1}. [${r.timestamp}] ${r.phaseName} - ${r.speakerLabel} (${r.side === 'affirmative' ? '正方' : '反方'})\n`;
      text += `   用时: ${formatSeconds(r.usedSeconds)} ${r.isOvertime ? '【已超时】' : ''} | 犯规次数: ${r.foulCount}\n`;
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    let csv = '\uFEFF序号,时间,环节,辩手,阵营,发言用时(秒),是否超时,犯规次数\n';
    records.forEach((r, idx) => {
      csv += `${idx + 1},${r.timestamp},"${r.phaseName}","${r.speakerLabel}",${r.side === 'affirmative' ? '正方' : '反方'},${Math.round(r.usedSeconds)},${r.isOvertime ? '是' : '否'},${r.foulCount}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `辩论赛发言流水_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-[#0B1120] border-l border-slate-700/80 h-full p-6 flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText size={20} className="text-blue-400" />
              发言与犯规记录流水
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              实时自动收录各辩手实际发言时长与违规罚分
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        {/* 顶部统计卡片 */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">已记录环节发言</span>
            <span className="text-2xl font-bold font-mono text-white">{records.length} 次</span>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">全场犯规统计</span>
            <span className="text-2xl font-bold font-mono text-amber-400">
              {records.reduce((acc, cur) => acc + cur.foulCount, 0)} 次
            </span>
          </div>
        </div>

        {/* 记录列表 */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {records.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
              <Clock size={32} strokeWidth={1.5} />
              <span>暂无发言记录，启动并暂停/切环节时将自动收录</span>
            </div>
          ) : (
            records.map((r, i) => (
              <div
                key={r.id || i}
                className="p-4 bg-slate-900/90 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        r.side === 'affirmative'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {r.side === 'affirmative' ? '正方' : '反方'}
                    </span>
                    <span className="font-bold text-white text-sm">{r.speakerLabel}</span>
                    <span className="text-slate-500 text-[11px]">· {r.phaseName}</span>
                  </div>
                  <div className="text-slate-400 text-[11px] flex items-center gap-2">
                    <span>记录时间: {r.timestamp}</span>
                    {r.foulCount > 0 && (
                      <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                        <ShieldAlert size={12} />
                        犯规 {r.foulCount} 次
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-mono font-bold text-white">
                    {formatSeconds(r.usedSeconds)}
                  </div>
                  {r.isOvertime && (
                    <span className="text-[10px] text-red-400 font-bold bg-red-950/40 px-1.5 py-0.5 rounded border border-red-800">
                      已超时
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部操作条 */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={onClearRecords}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-red-400 disabled:opacity-30 text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Trash2 size={14} />
            清空流水
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              disabled={records.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? '已复制' : '复制文本'}
            </button>
            <button
              onClick={handleExportCSV}
              disabled={records.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            >
              <Download size={14} />
              导出 CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
