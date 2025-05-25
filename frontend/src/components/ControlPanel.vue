<script setup lang="ts">
import { reactive } from 'vue';

const props = defineProps<{
  lineWidth: number;
  lineColor: string;
  positivePrompt: string;
  negativePrompt: string;
  isLoading: boolean;
  toolType: string; // 添加工具类型属性
}>();

const emit = defineEmits<{
  (e: 'update:lineWidth', value: number): void;
  (e: 'update:lineColor', value: string): void;
  (e: 'update:positivePrompt', value: string): void;
  (e: 'update:negativePrompt', value: string): void;
  (e: 'update:toolType', value: string): void; // 添加工具类型更新事件
  (e: 'clearCanvas'): void;
  (e: 'processImage'): void;
  (e: 'undo'): void; // 添加撤销事件
  (e: 'redo'): void; // 添加重做事件
}>();

function updateLineWidth(value: number) {
  emit('update:lineWidth', value);
}

function updateLineColor(value: string) {
  emit('update:lineColor', value);
}

function updatePositivePrompt(value: string) {
  emit('update:positivePrompt', value);
}

function updateNegativePrompt(value: string) {
  emit('update:negativePrompt', value);
}

function updateToolType(value: string) {
  emit('update:toolType', value);
}

function clearCanvas() {
  emit('clearCanvas');
}

function processImage() {
  emit('processImage');
}

function undo() {
  emit('undo');
}

function redo() {
  emit('redo');
}
</script>

<template>
  <div class="controls">
    <div class="control-group mb-4">
      <label class="block text-sm font-medium mb-2 text-dark dark:text-light">画笔设置</label>
      
      <!-- 添加工具选择按钮 -->
      <div class="flex items-center gap-2 mb-3">
        <button 
          @click="updateToolType('brush')" 
          class="tool-btn" 
          :class="{'active': toolType === 'brush'}"
          title="画笔"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span>画笔</span>
        </button>
        <button 
          @click="updateToolType('eraser')" 
          class="tool-btn" 
          :class="{'active': toolType === 'eraser'}"
          title="橡皮擦"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>橡皮擦</span>
        </button>
        <button 
          @click="undo" 
          class="tool-btn" 
          title="撤销 (Ctrl+Z)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a4 4 0 0 1 0 8H9m-6-8l4-4-4-4" />
          </svg>
          <span>撤销</span>
        </button>
        <button 
          @click="redo" 
          class="tool-btn" 
          title="重做 (Ctrl+Y)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10h8a4 4 0 0 1 0 8h-4m-8-8l-4-4 4-4" />
          </svg>
          <span>重做</span>
        </button>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-gray-600 dark:text-gray-300">粗细</span>
            <span class="text-xs text-gray-600 dark:text-gray-300">{{ lineWidth }}px</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="30" 
            :value="lineWidth"
            @input="updateLineWidth(+($event.target as HTMLInputElement).value)"
            class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div class="color-picker">
          <span class="text-xs text-gray-600 dark:text-gray-300 block mb-1">颜色</span>
          <input 
            type="color" 
            :value="lineColor"
            @input="updateLineColor(($event.target as HTMLInputElement).value)"
            class="w-10 h-10 rounded cursor-pointer"
            :disabled="toolType === 'eraser'"
          />
        </div>
      </div>
    </div>
    
    <!-- 提示词设置 -->
    <div class="control-group mb-4">
      <label class="block text-sm font-medium mb-2 text-dark dark:text-light">提示词设置</label>
      <div class="mb-2">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs text-gray-600 dark:text-gray-300">正向提示词</span>
        </div>
        <input 
          type="text" 
          :value="positivePrompt"
          @input="updatePositivePrompt(($event.target as HTMLInputElement).value)"
          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          placeholder="输入正向提示词"
        />
      </div>
      <div>
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs text-gray-600 dark:text-gray-300">负向提示词</span>
        </div>
        <input 
          type="text" 
          :value="negativePrompt"
          @input="updateNegativePrompt(($event.target as HTMLInputElement).value)"
          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          placeholder="输入负向提示词"
        />
      </div>
    </div>
    
    <div class="flex gap-3">
      <button 
        @click="clearCanvas" 
        class="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
      >
        清空画布
      </button>
      <button 
        @click="processImage" 
        class="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="isLoading"
      >
        <span v-if="isLoading" class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          处理中...
        </span>
        <span v-else>生成 AI 图像</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
input[type="color"] {
  -webkit-appearance: none;
  border: none;
  padding: 0;
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}

input[type="range"] {
  -webkit-appearance: none;
  height: 8px;
  border-radius: 4px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
  border: none;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 4px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover {
  background-color: #e0e0e0;
}

.tool-btn.active {
  background-color: #3498db;
  color: white;
  border-color: #2980b9;
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (prefers-color-scheme: dark) {
  .tool-btn {
    background-color: #4a5568;
    border-color: #2d3748;
    color: #e2e8f0;
  }
  
  .tool-btn:hover {
    background-color: #2d3748;
  }
  
  .tool-btn.active {
    background-color: #3498db;
    color: white;
    border-color: #2980b9;
  }
}
</style>