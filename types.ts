
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
  showInfoBar: boolean; // 是否顯示信息欄
  backgroundImage?: string; // Base64 or URL
  customSound?: string; // Base64 or URL
}
