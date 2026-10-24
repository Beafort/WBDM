import type { WbElement } from '../types/elements/base.js';
import type { Bounds } from '../types/geometry.js';

export function getElementBounds(element: WbElement): Bounds {
  switch (element.type) {
    case 'text':
      return {
        x: element.position.x,
        y: element.position.y,
        width: element.width,
        height: element.height,
      };

    case 'stroke': {
      const points = element.points;

      if (points.length === 0) {
        return {
          x: element.position.x,
          y: element.position.y,
          width: 0,
          height: 0,
        };
      }

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const point of points) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }

      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    }
  }
}
