import type { Point } from '../geometry.js';
import type { StrokeElement } from './stroke.js';
import type { TextElement } from './text.js';

export interface BaseElement {
  id: number;
  position: Point;
  visible: boolean;
}

export type WbElement = StrokeElement | TextElement;
