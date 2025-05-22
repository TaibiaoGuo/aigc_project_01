import { BrushOptions, BrushContext, Point } from './types';

/**
 * 画笔基类
 * 定义所有画笔的通用接口和基本功能
 */
export abstract class BaseBrush {
  protected options: BrushOptions;

  constructor(options: BrushOptions) {
    this.options = {
      lineWidth: options.lineWidth || 3,
      lineColor: options.lineColor || '#000000',
      lineCap: options.lineCap || 'round',
      lineJoin: options.lineJoin || 'round',
      minLineWidth: options.minLineWidth,
      maxLineWidth: options.maxLineWidth,
      pressureSensitivity: options.pressureSensitivity
    };
  }

  /**
   * 开始绘制时的处理
   * @param ctx 画布上下文
   * @param point 起始点
   */
  public startStroke(ctx: CanvasRenderingContext2D, point: Point): void {
    // 设置基本样式
    ctx.strokeStyle = this.options.lineColor;
    ctx.lineCap = this.options.lineCap || 'round';
    ctx.lineJoin = this.options.lineJoin || 'round';
    
    // 绘制起始点（确保点击时有响应）
    ctx.beginPath();
    ctx.arc(point.x, point.y, this.options.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制一个笔画
   * @param brushContext 绘制上下文
   */
  public abstract drawStroke(brushContext: BrushContext): void;

  /**
   * 结束绘制
   * @param ctx 画布上下文
   */
  public endStroke(ctx: CanvasRenderingContext2D): void {
    // 基类中不做特殊处理，子类可以覆盖
  }

  /**
   * 更新画笔选项
   * @param options 新的选项
   */
  public updateOptions(options: Partial<BrushOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 获取当前画笔选项
   */
  public getOptions(): BrushOptions {
    return { ...this.options };
  }
}