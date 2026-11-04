import { DebatePhase, PhaseType } from './types';

export const TOURNAMENT_TEMPLATES: Record<string, DebatePhase[]> = {
  '标准立论与自由辩 (通用推荐)': [
    {
      id: 'phase-std-1',
      name: '第一环节：开篇立论',
      description: '双方一辩依次阐明立论观点，立足本方逻辑框架',
      type: PhaseType.STANDARD,
      chessMode: false,
      timers: [
        { id: 't-std-1-aff', label: '正方一辩 立论', durationSeconds: 180, remainingSeconds: 180, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
        { id: 't-std-1-neg', label: '反方一辩 立论', durationSeconds: 180, remainingSeconds: 180, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
      ]
    },
    {
      id: 'phase-std-2',
      name: '第二环节：攻辩驳论',
      description: '双方二辩针对对方立论薄弱点进行反驳与拆解',
      type: PhaseType.STANDARD,
      chessMode: false,
      timers: [
        { id: 't-std-2-aff', label: '正方二辩 驳论', durationSeconds: 150, remainingSeconds: 150, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
        { id: 't-std-2-neg', label: '反方二辩 驳论', durationSeconds: 150, remainingSeconds: 150, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
      ]
    },
    {
      id: 'phase-std-3',
      name: '第三环节：自由辩论',
      description: '双方轮流发言，正方先发言，一方落座后另一方立即起立，计时各自独立',
      type: PhaseType.FREE,
      chessMode: true,
      timers: [
        { id: 't-std-3-aff', label: '正方 自由辩', durationSeconds: 240, remainingSeconds: 240, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
        { id: 't-std-3-neg', label: '反方 自由辩', durationSeconds: 240, remainingSeconds: 240, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
      ]
    },
    {
      id: 'phase-std-4',
      name: '第四环节：总结陈词',
      description: '双方四辩升华主题，梳理战场得失与核心价值',
      type: PhaseType.STANDARD,
      chessMode: false,
      timers: [
        { id: 't-std-4-aff', label: '正方四辩 结辩', durationSeconds: 210, remainingSeconds: 210, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
        { id: 't-std-4-neg', label: '反方四辩 结辩', durationSeconds: 210, remainingSeconds: 210, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
      ]
    }
  ],

  '新国辩赛制 (经典)': [
    {
      id: 'phase-ngb-1',
      name: '开篇立论',
      description: '正方一辩与反方一辩开篇申论 (各210秒)',
      type: PhaseType.STANDARD,
      chessMode: false,
      timers: [
        { id: 't-ngb-1-aff', label: '正方一辩 开篇立论', durationSeconds: 210, remainingSeconds: 210, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
        { id: 't-ngb-1-neg', label: '反方一辩 开篇立论', durationSeconds: 210, remainingSeconds: 210, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
      ]
    },
    {
      id: 'phase-ngb-2',
      name: '二辩驳论与对辩',
      description: '双方二辩申论及对辩 (申论各90秒)',
      type: PhaseType.STANDARD,
      chessMode: false,
      timers: [
        { id: 't-ngb-2-aff', label: '正方二辩 申论', durationSeconds: 90, remainingSeconds: 90, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 15, foulCount: 0 },
        { id: 't-ngb-2-neg', label: '反方二辩 申论', durationSeconds: 90, remainingSeconds: 90, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 15, foulCount: 0 },
      ]
    },
    {
      id: 'phase-ngb-3',
      name: '三辩质询与盘问',
      description: '三辩盘问攻防 (各120秒)',
      type: PhaseType.STANDARD,
      chessMode: false,
      timers: [
        { id: 't-ngb-3-aff', label: '正方三辩 质询', durationSeconds: 120, remainingSeconds: 120, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
        { id: 't-ngb-3-neg', label: '反方三辩 质询', durationSeconds: 120, remainingSeconds: 120, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
      ]
    },
    {
      id: 'phase-ngb-4',
      name: '自由辩论',
      description: '双方自由辩论 (各240秒)',
      type: PhaseType.FREE,
      chessMode: true,
      timers: [
        { id: 't-ngb-4-aff', label: '正方 自由辩', durationSeconds: 240, remainingSeconds: 240, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
        { id: 't-ngb-4-neg', label: '反方 自由辩', durationSeconds: 240, remainingSeconds: 240, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
      ]
    },
    {
      id: 'phase-ngb-5',
      name: '总结陈词',
      description: '双方结辩陈词 (各210秒)',
      type: PhaseType.STANDARD,
      chessMode: false,
      timers: [
        { id: 't-ngb-5-aff', label: '正方四辩 总结陈词', durationSeconds: 210, remainingSeconds: 210, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
        { id: 't-ngb-5-neg', label: '反方四辩 总结陈词', durationSeconds: 210, remainingSeconds: 210, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
      ]
    }
  ],

  '华语辩论世界杯赛制': [
    {
      id: 'phase-wcb-1',
      name: '正反方立论',
      description: '双方一辩各发言 210 秒',
      type: PhaseType.STANDARD,
      chessMode: false,
      timers: [
        { id: 't-wcb-1-aff', label: '正方一辩 立论', durationSeconds: 210, remainingSeconds: 210, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
        { id: 't-wcb-1-neg', label: '反方一辩 立论', durationSeconds: 210, remainingSeconds: 210, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
      ]
    },
    {
      id: 'phase-wcb-2',
      name: '对辩环节',
      description: '双方二辩交替对辩各 90 秒',
      type: PhaseType.FREE,
      chessMode: true,
      timers: [
        { id: 't-wcb-2-aff', label: '正方二辩 对辩', durationSeconds: 90, remainingSeconds: 90, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 15, foulCount: 0 },
        { id: 't-wcb-2-neg', label: '反方二辩 对辩', durationSeconds: 90, remainingSeconds: 90, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 15, foulCount: 0 },
      ]
    },
    {
      id: 'phase-wcb-3',
      name: '质询小结',
      description: '三辩质询与总结各 120 秒',
      type: PhaseType.STANDARD,
      chessMode: false,
      timers: [
        { id: 't-wcb-3-aff', label: '正方三辩 质询小结', durationSeconds: 120, remainingSeconds: 120, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
        { id: 't-wcb-3-neg', label: '反方三辩 质询小结', durationSeconds: 120, remainingSeconds: 120, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
      ]
    },
    {
      id: 'phase-wcb-4',
      name: '自由辩论',
      description: '双方交替自由辩论各 240 秒',
      type: PhaseType.FREE,
      chessMode: true,
      timers: [
        { id: 't-wcb-4-aff', label: '正方 自由辩', durationSeconds: 240, remainingSeconds: 240, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
        { id: 't-wcb-4-neg', label: '反方 自由辩', durationSeconds: 240, remainingSeconds: 240, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
      ]
    },
    {
      id: 'phase-wcb-5',
      name: '结辩陈词',
      description: '双方四辩总结陈词各 210 秒',
      type: PhaseType.STANDARD,
      chessMode: false,
      timers: [
        { id: 't-wcb-5-aff', label: '正方四辩 结辩', durationSeconds: 210, remainingSeconds: 210, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
        { id: 't-wcb-5-neg', label: '反方四辩 结辩', durationSeconds: 210, remainingSeconds: 210, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
      ]
    }
  ],

  '自由辩论专场 (4分钟)': [
    {
      id: 'phase-free-only',
      name: '自由辩论对抗',
      description: '正反双方各有4分钟计时，轮流交替发言',
      type: PhaseType.FREE,
      chessMode: true,
      timers: [
        { id: 't-free-aff', label: '正方 自由辩', durationSeconds: 240, remainingSeconds: 240, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
        { id: 't-free-neg', label: '反方 自由辩', durationSeconds: 240, remainingSeconds: 240, usedSeconds: 0, isRunning: false, mode: 'countdown', warningSeconds: 30, foulCount: 0 },
      ]
    }
  ]
};

export const DEFAULT_MATCH_INFO = {
  tournamentTitle: '2026 华语辩论公开锦标赛',
  motion: '人工智能的发展对人类文化传承利大于弊 / 弊大于利',
  affirmativeTeam: '思辨先锋队',
  negativeTeam: '求索立言队'
};
