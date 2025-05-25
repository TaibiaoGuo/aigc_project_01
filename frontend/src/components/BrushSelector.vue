<script setup lang="ts">
import { ref, defineProps, defineEmits, computed, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  currentColor: {
    type: String,
    default: '#000000'
  },
  currentSize: {
    type: Number,
    default: 5
  },
  currentBrushType: {
    type: String,
    default: 'pressure'
  },
  position: {
    type: Object,
    default: () => ({ top: 0, left: 0 })
  }
});

const emit = defineEmits(['update:color', 'update:size', 'update:brushType', 'close']);

// 颜色选择
const colors = [
  '#000000', '#FFFFFF', '#FF0000', '#FF9500', 
  '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', 
  '#5856D6', '#FF2D55', '#8E8E93', '#FF6B6B'
];

// 画笔大小范围
const minSize = 1;
const maxSize = 20;

// 画笔类型选项
const brushTypes = [
  { id: 'pressure', name: '压感笔', icon: '🖌️' },
  { id: 'simple', name: '普通笔', icon: '✏️' }
];

// 当前选中的值
const selectedColor = ref(props.currentColor);
const selectedSize = ref(props.currentSize);
const selectedBrushType = ref(props.currentBrushType);

// 面板位置计算
const panelRef = ref(null);

// 计算面板样式
const panelStyle = computed(() => {
  return {
    position: 'fixed',
    top: `${props.position.top}px`,
    left: `${props.position.left}px`,
    zIndex: 100
  };
});

// 监听属性变化
watch(() => props.currentColor, (newVal) => {
  selectedColor.value = newVal;
});

watch(() => props.currentSize, (newVal) => {
  selectedSize.value = newVal;
});

watch(() => props.currentBrushType, (newVal) => {
  selectedBrushType.value = newVal;
});

// 监听可见性变化，计算位置
watch(() => props.visible, async (isVisible) => {
  if (isVisible) {
    await nextTick();
    // 不再需要调用updatePanelPosition，因为我们使用computed属性
  }
});

// 不再需要这个函数，因为我们使用computed属性
// function updatePanelPosition() {
//   if (!props.anchorElement || !props.anchorElement.value) return;
//   
//   const anchor = props.anchorElement.value;
//   const rect = anchor.getBoundingClientRect();
//   
//   panelStyle.value = {
//     position: 'fixed',
//     top: `${rect.top}px`,
//     left: `${rect.right + 20}px`,
//     zIndex: 100
//   };
// }

// 选择颜色
function selectColor(color) {
  selectedColor.value = color;
  emit('update:color', color);
}

// 更新画笔大小
function updateSize(event) {
  const size = parseInt(event.target.value);
  selectedSize.value = size;
  emit('update:size', size);
}

// 选择画笔类型
function selectBrushType(type) {
  selectedBrushType.value = type;
  emit('update:brushType', type);
}

// 关闭面板
function closePanel() {
  emit('close');
}

// 计算当前画笔预览样式
const brushPreviewStyle = computed(() => {
  return {
    width: `${selectedSize.value * 2}px`,
    height: `${selectedSize.value * 2}px`,
    backgroundColor: selectedColor.value,
    border: selectedColor.value === '#FFFFFF' ? '1px solid #E0E0E0' : 'none'
  };
});

// 组件挂载时添加点击外部关闭功能
onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

// 组件卸载时移除事件监听
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

// 处理点击外部关闭
function handleClickOutside(event) {
  if (props.visible && panelRef.value && !panelRef.value.contains(event.target)) {
    // 检查是否点击了锚点元素
    if (props.anchorElement && props.anchorElement.value && props.anchorElement.value.contains(event.target)) {
      return;
    }
    closePanel();
  }
}
// 删除第二次声明的panelStyle
// const panelStyle = computed(() => {
//   return {
//     position: 'fixed',
//     top: `${props.position.top}px`,
//     left: `${props.position.left}px`,
//     zIndex: 100
//   };
// });
</script>

<template>
  <div v-if="visible" 
       ref="panelRef"
       class="brush-selector-panel"
       :style="panelStyle">
    <!-- 主面板 -->
    <div class="bg-white bg-opacity-90 backdrop-blur-md rounded-2xl shadow-lg p-4 w-[280px]">
      <!-- 标题和关闭按钮 -->
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-800">画笔设置</h3>
        <button @click="closePanel" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <span class="text-xl">×</span>
        </button>
      </div>
      
      <!-- 画笔类型选择 -->
      <div class="mb-4">
        <p class="text-sm text-gray-600 mb-2">画笔类型</p>
        <div class="flex space-x-2">
          <button 
            v-for="brush in brushTypes" 
            :key="brush.id"
            @click="selectBrushType(brush.id)"
            class="px-3 py-2 rounded-lg flex items-center space-x-1"
            :class="selectedBrushType === brush.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700'">
            <span>{{ brush.icon }}</span>
            <span>{{ brush.name }}</span>
          </button>
        </div>
      </div>
      
      <!-- 颜色选择 -->
      <div class="mb-4">
        <p class="text-sm text-gray-600 mb-2">颜色选择</p>
        <div class="grid grid-cols-6 gap-2">
          <button 
            v-for="color in colors" 
            :key="color"
            @click="selectColor(color)"
            class="w-10 h-10 rounded-full flex items-center justify-center"
            :style="{ backgroundColor: color }"
            :class="[
              selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : '',
              color === '#FFFFFF' ? 'border border-gray-200' : ''
            ]">
          </button>
        </div>
      </div>
      
      <!-- 大小选择 - 滑动条 -->
      <div class="mb-4">
        <div class="flex justify-between items-center mb-2">
          <p class="text-sm text-gray-600">画笔大小</p>
          <span class="text-sm font-medium text-gray-700">{{ selectedSize }}px</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-xs">细</span>
          <input 
            type="range" 
            :min="minSize" 
            :max="maxSize" 
            :value="selectedSize" 
            @input="updateSize"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
          />
          <span class="text-xs">粗</span>
        </div>
        <!-- 大小预览 -->
        <div class="flex justify-center mt-3">
          <div class="w-full h-12 bg-gray-50 rounded-lg flex items-center justify-center">
            <div class="rounded-full" :style="brushPreviewStyle"></div>
          </div>
        </div>
      </div>
      
      <!-- 当前画笔预览 -->
      <div class="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
        <div class="flex items-center space-x-3">
          <div class="text-sm text-gray-600">当前画笔:</div>
          <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <div class="rounded-full" :style="brushPreviewStyle"></div>
          </div>
          <div class="text-sm text-gray-600">
            {{ brushTypes.find(b => b.id === selectedBrushType)?.name || '压感笔' }}
            <span class="block text-xs">{{ selectedSize }}px</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.brush-selector-panel {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 自定义滑动条样式 */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  border-radius: 5px;
  background: #e2e8f0;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

input[type="range"]::-ms-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
</style>