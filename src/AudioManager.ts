import { AudioPlay, AudioPlayOpt, KaboomCtx } from "kaboom";
import { Settings } from "./settings";

type MusicId = "StartMusic";

export class AudioManager {
  private k: KaboomCtx;
  private settings: Settings;
  private MusicToAudioPlay: Record<string, AudioPlay>;
  private _isMuted = false;

  constructor(kaboom: KaboomCtx, settings: Settings) {
    this.k = kaboom;
    this.settings = settings;
    this.MusicToAudioPlay = {};

    // Load sounds
    this.k.loadSound("StartMusic", "/the-perfect-girl-slowed.mp3");
    this.k.loadSound("JumpSound", "/jump.mp3");
    this.k.loadSound("HyperdriveSound", "/hyperdrive-sound.mp3");
  }

  public get audios() {
    return this.MusicToAudioPlay;
  }

  public get isMuted() {
    return this._isMuted;
  }

  public startMusic(musicId: MusicId, options?: AudioPlayOpt) {
    console.log(musicId, "| volume", this.settings.VOLUME);
    const music = this.k.play(musicId, {
      volume: this.settings.VOLUME / 100,
      ...options,
    });
    this.MusicToAudioPlay[musicId] = music;
    return music;
  }

  public stopMusic(musicId: MusicId) {
    const music = this.MusicToAudioPlay[musicId];
    if (music) {
      music.paused = true;
    }
  }

  public mute() {
    this._isMuted = true;
    for (const audio of Object.values(this.MusicToAudioPlay)) {
      audio.volume = 0;
    }
  }

  public unMute() {
    this._isMuted = false;
    for (const audio of Object.values(this.MusicToAudioPlay)) {
      audio.volume = this.settings.VOLUME / 100;
    }
  }

  public setVolume(level: number = this.settings.VOLUME) {
    this.settings.VOLUME = level;
    for (const audio of Object.values(this.MusicToAudioPlay)) {
      audio.volume = level / 100;
    }
  }
}
