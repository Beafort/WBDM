import type { BaseEvent } from './base.js';

export type Point = { x: number; y: number; p?: number };

export interface StrokeStart extends BaseEvent {
  type: 'stroke';
  action: 'start';
  strokeId: number;
  point: Point;
  color: number;
  width: number;
}

export interface StrokeMove extends BaseEvent {
  type: 'stroke';
  action: 'move';
  strokeId: number;
  point: Point;
}

export interface StrokeEnd extends BaseEvent {
  type: 'stroke';
  action: 'end';
  strokeId: number;
}

export interface StrokeDelete extends BaseEvent {
  type: 'stroke';
  action: 'delete';
  strokeId: number;
}

export interface StrokeInsert extends BaseEvent {
  type: 'stroke';
  action: 'insert';
  strokeId: number;
}

export type StrokeEvent = StrokeStart | StrokeMove | StrokeEnd | StrokeDelete | StrokeInsert;

export type StrokeEventType = StrokeEvent['type'];
