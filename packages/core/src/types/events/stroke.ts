export type Point = { x: number; y: number; p?: number };

export interface StrokeStart {
  type: 'stroke';
  action: 'start';
  strokeId: string;
  point: Point;
  color: number;
  width: number;
}

export interface StrokeMove {
  type: 'stroke';
  action: 'move';
  strokeId: string;
  point: Point;
}

export interface StrokeEnd {
  type: 'stroke';
  action: 'end';
  strokeId: string;
}

export interface StrokeDelete {
  type: 'stroke';
  action: 'delete';
  strokeId: string;
}

export interface StrokeInsert {
  type: 'stroke';
  action: 'insert';
  strokeId: string;
}

export type StrokeEvent = StrokeStart | StrokeMove | StrokeEnd | StrokeDelete | StrokeInsert;

export type StrokeEventType = StrokeEvent['type'];
