import { BaseBrush } from './BaseBrush';
import { SimpleBrush } from './SimpleBrush';
import { PressureBrush } from './PressureBrush';
import { BrushOptions, BrushType } from './types';

/**
 * 画笔工厂类
 * 用于创建不同类型的画笔
 */
export class BrushFactory {
  /**
   * 创建画笔
   * @param type 画笔类型
   * @param options 画笔选项
   * @returns 画笔实例
   */
  public static createBrush(type: BrushType, options: BrushOptions): BaseBrush {
    switch (type) {
      case BrushType.SIMPLE:
        return new SimpleBrush(options);
      case BrushType.PRESSURE:
        return new PressureBrush(options);
      default:
        // 默认返回简单画笔
        return new SimpleBrush(options);
    }
  }
}