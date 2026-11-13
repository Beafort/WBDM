import type { BaseEvent } from './base.js';

export interface AudioStart extends Omit<BaseEvent, 'eId'> {
  type: 'audio';
  action: 'start';
  mime: string;
  blob: Blob;
}

export interface AudioChunk extends Omit<BaseEvent, 'eId'> {
  type: 'audio';
  action: 'chunk';
  blob: Blob;
}

export interface AudioEnd extends Omit<BaseEvent, 'eId'> {
  type: 'audio';
  action: 'end';
}
export type AudioEvent = AudioStart | AudioChunk | AudioEnd;
