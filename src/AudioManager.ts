import { AudioPlay, AudioPlayOpt, KaboomCtx } from "kaboom";

type MusicId = "StartMusic";

export class AudioManager {
  private k: KaboomCtx;
  private MusicToAudioPlay: Record<string, AudioPlay>;

  constructor(kaboom: KaboomCtx) {
    this.k = kaboom;
    this.MusicToAudioPlay = {};

    // Load sounds
    this.k.loadSound("StartMusic", "/the-perfect-girl-slowed.mp3");
    this.k.loadSound("JumpSound", "/jump.mp3");
  }

  public startMusic(musicId: MusicId, options?: AudioPlayOpt) {
    const music = this.k.play(musicId, options);
    this.MusicToAudioPlay[musicId] = music;
  }

  public stopMusic(musicId: MusicId) {
    const music = this.MusicToAudioPlay[musicId];
    if (music) {
      music.paused = true;
    }
  }
}
