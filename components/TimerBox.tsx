import React from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, AlertTriangle, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { TimerMode, StageSettings } from '../types';

interface TimerBoxProps {
  id: string;
  label: string;
  teamName: string;
  seconds: number;
  durationSeconds: number;
  usedSeconds: number;
  isRunning: boolean;
  mode: TimerMode;
  warningSeconds: number;
  foulCount: number;
  isAffirmative: boolean;
  settings: StageSettings;
  hotkeyNum: string; // "1" for Affirmative, "2" for Negative
  onToggle: () => void;
  onReset: () => void;
  onAdjustTime: (delta: number) => void;
  onSwitchMode: (m: TimerMode) => void;
  onUpdateFoul: (delta: number) => void;
  onUpdateStep?: (step: number) => void;
}

const formatTime = (totalSecs: number) => {
  const isNeg = totalSecs < 0;
  const abs = Math.abs(totalSecs);
  const m = Math.floor(abs / 60).toString().padStart(2, '0');
  const s = Math.floor(abs % 60).toString().padStart(2, '0');
  const ms = Math.floor((abs % 1) * 10).toString(); // tenth of second
  return { m, s, ms, isNeg };
};

export const TimerBox: React.FC<TimerBoxProps> = ({
  label,
  teamName,
  seconds,
  durationSeconds,
  usedSeconds,
  isRunning,
  mode,
  warningSeconds,
  foulCount,
  isAffirmative,
  settings,
  hotkeyNum,
  onToggle,
  onReset,
  onAdjustTime,
  onSwitchMode,
  onUpdateFoul,
  onUpdateStep
}) => {
  const [localStep, setLocalStep] = React.useState(settings.timeStep || 10);

  React.useEffect(() => {
    if (settings.timeStep) {
      setLocalStep(settings.timeStep);
    }
  }, [settings.timeStep]);

  const handleStepChange = (newStep: number) => {
    const safe = Math.max(1, Math.min(300, newStep));
    setLocalStep(safe);
    if (onUpdateStep) {
      onUpdateStep(safe);
    }
  };

  const currentTime = mode === 'countdown' ? seconds : usedSeconds;
  const { m, s, ms, isNeg } = formatTime(currentTime);

  const isOvertime = isNeg && mode === 'countdown';
  const isNearWarning = !isOvertime && mode === 'countdown' && seconds <= warningSeconds && seconds > 0;
  
  // Progress fraction (0 to 1)
  const progressRatio = durationSeconds > 0 ? Math.min(1, Math.max(0, 1 - (seconds / durationSeconds))) : 0;

  // Visual classes based on state
  const sideColor = isAffirmative ? 'red' : 'blue';

  let digitColorClass = isAffirmative ? 'text-red-400' : 'text-blue-400';
  let glowClass = '';
  if (isOvertime) {
    digitColorClass = 'text-red-500';
    glowClass = 'glow-red';
  } else if (isNearWarning) {
    digitColorClass = 'text-amber-400';
    glowClass = 'glow-amber';
  } else if (isRunning) {
    glowClass = isAffirmative ? 'glow-red' : 'glow-blue';
  }

  const borderClass = isRunning
    ? isAffirmative
      ? 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.35)]'
      : 'border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.35)]'
    : 'border-slate-800/80 hover:border-slate-700';

  const bgGradient = isAffirmative
    ? isRunning ? 'bg-gradient-to-b from-red-950/30 to-slate-900/90' : 'bg-slate-900/70'
    : isRunning ? 'bg-gradient-to-b from-blue-950/30 to-slate-900/90' : 'bg-slate-900/70';

  return (
    <div
      className={`relative flex-1 min-w-[320px] max-w-[760px] rounded-3xl border-2 ${borderClass} ${bgGradient} p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 stage-box-shadow backdrop-blur-xl select-none`}
    >
      {/* 顶部阵营与状态栏 */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-md text-xs font-bold tracking-wider ${
              isAffirmative
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}
          >
            {isAffirmative ? '正方' : '反方'}
          </span>
          <span className="text-sm font-semibold text-slate-300 truncate max-w-[160px] sm:max-w-[220px]">
            {teamName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isRunning ? (
            <span
              className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md ${
                isAffirmative ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white animate-pulse'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white"></span>
              发言中
            </span>
          ) : (
            <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md">
              就绪
            </span>
          )}

          <button
            onClick={() => onSwitchMode(mode === 'countdown' ? 'stopwatch' : 'countdown')}
            className="text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-2 py-1 rounded border border-slate-700/60 transition-colors"
            title="切换计时模式"
          >
            {mode === 'countdown' ? '倒计时' : '正计时'}
          </button>
        </div>
      </div>

      {/* 辩手标签与预警状态 */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {label}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            总时长 {Math.floor(durationSeconds / 60)}分{durationSeconds % 60 > 0 ? `${durationSeconds % 60}秒` : ''} · 剩{warningSeconds}秒预警
          </p>
        </div>

        {isOvertime && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 text-white text-xs font-bold rounded-lg animate-bounce shadow-lg shadow-red-500/30">
            <AlertTriangle size={15} />
            已超时
          </div>
        )}

        {isNearWarning && !isOvertime && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg animate-pulse">
            <AlertTriangle size={14} />
            准备结语
          </div>
        )}
      </div>

      {/* 核心大屏数字显示区域 */}
      <div
        onClick={onToggle}
        className="my-6 py-6 sm:py-8 bg-black/40 rounded-2xl border border-slate-800/60 flex flex-col items-center justify-center cursor-pointer group hover:border-slate-700 transition-all relative overflow-hidden"
      >
        {/* 顶部进度条 */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              isAffirmative ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>

        <div className={`digit-mono flex items-baseline justify-center transition-all ${digitColorClass} ${glowClass}`}>
          {isOvertime && <span className="text-4xl sm:text-5xl font-black mr-2 text-red-500">+</span>}
          <span className="text-6xl sm:text-8xl lg:text-9xl font-black leading-none tracking-tight">
            {m}:{s}
          </span>
          <span className="text-2xl sm:text-3xl lg:text-4xl font-bold opacity-40 ml-2">
            .{ms}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-slate-500" />
            已用时: <span className="text-slate-200 font-mono font-semibold">{formatTime(usedSeconds).m}:{formatTime(usedSeconds).s}</span>
          </span>
          <span>·</span>
          <span className="text-slate-400 group-hover:text-slate-200 transition-colors">
            点击卡片或按 [{hotkeyNum}] 切换
          </span>
        </div>
      </div>

      {/* 控制操作区：补扣时、主控制启停、复位、犯规记录 */}
      <div className="space-y-4">
        {/* 时间微调与犯规 */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* 自由自定义微调秒数与补扣时按钮 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-semibold">微调:</span>
            
            {/* 可自由输入任意秒数的输入框 */}
            <div className="flex items-center bg-slate-900 border border-slate-700 hover:border-blue-500/80 focus-within:border-blue-500 rounded-lg px-2 py-1 shadow-inner transition-colors">
              <input
                type="number"
                min="1"
                max="600"
                value={localStep}
                onChange={e => handleStepChange(parseInt(e.target.value) || 1)}
                className="w-9 text-center font-mono font-black text-amber-300 text-xs bg-transparent focus:outline-none"
                title="可自由输入任意秒数 (例如 1秒、5秒、15秒、30秒、60秒)"
              />
              <span className="text-[10px] text-slate-400 select-none">秒</span>
            </div>

            {/* 动态加时/补时按钮 */}
            <button
              onClick={() => onAdjustTime(localStep)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-emerald-950/40 text-emerald-300 hover:text-emerald-200 border border-slate-700 hover:border-emerald-500/50 rounded-lg font-bold text-xs active:scale-95 transition-all shadow-sm flex items-center gap-0.5"
              title={`点击为此方补时 +${localStep} 秒`}
            >
              +{localStep}秒
            </button>

            {/* 动态减时/扣时按钮 */}
            <button
              onClick={() => onAdjustTime(-localStep)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500/50 rounded-lg font-bold text-xs active:scale-95 transition-all shadow-sm flex items-center gap-0.5"
              title={`点击为此方扣时 -${localStep} 秒`}
            >
              -{localStep}秒
            </button>

            {/* 常用秒数快速点选 (5秒 / 10秒 / 15秒 / 30秒 / 60秒) */}
            <div className="flex items-center gap-1 pl-0.5">
              {[5, 10, 15, 30, 60].map(s => (
                <button
                  key={s}
                  onClick={() => handleStepChange(s)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-all ${
                    localStep === s 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                  }`}
                  title={`快速切换为 ${s} 秒`}
                >
                  {s}秒
                </button>
              ))}
            </div>
          </div>

          {/* 犯规计数 */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <ShieldAlert size={13} className="text-amber-400" />
              犯规:
            </span>
            <button
              onClick={() => onUpdateFoul(-1)}
              disabled={foulCount <= 0}
              className="w-5 h-5 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-300 font-bold"
            >
              -
            </button>
            <span className="text-sm font-mono font-bold text-white w-4 text-center">
              {foulCount}
            </span>
            <button
              onClick={() => onUpdateFoul(1)}
              className="w-5 h-5 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold"
            >
              +
            </button>
          </div>
        </div>

        {/* 主操控按钮：START/PAUSE 与 RESET */}
        <div className="flex items-stretch gap-3">
          <button
            onClick={onToggle}
            className={`flex-1 py-4 sm:py-5 rounded-2xl font-black text-lg tracking-wider text-white flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-98 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                : isAffirmative
                ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={22} fill="currentColor" />
                暂停发言
              </>
            ) : (
              <>
                <Play size={22} fill="currentColor" />
                开始发言 [{hotkeyNum}]
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="px-5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-2xl flex items-center justify-center transition-all active:scale-95"
            title="复位本方时间"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
