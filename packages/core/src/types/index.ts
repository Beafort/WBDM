import type { StrokeEvent } from './events/stroke.js';

export interface BaseEvent {
  t: number;
}
export type WbEvent = StrokeEvent;
