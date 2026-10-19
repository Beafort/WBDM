import type { BaseEvent, Positioned } from './base.js';

export interface ElementMove extends BaseEvent, Positioned {
  type: 'element';
  action: 'move';
}

export interface ElementDelete extends BaseEvent {
  type: 'element';
  action: 'delete';
}

export interface ElementInsert extends BaseEvent, Positioned {
  type: 'element';
  action: 'insert';
}

export type ElementEvent = ElementMove | ElementDelete | ElementInsert;

export type ElementEventType = ElementEvent['type'];
