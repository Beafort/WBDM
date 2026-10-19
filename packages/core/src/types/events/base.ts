import type { COLORS } from '../../renderer/color.js';
import type { Point } from '../geometry.js';
import type { ElementEvent } from './element.js';
import type { StrokeEvent } from './stroke.js';
import type { TextEvent } from './text.js';

export interface BaseEvent {
  t: number;
  eId: number;
}
export interface Positioned {
  position: Point;
}

export interface Colored {
  color: COLORS;
}
export type WbEvent = StrokeEvent | ElementEvent | TextEvent;
