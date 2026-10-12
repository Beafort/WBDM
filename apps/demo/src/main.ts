import { Recorder, type Sink } from 'wbdm';
import './style.css';

const strokes = new Map<number, Stroke>();
const recordButton = document.querySelector<HTMLButtonElement>('#record')!;
const stopButton = document.querySelector<HTMLButtonElement>('#stop')!;
const downloadButton = document.querySelector<HTMLButtonElement>('#download')!;
const whiteboard = document.querySelector<HTMLCanvasElement>('#whiteboard')!;

let recorder: Recorder | undefined;
let file: FileSystemFileHandle | undefined;
recordButton.addEventListener('click', async () => {
  const root = await navigator.storage.getDirectory();
  file = await root.getFileHandle('recording.wbdm', {
    create: true,
  });
  const writable = await file.createWritable();

  const sink: Sink = {
    async write(bytes: Uint8Array) {
      const buffer = new Uint8Array(bytes);
      return writable.write(buffer);
    },

    close() {
      return writable.close();
    },
  };

  recorder = new Recorder(sink);

  await recorder.start();

  console.log('Recording started');
});
stopButton.addEventListener('click', async () => {
  if (!recorder || !file) return;

  await recorder.stop();

  const recordedFile = await file.getFile();
  const url = URL.createObjectURL(recordedFile);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'recording.wbdm';
  link.click();

  URL.revokeObjectURL(url);

  recorder = undefined;
});
downloadButton.addEventListener('click', async () => {
  if (!file) return;

  const recordedFile = await file.getFile();

  const url = URL.createObjectURL(recordedFile);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'recording.wbdm';
  link.click();

  URL.revokeObjectURL(url);
});

whiteboard.addEventListener('pointerdown', (e: PointerEvent) => {
  if (!recorder) return;
  recorder.writeEvent({
    t: Date.now(),
    type: 'stroke',
    action: 'start',
    strokeId: recorder.getNextStrokeId(),
    color: 1,
    width: 10,
    point: { x: e.x, y: e.y },
  });
});
whiteboard.addEventListener('pointermove', (e: PointerEvent) => {
  if (!recorder) return;
  recorder.writeEvent({
    t: Date.now(),
    type: 'stroke',
    action: 'move',
    strokeId: recorder.getNextStrokeId(),
    point: { x: e.x, y: e.y },
  });
});
whiteboard.addEventListener('pointerup', (e: PointerEvent) => {
  if (!recorder) return;
  recorder.writeEvent({
    t: Date.now(),
    type: 'stroke',
    action: 'end',
    strokeId: recorder.getNextStrokeId(),
  });
});
