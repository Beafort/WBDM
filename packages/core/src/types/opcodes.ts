export const Type = { stroke: 0x1, cursor: 0x2, shape: 0x3 } as const;

export const Action = {
  stroke: { start: 0x0, move: 0x1, end: 0x2, delete: 0x3, insert: 0x4 },
  cursor: { move: 0x0, hide: 0x1 },
  shape: { add: 0x0, update: 0x1, delete: 0x2 },
} as const;

export const pack = (type: number, action: number) => {
  if (type > 0xf || action > 0xf) throw new RangeError('type/action out of range');
  return (type << 4) | action;
};

export const unpack = (value: number) => {};
export const typeOf = (op: number) => op >> 4;
export const actionOf = (op: number) => op & 0x0f;
