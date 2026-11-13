import {
  Player,
  Recorder,
  WbCanvas,
  WbPenTool,
  WbTextTool,
  type Sink,
  type WbTextEditor,
  type WbTool,
} from 'wbdm';
import './style.css';

const recordButton = document.querySelector<HTMLButtonElement>('#record')!;
const stopButton = document.querySelector<HTMLButtonElement>('#stop')!;
const input = document.querySelector<HTMLInputElement>('#recording')!;
const clearButton = document.querySelector<HTMLButtonElement>('#clear')!;
const canvas = document.querySelector<HTMLCanvasElement>('#whiteboard')!;
const timeDisplay = document.querySelector<HTMLSpanElement>('#timestamp')!;
const scrubber = document.querySelector<HTMLInputElement>('#scrubber')!;
const toolSelector = document.querySelector<HTMLSelectElement>('#tool')!;
const textEditor = document.querySelector<HTMLTextAreaElement>('#text-editor')!;
const micButton = document.querySelector<HTMLButtonElement>('#mic')!;
let talking = false;
function setTalking(on: boolean) {
  if (!recorder) return;
  talking = on;
  if (on) recorder.startTalking();
  else void recorder.stopTalking();
  micButton.textContent = on ? '🔴 Mic on' : '🎙 Mic off';
}

const editor: WbTextEditor = {
  open(position, content, style, onChange, onFinish) {
    const rect = canvas.getBoundingClientRect();

    textEditor.value = content;
    textEditor.hidden = false;
    textEditor.style.display = 'block';

    textEditor.style.left = `${rect.left + window.scrollX + position.x}px`;
    textEditor.style.top = `${rect.top + window.scrollY + position.y}px`;

    textEditor.style.width = `${style.width}px`;
    textEditor.style.height = `${style.height}px`;
    textEditor.style.fontSize = `${style.fontSize}px`;
    textEditor.style.lineHeight = `${style.fontSize * 1.2}px`;

    textEditor.oninput = () => onChange(textEditor.value);
    textEditor.onblur = () => onFinish();

    requestAnimationFrame(() => textEditor.focus());
  },

  close() {
    textEditor.oninput = null;
    textEditor.onblur = null;
    textEditor.hidden = true;
    textEditor.style.display = 'none';
  },
};

const whiteboard = new WbCanvas(canvas);
let player: Player | undefined;
let recorder: Recorder | undefined;
let file: FileSystemFileHandle | undefined;
let micStream: MediaStream | undefined;

const penTool = new WbPenTool(whiteboard, recorder);
const textTool = new WbTextTool(whiteboard, recorder, editor);

const tools = {
  pen: penTool,
  text: textTool,
};
let activeTool: WbTool = penTool;

toolSelector.addEventListener('change', () => {
  activeTool.cancel?.();

  activeTool = tools[toolSelector.value as keyof typeof tools];
});
recordButton.addEventListener('click', async () => {
  if (recorder) return;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
  } catch (err) {
    alert('Microphone access is required to record.');
    return;
  }
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

  const r = new Recorder(sink, micStream);
  await r.start();
  recorder = r;
  penTool.setRecorder(r);
  textTool.setRecorder(r);
  console.log('Recording started');
});
stopButton.addEventListener('click', async () => {
  if (!recorder || !file) return;
  activeTool.cancel?.();
  const r = recorder;
  recorder = undefined;
  penTool.setRecorder(undefined);
  textTool.setRecorder(undefined);
  await r.stop();

  const recordedFile = await file.getFile();
  const url = URL.createObjectURL(recordedFile);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'recording.wbdm';
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  activeTool?.pointerDown({ x: e.offsetX, y: e.offsetY });
});

canvas.addEventListener('pointermove', (e) => {
  activeTool?.pointerMove({ x: e.offsetX, y: e.offsetY });
});

canvas.addEventListener('pointerup', (e) => {
  activeTool?.pointerUp({ x: e.offsetX, y: e.offsetY });
});

canvas.addEventListener('pointercancel', () => {
  activeTool?.cancel?.();
});
clearButton.addEventListener('click', () => whiteboard.clear());
micButton.addEventListener('click', () => setTalking(!talking));
