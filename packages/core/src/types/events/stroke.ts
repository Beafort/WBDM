import type { Point } from '../geometry.js';
import type { BaseEvent, Colored, Positioned } from './base.js';
export interface StrokeStart extends BaseEvent, Positioned, Colored {
  type: 'stroke';
  action: 'start';
  width: number;
}

export interface StrokeMove extends BaseEvent {
  type: 'stroke';
  action: 'move';
  point: Point;
}

export interface StrokeEnd extends BaseEvent {
  type: 'stroke';
  action: 'end';
}

export type StrokeEvent = StrokeStart | StrokeMove | StrokeEnd;

export type StrokeEventType = StrokeEvent['type'];
