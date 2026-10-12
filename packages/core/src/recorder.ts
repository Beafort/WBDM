import { encodeEvent, encodeHeader } from './encoder.js';
import type { Sink } from './sink.js';
import type { WbEvent } from './types/events/base.js';

enum RecorderState {
  Idle,
  Recording,
  Stopped,
}
export class Recorder {
  private baseTime: number = 0;
  private sink: Sink;
  private state: RecorderState = RecorderState.Idle;
  private strokeCount: number = 0;
  constructor(sink: Sink) {
    this.sink = sink;
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
    this.baseTime = Date.now();
    await this.sink.write(encodeHeader(this.baseTime));
    this.state = RecorderState.Recording;
  }

  async stop() {
    await this.sink.close();
    this.state = RecorderState.Stopped;
  }

  async writeEvent(e: WbEvent) {
    if (this.state != RecorderState.Recording) throw Error('Not Recording!');
    await this.sink.write(encodeEvent(e, this.baseTime));
  }

  getNextStrokeId() {
    return this.strokeCount++;
  }
}
