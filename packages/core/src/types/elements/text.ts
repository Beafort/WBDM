import type { Sized } from '../geometry.js';
import type { BaseElement } from './base.js';

export interface TextElement extends BaseElement, Sized {
  type: 'text';
  content: string;
  fontSize: number;
  color: string;
}
