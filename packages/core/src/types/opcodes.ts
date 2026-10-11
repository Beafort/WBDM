export const Type = { Stroke: 0x1, Cursor: 0x2, Shape: 0x3 } as const;

export const Action = {
  Stroke: { Start: 0x0, Move: 0x1, End: 0x2, Delete: 0x3, Insert: 0x4 },
  Cursor: { Move: 0x0, Hide: 0x1 },
  Shape: { Add: 0x0, Update: 0x1, Delete: 0x2 },
} as const;

export const pack = (category: number, action: number) => {
  if (category > 0xf || action > 0xf) throw new RangeError('type/action out of range');
  return (category << 4) | action;
};
export const categoryOf = (op: number) => op >> 4;
export const actionOf = (op: number) => op & 0x0f;
