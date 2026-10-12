import { Player, Recorder, type Sink, type StrokeEvent } from 'wbdm';
import './style.css';
import { Whiteboard } from './features/whiteboard/whiteboard';

let currentStroke: number | undefined = undefined;
let lastPoint: { x: number; y: number } | undefined;
let pendingPoint: { x: number; y: number } | undefined;
const MIN_DIST = 0.5;
const recordButton = document.querySelector<HTMLButtonElement>('#record')!;
const stopButton = document.querySelector<HTMLButtonElement>('#stop')!;
const input = document.querySelector<HTMLInputElement>('#recording')!;
const canvas = document.querySelector<HTMLCanvasElement>('#whiteboard')!;
const progress = document.querySelector<HTMLProgressElement>('#progress')!;
const timeDisplay = document.querySelector<HTMLSpanElement>('#timestamp')!;
const whiteboard = new Whiteboard(canvas);
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

input.addEventListener('change', async () => {
  const file = input.files?.[0];
  if (!file) return;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const player = new Player(bytes);
  player.onEvent((e) => {
    whiteboard.apply(e);
    whiteboard.draw();
  });

  player.start();
  progress.max = player.duration;
  progress.value = 0;
  player.onTick((pos) => {
    progress.value = pos;

    const seconds = Math.floor(pos / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    timeDisplay.innerText = `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  });
});

canvas.addEventListener('pointerdown', (e: PointerEvent) => {
  const event: StrokeEvent = {
    t: Date.now(),
    type: 'stroke',
    action: 'start',
    strokeId: whiteboard.newStrokeId(),
    color: 1,
    width: 10,
    point: { x: e.offsetX, y: e.offsetY },
  };
  currentStroke = event.strokeId;
  whiteboard.apply(event);
  whiteboard.draw();
  recorder?.writeEvent(event).catch(console.error);
  lastPoint = { x: e.offsetX, y: e.offsetY };
  pendingPoint = undefined;
});
canvas.addEventListener('pointermove', (e) => {
  if (currentStroke === undefined || !lastPoint) return;
  const point = { x: e.offsetX, y: e.offsetY };
  const dx = point.x - lastPoint.x;
  const dy = point.y - lastPoint.y;

  if (dx * dx + dy * dy < MIN_DIST * MIN_DIST) {
    pendingPoint = point;
    return;
  }
  const event: StrokeEvent = {
    t: Date.now(),
    type: 'stroke',
    action: 'move',
    strokeId: currentStroke,
    point: { x: e.offsetX, y: e.offsetY },
  };
  whiteboard.apply(event);
  whiteboard.draw();
  recorder?.writeEvent(event).catch(console.error);
  lastPoint = point;
  pendingPoint = undefined;
});
canvas.addEventListener('pointerup', (e: PointerEvent) => {
  if (!currentStroke) return;
  const event: StrokeEvent = {
    t: Date.now(),
    type: 'stroke',
    action: 'end',
    strokeId: currentStroke,
  };
  whiteboard.apply(event);

  whiteboard.draw();
  currentStroke = 0;
  recorder?.writeEvent(event).catch(console.error);

  currentStroke = undefined;
  lastPoint = undefined;
  pendingPoint = undefined;
});
