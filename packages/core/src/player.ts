import { decodeWBDM } from './decoder.js';
import type { WbEvent } from './types/events/base.js';
type Listener = (e: WbEvent) => void;
type TickListener = (position: number) => void;
enum PlayerState {
  Idle,
  Playing,
  Stopped,
}
export class Player {
  private baseTime: number = 0;
  private state: PlayerState = PlayerState.Idle;
  private events: WbEvent[] = [];

  // Player fields
  private index = 0;
  private position = 0;
  private lastFrame = 0;
  private rafId = 0;
  private listeners = new Set<Listener>();
  private tickListeners = new Set<TickListener>();
  private resetListeners = new Set<() => void>();
  speed = 1;

  constructor(bytes: Uint8Array) {
    const { baseTime, events } = decodeWBDM(bytes);

    this.baseTime = baseTime;
    this.events = events;
  }

  get duration() {
    const last = this.events[this.events.length - 1];
    return last ? last.t - this.baseTime : 0;
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

    while (
      this.index < this.events.length &&
      this.events[this.index].t - this.baseTime <= this.position
    ) {
      const e = this.events[this.index++];
      this.listeners.forEach((fn) => fn(e));
    }

    this.tickListeners.forEach((fn) => fn(Math.min(this.position, this.duration)));

    if (this.index >= this.events.length) {
      this.state = PlayerState.Stopped;
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
}
