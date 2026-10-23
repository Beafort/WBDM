import { describe, expect, test } from 'vitest';
import { COLORS } from '../canvas/color.js';
import type { WbEvent } from '../types/events/base.js';
import type { TextEvent } from '../types/events/text.js';
import { BinaryReader } from './binary-reader.js';
import { decodeEvent, decodeHeader } from './decoder.js';
import { encodeEvent, encodeHeader } from './encoder.js';
const roundTrip = (event: WbEvent) => {
  const baseTime = event.t;
  const bytes = encodeEvent(event, baseTime);

  return decodeEvent(new BinaryReader(bytes), baseTime);
};
test('header', () => {
  decodeHeader(new BinaryReader(encodeHeader(Date.now())));
});
describe('event round trip', () => {
  test('stroke start', () => {
    const e: WbEvent = {
      t: 120,
      type: 'stroke',
      action: 'start',
      eId: 7,
      width: 5,
      color: COLORS.black,
      position: { x: 200, y: 100 },
    };
    expect(roundTrip(e)).toEqual(e);
  });

  test('stroke move', () => {
    const e: WbEvent = {
      t: 120,
      type: 'stroke',
      action: 'move',
      eId: 7,
      point: { x: 200, y: 100 },
    };
    expect(roundTrip(e)).toEqual(e);
  });

  test('stroke end', () => {
    const e: WbEvent = {
      t: 120,
      type: 'stroke',
      action: 'end',
      eId: 7,
    };
    expect(roundTrip(e)).toEqual(e);
  });

  test('text start', () => {
    const e: TextEvent = {
      t: 100,
      type: 'text',
      action: 'start',
      content: '',
      fontSize: 7,
      color: COLORS.black,
      position: { x: 100, y: 200 },
      width: 200,
      height: 200,
      eId: 8,
    };
    expect(roundTrip(e)).toEqual(e);
  });

  test('text modify', () => {
    const e: TextEvent = {
      t: 100,
      type: 'text',
      action: 'modify',
      content: 'Hello Worlds !',
      fontSize: 7,
      color: COLORS.black,
      position: { x: 100, y: 200 },
      width: 200,
      height: 200,
      eId: 8,
    };
    expect(roundTrip(e)).toEqual(e);
  });
});
