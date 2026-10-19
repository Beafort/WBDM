import type { Sized } from '../geometry.js';
import type { BaseEvent, Colored, Positioned } from './base.js';

export interface TextStart extends BaseEvent, Colored, Positioned, Sized {
  type: 'text';
  action: 'start';
  content: '';
  fontSize: number;
}

export interface TextModify extends BaseEvent, Colored, Positioned, Sized {
  type: 'text';
  action: 'modify';
  content: string;
  fontSize: number;
}

export type TextEvent = TextStart | TextModify;

export type TextEventType = TextEvent['type'];
