import type { WbCanvas } from '../canvas/canvas.js';
import type { Recorder } from '../recorder.js';
import type { WbEvent } from '../types/events/base.js';
export interface WbPointerInput {
  x: number;
  y: number;
}

export interface WbTool {
  pointerDown(e: WbPointerInput): void;
  pointerMove(e: WbPointerInput): void;
  pointerUp(e: WbPointerInput): void;
  cancel?(): void;
}

export abstract class WbBaseTool implements WbTool {
  constructor(
    protected canvas: WbCanvas,
    protected recorder?: Recorder,
  ) {}

  protected emit(event: WbEvent): void {
    this.canvas.apply(event);
    this.canvas.draw();
    void this.recorder?.writeEvent(event).catch(console.error);
  }

  abstract pointerDown(e: WbPointerInput): void;
  abstract pointerMove(e: WbPointerInput): void;
  abstract pointerUp(e: WbPointerInput): void;

  cancel?(): void;
  setRecorder(recorder: Recorder | undefined) {
    this.recorder = recorder;
  }
}
