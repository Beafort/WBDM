// Binary writer helper for the recorder

export class BinaryWriter {
  private bytes: Uint8Array;
  private view: DataView;
  private offset = 0;

  constructor(size: number = 32) {
    this.bytes = new Uint8Array(size);
    this.view = new DataView(this.bytes.buffer);
  }

  writeUInt8(value: number) {
    this.ensure(1);
    this.view.setUint8(this.offset, value);
    this.offset += 1;
  }

  writeUInt16LE(value: number) {
    this.ensure(4);
    this.view.setUint16(this.offset, value, true);
    this.offset += 2;
  }

  writeUInt32LE(value: number) {
    this.ensure(4);
    this.view.setUint32(this.offset, value, true);
    this.offset += 4;
  }

  writeUInt64LE(value: number) {
    this.ensure(8);
    this.view.setBigUint64(this.offset, BigInt(value), true);
    this.offset += 8;
  }

  writeFloat32LE(value: number) {
    this.ensure(4);
    this.view.setFloat32(this.offset, value, true);
    this.offset += 4;
  }
  writeString(value: string) {
    this.ensure(value.length);
    const bytes = new TextEncoder().encode(value);
    this.bytes.set(bytes, this.offset);
    this.offset += bytes.length;
  }

  getBytes() {
    return this.bytes.slice(0, this.offset);
  }

  private ensure(n: number) {
    const needed = this.offset + n;
    if (needed <= this.bytes.length) return;

    let size = this.bytes.length * 2;
    while (size < needed) size *= 2;

    const next = new Uint8Array(size);
    next.set(this.bytes);
    this.bytes = next;
    this.view = new DataView(next.buffer);
  }
}
