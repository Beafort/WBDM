import { BinaryWriter } from './binary-writer.js';
import type { WbEvent } from './types/events/base.js';
import type { StrokeEvent } from './types/events/stroke.js';
import { Type, Action, pack } from './types/opcodes.js';

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
  buf.writeUInt32LE(e.strokeId);
  switch (e.action) {
    case 'start':
      buf.writeUInt8(e.color);
      buf.writeUInt8(e.width);
      buf.writeFloat32LE(e.point.x);
      buf.writeFloat32LE(e.point.y);
      break;
    case 'move':
      buf.writeFloat32LE(e.point.x);
      buf.writeFloat32LE(e.point.y);
      break;
    case 'end':
    case 'delete':
    case 'insert':
      break;
  }
  return buf.getBytes();
}
