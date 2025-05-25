// 导出所有画笔相关类型和类
export * from './types';
export * from './BaseBrush';
export * from './SimpleBrush';
export * from './PressureBrush';
export * from './BrushFactory';

// 便于导入
import { BrushFactory } from './BrushFactory';
import { BrushType, BrushOptions } from './types';

/**
 * 创建画笔的快捷方法
 */
export const createBrush = (type: BrushType, options: BrushOptions) => {
  return BrushFactory.createBrush(type, options);
};