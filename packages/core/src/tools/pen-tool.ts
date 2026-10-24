import type { WbCanvas } from '../canvas/canvas.js';
import { COLORS } from '../canvas/color.js';
import type { Recorder } from '../recorder.js';
import type { StrokeEvent } from '../types/events/stroke.js';
import type { Point } from '../types/geometry.js';
import { WbBaseTool, type WbPointerInput } from './tool.js';

const MIN_DIST = 0.5;

export class WbPenTool extends WbBaseTool {
  private currentStroke: number | undefined;
  private strokeOrigin: Point | undefined;
  private lastPoint: Point | undefined;
  private pendingPoint: Point | undefined;

  constructor(
    canvas: WbCanvas,
    recorder?: Recorder,
    private color = COLORS.black,
    private width = 10,
  ) {
    super(canvas, recorder);
  }
  pointerDown(input: WbPointerInput) {
    // Avoid starting a second stroke before the first finishes.
    if (this.currentStroke !== undefined) return;

    const event: StrokeEvent = {
      t: Date.now(),
      type: 'stroke',
      action: 'start',
      eId: this.canvas.newElementId(),
      color: this.color,
      width: this.width,
      position: { ...input },
    };

    this.currentStroke = event.eId;
    this.strokeOrigin = { ...input };
    this.lastPoint = { ...input };
    this.pendingPoint = undefined;

    this.emit(event);
  }

  pointerMove(input: WbPointerInput) {
    if (this.currentStroke === undefined || !this.lastPoint) return;

    const dx = input.x - this.lastPoint.x;
    const dy = input.y - this.lastPoint.y;

    if (dx * dx + dy * dy < MIN_DIST * MIN_DIST) {
      this.pendingPoint = { ...input };
      return;
    }

    this.emitMove(input);
  }

  pointerUp(_input: WbPointerInput) {
    if (this.currentStroke === undefined) return;

    if (this.pendingPoint) {
      this.emitMove(this.pendingPoint);
    }

    const event: StrokeEvent = {
      t: Date.now(),
      type: 'stroke',
      action: 'end',
      eId: this.currentStroke,
    };

    this.emit(event);
    this.reset();
  }

  cancel() {
    // Finish the stroke cleanly when pointer interaction is cancelled.
    this.pointerUp(this.lastPoint ?? { x: 0, y: 0 });
  }

  private emitMove(input: WbPointerInput) {
    if (this.currentStroke === undefined || !this.strokeOrigin) return;

    const event: StrokeEvent = {
      t: Date.now(),
      type: 'stroke',
      action: 'move',
      eId: this.currentStroke,
      point: {
        x: input.x - this.strokeOrigin.x,
        y: input.y - this.strokeOrigin.y,
      },
    };

    this.emit(event);
    this.lastPoint = { ...input };
    this.pendingPoint = undefined;
  }

  private reset() {
    this.currentStroke = undefined;
    this.strokeOrigin = undefined;
    this.lastPoint = undefined;
    this.pendingPoint = undefined;
  }
}
