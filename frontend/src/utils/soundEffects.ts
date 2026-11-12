/**
 * Audio service - disabled by default for a clean, professional user experience.
 */
class SoundSynthesizer {
  private muted: boolean = true;

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  public isMuted(): boolean {
    return true;
  }

  public playClick() {}
  public playProbeFire() {}
  public playAlert() {}
  public playSuccess() {}
  public playKey() {}
  public playLaser() {}
}

export const sounds = new SoundSynthesizer();
