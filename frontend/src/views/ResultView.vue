<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useCommunication, TaskMessage, StatusMessage, ResultMessage } from '@/services/channelService';
import { pollTaskStatus, getGeneratedImage } from '@/services/comfyuiService';

const route = useRoute();
const { lastMessage, send, unsubscribe } = useCommunication();

// 状态管理
const width = ref(512);
const height = ref(512);
const resultImage = ref('');
const isLoading = ref(true);
const errorMessage = ref('');
const processingStatus = ref('等待接收任务...');
const promptId = ref('');

// 从 URL 获取任务 ID
const taskIdFromUrl = route.query.taskId as string;

// 处理任务消息
async function handleTaskMessage(message: TaskMessage) {
  if (taskIdFromUrl && message.taskId !== taskIdFromUrl) {
    return; // 忽略不匹配的任务
  }
  
  try {
    promptId.value = message.taskId;
    isLoading.value = true;
    errorMessage.value = '';
    
    // 更新状态并通知发送方
    const updateStatus = (status: string, progress?: number, total?: number) => {
      processingStatus.value = status;
      send({
        type: 'status',
        taskId: message.taskId,
        status,
        progress,
        total
      });
    };
    
    updateStatus('正在处理图像...');
    
    // 轮询任务状态
    const resultFilename = await pollTaskStatus(message.taskId, (progress, total) => {
      updateStatus(`正在处理中 (${progress}/${total})...`, progress, total);
    });
    
    // 获取生成的图像
    updateStatus('正在获取生成结果...');
    const imageDataUrl = await getGeneratedImage(resultFilename);
    
    // 设置结果图像
    resultImage.value = imageDataUrl;
    isLoading.value = false;
    processingStatus.value = '';
    
    // 发送结果消息
    send({
      type: 'result',
      taskId: message.taskId,
      imageUrl: imageDataUrl
    });
  } catch (error) {
    console.error('处理图像时出错:', error);
    errorMessage.value = error instanceof Error ? error.message : '处理图像时出错';
    isLoading.value = false;
    
    // 发送错误状态
    send({
      type: 'status',
      taskId: message.taskId,
      status: `错误: ${errorMessage.value}`
    });
  }
}

// 监听消息
onMounted(() => {
  // 如果 URL 中有任务 ID，则发送就绪消息
  if (taskIdFromUrl) {
    promptId.value = taskIdFromUrl;
    processingStatus.value = `等待任务 ${taskIdFromUrl} 的数据...`;
    
    // 通知绘图页面此结果页面已准备好
    send({
      type: 'status',
      taskId: taskIdFromUrl,
      status: 'ready'
    });
  }
});

// 监听消息变化
watch(lastMessage, (message) => {
  if (!message) return;
  
  if (message.type === 'task') {
    handleTaskMessage(message as TaskMessage);
  }
});

onBeforeUnmount(() => {
  unsubscribe();
});
</script>

<template>
  <div class="result-view">
    <h1 class="text-2xl font-bold mb-6 text-center text-dark dark:text-light">AI 图像生成结果</h1>
    
    <div class="result-section bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mx-auto max-w-2xl">
      <h2 class="text-xl font-semibold mb-4 text-dark dark:text-light">
        任务 ID: {{ promptId || '等待中...' }}
      </h2>
      
      <div 
        class="result-container border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-900"
        :style="{width: `${width}px`, height: `${height}px`, margin: '0 auto'}"
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
          <p class="text-gray-600 dark:text-gray-400">等待接收任务数据...</p>
        </div>
      </div>
      
      <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p class="mb-2">提示：</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>此页面用于接收和处理来自绘图页面的任务</li>
          <li>确保 ComfyUI 服务已启动并正常运行</li>
          <li>生成过程可能需要几秒钟时间</li>
          <li v-if="promptId">当前任务ID: {{ promptId }}</li>
        </ul>
      </div>
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