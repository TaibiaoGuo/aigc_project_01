import { BaseBrush } from './BaseBrush';
import { BrushContext } from './types';

/**
 * 简单画笔
 * 适用于签名等简单绘制场景
 */
export class SimpleBrush extends BaseBrush {
  /**
   * 绘制一个笔画
   * @param brushContext 绘制上下文
   */
  public drawStroke(brushContext: BrushContext): void {
    const { ctx, lastPoint, currentPoint } = brushContext;
    
    // 设置线宽
    ctx.lineWidth = this.options.lineWidth;
    
    // 简单直接地连接点
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();
  }
}