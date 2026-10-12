import { renderStroke } from '../renderer';
import type { Stroke } from './types';
import type { StrokeEvent, WbEvent } from 'wbdm';
export class Whiteboard {
  private strokes = new Map<number, Stroke>();
  private nextId = 1;
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
    this.canvas = canvas;
    this.resize();
    new ResizeObserver(() => this.resize()).observe(canvas);
  }
  apply(event: WbEvent) {
    if (event.type == 'stroke') {
      this.applyStrokeEvent(event);
    }
  }
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.draw();
  }
  newStrokeId() {
    return this.nextId++;
  }
  draw() {
    for (const stroke of this.strokes.values()) {
      renderStroke(stroke, this.ctx);
    }
  }
  private applyStrokeEvent(event: StrokeEvent) {
    switch (event.action) {
      case 'start':
        this.strokes.set(event.strokeId, {
          id: event.strokeId,
          type: 'stroke',
          color: event.color,
          width: event.width,
          points: [event.point],
          visible: true,
        });
        return;
      case 'move':
        const stroke = this.strokes.get(event.strokeId);
        if (!stroke) return;
        this.strokes.set(event.strokeId, { ...stroke, points: [...stroke.points, event.point] });
        return;
      case 'end':

      case 'delete':
      case 'insert':
    }
  }
}
