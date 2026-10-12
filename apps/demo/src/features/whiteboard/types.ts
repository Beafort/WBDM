type Point = { x: number; y: number };
export type Stroke = {
  id: number;
  color: number;
  width: number;
  points: Point[];
  visible: boolean;
};
