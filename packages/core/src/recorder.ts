import { encodeEvent, encodeHeader } from './codec/encoder.js';
import type { Sink } from './sink.js';
import type { AudioEvent } from './types/events/audio.js';
import type { WbEvent } from './types/events/base.js';

enum RecorderState {
  Idle,
  Recording,
  Stopped,
}
export class Recorder {
  private baseTime = 0;
  private rec?: MediaRecorder;
  private starting?: Promise<void>;
  private state: RecorderState = RecorderState.Idle;
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private sink: Sink,
    private stream: MediaStream,
  ) {}

  private enqueue(make: () => Promise<Uint8Array<ArrayBuffer>> | Uint8Array<ArrayBuffer>) {
    const p = this.queue.then(async () => this.sink.write(await make()));
    this.queue = p.catch(() => {});
    return p;
  }

  async start() {
    if (this.state !== RecorderState.Idle) throw Error('Already started!');
    this.baseTime = Date.now();
    this.enqueue(() => encodeHeader(this.baseTime));
    this.state = RecorderState.Recording;
  }

  startTalking() {
    if (this.state !== RecorderState.Recording || this.rec) return;

    const mimeType = ['audio/webm;codecs=opus', 'audio/mp4'].find((m) =>
      MediaRecorder.isTypeSupported(m),
    );
    const rec = new MediaRecorder(this.stream, { mimeType, audioBitsPerSecond: 24000 });
    this.rec = rec;

    // per-segment state, so segments can't affect each other
    let emittedStart = false;
    let chunkStart = 0;

    rec.ondataavailable = (e) => {
      if (!e.data.size) return;
      const t = chunkStart;
      chunkStart = Date.now();
      const ev: AudioEvent = emittedStart
        ? { type: 'audio', action: 'chunk', t, blob: e.data }
        : { type: 'audio', action: 'start', t, mime: rec.mimeType, blob: e.data };
      emittedStart = true;
      this.enqueue(() => encodeEvent(ev, this.baseTime));
    };

    rec.onstop = () => {
      // the final ondataavailable fires before onstop, so everything is queued by now
      if (emittedStart) {
        const ev: AudioEvent = { type: 'audio', action: 'end', t: Date.now() };
        this.enqueue(() => encodeEvent(ev, this.baseTime));
      }
      this.rec = undefined;
    };

    this.starting = new Promise<void>((resolve) => {
      rec.onstart = () => {
        chunkStart = Date.now();
        resolve();
      };
      rec.start(1000);
    });
  }

  async stopTalking() {
    const rec = this.rec;
    if (!rec) return;
    await this.starting;
    if (rec.state === 'inactive') return;
    await new Promise<void>((resolve) => {
      const prev = rec.onstop;
      rec.onstop = (ev) => {
        (prev as any)?.call(rec, ev);
        resolve();
      };
      rec.stop();
    });
  }

  writeEvent(e: WbEvent) {
    if (this.state !== RecorderState.Recording) throw Error('Not Recording!');
    return this.enqueue(() => encodeEvent(e, this.baseTime));
  }

  async stop() {
    if (this.state !== RecorderState.Recording) return;
    await this.stopTalking();
    this.state = RecorderState.Stopped;
    await this.queue;
    await this.sink.close();
  }
}
