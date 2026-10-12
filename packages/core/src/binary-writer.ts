// Binary writer helper for the recorder

export class BinaryWriter {
  private bytes: Uint8Array;
  private view: DataView;
  private offset = 0;

  constructor(size: number) {
    this.bytes = new Uint8Array(size);
    this.view = new DataView(this.bytes.buffer);
  }

  writeUInt8(value: number) {
    this.view.setUint8(this.offset, value);
    this.offset += 1;
  }

  writeUInt16LE(value: number) {
    this.view.setUint16(this.offset, value, true);
    this.offset += 2;
  }

  writeUInt32LE(value: number) {
    this.view.setUint32(this.offset, value, true);
    this.offset += 4;
  }

  writeUInt64LE(value: number) {
    this.view.setBigUint64(this.offset, BigInt(value), true);
    this.offset += 8;
  }

  writeFloat32LE(value: number) {
    this.view.setFloat32(this.offset, value, true);
    this.offset += 4;
  }
  writeString(value: string) {
    const bytes = new TextEncoder().encode(value);
    this.bytes.set(bytes, this.offset);
    this.offset += bytes.length;
  }

  getBytes() {
    return this.bytes;
  }
}
