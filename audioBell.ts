// 拟真专业辩论赛黄铜拍铃音效合成器 (Web Audio API)

class DebateBellSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * 触发一次纯净黄铜拍铃物理谐波合成
   */
  private strikeChime(delaySeconds = 0, volume = 0.8) {
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime + delaySeconds;
    const baseFreq = 880; // A5 传统辩论铜铃音高

    // 黄铜谐波分配 (基频与高次谐波模拟金属体共振)
    const harmonics = [
      { freq: baseFreq, gain: 0.5, decay: 0.9 },
      { freq: baseFreq * 2.01, gain: 0.35, decay: 0.75 },
      { freq: baseFreq * 3.02, gain: 0.22, decay: 0.55 },
      { freq: baseFreq * 4.15, gain: 0.12, decay: 0.4 },
      { freq: baseFreq * 5.4, gain: 0.08, decay: 0.25 },
    ];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, startTime);
    masterGain.connect(ctx.destination);

    harmonics.forEach(({ freq, gain, decay }) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // 击打瞬态 (Attack 4ms) 与自然指数衰减
      oscGain.gain.setValueAtTime(0.0001, startTime);
      oscGain.gain.exponentialRampToValueAtTime(gain, startTime + 0.006);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

      osc.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + decay + 0.05);
    });
  }

  /**
   * 播放拍铃声
   * @param type 'single' 单响（30秒或手动拍铃）| 'double' 双响（到时）| 'triple' 三响（严重超时）
   */
  public play(type: 'single' | 'double' | 'triple' = 'single', volume = 0.8) {
    try {
      if (type === 'single') {
        this.strikeChime(0, volume);
      } else if (type === 'double') {
        this.strikeChime(0, volume);
        this.strikeChime(0.28, volume);
      } else if (type === 'triple') {
        this.strikeChime(0, volume);
        this.strikeChime(0.24, volume);
        this.strikeChime(0.48, volume);
      }
    } catch (e) {
      console.warn('Audio chime playback failed:', e);
    }
  }
}

export const bellSynthesizer = new DebateBellSynthesizer();
