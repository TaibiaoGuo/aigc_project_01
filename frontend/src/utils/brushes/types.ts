/**
 * 画笔类型枚举
 */
export enum BrushType {
  SIMPLE = 'simple',
  PRESSURE = 'pressure'
}

/**
 * 画笔选项接口
 */
export interface BrushOptions {
  lineWidth: number;
  lineColor: string;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  minLineWidth?: number;
  maxLineWidth?: number;
  pressureSensitivity?: number;
}

/**
 * 点坐标接口
 */
export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

/**
 * 画笔上下文接口
 */
export interface BrushContext {
  ctx: CanvasRenderingContext2D;
  lastPoint: Point;
  currentPoint: Point;
}