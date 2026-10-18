import { Player, Recorder, type Sink, type StrokeEvent } from 'wbdm';
import { Whiteboard } from './features/whiteboard/whiteboard';
import './style.css';
function emitMove(strokeId: number, point: { x: number; y: number }) {
  const event: StrokeEvent = { t: Date.now(), type: 'stroke', action: 'move', strokeId, point };
  whiteboard.apply(event);
  whiteboard.draw();
  recorder?.writeEvent(event).catch(console.error);
  lastPoint = point;
  pendingPoint = undefined;
}

function endStroke() {
  if (currentStroke === undefined) return;
  if (pendingPoint) emitMove(currentStroke, pendingPoint);
  const event: StrokeEvent = {
    t: Date.now(),
    type: 'stroke',
    action: 'end',
    strokeId: currentStroke,
  };
  whiteboard.apply(event);
  whiteboard.draw();
  recorder?.writeEvent(event).catch(console.error);
  currentStroke = lastPoint = pendingPoint = undefined;
}

let currentStroke: number | undefined = undefined;
let lastPoint: { x: number; y: number } | undefined;
let pendingPoint: { x: number; y: number } | undefined;
let player: Player | undefined;
const MIN_DIST = 0.5;
const recordButton = document.querySelector<HTMLButtonElement>('#record')!;
const stopButton = document.querySelector<HTMLButtonElement>('#stop')!;
const input = document.querySelector<HTMLInputElement>('#recording')!;
const clearButton = document.querySelector<HTMLButtonElement>('#clear')!;
const canvas = document.querySelector<HTMLCanvasElement>('#whiteboard')!;
const timeDisplay = document.querySelector<HTMLSpanElement>('#timestamp')!;
const scrubber = document.querySelector<HTMLInputElement>('#scrubber')!;
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

  const r = new Recorder(sink);
  await r.start();
  recorder = r;

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

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  const r = recorder;
  recorder = undefined;
  await r.stop();
});
scrubber.addEventListener('input', () => player?.seek(Number(scrubber.value)));
input.addEventListener('change', async () => {
  const file = input.files?.[0];
  if (!file) return;
  player?.pause();
  whiteboard.clear();
  const bytes = new Uint8Array(await file.arrayBuffer());
  let next: Player;
  try {
    next = new Player(bytes);
  } catch (err) {
    alert('Not a valid .wbdm file');
    return;
  }
  player?.pause();
  whiteboard.clear();
  player = next;
  scrubber.max = String(player.duration);
  scrubber.value = '0';
  player.onReset(() => whiteboard.clear());
  player.onEvent((e) => whiteboard.apply(e));
  player.onTick((pos) => {
    whiteboard.draw();
    scrubber.value = pos.toString();
    timeDisplay.textContent = formatTime(pos);
  });

  player.start();
});
function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
canvas.addEventListener('pointerdown', (e: PointerEvent) => {
  canvas.setPointerCapture(e.pointerId);
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
  emitMove(currentStroke, point);
});
canvas.addEventListener('pointerup', endStroke);
canvas.addEventListener('pointercancel', endStroke);
clearButton.addEventListener('click', () => whiteboard.clear());
