<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute } from 'vue-router';
import ResultDisplay from '@/components/ResultDisplay.vue';
import { uploadImage, submitPrompt, pollTaskStatus, getGeneratedImage } from '@/services/comfyuiService';
import { useCommunication, ChannelMessage } from '@/services/channelService';

const route = useRoute();
const { lastMessage, send, unsubscribe } = useCommunication();

const width = ref(512);
const height = ref(512);
const resultImage = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const processingStatus = ref('等待接收数据...');
const promptId = ref('');

// 从 URL 获取任务 ID
const taskIdFromUrl = route.query.taskId as string;
if (taskIdFromUrl) {
  promptId.value = taskIdFromUrl;
}

// 处理图像生成
async function handleImageGeneration(data: any) {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    processingStatus.value = '正在上传图像...';
    
    const imageName = await uploadImage(data.imageData);
    
    processingStatus.value = '正在提交工作流...';
    const taskId = await submitPrompt(
      imageName,
      data.positivePrompt,
      data.negativePrompt
    );
    promptId.value = taskId;
    
    processingStatus.value = '正在处理图像...';
    const resultFilename = await pollTaskStatus(taskId, (progress, total) => {
      processingStatus.value = `正在处理中 (${progress}/${total})...`;
      
      // 发送状态更新消息
      send({
        type: 'status',
        taskId,
        status: `正在处理中 (${progress}/${total})...`,
        progress,
        total
      });
    });
    
    processingStatus.value = '正在获取生成结果...';
    const imageDataUrl = await getGeneratedImage(resultFilename);
    
    // 保存结果
    resultImage.value = imageDataUrl;
    isLoading.value = false;
    processingStatus.value = '';
    
    // 发送结果消息
    send({
      type: 'result',
      taskId,
      imageUrl: imageDataUrl
    });
  } catch (error) {
    console.error('处理图像时出错:', error);
    errorMessage.value = error instanceof Error ? error.message : '处理图像时出错';
    isLoading.value = false;
    
    // 发送错误状态
    if (promptId.value) {
      send({
        type: 'status',
        taskId: promptId.value,
        status: `错误: ${errorMessage.value}`
      });
    }
  }
}

// 监听消息变化
watch(lastMessage, (message) => {
  if (!message) return;
  
  if (message.type === 'task') {
    // 如果收到任务消息，处理图像生成
    handleImageGeneration(message);
  }
});

// 在页面加载时发送就绪消息
onMounted(() => {
  // 发送就绪消息
  send({
    type: 'status',
    taskId: 'system',
    status: 'ready'
  });
  
  // 页面关闭前的处理
  window.addEventListener('beforeunload', () => {
    send({
      type: 'status',
      taskId: 'system',
      status: 'closed'
    });
  });
});

// 组件卸载时取消订阅
onBeforeUnmount(() => {
  unsubscribe();
});
</script>

<template>
  <div class="result-page-container p-6">
    <h1 class="text-2xl font-bold mb-6 text-center text-dark dark:text-light">AI 图像生成结果</h1>
    
    <ResultDisplay
      :width="width"
      :height="height"
      :result-image="resultImage"
      :is-loading="isLoading"
      :error-message="errorMessage"
      :processing-status="processingStatus"
      :prompt-id="promptId"
    />
  </div>
</template>

<style scoped>
.result-page-container {
  max-width: 800px;
  margin: 0 auto;
}
</style>