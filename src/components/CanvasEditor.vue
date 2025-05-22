<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';

// 导入防抖函数
function debounce(fn: Function, delay: number) {
  let timer: number | null = null;
  return function(...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}

const props = defineProps({
  width: {
    type: Number,
    default: 512
  },
  height: {
    type: Number,
    default: 512
  },
  lineWidth: {
    type: Number,
    default: 5
  },
  lineColor: {
    type: String,
    default: '#000000'
  },
  // 添加工具类型属性
  toolType: {
    type: String,
    default: 'brush' // 'brush' 或 'eraser'
  }
});

const emit = defineEmits(['update:line-width', 'update:line-color', 'update:tool-type', 'auto-generate']);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);
const isDrawing = ref(false);
const lastX = ref(0);
const lastY = ref(0);

// 添加历史记录相关状态
const history = ref<string[]>([]);
const currentHistoryIndex = ref(-1);

// 使用防抖函数包装自动生成事件
const debouncedAutoGenerate = debounce(() => {
  emit('auto-generate');
}, 1000); // 1000毫秒的防抖延迟

// 初始化画布
onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  ctx.value = canvas.getContext('2d');
  if (!ctx.value) return;
  
  // 设置画布背景为白色
  ctx.value.fillStyle = '#ffffff';
  ctx.value.fillRect(0, 0, props.width, props.height);
  
  // 设置线条样式
  ctx.value.lineWidth = props.lineWidth;
  ctx.value.strokeStyle = props.lineColor;
  ctx.value.lineCap = 'round';
  ctx.value.lineJoin = 'round';
  
  // 监听文档级别的粘贴事件
  window.addEventListener('paste', handlePaste);
  
  // 添加文档点击事件监听，用于关闭菜单
  document.addEventListener('click', handleDocumentClick);
  
  // 添加键盘事件监听，用于撤销和重做
  window.addEventListener('keydown', handleKeyDown);
  
  // 保存初始状态到历史记录
  saveToHistory();
});

// 组件卸载时移除事件监听器
onBeforeUnmount(() => {
  window.removeEventListener('paste', handlePaste);
  document.removeEventListener('click', handleDocumentClick);
  window.removeEventListener('keydown', handleKeyDown);
});

// 监听线宽变化
watch(() => props.lineWidth, (newWidth) => {
  if (ctx.value) {
    ctx.value.lineWidth = newWidth;
  }
});

// 监听颜色变化
watch(() => props.lineColor, (newColor) => {
  if (ctx.value) {
    ctx.value.strokeStyle = newColor;
  }
});

// 监听工具类型变化
watch(() => props.toolType, (newToolType) => {
  if (ctx.value) {
    // 如果是橡皮擦，设置为擦除模式
    if (newToolType === 'eraser') {
      ctx.value.globalCompositeOperation = 'destination-out';
    } else {
      // 恢复正常绘制模式
      ctx.value.globalCompositeOperation = 'source-over';
      ctx.value.strokeStyle = props.lineColor;
    }
  }
});

// 开始绘制
function startDrawing(e: MouseEvent) {
  // 检查是否为右键点击（鼠标右键的 button 值为 2）
  if (e.button === 2) {
    return; // 如果是右键点击，不执行任何操作
  }
  
  isDrawing.value = true;
  [lastX.value, lastY.value] = getCoordinates(e);
}

// 绘制中
function draw(e: MouseEvent) {
  if (!isDrawing.value || !ctx.value) return;
  
  const [x, y] = getCoordinates(e);
  
  ctx.value.beginPath();
  ctx.value.moveTo(lastX.value, lastY.value);
  ctx.value.lineTo(x, y);
  ctx.value.stroke();
  
  [lastX.value, lastY.value] = [x, y];
}

// 结束绘制
function stopDrawing() {
  if (isDrawing.value) {
    isDrawing.value = false;
    // 保存当前状态到历史记录
    saveToHistory();
    // 只有在结束绘制时才触发防抖的自动生成
    debouncedAutoGenerate();
  }
}

// 获取鼠标坐标
function getCoordinates(e: MouseEvent): [number, number] {
  const canvas = canvasRef.value;
  if (!canvas) return [0, 0];
  
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  return [
    (e.clientX - rect.left) * scaleX,
    (e.clientY - rect.top) * scaleY
  ];
}

// 清空画布
function clearCanvas() {
  if (!ctx.value || !canvasRef.value) return;
  
  ctx.value.fillStyle = '#ffffff';
  ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  
  // 清空后保存到历史记录
  saveToHistory();
}

// 获取画布数据
function getImageData(): string | null {
  if (!canvasRef.value) return null;
  
  // 去除 base64 前缀
  const dataUrl = canvasRef.value.toDataURL('image/png');
  return dataUrl.replace(/^data:image\/png;base64,/, '');
}

// 保存当前状态到历史记录
function saveToHistory() {
  if (!canvasRef.value) return;
  
  // 获取当前画布状态
  const dataUrl = canvasRef.value.toDataURL('image/png');
  
  // 如果当前索引不是最后一个，删除后面的历史记录
  if (currentHistoryIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, currentHistoryIndex.value + 1);
  }
  
  // 添加到历史记录
  history.value.push(dataUrl);
  currentHistoryIndex.value = history.value.length - 1;
}

// 撤销操作
function undo() {
  if (currentHistoryIndex.value > 0) {
    currentHistoryIndex.value--;
    restoreFromHistory();
  }
}

// 重做操作
function redo() {
  if (currentHistoryIndex.value < history.value.length - 1) {
    currentHistoryIndex.value++;
    restoreFromHistory();
  }
}

// 从历史记录恢复
function restoreFromHistory() {
  if (!canvasRef.value || !ctx.value) return;
  
  const img = new Image();
  img.onload = () => {
    ctx.value?.clearRect(0, 0, canvasRef.value!.width, canvasRef.value!.height);
    ctx.value?.drawImage(img, 0, 0);
  };
  img.src = history.value[currentHistoryIndex.value];
}

// 处理键盘事件
function handleKeyDown(e: KeyboardEvent) {
  // 检查是否按下 Ctrl 键
  if (e.ctrlKey) {
    if (e.key === 'z') {
      // Ctrl+Z 撤销
      e.preventDefault();
      undo();
    } else if (e.key === 'y') {
      // Ctrl+Y 重做
      e.preventDefault();
      redo();
    }
  }
}

// 处理粘贴事件
function handlePaste(e: ClipboardEvent) {
  console.log('粘贴事件触发');
  
  // 检查是否有图片数据
  if (!e.clipboardData) {
    console.log('没有剪贴板数据');
    return;
  }
  
  // 检查是否有图片
  const items = e.clipboardData.items;
  let imageItem = null;
  
  for (let i = 0; i < items.length; i++) {
    console.log(`剪贴板项目 ${i}: ${items[i].type}`);
    if (items[i].type.indexOf('image') !== -1) {
      imageItem = items[i];
      break;
    }
  }
  
  if (!imageItem) {
    console.log('剪贴板中没有图片');
    return;
  }
  
  console.log('找到图片，准备处理');
  
  // 获取图片并绘制到画布
  const blob = imageItem.getAsFile();
  if (!blob) {
    console.log('无法获取文件 blob');
    return;
  }
  
  const img = new Image();
  const reader = new FileReader();
  
  reader.onload = (event) => {
    if (!event.target || !event.target.result) {
      console.log('读取文件失败');
      return;
    }
    
    img.onload = () => {
      // 确保画布和上下文存在
      if (!canvasRef.value || !ctx.value) {
        console.log('画布或上下文不存在');
        return;
      }
      
      // 清空画布
      clearCanvas();
      
      // 计算图片缩放比例，保持宽高比
      const canvas = canvasRef.value;
      const ctx = ctx.value;
      
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      );
      
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      
      // 绘制图片
      ctx.drawImage(
        img,
        0, 0, img.width, img.height,
        x, y, img.width * scale, img.height * scale
      );
      
      console.log('图片已粘贴到画布');
      
      // 粘贴图片后触发防抖的自动生成
      debouncedAutoGenerate();
    };
    
    img.src = event.target.result as string;
  };
  
  reader.readAsDataURL(blob);
  
  // 阻止默认行为
  e.preventDefault();
}

// 暴露方法给父组件
defineExpose({
  clearCanvas,
  getImageData,
  undo,
  redo
});

// 右键菜单相关状态
const showContextMenu = ref(false);
const menuX = ref(0);
const menuY = ref(0);

// 添加右键菜单处理函数
function handleContextMenu(e: MouseEvent) {
  // 阻止默认右键菜单
  e.preventDefault();
  
  // 确保不会触发绘图
  isDrawing.value = false;
  
  // 显示自定义右键菜单
  showContextMenu.value = true;
  
  // 设置菜单位置
  menuX.value = e.clientX;
  menuY.value = e.clientY;
}

// 关闭右键菜单
function closeContextMenu() {
  showContextMenu.value = false;
}

// 右键菜单 - 清除画布
function clearCanvasFromMenu() {
  clearCanvas();
  closeContextMenu();
}

// 右键菜单 - 粘贴图片
function pasteImageFromMenu() {
  console.log('从右键菜单粘贴图片');
  
  // 尝试使用 navigator.clipboard API
  if (navigator.clipboard && navigator.clipboard.read) {
    navigator.clipboard.read()
      .then(clipboardItems => {
        console.log('成功读取剪贴板数据');
        let foundImage = false;
        
        for (const clipboardItem of clipboardItems) {
          console.log('剪贴板项目类型:', clipboardItem.types);
          
          for (const type of clipboardItem.types) {
            if (type.startsWith('image/')) {
              foundImage = true;
              console.log('找到图片类型:', type);
              
              clipboardItem.getType(type)
                .then(blob => {
                  console.log('获取到图片 blob');
                  processImageBlob(blob);
                })
                .catch(err => {
                  console.error('获取图片数据失败:', err);
                });
              
              break;
            }
          }
          
          if (foundImage) break;
        }
        
        if (!foundImage) {
          console.log('剪贴板中没有图片');
          alert('剪贴板中没有图片');
        }
      })
      .catch(err => {
        console.error('无法访问剪贴板:', err);
        
        // 如果 Clipboard API 失败，尝试使用模拟粘贴事件
        simulatePaste();
      });
  } else {
    console.log('浏览器不支持 Clipboard API，尝试模拟粘贴');
    simulatePaste();
  }
  
  closeContextMenu();
}

// 处理图片 blob
function processImageBlob(blob: Blob) {
  const reader = new FileReader();
  
  reader.onload = (event) => {
    if (!event.target || !event.target.result) {
      console.log('读取文件失败');
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      // 确保画布和上下文存在
      if (!canvasRef.value || !ctx.value) {
        console.log('画布或上下文不存在');
        return;
      }
      
      // 清空画布
      clearCanvas();
      
      // 计算图片缩放比例，保持宽高比
      const canvas = canvasRef.value;
      const context = ctx.value; // 修改这里，使用 context 而不是 ctx2
      
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      );
      
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      
      // 绘制图片
      context.drawImage(
        img,
        0, 0, img.width, img.height,
        x, y, img.width * scale, img.height * scale
      );
      
      console.log('图片已从右键菜单粘贴到画布');
      
      // 粘贴图片后触发防抖的自动生成
      debouncedAutoGenerate();
    };
    
    img.src = event.target.result as string;
  };
  
  reader.readAsDataURL(blob);
}

// 模拟粘贴事件
function simulatePaste() {
  // 创建一个合成的粘贴事件
  document.execCommand('paste');
  
  // 如果上面的方法不起作用，提示用户使用键盘快捷键
  alert('请使用键盘快捷键 Ctrl+V 粘贴图片');
}

// 点击画布外部时关闭菜单
function handleDocumentClick(e: MouseEvent) {
  if (showContextMenu.value) {
    const target = e.target as HTMLElement;
    const menu = document.getElementById('canvas-context-menu');
    
    if (menu && !menu.contains(target)) {
      closeContextMenu();
    }
  }
}

// 监听文档点击事件，用于关闭菜单
// 这部分代码已经移到 onMounted 中，这里可以删除
// onMounted(() => {
//   // 添加文档点击事件监听
//   document.addEventListener('click', handleDocumentClick);
// });

// onBeforeUnmount(() => {
//   // 移除文档点击事件监听
//   document.removeEventListener('click', handleDocumentClick);
// });
</script>

<template>
  <div class="canvas-editor">
    <!-- 添加工具栏 -->
    <div class="toolbar mb-2 flex items-center justify-center space-x-2">
      <button 
        @click="undo" 
        class="tool-button" 
        title="撤销 (Ctrl+Z)"
        :disabled="currentHistoryIndex <= 0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a4 4 0 0 1 0 8H9m-6-8l4-4-4-4" />
        </svg>
      </button>
      <button 
        @click="redo" 
        class="tool-button" 
        title="重做 (Ctrl+Y)"
        :disabled="currentHistoryIndex >= history.length - 1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10h8a4 4 0 0 1 0 8h-4m-8-8l-4-4 4-4" />
        </svg>
      </button>
      <button 
        @click="$emit('update:tool-type', 'brush')" 
        class="tool-button" 
        :class="{'active': toolType === 'brush'}"
        title="画笔"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      <button 
        @click="$emit('update:tool-type', 'eraser')" 
        class="tool-button" 
        :class="{'active': toolType === 'eraser'}"
        title="橡皮擦"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
    
    <canvas
      ref="canvasRef"
      :width="width"
      :height="height"
      class="border border-gray-300 dark:border-gray-600 rounded-lg"
      :class="{'cursor-crosshair': toolType === 'brush', 'cursor-cell': toolType === 'eraser'}"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
      @contextmenu="handleContextMenu"
    ></canvas>
    
    <!-- 自定义右键菜单 -->
    <div
      v-if="showContextMenu"
      id="canvas-context-menu"
      class="context-menu"
      :style="{
        position: 'fixed',
        top: `${menuY}px`,
        left: `${menuX}px`,
        zIndex: 1000
      }"
    >
      <div class="context-menu-item" @click="clearCanvasFromMenu">
        <span>清除画布</span>
      </div>
      <div class="context-menu-item" @click="pasteImageFromMenu">
        <span>粘贴图片</span>
      </div>
      <div class="context-menu-item" @click="undo">
        <span>撤销 (Ctrl+Z)</span>
      </div>
      <div class="context-menu-item" @click="redo">
        <span>重做 (Ctrl+Y)</span>
      </div>
    </div>
    
    <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      <p>提示: 在画布上绘制草图，停止绘制后将自动生成图像</p>
      <p>您也可以通过粘贴(Ctrl+V)将图片添加到画布，或使用右键菜单</p>
      <p>使用 Ctrl+Z 撤销，Ctrl+Y 重做</p>
    </div>
  </div>
</template>

<style scoped>
.canvas-editor {
  display: flex;
  flex-direction: column;
  align-items: center;
}

canvas {
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.context-menu {
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  padding: 5px 0;
  min-width: 150px;
}

.context-menu-item {
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
}

.context-menu-item:hover {
  background-color: #f0f0f0;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.tool-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-button:hover {
  background-color: #e0e0e0;
}

.tool-button.active {
  background-color: #3498db;
  color: white;
  border-color: #2980b9;
}

.tool-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (prefers-color-scheme: dark) {
  .context-menu {
    background-color: #2d3748;
    border-color: #4a5568;
  }
  
  .context-menu-item {
    color: #e2e8f0;
  }
  
  .context-menu-item:hover {
    background-color: #4a5568;
  }
  
  .tool-button {
    background-color: #4a5568;
    border-color: #2d3748;
    color: #e2e8f0;
  }
  
  .tool-button:hover {
    background-color: #2d3748;
  }
  
  .tool-button.active {
    background-color: #3498db;
    color: white;
    border-color: #2980b9;
  }
}
</style>