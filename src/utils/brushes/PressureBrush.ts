import { BaseBrush } from './BaseBrush';
import { BrushContext, Point } from './types';

/**
 * 压感画笔
 * 根据绘制速度模拟压感效果，速度越快线条越细
 */
export class PressureBrush extends BaseBrush {
  /**
   * 绘制一个笔画
   * @param brushContext 绘制上下文
   */
  public drawStroke(brushContext: BrushContext): void {
    const { ctx, lastPoint, currentPoint } = brushContext;
    
    // 计算移动距离和速度
    const dx = currentPoint.x - lastPoint.x;
    const dy = currentPoint.y - lastPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 根据速度调整线宽，模拟压力感应
    // 速度越快，线条越细；速度越慢，线条越粗
    const speed = Math.min(distance * 0.5, 10); // 限制最大速度影响
    const minLineWidth = this.options.minLineWidth || 1;
    const maxLineWidth = this.options.maxLineWidth || 8;
    const pressureSensitivity = this.options.pressureSensitivity || 0.5;
    
    const pressure = Math.max(
      minLineWidth,
      maxLineWidth - (speed * pressureSensitivity)
    );
    
    // 平滑过渡线宽
    const lastPressure = lastPoint.pressure || 1;
    const currentPressure = lastPressure * 0.6 + pressure * 0.4;
    
    // 设置当前线宽
    ctx.lineWidth = currentPressure;
    
    // 使用线段连接点
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();
    
    // 更新当前点的压力值
    currentPoint.pressure = currentPressure;
  }
}