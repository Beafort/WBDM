import { encodeColor } from '../canvas/color.js';
import type { Colored, Positioned, WbEvent } from '../types/events/base.js';
import type { StrokeEvent } from '../types/events/stroke.js';
import type { TextEvent } from '../types/events/text.js';
import type { Sized } from '../types/geometry.js';
import { Action, pack, Type } from '../types/opcodes.js';
import { BinaryWriter } from './binary-writer.js';

export function encodeHeader(baseTime: number): Uint8Array {
  const w = new BinaryWriter(13);

  w.writeBytes(new TextEncoder().encode('WBDM'));
  w.writeUInt8(1);
  w.writeUInt64LE(baseTime);

  return w.getBytes();
}

export function encodeEvent(e: WbEvent, baseTime: number): Uint8Array {
  switch (e.type) {
    case 'stroke':
      return encodeStroke(e, baseTime);
    case 'text':
      return encodeText(e, baseTime);
    case 'element':
    default:
      throw new Error('Not implemented!');
  }
}
function encodeStroke(e: StrokeEvent, baseTime: number): Uint8Array {
  const w = new BinaryWriter();

  w.writeUInt8(pack(Type.stroke, Action.stroke[e.action]));
  w.writeUInt32LE(Math.max(0, Math.round(e.t - baseTime)));
  w.writeUInt32LE(e.eId);
  switch (e.action) {
    case 'start':
      w.writeUInt8(encodeColor(e.color));
      w.writeUInt8(e.width);
      encodePositioned(w, e);
      break;
    case 'move':
      w.writeFloat32LE(e.point.x);
      w.writeFloat32LE(e.point.y);
      break;
    case 'end':
      break;
  }
  return w.getBytes();
}

function encodeText(e: TextEvent, baseTime: number): Uint8Array {
  const w = new BinaryWriter();

  w.writeUInt8(pack(Type.text, Action.text[e.action]));
  w.writeUInt32LE(Math.max(0, Math.round(e.t - baseTime)));
  w.writeUInt32LE(e.eId);
  encodeColored(w, e);
  encodePositioned(w, e);
  encodeSized(w, e);
  switch (e.action) {
    case 'start':
      w.writeUInt8(e.fontSize);
      break;
    case 'modify':
      w.writeUInt8(e.fontSize);
      w.writeString(e.content);
      break;
  }
  return w.getBytes();
}

function encodeColored(w: BinaryWriter, e: Colored) {
  w.writeUInt8(encodeColor(e.color));
}

function encodePositioned(w: BinaryWriter, e: Positioned) {
  w.writeFloat32LE(e.position.x);
  w.writeFloat32LE(e.position.y);
}

function encodeSized(w: BinaryWriter, e: Sized) {
  w.writeFloat32LE(e.width);
  w.writeFloat32LE(e.height);
}
