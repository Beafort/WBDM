import { describe, expect, test } from 'vitest';
import { COLORS } from '../canvas/color.js';
import type { AudioChunk, AudioEvent } from '../types/events/audio.js';
import type { WbEvent } from '../types/events/base.js';
import type { TextEvent } from '../types/events/text.js';
import { BinaryReader } from './binary-reader.js';
import { decodeEvent, decodeHeader } from './decoder.js';
import { encodeEvent, encodeHeader } from './encoder.js';
const roundTrip = async (event: WbEvent) => {
  const baseTime = event.t;
  const bytes = await encodeEvent(event, baseTime);

  return decodeEvent(new BinaryReader(bytes), baseTime);
};
const bytesOf = async (b: Blob) => new Uint8Array(await b.arrayBuffer());
test('header', () => {
  decodeHeader(new BinaryReader(encodeHeader(Date.now())));
});
describe('event round trip', () => {
  test('stroke start', async () => {
    const e: WbEvent = {
      t: 120,
      type: 'stroke',
      action: 'start',
      eId: 7,
      width: 5,
      color: COLORS.black,
      position: { x: 200, y: 100 },
    };
    expect(await roundTrip(e)).toEqual(e);
  });

  test('stroke move', async () => {
    const e: WbEvent = {
      t: 120,
      type: 'stroke',
      action: 'move',
      eId: 7,
      point: { x: 200, y: 100 },
    };
    expect(await roundTrip(e)).toEqual(e);
  });

  test('stroke end', async () => {
    const e: WbEvent = {
      t: 120,
      type: 'stroke',
      action: 'end',
      eId: 7,
    };
    expect(await roundTrip(e)).toEqual(e);
  });

  test('text start', async () => {
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
    expect(await roundTrip(e)).toEqual(e);
  });

  test('text modify', async () => {
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
    expect(await roundTrip(e)).toEqual(e);
  });
});
describe('audio round trip', () => {
  test('audio start', async () => {
    const payload = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1, 2, 3]); // WebM magic + data
    const e: AudioEvent = {
      t: 150,
      type: 'audio',
      action: 'start',
      mime: 'audio/webm;codecs=opus',
      blob: new Blob([payload], { type: 'audio/webm;codecs=opus' }),
    };

    const out = (await roundTrip(e)) as AudioEvent;

    expect(out.t).toBe(e.t);
    expect(out.type).toBe('audio');
    expect(out.action).toBe('start');
    if (out.action !== 'start') throw new Error('unreachable');
    expect(out.mime).toBe(e.mime);
    expect(out.blob.type).toBe(e.mime);
    expect(await bytesOf(out.blob)).toEqual(payload);
  });

  test('audio chunk', async () => {
    const payload = new Uint8Array([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
    const e: AudioEvent = {
      t: 1150,
      type: 'audio',
      action: 'chunk',
      blob: new Blob([payload]),
    };

    const out = (await roundTrip(e)) as AudioChunk;

    expect(out.t).toBe(e.t);
    expect(out.action).toBe('chunk');
    expect(await bytesOf(out.blob)).toEqual(payload);
  });

  test('empty chunk', async () => {
    const e: AudioEvent = {
      t: 200,
      type: 'audio',
      action: 'chunk',
      blob: new Blob([]),
    };
    const out = (await roundTrip(e)) as AudioChunk;
    expect(out.blob.size).toBe(0);
  });

  test('large chunk keeps every byte', async () => {
    const payload = new Uint8Array(64 * 1024).map((_, i) => i % 251);
    const e: AudioEvent = {
      t: 300,
      type: 'audio',
      action: 'chunk',
      blob: new Blob([payload]),
    };
    const out = (await roundTrip(e)) as AudioChunk;
    expect(await bytesOf(out.blob)).toEqual(payload);
  });

  test('sequential stream: start, chunks, then a stroke', async () => {
    const baseTime = 0;
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([4, 5]);
    const events: WbEvent[] = [
      { t: 0, type: 'audio', action: 'start', mime: 'audio/webm', blob: new Blob([a]) },
      { t: 1000, type: 'audio', action: 'chunk', blob: new Blob([b]) },
      { t: 1100, type: 'stroke', action: 'end', eId: 1 },
    ];

    const parts: Uint8Array[] = [];
    for (const ev of events) parts.push(await encodeEvent(ev, baseTime));

    const all = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let o = 0;
    for (const p of parts) {
      all.set(p, o);
      o += p.length;
    }

    const reader = new BinaryReader(all);
    const decoded: WbEvent[] = [];
    while (reader.remaining > 0) decoded.push(decodeEvent(reader, baseTime));

    expect(decoded).toHaveLength(3);
    expect(decoded[0]!.type).toBe('audio');
    expect(decoded[1]!.type).toBe('audio');
    expect(decoded[2]).toEqual(events[2]);
    expect(await bytesOf((decoded[0] as any).blob)).toEqual(a);
    expect(await bytesOf((decoded[1] as any).blob)).toEqual(b);
  });
});
