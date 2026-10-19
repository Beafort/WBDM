export enum COLORS {
  black = 'black',
  white = 'white',
  blue = 'blue',
  red = 'red',
  green = 'green',
}

const COLOR_ORDER = [COLORS.black, COLORS.white, COLORS.blue, COLORS.red, COLORS.green] as const;

export function encodeColor(c: COLORS): number {
  return COLOR_ORDER.indexOf(c);
}

export function decodeColor(n: number): COLORS {
  return COLOR_ORDER[n] ?? COLORS.black;
}
