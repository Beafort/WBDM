import { decodeColor } from '../canvas/color.js';
import type { Colored, Positioned, WbEvent } from '../types/events/base.js';
import type { StrokeEvent } from '../types/events/stroke.js';
import type { Sized } from '../types/geometry.js';
import { Action, actionOf, Type, typeOf } from '../types/opcodes.js';
import { BinaryReader } from './binary-reader.js';

export function decodeWBDM(bytes: Uint8Array): { baseTime: number; events: WbEvent[] } {
  const reader = new BinaryReader(bytes);
  const { baseTime } = decodeHeader(reader);
  const events: WbEvent[] = [];
  while (reader.remaining > 0) {
    events.push(decodeEvent(reader, baseTime));
  }
  return { baseTime, events };
}

export function decodeHeader(reader: BinaryReader): { version: number; baseTime: number } {
  const magic = new TextDecoder().decode(reader.readBytes(4));

  if (magic !== 'WBDM') {
    throw new Error('Not a WBDM file!');
  }

  const version = reader.readUInt8();
  const baseTime = Number(reader.readUInt64LE());

  return { version, baseTime };
}

export function decodeEvent(reader: BinaryReader, baseTime: number): WbEvent {
  const op = reader.readUInt8();
  const t = baseTime + reader.readUInt32LE();

  switch (typeOf(op)) {
    case Type.stroke: {
      return decodeStroke(reader, actionOf(op), t);
    }
    case Type.text: {
      return decodeText(reader, actionOf(op), t);
    }
    default:
      throw new Error('Unknown event type in opcode 0x' + op.toString(16));
  }
}

function decodeStroke(reader: BinaryReader, action: number, t: number): StrokeEvent {
  const eId = reader.readUInt32LE();
  switch (action) {
    case Action.stroke.start:
      return {
        t,
        type: 'stroke',
        action: 'start',
        color: decodeColor(reader.readUInt8()),
        width: reader.readUInt8(),
        eId,
        position: { x: reader.readFloat32LE(), y: reader.readFloat32LE() },
      };
    case Action.stroke.move:
      return {
        t,
        eId,
        type: 'stroke',
        action: 'move',
        point: { x: reader.readFloat32LE(), y: reader.readFloat32LE() },
      };
    case Action.stroke.end:
      return { t, type: 'stroke', action: 'end', eId };
    default:
      throw new Error('Unknown action for stroke event 0x' + action.toString(16));
  }
}
function decodeText(r: BinaryReader, action: number, t: number): WbEvent {
  const eId = r.readUInt32LE();
  const col = decodeColored(r);
  const pos = decodePositioned(r);
  const siz = decodeSized(r);
  switch (action) {
    case Action.text.start:
      return {
        t,
        type: 'text',
        action: 'start',
        eId,
        ...col,
        ...pos,
        ...siz,
        fontSize: r.readUInt8(),
        content: '',
      };
    case Action.text.modify:
      return {
        t,
        type: 'text',
        action: 'modify',
        eId,
        ...col,
        ...pos,
        ...siz,
        fontSize: r.readUInt8(),
        content: r.readString(),
      };
  }
}

function decodeColored(r: BinaryReader): Colored {
  return { color: decodeColor(r.readUInt8()) };
}

function decodePositioned(r: BinaryReader): Positioned {
  return { position: { x: r.readFloat32LE(), y: r.readFloat32LE() } };
}

function decodeSized(r: BinaryReader): Sized {
  return { width: r.readFloat32LE(), height: r.readFloat32LE() };
}
