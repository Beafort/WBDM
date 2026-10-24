import { getElementBounds } from '../geometry/bounds.js';
import type { WbElement } from '../types/elements/base.js';
import type { WbEvent } from '../types/events/base.js';
import { applyElementEvent, applyStrokeEvent, applyTextEvent } from './handler.js';
import { renderStroke, renderText } from './render.js';

export class WbCanvas {
  private ctx: CanvasRenderingContext2D;
  private observer: ResizeObserver;
  readonly elements = new Map<number, WbElement>();
  private nextId = 1;
  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context is not available');
    this.ctx = ctx;

    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
  }
  apply(event: WbEvent) {
    switch (event.type) {
      case 'stroke':
        applyStrokeEvent(this, event);
        break;
      case 'text':
        applyTextEvent(this, event);
        break;
      case 'element':
        applyElementEvent(this, event);
        break;
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
  newElementId() {
    return this.nextId++;
  }
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const element of this.elements.values()) {
      this.ctx.save();
      this.ctx.translate(element.position.x, element.position.y);
      switch (element.type) {
        case 'stroke':
          renderStroke(element, this.ctx);
          break;
        case 'text':
          renderText(element, this.ctx);
          break;
      }
      this.ctx.restore();
    }
  }
  clear() {
    this.elements.clear();
    this.draw();
  }
  hitTest(x: number, y: number): WbElement | undefined {
    const elements = [...this.elements.values()].reverse();

    return elements.find((element) => {
      const { x: ex, y: ey, width, height } = getElementBounds(element);

      return x >= ex && x <= ex + width && y >= ey && y <= ey + height;
    });
  }
}
