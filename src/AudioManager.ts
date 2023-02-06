import { AudioPlay, AudioPlayOpt, KaboomCtx } from "kaboom";
import { Settings } from "./settings";

type SoundId = "StartMusic" | "JumpSound" | "HyperdriveSound";

interface SoundStorage {
  audioPlay: AudioPlay;
  volume: number;
}

export class AudioManager {
  private k: KaboomCtx;
  private settings: Settings;
  private volumeBeforeMute: number;
  private SoundToStorage: Record<string, SoundStorage>;
  private _isMuted = false;

  constructor(kaboom: KaboomCtx, settings: Settings) {
    this.k = kaboom;
    this.settings = settings;
    this.SoundToStorage = {};

    // Load sounds
    this.k.loadSound("StartMusic", "/the-perfect-girl-slowed.mp3");
    this.k.loadSound("JumpSound", "/jump.mp3");
    this.k.loadSound("HyperdriveSound", "/hyperdrive-sound.mp3");
  }

  public get audios() {
    return this.SoundToStorage;
  }

  public get isMuted() {
    return this._isMuted;
  }

  public play(soundId: SoundId, options?: AudioPlayOpt) {
    const { volume = 1 } = options || {};
    const sound = this.k.play(soundId, {
      volume: (this.settings.VOLUME / 100) * volume,
      ...options,
    });
    this.SoundToStorage[soundId] = {
      audioPlay: sound,
      volume,
    };
    return sound;
  }

  public stop(soundId: SoundId) {
    const sound = this.SoundToStorage[soundId]?.audioPlay;
    if (sound) {
      sound.paused = true;
    }
  }

  public mute() {
    this._isMuted = true;
    this.volumeBeforeMute = this.settings.VOLUME;
    this.settings.VOLUME = 0;
    for (const { audioPlay } of Object.values<SoundStorage>(
      this.SoundToStorage
    )) {
      audioPlay.volume = 0;
    }
  }

  public unMute() {
    this._isMuted = false;
    this.settings.VOLUME = this.volumeBeforeMute;
    for (const { audioPlay, volume } of Object.values<SoundStorage>(
      this.SoundToStorage
    )) {
      audioPlay.volume = (this.settings.VOLUME / 100) * volume;
    }
  }

  public setVolume(level: number) {
    this.settings.VOLUME = level * 100;
    for (const { audioPlay, volume } of Object.values<SoundStorage>(
      this.SoundToStorage
    )) {
      audioPlay.volume = (level / 100) * volume;
    }
  }
}
