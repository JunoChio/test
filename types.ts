export enum PhaseType {
  STANDARD = 'STANDARD',
  FREE = 'FREE'
}

export type TimerMode = 'countdown' | 'stopwatch';

export interface TimerInstance {
  id: string;
  label: string; // e.g. "正方一辩" or "反方一辩"
  durationSeconds: number;
  remainingSeconds: number;
  usedSeconds: number;
  isRunning: boolean;
  mode: TimerMode;
  warningSeconds: number; // 剩余秒数提示铃，如 30 秒
  foulCount: number;
  foulRemarks?: string;
}

export interface DebatePhase {
  id: string;
  name: string; // 环节名称，如 "开篇立论"、"驳论环节"、"自由辩论"
  description?: string;
  type: PhaseType;
  timers: TimerInstance[];
  chessMode?: boolean; // 是否自由辩论双向交替模式
}

export interface MatchInfo {
  tournamentTitle: string; // 赛事名称，如 "2026 华语国际辩论邀请赛"
  motion: string; // 辩题，如 "人工智能生成艺术利大于弊 / 弊大于利"
  affirmativeTeam: string; // 正方队伍名称，如 "思辨先锋队"
  negativeTeam: string; // 反方队伍名称，如 "格物致知队"
}

export interface DebateRecord {
  id: string;
  timestamp: string;
  phaseName: string;
  speakerLabel: string;
  side: 'affirmative' | 'negative';
  usedSeconds: number;
  remainingSeconds: number;
  isOvertime: boolean;
  foulCount: number;
}

export interface StageSettings {
  isMute: boolean;
  volume: number; // 0 to 1
  timeStep: number; // 补时/扣时秒数，默认 10 秒
  isChessClockMode: boolean; // 默认交替运行还是单独运行
  autoNextPhaseOnFinish: boolean;
  bellStyle: 'brass' | 'modern' | 'chime'; // 黄铜拍铃 / 现代电子 / 清脆和弦
}
