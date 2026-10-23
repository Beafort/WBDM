export class BinaryReader {
  private view: DataView;
  private offset = 0;

  constructor(private bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }
  /**
   * Gets the number of unread bytes remaining in the buffer.
   */
  get remaining() {
    return this.bytes.length - this.offset;
  }

  readBytes(length: number): Uint8Array {
    this.ensure(length);
    const start = this.offset;
    this.offset += length;
    return this.bytes.subarray(start, this.offset);
  }

  readString(): string {
    const length = this.readUInt16LE();
    console.log('String length prefix:', length);

    const bytes = this.readBytes(length);
    console.log('Bytes read:', bytes.length);

    return new TextDecoder().decode(bytes);
  }

  readUInt8() {
    this.ensure(1);
    return this.view.getUint8(this.offset++);
  }

  readUInt16LE() {
    this.ensure(2);
    const start = this.offset;
    this.offset += 2;
    return this.view.getUint16(start, true);
  }

  readUInt32LE() {
    this.ensure(4);
    const start = this.offset;
    this.offset += 4;
    return this.view.getUint32(start, true);
  }

  readUInt64LE() {
    this.ensure(8);
    const start = this.offset;
    this.offset += 8;
    return this.view.getBigUint64(start, true);
  }

  readFloat32LE() {
    this.ensure(4);
    const start = this.offset;
    this.offset += 4;
    return this.view.getFloat32(start, true);
  }

  private ensure(n: number) {
    if (this.offset + n > this.bytes.length) throw Error('End of file reached!');
  }
}
