
export enum PhaseType {
  STANDARD = 'STANDARD',
  FREE = 'FREE'
}

export type TimerMode = 'countdown' | 'stopwatch';

export type ThemeType = 'midnight' | 'aurora' | 'ocean' | 'sunset' | 'custom';

export interface TimerInstance {
  id: string;
  label: string;
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  mode: TimerMode;
  alertPoints: number[]; // Seconds at which to ring
  overtimeThresholdSeconds: number; // 超時寬限秒數 (例如 15 秒)
  foulCount: number; // 新增：犯規次數
}

export interface DebatePhase {
  id: string;
  name: string;
  type: PhaseType;
  timers: TimerInstance[];
}

export interface HotkeyConfig {
  pauseAll: string;
  resetAll: string;
  nextPhase: string;
  prevPhase: string;
  toggleTimer1: string;
  toggleTimer2: string;
  toggleTimer3: string;
  manualBell: string;
}

export interface AppearanceConfig {
  appTitle: string;
  appSubtitle: string;
  iconText: string;
  theme: ThemeType;
  accentColor: string;
  hotkeys: HotkeyConfig;
  showInfoBar: boolean;
  isMute: boolean;
  backgroundImage?: string;
  customSound?: string;
}
