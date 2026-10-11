export interface Sink {
  write(data: Uint8Array): Promise<void>;
  close(): Promise<void>;
}
