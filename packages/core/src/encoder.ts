import { BinaryWriter } from './binary-writer.js';
import { encodeColor } from './renderer/color.js';
import type { WbEvent } from './types/events/base.js';
import type { StrokeEvent } from './types/events/stroke.js';
import { Action, pack, Type } from './types/opcodes.js';

export function encodeHeader(baseTime: number): Uint8Array {
  const buffer = new BinaryWriter(13);

  buffer.writeString('WBDM');
  buffer.writeUInt8(1);
  buffer.writeUInt64LE(baseTime);

  return buffer.getBytes();
}

export function encodeEvent(e: WbEvent, baseTime: number): Uint8Array {
  switch (e.type) {
    case 'stroke':
      return encodeStroke(e, baseTime);
  }
}
function encodeStroke(e: StrokeEvent, baseTime: number): Uint8Array {
  const buf = new BinaryWriter();

  buf.writeUInt8(pack(Type.stroke, Action.stroke[e.action]));
  buf.writeUInt32LE(Math.max(0, Math.round(e.t - baseTime)));
  buf.writeUInt32LE(e.eId);
  switch (e.action) {
    case 'start':
      buf.writeUInt8(encodeColor(e.color));
      buf.writeUInt8(e.width);
      buf.writeFloat32LE(e.position.x);
      buf.writeFloat32LE(e.position.y);
      break;
    case 'move':
      buf.writeFloat32LE(e.point.x);
      buf.writeFloat32LE(e.point.y);
      break;
    case 'end':
      break;
  }
  return buf.getBytes();
}
