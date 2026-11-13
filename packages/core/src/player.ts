import { decodeWBDM } from './codec/decoder.js';
import type { AudioEvent } from './types/events/audio.js';
import type { WbEvent } from './types/events/base.js';
type Listener = (e: WbEvent) => void;
type TickListener = (position: number) => void;
interface Clip {
  startMs: number;
  endMs: number;
  el: HTMLAudioElement;
  url: string;
}
enum PlayerState {
  Idle,
  Playing,
  Stopped,
}
export class Player {
  private baseTime: number = 0;
  private state: PlayerState = PlayerState.Idle;
  private events: WbEvent[] = [];
  private clips: Clip[] = [];

  // Player fields
  private index = 0;
  private position = 0;
  private lastFrame = 0;
  private rafId = 0;
  private listeners = new Set<Listener>();
  private tickListeners = new Set<TickListener>();
  private resetListeners = new Set<() => void>();
  speed = 1;

  constructor(bytes: Uint8Array<ArrayBuffer>) {
    const { baseTime, events } = decodeWBDM(bytes);
    const audioEvents = events.filter((e): e is AudioEvent => e.type === 'audio');

    let cur: { start: number; mime: string; parts: Blob[] } | undefined;

    for (const e of audioEvents) {
      if (e.action === 'start') cur = { start: e.t - baseTime, mime: e.mime, parts: [e.blob] };
      else if (e.action === 'chunk') cur?.parts.push(e.blob);
      else if (e.action === 'end' && cur) {
        const url = URL.createObjectURL(new Blob(cur.parts, { type: cur.mime }));
        const el = new Audio(url);
        el.preload = 'auto';
        this.clips.push({ startMs: cur.start, endMs: e.t - baseTime, el, url });
        cur = undefined;
      }
    }
    this.baseTime = baseTime;
    this.events = events.filter((e) => e.type !== 'audio');
  }

  get duration() {
    const last = this.events[this.events.length - 1];
    const drawMs = last ? last.t - this.baseTime : 0;
    const clipMs = this.clips.reduce((m, c) => Math.max(m, c.endMs), 0);
    return Math.max(drawMs, clipMs);
  }

  onEvent(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onTick(fn: TickListener) {
    this.tickListeners.add(fn);
    return () => this.tickListeners.delete(fn);
  }

  onReset(fn: () => void) {
    this.resetListeners.add(fn);
    return () => this.resetListeners.delete(fn);
  }

  start() {
    if (this.state === PlayerState.Playing) return;
    this.state = PlayerState.Playing;
    this.lastFrame = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  pause() {
    this.state = PlayerState.Stopped;
    cancelAnimationFrame(this.rafId);
    for (const c of this.clips) c.el.pause();
  }

  seek(ms: number) {
    const target = Math.max(0, Math.min(ms, this.duration));
    const newIndex = this.indexAt(target);

    if (newIndex < this.index) {
      //  wipe the board and replay from the start if the new index is in the past
      this.resetListeners.forEach((fn) => fn());
      this.index = 0;
    }

    // emit everything between the current index and the target, with no delay
    while (this.index < newIndex) {
      const e = this.events[this.index++];
      this.listeners.forEach((fn) => fn(e));
    }

    this.position = target;
    this.lastFrame = performance.now();
    this.tickListeners.forEach((fn) => fn(this.position));
  }

  private tick = (now: number) => {
    if (this.state !== PlayerState.Playing) return;

    this.position += (now - this.lastFrame) * this.speed;
    this.lastFrame = now;
    this.syncClips();
    while (
      this.index < this.events.length &&
      this.events[this.index].t - this.baseTime <= this.position
    ) {
      const e = this.events[this.index++];
      this.listeners.forEach((fn) => fn(e));
    }

    this.tickListeners.forEach((fn) => fn(Math.min(this.position, this.duration)));

    if (this.index >= this.events.length && this.position >= this.duration) {
      this.state = PlayerState.Stopped;
      this.clips.forEach((c) => c.el.pause());
      return;
    }
    this.rafId = requestAnimationFrame(this.tick);
  };
  private indexAt(ms: number): number {
    //Binary search
    let lo = 0,
      hi = this.events.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.events[mid].t - this.baseTime <= ms) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
  private syncClips() {
    console.log(this.clips);
    for (const c of this.clips) {
      const inside = this.position >= c.startMs && this.position < c.endMs;
      if (inside) {
        const want = (this.position - c.startMs) / 1000;
        if (c.el.paused) {
          c.el.currentTime = want;
          c.el.playbackRate = this.speed;
          c.el.play().catch(() => {});
        } else if (Math.abs(c.el.currentTime - want) > 0.2) {
          c.el.currentTime = want;
        }
      } else if (!c.el.paused) {
        c.el.pause();
      }
    }
  }
}
