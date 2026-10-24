import type { WbCanvas } from '../canvas/canvas.js';
import type { Recorder } from '../recorder.js';
import { WbBaseTool, type WbPointerInput } from './tool.js';
import { type TextEvent } from '../types/events/text.js';
import { COLORS } from '../canvas/color.js';
import type { Point } from '../types/geometry.js';
export interface WbTextStyle {
  fontSize: number;
  color: string;
  width: number;
  height: number;
}
export interface WbTextEditor {
  open(
    position: Point,
    content: string,
    style: WbTextStyle,
    onChange: (content: string) => void,
    onFinish: () => void,
  ): void;
  close(): void;
}
export class WbTextTool extends WbBaseTool {
  private editingTextId: number | undefined;
  private editingPosition: Point | undefined;

  constructor(
    canvas: WbCanvas,
    recorder: Recorder | undefined,
    private editor: WbTextEditor,
  ) {
    super(canvas, recorder);
  }

  pointerDown(e: WbPointerInput): void {
    this.finishEditing();
    const style = { fontSize: 24, color: COLORS.black, width: 200, height: 100 };

    const event: TextEvent = {
      t: Date.now(),
      type: 'text',
      action: 'start',
      content: '',
      eId: this.canvas.newElementId(),
      position: e,
      ...style,
    };

    this.editingTextId = event.eId;
    this.editingPosition = event.position;
    this.emit(event);

    this.editor.open(
      event.position,
      '',
      style,
      (content) => this.updateText(content),
      () => this.finishEditing(),
    );
  }
  pointerMove(_e: WbPointerInput): void {}
  pointerUp(_e: WbPointerInput): void {}
  cancel(): void {
    this.finishEditing();
  }

  private updateText(content: string): void {
    if (this.editingTextId === undefined || this.editingPosition === undefined) {
      return;
    }

    const event: TextEvent = {
      t: Date.now(),
      type: 'text',
      action: 'modify',
      content,
      eId: this.editingTextId,
      position: this.editingPosition,
      color: COLORS.black,
      fontSize: 24,
      width: 200,
      height: 100,
    };
    this.emit(event);
  }

  private finishEditing(): void {
    if (this.editingTextId === undefined) return;

    this.editingTextId = undefined;
    this.editingPosition = undefined;
    this.editor.close();
  }
}
