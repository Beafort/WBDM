import { BinaryWriter } from './binary-writer.js';
import type { Sink } from './sink.js';
import type { StrokeEvent } from './types/events/stroke.js';
import type { WbEvent } from './types/index.js';

export class Recorder {
  private baseTime: number;
  private sink: Sink;
  constructor(sink: Sink) {
    this.sink = sink;
    this.baseTime = Math.floor(Date.now() / 1000);
  }

  /**
   * Writes the file header.
   *
   * Layout (13 bytes total, little-endian):
   *
   *   Offset  Size  Field      Description
   *   ------  ----  ---------  ------------------------------------
   *   0       4     magic      ASCII "WBDM" (0x57 0x42 0x44 0x4D)
   *   4       1     version    Format version, uint8
   *   5       8     timestamp  Recording start, ms since Unix epoch, uint64
   */
  async start() {
    const header = new BinaryWriter(13);

    header.writeString('WBDM');
    header.writeUInt8(1);
    header.writeUInt64LE(this.baseTime);
    console.log(header);
    await this.sink.write(header.getBytes());
  }

  async stop() {
    await this.sink.close();
  }

  async writeEvent(e: WbEvent) {
    switch (e.type) {
      case 'stroke':
        this.writeStrokeEvent(e);
        break;
    }
  }

  //
  private writeStrokeEvent(e: StrokeEvent) {
    const buffer = new BinaryWriter(8);

    buffer.writeUInt8(0);
  }
}
