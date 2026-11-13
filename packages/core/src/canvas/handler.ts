import type { WbElement } from '../types/elements/base.js';
import type { AudioEvent } from '../types/events/audio.js';
import type { ElementEvent } from '../types/events/element.js';
import type { StrokeEvent } from '../types/events/stroke.js';
import type { TextEvent } from '../types/events/text.js';
import type { WbCanvas } from './canvas.js';

export function applyElementEvent(canvas: WbCanvas, event: ElementEvent) {
  throw new Error('Method not implemented.');
}
export function applyTextEvent(canvas: WbCanvas, event: TextEvent) {
  switch (event.action) {
    case 'start':
      canvas.elements.set(event.eId, {
        id: event.eId,
        type: 'text',
        color: event.color,
        content: '',
        width: event.width,
        height: event.height,
        fontSize: event.fontSize,
        position: event.position,
        visible: true,
      });
    case 'modify': {
      const text = getElement(canvas.elements, event.eId, 'text');
      if (!text) return;
      text.content = event.content;
      text.color = event.color;
      text.fontSize = event.fontSize;
      text.position = event.position;
      text.width = event.width;
      text.height = event.height;
      return;
    }
  }
}
export function applyStrokeEvent(canvas: WbCanvas, event: StrokeEvent) {
  switch (event.action) {
    case 'start':
      canvas.elements.set(event.eId, {
        id: event.eId,
        type: 'stroke',
        color: event.color,
        width: event.width,
        position: event.position,
        points: [{ x: 0, y: 0 }],
        visible: true,
      });
      return;
    case 'move':
      const stroke = getElement(canvas.elements, event.eId, 'stroke');
      if (!stroke) return;
      stroke.points.push(event.point);
      return;
    case 'end':
  }
}
export function applyAudioEvent(canvas: WbCanvas, event: AudioEvent) {}
function getElement<T extends WbElement['type']>(
  elements: Map<number, WbElement>,
  id: number,
  type: T,
): Extract<WbElement, { type: T }> | undefined {
  const el = elements.get(id);
  return el?.type === type ? (el as Extract<WbElement, { type: T }>) : undefined;
}
