export type ThemeId = 'black-orange' | 'midnight-blue' | 'black-gold' | 'cyber-neon' | 'pure-black';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  dotColors: [string, string]; // [bgDot, accentDot]
  bgClass: string;
  cardBaseClass: string;
  headerBadgeClass: string;
  motionBarClass: string;
  activePhaseBtnClass: string;
  primaryAccentText: string;
  primaryAccentBg: string;
  primaryAccentBorder: string;
  timerDigitClass: {
    aff: string;
    neg: string;
    affGlow: string;
    negGlow: string;
  };
  sideBadge: {
    aff: string;
    neg: string;
  };
  sideCardBorder: {
    aff: string;
    neg: string;
  };
  sideProgressBar: {
    aff: string;
    neg: string;
  };
  sideStartBtn: {
    aff: string;
    neg: string;
  };
  overtimeBadge: string;
  warningBadge: string;
}

export const STAGE_THEMES: Record<ThemeId, ThemeConfig> = {
  'black-orange': {
    id: 'black-orange',
    name: '曜石黑橙',
    tagline: '极黑质感融合熔岩热烈橙光，具有极高对比度与电竞级竞技压迫感',
    dotColors: ['#0A0B0E', '#F97316'],
    bgClass: 'bg-gradient-to-b from-[#090A0E] via-[#0C0D12] to-[#050608]',
    cardBaseClass: 'bg-[#0E1017]/90 border-slate-800/90 shadow-2xl shadow-orange-950/10',
    headerBadgeClass: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
    motionBarClass: 'bg-gradient-to-r from-orange-950/30 via-[#10121A]/90 to-amber-950/30 border-orange-500/25',
    activePhaseBtnClass: 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-500 shadow-md shadow-orange-600/30',
    primaryAccentText: 'text-orange-400',
    primaryAccentBg: 'bg-orange-600 hover:bg-orange-500',
    primaryAccentBorder: 'border-orange-500/30',
    timerDigitClass: {
      aff: 'text-orange-400',
      neg: 'text-amber-400',
      affGlow: 'glow-orange',
      negGlow: 'glow-amber',
    },
    sideBadge: {
      aff: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      neg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    sideCardBorder: {
      aff: 'border-orange-500/30 hover:border-orange-500/60',
      neg: 'border-amber-500/30 hover:border-amber-500/60',
    },
    sideProgressBar: {
      aff: 'bg-gradient-to-r from-orange-600 to-amber-500',
      neg: 'bg-gradient-to-r from-amber-500 to-yellow-500',
    },
    sideStartBtn: {
      aff: 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/35',
      neg: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/35',
    },
    overtimeBadge: 'bg-red-600/90 text-white',
    warningBadge: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
  },

  'midnight-blue': {
    id: 'midnight-blue',
    name: '深蓝经典',
    tagline: '高校辩论公开赛官方经典红蓝对抗，儒雅博学、沉稳大气',
    dotColors: ['#070B14', '#3B82F6'],
    bgClass: 'bg-gradient-to-b from-[#070B14] via-[#090E1A] to-[#04070D]',
    cardBaseClass: 'bg-[#0B1120]/90 border-slate-800/80 shadow-2xl',
    headerBadgeClass: 'bg-blue-600/10 border-blue-500/20 text-blue-400',
    motionBarClass: 'bg-gradient-to-r from-red-950/20 via-slate-900/60 to-blue-950/20 border-slate-800',
    activePhaseBtnClass: 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30',
    primaryAccentText: 'text-blue-400',
    primaryAccentBg: 'bg-blue-600 hover:bg-blue-500',
    primaryAccentBorder: 'border-blue-500/30',
    timerDigitClass: {
      aff: 'text-red-400',
      neg: 'text-blue-400',
      affGlow: 'glow-red',
      negGlow: 'glow-blue',
    },
    sideBadge: {
      aff: 'bg-red-500/20 text-red-400 border border-red-500/30',
      neg: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    },
    sideCardBorder: {
      aff: 'border-red-500/30 hover:border-red-500/60',
      neg: 'border-blue-500/30 hover:border-blue-500/60',
    },
    sideProgressBar: {
      aff: 'bg-red-500',
      neg: 'bg-blue-500',
    },
    sideStartBtn: {
      aff: 'bg-red-600 hover:bg-red-500 shadow-red-600/30',
      neg: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30',
    },
    overtimeBadge: 'bg-red-600/90 text-white',
    warningBadge: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
  },

  'black-gold': {
    id: 'black-gold',
    name: '玄黑锦标金',
    tagline: '纯正黑曜石质感点缀锦标金光，专为争夺冠亚军与总决赛盛典打造',
    dotColors: ['#09090B', '#EAB308'],
    bgClass: 'bg-gradient-to-b from-[#09090B] via-[#0F0F12] to-[#050507]',
    cardBaseClass: 'bg-[#121215]/95 border-amber-500/20 shadow-2xl shadow-yellow-950/15',
    headerBadgeClass: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
    motionBarClass: 'bg-gradient-to-r from-yellow-950/25 via-[#141416]/90 to-amber-950/25 border-yellow-500/30',
    activePhaseBtnClass: 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-extrabold border-yellow-400 shadow-md shadow-yellow-600/30',
    primaryAccentText: 'text-yellow-400',
    primaryAccentBg: 'bg-yellow-600 hover:bg-yellow-500 text-black font-bold',
    primaryAccentBorder: 'border-yellow-500/30',
    timerDigitClass: {
      aff: 'text-yellow-400',
      neg: 'text-amber-300',
      affGlow: 'glow-gold',
      negGlow: 'glow-amber',
    },
    sideBadge: {
      aff: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
      neg: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    },
    sideCardBorder: {
      aff: 'border-yellow-500/30 hover:border-yellow-500/60',
      neg: 'border-amber-500/30 hover:border-amber-500/60',
    },
    sideProgressBar: {
      aff: 'bg-gradient-to-r from-yellow-500 to-amber-400',
      neg: 'bg-gradient-to-r from-amber-400 to-yellow-600',
    },
    sideStartBtn: {
      aff: 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-black shadow-yellow-600/40',
      neg: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-black shadow-amber-600/40',
    },
    overtimeBadge: 'bg-red-600/90 text-white',
    warningBadge: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
  },

  'cyber-neon': {
    id: 'cyber-neon',
    name: '赛博霓虹',
    tagline: '电光青空青与未来紫极光交融，充满科技感与电竞赛事活力',
    dotColors: ['#060814', '#06B6D4'],
    bgClass: 'bg-gradient-to-b from-[#060814] via-[#090D22] to-[#04050D]',
    cardBaseClass: 'bg-[#0B1024]/90 border-cyan-500/20 shadow-2xl shadow-cyan-950/20',
    headerBadgeClass: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
    motionBarClass: 'bg-gradient-to-r from-purple-950/30 via-[#0D132A]/90 to-cyan-950/30 border-cyan-500/25',
    activePhaseBtnClass: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30',
    primaryAccentText: 'text-cyan-400',
    primaryAccentBg: 'bg-cyan-600 hover:bg-cyan-500',
    primaryAccentBorder: 'border-cyan-500/30',
    timerDigitClass: {
      aff: 'text-purple-400',
      neg: 'text-cyan-400',
      affGlow: 'glow-purple',
      negGlow: 'glow-cyan',
    },
    sideBadge: {
      aff: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      neg: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    },
    sideCardBorder: {
      aff: 'border-purple-500/30 hover:border-purple-500/60',
      neg: 'border-cyan-500/30 hover:border-cyan-500/60',
    },
    sideProgressBar: {
      aff: 'bg-gradient-to-r from-purple-500 to-pink-500',
      neg: 'bg-gradient-to-r from-cyan-400 to-blue-500',
    },
    sideStartBtn: {
      aff: 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/35',
      neg: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/35',
    },
    overtimeBadge: 'bg-red-600/90 text-white',
    warningBadge: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
  },

  'pure-black': {
    id: 'pure-black',
    name: '极简纯黑',
    tagline: '100% 纯黑无底色噪点搭配纯白与银灰，抗剧场强光与投影反光',
    dotColors: ['#000000', '#F8FAFC'],
    bgClass: 'bg-black',
    cardBaseClass: 'bg-[#080808] border-zinc-800 shadow-none',
    headerBadgeClass: 'bg-zinc-800 border-zinc-700 text-zinc-300',
    motionBarClass: 'bg-[#0A0A0A] border-zinc-800',
    activePhaseBtnClass: 'bg-zinc-800 text-white border-zinc-600 shadow-sm',
    primaryAccentText: 'text-zinc-200',
    primaryAccentBg: 'bg-zinc-800 hover:bg-zinc-700',
    primaryAccentBorder: 'border-zinc-700',
    timerDigitClass: {
      aff: 'text-red-400',
      neg: 'text-blue-400',
      affGlow: 'glow-red',
      negGlow: 'glow-blue',
    },
    sideBadge: {
      aff: 'bg-zinc-900 text-red-400 border border-zinc-800',
      neg: 'bg-zinc-900 text-blue-400 border border-zinc-800',
    },
    sideCardBorder: {
      aff: 'border-zinc-800 hover:border-zinc-700',
      neg: 'border-zinc-800 hover:border-zinc-700',
    },
    sideProgressBar: {
      aff: 'bg-red-500',
      neg: 'bg-blue-500',
    },
    sideStartBtn: {
      aff: 'bg-red-700 hover:bg-red-600 shadow-none',
      neg: 'bg-blue-700 hover:bg-blue-600 shadow-none',
    },
    overtimeBadge: 'bg-red-600 text-white',
    warningBadge: 'bg-zinc-800 border-zinc-700 text-amber-300',
  },
};

export const DEFAULT_THEME_ID: ThemeId = 'black-orange';
