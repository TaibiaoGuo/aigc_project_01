<script setup lang="ts">
defineProps<{
  width: number;
  height: number;
  resultImage: string;
  isLoading: boolean;
  errorMessage: string;
  processingStatus: string;
  promptId: string;
}>();
</script>

<template>
  <div class="result-section bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
    <h2 class="text-xl font-semibold mb-4 text-dark dark:text-light">AI 生成结果</h2>
    
    <div 
      class="result-container border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-900"
      :style="{width: `${width}px`, height: `${height}px`}"
    >
      <div v-if="isLoading" class="flex flex-col items-center justify-center">
        <div class="loading-spinner mb-3"></div>
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ processingStatus }}</p>
      </div>
      <div v-else-if="errorMessage" class="p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-red-500 font-medium">{{ errorMessage }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">请检查 ComfyUI 服务是否正常运行</p>
      </div>
      <img 
        v-else-if="resultImage" 
        :src="resultImage" 
        alt="AI 生成结果" 
        class="w-full h-full object-contain"
      />
      <div v-else class="text-center p-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-gray-600 dark:text-gray-400">在左侧绘制草图，然后点击"生成 AI 图像"</p>
      </div>
    </div>
    
    <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
      <p class="mb-2">提示：</p>
      <ul class="list-disc pl-5 space-y-1">
        <li>绘制简单的线条草图效果最佳</li>
        <li>确保 ComfyUI 服务在 http://127.0.0.1:6006 上运行</li>
        <li>生成过程可能需要几秒钟时间</li>
        <li v-if="promptId">当前任务ID: {{ promptId }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.result-container {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>