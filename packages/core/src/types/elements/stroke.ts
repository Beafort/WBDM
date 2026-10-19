import type { Point } from '../geometry.js';
import type { BaseElement } from './base.js';

export interface StrokeElement extends BaseElement {
  type: 'stroke';
  points: Point[];
  color: string;
  width: number;
}
