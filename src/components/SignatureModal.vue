<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, defineEmits, defineProps, watch } from 'vue';
import { createBrush, BrushType, Point } from '@/utils/brushes';
import { BaseBrush } from '@/utils/brushes';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  // 添加父组件画布尺寸属性
  parentWidth: {
    type: Number,
    default: 640
  },
  parentHeight: {
    type: Number,
    default: 360
  }
});

const emit = defineEmits(['close', 'confirm']);

// 状态管理
const isDrawing = ref(false);
const lastX = ref(0);
const lastY = ref(0);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);

// 当前使用的画笔
const currentBrush = ref<BaseBrush | null>(null);

// 简化绘图设置
const drawingSettings = reactive({
  // 屏幕高度的1/300
  lineWidth: 0,
  lineColor: '#000000',
  minLineWidth: 0,
  maxLineWidth: 20,
  pressureSensitivity: 0.9
});

// 监听可见性变化，当显示时重新初始化画布
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    // 延迟执行以确保DOM已更新
    setTimeout(() => {
      initCanvas();
    }, 0);
  }
});

// 初始化画布
function initCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  // 设置画布尺寸为容器大小
  const container = canvas.parentElement;
  if (container) {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }
  
  ctx.value = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx.value) return;
  
  // 设置画布背景为白色
  ctx.value.fillStyle = '#ffffff';
  ctx.value.fillRect(0, 0, canvas.width, canvas.height);
  
  // 初始化画笔 - 使用压感画笔
  currentBrush.value = createBrush(BrushType.PRESSURE, {
    lineWidth: drawingSettings.lineWidth,
    lineColor: drawingSettings.lineColor,
    minLineWidth: drawingSettings.minLineWidth,
    maxLineWidth: drawingSettings.maxLineWidth,
    pressureSensitivity: drawingSettings.pressureSensitivity
  });
}

// 在组件挂载时初始化
onMounted(() => {
  initCanvas();
  
  // 添加窗口大小变化监听，重新调整画布大小
  window.addEventListener('resize', handleResize);
});

// 组件卸载时移除事件监听
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

// 处理窗口大小变化
function handleResize() {
  if (props.visible && canvasRef.value) {
    const container = canvasRef.value.parentElement;
    if (container) {
      const oldCanvas = canvasRef.value;
      const oldCtx = ctx.value;
      
      if (oldCtx && oldCanvas) {
        // 保存当前画布内容
        const imageData = oldCtx.getImageData(0, 0, oldCanvas.width, oldCanvas.height);
        
        // 调整画布大小
        oldCanvas.width = container.clientWidth;
        oldCanvas.height = container.clientHeight;
        
        // 恢复画布内容（可能会有拉伸）
        oldCtx.putImageData(imageData, 0, 0);
        
        // 重新设置画笔
        if (currentBrush.value) {
          currentBrush.value.updateOptions({
            lineWidth: drawingSettings.lineWidth,
            lineColor: drawingSettings.lineColor,
            minLineWidth: drawingSettings.minLineWidth,
            maxLineWidth: drawingSettings.maxLineWidth,
            pressureSensitivity: drawingSettings.pressureSensitivity
          });
        }
      }
    }
  }
}

// 开始绘制
function startDrawing(e: MouseEvent | TouchEvent) {
  e.preventDefault();
  
  isDrawing.value = true;
  const [x, y] = getCoordinates(e);
  lastX.value = x;
  lastY.value = y;
  
  // 使用画笔开始绘制
  if (ctx.value && currentBrush.value) {
    currentBrush.value.startStroke(ctx.value, { x, y });
  }
}

// 绘制中
function draw(e: MouseEvent | TouchEvent) {
  e.preventDefault();
  
  if (!isDrawing.value || !ctx.value || !currentBrush.value) return;
  
  const [x, y] = getCoordinates(e);
  
  // 使用画笔绘制
  currentBrush.value.drawStroke({
    ctx: ctx.value,
    lastPoint: { x: lastX.value, y: lastY.value, pressure: 1 },
    currentPoint: { x, y }
  });
  
  // 更新上一个点的位置
  lastX.value = x;
  lastY.value = y;
}

// 结束绘制
function stopDrawing(e: MouseEvent | TouchEvent) {
  e.preventDefault();
  isDrawing.value = false;
  
  // 使用画笔结束绘制
  if (ctx.value && currentBrush.value) {
    currentBrush.value.endStroke(ctx.value);
  }
}

// 获取坐标
function getCoordinates(e: MouseEvent | TouchEvent): [number, number] {
  const canvas = canvasRef.value;
  if (!canvas) return [0, 0];
  
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  
  if ('touches' in e && e.touches.length > 0) {
    // 触摸事件
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if ('clientX' in e) {
    // 鼠标事件
    clientX = e.clientX;
    clientY = e.clientY;
  } else {
    return [0, 0]; // 无法获取坐标
  }
  
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  return [
    (clientX - rect.left) * scaleX,
    (clientY - rect.top) * scaleY
  ];
}

// 清空画布
function clearCanvas() {
  if (!ctx.value || !canvasRef.value) return;
  
  ctx.value.fillStyle = '#ffffff';
  ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);
}

// 获取签名数据
function getSignatureData(): string | null {
  if (!canvasRef.value) return null;
  
  // 检查画布是否为空
  const isEmpty = isCanvasEmpty();
  if (isEmpty) return null;
  
  // 去除 base64 前缀
  const dataUrl = canvasRef.value.toDataURL('image/png');
  return dataUrl.replace(/^data:image\/png;base64,/, '');
}

// 检查画布是否为空
function isCanvasEmpty(): boolean {
  if (!ctx.value || !canvasRef.value) return true;
  
  const pixelData = ctx.value.getImageData(
    0, 0, canvasRef.value.width, canvasRef.value.height
  ).data;
  
  // 检查是否所有像素都是白色
  for (let i = 0; i < pixelData.length; i += 4) {
    // 如果有任何非白色像素
    if (pixelData[i] !== 255 || pixelData[i+1] !== 255 || pixelData[i+2] !== 255 || pixelData[i+3] !== 255) {
      return false;
    }
  }
  
  return true;
}

// 确认签名
function handleConfirm() {
  const signatureData = getSignatureData();
  if (!signatureData) {
    alert('请先签名');
    return;
  }
  
  emit('confirm', signatureData);
}

// 关闭弹窗
function handleClose() {
  emit('close');
}
</script>

<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm">
    <div class="bg-gradient-to-br rounded-2xl shadow-xl p-5 flex flex-col w-[75vw] h-[80vh]">
      
      <div class="flex justify-between items-center">
        <div class="font-bold text-2xl text-gray-800 drop-shadow-md">请签上你的大名</div>
        <div class="w-9 h-9 rounded-full bg-white bg-opacity-20 border-2 border-white flex justify-center items-center cursor-pointer text-2xl text-gray-800 transition-all hover:bg-opacity-40 hover:scale-105"
             @click="handleClose">×</div>
      </div>
      
      <div class="flex-1 flex justify-center items-center w-full my-4">
        <div class="w-full h-full bg-white rounded-xl border-[5px] border-white shadow-md">
          <canvas
            ref="canvasRef"
            @mousedown="startDrawing"
            @mousemove="draw"
            @mouseup="stopDrawing"
            @mouseleave="stopDrawing"
            @touchstart="startDrawing"
            @touchmove="draw"
            @touchend="stopDrawing"
            @touchcancel="stopDrawing"
            @contextmenu.prevent
            class="w-full h-full touch-none rounded-lg"
          ></canvas>
        </div>
      </div>
      
      <div class="flex justify-center gap-5 mt-2">
        <button class="px-6 py-2.5 rounded-full text-base font-medium cursor-pointer transition-all bg-gray-100 text-gray-700 hover:-translate-y-1 hover:shadow-md active:translate-y-0.5 active:shadow-sm"
                @click="clearCanvas">重写</button>
        <button class="px-6 py-2.5 rounded-full text-base font-medium cursor-pointer transition-all bg-blue-500 text-white hover:-translate-y-1 hover:shadow-md active:translate-y-0.5 active:shadow-sm"
                @click="handleConfirm">确定</button>
        <button class="px-6 py-2.5 rounded-full text-base font-medium cursor-pointer transition-all bg-gray-200 text-gray-600 hover:-translate-y-1 hover:shadow-md active:translate-y-0.5 active:shadow-sm"
                @click="handleClose">返回</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 保留一些无法用Tailwind实现的样式 */
.bg-gradient-to-br {
  background-image: url('@/assets/images/创意中心骨架UI.png'), url('@/assets/images/独特渐变.jpg');
  background-size: cover;
  background-position: center;
  background-blend-mode: plus-darker, normal;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .text-2xl {
    font-size: 1.25rem;
    line-height: 1.75rem;
  }
  
  button {
    padding: 0.5rem 1.25rem;
    font-size: 0.875rem;
  }
}
</style>