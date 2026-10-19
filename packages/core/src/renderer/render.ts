import { getStroke, type StrokeOptions } from 'perfect-freehand';
import type { StrokeElement } from '../types/elements/stroke.js';
import type { TextElement } from '../types/elements/text.js';
export function renderText(el: TextElement, ctx: CanvasRenderingContext2D) {
  ctx.font = `${el.fontSize}px serif`;
  ctx.fillStyle = el.color;
  ctx.textBaseline = 'top';
  const lineHeight = el.fontSize * 1.2;
  el.content.split('\n').forEach((line, i) => {
    ctx.fillText(line, 0, i * lineHeight);
  });
}
export function renderStroke(st: StrokeElement, ctx: CanvasRenderingContext2D) {
  const opts: StrokeOptions = {
    size: st.width,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  };
  const points = getStroke(st.points, opts);
  if (!points.length) return;

  const path = new Path2D(getSvgPathFromStroke(points));
  ctx.fillStyle = st.color;
  ctx.fill(path);
}

const avg = (a: number, b: number) => (a + b) / 2;
function getSvgPathFromStroke(points: number[][]) {
  let d = `M${points[0][0]},${points[0][1]} Q`;

  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    d += `${p0[0]},${p0[1]} ${avg(p0[0], p1[0])},${avg(p0[1], p1[1])} `;
  }

  if (closed) d += 'Z';
  return d;
}
