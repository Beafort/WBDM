import { BinaryReader } from './binary-reader.js';
import type { WbEvent } from './types/events/base.js';
import type { StrokeEvent } from './types/events/stroke.js';
import { Action, actionOf, Type, typeOf } from './types/opcodes.js';

export function decodeWBDM(bytes: Uint8Array): { baseTime: number; events: WbEvent[] } {
  const reader = new BinaryReader(bytes);
  const { baseTime } = decodeHeader(reader);
  const events: WbEvent[] = [];
  while (reader.remaining > 0) {
    events.push(decodeEvent(reader, baseTime));
  }
  return { baseTime, events };
}
function decodeHeader(reader: BinaryReader): { version: number; baseTime: number } {
  if (reader.readString(4) != 'WBDM') throw new Error('Not a WBDM file!');

  const version = reader.readUInt8();
  const baseTime = Number(reader.readUInt64LE());

  return { version, baseTime };
}

function decodeEvent(reader: BinaryReader, baseTime: number): WbEvent {
  const op = reader.readUInt8();
  const t = baseTime + reader.readUInt32LE();

  switch (typeOf(op)) {
    case Type.stroke: {
      return decodeStroke(reader, actionOf(op), t);
    }
    default:
      throw new Error('Unknown event type in opcode 0x' + op.toString(16));
  }
}

function decodeStroke(reader: BinaryReader, action: number, t: number): StrokeEvent {
  const strokeId = reader.readUInt32LE();
  switch (action) {
    case Action.stroke.start:
      return {
        t,
        type: 'stroke',
        action: 'start',
        color: reader.readUInt8(),
        width: reader.readUInt8(),
        strokeId,
        point: { x: reader.readFloat32LE(), y: reader.readFloat32LE() },
      };
    case Action.stroke.move:
      return {
        t,
        strokeId,
        type: 'stroke',
        action: 'move',
        point: { x: reader.readFloat32LE(), y: reader.readFloat32LE() },
      };
    case Action.stroke.end:
      return { t, type: 'stroke', action: 'end', strokeId };
    case Action.stroke.delete:
      return { t, type: 'stroke', action: 'delete', strokeId };
    case Action.stroke.insert:
      return { t, type: 'stroke', action: 'insert', strokeId };
    default:
      throw new Error('Unknown action for stroke event 0x' + action.toString(16));
  }
}
